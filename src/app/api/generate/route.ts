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
      // Quality setting (low/medium/high)
      quality,
      // OpenAI-specific params
      openaiApiKey,
      mask, // Base64 PNG mask for OpenAI edit endpoint
    } = await request.json();

    // Calculate output dimensions based on quality setting
    const getOutputDimensions = (quality: string, aspectRatio: string) => {
      const baseSize = { low: 512, medium: 1024, high: 1536 }[quality as 'low' | 'medium' | 'high'] || 1024;
      const ratioMap: Record<string, [number, number]> = {
        '1:1': [1, 1], '16:9': [16, 9], '9:16': [9, 16], '4:5': [4, 5], '2:3': [2, 3],
      };
      const [w, h] = ratioMap[aspectRatio] || [1, 1];
      const scale = baseSize / Math.max(w, h);
      return { width: Math.round(w * scale), height: Math.round(h * scale) };
    };

    const outputDimensions = getOutputDimensions(quality || 'medium', aspectRatio);

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
        quality: quality || 'medium',
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
    // Available models: gemini-3-pro-image-preview (default, best quality), gemini-2.5-flash-image (faster & cheaper)
    const generativeModel = genAI.getGenerativeModel({
      model: selectedModel,
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      } as any,
    });

    console.log(`Generating with quality=${quality || 'medium'}, dimensions=${outputDimensions.width}x${outputDimensions.height}`);

    // Gemini/Imagen prompts - narrative style with photographic language
    // Best practices: Describe scenes narratively, use photography terminology, be evocative
    let prompt: string;

    if (isBackgroundOnly) {
      if (backgroundRefImage) {
        // Reference-based background composite
        prompt = `Composite the subject from the first image into the environment shown in the second image.

The subject is frozen in place—think green-screen compositing where the footage is locked. Preserve their exact pose, position, scale, and every detail including facial features, expression, clothing, and any product they're holding.

Extract the background from the reference image: the environment, scenery, lighting direction, color temperature, and atmospheric quality. The goal is a seamless photograph where it appears the subject was actually shot on location.

Light the subject to match the environment naturally. If the reference has warm afternoon sunlight from the left, cast that same golden light onto the subject with matching shadows. Blend edges softly where subject meets background.

${variationDescription ? `Additional direction: ${variationDescription}` : ''}

Deliver a professional advertising photograph at ${aspectRatio} aspect ratio.`;
      } else {
        // Text-based background change
        prompt = `Replace the background behind the subject with: ${variationDescription}

The subject is frozen—same pose, position, scale, expression, and every physical detail preserved exactly as photographed. Their face must remain recognizable as the same person. Any product remains identical in appearance and position.

The background adapts to the subject, not vice versa. If they're sitting, place them sitting naturally in the new environment. Adjust the camera angle of the background scene rather than the subject's pose.

Match the lighting on the subject to the new environment. If you're placing them in warm sunset light, cast that golden glow on their skin with appropriate shadow direction. If the new scene is cool and overcast, adjust accordingly. Ground shadows should interact naturally with the new surface.

Deliver a seamless professional photograph at ${aspectRatio} aspect ratio where subject and environment feel naturally integrated.`;
      }
    } else if (isModelOnly) {
      const clothingNote = keepClothing
        ? 'The new model wears the exact same clothing—same outfit, colors, fit, and styling.'
        : 'Dress the new model appropriately for the scene context and their personal style.';

      if (modelRefImage) {
        // Reference-based model swap
        prompt = `Replace the person in the first image with the specific individual shown in the second image.

Use THIS exact person from the reference—their face, bone structure, skin tone, hair color and texture, body type. They must be recognizable as the same individual, not a generic person.

Everything else from the main image stays locked: the background, environment, product position and appearance, lighting setup, and composition. The scene is unchanged.

The new person must match the original model's exact pose—same arm positions, body angle, stance, and head tilt. Match the original expression too: same emotional quality, same gaze direction. ${clothingNote}

Light them identically to how the original model was lit. Their skin should respond to the same color temperature and light direction. They should look naturally photographed in this scene, not composited.

Deliver a seamless professional photograph at ${aspectRatio} aspect ratio.`;
      } else {
        // Text-based model change
        prompt = `Replace the model with: ${variationDescription}

The scene is frozen—background, environment, product, lighting, and composition remain exactly as photographed. Only the person changes.

The new model must match the original pose precisely: same body position, arm placement, stance, and head angle. Mirror the original expression—same emotional quality, gaze direction, and energy. This should feel like the same moment captured with a different person.

${clothingNote}

Light them identically to the original. Their skin tones respond to the same color temperature, shadows fall in the same direction. They look naturally photographed here, not digitally inserted.

If only hands or partial body are visible, change just those elements while maintaining exact pose and position relative to any product.

Deliver a seamless professional advertising photograph at ${aspectRatio} aspect ratio.`;
      }
    } else if (isEdit) {
      if (editRefImage) {
        // Edit with reference image
        prompt = `Edit this advertising image using the reference provided.

Edit requested: ${variationDescription}

Apply the relevant qualities from the reference image—whether that's color grading, lighting style, compositional elements, or atmosphere—while keeping the main image's integrity intact.

Protected elements: Any screens display their original content exactly. The product stays identical in appearance and position. Any people retain their exact facial features, expression, and identity—they must remain recognizable as the same person.

Maintain the ${analysis.brand_style || 'brand'} aesthetic at ${aspectRatio} aspect ratio.`;
      } else {
        // Standard edit without reference
        prompt = `Edit this advertising image: ${variationDescription}

Make only this specific change. Everything else stays exactly as photographed.

Protected elements: Screen content preserved exactly. Product appearance and position unchanged. Any people keep their exact facial features, expression, and identity—recognizable as the same person.

Maintain the ${analysis.brand_style || 'brand'} aesthetic and composition at ${aspectRatio} aspect ratio.`;
      }
    } else {
      // A/B test variation
      prompt = `Create an A/B test variation of this ${analysis.product || 'product'} advertisement.

Variation requested: ${variationDescription}

The product is sacred—preserve its exact appearance, position, colors, textures, and any text or branding. If there's a screen, its content remains pixel-perfect. Any people keep their exact face, features, expression, and identity.

You may change: background environment, lighting direction and color temperature, surrounding context, surface materials, time of day, atmospheric mood.

Make the variation feel like an intentional creative direction—natural and photographically coherent, not digitally manipulated. Professional advertising quality.`;
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
  quality: 'low' | 'medium' | 'high';
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
    quality,
    isEdit,
    isBackgroundOnly,
    isModelOnly,
    keepClothing,
    analysis,
  } = params;

  try {
    const client = createOpenAIClient(openaiApiKey);
    const size = mapAspectRatioToOpenAISize(aspectRatio);

    // Build a concise, constraint-focused prompt for OpenAI GPT Image 1.5
    // Best practices: Be direct, use CAPS for emphasis, clearly separate KEEP vs CHANGE
    let prompt: string;

    if (isBackgroundOnly) {
      // Background-only: Keep subject frozen, change environment
      prompt = `KEEP EXACTLY (do not alter):
- ${analysis.product || 'Main subject'}: same position, size, colors, details${analysis.people_description ? `\n- Person: ${analysis.people_description} - same face, pose, expression, identity` : ''}

CHANGE: Background/environment to: ${variationDescription}

Match lighting on subject to new environment. Professional advertising quality.`;
    } else if (isModelOnly) {
      // Model swap: Keep scene, replace person
      const clothingNote = keepClothing ? 'Keep EXACT same clothing.' : 'Appropriate attire for scene.';

      prompt = `KEEP EXACTLY (do not alter):
- Background and environment unchanged${analysis.product ? `\n- ${analysis.product}: same position and appearance` : ''}

CHANGE: Replace person with: ${variationDescription}

POSE: Match exact same pose and body position as original.
${clothingNote}
Integrate naturally with scene lighting. Professional advertising quality.`;
    } else if (isEdit) {
      // Targeted edit: Change only what's requested
      prompt = `KEEP EXACTLY (do not alter):
- All elements EXCEPT what's specified below${analysis.product ? `\n- ${analysis.product}` : ''}${analysis.people_description ? `\n- Person: ${analysis.people_description}` : ''}${analysis.has_screen ? '\n- Screen content: preserve exactly' : ''}

CHANGE: ${variationDescription}

Make ONLY this edit. Professional advertising quality.`;
    } else {
      // General A/B variation
      prompt = `KEEP EXACTLY (do not alter):
- ${analysis.product || 'Main subject'}: same position, size, appearance, all details${analysis.people_description ? `\n- Person: ${analysis.people_description} - same face, pose, expression` : ''}${analysis.has_screen ? '\n- Screen content: preserve exactly what is displayed' : ''}

CHANGE: ${variationDescription}

Integrate changes naturally. Professional advertising quality.`;
    }

    console.log('OpenAI generation with prompt:', prompt.substring(0, 200) + '...');
    console.log('Using model:', model, 'quality:', quality, 'with mask:', !!mask);

    // Use the edit endpoint with mask if provided, otherwise without
    const resultBase64 = await editImageOpenAI(client, {
      image,
      prompt,
      mask,
      model,
      size,
      quality,
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
