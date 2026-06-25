'use strict';

/**
 * Integration tests for POST /api/proxy
 *
 * TC-P01 — Returns 500 with original response shape on fetch failure (Regression)
 * TC-P02 — Error is logged to console with [PROXY] tag (Verification)
 * TC-P03 — Missing url field in body handled gracefully (Edge Case)
 */

const request = require('supertest');
const app = require('../../server');

describe('POST /api/proxy', () => {
  // ── TC-P01 ───────────────────────────────────────────────
  describe('TC-P01: Response shape unchanged on fetch failure (Regression)', () => {
    it('returns 500 JSON with error, proxy_failed=true on unreachable URL', async () => {
      const res = await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

      expect(res.status).toBe(500);
      expect(res.body.proxy_failed).toBe(true);
      expect(res.body.error).toBeDefined();
      expect(typeof res.body.error).toBe('string');
    });

    it('response body contains "cause" field (null or string)', async () => {
      const res = await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

      expect(res.status).toBe(500);
      // cause can be null or a string — must not be undefined
      expect('cause' in res.body).toBe(true);
    });

    it('Content-Type is application/json', async () => {
      const res = await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  // ── TC-P02 ───────────────────────────────────────────────
  describe('TC-P02: Error logged to console with [PROXY] tag (Verification)', () => {
    let errorSpy;

    beforeEach(() => {
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('calls console.error when fetch fails', async () => {
      await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('log output contains [PROXY] tag', async () => {
      await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

      const allOutput = errorSpy.mock.calls.map(c => c[0]).join('\n');
      expect(allOutput).toContain('[PROXY]');
    });

    it('log output mentions the failed URL', async () => {
      const targetUrl = 'http://0.0.0.0:1/';
      await request(app)
        .post('/api/proxy')
        .send({ url: targetUrl, method: 'GET', headers: {} });

      const allOutput = errorSpy.mock.calls.map(c => c[0]).join('\n');
      expect(allOutput).toContain(targetUrl);
    });
  });

  // ── TC-P03 ───────────────────────────────────────────────
  describe('TC-P03: Missing url field handled gracefully (Edge Case)', () => {
    it('returns 500 with proxy_failed=true when url is missing', async () => {
      const res = await request(app)
        .post('/api/proxy')
        .send({ method: 'GET', headers: {} }); // no url

      expect(res.status).toBe(500);
      expect(res.body.proxy_failed).toBe(true);
    });

    it('does not crash server when body is empty', async () => {
      const res = await request(app)
        .post('/api/proxy')
        .send({});

      expect(res.status).toBe(500);
      // Server should still be responsive after this error
    });

    it('server remains healthy after proxy error', async () => {
      // Trigger a proxy error
      await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/' });

      // Server should still serve normal routes
      const healthCheck = await request(app).get('/');
      expect([200, 404]).toContain(healthCheck.status); // depends on whether index.html exists
    });
  });
});
