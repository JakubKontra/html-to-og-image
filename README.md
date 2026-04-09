# html-to-og-image

Convert any HTML to Open Graph images on AWS Lambda. Bring your own template, get a PNG back.

Uses [Puppeteer](https://pptr.dev/) + [@sparticuz/chromium](https://github.com/Sparticuz/chromium) to render your HTML in a headless browser and screenshot it as a 1200x630 PNG — the standard OG image size.

## Install

```bash
npm install html-to-og-image
```

## Quick Start

Create a Lambda handler with your own HTML templates:

```ts
import { createHandler } from 'html-to-og-image';

export const handler = createHandler({
  templates: {
    'blog-post': (data) => `<!DOCTYPE html>
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
      font-family: system-ui, sans-serif;
      color: white;
    }
    h1 { font-size: 48px; font-weight: 700; }
    p { font-size: 24px; opacity: 0.8; }
  </style>
</head>
<body>
  <div style="text-align: center; padding: 60px;">
    <h1>${data.title}</h1>
    <p>${data.description}</p>
  </div>
</body>
</html>`,
  },
});
```

Invoke the Lambda with:

```json
{
  "templateId": "blog-post",
  "outputKey": "og-images/my-post.png",
  "data": {
    "title": "My Blog Post",
    "description": "A short summary of the post"
  }
}
```

The handler renders the HTML, takes a screenshot, uploads the PNG to S3, and returns:

```json
{
  "success": true,
  "cdnUrl": "https://cdn.example.com/og-images/my-post.png"
}
```

## API

### `createHandler(config)`

Creates an AWS Lambda handler from a map of template renderers.

```ts
import { createHandler } from 'html-to-og-image';

const handler = createHandler({
  templates: {
    'my-template': (data) => `<!DOCTYPE html>...`,
  },
});
```

**Lambda event shape:**

| Field | Type | Description |
|-------|------|-------------|
| `templateId` | `string` | Key in the `templates` map |
| `outputKey` | `string` | S3 key for the generated PNG |
| `data` | `Record<string, unknown>` | Passed to the template function |
| `options.width` | `number` | Viewport width (default: `1200`) |
| `options.height` | `number` | Viewport height (default: `630`) |

### `renderHtmlToImage(html, options?)`

Core rendering function. Takes a complete HTML string and returns a PNG `Buffer`. Use this if you want to handle storage yourself.

```ts
import { renderHtmlToImage } from 'html-to-og-image';

const html = `<!DOCTYPE html><html>...</html>`;
const pngBuffer = await renderHtmlToImage(html);
// or with custom dimensions:
const pngBuffer = await renderHtmlToImage(html, { width: 800, height: 400 });
```

### `uploadToS3(buffer, key)`

Uploads a PNG buffer to S3 and optionally invalidates the CloudFront cache.

```ts
import { uploadToS3 } from 'html-to-og-image';

const cdnUrl = await uploadToS3(pngBuffer, 'og-images/my-image.png');
```

### `closeBrowser()`

Explicitly close the reusable Chromium instance. Not required — the browser is reused across warm Lambda invocations and cleaned up when the container shuts down.

## Environment Variables

Required for `uploadToS3` and `createHandler`:

| Variable | Description |
|----------|-------------|
| `PUBLIC_BUCKET_NAME` | S3 bucket name |
| `CDN_URL` | Base URL for the CDN (e.g. `https://cdn.example.com`) |

Optional:

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | AWS region (default: `eu-central-1`) |
| `CDN_DISTRIBUTION_ID` | CloudFront distribution ID for cache invalidation |

> `renderHtmlToImage` works without any environment variables — it just needs Chromium.

## Templates

Templates are plain functions: `(data) => string`. You have full control over the HTML. Use any CSS framework, inline styles, web fonts, SVGs — anything a browser can render.

**Tips:**

- Set `body` to exactly `1200x630px` with `overflow: hidden`
- Use `system-ui` or inline web fonts (external font loading works but adds latency)
- Tailwind works — just include the CDN script in your `<head>`
- Images via URL work (`<img src="https://...">`) — Puppeteer waits for `networkidle0`

## Deployment

### Lambda (Docker)

Build the deployment package:

```bash
npm run build
./docker-build.sh
```

This produces `function.zip` containing the compiled code, `node_modules`, and Chromium binaries for x86_64 Lambda.

### Lambda Configuration

- **Runtime:** Node.js 22.x
- **Architecture:** x86_64
- **Memory:** 1536 MB+ recommended (Chromium needs memory)
- **Timeout:** 30s+
- **Handler:** point to your file that exports the handler from `createHandler()`

## Local Development

```bash
# Render an example to test-output/example.png
npm run test:local

# Start a local server on port 3099
npm run dev:server
```

The dev server accepts POST requests at `/generate`:

```bash
curl -X POST http://localhost:3099/generate \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<!DOCTYPE html><html><body style=\"width:1200px;height:630px;background:#667eea;display:flex;align-items:center;justify-content:center;color:white;font-family:system-ui\"><h1>Hello</h1></body></html>",
    "outputKey": "test.png"
  }'
```

## License

MIT
