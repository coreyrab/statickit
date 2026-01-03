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

    // Use vision model to analyze the image and suggest alternative models
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build exclusion list if there are existing suggestions
    const exclusionNote = existingSuggestions && existingSuggestions.length > 0
      ? `\n\nIMPORTANT - DO NOT suggest any of these model types (already suggested):\n${existingSuggestions.map((s: string) => `- ${s}`).join('\n')}\n\nYour suggestions must be COMPLETELY DIFFERENT from the above list.`
      : '';

    const prompt = `Analyze this advertising image and suggest 5 alternative models that would appeal to different target audiences.${exclusionNote}

CURRENT IMAGE ANALYSIS:
${analysis ? `
- Product: ${analysis.product || 'Unknown'}
- Brand Style: ${analysis.brand_style || 'Unknown'}
- Target Audience: ${analysis.target_audience || 'Unknown'}
- Current Mood: ${analysis.mood || 'Unknown'}
` : 'No prior analysis available - analyze the image directly.'}

YOUR TASK:
1. Identify the current model/person in the image (or note if only partial body like hands is visible)
2. Analyze the product and what demographics would naturally use it
3. Suggest 5 DIFFERENT models that would appeal to NEW target audiences
4. Each suggestion should help the product reach a different demographic

REQUIREMENTS FOR SUGGESTIONS:
- Each model should be DEMOGRAPHICALLY DIFFERENT (age, ethnicity, style)
- Consider who would realistically purchase/use this product
- Each model should feel authentic and relatable to their target audience
- If only hands/partial body visible, focus on skin tone, hand characteristics, jewelry style
- The background, lighting, product, and setting will remain EXACTLY the same - only the model changes
- Be specific about physical characteristics for image generation

Return a JSON array with exactly 5 suggestions:
[
  {
    "id": "model-1",
    "name": "Short descriptive name (e.g., 'Professional Woman, 30s')",
    "description": "Brief description of who this model represents and why they'd use this product",
    "audience": "Target demographic this appeals to (e.g., 'Career-focused millennials')",
    "prompt": "Detailed description for image generation: gender, approximate age, ethnicity, hair color and style, body type, facial expression, and any relevant style notes. Be specific enough for AI image generation. 2-3 sentences."
  }
]

Examples of good model prompts:
- "Young professional woman in her late 20s, East Asian, with shoulder-length black hair, slim build, confident smile, modern and polished appearance"
- "Middle-aged man around 45, Black/African American, short graying hair, athletic build, warm genuine expression, approachable demeanor"
- "Young adult woman, early 20s, Hispanic/Latina, long wavy brown hair, curvy figure, bright energetic smile, casual bohemian style"

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
      throw new Error('Failed to parse model suggestions response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Ensure each suggestion has required fields and unique ids
    const timestamp = Date.now();
    const suggestionsWithIds = suggestions.map((s: any, index: number) => ({
      id: `model-${timestamp}-${index}`,
      name: s.name || `Model ${index + 1}`,
      description: s.description || '',
      audience: s.audience || '',
      prompt: s.prompt || s.name,
    }));

    return NextResponse.json({ suggestions: suggestionsWithIds });
  } catch (error) {
    console.error('Model suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest models' },
      { status: 500 }
    );
  }
}
