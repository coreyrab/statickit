import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import { analyzeRateLimiter, checkRateLimit } from '@/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

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

    const { image, mimeType, websiteUrl, additionalContext } = await request.json();

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Image and mimeType are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert advertising analyst. Analyze this static ad image and provide detailed information about it.

${websiteUrl ? `The advertiser's website is: ${websiteUrl}` : ''}
${additionalContext ? `\nADDITIONAL CONTEXT FROM ADVERTISER:\n${additionalContext}\n\nUse this context to better understand the product, target audience, and campaign goals.` : ''}

Please analyze the image and return a JSON object with the following structure:
{
  "product": "What product or service is being advertised",
  "brand_style": "Description of the brand's visual style and identity",
  "visual_elements": ["List of key visual elements in the ad"],
  "key_selling_points": ["List of key selling points or value propositions shown"],
  "target_audience": "Who this ad is targeting",
  "colors": ["List of dominant colors used"],
  "mood": "The overall mood or feeling of the ad"
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
