/**
 * Alibaba Cloud DashScope client for Wanxiang (Wan) Image Edit
 *
 * API Documentation: https://www.alibabacloud.com/help/en/model-studio/wan-image-generation-api-reference
 */

export type WanImageModel =
  | 'wan2.6-image'     // Latest model with image editing support
  | 'wan2.6-t2i';      // Text-to-image only

// DashScope API endpoints by region
const DASHSCOPE_ENDPOINTS = {
  international: 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  us: 'https://dashscope-us.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  beijing: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
} as const;

// Validation endpoints - using OpenAI-compatible mode which works across regions
const DASHSCOPE_VALIDATION_URLS = [
  'https://dashscope-us.aliyuncs.com/compatible-mode/v1/models',      // US (Virginia)
  'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',    // International (Singapore)
  'https://dashscope.aliyuncs.com/compatible-mode/v1/models',         // China (Beijing)
];

interface DashScopeImageContent {
  image: string; // URL or base64 data URL
}

interface DashScopeTextContent {
  text: string;
}

type DashScopeContent = DashScopeImageContent | DashScopeTextContent;

interface DashScopeMessage {
  role: 'user';
  content: DashScopeContent[];
}

interface DashScopeRequest {
  model: WanImageModel;
  input: {
    messages: DashScopeMessage[];
  };
  parameters?: {
    enable_interleave?: boolean; // false for image editing mode
    n?: number; // 1-4 for wan2.6-image
    size?: string; // "width*height" format, 384-5000
    prompt_extend?: boolean;
    negative_prompt?: string;
    seed?: number;
    watermark?: boolean;
  };
}

interface DashScopeResponse {
  output: {
    results: Array<{
      url?: string;
      b64_image?: string;
    }>;
  };
  usage?: {
    image_count: number;
  };
  request_id: string;
}

interface DashScopeErrorResponse {
  code: string;
  message: string;
  request_id?: string;
}

/**
 * Edit an image using Wanxiang (Wan) 2.6 Image via DashScope API
 */
export async function editImageDashScope(params: {
  apiKey: string;
  image: string; // Base64 image data (without data URL prefix)
  mimeType: string;
  prompt: string;
  model?: WanImageModel;
  width?: number;
  height?: number;
  negativePrompt?: string;
  seed?: number;
  // Optional reference images for multi-image editing
  referenceImages?: Array<{ base64: string; mimeType: string }>;
}): Promise<string> {
  const {
    apiKey,
    image,
    mimeType,
    prompt,
    model = 'wan2.6-image',
    width,
    height,
    negativePrompt,
    seed,
    referenceImages = [],
  } = params;

  // Build content array with images first, then prompt
  const content: DashScopeContent[] = [];

  // Add main image as base64 data URL
  content.push({
    image: `data:${mimeType};base64,${image}`,
  });

  // Add any reference images
  for (const ref of referenceImages) {
    content.push({
      image: `data:${ref.mimeType};base64,${ref.base64}`,
    });
  }

  // Add the text prompt
  content.push({
    text: prompt,
  });

  const requestBody: DashScopeRequest = {
    model,
    input: {
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    },
    parameters: {
      enable_interleave: false, // Required for image editing mode
      n: 1,
      prompt_extend: true, // Let Wan optimize the prompt
      watermark: false,
    },
  };

  // Add optional parameters
  if (width && height) {
    requestBody.parameters!.size = `${width}*${height}`;
  }
  if (negativePrompt) {
    requestBody.parameters!.negative_prompt = negativePrompt;
  }
  if (seed !== undefined) {
    requestBody.parameters!.seed = seed;
  }

  console.log(`DashScope request: model=${model}, prompt="${prompt.substring(0, 100)}..."`);

  // Try US endpoint first (for keys from us-east-1), then international
  const endpoints = [DASHSCOPE_ENDPOINTS.us, DASHSCOPE_ENDPOINTS.international];
  let response: Response | null = null;
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      // If we get a response (even an error), use it
      // Only retry on network/connection errors
      if (response) break;
    } catch (error) {
      lastError = error as Error;
      console.error(`DashScope endpoint ${endpoint} failed:`, error);
      // Try next endpoint
    }
  }

  if (!response) {
    throw lastError || new Error('All DashScope endpoints failed');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as DashScopeErrorResponse;
    console.error('DashScope error:', errorData);

    // Map error codes to user-friendly messages
    if (response.status === 401 || errorData.code === 'InvalidApiKey') {
      throw new Error('Invalid DashScope API key');
    }
    if (response.status === 429 || errorData.code === 'Throttling') {
      throw new Error('Rate limited. Please try again later.');
    }
    if (errorData.code === 'InvalidParameter') {
      throw new Error(`Invalid parameter: ${errorData.message}`);
    }

    throw new Error(errorData.message || `DashScope API error: ${response.status}`);
  }

  const data = await response.json() as DashScopeResponse;

  // Extract image from response
  const result = data.output?.results?.[0];
  if (!result) {
    throw new Error('No image in DashScope response');
  }

  // Handle base64 response
  if (result.b64_image) {
    return result.b64_image;
  }

  // Handle URL response - fetch and convert to base64
  if (result.url) {
    console.log('Fetching image from DashScope URL...');
    const imageResponse = await fetch(result.url);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch generated image from URL');
    }
    const blob = await imageResponse.blob();
    const buffer = await blob.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  }

  throw new Error('No image URL or base64 data in DashScope response');
}

/**
 * Validate an Alibaba Cloud API key by making minimal test requests
 * Tries multiple regional endpoints since keys may be region-specific
 * Uses OpenAI-compatible mode which works across all regions
 */
export async function validateDashScopeKey(apiKey: string): Promise<boolean> {
  // Try each regional endpoint - key may only work in specific region
  for (const url of DASHSCOPE_VALIDATION_URLS) {
    try {
      // Use the OpenAI-compatible models list endpoint to validate the key
      // This is a lightweight call that doesn't incur image generation costs
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        console.log(`Alibaba Cloud key validated successfully with ${url}`);
        return true;
      }

      // 401/403 means auth failed - try next endpoint
      // Other errors might be temporary, but we'll still try next endpoint
    } catch (error) {
      console.error(`Alibaba Cloud key validation error for ${url}:`, error);
      // Continue to next endpoint
    }
  }

  return false;
}

/**
 * Map StaticKit aspect ratios to DashScope size string
 * DashScope supports 512-2048 pixels per dimension
 */
export function mapAspectRatioToDashScopeSize(
  aspectRatio: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): { width: number; height: number } {
  // Base size based on quality
  const baseSize = {
    low: 512,
    medium: 1024,
    high: 1536,
  }[quality];

  // Parse aspect ratio
  const ratioMap: Record<string, [number, number]> = {
    '1:1': [1, 1],
    '16:9': [16, 9],
    '9:16': [9, 16],
    '4:5': [4, 5],
    '2:3': [2, 3],
  };

  const [w, h] = ratioMap[aspectRatio] || [1, 1];
  const maxDim = Math.max(w, h);
  const scale = baseSize / maxDim;

  return {
    width: Math.round(w * scale),
    height: Math.round(h * scale),
  };
}
