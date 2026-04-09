export interface RenderOptions {
  /** Viewport width in pixels (default: 1200) */
  width?: number;
  /** Viewport height in pixels (default: 630) */
  height?: number;
}

export type TemplateRenderer = (data: Record<string, unknown>) => string;

export interface HandlerConfig {
  templates: Record<string, TemplateRenderer>;
}

export interface OgImageEvent {
  templateId: string;
  outputKey: string;
  data: Record<string, unknown>;
  options?: RenderOptions;
}

export interface OgImageResult {
  success: boolean;
  cdnUrl?: string;
  error?: string;
}
