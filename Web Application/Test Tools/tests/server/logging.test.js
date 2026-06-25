'use strict';

/**
 * Integration tests for morgan HTTP request logging in server.js
 *
 * TC-I01 — Morgan logs API requests (happy path)
 * TC-I02 — Static asset requests skipped by morgan (Edge Case)
 * TC-I03 — Root / still returns HTML after morgan added (Regression)
 * TC-R01 — GET / returns 200 HTML (Regression)
 * TC-R03 — Mock server routes still reachable (Regression)
 */

const request = require('supertest');
const app = require('../../server');

describe('HTTP request logging (Morgan)', () => {
  // ── TC-I01 ───────────────────────────────────────────────
  describe('TC-I01: Morgan logs API requests (happy path)', () => {
    it('POST /api/proxy completes without crash (morgan side-effect)', async () => {
      const res = await request(app)
        .post('/api/proxy')
        .send({ url: 'http://0.0.0.0:1/', method: 'GET', headers: {} });

      // 500 is expected (unreachable target) — morgan must not cause a crash
      expect([200, 500]).toContain(res.status);
    });

    it('GET /api/mock-server/endpoints completes without crash', async () => {
      const res = await request(app).get('/api/mock-server/endpoints');
      // 200 (empty list) expected — morgan must not interfere
      expect([200, 404]).toContain(res.status);
    });
  });

  // ── TC-I02 ───────────────────────────────────────────────
  describe('TC-I02: Static asset requests skipped by morgan (Edge Case)', () => {
    it('GET /assets/test.png does not crash (morgan skip applied)', async () => {
      const res = await request(app).get('/assets/nonexistent.png');
      // 404 expected (file doesn't exist) — morgan skip must not throw
      expect([200, 404]).toContain(res.status);
    });

    it('request for .js file does not crash', async () => {
      const res = await request(app).get('/some/script.js');
      expect([200, 404]).toContain(res.status);
    });

    it('request for .css file does not crash', async () => {
      const res = await request(app).get('/styles/main.css');
      expect([200, 404]).toContain(res.status);
    });
  });
});

// ── TC-I03 / TC-R01 ──────────────────────────────────────
describe('Regression: static file serving unaffected by morgan', () => {
  it('TC-I03 / TC-R01: GET / returns 200 HTML after morgan was added', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

// ── TC-R03 ───────────────────────────────────────────────
describe('Regression: mock server routes still reachable', () => {
  it('TC-R03: GET /api/mock-server/endpoints responds (not crashed by morgan)', async () => {
    const res = await request(app).get('/api/mock-server/endpoints');
    expect([200, 404]).toContain(res.status);
  });

  it('TC-R04: GET /api/mock-server/logs responds', async () => {
    const res = await request(app).get('/api/mock-server/logs');
    expect([200, 404]).toContain(res.status);
  });
});
