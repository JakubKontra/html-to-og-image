/**
 * Example: How to use og-image-generator-lambda
 *
 * This file shows how to create a Lambda handler with custom templates.
 * Each template receives arbitrary data and returns a complete HTML document.
 */
import { createHandler } from 'html-to-og-image';

const handler = createHandler({
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
    <h1>${data.title || 'Hello World'}</h1>
    <p>${data.description || 'An example OG image'}</p>
  </div>
</body>
</html>`,
  },
});

export { handler };
