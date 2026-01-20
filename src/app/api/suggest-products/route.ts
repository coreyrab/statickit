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

    // Use vision model to analyze the product image and suggest edits
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build exclusion list if there are existing suggestions
    const exclusionNote = existingSuggestions && existingSuggestions.length > 0
      ? `\n\nIMPORTANT - DO NOT suggest any of these edits (already suggested):\n${existingSuggestions.map((s: string) => `- ${s}`).join('\n')}\n\nYour suggestions must be COMPLETELY DIFFERENT from the above list.`
      : '';

    const prompt = `Analyze this product image and suggest 5 product photography edits optimized for e-commerce and marketing.

CURRENT IMAGE ANALYSIS:
${analysis ? `
- Product: ${analysis.product || 'Unknown'}
- Brand Style: ${analysis.brand_style || 'Unknown'}
- Target Audience: ${analysis.target_audience || 'Unknown'}
- Current Mood: ${analysis.mood || 'Unknown'}
- Visual Elements: ${analysis.visual_elements?.join(', ') || 'Unknown'}
` : 'No prior analysis available - analyze the image directly.'}
${exclusionNote}

YOUR TASK:
1. Identify the main product in the image
2. Analyze its current presentation (background, lighting, context)
3. Consider e-commerce and marketing best practices
4. Suggest 5 SPECIFIC, ACTIONABLE product photography improvements

REQUIREMENTS FOR SUGGESTIONS:
- Each suggestion should be distinct and address a different aspect (isolation, background, lighting, presentation, enhancement)
- Focus on professional product photography techniques
- Suggestions should help the product stand out in e-commerce listings or marketing materials
- Be specific about the technique or change to apply
- Consider the product type and brand positioning

CRITICAL PRODUCT PRESERVATION RULES (include in all prompts):
- Product shape, proportions, form: EXACT match
- Labels, text, typography: EXACT match, readable
- Colors and branding: EXACT match
- No distortion, deformation, or redesign

Return a JSON array with exactly 5 suggestions:
[
  {
    "id": "unique-id-1",
    "name": "Short name (2-4 words)",
    "prompt": "Detailed description of the product edit for image generation. Be specific about the technique, lighting, or change. Include the product preservation rules. 2-3 sentences."
  }
]

Examples of good suggestions:
- "Isolate on white" - "Remove all background elements. Place product on pure white (#FFFFFF) background with subtle shadow. Professional e-commerce hero shot."
- "Add premium reflection" - "Add glossy surface reflection beneath product creating mirror effect. Premium showcase presentation."
- "Dramatic side lighting" - "Apply dramatic side lighting from the left with deep shadows and rim highlight. High-end advertising look."
- "Lifestyle context" - "Place product in natural lifestyle setting appropriate for the brand. Warm ambient lighting."
- "Enhance materials" - "Enhance visual quality of product materials - sharper details, better texture visibility, cleaner surfaces."

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
      throw new Error('Failed to parse product suggestions response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Ensure each suggestion has a unique id using timestamp
    const timestamp = Date.now();
    const suggestionsWithIds = suggestions.map((s: any, index: number) => ({
      id: `product-${timestamp}-${index}`,
      name: s.name,
      prompt: s.prompt,
    }));

    return NextResponse.json({ suggestions: suggestionsWithIds });
  } catch (error) {
    console.error('Product suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest product edits' },
      { status: 500 }
    );
  }
}
