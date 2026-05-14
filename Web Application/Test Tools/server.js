const express = require('express');
const path = require('path');
const mockServer = require('./mock-server');

const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs');

// Middleware สำหรับจัดการ Clean URLs (ซ่อน .html) แบบชัวร์ๆ
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('.') && req.path !== '/') {
        const htmlPath = path.join(__dirname, req.path + '.html');
        if (fs.existsSync(htmlPath)) {
            req.url += '.html';
        }
    }
    next();
});

// ให้ express เสิร์ฟไฟล์ static จากโฟลเดอร์ root และ assets
app.use(express.static(__dirname, { extensions: ['html'] }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
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
  path.join(__dirname, 'mock-server/frontend/dist')
));
app.get('/tools/mock-server/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'mock-server/frontend/dist/index.html'));
});

// Route หลัก -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT} (Clean URLs Enabled)`);
});

