import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/user-api-key';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, image, mimeType, analysis, existingSuggestions } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const { genAI } = createGeminiClient(apiKey);

    // Use vision model to analyze the image and suggest backgrounds
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build exclusion list if there are existing suggestions
    const exclusionNote = existingSuggestions && existingSuggestions.length > 0
      ? `\n\nIMPORTANT - DO NOT suggest any of these backgrounds (already suggested):\n${existingSuggestions.map((s: string) => `- ${s}`).join('\n')}\n\nYour suggestions must be COMPLETELY DIFFERENT from the above list.`
      : '';

    const prompt = `Analyze this advertising image and suggest 5 alternative background environments.

CURRENT IMAGE ANALYSIS:
${analysis ? `
- Product: ${analysis.product || 'Unknown'}
- Brand Style: ${analysis.brand_style || 'Unknown'}
- Target Audience: ${analysis.target_audience || 'Unknown'}
- Current Mood: ${analysis.mood || 'Unknown'}
` : 'No prior analysis available - analyze the image directly.'}
${exclusionNote}

YOUR TASK:
1. Identify the main subject/product in the image
2. Identify any people/models in the image
3. Consider where this product would naturally be used
4. Suggest 5 VISUALLY DISTINCT background environments

REQUIREMENTS FOR SUGGESTIONS:
- Each background must be contextually appropriate for the product/subject
- Backgrounds should be VISUALLY DISTINCT from each other
- Consider the target audience and lifestyle contexts
- The subject and any people will remain EXACTLY the same - only the background changes
- Suggest a mix of indoor and outdoor environments where appropriate

Return a JSON array with exactly 5 suggestions:
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

    // Ensure each suggestion has a unique id using timestamp
    const timestamp = Date.now();
    const suggestionsWithIds = suggestions.map((s: any, index: number) => ({
      id: `bg-${timestamp}-${index}`,
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
