/**
 * Mask utilities for OpenAI image editing
 *
 * OpenAI's edit endpoint uses masks where:
 * - Transparent areas (alpha = 0) = regions to EDIT
 * - Opaque areas (alpha = 255) = regions to KEEP
 *
 * StaticKit's rembg produces:
 * - Opaque areas = the subject
 * - Transparent areas = the background
 *
 * So for background editing, we can use rembg output directly (background is already transparent)
 * For subject editing (model swap), we need to invert the mask
 */

/**
 * Invert the alpha channel of a base64 PNG image
 * Used to flip which areas are marked for editing
 */
export async function invertMaskAlpha(base64Png: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Invert alpha channel (every 4th byte starting at index 3)
        for (let i = 3; i < data.length; i += 4) {
          data[i] = 255 - data[i];
        }

        ctx.putImageData(imageData, 0, 0);

        // Return base64 without the data URL prefix
        const result = canvas.toDataURL('image/png').split(',')[1];
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for mask inversion'));
    };

    // Handle both raw base64 and data URL format
    if (base64Png.startsWith('data:')) {
      img.src = base64Png;
    } else {
      img.src = `data:image/png;base64,${base64Png}`;
    }
  });
}

/**
 * Create a mask for background editing from a subject mask
 * The rembg output already has background as transparent, so this is mostly a pass-through
 * but ensures the format is correct for OpenAI
 */
export async function createBackgroundEditMask(subjectMaskBase64: string): Promise<string> {
  // For background editing:
  // - We want to EDIT the background (should be transparent in mask)
  // - We want to KEEP the subject (should be opaque in mask)
  // rembg output: subject=opaque, background=transparent
  // This is exactly what OpenAI needs! Just ensure it's properly formatted.

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw the mask as-is (rembg format is already correct for background editing)
        ctx.drawImage(img, 0, 0);

        const result = canvas.toDataURL('image/png').split(',')[1];
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load mask image'));
    };

    if (subjectMaskBase64.startsWith('data:')) {
      img.src = subjectMaskBase64;
    } else {
      img.src = `data:image/png;base64,${subjectMaskBase64}`;
    }
  });
}

/**
 * Create a mask for subject/model editing from a subject mask
 * Need to invert so the subject area becomes transparent (editable)
 */
export async function createSubjectEditMask(subjectMaskBase64: string): Promise<string> {
  // For subject/model editing:
  // - We want to EDIT the subject (should be transparent in mask)
  // - We want to KEEP the background (should be opaque in mask)
  // rembg output: subject=opaque, background=transparent
  // Need to INVERT: subject=transparent, background=opaque

  return invertMaskAlpha(subjectMaskBase64);
}

/**
 * Create a full-image edit mask (everything editable)
 * Used when we want to edit the entire image without restrictions
 */
export function createFullEditMask(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Fill with fully transparent pixels (everything is editable)
  ctx.clearRect(0, 0, width, height);

  return canvas.toDataURL('image/png').split(',')[1];
}

/**
 * Get image dimensions from base64
 */
export async function getImageDimensions(
  base64: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    if (base64.startsWith('data:')) {
      img.src = base64;
    } else {
      img.src = `data:image/png;base64,${base64}`;
    }
  });
}
