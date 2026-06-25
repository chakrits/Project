/**
 * Convert an SVG file to a high-resolution PNG using Playwright's Chromium.
 *
 * Usage:
 *   node automation-demo/diagram/svg-to-png.js [input.svg] [output.png] [scale]
 *
 * Defaults: two-demos-architecture.svg → two-demos-architecture.png @ 2x
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const input = process.argv[2] || path.join(dir, 'two-demos-architecture.svg');
const output = process.argv[3] || input.replace(/\.svg$/, '.png');
const scale = Number(process.argv[4] || 2);

(async () => {
  const svg = fs.readFileSync(input, 'utf-8');
  const w = Number((svg.match(/width="(\d+)"/) || [])[1] || 680);
  const h = Number((svg.match(/height="(\d+)"/) || [])[1] || 565);

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: scale });
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(svg, { waitUntil: 'networkidle' });
  const el = await page.$('svg');
  await el.screenshot({ path: output });
  await browser.close();

  console.log(`PNG written → ${output} (${w * scale}x${h * scale}, ${scale}x)`);
})();
