// OpenPanel analytics utility
// Provides type-safe event tracking with the window.op function

type AnalyticsEvents = {
  api_key_validated: { success: boolean };
  image_uploaded: { width: number; height: number; aspectRatio: string; fileSize: number };
  variations_generated: { count: number };
  image_generated: { tool: 'iterate' | 'background' | 'model' | 'resize' | 'edit' };
  tool_used: { tool: 'background' | 'model' | 'resize' | 'compare' };
  image_downloaded: { type: 'single' | 'batch' | 'all_sizes' };
  reference_image_uploaded: { tool: 'background' | 'model' | 'edit' };
  reference_image_used: { tool: 'background' | 'model' | 'edit' };
};

declare global {
  interface Window {
    op?: (method: string, ...args: unknown[]) => void;
  }
}

export function track<T extends keyof AnalyticsEvents>(
  event: T,
  properties: AnalyticsEvents[T]
): void {
  if (typeof window !== 'undefined' && window.op) {
    window.op('track', event, properties);
  }
}
