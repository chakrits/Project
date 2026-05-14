/**
 * Build a cURL command string from a request log entry.
 * 
 * @param {object} request - The request object from a log entry
 * @param {string} request.method - HTTP method
 * @param {string} request.url - Full URL path
 * @param {object} request.headers - Request headers
 * @param {object} request.query - Query parameters
 * @param {*} request.body - Request body
 * @returns {string} The cURL command string
 */
export function buildCurl(request) {
  const parts = ['curl'];

  // Method
  if (request.method && request.method !== 'GET') {
    parts.push(`-X ${request.method}`);
  }

  // URL — construct full URL with host placeholder
  let url = `http://localhost:3000${request.url}`;
  parts.push(`'${url}'`);

  // Headers
  if (request.headers) {
    const skipHeaders = ['host', 'connection', 'content-length', 'accept-encoding', 'user-agent'];
    for (const [key, value] of Object.entries(request.headers)) {
      if (!skipHeaders.includes(key.toLowerCase())) {
        parts.push(`-H '${key}: ${value}'`);
      }
    }
  }

  // Body
  if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const bodyStr = typeof request.body === 'string' 
      ? request.body 
      : JSON.stringify(request.body);
    parts.push(`-d '${bodyStr}'`);
  }

  return parts.join(' \\\n  ');
}
