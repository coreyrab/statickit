# StaticKit - Devpost Submission

## Inspiration

Marketers spend thousands on photo shoots to create ad variations with different backgrounds, models, and lighting setups for A/B testing. Small businesses often can't afford this, limiting their ability to compete. When we saw Gemini 3's native image generation capabilities, we realized we could democratize professional ad creation. One product photo could become an entire creative library.

## What it does

StaticKit transforms a single product photo into unlimited ad variations:

- **Background Swap**: Replace backgrounds with AI-generated scenes or extract backgrounds from reference photos
- **Model Swap**: Change the person in your ad while preserving pose, lighting, and product placement. You can even use a specific person from a reference image.
- **Lighting & Style Presets**: Apply golden hour, studio lighting, cinematic color grading, and 40+ other effects
- **Reference Image Editing**: Upload any image as inspiration and describe how to apply its style, colors, or elements
- **Smart Resizing**: Generate platform-specific crops (Instagram Story, Facebook, LinkedIn) while preserving the subject

All edits maintain product integrity. Logos, screens, and text stay pixel-perfect.

## How we built it

- **Frontend**: Next.js 16 with React, Tailwind CSS, and shadcn/ui components
- **AI Engine**: Gemini 3 Pro Image (`gemini-3-pro-image-preview`) for all image generation
- **Multimodal Pipeline**: We send multiple images (main + reference) with detailed prompts that instruct Gemini which elements to preserve vs. transform
- **Prompt Engineering**: Extensive prompt architecture to protect subjects, faces, and products while allowing creative transformations
- **BYOK Model**: Users bring their own Gemini API key, so no backend database is needed

The entire app runs client-side with API calls going directly to Gemini, making it fast and privacy-friendly.

## Challenges we ran into

**Subject Preservation**: Getting Gemini to change backgrounds while keeping people's faces identical required extensive prompt engineering. We developed "protection rules" that explicitly instruct the model what's sacred (faces, products, screens).

**Reference Image Handling**: Teaching Gemini to use a second image as a reference (extracting its background, copying a person's likeness, or matching its style) required careful prompt structure explaining the role of each image.

**Pose Consistency**: When swapping models, preserving the exact pose and expression was tricky. We solved this by emphasizing pose as "pre-recorded footage" that cannot be altered.

## Accomplishments that we're proud of

- **Reference-based editing actually works**: Upload a photo of a beach, and Gemini extracts that literal background and composites your subject into it
- **Model swapping preserves identity**: You can use a reference photo of a specific person and they appear in your ad with the original pose
- **40+ presets that produce consistent results**: From "35mm Film" to "Cyberpunk Neon," each preset reliably transforms images
- **Zero infrastructure**: The whole app works with just a Gemini API key. No accounts, no uploads to our servers.

## What we learned

Gemini 3's image generation is remarkably good at following complex instructions. The key insight: be explicit about what NOT to change. Telling the model "preserve the exact facial features" works better than hoping it will.

Multi-image prompts unlock powerful workflows. Sending two images with instructions like "use the background from image 2" creates compositing capabilities we didn't expect from a single API call.

The model understands creative direction. Terms like "golden hour," "teal and orange color grading," and "shallow depth of field" produce photorealistic results.

## What's next for StaticKit

- **Batch Processing**: Generate 10 background variations with one click
- **Video Support**: When Gemini supports video, extend the same workflow to motion
- **Team Collaboration**: Share edit history and presets across a marketing team
- **Brand Kits**: Save brand colors, fonts, and style preferences for consistent output
- **API Access**: Let developers integrate StaticKit's editing capabilities into their own tools
