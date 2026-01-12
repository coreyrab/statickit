import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/user-api-key';
import { createOpenAIClient, editImageOpenAI, mapAspectRatioToOpenAISize, type OpenAIImageModel } from '@/lib/openai-client';

// Helper to determine if a model is from OpenAI
const isOpenAIModel = (model: string): model is OpenAIImageModel => {
  return model === 'gpt-image-1';
};

export async function POST(request: NextRequest) {
  try {
    const {
      apiKey, image, mimeType, analysis, variationDescription, aspectRatio,
      isEdit, isBackgroundOnly, isModelOnly, keepClothing,
      // Reference image params
      backgroundRefImage, backgroundRefMimeType,
      modelRefImage, modelRefMimeType,
      editRefImage, editRefMimeType,
      // Model selection
      model,
      // OpenAI-specific params
      openaiApiKey,
      mask, // Base64 PNG mask for OpenAI edit endpoint
    } = await request.json();

    // Determine which API key to use based on model
    const selectedModel = model || 'gemini-3-pro-image-preview';
    const useOpenAI = isOpenAIModel(selectedModel);

    // Validate API key for the selected provider
    if (useOpenAI && !openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key required for this model' }, { status: 400 });
    }
    if (!useOpenAI && !apiKey) {
      return NextResponse.json({ error: 'Gemini API key required for this model' }, { status: 400 });
    }

    if (!image || !mimeType || !analysis || !variationDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Route to OpenAI if using an OpenAI model
    if (useOpenAI) {
      return handleOpenAIGeneration({
        openaiApiKey,
        image,
        mask,
        variationDescription,
        aspectRatio,
        model: selectedModel as OpenAIImageModel,
        isEdit,
        isBackgroundOnly,
        isModelOnly,
        keepClothing,
        analysis,
      });
    }

    // Otherwise use Gemini
    const { genAI } = createGeminiClient(apiKey);

    // Use selected model (already determined above, defaults to Gemini 3 Pro Image)
    // Available models: gemini-3-pro-image-preview (default, best quality), gemini-2.5-flash-preview-05-20 (faster & cheaper)
    const generativeModel = genAI.getGenerativeModel({
      model: selectedModel,
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      } as any,
    });

    // Different prompts for new generation vs. edit/refinement
    let prompt: string;

    if (isBackgroundOnly) {
      if (backgroundRefImage) {
        // Reference-based background - extract background from reference and composite subject into it
        prompt = `BACKGROUND EXTRACTION & COMPOSITE - Extract the background from the REFERENCE IMAGE and place the subject into it.

You are given TWO images:
1. MAIN IMAGE (first): Contains the subject/product to preserve
2. REFERENCE IMAGE (second): Contains the target background/environment to extract

=== SUBJECT PROTECTION (FROM MAIN IMAGE) ===

**POSE & POSITION ARE LOCKED**: The subject's body is PRE-RECORDED and CANNOT be altered:
- EXACT same pose - every limb, joint angle, and body position stays identical
- EXACT same scale relative to the frame
- Think of this as green-screen compositing: the subject footage is LOCKED

**PEOPLE/MODELS**: Any people from the MAIN IMAGE must remain EXACTLY as shown:
- Same pose, expression, and body position (NON-NEGOTIABLE)
- Same clothing, hair, and facial features
- CRITICAL: Preserve the EXACT facial identity - same face shape, eyes, nose, mouth, skin texture

**PRODUCT/SUBJECT**: Must remain EXACTLY as shown in the MAIN IMAGE:
- Same position, size, angle, and physical appearance
- Same colors, textures, and details
- Any text, logos, or branding unchanged

=== BACKGROUND EXTRACTION (FROM REFERENCE IMAGE) ===

Extract and use the LITERAL background from the reference image:
- Use the actual environment, setting, and scenery from the reference
- Preserve the reference's lighting direction, color temperature, and atmosphere
- Match the perspective and depth of the reference scene
- The goal is to make it look like the subject was photographed IN that exact location

=== COMPOSITING RULES ===

1. Place the subject naturally within the reference background
2. Match lighting on subject to the reference environment's lighting
3. Add appropriate shadows that match the reference lighting direction
4. Scale subject appropriately for the reference scene's perspective
5. Blend edges seamlessly

Additional context from user: ${variationDescription || 'None'}

OUTPUT: Professional composite that looks like the subject was photographed in the reference location.
Aspect ratio: ${aspectRatio}`;
      } else {
        // Text-based background change - uses description to generate new background
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
      }
    } else if (isModelOnly) {
      // Model-only mode - changes ONLY the model/person, protects everything else
      const clothingInstruction = keepClothing
        ? 'The model must wear the EXACT same clothing as the original - same outfit, colors, fit, and styling. The clothes are part of the protected elements.'
        : 'The model may wear different clothing appropriate to their style, but should match the formality and context of the scene.';

      if (modelRefImage) {
        // Reference-based model swap - use the specific person from the reference image
        prompt = `EXACT PERSON SWAP - Use the SPECIFIC person from the REFERENCE IMAGE.

You are given TWO images:
1. MAIN IMAGE (first): Contains the scene, product, and composition to preserve
2. REFERENCE IMAGE (second): Contains the person whose likeness to use

=== USE THIS EXACT PERSON (FROM REFERENCE IMAGE) ===

From the reference image, extract and use this SPECIFIC person:
- Same face - identical facial features, bone structure, skin tone, and characteristics
- Same hair color, texture, and style
- Same body type and proportions
- This person must be RECOGNIZABLE as the same individual from the reference
- Do NOT create a generic person - use THIS SPECIFIC person

=== PRESERVE FROM MAIN IMAGE ===

**BACKGROUND**: Must remain EXACTLY as shown in the main image:
- Same setting, environment, and all background elements
- Identical composition and spatial arrangement

**LIGHTING**: Must remain EXACTLY as shown:
- Same light direction, color temperature, and intensity
- The reference person must be lit IDENTICALLY to how the original model was lit

**PRODUCT**: Must remain EXACTLY as shown:
- Same position, size, angle, and appearance
- Do NOT move, resize, or alter the product

**POSE & POSITION**: The reference person MUST match the original pose EXACTLY:
- IDENTICAL body pose - same arm positions, hand placement, body angle, stance
- IDENTICAL head position and tilt angle
- Occupy the exact same position in the frame
- Mirror the original pose as precisely as possible

**FACIAL EXPRESSION**: Match the ORIGINAL model's expression:
- Same emotional expression (smiling, serious, etc.)
- Same eye direction and gaze
- The expression should match the original, not the reference photo's expression

${clothingInstruction}

INTEGRATION: Light the reference person to match the main image's lighting perfectly.

OUTPUT: Professional result where the reference person appears in the main image's scene.
Aspect ratio: ${aspectRatio}`;
      } else {
        // Text-based model change
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
      }
    } else if (isEdit) {
      // Edit/refinement prompt - focuses on making specific changes to the existing generated image
      if (editRefImage) {
        // Edit with reference image - user describes how to use the reference
        prompt = `Edit this image according to the following instructions. A REFERENCE IMAGE is provided - use it as described in the edit request.

You are given TWO images:
1. MAIN IMAGE (first): The image to edit
2. REFERENCE IMAGE (second): Use this as described in the edit request below

EDIT REQUEST:
${variationDescription}

=== ABSOLUTE RULES ===

**SCREEN PROTECTION**: If there is ANY screen (laptop, phone, monitor, TV, tablet):
- Do NOT modify what is displayed on the screen
- Screen content must remain EXACTLY the same
- This is non-negotiable

**PRODUCT PROTECTION**: The product must stay identical unless the edit specifically requests changes:
- Same appearance, position, and details
- Any text, logos, or UI elements unchanged

**FACE PRESERVATION**: If any people are in the image:
- CRITICAL: Preserve the EXACT facial features and identity
- Same face shape, eyes, nose, mouth, jawline, and skin texture
- Same facial expression and gaze direction
- The person must be recognizable as the same individual
- Do NOT distort, morph, or alter facial proportions

=== REFERENCE IMAGE USAGE ===
- The REFERENCE IMAGE should be used as described in the edit request above
- Common uses: apply color grading/style, copy elements, match lighting, use as composition inspiration
- Apply the relevant aspects from the reference while maintaining the main image's integrity

=== EDIT GUIDELINES ===
1. Apply the requested edit using the reference as described
2. Keep overall composition similar unless specifically asked to change
3. Maintain aspect ratio: ${aspectRatio}
4. Preserve brand style: ${analysis.brand_style}

Make the requested edit while maintaining quality and coherence.`;
      } else {
        // Standard edit without reference
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
      }
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

    // Build content array - main image first, then reference if provided, then prompt
    const contentParts: any[] = [
      {
        inlineData: {
          mimeType,
          data: image,
        },
      },
    ];

    // Add reference image if provided (for background or model swap)
    if (backgroundRefImage && backgroundRefMimeType) {
      console.log('Including background reference image');
      contentParts.push({
        inlineData: {
          mimeType: backgroundRefMimeType,
          data: backgroundRefImage,
        },
      });
    }

    if (modelRefImage && modelRefMimeType) {
      console.log('Including model reference image');
      contentParts.push({
        inlineData: {
          mimeType: modelRefMimeType,
          data: modelRefImage,
        },
      });
    }

    if (editRefImage && editRefMimeType) {
      console.log('Including edit reference image');
      contentParts.push({
        inlineData: {
          mimeType: editRefMimeType,
          data: editRefImage,
        },
      });
    }

    // Add the prompt last
    contentParts.push(prompt);

    const result = await generativeModel.generateContent(contentParts);

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

// OpenAI generation handler
async function handleOpenAIGeneration(params: {
  openaiApiKey: string;
  image: string;
  mask?: string;
  variationDescription: string;
  aspectRatio: string;
  model: OpenAIImageModel;
  isEdit?: boolean;
  isBackgroundOnly?: boolean;
  isModelOnly?: boolean;
  keepClothing?: boolean;
  analysis: any;
}) {
  const {
    openaiApiKey,
    image,
    mask,
    variationDescription,
    aspectRatio,
    model,
    isEdit,
    isBackgroundOnly,
    isModelOnly,
    keepClothing,
    analysis,
  } = params;

  try {
    const client = createOpenAIClient(openaiApiKey);
    const size = mapAspectRatioToOpenAISize(aspectRatio);

    // Build a descriptive prompt for OpenAI
    let prompt: string;

    if (isBackgroundOnly) {
      prompt = `SUBJECT TO PRESERVE: ${analysis.product || 'The main subject/product'} - Do not change in any way. Preserve exact position, size, colors, textures, lighting on subject, and all fine details.
${analysis.people_description ? `PERSON TO PRESERVE: ${analysis.people_description} - Do not change face, facial features, skin tone, body shape, pose, expression, hair, or identity in any way. Preserve exact likeness and proportions.` : ''}

CHANGE ONLY THE BACKGROUND TO: ${variationDescription}

CONSTRAINTS:
- Replace only the background/environment behind the subject
- Match new background lighting naturally with preserved subject lighting
- Maintain original camera angle and framing
- No watermarks, no logos, no text additions
- Professional advertising photography quality`;
    } else if (isModelOnly) {
      const clothingInstruction = keepClothing
        ? 'CLOTHING TO PRESERVE: Keep the exact same clothing, fit, and styling on the new model.'
        : 'Dress the new model appropriately for the scene context.';

      prompt = `BACKGROUND TO PRESERVE: Keep the exact background, environment, and setting unchanged. Do not alter any background elements.
${analysis.product ? `PRODUCT TO PRESERVE: ${analysis.product} - Do not change in any way. Preserve exact position, appearance, and details.` : ''}

REPLACE THE PERSON WITH: ${variationDescription}

POSE REQUIREMENT: The new model must match the exact same pose, body position, and gesture as the original person.
${clothingInstruction}

CONSTRAINTS:
- Match lighting, shadows, and color temperature to integrate photorealistically
- Maintain original camera angle, framing, and composition
- New model should look naturally placed, not composited
- No watermarks, no logos, no text additions
- Professional advertising photography quality`;
    } else if (isEdit) {
      prompt = `ELEMENTS TO PRESERVE: Keep all aspects of the image unchanged EXCEPT for the specific edit requested below. Preserve exact composition, lighting, colors, and details of unchanged elements.
${analysis.product ? `PRODUCT: ${analysis.product} - Preserve unless edit specifically targets it.` : ''}
${analysis.people_description ? `PERSON: ${analysis.people_description} - Preserve face, identity, pose unless edit specifically targets them.` : ''}

SPECIFIC EDIT REQUESTED: ${variationDescription}

CONSTRAINTS:
- Change only what is explicitly requested above
- If there are screens (phones, laptops, monitors), preserve their content exactly
- Maintain original lighting style and color grading unless edit requests otherwise
- No watermarks, no logos, no text additions unless requested
- Professional advertising photography quality`;
    } else {
      // General variation - A/B test style changes
      prompt = `ELEMENTS TO PRESERVE:
${analysis.product ? `PRODUCT: ${analysis.product} - Do not change in any way. Preserve exact position, size, appearance, colors, textures, and all details.` : 'MAIN SUBJECT: Preserve the main subject exactly as shown.'}
${analysis.people_description ? `PERSON: ${analysis.people_description} - Do not change face, facial features, skin tone, body shape, pose, expression, hair, or identity in any way. Preserve exact likeness and proportions.` : ''}
${analysis.has_screen ? 'SCREEN CONTENT: Any screens (phone, laptop, monitor, tablet) must display exactly the same content. Do not modify UI, text, or graphics on screens.' : ''}

VARIATION REQUESTED: ${variationDescription}

CONSTRAINTS:
- Apply the requested variation while preserving all elements listed above
- Maintain original camera angle and composition
- If changing environment/background, integrate lighting naturally
- No watermarks, no logos, no text additions unless specifically requested
- Professional advertising photography quality`;
    }

    console.log('OpenAI generation with prompt:', prompt.substring(0, 200) + '...');
    console.log('Using model:', model, 'with mask:', !!mask);

    // Use the edit endpoint with mask if provided, otherwise without
    const resultBase64 = await editImageOpenAI(client, {
      image,
      prompt,
      mask,
      model,
      size,
    });

    const imageUrl = `data:image/png;base64,${resultBase64}`;
    console.log('OpenAI image generated successfully');

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('OpenAI generation error:', error?.message || error);

    // Handle specific OpenAI errors
    if (error?.status === 400) {
      return NextResponse.json(
        { error: 'Invalid request', details: error?.message || 'OpenAI rejected the request. Try a different prompt or image.' },
        { status: 400 }
      );
    }

    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key', details: 'Your OpenAI API key is invalid or expired.' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limited', details: 'OpenAI rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'OpenAI generation failed', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
