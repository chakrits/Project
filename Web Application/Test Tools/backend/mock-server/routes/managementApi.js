/**
 * Management API
 * RESTful API for the Mock Server dashboard to manage endpoints and logs.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getLogs, clearLogs } = require('../engine/logger');
const openApiParser = require('../engine/openApiParser');
const postmanParser = require('../engine/postmanParser');

const router = express.Router();
const ENDPOINTS_PATH = path.join(__dirname, '..', 'db', 'endpoints.json');

// Parse JSON bodies
router.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function readEndpoints() {
  try {
    const data = fs.readFileSync(ENDPOINTS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeEndpoints(endpoints) {
  fs.writeFileSync(ENDPOINTS_PATH, JSON.stringify(endpoints, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────
// Endpoint CRUD
// ─────────────────────────────────────────────

/**
 * GET /api/mock-server/endpoints
 * List all endpoints
 */
router.get('/endpoints', (req, res) => {
  const endpoints = readEndpoints();
  res.json(endpoints);
});

/**
 * GET /api/mock-server/endpoints/:id
 * Get a single endpoint by ID
 */
router.get('/endpoints/:id', (req, res) => {
  const endpoints = readEndpoints();
  const endpoint = endpoints.find(e => e.id === req.params.id);
  
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  res.json(endpoint);
});

/**
 * POST /api/mock-server/endpoints
 * Create a new endpoint
 */
router.post('/endpoints', (req, res) => {
  const endpoints = readEndpoints();
  const { method, path: endpointPath, description, responses } = req.body;

  // Validation
  if (!method || !endpointPath) {
    return res.status(400).json({ error: 'method and path are required' });
  }

  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'At least one response is required' });
  }

  const newEndpoint = {
    id: uuidv4().slice(0, 8), // Short ID for readability
    method: method.toUpperCase(),
    path: endpointPath,
    description: description || '',
    responses: responses.map(r => ({
      label:      r.label || 'Default',
      status:     r.status || 200,
      delay:      r.delay || 0,
      body:       r.body || {},
      isDefault:  r.isDefault || false,
      conditions: Array.isArray(r.conditions) ? r.conditions : [],
    }))
  };

  // Ensure at least one default response
  const hasDefault = newEndpoint.responses.some(r => r.isDefault);
  if (!hasDefault) {
    newEndpoint.responses[0].isDefault = true;
  }

  endpoints.push(newEndpoint);
  writeEndpoints(endpoints);

  res.status(201).json(newEndpoint);
});

/**
 * PUT /api/mock-server/endpoints/:id
 * Update an existing endpoint
 */
router.put('/endpoints/:id', (req, res) => {
  const endpoints = readEndpoints();
  const index = endpoints.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const { method, path: endpointPath, description, responses } = req.body;

  // Merge updates
  if (method) endpoints[index].method = method.toUpperCase();
  if (endpointPath) endpoints[index].path = endpointPath;
  if (description !== undefined) endpoints[index].description = description;
  
  if (Array.isArray(responses)) {
    endpoints[index].responses = responses.map(r => ({
      label:      r.label || 'Default',
      status:     r.status || 200,
      delay:      r.delay || 0,
      body:       r.body || {},
      isDefault:  r.isDefault || false,
      conditions: Array.isArray(r.conditions) ? r.conditions : [],
    }));

    // Ensure at least one default
    const hasDefault = endpoints[index].responses.some(r => r.isDefault);
    if (!hasDefault && endpoints[index].responses.length > 0) {
      endpoints[index].responses[0].isDefault = true;
    }
  }

  writeEndpoints(endpoints);
  res.json(endpoints[index]);
});

/**
 * DELETE /api/mock-server/endpoints/:id
 * Delete an endpoint
 */
router.delete('/endpoints/:id', (req, res) => {
  const endpoints = readEndpoints();
  const index = endpoints.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const deleted = endpoints.splice(index, 1)[0];
  writeEndpoints(endpoints);

  res.json({ message: 'Endpoint deleted', deleted });
});

// ─────────────────────────────────────────────
// Logs
// ─────────────────────────────────────────────

/**
 * GET /api/mock-server/logs
 * Get all transaction logs (newest first)
 */
router.get('/logs', (req, res) => {
  const logs = getLogs();
  res.json(logs);
});

/**
 * DELETE /api/mock-server/logs
 * Clear all transaction logs
 */
router.delete('/logs', (req, res) => {
  clearLogs();
  res.json({ message: 'All logs cleared' });
});

// ─────────────────────────────────────────────
// Import / Export
// ─────────────────────────────────────────────

/**
 * Detect the format of uploaded content.
 * @param {string} content - Raw file content
 * @param {string} hintFormat - User-specified format hint
 * @returns {string} 'openapi' | 'postman' | 'unknown'
 */
function detectFormat(content, hintFormat) {
  if (hintFormat === 'openapi') return 'openapi';
  if (hintFormat === 'postman') return 'postman';

  // Auto-detect
  if (openApiParser.canParse(content)) return 'openapi';
  if (postmanParser.canParse(content)) return 'postman';
  return 'unknown';
}

/**
 * POST /api/mock-server/import/preview
 * Parse a spec file and return a preview without saving.
 */
router.post('/import/preview', (req, res) => {
  try {
    const { content, format: hintFormat } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const format = detectFormat(content, hintFormat || 'auto');

    if (format === 'unknown') {
      return res.status(400).json({ 
        error: 'Unable to detect format. Please provide a valid OpenAPI/Swagger spec or Postman Collection.' 
      });
    }

    const parser = format === 'openapi' ? openApiParser : postmanParser;
    const { endpoints, meta } = parser.parse(content);

    res.json({
      format: meta.format,
      version: meta.version,
      title: meta.title,
      description: meta.description,
      endpointCount: endpoints.length,
      endpoints
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/mock-server/import
 * Parse a spec file and import endpoints.
 * Body: { content: string, format: 'auto'|'openapi'|'postman', strategy: 'replace'|'merge' }
 */
router.post('/import', (req, res) => {
  try {
    const { content, format: hintFormat, strategy } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const format = detectFormat(content, hintFormat || 'auto');

    if (format === 'unknown') {
      return res.status(400).json({ 
        error: 'Unable to detect format. Please provide a valid OpenAPI/Swagger spec or Postman Collection.' 
      });
    }

    const parser = format === 'openapi' ? openApiParser : postmanParser;
    const { endpoints: parsed, meta } = parser.parse(content);

    // Assign IDs to parsed endpoints
    const newEndpoints = parsed.map(ep => ({
      id: uuidv4().slice(0, 8),
      ...ep
    }));

    let imported = 0;
    let skipped = 0;

    if (strategy === 'replace') {
      // Replace all existing endpoints
      writeEndpoints(newEndpoints);
      imported = newEndpoints.length;
    } else {
      // Merge: add new, skip duplicates (by method+path)
      const existing = readEndpoints();
      const existingKeys = new Set(existing.map(e => `${e.method}::${e.path}`));

      for (const ep of newEndpoints) {
        const key = `${ep.method}::${ep.path}`;
        if (existingKeys.has(key)) {
          skipped++;
        } else {
          existing.push(ep);
          existingKeys.add(key);
          imported++;
        }
      }

      writeEndpoints(existing);
    }

    res.json({
      message: `Import complete`,
      format: meta.format,
      title: meta.title,
      imported,
      skipped,
      total: readEndpoints().length
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/mock-server/export
 * Download current endpoints as JSON.
 */
router.get('/export', (req, res) => {
  const endpoints = readEndpoints();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="mock-endpoints.json"');
  res.json(endpoints);
});

module.exports = router;
