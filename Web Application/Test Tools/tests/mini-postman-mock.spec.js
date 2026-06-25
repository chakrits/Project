// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Demo #2 — UI automation that hits the Mock Server.
 *
 * Chain under test:
 *   Playwright → Mini Postman UI (#url, #method, #bodyRaw, #sendBtn)
 *     → POST /api/proxy → Mock Server (/mock-api/demo/*)
 *     → response rendered in #statusBadge / #respBody / #timeBadge
 *
 * Uses the same demo endpoints as the Newman suite (automation-demo/).
 */

const MOCK = 'http://localhost:5000/mock-api';

/**
 * Drive the Mini Postman form to send one request and wait for the response.
 * @param {import('@playwright/test').Page} page
 * @param {{method:string, url:string, body?:string}} req
 */
async function sendRequest(page, { method, url, body }) {
  await page.selectOption('#method', method);
  await page.fill('#url', url);

  if (body !== undefined) {
    // Reveal the Body tab so its fields become actionable
    await page.click('#requestTabs a[href="#body"]');
    await page.selectOption('#bodyType', 'raw');
    await page.fill('#bodyRaw', body);
  }

  // Status badge starts at "Status: -"; Send and wait until it updates.
  await page.click('#sendBtn');
  await expect(page.locator('#statusBadge')).not.toHaveText(/Status: -/, { timeout: 10000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tools/mini_postman');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#sendBtn')).toBeVisible();
});

test.describe('Mini Postman → Mock Server', () => {
  test('TC-01: login success renders 200 + token', async ({ page }) => {
    await sendRequest(page, {
      method: 'POST',
      url: `${MOCK}/demo/login`,
      body: JSON.stringify({ username: 'alice', password: 'P@ssw0rd' }),
    });

    await expect(page.locator('#statusBadge')).toContainText('200');
    await expect(page.locator('#respBody')).toContainText('mock-jwt-token-for-alice');
    await expect(page.locator('#respBody')).toContainText('"role": "admin"');
    // Latency badge is populated
    await expect(page.locator('#timeBadge')).toContainText('ms');
  });

  test('TC-02: invalid credentials renders 401 (negative)', async ({ page }) => {
    await sendRequest(page, {
      method: 'POST',
      url: `${MOCK}/demo/login`,
      body: JSON.stringify({ username: 'alice', password: 'wrong' }),
    });

    await expect(page.locator('#statusBadge')).toContainText('401');
    await expect(page.locator('#respBody')).toContainText('INVALID_CREDENTIALS');
  });

  test('TC-03: order success renders 201 + echoed amount', async ({ page }) => {
    await sendRequest(page, {
      method: 'POST',
      url: `${MOCK}/demo/orders`,
      body: JSON.stringify({ amount: 1500 }),
    });

    await expect(page.locator('#statusBadge')).toContainText('201');
    await expect(page.locator('#respBody')).toContainText('"status": "PENDING"');
    await expect(page.locator('#respBody')).toContainText('1500');
  });

  test('TC-04: order validation error via ?__code=400 (negative)', async ({ page }) => {
    await sendRequest(page, {
      method: 'POST',
      url: `${MOCK}/demo/orders?__code=400`,
      body: JSON.stringify({}),
    });

    await expect(page.locator('#statusBadge')).toContainText('400');
    await expect(page.locator('#respBody')).toContainText('AMOUNT_REQUIRED');
  });
});
