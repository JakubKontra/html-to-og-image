import type { Handler } from 'aws-lambda';
import type { OgImageEvent, OgImageResult, HandlerConfig } from './types';
import { renderHtmlToImage } from './renderer';
import { uploadToS3 } from './utils';

export function createHandler(config: HandlerConfig): Handler<OgImageEvent, OgImageResult> {
  return async (event) => {
    const { templateId, outputKey, data, options } = event;

    console.log('[OG Image] Generating:', templateId, outputKey);

    const renderer = config.templates[templateId];
    if (!renderer) {
      return { success: false, error: `Unknown template: ${templateId}` };
    }

    try {
      const html = renderer(data);
      const buffer = await renderHtmlToImage(html, options);
      const cdnUrl = await uploadToS3(buffer, outputKey);

      console.log('[OG Image] Generated successfully:', cdnUrl);
      return { success: true, cdnUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[OG Image] Error:', message);
      return { success: false, error: message };
    }
  };
}

export { renderHtmlToImage, closeBrowser } from './renderer';
export { uploadToS3 } from './utils';
export type {
  OgImageEvent,
  OgImageResult,
  RenderOptions,
  HandlerConfig,
  TemplateRenderer,
} from './types';
