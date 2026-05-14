/**
 * Response Selector Engine (Prism-Style)
 *
 * Selects the appropriate response from an endpoint's response list
 * based on the following priority chain:
 *
 * 0. Conditions match: response.conditions[] evaluated against body/query (first match wins, AND logic)
 * 1. Query param: ?__code=404
 * 2. Query param: ?__example=not_found
 * 3. Header: Prefer: code=404
 * 4. Header: Prefer: example=not_found
 * 5. Default: response with isDefault === true
 * 6. Fallback: first response in the array
 */

/**
 * Resolve a dot-notation path from an object (supports array indices).
 * e.g. getNestedValue({a:{b:[{c:1}]}}, "a.b.0.c") => 1
 */
function getNestedValue(obj, path) {
  if (obj === null || obj === undefined || !path) return undefined;
  return path.split('.').reduce((cur, key) => {
    if (cur === null || cur === undefined) return undefined;
    return cur[key];
  }, obj);
}

/**
 * Evaluate a single condition against request data.
 * Operators: eq, neq, contains, exists, regex
 * Sources: query, body, header, params
 */
function evaluateCondition(condition, query, body, headers, params) {
  const { source, field, operator, value } = condition;
  const data = source === 'query'  ? (query   || {})
             : source === 'body'   ? (body    || {})
             : source === 'header' ? (headers || {})
             : source === 'params' ? (params  || {})
             : {};
  const actual = getNestedValue(data, field);

  switch (operator) {
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'eq':
      return String(actual ?? '') === String(value ?? '');
    case 'neq':
      return String(actual ?? '') !== String(value ?? '');
    case 'contains':
      return String(actual ?? '').includes(String(value ?? ''));
    case 'regex':
      try { return new RegExp(value).test(String(actual ?? '')); }
      catch { return false; }
    default:
      return false;
  }
}

/**
 * Evaluate all conditions for a response (AND logic — all must match).
 */
function evaluateConditions(conditions, query, body, headers, params) {
  if (!conditions || conditions.length === 0) return false;
  return conditions.every(c => evaluateCondition(c, query, body, headers, params));
}

/**
 * Parse the "Prefer" header to extract code and example directives.
 * Supports formats like: "code=404", "example=not_found", "code=404; example=not_found"
 * 
 * @param {string} preferHeader - The value of the Prefer header
 * @returns {{ code: number|null, example: string|null }}
 */
function parsePreferHeader(preferHeader) {
  const result = { code: null, example: null };
  
  if (!preferHeader) return result;

  const parts = preferHeader.split(/[;,]\s*/);
  for (const part of parts) {
    const trimmed = part.trim();
    const codeMatch = trimmed.match(/^code\s*=\s*(\d+)$/);
    if (codeMatch) {
      result.code = parseInt(codeMatch[1], 10);
    }
    const exampleMatch = trimmed.match(/^example\s*=\s*(.+)$/);
    if (exampleMatch) {
      result.example = exampleMatch[1].trim();
    }
  }

  return result;
}

/**
 * Replace {{query.field}} and {{body.field}} placeholders in a response body
 * using values from the incoming request's query string or body.
 * Supports dot-notation paths (e.g. {{body.user.role}}).
 *
 * @param {*} body - The response body template
 * @param {object} query - Request query parameters
 * @param {object} requestBody - Request body
 * @returns {*} - Body with placeholders replaced
 */
function interpolateTemplate(body, query, requestBody) {
  if (typeof body === 'string') {
    return body.replace(/\{\{(query|body)\.([^}]+)\}\}/g, (_, source, path) => {
      const data = source === 'query' ? (query || {}) : (requestBody || {});
      const val = getNestedValue(data, path);
      return val !== undefined ? String(val) : '';
    });
  }
  if (Array.isArray(body)) return body.map(item => interpolateTemplate(item, query, requestBody));
  if (body !== null && typeof body === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(body)) {
      result[key] = interpolateTemplate(value, query, requestBody);
    }
    return result;
  }
  return body;
}

/**
 * Deep-clone a value and replace :param placeholders with actual values.
 *
 * @param {*} body - The response body (object, array, string, etc.)
 * @param {object} params - Key-value pairs of path parameters
 * @returns {*} - Body with placeholders replaced
 */
function interpolateParams(body, params) {
  if (typeof body === 'string') {
    let result = body;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`:${key}`, 'g'), value);
    }
    return result;
  }

  if (Array.isArray(body)) {
    return body.map(item => interpolateParams(item, params));
  }

  if (body !== null && typeof body === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(body)) {
      result[key] = interpolateParams(value, params);
    }
    return result;
  }

  return body;
}

/**
 * Select the appropriate response from an endpoint based on Prism-style priority.
 *
 * @param {object} endpoint - The matched endpoint definition
 * @param {object} query - Request query parameters
 * @param {object} headers - Request headers
 * @param {object} params - Extracted path parameters
 * @param {object} [body] - Request body (for conditions matching)
 * @returns {{ status: number, body: *, label: string }} - Selected response with interpolated body
 */
function selectResponse(endpoint, query, headers, params, body) {
  const responses = endpoint.responses || [];

  if (responses.length === 0) {
    return { status: 200, body: { message: 'No responses configured' }, label: 'empty' };
  }

  let selected = null;

  // Priority 0: Conditions match — first response whose ALL conditions match wins
  for (const r of responses) {
    if (r.conditions && r.conditions.length > 0) {
      if (evaluateConditions(r.conditions, query, body, headers, params)) {
        selected = r;
        break;
      }
    }
  }

  // Priority 1: Query param ?__code=XXX
  if (!selected && query.__code) {
    const code = parseInt(query.__code, 10);
    selected = responses.find(r => r.status === code);
  }

  // Priority 2: Query param ?__example=label
  if (!selected && query.__example) {
    selected = responses.find(r => 
      r.label && r.label.toLowerCase() === query.__example.toLowerCase()
    );
  }

  // Priority 3 & 4: Prefer header
  if (!selected) {
    const prefer = parsePreferHeader(headers['prefer'] || headers['Prefer']);
    
    // Priority 3: Prefer: code=XXX
    if (prefer.code) {
      selected = responses.find(r => r.status === prefer.code);
    }

    // Priority 4: Prefer: example=label
    if (!selected && prefer.example) {
      selected = responses.find(r => 
        r.label && r.label.toLowerCase() === prefer.example.toLowerCase()
      );
    }
  }

  // Priority 5: Default response (isDefault === true)
  if (!selected) {
    selected = responses.find(r => r.isDefault === true);
  }

  // Priority 6: Fallback to first response
  if (!selected) {
    selected = responses[0];
  }

  // Pass 1: Replace {{query.x}} / {{body.x}} template placeholders
  const afterTemplate = interpolateTemplate(
    JSON.parse(JSON.stringify(selected.body)),
    query || {},
    body || {}
  );

  // Pass 2: Replace :param path-parameter placeholders (existing behaviour)
  const interpolatedBody = interpolateParams(afterTemplate, params || {});

  return {
    status: selected.status,
    body: interpolatedBody,
    label: selected.label || 'unknown',
    delay: selected.delay || 0
  };
}

module.exports = { selectResponse, parsePreferHeader, interpolateParams, interpolateTemplate, evaluateConditions, evaluateCondition };
