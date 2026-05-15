/**
 * Transaction Logger
 * Logs every mock API transaction to db/logs.json with full request/response snapshots.
 * Caps log entries at MAX_LOG_ENTRIES to prevent file bloat.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const LOGS_PATH = path.join(__dirname, '..', 'db', 'logs.json');
const MAX_LOG_ENTRIES = 500;

/**
 * Read current logs from disk.
 * @returns {Array} Array of log entries
 */
function readLogs() {
  try {
    const data = fs.readFileSync(LOGS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Write logs to disk.
 * @param {Array} logs - Array of log entries
 */
function writeLogs(logs) {
  fs.writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2), 'utf-8');
}

/**
 * Log a mock API transaction.
 * 
 * @param {object} options
 * @param {object} options.req - Express request object
 * @param {number} options.status - Response status code
 * @param {*} options.responseBody - The response body sent back
 * @param {string} options.responseLabel - Label of the selected response
 * @param {object} options.matchedEndpoint - The matched endpoint { id, path }
 * @param {number} options.latencyMs - Time taken to process the request in ms
 * @returns {string} The generated traceId
 */
function logTransaction({ req, status, responseBody, responseLabel, matchedEndpoint, latencyMs }) {
  const traceId = uuidv4();

  const entry = {
    traceId,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      sourceIp: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || 'unknown',
      headers: sanitizeHeaders(req.headers),
      query: req.query || {},
      body: req.body || null
    },
    response: {
      status,
      body: responseBody,
      label: responseLabel,
      latencyMs: Math.round(latencyMs)
    },
    matchedEndpoint: matchedEndpoint
      ? { id: matchedEndpoint.id, path: matchedEndpoint.path, method: matchedEndpoint.method }
      : null
  };

  const logs = readLogs();
  
  // Prepend new entry (newest first)
  logs.unshift(entry);

  // Cap at MAX_LOG_ENTRIES
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.length = MAX_LOG_ENTRIES;
  }

  writeLogs(logs);

  return traceId;
}

/**
 * Clear all logs.
 */
function clearLogs() {
  writeLogs([]);
}

/**
 * Get all logs.
 * @returns {Array} Array of log entries (newest first)
 */
function getLogs() {
  return readLogs();
}

/**
 * Sanitize headers — remove sensitive or noisy headers for cleaner logs.
 * @param {object} headers 
 * @returns {object}
 */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  // Remove internal Express headers that add noise
  delete sanitized['connection'];
  delete sanitized['keep-alive'];
  return sanitized;
}

module.exports = { logTransaction, clearLogs, getLogs };
