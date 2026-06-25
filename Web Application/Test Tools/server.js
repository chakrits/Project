const express = require('express');
const path = require('path');
const mockServer = require('./backend/mock-server');
const morgan = require('morgan');
const { createLogger, pruneOldLogs, LOG_DIR } = require('./backend/utils/serverLogger');

const app = express();
const PORT = process.env.PORT || 5000;

const fs = require('fs');

const FRONTEND = path.join(__dirname, 'frontend');

// ─── Loggers ──────────────────────────────────────────────
const log      = createLogger('SERVER');
const proxyLog = createLogger('PROXY');

// ─── Process-level error handlers ─────────────────────────
process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled Promise Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  log.error(error.stack);
  process.exit(1);
});

// Backward-compatible redirects for renamed form pages
app.get('/forms/auto-login', (req, res) => res.redirect(301, '/forms/claim-form-a-patient'));
app.get('/forms/auto-login-fast-track', (req, res) => res.redirect(301, '/forms/fast-track'));

// Middleware สำหรับจัดการ Clean URLs (ซ่อน .html) แบบชัวร์ๆ
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('.') && req.path !== '/') {
        const htmlPath = path.join(FRONTEND, req.path + '.html');
        if (fs.existsSync(htmlPath)) {
            req.url += '.html';
        }
    }
    next();
});

// ─── HTTP Request Logging (morgan) ────────────────────────
// Placed after clean-URL middleware (URLs are rewritten first).
// Skips static asset requests to keep logs focused on API & page traffic.
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  skip: (req) =>
    /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|map)$/.test(req.path) ||
    req.path.startsWith('/assets/'),
  stream: { write: (msg) => log.http(msg.trim()) },
}));

// ให้ express เสิร์ฟไฟล์ static จากโฟลเดอร์ frontend และ assets
app.use(express.static(FRONTEND, { extensions: ['html'] }));
app.use('/assets', express.static(path.join(FRONTEND, 'assets')));
app.use(express.static('public'));

app.use(express.json({ limit: '50mb' }));

// API Proxy สำหรับทะลุ CORS
app.post('/api/proxy', async (req, res) => {
    try {
        const { url, method, headers, body } = req.body;

        const fetchOptions = {
            method: method || 'GET',
            headers: headers || {}
        };

        // ลบ headers ที่อาจทำให้ request พังเมื่อส่งผ่าน proxy
        delete fetchOptions.headers['host'];
        delete fetchOptions.headers['origin'];
        delete fetchOptions.headers['referer'];
        delete fetchOptions.headers['content-length']; // Node fetch will recalculate

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) {
            fetchOptions.body = body;
        }

        const fetchResp = await fetch(url, fetchOptions);

        // ส่ง status code กลับ
        res.status(fetchResp.status);

        // ส่ง headers กลับ
        fetchResp.headers.forEach((val, key) => {
            // ไม่ส่งกลับบาง header ที่ทำให้เบราว์เซอร์มีปัญหา
            if (['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) return;
            res.setHeader(key, val);
        });

        const arrayBuffer = await fetchResp.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        proxyLog.error(`Failed to proxy ${req.body?.method || 'GET'} ${req.body?.url || 'unknown'} — ${error.message}`);
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
            proxyLog.debug('Stack:', error.stack);
        }
        res.status(500).json({
            error: error.message,
            cause: error.cause?.message || error.cause?.code || null,
            proxy_failed: true
        });
    }
});

// ─── Mock Server Routes ───────────────────────────────────
// Mock API engine — catches all /mock-api/* requests
app.use('/mock-api', mockServer.mockRouter);
// Management API — CRUD for endpoints & logs
app.use('/api/mock-server', mockServer.managementApi);
// React frontend (production build)
app.use('/tools/mock-server', express.static(
  path.join(__dirname, 'backend/mock-server/frontend/dist')
));
app.get('/tools/mock-server/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/mock-server/frontend/dist/index.html'));
});

// Route หลัก -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────
// Express 5 automatically forwards async route errors here.
// Must be 4 arguments for Express to treat it as error middleware.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  log.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
    log.debug('Stack:', err.stack);
  }
  if (!res.headersSent) {
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

// ─── Start Server ─────────────────────────────────────────
// Guard allows Supertest to import `app` without starting the server
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    pruneOldLogs(); // remove log files older than LOG_RETENTION_DAYS (default 7)
    log.info('─'.repeat(50));
    log.info(`Server ready  →  http://0.0.0.0:${PORT}`);
    log.info(`NODE_ENV : ${process.env.NODE_ENV || 'development'} | DEBUG : ${process.env.DEBUG === 'true' ? 'ON' : 'OFF'}`);
    log.info(`Log files   : ${LOG_DIR}`);
    log.info('Routes:');
    log.info('  POST /api/proxy            — CORS proxy');
    log.info('  ANY  /mock-api/*           — Mock API engine');
    log.info('  *    /api/mock-server/*    — Mock management API');
    log.info('  GET  /tools/mock-server/*  — Mock server UI');
    log.info('  GET  /                     — Main frontend');
    log.info('─'.repeat(50));
  });
}

module.exports = app;
