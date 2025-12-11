import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import { generalRateLimiter, checkRateLimit } from '@/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (200 requests/day for lighter operations)
    const rateLimitResult = await checkRateLimit(generalRateLimiter, userId, 'API requests');
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { shortPrompt, analysis } = await request.json();

    if (!shortPrompt) {
      return NextResponse.json(
        { error: 'Short prompt is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert advertising creative director. A user wants to create an ad variation and has provided a brief idea. Expand it into a detailed, specific prompt that would work well for AI image generation.

ORIGINAL AD INFO:
- Product: ${analysis?.product || 'Unknown product'}
- Brand Style: ${analysis?.brand_style || 'Modern'}
- Target Audience: ${analysis?.target_audience || 'General consumers'}
- Current Mood: ${analysis?.mood || 'Professional'}

USER'S BRIEF IDEA:
"${shortPrompt}"

Expand this into a detailed 2-3 sentence prompt that:
1. Keeps the product exactly the same
2. Adds specific details about lighting, setting, atmosphere, or context
3. Makes the scene vivid and easy to visualize
4. Stays true to the user's original intent

Return ONLY the expanded prompt text, no quotes, no explanation.`;

    const result = await model.generateContent(prompt);
    const expandedPrompt = result.response.text().trim();

    return NextResponse.json({ expandedPrompt });
  } catch (error) {
    console.error('Expand prompt error:', error);
    return NextResponse.json(
      { error: 'Failed to expand prompt' },
      { status: 500 }
    );
  }
}
