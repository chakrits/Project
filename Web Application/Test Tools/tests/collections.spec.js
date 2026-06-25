const { test, expect } = require('@playwright/test');

// Run serially — tests share server state (endpoints.json / collections.json)
test.describe.configure({ mode: 'serial' });

const MOCK_SERVER_URL = '/tools/mock-server';

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

async function createEndpointViaAPI(page, data = {}) {
  const res = await page.request.post('/api/mock-server/endpoints', {
    data: {
      method: 'GET',
      path: '/test-ep',
      description: 'Test',
      responses: [{ label: 'OK', status: 200, body: {}, isDefault: true }],
      ...data,
    },
  });
  return res.json();
}

async function createCollectionViaAPI(page, name, color = '#6366f1') {
  const res = await page.request.post('/api/mock-server/collections', {
    data: { name, description: 'Test collection', color },
  });
  return res.json();
}

// Wait for a collection group header span to appear in the sidebar
async function waitForCollectionInSidebar(page, name) {
  await page.waitForSelector(`span.font-semibold:has-text("${name}")`, { timeout: 10000 });
}

// The sticky group header div for a collection (has Tailwind class "group")
function collectionRow(page, name) {
  return page.locator('div.group').filter({
    has: page.locator(`span.font-semibold:has-text("${name}")`),
  });
}

// Hover the group header and force-click the three-dot (MoreHorizontal) button
async function openCollectionMenu(page, name) {
  const row = collectionRow(page, name);
  await row.hover();
  await row.locator('button').last().click({ force: true });
}

// Select a value in the collection filter <select> (first select in the sidebar)
async function selectCollectionFilter(page, label) {
  await page.locator('select').first().selectOption({ label });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Collections', () => {
  test.beforeEach(async ({ page }) => {
    await clearAll(page);
  });

  test.afterEach(async ({ page }) => {
    await clearAll(page);
  });

  // ── TC-COL-01: Create collection via modal ────────────────────────────────
  test('TC-COL-01: create collection via modal → appears in sidebar', async ({ page }) => {
    await goToMockServer(page);

    await page.locator('button[title="New collection"]').click();
    await expect(page.getByRole('heading', { name: 'New Collection' })).toBeVisible();

    await page.getByPlaceholder('e.g. User Service').fill('Auth API');
    await page.getByPlaceholder('Optional description').fill('Authentication endpoints');
    // Click the Create button inside the modal (bg-accent, not a sidebar button)
    await page.locator('dialog, [role="dialog"], .animate-fade-in').last()
      .locator('button', { hasText: 'Create' }).click();

    await waitForCollectionInSidebar(page, 'Auth API');
    await expect(page.locator('span.font-semibold', { hasText: 'Auth API' })).toBeVisible();
  });

  // ── TC-COL-02: Assign endpoint to collection ──────────────────────────────
  test('TC-COL-02: assign endpoint to collection → moves to that group', async ({ page }) => {
    const col = await createCollectionViaAPI(page, 'Payment');
    await createEndpointViaAPI(page, { path: '/pay', description: 'Payment endpoint' });

    await goToMockServer(page);
    await waitForCollectionInSidebar(page, 'Payment');

    // Click endpoint in sidebar
    await page.locator('button.w-full.text-left').filter({ hasText: '/pay' }).click();

    // Wait for the editor's Collection label to appear
    await page.waitForSelector('label:has-text("Collection")', { timeout: 5000 });

    // The editor's collection combobox has "— Uncollected —" as its first option
    const editorCollectionSelect = page.locator('select').filter({ hasText: '— Uncollected —' });
    await editorCollectionSelect.selectOption({ label: 'Payment' });

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('text=Endpoint saved')).toBeVisible({ timeout: 5000 });

    // Payment group now shows 1 endpoint
    await expect(collectionRow(page, 'Payment')).toContainText('1');
  });

  // ── TC-COL-03: Rename collection ──────────────────────────────────────────
  test('TC-COL-03: rename collection → label updates in sidebar', async ({ page }) => {
    await createCollectionViaAPI(page, 'Old Name');

    await goToMockServer(page);
    await waitForCollectionInSidebar(page, 'Old Name');

    await openCollectionMenu(page, 'Old Name');
    await page.getByRole('button', { name: 'Rename' }).click();

    // Modal pre-filled with 'Old Name'
    const nameInput = page.getByPlaceholder('e.g. User Service');
    await expect(nameInput).toHaveValue('Old Name');
    await nameInput.clear();
    await nameInput.fill('New Name');
    // Save button inside the rename modal
    await page.locator('.animate-fade-in').last().locator('button', { hasText: 'Save' }).click();

    await waitForCollectionInSidebar(page, 'New Name');
    await expect(page.locator('span.font-semibold', { hasText: 'New Name' })).toBeVisible();
    await expect(page.locator('span.font-semibold', { hasText: 'Old Name' })).not.toBeVisible();
  });

  // ── TC-COL-04: Delete collection — endpoints become Uncollected ───────────
  test('TC-COL-04: delete collection with endpoints → endpoints become uncollected', async ({ page }) => {
    const col = await createCollectionViaAPI(page, 'To Delete');
    await createEndpointViaAPI(page, { path: '/orphan', collectionId: col.id });

    await goToMockServer(page);
    await waitForCollectionInSidebar(page, 'To Delete');

    await openCollectionMenu(page, 'To Delete');
    // The Delete option in the three-dot dropdown has text-red-400 styling
    await page.locator('button.text-red-400', { hasText: 'Delete' }).click();

    // Confirm modal — the red Delete button
    await page.locator('button.bg-red-500').click();

    // Collection header is gone
    await expect(page.locator('span.font-semibold', { hasText: 'To Delete' })).not.toBeVisible();
    // Endpoint is still visible — flat list renders when no collections remain
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/orphan' })).toBeVisible({ timeout: 5000 });
  });

  // ── TC-COL-05: Collapse / expand collection section ───────────────────────
  test('TC-COL-05: collapse and expand collection section', async ({ page }) => {
    const col = await createCollectionViaAPI(page, 'Collapsible');
    await createEndpointViaAPI(page, { path: '/collapse-me', collectionId: col.id });

    await goToMockServer(page);
    await waitForCollectionInSidebar(page, 'Collapsible');

    // Endpoint is visible initially
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/collapse-me' })).toBeVisible();

    // Click the first button in the group header (the collapse toggle)
    const headerBtn = collectionRow(page, 'Collapsible').locator('button').first();
    await headerBtn.click();
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/collapse-me' })).not.toBeVisible();

    // Click again to expand
    await headerBtn.click();
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/collapse-me' })).toBeVisible();
  });

  // ── TC-COL-06: Filter sidebar by collection dropdown ─────────────────────
  test('TC-COL-06: filter sidebar by collection dropdown', async ({ page }) => {
    const col = await createCollectionViaAPI(page, 'Filtered');
    await createEndpointViaAPI(page, { path: '/in-collection', collectionId: col.id });
    await createEndpointViaAPI(page, { path: '/not-in-collection' });

    await goToMockServer(page);
    await waitForCollectionInSidebar(page, 'Filtered');

    await selectCollectionFilter(page, 'Filtered');

    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/in-collection' })).toBeVisible();
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/not-in-collection' })).not.toBeVisible();
  });

  // ── TC-COL-07: Search within collection filter ────────────────────────────
  test('TC-COL-07: search within collection filter', async ({ page }) => {
    const col = await createCollectionViaAPI(page, 'Search Test');
    await createEndpointViaAPI(page, { path: '/alpha', collectionId: col.id });
    await createEndpointViaAPI(page, { path: '/beta', collectionId: col.id });
    await createEndpointViaAPI(page, { path: '/gamma' });

    await goToMockServer(page);
    await waitForCollectionInSidebar(page, 'Search Test');

    await selectCollectionFilter(page, 'Search Test');
    await page.getByPlaceholder('Search endpoints...').fill('alpha');

    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/alpha' })).toBeVisible();
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/beta' })).not.toBeVisible();
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/gamma' })).not.toBeVisible();
  });

  // ── TC-COL-08: Export then re-import restores collections ─────────────────
  test('TC-COL-08: export then re-import (replace) restores collections', async ({ page }) => {
    const col = await createCollectionViaAPI(page, 'Export Me');
    await createEndpointViaAPI(page, { path: '/export-ep', collectionId: col.id });

    const exportRes = await page.request.get('/api/mock-server/export');
    expect(exportRes.ok()).toBe(true);
    const exported = await exportRes.json();
    expect(exported.version).toBe(1);
    expect(exported.collections).toHaveLength(1);
    expect(exported.endpoints).toHaveLength(1);

    await clearAll(page);

    const importRes = await page.request.post('/api/mock-server/import', {
      data: { content: JSON.stringify(exported), format: 'auto', strategy: 'replace' },
    });
    expect(importRes.ok()).toBe(true);
    const result = await importRes.json();
    expect(result.imported).toBe(1);
    expect(result.importedCollections).toBe(1);

    await goToMockServer(page);
    await waitForCollectionInSidebar(page, 'Export Me');
    await expect(page.locator('span.font-semibold', { hasText: 'Export Me' })).toBeVisible();
    await expect(page.locator('button.w-full.text-left').filter({ hasText: '/export-ep' })).toBeVisible();
  });

  // ── TC-COL-09: Import old flat-array JSON → no crash ─────────────────────
  test('TC-COL-09: import old flat-array format → no server error', async ({ page }) => {
    const oldFormat = JSON.stringify([
      {
        method: 'GET', path: '/legacy-ep', description: 'Legacy',
        responses: [{ label: 'OK', status: 200, body: {}, isDefault: true, conditions: [] }],
      },
    ]);
    const importRes = await page.request.post('/api/mock-server/import', {
      data: { content: oldFormat, format: 'auto', strategy: 'merge' },
    });
    expect(importRes.status()).toBeLessThan(500);
  });
});
