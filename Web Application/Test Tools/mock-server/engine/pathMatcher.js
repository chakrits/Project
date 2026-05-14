/**
 * Path Matcher Engine
 * Uses path-to-regexp to match incoming request paths against endpoint patterns.
 * Supports dynamic segments like :id, :orderId, etc.
 */

const { match } = require('path-to-regexp');

/**
 * Find a matching endpoint for the given method and request path.
 * 
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {string} requestPath - The incoming request path (e.g., "/api/users/123")
 * @param {Array} endpoints - Array of endpoint definitions from endpoints.json
 * @returns {{ endpoint: object, params: object } | null} - Matched endpoint and extracted params, or null
 */
function findMatch(method, requestPath, endpoints) {
  const upperMethod = method.toUpperCase();

  for (const endpoint of endpoints) {
    // Method must match
    if (endpoint.method.toUpperCase() !== upperMethod) {
      continue;
    }

    try {
      const matchFn = match(endpoint.path, { decode: decodeURIComponent });
      const result = matchFn(requestPath);

      if (result) {
        return {
          endpoint,
          params: result.params || {}
        };
      }
    } catch (err) {
      // If the pattern is invalid, skip this endpoint
      console.warn(`[PathMatcher] Invalid pattern "${endpoint.path}":`, err.message);
      continue;
    }
  }

  return null;
}

module.exports = { findMatch };
