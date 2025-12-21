import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import { generateRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Admin emails that bypass credit checks
const ADMIN_EMAILS = ['coreyrab@gmail.com'];

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (10 generations/day for free tier)
    const rateLimitResult = await checkRateLimit(generateRateLimiter, userId, 'image generations');
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    // Check credits (skip for admin users)
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    if (!user) {
      // Create user if doesn't exist (first time)
      // This will be handled by the mutation
    } else if (!isAdmin && user.credits < 1) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: 'You have run out of credits. Please upgrade your plan to continue generating images.',
          credits: user.credits,
        },
        { status: 402 } // Payment Required
      );
    }

    const { image, mimeType, analysis, variationDescription, aspectRatio, isEdit } =
      await request.json();

    if (!image || !mimeType || !analysis || !variationDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Gemini 3 Pro Image - the latest high-fidelity image generation model
    // This model better preserves reference images and maintains product consistency
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      } as any,
    });

    // Different prompts for new generation vs. edit/refinement
    let prompt: string;

    if (isEdit) {
      // Edit/refinement prompt - focuses on making specific changes to the existing generated image
      prompt = `Edit this advertising image according to the following instructions.

EDIT REQUEST:
${variationDescription}

=== ABSOLUTE RULES ===

**SCREEN PROTECTION**: If there is ANY screen (laptop, phone, monitor, TV, tablet):
- Do NOT modify what is displayed on the screen
- Screen content must remain EXACTLY the same
- This is non-negotiable

**PRODUCT PROTECTION**: The product must stay identical:
- Same appearance, position, and details
- Any text, logos, or UI elements unchanged

=== EDIT GUIDELINES ===
1. ONLY make the specific change requested above
2. Keep overall composition the same
3. Maintain aspect ratio: ${aspectRatio}
4. Preserve brand style: ${analysis.brand_style}

Make ONLY the requested edit. Everything else stays exactly the same.`;
    } else {
      // New variation prompt - A/B test variations with screen protection
      prompt = `You are creating an A/B test variation of this ad. The product must remain EXACTLY the same - you are changing the environment, lighting, or context around it.

REFERENCE IMAGE: Contains "${analysis.product}"

VARIATION REQUESTED:
${variationDescription}

=== ABSOLUTE RULES (NEVER BREAK THESE) ===

**SCREEN PROTECTION RULE**: If the reference image contains ANY screen (laptop, phone, computer monitor, TV, tablet, smartwatch, or any digital display):
- The content shown on that screen must be COPIED EXACTLY - pixel for pixel
- Do NOT change any UI elements, text, icons, or graphics on the screen
- Do NOT change the screen's brightness, color temperature, or what is displayed
- The screen content is SACRED and UNTOUCHABLE
- This is the #1 most important rule

**PRODUCT PROTECTION RULE**: The product itself must be preserved exactly:
- Same appearance, same details, same colors
- Same size and position relative to the frame
- Any logos, text, or branding on the product stays identical
- Any annotations, arrows, or callouts stay in the same positions

=== WHAT YOU CAN CHANGE ===
Based on the variation request above, you may change:
- The background/environment/setting
- Lighting direction, color temperature, and mood
- Add human elements (hands, person) if requested
- Surface textures (desk material, table type)
- Surrounding objects and context
- Time of day / atmosphere

=== OUTPUT ===
Generate the variation that implements the requested change while keeping the product and any screens EXACTLY as they appear in the reference.`;
    }

    console.log('Generating image with prompt:', prompt.substring(0, 200) + '...');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: image,
        },
      },
      prompt,
    ]);

    // Extract the generated image from the response
    const response = result.response;

    console.log('Response candidates:', response.candidates?.length);

    // Check for inline image data in the response
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if ('inlineData' in part && part.inlineData) {
          // Return the base64 image as a data URL
          const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log('Generated image successfully');

          // Deduct 1 credit for successful generation
          try {
            await convex.mutation(api.users.useCredits, { amount: 1 });
          } catch (creditError) {
            console.error('Failed to deduct credit:', creditError);
            // Continue anyway - don't block the user
          }

          return NextResponse.json({ imageUrl });
        }
        if ('text' in part && part.text) {
          console.log('Text response:', part.text.substring(0, 100));
        }
      }
    }

    // If no image was generated, log the full response for debugging
    console.log('No image in response. Full response:', JSON.stringify(response, null, 2).substring(0, 500));

    // Return a placeholder for demo purposes
    return NextResponse.json({
      imageUrl: `https://placehold.co/400x500/6366f1/white?text=${encodeURIComponent(
        'Generated'
      )}`,
      note: 'Image generation model did not return an image',
    });
  } catch (error: any) {
    console.error('Generation error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to generate image', details: error?.message },
      { status: 500 }
    );
  }
}
