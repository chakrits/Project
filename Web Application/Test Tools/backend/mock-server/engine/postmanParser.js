/**
 * Postman Collection Parser
 * 
 * Parses Postman Collection v2.1 JSON exports into the internal
 * mock-server endpoint format. Supports:
 * - Nested folders (recursive item traversal)
 * - Saved response examples
 * - URL path extraction with variable detection
 * - Deduplication by method+path
 */

/**
 * Parse a Postman Collection v2.1 JSON string into internal endpoints.
 * 
 * @param {string} content - Raw JSON string of the Postman collection
 * @returns {{ endpoints: Array, meta: object }} Parsed endpoints + metadata
 */
function parse(content) {
  let collection;
  
  try {
    collection = JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse Postman collection as JSON: ${err.message}`);
  }

  if (!collection || typeof collection !== 'object') {
    throw new Error('Invalid Postman collection: parsed content is not an object');
  }

  // Validate it's a Postman collection
  const schema = collection.info?.schema || '';
  if (!schema.includes('postman') && !collection.info?._postman_id) {
    throw new Error('Not a valid Postman Collection (missing info.schema or info._postman_id)');
  }

  const meta = {
    format: 'postman',
    version: 'v2.1',
    title: collection.info?.name || 'Untitled Collection',
    description: collection.info?.description || ''
  };

  const rawEndpoints = [];

  // Recursively extract items (handles nested folders)
  function walkItems(items, folderPath = '') {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      // If it has sub-items, it's a folder — recurse
      if (item.item && Array.isArray(item.item)) {
        const folder = folderPath ? `${folderPath}/${item.name}` : item.name;
        walkItems(item.item, folder);
        continue;
      }

      // It's a request item
      if (!item.request) continue;

      const request = item.request;
      const method = (typeof request.method === 'string' ? request.method : 'GET').toUpperCase();
      
      // Extract path
      const path = extractPath(request.url);
      if (!path) continue;

      // Extract description
      const description = item.name || request.description || '';

      // Extract responses from saved examples
      const responses = [];
      
      if (Array.isArray(item.response) && item.response.length > 0) {
        for (const resp of item.response) {
          const status = resp.code || 200;
          const label = resp.name || resp.status || `${status} Response`;
          
          let body = {};
          if (resp.body) {
            try {
              body = JSON.parse(resp.body);
            } catch {
              // If body isn't valid JSON, wrap it as a string
              body = { _raw: resp.body };
            }
          }

          responses.push({
            label,
            status,
            body,
            isDefault: false
          });
        }
      }

      // If no saved responses, create a default 200
      if (responses.length === 0) {
        responses.push({
          label: 'Default',
          status: 200,
          body: { message: 'OK' },
          isDefault: true
        });
      } else {
        // Set first response as default
        responses[0].isDefault = true;
      }

      rawEndpoints.push({
        method,
        path,
        description: typeof description === 'string' ? description.trim() : '',
        responses,
        _folder: folderPath
      });
    }
  }

  walkItems(collection.item);

  // Deduplicate by method+path, keeping the entry with most responses
  const deduped = deduplicateEndpoints(rawEndpoints);

  return { endpoints: deduped, meta };
}

// ─── Path Extraction ──────────────────────────────────────

/**
 * Extract a clean path from a Postman URL object or string.
 * Handles various Postman URL formats:
 * - String: "https://api.example.com/users/123"
 * - Object: { raw: "...", path: ["users", ":id"] }
 */
function extractPath(url) {
  if (!url) return null;

  // String URL
  if (typeof url === 'string') {
    return normalizeUrlToPath(url);
  }

  // Object URL with path array
  if (url.path && Array.isArray(url.path)) {
    let pathStr = '/' + url.path.join('/');
    // Convert Postman variables {{var}} to :var
    pathStr = pathStr.replace(/\{\{([^}]+)\}\}/g, ':$1');
    return pathStr;
  }

  // Object URL with raw string
  if (url.raw) {
    return normalizeUrlToPath(url.raw);
  }

  return null;
}

/**
 * Extract path portion from a full URL string.
 * e.g., "https://api.example.com/users/123?foo=bar" → "/users/123"
 */
function normalizeUrlToPath(urlStr) {
  try {
    // Remove Postman variables from protocol/host for URL parsing
    const cleaned = urlStr.replace(/\{\{[^}]+\}\}/g, 'placeholder');
    
    let path;
    if (cleaned.includes('://')) {
      const urlObj = new URL(cleaned);
      path = urlObj.pathname;
    } else {
      // No protocol — treat as relative path
      path = cleaned.split('?')[0];
      if (!path.startsWith('/')) path = '/' + path;
    }

    // Convert Postman variables in the original path
    // Find the path portion in the original string
    const originalPath = urlStr.includes('://') 
      ? '/' + urlStr.split('://')[1].split('/').slice(1).join('/').split('?')[0]
      : urlStr.split('?')[0];
    
    // Convert {{var}} to :var
    let finalPath = originalPath.replace(/\{\{([^}]+)\}\}/g, ':$1');
    
    // Ensure starts with /
    if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;
    
    // Remove trailing slash (except root)
    if (finalPath.length > 1 && finalPath.endsWith('/')) {
      finalPath = finalPath.slice(0, -1);
    }

    return finalPath;
  } catch {
    return null;
  }
}

// ─── Deduplication ────────────────────────────────────────

/**
 * Deduplicate endpoints by method+path, keeping the one with most responses.
 */
function deduplicateEndpoints(endpoints) {
  const map = new Map();

  for (const ep of endpoints) {
    const key = `${ep.method}::${ep.path}`;
    const existing = map.get(key);

    if (!existing || ep.responses.length > existing.responses.length) {
      // Remove internal _folder field
      const { _folder, ...clean } = ep;
      map.set(key, clean);
    }
  }

  return Array.from(map.values());
}

/**
 * Detect if a content string is a Postman collection.
 */
function canParse(content) {
  try {
    const parsed = JSON.parse(content);
    const schema = parsed?.info?.schema || '';
    return schema.includes('postman') || !!parsed?.info?._postman_id;
  } catch {
    return false;
  }
}

module.exports = { parse, canParse };
