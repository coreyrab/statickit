import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { getGeminiClient } from '@/lib/user-api-key';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (50 analyses/day)
    const rateLimitResult = await checkRateLimit(analyzeRateLimiter, userId, 'image analyses');
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    // Get user's Gemini client (uses their BYOK key if configured)
    const { genAI } = await getGeminiClient(userId);

    const { image, mimeType, websiteUrl, additionalContext } = await request.json();

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Image and mimeType are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert photography and image analyst. Analyze this image and provide detailed information about its visual qualities.

${websiteUrl ? `Context - associated website: ${websiteUrl}` : ''}
${additionalContext ? `\nADDITIONAL CONTEXT:\n${additionalContext}\n` : ''}

Please analyze the image and return a JSON object with the following structure:
{
  "product": "The main subject or focus of the image (could be a product, person, scene, object, etc.)",
  "brand_style": "Description of the overall visual style and aesthetic",
  "visual_elements": ["List of key visual elements in the image"],
  "key_selling_points": ["Notable features or qualities of the subject"],
  "target_audience": "Who might be interested in this type of image or subject",
  "colors": ["List of dominant colors used"],
  "mood": "The overall mood or feeling of the image",
  "imageDescription": "A concise technical description of the image: describe the composition, lighting (natural, studio, dramatic, soft, etc.), color grading/tones, depth of field, and photographic style (1-2 sentences). Focus on HOW the image looks, not what it contains.",
  "backgroundDescription": "A detailed description of the background/environment/setting - describe the location, surfaces, textures, and atmosphere (1-2 sentences). If it's a plain/studio background, describe the color, gradient, and lighting style.",
  "subjectDescription": "If there's a person/model in the image, describe their appearance, pose, expression, clothing, and styling (1-2 sentences). If no person is present, return null."
}

Return ONLY the JSON object, no other text.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: image,
        },
      },
      prompt,
    ]);

    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse analysis response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
