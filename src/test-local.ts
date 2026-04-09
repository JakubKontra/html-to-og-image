/**
 * Local test script for OG image generation.
 *
 * Renders an example template to PNG using local Puppeteer.
 *
 * Usage:
 *   npm run test:local
 *
 * Output: test-output/example.png (1200x630)
 */

import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

const EXAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: system-ui, -apple-system, sans-serif;
      color: white;
    }
    .container { text-align: center; padding: 60px; }
    h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; line-height: 1.2; }
    p { font-size: 24px; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>An example OG image generated with html-to-og-image</p>
  </div>
</body>
</html>`;

async function main() {
  const outputDir = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\nRendering example template → ${outputDir}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1200, height: 630 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(EXAMPLE_HTML, { waitUntil: 'networkidle0', timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);

  const htmlPath = path.join(outputDir, 'example.html');
  fs.writeFileSync(htmlPath, EXAMPLE_HTML, 'utf-8');

  const outputPath = path.join(outputDir, 'example.png');
  await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 },
    path: outputPath,
  });

  await page.close();
  await browser.close();

  console.log(`  ✓ ${outputPath}`);
  console.log('\nDone! Open test-output/ to inspect the image.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
