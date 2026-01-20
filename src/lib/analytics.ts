// OpenPanel analytics utility
// Provides type-safe event tracking with the window.op function

type AnalyticsEvents = {
  user_signed_up: { provider: string };
  api_key_validated: { success: boolean };
  image_uploaded: { width: number; height: number; aspectRatio: string; fileSize: number };
  variations_generated: { count: number };
  image_generated: { tool: 'iterate' | 'background' | 'model' | 'resize' | 'edit' | 'product'; type?: string };
  tool_used: { tool: 'background' | 'model' | 'resize' | 'compare' | 'product' };
  image_downloaded: { type: 'single' | 'batch' | 'all_sizes' };
  reference_image_uploaded: { tool: 'background' | 'model' | 'edit' | 'product' };
  reference_image_used: { tool: 'background' | 'model' | 'edit' | 'product' };
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

export function identify(userId: string, traits?: { email?: string; name?: string }): void {
  if (typeof window !== 'undefined' && window.op) {
    window.op('identify', { profileId: userId, ...traits });
  }
}
