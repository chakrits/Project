const { test, expect } = require('@playwright/test');

test.describe('Web App Comprehensive Tests', () => {

  test('Should load E-Form page via Clean URL', async ({ page }) => {
    // Navigate to /E-Form (Testing clean URL middleware in server.js)
    const response = await page.goto('/E-Form');
    expect(response.status()).toBe(200);
    
    // Check if it loaded successfully by verifying title or body
    const title = await page.title();
    expect(title).toBeDefined();
  });

  test('Should load widgets page', async ({ page }) => {
    // Navigate to widgets page
    const response = await page.goto('/widgets');
    expect(response.status()).toBe(200);
    
    const title = await page.title();
    expect(title).toBeDefined();
  });

  test('Should successfully proxy a request through /api/proxy', async ({ request }) => {
    // Send a test POST request to the local API proxy endpoint
    const response = await request.post('/api/proxy', {
      data: {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET'
      }
    });
    
    // The proxy should return a 200 OK
    expect(response.status()).toBe(200);
    
    // Check that we got back the JSON payload from the destination
    const json = await response.json();
    expect(json.id).toBe(1);
    expect(json.userId).toBeDefined();
    expect(json.title).toBeDefined();
  });

  test('Should handle invalid proxy requests gracefully', async ({ request }) => {
    // Send a bad request to the local API proxy endpoint
    const response = await request.post('/api/proxy', {
      data: {
        url: 'http://invalid.local.domain.that.does.not.exist',
        method: 'GET'
      }
    });
    
    // The proxy should return a 500 error and not crash the server
    expect(response.status()).toBe(500);
    const json = await response.json();
    expect(json.proxy_failed).toBe(true);
    expect(json.error).toBeDefined();
  });

});
