/**
 * Server-level console + file logger.
 * Dual output: colored console + rotating daily plain-text log files.
 * No external packages — uses only Node.js built-ins (fs, path).
 * Mirrors the named-export pattern of backend/mock-server/engine/logger.js.
 *
 * Usage:
 *   const { createLogger } = require('./backend/utils/serverLogger');
 *   const log = createLogger('MY-MODULE');
 *   log.info('Server started');
 *   log.error('Something broke', err.message);
 *
 * Log files (LOG_DIR, default: <project-root>/logs/):
 *   combined-YYYY-MM-DD.log  — all levels that pass the console filter
 *   error-YYYY-MM-DD.log     — error + warn, always written regardless of NODE_ENV
 *
 * Verbosity — console output controlled by env vars:
 *   NODE_ENV=development (default) → error, warn, info, http
 *   NODE_ENV=development + DEBUG=true → all levels incl. debug
 *   NODE_ENV=production → error, warn only
 *   NODE_ENV=production + DEBUG=true → all levels
 *   NODE_ENV=test → console error+warn only; file writing DISABLED entirely
 *
 * Rotation: new file per UTC calendar day.
 * Retention: files older than LOG_RETENTION_DAYS (default 7) pruned on startup via pruneOldLogs().
 * All file I/O is wrapped in try/catch — a failed write never crashes the server.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Environment ─────────────────────────────────────────
const IS_TTY   = process.stdout.isTTY === true;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DEBUG_ON = process.env.DEBUG === 'true';
const IS_TEST  = NODE_ENV === 'test';
const IS_PROD  = NODE_ENV === 'production';

// ─── Log directory ────────────────────────────────────────
// Defaults to <project-root>/logs/. Override with LOG_DIR env var.
const LOG_DIR = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : path.join(__dirname, '..', '..', 'logs');

// Days of log files to retain before auto-pruning (configurable)
const MAX_LOG_AGE_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '7', 10);

// ─── ANSI colors (console only) ───────────────────────────
const C = IS_TTY ? {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  green:  '\x1b[32m',
  blue:   '\x1b[34m',
  bold:   '\x1b[1m',
} : {
  reset: '', red: '', yellow: '', cyan: '',
  gray: '', green: '', blue: '', bold: '',
};

// ─── Level config ─────────────────────────────────────────
const LEVEL_CONFIG = {
  error: { color: C.red,    prefix: 'ERROR', rank: 0 },
  warn:  { color: C.yellow, prefix: 'WARN ', rank: 1 },
  info:  { color: C.cyan,   prefix: 'INFO ', rank: 2 },
  http:  { color: C.blue,   prefix: 'HTTP ', rank: 3 },
  debug: { color: C.gray,   prefix: 'DEBUG', rank: 4 },
};

/**
 * Returns the max log level rank for console output.
 * DEBUG=true checked FIRST — always overrides NODE_ENV.
 */
function maxRank() {
  if (DEBUG_ON) return 4; // explicit override — show all levels
  if (IS_TEST)  return 1; // error + warn only in test
  if (IS_PROD)  return 1; // error + warn only in production
  return 3;               // development: error, warn, info, http
}

// ─── Timestamps ───────────────────────────────────────────
/** "2026-05-27 10:00:00.000" — used in each log line */
function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

/** "2026-05-27" — used for daily log file names */
function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

// ─── ANSI stripping ───────────────────────────────────────
/** Remove ANSI escape codes to produce clean plain text for files */
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// ─── Log directory helpers ────────────────────────────────
let _logDirReady = false;

/** Ensure LOG_DIR exists — called lazily before the first file write */
function ensureLogDir() {
  if (_logDirReady) return;
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    _logDirReady = true;
  } catch { /* silently ignore — appendToFile also catches */ }
}

// ─── File I/O ─────────────────────────────────────────────
/**
 * Append one plain-text line to a log file.
 * Skipped entirely in NODE_ENV=test. All errors are swallowed silently.
 */
function appendToFile(filename, line) {
  if (IS_TEST) return;
  try {
    ensureLogDir();
    fs.appendFileSync(path.join(LOG_DIR, filename), line + '\n', 'utf8');
  } catch { /* intentionally silent — logging must never crash the server */ }
}

/**
 * Route a log entry to the correct file(s).
 *   combined-DATE.log  ← receives the entry when rank passes console filter
 *   error-DATE.log     ← receives error + warn always (even in production silence)
 */
function writeToFile(level, rank, plainLine) {
  const date = todayDate();
  const isAlwaysLogged = level === 'error' || level === 'warn';

  if (isAlwaysLogged || rank <= maxRank()) {
    appendToFile(`combined-${date}.log`, plainLine);
  }
  if (isAlwaysLogged) {
    appendToFile(`error-${date}.log`, plainLine);
  }
}

// ─── Log rotation / pruning ───────────────────────────────
/**
 * Delete combined-*.log and error-*.log files older than MAX_LOG_AGE_DAYS.
 * Call once at server startup. All errors are swallowed silently.
 */
function pruneOldLogs() {
  if (IS_TEST) return;
  try {
    ensureLogDir();
    const cutoff = Date.now() - MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(LOG_DIR);
    for (const file of files) {
      if (!/^(combined|error)-\d{4}-\d{2}-\d{2}\.log$/.test(file)) continue;
      const filePath = path.join(LOG_DIR, file);
      try {
        const { mtimeMs } = fs.statSync(filePath);
        if (mtimeMs < cutoff) fs.unlinkSync(filePath);
      } catch { /* skip files we can't stat or delete */ }
    }
  } catch { /* ignore if LOG_DIR doesn't exist yet */ }
}

// ─── Formatters ───────────────────────────────────────────
/** Colored line for console output */
function formatConsole(level, tag, message) {
  const { color, prefix } = LEVEL_CONFIG[level];
  const ts = `${C.gray}${timestamp()}${C.reset}`;
  const lv = `${color}${C.bold}${prefix}${C.reset}`;
  const tg = tag ? `${C.cyan}[${tag}]${C.reset}` : '';
  return `${ts} ${lv} ${tg} ${message}`;
}

/** Plain line for file output — no ANSI codes */
function formatPlain(level, tag, message) {
  const { prefix } = LEVEL_CONFIG[level];
  const ts = timestamp();
  const tg = tag ? `[${tag}]` : '';
  return `${ts} ${prefix} ${tg} ${message}`;
}

// ─── Core log function ────────────────────────────────────
/**
 * 1. Format both console (ANSI) and plain (file) representations.
 * 2. Print to console if rank passes maxRank().
 * 3. Write to file — errors/warns always; others when rank passes.
 */
function log(level, tag, message, ...extras) {
  const { rank } = LEVEL_CONFIG[level];

  // Serialize extras for file (stack traces, objects, etc.)
  const extrasStr = extras.length
    ? ' ' + extras.map(e => (typeof e === 'string' ? e : String(e))).join(' ')
    : '';

  const consoleLine = formatConsole(level, tag, message);
  const plainLine   = formatPlain(level, tag, message) + extrasStr;

  // Console output
  if (rank <= maxRank()) {
    if (level === 'error') {
      console.error(consoleLine, ...extras);
    } else {
      console.log(consoleLine, ...extras);
    }
  }

  // File output
  writeToFile(level, rank, plainLine);
}

// ─── Public API ───────────────────────────────────────────
/**
 * Create a tagged logger instance for a specific module.
 *
 * @param {string} tag - Short module tag shown in [brackets], e.g. 'PROXY', 'STARTUP'
 * @returns {{ error, warn, info, http, debug }}
 *
 * @example
 * const log = createLogger('PROXY');
 * log.error('Fetch failed', err.message);  // → console (red) + combined + error log
 * log.info('Forwarding request');           // → console (cyan) + combined log
 */
function createLogger(tag) {
  return {
    error: (msg, ...extras) => log('error', tag, msg, ...extras),
    warn:  (msg, ...extras) => log('warn',  tag, msg, ...extras),
    info:  (msg, ...extras) => log('info',  tag, msg, ...extras),
    http:  (msg, ...extras) => log('http',  tag, msg, ...extras),
    debug: (msg, ...extras) => log('debug', tag, msg, ...extras),
  };
}

// Root logger (no tag) for quick one-off use
const rootLogger = createLogger('');

module.exports = { createLogger, pruneOldLogs, LOG_DIR, ...rootLogger };
