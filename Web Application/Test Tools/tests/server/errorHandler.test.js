'use strict';

/**
 * Integration tests for the global Express error handler logic.
 *
 * TC-E01 — Error middleware returns 500 JSON for thrown route errors
 * TC-E02 — Server remains healthy after error handling (no double-send)
 * TC-R02 — POST /api/proxy success flow unaffected by error handler
 *
 * Strategy: TC-E01 uses a fresh isolated Express app so the error handler
 * is registered AFTER the throwing routes — the correct middleware order.
 * TC-E02 and TC-R02 use the main app to verify end-to-end stability.
 */

const express = require('express');
const request = require('supertest');
const app = require('../../server');

/**
 * Build a minimal test app that mirrors only the error-handler logic from server.js.
 * Routes are registered BEFORE the error handler — the correct Express order.
 */
function createErrorHandlerTestApp() {
  const testApp = express();
  testApp.use(express.json());

  // Synchronous throw
  testApp.get('/__test_throw', () => {
    throw new Error('deliberate test error');
  });

  // Async throw — Express 5 auto-forwards to error middleware
  testApp.get('/__test_async_throw', async () => {
    throw new Error('deliberate async error');
  });

  // Route with a custom HTTP status on the error
  testApp.get('/__test_404_error', () => {
    const err = new Error('not found custom');
    err.status = 404;
    throw err;
  });

  // Mirror the exact error handler from server.js
  // eslint-disable-next-line no-unused-vars
  testApp.use((err, req, res, next) => {
    if (!res.headersSent) {
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  return testApp;
}

// ── TC-E01 ───────────────────────────────────────────────
describe('TC-E01: Global error handler returns 500 JSON for thrown errors', () => {
  let testApp;

  beforeAll(() => {
    testApp = createErrorHandlerTestApp();
  });

  it('catches synchronous thrown error and returns 500', async () => {
    const res = await request(testApp).get('/__test_throw');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
    expect(typeof res.body.error).toBe('string');
  });

  it('error message is included in response body', async () => {
    const res = await request(testApp).get('/__test_throw');
    expect(res.body.error).toContain('deliberate test error');
  });

  it('catches async thrown error and returns 500', async () => {
    const res = await request(testApp).get('/__test_async_throw');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  it('response Content-Type is application/json', async () => {
    const res = await request(testApp).get('/__test_throw');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('uses err.status when provided (e.g. 404)', async () => {
    const res = await request(testApp).get('/__test_404_error');
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not found custom');
  });

  it('falls back to 500 when err.status is not set', async () => {
    const res = await request(testApp).get('/__test_async_throw');
    expect(res.status).toBe(500);
  });
});

// ── TC-E02 ───────────────────────────────────────────────
describe('TC-E02: Main app remains healthy after errors (no double-send)', () => {
  it('GET / returns 200 after proxy error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await request(app)
      .post('/api/proxy')
      .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

    jest.restoreAllMocks();

    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });

  it('multiple sequential errors do not crash the server', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/' });
    }

    jest.restoreAllMocks();

    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});

// ── TC-R02 ───────────────────────────────────────────────
describe('TC-R02: Proxy error response shape unaffected by global error handler (Regression)', () => {
  it('POST /api/proxy still returns { error, cause, proxy_failed } shape', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .post('/api/proxy')
      .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

    // Proxy catch block handles this — NOT the global error handler
    expect(res.status).toBe(500);
    expect(res.body.proxy_failed).toBe(true);
    expect(res.body.error).toBeDefined();
    expect('cause' in res.body).toBe(true);

    jest.restoreAllMocks();
  });
});
