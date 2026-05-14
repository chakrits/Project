const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for Tailwind CDN to finish rendering
    await page.waitForLoadState('networkidle');
  });

  test('hero section is visible', async ({ page }) => {
    const hero = page.locator('[data-testid="hero"]');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('Test Center Management');
    await expect(page).toHaveScreenshot('dashboard-hero.png', { fullPage: false });
  });

  test('all 6 tool cards are rendered', async ({ page }) => {
    const cards = page.locator('[data-testid="tool-card"]');
    await expect(cards).toHaveCount(6);
    await expect(page).toHaveScreenshot('dashboard-tool-cards.png', { fullPage: false });
  });

  test('tool cards contain expected tools', async ({ page }) => {
    const cards = page.locator('[data-testid="tool-card"]');
    const titles = await cards.locator('h3').allTextContents();
    expect(titles).toContain('Mock Server');
    expect(titles).toContain('AES Encryption');
    expect(titles).toContain('JSON Converter');
  });

  test('navbar user slot exists', async ({ page }) => {
    await expect(page.locator('#navbar-user-slot')).toBeVisible();
    await expect(page.locator('#navbar-user-slot')).toContainText('Tester');
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#sidebar')).toContainText('Dashboard');
    await expect(page.locator('#sidebar')).toContainText('Mock Server');
  });

  test('mock server card link is correct', async ({ page }) => {
    const card = page.locator('[data-testid="tool-card"]').filter({ hasText: 'Mock Server' });
    const link = card.locator('a');
    await expect(link).toHaveAttribute('href', '/tools/mock-server');
  });

  test('e-forms section is rendered', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'E-Forms' })).toBeVisible();
    await expect(page.locator('main').getByText('Claim Form Patient')).toBeVisible();
    await expect(page.locator('main').getByText('Auto Login BURT')).toBeVisible();
  });

  test('footer is rendered', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Chakrit Salaeman');
  });

  test('full page screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('dashboard-full.png', { fullPage: true });
  });
});
