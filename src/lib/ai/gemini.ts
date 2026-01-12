import { GoogleGenerativeAI } from '@google/generative-ai';
import { AdAnalysis } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function analyzeAd(
  imageBase64: string,
  mimeType: string,
  websiteUrl?: string
): Promise<AdAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  const prompt = `You are an expert advertising analyst. Analyze this static ad image and provide detailed information about it.

${websiteUrl ? `The advertiser's website is: ${websiteUrl}` : ''}

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
        data: imageBase64,
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

  return JSON.parse(jsonMatch[0]) as AdAnalysis;
}

export async function generateVariationSuggestions(
  analysis: AdAnalysis,
  aspectRatio: string
): Promise<Array<{ title: string; description: string; icon: string }>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  const prompt = `You are an expert advertising creative director. Based on this ad analysis, suggest 5 creative variations that could improve ad performance through A/B testing.

Ad Analysis:
- Product: ${analysis.product}
- Brand Style: ${analysis.brand_style}
- Visual Elements: ${analysis.visual_elements.join(', ')}
- Key Selling Points: ${analysis.key_selling_points.join(', ')}
- Target Audience: ${analysis.target_audience}
- Current Mood: ${analysis.mood}

The variations should maintain the same product and brand identity but change the setting, context, or visual approach. Each variation should be distinct enough to test different audience responses.

Return a JSON array with exactly 5 variations in this format:
[
  {
    "title": "Short descriptive title (2-4 words)",
    "description": "Detailed description of the variation for image generation (2-3 sentences describing the scene, setting, lighting, and mood)",
    "icon": "A single emoji that represents this variation"
  }
]

Focus on variations like:
- Different settings (gym, office, outdoor, home, travel, etc.)
- Different contexts (morning routine, workout, relaxation, productivity)
- Different visual styles (minimal, bold colors, lifestyle, studio)
- Different moods (energetic, calm, professional, casual)

Return ONLY the JSON array, no other text.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Extract JSON from response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse variation suggestions');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generateAdVariation(
  originalImageBase64: string,
  originalMimeType: string,
  analysis: AdAnalysis,
  variationDescription: string,
  aspectRatio: string
): Promise<string> {
  // Use Gemini's image generation model (Imagen 3 via Gemini)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-05-20-image-generation',
  });

  const prompt = `Generate a new advertising image based on this reference ad.

Original Ad Analysis:
- Product: ${analysis.product}
- Brand Style: ${analysis.brand_style}
- Key Visual Elements to maintain: ${analysis.visual_elements.join(', ')}

NEW VARIATION REQUEST:
${variationDescription}

IMPORTANT GUIDELINES:
- Keep the same product prominently featured
- Maintain professional advertising quality
- Match the brand's visual style and colors
- The aspect ratio should be ${aspectRatio}
- Create a photorealistic, high-quality ad image
- Include subtle text overlays if the original had them

Generate a new ad image that matches this description while keeping the product and brand identity consistent.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: originalMimeType,
        data: originalImageBase64,
      },
    },
    prompt,
  ]);

  // Extract the generated image
  const response = result.response;

  // Check for inline image data in the response
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if ('inlineData' in part && part.inlineData) {
        return part.inlineData.data;
      }
    }
  }

  throw new Error('No image was generated');
}
