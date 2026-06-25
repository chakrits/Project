// @ts-check
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const CONFIG = {
  targetUrl: 'http://mock-target.test/digitsign/index',
  orgCode: 'BPK',
  appId: '6',
  secretKey: '752e9c79fb6c4ad0',
  aesMode: 'ECB',
};

const FINAL_URL_PREFIX = `${CONFIG.targetUrl}?org_code=${CONFIG.orgCode}&app_id=${CONFIG.appId}&key=`;

// Where generated-result screenshots are saved (used by the URL Generation tests)
const SHOT_DIR = 'automation-demo/screenshots';

const FORMS = [
  {
    path: '/forms/claim-form-a-patient',
    name: 'Claim Form A Patient',
    scValue: 'gen_form_a_patient',
  },
  {
    path: '/forms/fast-track',
    name: 'Fast Track',
    scValue: 'gen_fast_track',
  },
  {
    path: '/forms/medical-expense-opd',
    name: 'Medical Expense OPD',
    scValue: 'gen_opd_medical_expenses',
  },
  {
    path: '/forms/medical-expense-ipd',
    name: 'Medical Expense IPD',
    scValue: 'gen_ipd_medical_expenses',
  },
];

// ---------------------------------------------------------------------------
// Helper — fill the System Configuration section
// ---------------------------------------------------------------------------
async function fillConfig(page) {
  await page.fill('#targetUrl', CONFIG.targetUrl);
  await page.fill('#orgCode', CONFIG.orgCode);
  await page.fill('#appId', CONFIG.appId);
  await page.fill('#secretKey', CONFIG.secretKey);
  await page.selectOption('#aesMode', CONFIG.aesMode);
}

// ---------------------------------------------------------------------------
// TC-01 to TC-04: Page Load
// ---------------------------------------------------------------------------
test.describe('Page Load', () => {
  for (const form of FORMS) {
    test(`TC: page load — ${form.name}`, async ({ page }) => {
      await page.goto(form.path);
      await page.waitForLoadState('networkidle');

      // Page title contains the form name (case-insensitive partial match)
      await expect(page).toHaveTitle(new RegExp(form.name, 'i'));

      // Parameters form has at least one parameter group
      const paramGroups = page.locator('#parametersForm .parameter-group');
      await expect(paramGroups.first()).toBeVisible();
      expect(await paramGroups.count()).toBeGreaterThan(0);

      // Enabled count shows a number > 0
      const enabledCount = page.locator('#enabledCount');
      await expect(enabledCount).toBeVisible();
      const countText = await enabledCount.textContent();
      expect(parseInt(countText.trim(), 10)).toBeGreaterThan(0);

      // Result card is hidden initially
      const resultCard = page.locator('#resultCard');
      const isHidden = await resultCard.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          el.hidden ||
          el.classList.contains('d-none')
        );
      });
      expect(isHidden).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// TC-05 to TC-08: URL Generation
// ---------------------------------------------------------------------------
test.describe('URL Generation', () => {
  for (const form of FORMS) {
    test(`TC: generate URL — ${form.name}`, async ({ page }, testInfo) => {
      test.slow();

      await page.goto(form.path);
      await page.waitForLoadState('networkidle');

      await fillConfig(page);
      await page.click('#generateUrlBtn');
      await page.waitForTimeout(500);

      // Result card becomes visible
      const resultCard = page.locator('#resultCard');
      await expect(resultCard).toBeVisible({ timeout: 8000 });

      // #queryPreview is non-empty
      const queryPreview = page.locator('#queryPreview');
      await expect(queryPreview).toBeVisible();
      const previewText = (await queryPreview.textContent()).trim();
      expect(previewText.length).toBeGreaterThan(0);

      // #queryPreview contains sc= parameter
      expect(previewText).toContain('sc=');

      // #queryPreview contains form-specific sc value
      expect(previewText).toContain(form.scValue);

      // #encryptedKey is non-empty and reasonably long
      const encryptedKey = page.locator('#encryptedKey');
      await expect(encryptedKey).toBeVisible();
      const keyText = (await encryptedKey.textContent()).trim();
      expect(keyText.length).toBeGreaterThan(10);

      // #finalUrl matches expected prefix pattern
      const finalUrlInput = page.locator('#finalUrl');
      await expect(finalUrlInput).toBeVisible();
      const finalUrl = await finalUrlInput.inputValue();
      expect(finalUrl.startsWith(FINAL_URL_PREFIX)).toBe(true);

      // #urlLength contains "chars"
      const urlLength = page.locator('#urlLength');
      await expect(urlLength).toBeVisible();
      const lengthText = await urlLength.textContent();
      expect(lengthText).toContain('chars');

      // Capture the generated result card — saved to disk for slides and
      // attached to the Playwright HTML report as evidence.
      const slug = form.path.split('/').pop();
      await resultCard.scrollIntoViewIfNeeded();
      const shot = await resultCard.screenshot({ path: `${SHOT_DIR}/eform-${slug}.png` });
      await testInfo.attach(`generated-url-${slug}`, { body: shot, contentType: 'image/png' });
    });
  }
});

// ---------------------------------------------------------------------------
// TC-09 to TC-10: Parameter Controls
// ---------------------------------------------------------------------------
test.describe('Parameter Controls', () => {
  test('TC-09: disable bu_code toggle — param disappears from query', async ({ page }) => {
    await page.goto('/forms/claim-form-a-patient');
    await page.waitForLoadState('networkidle');

    await fillConfig(page);

    // bu_code toggle should be checked by default; uncheck it
    const toggle = page.locator('#toggle_bu_code');
    await expect(toggle).toBeChecked();
    await toggle.uncheck();

    await page.click('#generateUrlBtn');
    await page.waitForTimeout(500);

    await expect(page.locator('#resultCard')).toBeVisible({ timeout: 8000 });

    const previewText = (await page.locator('#queryPreview').textContent()).trim();
    expect(previewText).not.toContain('bu_code=');
  });

  test('TC-10: Disable All sets enabledCount to 0; Enable All restores count', async ({ page }) => {
    await page.goto('/forms/fast-track');
    await page.waitForLoadState('networkidle');

    await page.click('#disableAllBtn');

    const enabledCount = page.locator('#enabledCount');
    await expect(enabledCount).toHaveText('0');

    await page.click('#enableAllBtn');

    const countAfter = parseInt(
      (await enabledCount.textContent()).trim(),
      10
    );
    expect(countAfter).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// TC-11 to TC-13: Form-Specific Fields
// ---------------------------------------------------------------------------
test.describe('Form-Specific Fields', () => {
  test('TC-11: Medical Expense OPD has correct invoice fields', async ({ page }) => {
    await page.goto('/forms/medical-expense-opd');
    await page.waitForLoadState('networkidle');

    const invoiceNo = page.locator('#param_invoice_no');
    await expect(invoiceNo).toBeVisible();
    await expect(invoiceNo).toHaveValue('05-CO24057014');

    const invoiceAmount = page.locator('#param_invoice_amount');
    await expect(invoiceAmount).toBeVisible();
    await expect(invoiceAmount).toHaveValue('1599.00');
  });

  test('TC-12: Medical Expense IPD has correct invoice fields', async ({ page }) => {
    await page.goto('/forms/medical-expense-ipd');
    await page.waitForLoadState('networkidle');

    const invoiceNo = page.locator('#param_invoice_no');
    await expect(invoiceNo).toBeVisible();
    await expect(invoiceNo).toHaveValue('05-CI24009526');

    const invoiceAmount = page.locator('#param_invoice_amount');
    await expect(invoiceAmount).toBeVisible();
    await expect(invoiceAmount).toHaveValue('1,500.00');
  });

  test('TC-13: Fast Track does NOT have invoice_no field', async ({ page }) => {
    await page.goto('/forms/fast-track');
    await page.waitForLoadState('networkidle');

    const invoiceNo = page.locator('#param_invoice_no');
    expect(await invoiceNo.count()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TC-14 to TC-15: Navigation & Redirects
// ---------------------------------------------------------------------------
test.describe('Navigation & Redirects', () => {
  test('TC-14: sidebar contains links to all 4 E-Form pages', async ({ page }) => {
    await page.goto('/forms/claim-form-a-patient');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('#sidebar-nav');
    await expect(nav).toBeVisible();

    for (const form of FORMS) {
      const link = nav.locator(`a[href="${form.path}"]`);
      await expect(link).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC-15: /forms/auto-login redirects to /forms/claim-form-a-patient', async ({ page }) => {
    await page.goto('/forms/auto-login');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(/\/forms\/claim-form-a-patient$/);
  });
});
