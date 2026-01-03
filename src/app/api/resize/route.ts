import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/user-api-key';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, image, mimeType, targetWidth, targetHeight, targetRatio, originalWidth, originalHeight, analysis } =
      await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (!image || !mimeType || !targetWidth || !targetHeight || !targetRatio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { genAI } = createGeminiClient(apiKey);

    // Use same model as generate route for consistency
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      } as any,
    });

    // Calculate aspect ratios to determine transformation strategy
    const originalRatio = originalWidth && originalHeight ? originalWidth / originalHeight : 1.5; // Default to 3:2 if not provided
    const targetAspectRatio = targetWidth / targetHeight;

    // Determine what transformation is needed
    // If target is wider than original: need to extend horizontally
    // If target is taller than original: need to extend vertically
    // If target is narrower: smart crop horizontally (or extend vertically)
    // If target is shorter: smart crop vertically (or extend horizontally)
    const needsHorizontalExtension = targetAspectRatio > originalRatio;
    const needsVerticalExtension = targetAspectRatio < originalRatio;

    // Calculate the magnitude of change
    const ratioChange = targetAspectRatio / originalRatio;
    const isSignificantChange = ratioChange < 0.7 || ratioChange > 1.4;
    const isMinorChange = ratioChange >= 0.85 && ratioChange <= 1.15;

    // Determine if this is a vertical, horizontal, or square target
    const isVerticalTarget = targetAspectRatio < 0.8; // Story, Reel, TikTok
    const isSquareTarget = targetAspectRatio >= 0.8 && targetAspectRatio <= 1.2;
    const isHorizontalTarget = targetAspectRatio > 1.2;

    // Build smart transformation guidance based on actual change needed
    let formatGuidance: string;

    if (isMinorChange) {
      // Minor adjustment - can use smart crop with minimal extension
      formatGuidance = `This is a MINOR aspect ratio adjustment from ${originalRatio.toFixed(2)} to ${targetAspectRatio.toFixed(2)}.
         - Use intelligent CROPPING to achieve the target ratio
         - Keep the main subject centered and at full scale
         - Crop the edges that have the least important content
         - Only extend background if cropping would cut into the subject`;
    } else if (needsVerticalExtension) {
      // Target is taller/narrower than original - extend vertically
      formatGuidance = `This image needs VERTICAL EXTENSION to go from ${originalRatio.toFixed(2)} to ${targetAspectRatio.toFixed(2)} (${targetRatio}).
         - The original is WIDER than the target format
         - EXTEND the background ABOVE and BELOW the subject
         - You may also need to CROP slightly from the left/right edges
         - The subject should be positioned in the center of the frame
         - Add appropriate background content (sky above, ground/surface below, or continue existing background)
         - The subject should NOT be shrunk - keep it at the same scale
         - Imagine "zooming out" vertically to reveal more above and below`;
    } else if (needsHorizontalExtension) {
      // Target is wider than original - extend horizontally
      formatGuidance = `This image needs HORIZONTAL EXTENSION to go from ${originalRatio.toFixed(2)} to ${targetAspectRatio.toFixed(2)} (${targetRatio}).
         - The original is TALLER than the target format
         - EXTEND the background to the LEFT and RIGHT of the subject
         - You may also need to CROP slightly from the top/bottom edges
         - Add appropriate background content that matches the scene
         - The subject should NOT be shrunk - keep it at the same scale
         - Imagine "zooming out" horizontally to reveal more on the sides`;
    } else {
      // Fallback for edge cases
      formatGuidance = `Adapt this image to ${targetRatio} format.
         - Center the main subject
         - Extend or crop as needed to achieve the target ratio
         - Maintain the scale of the subject`;
    }

    // Add target format context
    const targetFormatNote = isVerticalTarget
      ? `Target: VERTICAL format (${targetRatio}) like Instagram Story or TikTok.`
      : isSquareTarget
      ? `Target: SQUARE format (${targetRatio}) like Instagram Post.`
      : `Target: HORIZONTAL format (${targetRatio}) like YouTube thumbnail.`;

    const prompt = `SMART RESIZE: Adapt this image to ${targetRatio} (${targetWidth}x${targetHeight}) format.
${targetFormatNote}

${formatGuidance}

=== CRITICAL RULES ===

**NEVER DUPLICATE THE SUBJECT**: There must be exactly ONE instance of the main subject.
- If there is 1 person in the original, there must be exactly 1 person in the output
- If there is 1 product in the original, there must be exactly 1 product in the output
- WRONG: Creating copies/duplicates of the subject to fill space
- RIGHT: Keeping the single subject and adjusting the background

**DO NOT SHRINK THE SUBJECT**: The main product/person must stay at the SAME SCALE.
- Wrong: Shrinking everything to fit the new ratio
- Right: Extending OR cropping background around the subject

**PROTECT THE SUBJECT EXACTLY**:
- People: Same pose, expression, clothing - DO NOT ADD MORE PEOPLE
- Products: Same appearance, logos, text - DO NOT ADD MORE PRODUCTS
- Screens: Content must be IDENTICAL

**PRESERVE LIGHTING & COLORS EXACTLY**:
- DO NOT change the lighting, color temperature, or exposure
- DO NOT add golden hour, sunset, or different time-of-day lighting
- DO NOT apply color grading or filters
- The extended/cropped areas must match the EXACT same lighting as the original
- If the original has cool/neutral lighting, keep it cool/neutral
- If the original is bright daylight, keep it bright daylight

**BACKGROUND TRANSFORMATION**:
- If EXTENDING: Generate new background content (sky, ground, walls, scenery) that matches the existing scene
- If CROPPING: Remove background edges while keeping the subject centered and fully visible
- The background must NOT contain copies of the subject
- Extended areas must have IDENTICAL lighting, colors, and visual style to the original
- The result should look natural and seamless - like the photo was originally taken in this format

=== OUTPUT ===
Generate a ${targetWidth}x${targetHeight} image with:
- EXACTLY ONE instance of the subject (no duplicates!)
- The subject at the same size/scale as the original
- Background extended or cropped as needed for the new aspect ratio
- Natural, seamless result that looks originally shot in ${targetRatio} format`;

    console.log('Resizing image:', {
      from: `${originalWidth}x${originalHeight} (${originalRatio.toFixed(2)})`,
      to: `${targetWidth}x${targetHeight} (${targetAspectRatio.toFixed(2)})`,
      target: targetRatio,
      strategy: isMinorChange ? 'SMART_CROP' : needsVerticalExtension ? 'EXTEND_VERTICAL' : needsHorizontalExtension ? 'EXTEND_HORIZONTAL' : 'ADAPTIVE',
      ratioChange: ratioChange.toFixed(2),
    });

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
