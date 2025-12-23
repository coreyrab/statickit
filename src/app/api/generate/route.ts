import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateRateLimiter, checkRateLimit } from '@/lib/rate-limit';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { getGeminiClient } from '@/lib/user-api-key';

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

    // Get user's Gemini client (uses their BYOK key if configured, otherwise server key)
    const { genAI, isByok, user } = await getGeminiClient(userId);
    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    // BYOK users skip credit checks - they use their own API quota
    // Non-BYOK users need credits
    if (!isByok && !isAdmin) {
      if (!user) {
        return NextResponse.json(
          {
            error: 'Account required',
            message: 'Please sign in and add an API key or subscribe to a plan.',
          },
          { status: 403 }
        );
      }

      if (user.credits < 1) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            message: 'You have run out of credits. Please upgrade your plan or add your own API key to continue.',
            credits: user.credits,
          },
          { status: 402 } // Payment Required
        );
      }
    }

    const { image, mimeType, analysis, variationDescription, aspectRatio, isEdit, isBackgroundOnly } =
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

    if (isBackgroundOnly) {
      // Background-only mode - changes ONLY the background, protects everything else
      prompt = `BACKGROUND CHANGE ONLY - Replace the background while making the subject look naturally placed in the new environment.

BACKGROUND REQUEST:
${variationDescription}

=== WHAT TO PROTECT (KEEP IDENTICAL) ===

**PRODUCT/SUBJECT**: Must remain EXACTLY as shown:
- Same position, size, angle, and physical appearance
- Same colors, textures, and details
- Any text, logos, or branding unchanged
- Do NOT move, resize, or alter the product structure

**PEOPLE/MODELS**: Any people must remain EXACTLY as shown:
- Same pose, expression, and position
- Same clothing, hair, and facial features
- Do NOT alter any physical aspect of the person

=== WHAT TO ADAPT (FOR NATURAL INTEGRATION) ===

**LIGHTING ON SUBJECT**: Adjust the lighting ON the product/person to match the new environment:
- If the new background has warm sunlight, add warm light tones to the subject
- If the new background is cool/blue, adjust the subject's lighting accordingly
- Match the direction of light (if background has light from the left, subject should too)
- Add appropriate reflections, highlights, and ambient color from the new environment
- The goal is to make the subject look NATURALLY LIT by the new scene, not composited

**SHADOWS**: Update shadows to match the new environment:
- Shadow direction should match the new lighting
- Shadow softness should match the new ambient light
- Ground shadows should interact naturally with the new surface

=== BACKGROUND CHANGE ===
Replace the background/environment with: ${variationDescription}

OUTPUT REQUIREMENTS:
- The subject must look like they BELONG in the new environment
- Professional advertising quality
- Aspect ratio: ${aspectRatio}
- No visible compositing artifacts - seamless integration`;
    } else if (isEdit) {
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

          // Deduct 1 credit for successful generation (skip for BYOK users)
          if (!isByok && !isAdmin) {
            try {
              await convex.mutation(api.users.useCredits, { amount: 1 });
            } catch (creditError) {
              console.error('Failed to deduct credit:', creditError);
              // Continue anyway - don't block the user
            }
          }

          return NextResponse.json({ imageUrl, isByok });
        }
        if ('text' in part && part.text) {
          console.log('Text response:', part.text.substring(0, 100));
        }
      }
    }

    // If no image was generated, log the full response for debugging
    console.log('No image in response. Full response:', JSON.stringify(response, null, 2).substring(0, 500));

    // Return an error so frontend can mark the version as failed
    return NextResponse.json(
      { error: 'Image generation failed', details: 'The model could not generate an image. Try a different prompt or image.' },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('Generation error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to generate image', details: error?.message },
      { status: 500 }
    );
  }
}
