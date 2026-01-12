# OpenAI Integration Plan

## Overview

Add OpenAI as an alternative image generation provider alongside Gemini, giving users choice of API provider.

---

## Provider Comparison

| Feature | Gemini | OpenAI (GPT-Image-1.5/DALL-E) |
|---------|--------|-------------------------------|
| Image generation | Yes | Yes |
| Image editing | Yes (native) | Yes (with mask) |
| Multi-image input | Yes | Limited |
| Pricing | ~$0.02-0.05/image | ~$0.04-0.12/image |
| Response format | Base64 | Base64 or URL |
| Max resolution | Varies | 1024x1024 to 1792x1024 |

---

## Architecture Changes

### 1. State Management (page.tsx)

**New state variables:**
```typescript
// Provider selection
type ApiProvider = 'gemini' | 'openai';
const [apiProvider, setApiProvider] = useState<ApiProvider>('gemini');

// Separate API keys per provider
const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
const [openaiApiKey, setOpenaiApiKey] = useState<string | null>(null);

// Model selection expanded
type AIModel =
  | 'gemini-3-pro-image-preview'
  | 'gemini-2.0-flash-exp'
  | 'gpt-image-1.5'
  | 'dall-e-3';
const [selectedAIModel, setSelectedAIModel] = useState<AIModel>('gemini-3-pro-image-preview');
```

**LocalStorage keys:**
```typescript
'statickit_gemini_api_key'    // Existing
'statickit_openai_api_key'    // New
'statickit_api_provider'      // New - last used provider
'statickit_ai_model'          // New - last used model
```

### 2. API Key Modal Redesign

**Current:** Single Gemini key input
**New:** Tabbed interface with both providers

```
┌─────────────────────────────────────────────────────────┐
│                    API Key Settings                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐                             │
│  │  Gemini  │  │  OpenAI  │   ← Provider tabs           │
│  └──────────┘  └──────────┘                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Gemini Logo] Google Gemini API Key                    │
│                                                          │
│  ┌──────────────────────────────────────┐  ┌──────┐    │
│  │ Paste your API key here...           │  │ Save │    │
│  └──────────────────────────────────────┘  └──────┘    │
│                                                          │
│  🔗 Get a free API key from Google                      │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ✓ Gemini API Key Connected                             │
│    AI••••••••••••                      [Remove]         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**OpenAI tab:**
```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐                             │
│  │  Gemini  │  │  OpenAI  │   ← OpenAI tab active       │
│  └──────────┘  └──────────┘                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [OpenAI Logo] OpenAI API Key                           │
│                                                          │
│  ┌──────────────────────────────────────┐  ┌──────┐    │
│  │ sk-...                               │  │ Save │    │
│  └──────────────────────────────────────┘  └──────┘    │
│                                                          │
│  🔗 Get an API key from OpenAI                          │
│                                                          │
│  Note: Requires payment method on OpenAI account        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 3. Model Dropdown Redesign

**Current:** Two Gemini models
**New:** Grouped by provider with visual separation

```
┌──────────────────────────────────┐
│ Choose your model                │
├──────────────────────────────────┤
│ GEMINI                           │  ← Section header
│ ┌──────────────────────────────┐ │
│ │ ✓ Gemini 3 Pro               │ │
│ │   Best quality               │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │   Gemini 2.0 Flash           │ │
│ │   Faster & cheaper           │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ OPENAI                           │  ← Section header
│ ┌──────────────────────────────┐ │
│ │   GPT-Image-1.5              │ │
│ │   Latest image model         │ │
│ │   ⚠️ Requires OpenAI key     │ │  ← Warning if no key
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │   DALL-E 3                   │ │
│ │   Creative variations        │ │
│ │   ⚠️ Requires OpenAI key     │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Behavior:**
- Selecting OpenAI model without key → Opens API key modal to OpenAI tab
- Visual indicator when key is missing
- Remember last used model per session

### 4. Hamburger Menu Changes

Add provider status indicators:

```
┌──────────────────────────────────┐
│ API Keys                         │
│   Gemini: ✓ Active              │
│   OpenAI: ⚠️ Not configured     │
├──────────────────────────────────┤
│ 🌙 Dark Mode                     │
│ ⌨️ Keyboard Shortcuts           │
├──────────────────────────────────┤
│ GitHub                           │
└──────────────────────────────────┘
```

Or simpler:
```
┌──────────────────────────────────┐
│ 🔑 API Keys                  → │  ← Opens modal
│    Gemini ✓ · OpenAI ⚠️         │  ← Status summary
├──────────────────────────────────┤
│ 🌙 Dark Mode                     │
└──────────────────────────────────┘
```

---

## Backend Changes

### 5. New API Key Validation Route

**File:** `src/app/api/validate-openai-key/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: 'API key required' });
    }

    const openai = new OpenAI({ apiKey });

    // Test with a minimal call (list models is cheap)
    await openai.models.list();

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    return NextResponse.json({
      valid: false,
      error: error.message || 'Invalid API key'
    });
  }
}
```

### 6. OpenAI Client Helper

**File:** `src/lib/openai-client.ts`

```typescript
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}

// Image generation helper (text → image)
export async function generateImageOpenAI(
  client: OpenAI,
  params: {
    prompt: string;
    model: 'gpt-image-1.5' | 'gpt-image-1' | 'dall-e-3';
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  }
): Promise<string> {
  const response = await client.images.generate({
    model: params.model,
    prompt: params.prompt,
    n: 1,
    size: params.size || '1024x1024',
    quality: params.quality || 'hd',
    response_format: 'b64_json',
    style: params.style || 'natural',
  });

  return response.data[0].b64_json!;
}

// Image editing helper (image + mask + prompt → edited image)
// This is the key endpoint for background/model changes
export async function editImageOpenAI(
  client: OpenAI,
  params: {
    image: string;        // Base64 PNG
    prompt: string;
    mask?: string;        // Base64 PNG with transparent areas = edit regions
    model: 'gpt-image-1.5' | 'gpt-image-1' | 'dall-e-2';
    size?: '1024x1024' | '1792x1024' | '1024x1792';
  }
): Promise<string> {
  // Convert base64 to File objects for the API
  const imageBuffer = Buffer.from(params.image, 'base64');
  const imageFile = await toFile(imageBuffer, 'image.png', { type: 'image/png' });

  let maskFile;
  if (params.mask) {
    const maskBuffer = Buffer.from(params.mask, 'base64');
    maskFile = await toFile(maskBuffer, 'mask.png', { type: 'image/png' });
  }

  const response = await client.images.edit({
    model: params.model,
    image: imageFile,
    prompt: params.prompt,
    mask: maskFile,
    n: 1,
    size: params.size || '1024x1024',
    response_format: 'b64_json',
  });

  return response.data[0].b64_json!;
}

// Utility: Create mask for background editing (transparent = background)
export function createBackgroundMask(subjectMaskBase64: string): string {
  // The rembg output has subject=opaque, background=transparent
  // For OpenAI edit, we need: transparent areas = where to edit
  // So we need to INVERT: subject=transparent, background=opaque

  // This would be done client-side with canvas manipulation
  // See implementation in mask-utils.ts
  return subjectMaskBase64; // Placeholder - actual inversion in client
}

// Utility: Create mask for model/person editing (transparent = person)
export function createPersonMask(subjectMaskBase64: string): string {
  // For model swap, the subject (person) IS what we want to edit
  // So rembg output works directly: subject=opaque → invert → subject=transparent
  return subjectMaskBase64; // Same as background, inverted
}
```

**Client-side mask utilities** (`src/lib/mask-utils.ts`):

```typescript
// Invert alpha channel of a base64 PNG
export async function invertMaskAlpha(base64Png: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Invert alpha channel
      for (let i = 3; i < data.length; i += 4) {
        data[i] = 255 - data[i];
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png').split(',')[1]);
    };
    img.src = `data:image/png;base64,${base64Png}`;
  });
}
```

### 7. Modify Generate Route for Multi-Provider

**File:** `src/app/api/generate/route.ts`

Add provider routing logic:

```typescript
import { createGeminiClient } from '@/lib/user-api-key';
import { createOpenAIClient, generateImageOpenAI, editImageOpenAI } from '@/lib/openai-client';

export async function POST(request: NextRequest) {
  const {
    // Existing params...
    model,
    provider,          // NEW: 'gemini' | 'openai'
    geminiApiKey,      // NEW: separate keys
    openaiApiKey,      // NEW
  } = await request.json();

  // Determine provider from model
  const isOpenAI = model.startsWith('gpt-') || model.startsWith('dall-e');
  const apiKey = isOpenAI ? openaiApiKey : geminiApiKey;

  if (!apiKey) {
    return NextResponse.json({
      error: `${isOpenAI ? 'OpenAI' : 'Gemini'} API key required`
    }, { status: 400 });
  }

  if (isOpenAI) {
    return handleOpenAIGeneration(/* params */);
  } else {
    return handleGeminiGeneration(/* params */);
  }
}

async function handleOpenAIGeneration(params) {
  const client = createOpenAIClient(params.openaiApiKey);

  // OpenAI has different capabilities:
  // - Image generation: Yes (prompt → image)
  // - Image editing: Yes but requires MASK
  // - Multi-image compositing: No (unlike Gemini)

  // For background/model changes, we need a different approach:
  // Option A: Generate description → generate new image
  // Option B: Use inpainting with auto-generated mask

  const base64 = await generateImageOpenAI(client, {
    prompt: params.prompt,
    model: params.model,
    size: mapAspectRatioToOpenAI(params.aspectRatio),
    quality: 'hd',
    style: 'natural',
  });

  return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` });
}
```

---

## Implementation Considerations

### OpenAI Edit Endpoint (`/v1/images/edits`)

OpenAI has a dedicated edit endpoint that supports mask-based editing:

**Endpoint:** `POST /v1/images/edits`

**Parameters:**
- `image` - The original image (PNG, <4MB)
- `prompt` - Description of the edit
- `mask` - PNG with transparent areas indicating where to edit (alpha=0 = edit region)
- `model` - `gpt-image-1`, `gpt-image-1.5`, or `dall-e-2`
- `size` - Output dimensions
- `n` - Number of outputs

**Key insight:** GPT-Image-1.5 uses **prompt-based masking** - the model uses the mask as guidance but interprets it intelligently rather than pixel-perfect. This is actually more forgiving than DALL-E 2's strict masking.

### Feature Mapping

| StaticKit Feature | OpenAI Approach |
|-------------------|-----------------|
| **Background swap** | Edit endpoint + mask of background area |
| **Model swap** | Edit endpoint + mask of person area |
| **General edit** | Edit endpoint + full image (no mask) or auto-mask |
| **Resize/extend** | Generation endpoint with outpainting prompt |
| **Reference images** | Two-step: analyze reference → use description in edit prompt |

### Auto-Mask Generation

Since StaticKit already has **rembg-webgpu** for background removal, we can:
1. Use it to generate subject masks client-side
2. Invert for background masks
3. Send appropriate mask to OpenAI edit endpoint

```typescript
// Example: Background change with auto-mask
async function changeBackgroundOpenAI(image: string, newBackgroundPrompt: string) {
  // 1. Generate mask using existing rembg (subject = opaque, background = transparent)
  const subjectMask = await removeBackground(image);

  // 2. Invert mask (background = opaque becomes transparent for editing)
  const backgroundMask = invertAlpha(subjectMask);

  // 3. Call OpenAI edit endpoint
  const result = await openai.images.edit({
    image: originalImage,
    mask: backgroundMask,  // Transparent areas = where to edit
    prompt: `Replace background with: ${newBackgroundPrompt}. Keep the subject exactly as is.`,
    model: 'gpt-image-1.5',
  });

  return result;
}
```

### Capability Comparison (Updated)

| Feature | Gemini | OpenAI |
|---------|--------|--------|
| Image generation | ✅ Native | ✅ Native |
| Image editing | ✅ Native (no mask needed) | ✅ With mask (auto-generatable) |
| Multi-image input | ✅ Native | ⚠️ Reference via description |
| Background removal | ✅ Can request | ✅ Use rembg + edit |
| Logo/face preservation | ✅ Good | ✅ Better in GPT-Image-1.5 |

### Reference Image Workaround

For reference images with OpenAI:
1. **Analyze reference** using GPT-4V or similar to extract description
2. **Use description** in edit prompt
3. Not as precise as Gemini's multi-image, but workable

```typescript
// Two-step reference workflow
const referenceDescription = await analyzeImage(referenceImage,
  "Describe this background/person/style in detail for recreation");

await openai.images.edit({
  image: mainImage,
  mask: targetMask,
  prompt: `Apply this style: ${referenceDescription}`,
  model: 'gpt-image-1.5',
});
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Provider state, model selection, API key handling |
| `src/components/onboarding/ApiKeySetupModal.tsx` | Tabbed UI for both providers |
| `src/lib/openai-client.ts` | NEW - OpenAI API helper |
| `src/app/api/validate-openai-key/route.ts` | NEW - OpenAI key validation |
| `src/app/api/generate/route.ts` | Multi-provider routing |
| `src/app/api/analyze/route.ts` | Add OpenAI analysis option |
| `src/lib/analytics.ts` | Add provider tracking |
| `package.json` | Add `openai` dependency |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add `openai` npm package
- [ ] Create OpenAI client helper
- [ ] Create OpenAI key validation endpoint
- [ ] Update state management for multi-provider

### Phase 2: UI Updates (Week 1-2)
- [ ] Redesign API key modal with tabs
- [ ] Update model dropdown with provider sections
- [ ] Update hamburger menu with status indicators
- [ ] Add OpenAI logo SVG component

### Phase 3: API Integration (Week 2)
- [ ] Modify generate route for provider routing
- [ ] Implement OpenAI image generation
- [ ] Test basic generation flow
- [ ] Handle different aspect ratios

### Phase 4: Feature Parity (Week 3)
- [ ] Background changes with OpenAI
- [ ] Model swaps with OpenAI
- [ ] Edit functionality
- [ ] Analyze endpoint for OpenAI

### Phase 5: Polish (Week 3)
- [ ] Error handling and messaging
- [ ] Loading states per provider
- [ ] Analytics tracking by provider
- [ ] Documentation updates

---

## Open Questions

1. **Feature parity vs. feature differences?**
   - Same features on both (with caveats) vs. different feature sets?

2. **Pricing transparency?**
   - Show estimated cost per generation?
   - "OpenAI costs ~2x Gemini" warning?

3. **Default provider?**
   - First key added becomes default?
   - Gemini always default (free tier)?

4. **Reference images with OpenAI?**
   - Skip feature? Or describe-then-generate workaround?

---

## Dependencies to Add

```bash
npm install openai
```

```json
// package.json
{
  "dependencies": {
    "openai": "^4.x.x"
  }
}
```

---

*Status: Planning - Ready for implementation*
*Last updated: January 2026*
