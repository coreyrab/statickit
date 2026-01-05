import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/user-api-key';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, image, mimeType, analysis, variationDescription, aspectRatio, isEdit, isBackgroundOnly, isModelOnly, keepClothing } =
      await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (!image || !mimeType || !analysis || !variationDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { genAI } = createGeminiClient(apiKey);

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
      prompt = `BACKGROUND CHANGE ONLY - Replace the background while keeping the subject COMPLETELY FROZEN.

BACKGROUND REQUEST:
${variationDescription}

=== ABSOLUTE PROTECTION (NEVER CHANGE) ===

**POSE & POSITION ARE LOCKED**: The subject's body is PRE-RECORDED and CANNOT be altered:
- EXACT same pose - every limb, joint angle, and body position stays identical
- EXACT same position in frame - do not shift, rotate, or reposition
- EXACT same scale - do not resize the subject
- Think of this as green-screen compositing: the subject footage is LOCKED

**PEOPLE/MODELS**: Any people must remain EXACTLY as shown:
- Same pose, expression, and body position (NON-NEGOTIABLE)
- Same clothing, hair, and facial features
- CRITICAL: Preserve the EXACT facial features and identity - same face shape, eyes, nose, mouth, skin texture
- Do NOT alter any physical aspect of the person
- Faces must be recognizable as the same person

**PRODUCT/SUBJECT**: Must remain EXACTLY as shown:
- Same position, size, angle, and physical appearance
- Same colors, textures, and details
- Any text, logos, or branding unchanged

=== CRITICAL RULE: BACKGROUND ADAPTS TO POSE, NOT VICE VERSA ===

If the requested background seems incompatible with the subject's current pose:
- Do NOT adjust the pose to fit the background
- Instead, ADAPT your interpretation of the background to fit the existing pose
- Example: If subject is sitting but asked for "beach scene" → place them sitting on beach/sand/towel
- Example: If subject is standing indoors but asked for "forest" → place them on a forest path
- Example: If pose looks awkward for the scene → adjust the CAMERA ANGLE or CROP of the background, not the pose
- The background must work AROUND the frozen subject

=== WHAT TO ADAPT (FOR NATURAL INTEGRATION) ===

**LIGHTING ON SUBJECT**: Adjust the lighting ON the product/person to match the new environment:
- If the new background has warm sunlight, add warm light tones to the subject
- If the new background is cool/blue, adjust the subject's lighting accordingly
- Match the direction of light (if background has light from the left, subject should too)
- Add appropriate reflections, highlights, and ambient color from the new environment

**SHADOWS**: Update shadows to match the new environment:
- Shadow direction should match the new lighting
- Shadow softness should match the new ambient light
- Ground shadows should interact naturally with the new surface

=== BACKGROUND CHANGE ===
Replace the background/environment with: ${variationDescription}

OUTPUT REQUIREMENTS:
- Subject pose is IDENTICAL to reference (this is the #1 priority)
- Professional advertising quality
- Aspect ratio: ${aspectRatio}
- Seamless lighting integration between subject and new background`;
    } else if (isModelOnly) {
      // Model-only mode - changes ONLY the model/person, protects everything else
      const clothingInstruction = keepClothing
        ? 'The model must wear the EXACT same clothing as the original - same outfit, colors, fit, and styling. The clothes are part of the protected elements.'
        : 'The model may wear different clothing appropriate to their style, but should match the formality and context of the scene.';

      prompt = `MODEL/PERSON CHANGE ONLY - Replace the model while preserving everything else exactly.

MODEL CHANGE REQUEST:
${variationDescription}

=== ABSOLUTE PROTECTION RULES ===

**BACKGROUND**: Must remain EXACTLY as shown:
- Same setting, environment, and all background elements
- No changes to scenery, props, or surrounding objects
- Identical composition and spatial arrangement
- Same colors, textures, and details in the environment

**LIGHTING**: Must remain EXACTLY as shown:
- Same light direction, color temperature, and intensity
- Same shadow patterns and ambient lighting
- The new model must be lit IDENTICALLY to how the original model was lit
- No changes to the overall lighting mood or atmosphere

**PRODUCT**: Must remain EXACTLY as shown:
- Same position, size, angle, and appearance
- Same colors, textures, logos, and details
- Do NOT move, resize, or alter the product
- Any text or branding on the product stays identical

**POSE & POSITION**: The new model MUST match the original EXACTLY:
- IDENTICAL body pose - same arm positions, hand placement, body angle, stance
- IDENTICAL head position and tilt angle
- Occupy the exact same position in the frame
- Maintain the exact same relationship to other objects in the scene
- If sitting, sitting the same way. If standing, standing the same way.
- Mirror the original pose as precisely as possible

**FACIAL EXPRESSION**: The new model MUST have the SAME expression:
- IDENTICAL emotional expression (smiling, serious, contemplative, etc.)
- Same mouth position (open smile, closed smile, neutral, etc.)
- Same eye direction and gaze (looking at camera, looking away, looking down at product, etc.)
- Same overall facial energy and mood
- The expression should feel like the same moment captured with a different person

=== MODEL CHANGE ===

Replace the model/person with: ${variationDescription}

${clothingInstruction}

INTEGRATION REQUIREMENTS:
- The new model must match the EXACT same lighting as the original scene
- Shadows ON the model must match the environment's light direction
- Skin tones must respond naturally to the existing lighting color temperature
- The model should look naturally photographed in this setting, NOT composited
- Hair and skin should reflect the ambient light colors of the scene

=== PARTIAL BODY HANDLING ===
If the image shows only hands, arms, or partial body:
- Change only the visible body parts to match the description
- Match skin tone and characteristics as described
- Maintain exact same pose and position relative to product
- Keep any jewelry, watches, or accessories unless specifically asked to change

OUTPUT REQUIREMENTS:
- Professional advertising quality
- Aspect ratio: ${aspectRatio}
- Seamless, natural result - indistinguishable from original photography
- The model should look like they were actually photographed in this exact scene
- CRITICAL: The new model's pose and facial expression must MATCH the original exactly - same body language, same emotion, same gaze direction`;
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

**FACE PRESERVATION**: If any people are in the image:
- CRITICAL: Preserve the EXACT facial features and identity
- Same face shape, eyes, nose, mouth, jawline, and skin texture
- Same facial expression and gaze direction
- The person must be recognizable as the same individual
- Do NOT distort, morph, or alter facial proportions

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

**FACE PRESERVATION RULE**: If any people are in the reference image:
- CRITICAL: Preserve the EXACT facial features and identity
- Same face shape, eyes, nose, mouth, jawline, and skin texture
- Same facial expression and gaze direction
- The person must be recognizable as the same individual
- Do NOT distort, morph, or alter facial proportions
- Faces are as important to preserve as the product

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

          return NextResponse.json({ imageUrl });
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
