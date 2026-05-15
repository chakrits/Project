/**
 * OpenAPI / Swagger Parser
 * 
 * Parses OpenAPI 3.x and Swagger 2.0 specifications into the internal
 * mock-server endpoint format. Supports:
 * - Path conversion: {param} → :param
 * - $ref resolution (local references only)
 * - Schema-to-example generation from property types
 * - Inline `example` / `examples` extraction
 * - basePath handling (Swagger 2.0)
 */

const yaml = require('js-yaml');

/**
 * Parse an OpenAPI/Swagger spec (JSON string or YAML string) into internal endpoints.
 * 
 * @param {string} content - Raw file content (JSON or YAML)
 * @returns {{ endpoints: Array, meta: object }} Parsed endpoints + metadata
 */
function parse(content) {
  let spec;
  
  // Try JSON first, then YAML
  try {
    spec = JSON.parse(content);
  } catch {
    try {
      spec = yaml.load(content);
    } catch (yamlErr) {
      throw new Error(`Failed to parse file as JSON or YAML: ${yamlErr.message}`);
    }
  }

  if (!spec || typeof spec !== 'object') {
    throw new Error('Invalid spec: parsed content is not an object');
  }

  // Detect version
  const isSwagger2 = spec.swagger && spec.swagger.startsWith('2');
  const isOpenApi3 = spec.openapi && spec.openapi.startsWith('3');

  if (!isSwagger2 && !isOpenApi3) {
    throw new Error('Unsupported format: expected "swagger: 2.0" or "openapi: 3.x"');
  }

  const meta = {
    format: isSwagger2 ? 'swagger' : 'openapi',
    version: isSwagger2 ? spec.swagger : spec.openapi,
    title: spec.info?.title || 'Untitled API',
    description: spec.info?.description || ''
  };

  const basePath = isSwagger2 ? (spec.basePath || '') : '';
  const paths = spec.paths || {};
  const endpoints = [];

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation) continue;

      // Build the full path with basePath (Swagger 2.0)
      let fullPath = basePath + pathKey;
      // Convert {param} to :param
      fullPath = convertPath(fullPath);
      // Clean up trailing slashes (but keep root /)
      if (fullPath.length > 1 && fullPath.endsWith('/')) {
        fullPath = fullPath.slice(0, -1);
      }

      // Extract description
      const description = operation.summary || operation.operationId || operation.description || '';

      // Extract responses
      const responses = [];
      const operationResponses = operation.responses || {};

      for (const [statusCode, responseDef] of Object.entries(operationResponses)) {
        const status = parseInt(statusCode, 10);
        if (isNaN(status)) continue; // Skip 'default' etc.

        const label = responseDef.description || `${status} Response`;
        let body = {};

        if (isOpenApi3) {
          body = extractBodyOpenApi3(responseDef, spec);
        } else {
          body = extractBodySwagger2(responseDef, spec);
        }

        responses.push({
          label,
          status,
          body,
          isDefault: false
        });
      }

      // Set first 2xx response as default, or first response
      const default2xx = responses.find(r => r.status >= 200 && r.status < 300);
      if (default2xx) {
        default2xx.isDefault = true;
      } else if (responses.length > 0) {
        responses[0].isDefault = true;
      }

      // If no responses at all, add a default 200
      if (responses.length === 0) {
        responses.push({
          label: 'Default',
          status: 200,
          body: { message: 'OK' },
          isDefault: true
        });
      }

      endpoints.push({
        method: method.toUpperCase(),
        path: fullPath,
        description: typeof description === 'string' ? description.trim().split('\n')[0] : '',
        responses
      });
    }
  }

  return { endpoints, meta };
}

// ─── OpenAPI 3.x Body Extraction ──────────────────────────

function extractBodyOpenApi3(responseDef, spec) {
  const content = responseDef.content;
  if (!content) return {};

  // Prefer application/json
  const jsonContent = content['application/json'] || content['*/*'] || Object.values(content)[0];
  if (!jsonContent) return {};

  // Check for inline example
  if (jsonContent.example !== undefined) {
    return jsonContent.example;
  }

  // Check for examples (plural)
  if (jsonContent.examples) {
    const firstKey = Object.keys(jsonContent.examples)[0];
    if (firstKey && jsonContent.examples[firstKey]?.value !== undefined) {
      return jsonContent.examples[firstKey].value;
    }
  }

  // Generate from schema
  if (jsonContent.schema) {
    return generateFromSchema(jsonContent.schema, spec, new Set());
  }

  return {};
}

// ─── Swagger 2.0 Body Extraction ──────────────────────────

function extractBodySwagger2(responseDef, spec) {
  // Check for inline example
  if (responseDef.examples && responseDef.examples['application/json']) {
    return responseDef.examples['application/json'];
  }

  // Generate from schema
  if (responseDef.schema) {
    return generateFromSchema(responseDef.schema, spec, new Set());
  }

  return {};
}

// ─── Schema → Example Generator ───────────────────────────

/**
 * Generate a sample value from a JSON Schema definition.
 * Handles $ref, nested objects, arrays, and primitive types.
 * Uses `example` values from properties when available.
 * 
 * @param {object} schema - JSON Schema object
 * @param {object} spec - Full spec (for resolving $ref)
 * @param {Set} visited - Set of visited $ref paths (circular reference guard)
 * @returns {*} Generated sample value
 */
function generateFromSchema(schema, spec, visited) {
  if (!schema) return {};

  // Resolve $ref
  if (schema.$ref) {
    const refPath = schema.$ref;
    
    // Circular reference guard
    if (visited.has(refPath)) {
      return {};
    }
    visited.add(refPath);

    const resolved = resolveRef(refPath, spec);
    if (resolved) {
      return generateFromSchema(resolved, spec, visited);
    }
    return {};
  }

  // Use example if available
  if (schema.example !== undefined) {
    return schema.example;
  }

  // Use default if available
  if (schema.default !== undefined) {
    return schema.default;
  }

  // Use enum first value
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  const type = schema.type;

  if (type === 'object' || schema.properties) {
    const result = {};
    const properties = schema.properties || {};
    
    for (const [key, propSchema] of Object.entries(properties)) {
      result[key] = generateFromSchema(propSchema, spec, new Set(visited));
    }
    return result;
  }

  if (type === 'array') {
    const itemSchema = schema.items;
    if (itemSchema) {
      return [generateFromSchema(itemSchema, spec, new Set(visited))];
    }
    return [];
  }

  // Primitive types
  switch (type) {
    case 'string':
      if (schema.format === 'date') return '2024-01-01';
      if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
      if (schema.format === 'uri' || schema.format === 'url') return 'https://example.com';
      return schema.example || 'string';
    case 'integer':
      return schema.example || 0;
    case 'number':
      return schema.example || 0.0;
    case 'boolean':
      return schema.example !== undefined ? schema.example : true;
    default:
      return {};
  }
}

// ─── $ref Resolution ──────────────────────────────────────

/**
 * Resolve a local $ref pointer like "#/definitions/User" or "#/components/schemas/User"
 */
function resolveRef(ref, spec) {
  if (!ref.startsWith('#/')) return null;

  const parts = ref.slice(2).split('/');
  let current = spec;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current;
}

// ─── Path Conversion ──────────────────────────────────────

/**
 * Convert OpenAPI path format {param} to Express/path-to-regexp format :param
 * e.g., /users/{userId}/orders/{orderId} → /users/:userId/orders/:orderId
 */
function convertPath(openApiPath) {
  return openApiPath.replace(/\{([^}]+)\}/g, ':$1');
}

/**
 * Detect if a content string is an OpenAPI/Swagger spec.
 */
function canParse(content) {
  try {
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = yaml.load(content);
    }
    return !!(parsed?.swagger || parsed?.openapi);
  } catch {
    return false;
  }
}

module.exports = { parse, canParse };
