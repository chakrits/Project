const { test, expect } = require('@playwright/test');

test('Check index.html loads successfully via Local Server', async ({ page }) => {
  // Navigate to the root URL (which serves index.html through Express)
  await page.goto('/');
  
  // Check that the page has a title
  const title = await page.title();
  console.log(`Page title is: ${title}`);
  
  // Basic assertion: Title should not be empty
  expect(title.length).toBeGreaterThan(0);
});
