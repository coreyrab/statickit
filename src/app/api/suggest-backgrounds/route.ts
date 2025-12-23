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

    // Check rate limit
    const rateLimitResult = await checkRateLimit(generalRateLimiter, userId, 'API requests');
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const { image, mimeType, analysis } = await request.json();

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Use vision model to analyze the image and suggest backgrounds
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this advertising image and suggest 6 alternative background environments.

CURRENT IMAGE ANALYSIS:
${analysis ? `
- Product: ${analysis.product || 'Unknown'}
- Brand Style: ${analysis.brand_style || 'Unknown'}
- Target Audience: ${analysis.target_audience || 'Unknown'}
- Current Mood: ${analysis.mood || 'Unknown'}
` : 'No prior analysis available - analyze the image directly.'}

YOUR TASK:
1. Identify the main subject/product in the image
2. Identify any people/models in the image
3. Consider where this product would naturally be used
4. Suggest 6 VISUALLY DISTINCT background environments

REQUIREMENTS FOR SUGGESTIONS:
- Each background must be contextually appropriate for the product/subject
- Backgrounds should be VISUALLY DISTINCT from each other
- Consider the target audience and lifestyle contexts
- The subject and any people will remain EXACTLY the same - only the background changes
- Suggest a mix of indoor and outdoor environments where appropriate

Return a JSON array with exactly 6 suggestions:
[
  {
    "id": "unique-id-1",
    "name": "Short name (2-4 words)",
    "prompt": "Detailed description of the background environment for image generation. Be specific about lighting, atmosphere, and setting details. 2-3 sentences."
  }
]

Examples of good suggestions:
- "Modern loft apartment with exposed brick walls and large windows, warm afternoon light streaming in"
- "Minimalist white studio with soft gradient background and professional lighting setup"
- "Outdoor cafe terrace on a sunny day with blurred city street in background"
- "Cozy home office with bookshelves and warm desk lamp lighting"

Return ONLY the JSON array, no other text.`;

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
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse background suggestions response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Ensure each suggestion has an id
    const suggestionsWithIds = suggestions.map((s: any, index: number) => ({
      id: s.id || `bg-suggestion-${index}`,
      name: s.name,
      prompt: s.prompt,
    }));

    return NextResponse.json({ suggestions: suggestionsWithIds });
  } catch (error) {
    console.error('Background suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest backgrounds' },
      { status: 500 }
    );
  }
}
