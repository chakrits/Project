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
const COLLECTIONS_PATH = process.env.COLLECTIONS_PATH || path.join(__dirname, '..', 'db', 'collections.json');

// Parse JSON bodies
router.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function readEndpoints() {
  try {
    const data = fs.readFileSync(process.env.ENDPOINTS_PATH || ENDPOINTS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeEndpoints(endpoints) {
  fs.writeFileSync(process.env.ENDPOINTS_PATH || ENDPOINTS_PATH, JSON.stringify(endpoints, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────
// Migration: old format (conditions on responses) → new format (rules array)
// Applied on-read so existing data works without a one-time migration script.
// ─────────────────────────────────────────────

function migrateEndpoint(ep) {
  if (ep.rules !== undefined) return ep; // already new format
  const rules = [];
  const responses = (ep.responses || []).map(r => {
    if (r.conditions && r.conditions.length > 0) {
      rules.push({
        id: uuidv4().slice(0, 8),
        name: `Rule for ${r.label}`,
        active: rules.length === 0,
        responseLabel: r.label,
        conditions: r.conditions,
      });
    }
    // eslint-disable-next-line no-unused-vars
    const { conditions, isDefault, ...rest } = r;
    return rest;
  });
  const defaultResp = (ep.responses || []).find(r => r.isDefault) || (ep.responses || [])[0];
  return {
    ...ep,
    responses,
    rules,
    defaultResponseLabel: defaultResp?.label || responses[0]?.label || '',
  };
}

function readCollections() {
  try {
    const data = fs.readFileSync(COLLECTIONS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeCollections(collections) {
  fs.writeFileSync(COLLECTIONS_PATH, JSON.stringify(collections, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────
// Collection CRUD
// ─────────────────────────────────────────────

router.get('/collections', (req, res) => {
  res.json(readCollections());
});

router.get('/collections/:id', (req, res) => {
  const collection = readCollections().find(c => c.id === req.params.id);
  if (!collection) return res.status(404).json({ error: 'Collection not found' });
  res.json(collection);
});

router.post('/collections', (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const collections = readCollections();
  const newCollection = {
    id: uuidv4().slice(0, 8),
    name,
    description: description || '',
    color: color || '#6366f1',
    createdAt: new Date().toISOString(),
  };
  collections.push(newCollection);
  writeCollections(collections);
  res.status(201).json(newCollection);
});

router.put('/collections/:id', (req, res) => {
  const collections = readCollections();
  const index = collections.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Collection not found' });

  const { name, description, color } = req.body;
  if (name !== undefined) collections[index].name = name;
  if (description !== undefined) collections[index].description = description;
  if (color !== undefined) collections[index].color = color;

  writeCollections(collections);
  res.json(collections[index]);
});

router.delete('/collections/:id', (req, res) => {
  const collections = readCollections();
  const index = collections.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Collection not found' });

  collections.splice(index, 1);
  writeCollections(collections);

  // Null out collectionId on all associated endpoints
  const endpoints = readEndpoints();
  let affected = 0;
  for (const ep of endpoints) {
    if (ep.collectionId === req.params.id) {
      ep.collectionId = null;
      affected++;
    }
  }
  if (affected > 0) writeEndpoints(endpoints);

  res.json({ message: 'Collection deleted', affected });
});

// ─────────────────────────────────────────────
// Endpoint CRUD
// ─────────────────────────────────────────────

/**
 * GET /api/mock-server/endpoints
 * List all endpoints
 */
router.get('/endpoints', (req, res) => {
  let endpoints = readEndpoints().map(migrateEndpoint);
  if (req.query.collectionId !== undefined) {
    const filterVal = req.query.collectionId === 'null' ? null : req.query.collectionId;
    endpoints = endpoints.filter(ep => (ep.collectionId || null) === filterVal);
  }
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

  res.json(migrateEndpoint(endpoint));
});

/**
 * POST /api/mock-server/endpoints
 * Create a new endpoint
 */
router.post('/endpoints', (req, res) => {
  const endpoints = readEndpoints();
  const { method, path: endpointPath, description, responses, collectionId, rules, defaultResponseLabel } = req.body;

  // Validation
  if (!method || !endpointPath) {
    return res.status(400).json({ error: 'method and path are required' });
  }

  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'At least one response is required' });
  }

  if (collectionId != null) {
    const exists = readCollections().some(c => c.id === collectionId);
    if (!exists) return res.status(400).json({ error: 'Collection not found' });
  }

  const cleanResponses = responses.map(r => ({
    label:  r.label || 'Default',
    status: r.status || 200,
    delay:  r.delay || 0,
    body:   r.body || {},
  }));

  const responseLabels = new Set(cleanResponses.map(r => r.label));
  const cleanRules = Array.isArray(rules) ? rules.map(r => ({
    id:            r.id || uuidv4().slice(0, 8),
    name:          r.name || 'Unnamed Rule',
    active:        r.active === true,
    responseLabel: r.responseLabel || '',
    conditions:    Array.isArray(r.conditions) ? r.conditions : [],
  })).filter(r => responseLabels.has(r.responseLabel)) : [];

  // Ensure only one rule is active
  let foundActive = false;
  for (const r of cleanRules) {
    if (r.active) { if (foundActive) r.active = false; else foundActive = true; }
  }

  const resolvedDefault = defaultResponseLabel && responseLabels.has(defaultResponseLabel)
    ? defaultResponseLabel
    : cleanResponses[0]?.label || '';

  const newEndpoint = {
    id: uuidv4().slice(0, 8),
    method: method.toUpperCase(),
    path: endpointPath,
    description: description || '',
    collectionId: collectionId || null,
    defaultResponseLabel: resolvedDefault,
    responses: cleanResponses,
    rules: cleanRules,
  };

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

  const { method, path: endpointPath, description, responses, collectionId, rules, defaultResponseLabel } = req.body;

  if (collectionId !== undefined && collectionId !== null) {
    const exists = readCollections().some(c => c.id === collectionId);
    if (!exists) return res.status(400).json({ error: 'Collection not found' });
  }

  if (method) endpoints[index].method = method.toUpperCase();
  if (endpointPath) endpoints[index].path = endpointPath;
  if (description !== undefined) endpoints[index].description = description;
  if (collectionId !== undefined) endpoints[index].collectionId = collectionId;

  if (Array.isArray(responses)) {
    const cleanResponses = responses.map(r => ({
      label:  r.label || 'Default',
      status: r.status || 200,
      delay:  r.delay || 0,
      body:   r.body || {},
    }));

    const responseLabels = new Set(cleanResponses.map(r => r.label));
    const cleanRules = Array.isArray(rules) ? rules.map(r => ({
      id:            r.id || uuidv4().slice(0, 8),
      name:          r.name || 'Unnamed Rule',
      active:        r.active === true,
      responseLabel: r.responseLabel || '',
      conditions:    Array.isArray(r.conditions) ? r.conditions : [],
    })).filter(r => responseLabels.has(r.responseLabel)) : [];

    let foundActive = false;
    for (const r of cleanRules) {
      if (r.active) { if (foundActive) r.active = false; else foundActive = true; }
    }

    const resolvedDefault = defaultResponseLabel && responseLabels.has(defaultResponseLabel)
      ? defaultResponseLabel
      : cleanResponses[0]?.label || '';

    endpoints[index].defaultResponseLabel = resolvedDefault;
    endpoints[index].responses = cleanResponses;
    endpoints[index].rules = cleanRules;
    // Remove legacy fields if present
    delete endpoints[index].isDefault;
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
    const { content, format: hintFormat, strategy, collectionId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    // Validate collectionId if provided
    if (collectionId != null) {
      const exists = readCollections().some(c => c.id === collectionId);
      if (!exists) return res.status(400).json({ error: 'Collection not found' });
    }

    // Detect if this is the combined export format { version, collections, endpoints }
    let parsedContent;
    try { parsedContent = JSON.parse(content); } catch { parsedContent = null; }

    const isCombinedFormat = parsedContent && parsedContent.version === 1
      && Array.isArray(parsedContent.collections)
      && Array.isArray(parsedContent.endpoints);

    let newEndpoints;
    let importedCollections = 0;
    let meta = { format: 'mock-server-export', title: 'Mock Server Export' };

    if (isCombinedFormat) {
      // Restore collections from combined export
      const existingCollections = readCollections();
      const collectionIdMap = {}; // old id → resolved id

      for (const col of parsedContent.collections) {
        const duplicate = existingCollections.find(c => c.name === col.name);
        if (duplicate) {
          collectionIdMap[col.id] = duplicate.id;
        } else {
          const newCol = { ...col, id: uuidv4().slice(0, 8) };
          collectionIdMap[col.id] = newCol.id;
          existingCollections.push(newCol);
          importedCollections++;
        }
      }
      writeCollections(existingCollections);

      newEndpoints = parsedContent.endpoints.map(ep => ({
        ...ep,
        id: uuidv4().slice(0, 8),
        collectionId: ep.collectionId ? (collectionIdMap[ep.collectionId] || null) : null,
      }));
    } else {
      const format = detectFormat(content, hintFormat || 'auto');
      if (format === 'unknown') {
        return res.status(400).json({
          error: 'Unable to detect format. Please provide a valid OpenAPI/Swagger spec or Postman Collection.'
        });
      }
      const parser = format === 'openapi' ? openApiParser : postmanParser;
      const { endpoints: parsed, meta: m } = parser.parse(content);
      meta = m;
      newEndpoints = parsed.map(ep => ({
        id: uuidv4().slice(0, 8),
        ...ep,
        collectionId: collectionId || null,
      }));
    }

    let imported = 0;
    let skipped = 0;

    if (strategy === 'replace') {
      writeEndpoints(newEndpoints);
      imported = newEndpoints.length;
    } else {
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
      message: 'Import complete',
      format: meta.format,
      title: meta.title,
      imported,
      skipped,
      importedCollections,
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
  const endpoints = readEndpoints().map(migrateEndpoint);
  const collections = readCollections();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="mock-server-export.json"');
  res.json({ version: 1, collections, endpoints });
});

module.exports = router;
