/**
 * Mock Router
 * Catches all requests under /mock-api/* and returns mock responses
 * based on endpoint definitions in endpoints.json.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { findMatch } = require('../engine/pathMatcher');
const { selectResponse } = require('../engine/responseSelector');
const { logTransaction } = require('../engine/logger');
const rateLimiter = require('../engine/rateLimiter');

const router = express.Router();
const ENDPOINTS_PATH = path.join(__dirname, '..', 'db', 'endpoints.json');

/**
 * Read endpoints from disk.
 * @returns {Array} Array of endpoint definitions
 */
function readEndpoints() {
  try {
    const data = fs.readFileSync(ENDPOINTS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Rate limiting — 100 req/min per IP (in-memory, resets on restart)
router.use(rateLimiter);

// Parse JSON and URL-encoded bodies for mock requests
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true }));

// Catch ALL methods and ALL paths
router.all('{*path}', async (req, res) => {
  const startTime = Date.now();

  // The path here is relative to where the router is mounted
  // e.g., if mounted at /mock-api, req.path = /api/users/123
  const requestPath = req.path;
  const method = req.method;

  // Read current endpoints
  const endpoints = readEndpoints();

  // Find matching endpoint
  const matchResult = findMatch(method, requestPath, endpoints);

  if (!matchResult) {
    const latencyMs = Date.now() - startTime;
    
    // Log the unmatched request
    logTransaction({
      req,
      status: 404,
      responseBody: { 
        error: 'No matching mock endpoint found',
        requestedMethod: method,
        requestedPath: requestPath,
        availableEndpoints: endpoints.map(e => `${e.method} ${e.path}`)
      },
      responseLabel: 'No Match',
      matchedEndpoint: null,
      latencyMs
    });

    return res.status(404).json({
      error: 'No matching mock endpoint found',
      requestedMethod: method,
      requestedPath: requestPath
    });
  }

  const { endpoint, params } = matchResult;

  // Select response based on Prism-style priority (body passed for conditions matching)
  const selected = selectResponse(endpoint, req.query, req.headers, params, req.body);

  // Apply response delay if configured
  const delay = selected.delay || 0;
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const latencyMs = Date.now() - startTime;

  // Log the transaction
  const traceId = logTransaction({
    req,
    status: selected.status,
    responseBody: selected.body,
    responseLabel: selected.label,
    matchedEndpoint: endpoint,
    latencyMs
  });

  // Set trace ID header for debugging
  res.setHeader('X-Mock-Trace-Id', traceId);
  res.setHeader('X-Mock-Matched-Endpoint', endpoint.path);
  res.setHeader('X-Mock-Response-Label', selected.label);
  if (delay > 0) {
    res.setHeader('X-Mock-Delay-Ms', String(delay));
  }

  // Send the response
  res.status(selected.status).json(selected.body);
});

module.exports = router;
