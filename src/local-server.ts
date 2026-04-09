/**
 * Local development server for testing OG image generation.
 *
 * Renders HTML to PNG using Puppeteer (local Chromium) and saves to disk.
 *
 * Usage:
 *   npm run dev:server
 *
 * Endpoints:
 *   POST /generate  — { html: string, outputKey: string, options?: { width, height } }
 *   GET  /static/*  — serves generated images
 */

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';

import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import type { RenderOptions } from './types';

const PORT = Number(process.env.OG_SERVER_PORT) || 3099;
const OUTPUT_DIR = path.resolve(__dirname, '..', 'test-output');

let browser: Browser | undefined;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1200, height: 630 },
    });
  }
  return browser;
}

interface GenerateRequest {
  html: string;
  outputKey: string;
  options?: RenderOptions;
}

async function generateImage(req: GenerateRequest): Promise<{ success: boolean; cdnUrl?: string; error?: string }> {
  const width = req.options?.width ?? 1200;
  const height = req.options?.height ?? 630;

  const b = await getBrowser();
  const page = await b.newPage();

  try {
    await page.setViewport({ width, height });
    await page.setContent(req.html, { waitUntil: 'networkidle0', timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);

    const filename = req.outputKey.replace(/\//g, '_');
    const outputPath = path.join(OUTPUT_DIR, filename);

    await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height },
      path: outputPath,
    });

    const cdnUrl = `http://localhost:${PORT}/static/${filename}`;
    console.log(`  Generated: ${cdnUrl}`);

    return { success: true, cdnUrl };
  } finally {
    await page.close();
  }
}

function serveStatic(filePath: string, res: http.ServerResponse) {
  const fullPath = path.join(OUTPUT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(fullPath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/static/')) {
    const filePath = req.url.replace('/static/', '').split('?')[0];
    serveStatic(filePath, res);
    return;
  }

  if (req.method === 'POST' && req.url === '/generate') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const event: GenerateRequest = JSON.parse(body);
        console.log(`\n  Request: ${event.outputKey}`);

        const result = await generateImage(event);

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify(result));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('  Error:', message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

server.listen(PORT, () => {
  console.log(`\n  OG Image local server running on http://localhost:${PORT}`);
  console.log(`  Images served at http://localhost:${PORT}/static/`);
  console.log(`  Output dir: ${OUTPUT_DIR}\n`);
  console.log(`  POST /generate with { html, outputKey, options? }\n`);
});

process.on('SIGINT', async () => {
  if (browser) await browser.close().catch(() => {});
  process.exit(0);
});
