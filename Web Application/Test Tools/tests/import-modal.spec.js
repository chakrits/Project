const { test, expect } = require('@playwright/test');

// Run serially — tests share server state (endpoints + modal UI flow)
test.describe.configure({ mode: 'serial' });

const MOCK_SERVER_URL = '/tools/mock-server';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const POSTMAN_FIXTURE = JSON.stringify({
  info: {
    name: 'Test',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Get users',
      request: {
        method: 'GET',
        url: { raw: 'http://example.com/api/users', path: ['api', 'users'] },
      },
      response: [],
    },
  ],
});

const POSTMAN_FILE = {
  name: 'test-collection.json',
  mimeType: 'application/json',
  buffer: Buffer.from(POSTMAN_FIXTURE),
};

const INVALID_FILE = {
  name: 'bad.json',
  mimeType: 'application/json',
  buffer: Buffer.from('{ not valid json at all !!!'),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function goToMockServer(page) {
  await page.goto(MOCK_SERVER_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('h2:has-text("Endpoints")', { timeout: 10000 });
}

async function clearAll(page) {
  const epRes = await page.request.get('/api/mock-server/endpoints');
  const endpoints = await epRes.json();
  for (const ep of endpoints) {
    await page.request.delete(`/api/mock-server/endpoints/${ep.id}`);
  }
  const colRes = await page.request.get('/api/mock-server/collections');
  const collections = await colRes.json();
  for (const col of collections) {
    await page.request.delete(`/api/mock-server/collections/${col.id}`);
  }
}

/** Stable locator for the ImportModal panel (max-w-2xl is unique to this modal). */
function modalPanel(page) {
  return page.locator('div.max-w-2xl');
}

/** Open the Import modal via the toolbar button. */
async function openImportModal(page) {
  await page.locator('button[title="Import from Swagger/OpenAPI/Postman"]').click();
  await page.waitForSelector('text=Drop file here or click to browse', { timeout: 5000 });
}

/** Close the Import modal via the X button in the modal header (always the first button). */
async function closeImportModal(page) {
  await modalPanel(page).locator('button').first().click();
}

/** Upload a file into the hidden file input inside the Import modal. */
async function uploadFile(page, filePayload) {
  await modalPanel(page).locator('input[type="file"]').setInputFiles(filePayload);
}

/** Assert that the modal drop zone is visible (fresh/reset state). */
async function expectDropZone(page) {
  await expect(modalPanel(page).locator('text=Drop file here or click to browse')).toBeVisible({ timeout: 5000 });
}

/** Assert that "Import Complete!" success banner is NOT present (modal is reset). */
async function expectNoSuccessBanner(page) {
  await expect(modalPanel(page).locator('text=Import Complete!')).not.toBeVisible();
}

/** Scoped endpoint count: matches the preview info "N endpoint(s) found" (not the import button). */
function previewEndpointCount(page) {
  return modalPanel(page).locator('text=/\\d+ endpoint(s)? found/i');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('ImportModal', () => {
  test.beforeEach(async ({ page }) => {
    await clearAll(page);
    await goToMockServer(page);
  });

  test.afterEach(async ({ page }) => {
    await clearAll(page);
  });

  // ── TC-IMP-04: Baseline — first open shows drop zone ─────────────────────
  test('TC-IMP-04: first open ever → drop zone shown (baseline)', async ({ page }) => {
    await openImportModal(page);
    await expectDropZone(page);
    await expectNoSuccessBanner(page);
  });

  // ── TC-IMP-01: Main regression — reopen after auto-close ─────────────────
  test('TC-IMP-01: reopen after auto-close (import success) → drop zone shown, not "Import Complete!"', async ({ page }) => {
    await openImportModal(page);
    await uploadFile(page, POSTMAN_FILE);

    // Wait for preview to load
    await expect(previewEndpointCount(page)).toBeVisible({ timeout: 10000 });

    // Click Import
    await modalPanel(page).locator('button', { hasText: /Import \d+ Endpoint/ }).click();

    // "Import Complete!" appears
    await expect(page.locator('text=Import Complete!')).toBeVisible({ timeout: 10000 });

    // Modal auto-closes after 2 seconds — wait for it to disappear fully
    await expect(page.locator('text=Import Complete!')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Drop file here or click to browse')).not.toBeVisible({ timeout: 3000 });
    // Wait for the post-import API calls (loadEndpoints/loadCollections) to settle
    await page.waitForLoadState('networkidle');
    // Small pause to let React flush state before clicking
    await page.waitForTimeout(300);

    // Reopen the modal — this is the regression scenario
    await page.locator('button[title="Import from Swagger/OpenAPI/Postman"]').click();
    await page.waitForSelector('text=Drop file here or click to browse', { timeout: 10000 });

    // AFTER FIX: drop zone shown fresh, no stale success banner
    await expectDropZone(page);
    await expectNoSuccessBanner(page);
  });

  // ── TC-IMP-02: Reopen after manual close (X clicked before 2s auto-close fires) ──
  // Scenario: user imports successfully, sees "Import Complete!", then manually
  // closes the modal within the 2s window rather than waiting for auto-close.
  test('TC-IMP-02: reopen after manual close within success 2s window → drop zone shown', async ({ page }) => {
    await openImportModal(page);
    await uploadFile(page, POSTMAN_FILE);
    await expect(previewEndpointCount(page)).toBeVisible({ timeout: 10000 });

    // Trigger import
    await modalPanel(page).locator('button', { hasText: /Import \d+ Endpoint/ }).click();

    // Wait for success banner to appear, then immediately close manually (before 2s elapses)
    await expect(modalPanel(page).locator('text=Import Complete!')).toBeVisible({ timeout: 10000 });
    await closeImportModal(page);

    // Modal should be gone
    await expect(page.locator('text=Drop file here or click to browse')).not.toBeVisible();

    // Reopen — state must be reset (AFTER FIX: drop zone shown, no stale success banner)
    await openImportModal(page);
    await expectDropZone(page);
    await expectNoSuccessBanner(page);
    // Preview endpoint list should also be cleared
    await expect(previewEndpointCount(page)).not.toBeVisible();
  });

  // ── TC-IMP-03: Reopen after error → error cleared, drop zone shown ─────────
  test('TC-IMP-03: reopen after parse error → error cleared, drop zone shown', async ({ page }) => {
    await openImportModal(page);
    await uploadFile(page, INVALID_FILE);

    // Parse Error banner appears
    await expect(modalPanel(page).locator('text=Parse Error')).toBeVisible({ timeout: 10000 });

    // Close and reopen
    await closeImportModal(page);
    await openImportModal(page);

    // Error should be cleared
    await expect(page.locator('text=Parse Error')).not.toBeVisible();
    await expectDropZone(page);
  });

  // ── TC-IMP-05: Golden path — full import flow still works after fix ────────
  test('TC-IMP-05: golden path — full import flow works end-to-end', async ({ page }) => {
    await openImportModal(page);
    await uploadFile(page, POSTMAN_FILE);

    // Preview loads with detected format and endpoint count
    await expect(modalPanel(page).locator('text=Postman')).toBeVisible({ timeout: 10000 });
    await expect(previewEndpointCount(page)).toBeVisible({ timeout: 5000 });

    // Import button is enabled (at least 1 endpoint selected)
    const importBtn = modalPanel(page).locator('button', { hasText: /Import \d+ Endpoint/ });
    await expect(importBtn).toBeEnabled();
    await importBtn.click();

    // Success banner appears
    await expect(modalPanel(page).locator('text=Import Complete!')).toBeVisible({ timeout: 10000 });

    // Modal auto-closes after ~2s
    await expect(page.locator('text=Import Complete!')).not.toBeVisible({ timeout: 5000 });

    // Endpoint was actually imported — verify via API
    const epRes = await page.request.get('/api/mock-server/endpoints');
    expect(epRes.ok()).toBe(true);
    const endpoints = await epRes.json();
    expect(endpoints.length).toBeGreaterThan(0);
    const imported = endpoints.find(ep => ep.path && ep.path.includes('users'));
    expect(imported).toBeTruthy();
  });

  // ── TC-IMP-06: Strategy persists across reopens (intentional behavior) ─────
  test('TC-IMP-06: strategy selection persists across reopens', async ({ page }) => {
    // Open and load a file so strategy controls are visible
    await openImportModal(page);
    await uploadFile(page, POSTMAN_FILE);
    await expect(previewEndpointCount(page)).toBeVisible({ timeout: 10000 });

    // Verify default strategy is "merge"
    await expect(modalPanel(page).locator('input[type="radio"][value="merge"]')).toBeChecked();

    // Switch strategy to "replace"
    await modalPanel(page).locator('input[type="radio"][value="replace"]').check();
    await expect(modalPanel(page).locator('input[type="radio"][value="replace"]')).toBeChecked();

    // Close and reopen
    await closeImportModal(page);
    await openImportModal(page);

    // Upload again to get to the strategy controls (preview needed to show them)
    await uploadFile(page, POSTMAN_FILE);
    await expect(previewEndpointCount(page)).toBeVisible({ timeout: 10000 });

    // Strategy should still be "replace" — it is intentionally NOT reset on reopen
    await expect(modalPanel(page).locator('input[type="radio"][value="replace"]')).toBeChecked();
    await expect(modalPanel(page).locator('input[type="radio"][value="merge"]')).not.toBeChecked();
  });
});
