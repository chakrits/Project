const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  /* Ignore Jest/Supertest suites (*.test.js) so `playwright test` only runs *.spec.js */
  testIgnore: ['**/mock-server/**', '**/utils/**', '**/server/**'],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5000',

    /* Slow each action down for live demos. Off by default; enable with SLOWMO=800 (ms). */
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Capture full-page screenshot after every test (visible in HTML report) */
    screenshot: { mode: 'on', fullPage: true },

    /* Record video for every test */
    video: 'on',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
});
