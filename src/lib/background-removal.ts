"use client";

import { removeBackground as rembgRemoveBackground, subscribeToProgress, getCapabilities } from 'rembg-webgpu';

export interface BackgroundRemovalResult {
  blobUrl: string;
  base64: string;
  width: number;
  height: number;
  processingTimeSeconds: number;
}

export interface ProgressState {
  phase: 'idle' | 'downloading' | 'building' | 'processing' | 'ready' | 'error';
  progress: number;
  errorMsg?: string;
}

export { subscribeToProgress, getCapabilities };

/**
 * Remove background from an image using AI (runs entirely in browser via WebGPU/WASM)
 */
export async function removeImageBackground(
  imageUrl: string,
  onProgress?: (state: ProgressState) => void
): Promise<BackgroundRemovalResult> {
  // Set up progress tracking if callback provided
  let unsubscribe: (() => void) | undefined;
  if (onProgress) {
    unsubscribe = subscribeToProgress((state) => {
      onProgress({
        phase: state.phase as ProgressState['phase'],
        progress: state.progress,
        errorMsg: state.errorMsg,
      });
    });
  }

  try {
    // Signal processing start
    onProgress?.({ phase: 'processing', progress: 0 });

    const result = await rembgRemoveBackground(imageUrl);

    // Convert blob URL to base64 for storage/API compatibility
    const response = await fetch(result.blobUrl);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    onProgress?.({ phase: 'ready', progress: 100 });

    return {
      blobUrl: result.blobUrl,
      base64,
      width: result.width,
      height: result.height,
      processingTimeSeconds: result.processingTimeSeconds,
    };
  } finally {
    unsubscribe?.();
  }
}

/**
 * Convert a Blob to base64 string (without data URL prefix)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Check if background removal is supported on this device
 */
export async function checkBackgroundRemovalSupport(): Promise<{
  supported: boolean;
  device: 'webgpu' | 'wasm';
  dtype: 'fp16' | 'fp32';
}> {
  try {
    const capabilities = await getCapabilities();
    return {
      supported: true,
      device: capabilities.device as 'webgpu' | 'wasm',
      dtype: capabilities.dtype as 'fp16' | 'fp32',
    };
  } catch {
    return {
      supported: false,
      device: 'wasm',
      dtype: 'fp32',
    };
  }
}
