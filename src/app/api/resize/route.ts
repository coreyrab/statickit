import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import { resizeRateLimiter, checkRateLimit } from '@/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (100 resizes/day)
    const rateLimitResult = await checkRateLimit(resizeRateLimiter, userId, 'image resizes');
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { image, mimeType, targetWidth, targetHeight, targetRatio, analysis } =
      await request.json();

    if (!image || !mimeType || !targetWidth || !targetHeight || !targetRatio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Gemini 3 Pro Image for resizing to maintain high fidelity
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      } as any,
    });

    const prompt = `Resize and adapt this advertising image to a new aspect ratio.

TARGET DIMENSIONS: ${targetWidth}x${targetHeight} (${targetRatio})

=== ABSOLUTE RULES (NEVER BREAK) ===

**SCREEN PROTECTION**: If there is ANY screen in the image (laptop, phone, monitor, TV, tablet):
- The content displayed on that screen must remain EXACTLY the same
- Do NOT modify any UI, text, icons, or graphics shown on screens
- Screen content is SACRED and UNTOUCHABLE

**PRODUCT PROTECTION**: The main product/subject must remain identical:
- Same appearance, details, and proportions
- Same position relative to the frame center
- Any text, logos, or annotations unchanged

=== RESIZE GUIDELINES ===
1. Extend or crop the BACKGROUND only to fit ${targetRatio}
2. If taller (like 9:16), extend background vertically
3. If wider (like 16:9), extend background horizontally
4. Keep the product centered and fully visible
5. Maintain visual style and colors: ${analysis?.colors?.join(', ') || 'Original'}
6. Result should look native to ${targetRatio} format

Generate the resized version with background adaptation only.`;

    console.log('Resizing image to:', targetRatio);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: image,
        },
      },
      prompt,
    ]);

    const response = result.response;

    // Check for inline image data in the response
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if ('inlineData' in part && part.inlineData) {
          const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log('Resized image successfully to', targetRatio);
          return NextResponse.json({ imageUrl });
        }
      }
    }

    console.log('No image in resize response');
    return NextResponse.json(
      { error: 'Failed to resize image - no image returned' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Resize error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to resize image', details: error?.message },
      { status: 500 }
    );
  }
}
