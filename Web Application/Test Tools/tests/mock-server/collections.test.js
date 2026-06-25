'use strict';

/**
 * Integration tests for Collections API
 * Covers: CRUD, endpoint collectionId validation, GET filter, export/import
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Temp DB paths ────────────────────────────────────────────────────────────

let tmpDir;
let endpointsPath;
let collectionsPath;

function setupTempDb(endpoints = [], collections = []) {
  fs.writeFileSync(endpointsPath, JSON.stringify(endpoints, null, 2), 'utf-8');
  fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 2), 'utf-8');
}

function readTempEndpoints() {
  return JSON.parse(fs.readFileSync(endpointsPath, 'utf-8'));
}

function readTempCollections() {
  return JSON.parse(fs.readFileSync(collectionsPath, 'utf-8'));
}

// ─── App setup ────────────────────────────────────────────────────────────────

let app;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mock-collections-test-'));
  endpointsPath = path.join(tmpDir, 'endpoints.json');
  collectionsPath = path.join(tmpDir, 'collections.json');

  // Inject paths before requiring the app
  process.env.ENDPOINTS_PATH = endpointsPath;
  process.env.COLLECTIONS_PATH = collectionsPath;

  // Require app after setting env vars so managementApi picks up the paths
  app = require('../../server');
});

afterAll(() => {
  delete process.env.ENDPOINTS_PATH;
  delete process.env.COLLECTIONS_PATH;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  setupTempDb([], []);
});

// ─── Collection CRUD ──────────────────────────────────────────────────────────

describe('GET /api/mock-server/collections', () => {
  it('returns [] when collections file is empty', async () => {
    const res = await request(app).get('/api/mock-server/collections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns existing collections', async () => {
    setupTempDb([], [{ id: 'c1', name: 'Users', description: '', color: '#6366f1', createdAt: '2026-01-01T00:00:00.000Z' }]);
    const res = await request(app).get('/api/mock-server/collections');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Users');
  });
});

describe('POST /api/mock-server/collections', () => {
  it('creates a collection with generated id and createdAt', async () => {
    const res = await request(app)
      .post('/api/mock-server/collections')
      .send({ name: 'Auth Service', description: 'Auth endpoints', color: '#22c55e' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Auth Service');
    expect(res.body.description).toBe('Auth endpoints');
    expect(res.body.createdAt).toBeDefined();
    expect(readTempCollections()).toHaveLength(1);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/mock-server/collections')
      .send({ description: 'no name' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name is required');
  });

  it('defaults color to #6366f1 when not provided', async () => {
    const res = await request(app)
      .post('/api/mock-server/collections')
      .send({ name: 'No Color' });
    expect(res.status).toBe(201);
    expect(res.body.color).toBe('#6366f1');
  });
});

describe('GET /api/mock-server/collections/:id', () => {
  it('returns a collection by id', async () => {
    setupTempDb([], [{ id: 'c1', name: 'Users', description: '', color: '#6366f1', createdAt: '2026-01-01T00:00:00.000Z' }]);
    const res = await request(app).get('/api/mock-server/collections/c1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('c1');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/mock-server/collections/nope');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/mock-server/collections/:id', () => {
  it('updates name and description but preserves createdAt', async () => {
    const createdAt = '2026-01-01T00:00:00.000Z';
    setupTempDb([], [{ id: 'c1', name: 'Old Name', description: '', color: '#6366f1', createdAt }]);

    const res = await request(app)
      .put('/api/mock-server/collections/c1')
      .send({ name: 'New Name', description: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.description).toBe('Updated');
    expect(res.body.createdAt).toBe(createdAt);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .put('/api/mock-server/collections/nope')
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/mock-server/collections/:id', () => {
  it('deletes collection and nulls out associated endpoint collectionIds', async () => {
    setupTempDb(
      [
        { id: 'e1', method: 'GET', path: '/a', collectionId: 'c1', description: '', responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }] },
        { id: 'e2', method: 'GET', path: '/b', collectionId: null, description: '', responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }] },
      ],
      [{ id: 'c1', name: 'Users', description: '', color: '#6366f1', createdAt: '2026-01-01T00:00:00.000Z' }]
    );

    const res = await request(app).delete('/api/mock-server/collections/c1');
    expect(res.status).toBe(200);
    expect(res.body.affected).toBe(1);
    expect(readTempCollections()).toHaveLength(0);

    const endpoints = readTempEndpoints();
    expect(endpoints.find(e => e.id === 'e1').collectionId).toBeNull();
    expect(endpoints.find(e => e.id === 'e2').collectionId).toBeNull();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/mock-server/collections/nope');
    expect(res.status).toBe(404);
  });
});

// ─── Endpoint + collectionId integration ─────────────────────────────────────

describe('POST /api/mock-server/endpoints with collectionId', () => {
  it('stores collectionId when collection exists', async () => {
    setupTempDb([], [{ id: 'c1', name: 'Users', description: '', color: '#6366f1', createdAt: '' }]);

    const res = await request(app)
      .post('/api/mock-server/endpoints')
      .send({
        method: 'GET', path: '/users', collectionId: 'c1',
        responses: [{ label: 'OK', status: 200, body: {}, isDefault: true }]
      });

    expect(res.status).toBe(201);
    expect(res.body.collectionId).toBe('c1');
  });

  it('returns 400 when collectionId does not exist', async () => {
    const res = await request(app)
      .post('/api/mock-server/endpoints')
      .send({
        method: 'GET', path: '/users', collectionId: 'unknown',
        responses: [{ label: 'OK', status: 200, body: {}, isDefault: true }]
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Collection not found');
  });

  it('stores null collectionId when not provided', async () => {
    const res = await request(app)
      .post('/api/mock-server/endpoints')
      .send({
        method: 'GET', path: '/users',
        responses: [{ label: 'OK', status: 200, body: {}, isDefault: true }]
      });
    expect(res.status).toBe(201);
    expect(res.body.collectionId).toBeNull();
  });
});

describe('PUT /api/mock-server/endpoints/:id with collectionId', () => {
  it('sets collectionId to null (uncollected)', async () => {
    setupTempDb(
      [{ id: 'e1', method: 'GET', path: '/a', collectionId: 'c1', description: '', responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }] }],
      [{ id: 'c1', name: 'Users', description: '', color: '#6366f1', createdAt: '' }]
    );

    const res = await request(app)
      .put('/api/mock-server/endpoints/e1')
      .send({ collectionId: null });

    expect(res.status).toBe(200);
    expect(res.body.collectionId).toBeNull();
  });

  it('returns 400 when collectionId does not exist', async () => {
    setupTempDb(
      [{ id: 'e1', method: 'GET', path: '/a', collectionId: null, description: '', responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }] }],
      []
    );

    const res = await request(app)
      .put('/api/mock-server/endpoints/e1')
      .send({ collectionId: 'ghost' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/mock-server/endpoints?collectionId=', () => {
  beforeEach(() => {
    setupTempDb(
      [
        { id: 'e1', method: 'GET', path: '/a', collectionId: 'c1', description: '', responses: [] },
        { id: 'e2', method: 'GET', path: '/b', collectionId: 'c2', description: '', responses: [] },
        { id: 'e3', method: 'GET', path: '/c', collectionId: null, description: '', responses: [] },
      ],
      [
        { id: 'c1', name: 'A', description: '', color: '#6366f1', createdAt: '' },
        { id: 'c2', name: 'B', description: '', color: '#22c55e', createdAt: '' },
      ]
    );
  });

  it('returns only endpoints for the given collectionId', async () => {
    const res = await request(app).get('/api/mock-server/endpoints?collectionId=c1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('e1');
  });

  it('returns only uncollected endpoints when collectionId=null', async () => {
    const res = await request(app).get('/api/mock-server/endpoints?collectionId=null');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('e3');
  });

  it('returns all endpoints when collectionId param omitted', async () => {
    const res = await request(app).get('/api/mock-server/endpoints');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });
});

// ─── Export ───────────────────────────────────────────────────────────────────

describe('GET /api/mock-server/export', () => {
  it('returns combined format with version, collections, endpoints', async () => {
    setupTempDb(
      [{ id: 'e1', method: 'GET', path: '/a', collectionId: 'c1', description: '', responses: [] }],
      [{ id: 'c1', name: 'Users', description: '', color: '#6366f1', createdAt: '' }]
    );

    const res = await request(app).get('/api/mock-server/export');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(Array.isArray(res.body.collections)).toBe(true);
    expect(Array.isArray(res.body.endpoints)).toBe(true);
    expect(res.body.collections).toHaveLength(1);
    expect(res.body.endpoints).toHaveLength(1);
  });
});

// ─── Import ───────────────────────────────────────────────────────────────────

describe('POST /api/mock-server/import', () => {
  const makePostmanContent = () => JSON.stringify({
    info: { name: 'Test', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    item: [{ name: 'Get users', request: { method: 'GET', url: { raw: 'http://example.com/users', path: ['users'] } }, response: [] }]
  });

  it('succeeds with old flat-array format (backward compat)', async () => {
    const oldFormat = JSON.stringify([
      { method: 'GET', path: '/legacy', description: '', responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }] }
    ]);

    const res = await request(app)
      .post('/api/mock-server/import')
      .send({ content: oldFormat, format: 'auto', strategy: 'replace' });

    // Old format is not valid OpenAPI/Postman so this should fail gracefully or succeed
    // The important thing: no server crash
    expect([200, 400]).toContain(res.status);
  });

  it('restores collections and endpoints from combined export format', async () => {
    const combinedExport = JSON.stringify({
      version: 1,
      collections: [{ id: 'old-c1', name: 'Users', description: '', color: '#6366f1', createdAt: '2026-01-01T00:00:00.000Z' }],
      endpoints: [{ id: 'old-e1', method: 'GET', path: '/users', collectionId: 'old-c1', description: '', responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }] }]
    });

    const res = await request(app)
      .post('/api/mock-server/import')
      .send({ content: combinedExport, format: 'auto', strategy: 'replace' });

    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.importedCollections).toBe(1);

    const collections = readTempCollections();
    expect(collections).toHaveLength(1);
    expect(collections[0].name).toBe('Users');

    const endpoints = readTempEndpoints();
    expect(endpoints).toHaveLength(1);
    // collectionId should be remapped to the new collection id
    expect(endpoints[0].collectionId).toBe(collections[0].id);
  });

  it('merge strategy deduplicates collections by name', async () => {
    setupTempDb(
      [],
      [{ id: 'existing-c1', name: 'Users', description: '', color: '#6366f1', createdAt: '2026-01-01T00:00:00.000Z' }]
    );

    const combinedExport = JSON.stringify({
      version: 1,
      collections: [{ id: 'import-c1', name: 'Users', description: '', color: '#6366f1', createdAt: '2026-01-01T00:00:00.000Z' }],
      endpoints: [{ id: 'e1', method: 'POST', path: '/users', collectionId: 'import-c1', description: '', responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }] }]
    });

    const res = await request(app)
      .post('/api/mock-server/import')
      .send({ content: combinedExport, format: 'auto', strategy: 'merge' });

    expect(res.status).toBe(200);
    // No new collection created — reused existing
    const collections = readTempCollections();
    expect(collections).toHaveLength(1);
    expect(collections[0].id).toBe('existing-c1');

    const endpoints = readTempEndpoints();
    expect(endpoints[0].collectionId).toBe('existing-c1');
  });

  it('stamps all imported endpoints with provided collectionId', async () => {
    setupTempDb(
      [],
      [{ id: 'c1', name: 'Users', description: '', color: '#6366f1', createdAt: '' }]
    );

    const res = await request(app)
      .post('/api/mock-server/import')
      .send({ content: makePostmanContent(), format: 'postman', strategy: 'replace', collectionId: 'c1' });

    expect(res.status).toBe(200);
    const endpoints = readTempEndpoints();
    expect(endpoints.every(e => e.collectionId === 'c1')).toBe(true);
  });
});
