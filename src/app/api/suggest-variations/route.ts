import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/user-api-key';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, analysis, aspectRatio, additionalContext, numVariations = 5 } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis is required' },
        { status: 400 }
      );
    }

    const { genAI } = createGeminiClient(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Calculate split: ~75% location iterations, ~25% person iterations
    const locationCount = Math.ceil(numVariations * 0.75);
    const personCount = numVariations - locationCount;

    const prompt = `You are an expert advertising creative director. Your job is to suggest ITERATIONS of a winning ad.

THE ITERATION FRAMEWORK:
Iterations = change ONE variable only. That's it.
- New location
- New person

Same message. Same product. New backdrop OR new model.

ORIGINAL AD ANALYSIS:
- Product/Service: ${analysis.product}
- Brand Style: ${analysis.brand_style}
- Visual Elements: ${analysis.visual_elements?.join(', ') || 'N/A'}
- Key Selling Points: ${analysis.key_selling_points?.join(', ') || 'N/A'}
- Target Audience: ${analysis.target_audience}
- Colors: ${analysis.colors?.join(', ') || 'N/A'}
- Current Mood: ${analysis.mood}
${additionalContext ? `\nADDITIONAL CONTEXT FROM ADVERTISER:\n${additionalContext}\n\nIMPORTANT: Use this context to tailor iterations to the specific campaign goals and target audience.` : ''}

GENERATE ${numVariations} ITERATIONS:

**LOCATION ITERATIONS** (${locationCount} iterations)
Same ad, new backdrop. The location must be VISUALLY DISTINCT.

Based on the product and current setting, suggest ${locationCount} alternative locations that:
1. Make sense for where someone would actually use this product
2. Are VISUALLY DIFFERENT from each other (not just slight variations)
3. Appeal to different lifestyle contexts within the target audience

BAD: Two locations with similar backgrounds (white wall → another white wall)
GOOD: Clearly different environments that tell different stories

Think about WHERE the target audience uses this product and suggest realistic, contextual locations.

**PERSON ITERATION** (${personCount} iteration${personCount > 1 ? 's' : ''})
If there's a person in the ad, suggest ${personCount > 1 ? 'different models' : 'a different model'} to reach new audience segments.

Test:
- Different ethnicities
- Different ages
- Different demographics
- Different styles (casual vs professional, etc.)

Make it VISUALLY DISTINCT. Don't go micro with minor differences.

CRITICAL RULES:
1. The product MUST remain EXACTLY the same - only change what's AROUND it
2. **SCREEN RULE**: If there's a screen in the image, the content on that screen must NOT change
3. Each iteration changes ONE variable only
4. Iterations must be VISUALLY DIFFERENT enough that the audience can tell them apart

Return a JSON array with exactly ${numVariations} iterations:
[
  {
    "title": "Short descriptive title (2-4 words)",
    "description": "Clear description of the change. Be specific about the new location or person. 1-2 sentences."
  }
]

Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse variations response');
    }

    const variations = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ variations });
  } catch (error) {
    console.error('Suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest variations' },
      { status: 500 }
    );
  }
}
