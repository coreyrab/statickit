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

// Maximum image dimension for mobile devices to prevent memory crashes
const MOBILE_MAX_DIMENSION = 1024;

/**
 * Detect if the current device is mobile
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for mobile user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Also check screen size as a fallback
  const isSmallScreen = window.innerWidth <= 768;

  return isMobileUA || isSmallScreen;
}

/**
 * Resize an image if it exceeds the maximum dimension (for mobile memory management)
 */
async function resizeImageIfNeeded(imageUrl: string, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const { width, height } = img;

      // Check if resizing is needed
      if (width <= maxDimension && height <= maxDimension) {
        resolve(imageUrl); // Return original if small enough
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let newWidth: number;
      let newHeight: number;

      if (width > height) {
        newWidth = maxDimension;
        newHeight = Math.round((height / width) * maxDimension);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round((width / height) * maxDimension);
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Return as data URL
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = imageUrl;
  });
}

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

    // On mobile, resize the image first to prevent memory crashes
    let processImageUrl = imageUrl;
    if (isMobileDevice()) {
      console.log('[Background Removal] Mobile device detected, resizing image...');
      processImageUrl = await resizeImageIfNeeded(imageUrl, MOBILE_MAX_DIMENSION);
    }

    const result = await rembgRemoveBackground(processImageUrl);

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
