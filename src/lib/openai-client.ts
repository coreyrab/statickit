import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

export type OpenAIImageModel = 'gpt-image-1' | 'gpt-image-1-mini';

export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

// Image generation helper (text → image)
export async function generateImageOpenAI(
  client: OpenAI,
  params: {
    prompt: string;
    model: OpenAIImageModel;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'low' | 'medium' | 'high' | 'auto';
  }
): Promise<string> {
  const response = await client.images.generate({
    model: params.model,
    prompt: params.prompt,
    n: 1,
    size: params.size || '1024x1024',
    quality: params.quality || 'auto',
  });

  // Handle both URL and base64 responses
  const imageData = response.data?.[0];
  if (!imageData) {
    throw new Error('No image data in response');
  }
  if (imageData.b64_json) {
    return imageData.b64_json;
  } else if (imageData.url) {
    // Fetch the URL and convert to base64
    const imageResponse = await fetch(imageData.url);
    const blob = await imageResponse.blob();
    const buffer = await blob.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  }

  throw new Error('No image URL or base64 data in response');
}

// Image editing helper (image + mask + prompt → edited image)
// This is the key endpoint for background/model changes
export async function editImageOpenAI(
  client: OpenAI,
  params: {
    image: string;        // Base64 PNG
    prompt: string;
    mask?: string;        // Base64 PNG with transparent areas = edit regions
    model: OpenAIImageModel;
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'low' | 'medium' | 'high';
  }
): Promise<string> {
  // Convert base64 to File objects for the API
  const imageBuffer = Buffer.from(params.image, 'base64');
  const imageFile = await toFile(imageBuffer, 'image.png', { type: 'image/png' });

  // Map sizes for edit endpoint (different from generate endpoint)
  // Edit endpoint supports: 256x256, 512x512, 1024x1024, 1536x1024, 1024x1536
  const mapToEditSize = (size?: string): '1024x1024' | '1536x1024' | '1024x1536' => {
    if (!size) return '1024x1024';
    if (size === '1792x1024') return '1536x1024'; // Closest landscape
    if (size === '1024x1792') return '1024x1536'; // Closest portrait
    return '1024x1024';
  };

  // Map our quality setting to OpenAI's quality parameter
  // OpenAI edit endpoint supports: 'low', 'medium', 'high', 'auto'
  const openaiQuality = params.quality || 'high';

  const editParams: OpenAI.Images.ImageEditParams = {
    model: params.model,
    image: imageFile,
    prompt: params.prompt,
    n: 1,
    size: mapToEditSize(params.size),
    quality: openaiQuality,
    // @ts-ignore - input_fidelity is supported but not in types yet
    input_fidelity: openaiQuality === 'low' ? 'low' : 'high',
  };

  // Add mask if provided
  if (params.mask) {
    const maskBuffer = Buffer.from(params.mask, 'base64');
    const maskFile = await toFile(maskBuffer, 'mask.png', { type: 'image/png' });
    editParams.mask = maskFile;
  }

  const response = await client.images.edit(editParams);

  // Handle both URL and base64 responses
  const imageData = response.data?.[0];
  if (!imageData) {
    throw new Error('No image data in response');
  }
  if (imageData.b64_json) {
    return imageData.b64_json;
  } else if (imageData.url) {
    // Fetch the URL and convert to base64
    const imageResponse = await fetch(imageData.url);
    const blob = await imageResponse.blob();
    const buffer = await blob.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  }

  throw new Error('No image URL or base64 data in response');
}

// Map StaticKit aspect ratios to OpenAI sizes
export function mapAspectRatioToOpenAISize(
  aspectRatio: string
): '1024x1024' | '1792x1024' | '1024x1792' {
  // Parse aspect ratio string like "1:1 (Square)" or "16:9 (Landscape)"
  const lowerRatio = aspectRatio.toLowerCase();

  if (lowerRatio.includes('1:1') || lowerRatio.includes('square')) {
    return '1024x1024';
  } else if (
    lowerRatio.includes('16:9') ||
    lowerRatio.includes('landscape') ||
    lowerRatio.includes('1.91:1')
  ) {
    return '1792x1024';
  } else if (
    lowerRatio.includes('9:16') ||
    lowerRatio.includes('story') ||
    lowerRatio.includes('4:5') ||
    lowerRatio.includes('portrait')
  ) {
    return '1024x1792';
  }

  // Default to square
  return '1024x1024';
}
