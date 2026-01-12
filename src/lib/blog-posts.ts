// Blog posts data - shared between server and client components
export interface BlogPost {
  title: string;
  description: string; // SEO meta description
  excerpt: string; // Short excerpt for listing pages
  readTime: string;
  date: string;
  author: string;
  authorUrl?: string;
  coverImage?: string;
  content: string;
}

export const posts: Record<string, BlogPost> = {
  'how-statickit-works': {
    title: 'How StaticKit Works',
    description: 'Learn how StaticKit delivers professional AI image editing without subscriptions or data collection. Explore the BYOK model, client-side API key storage, and why this architecture benefits users.',
    excerpt: 'No accounts. No subscriptions. No data collection. Here\'s how StaticKit delivers professional AI editing while keeping you in control.',
    readTime: '8 min read',
    date: '2025-01-01',
    author: 'Corey Rabazinski',
    coverImage: '/blog/how_statickit_works.jpg',
    content: `Most AI image tools follow the same playbook: create an account, choose a subscription tier, upload your images to their servers, and hope they don't train on your data or disappear next month.

StaticKit takes a fundamentally different approach. There's no account, no subscription, and your images never touch our servers. You bring your own AI, and everything runs through your browser.

Here's exactly how it works—and why this architecture benefits you.

## The Core Concept: You Bring the AI

StaticKit is a front-end for AI image models. Think of it like a professional camera app that works with any camera sensor. The app provides the interface, controls, and presets. The sensor (in this case, Google's Gemini) provides the actual image processing power.

This is called BYOK: Bring Your Own Key.

You get a free API key from Google AI Studio, paste it into StaticKit once, and you're editing. StaticKit handles the complex prompt engineering, UI, and workflow. Gemini handles the actual AI image generation and editing.

The result: professional-grade AI editing at API costs (pennies per image) instead of subscription prices ($10-20/month).

## How Your API Key Is Stored

This is where most people have questions—and rightfully so. Your API key is sensitive. Here's exactly what happens:

When you enter your API key, the key is saved to your browser's localStorage (the same place websites store preferences and session data). It never leaves your device except when making direct API calls to Google. StaticKit's servers never see, store, or log your key. The key persists across sessions until you clear your browser data or explicitly remove it.

What this means practically: Your key stays on your machine. Period. If you use StaticKit on a different device, you'll need to enter your key again. Clearing your browser data removes the key. No database breach can ever expose your key because we don't have a database of keys.

This is a deliberate architectural choice. We could store keys server-side and make the experience slightly more convenient (sync across devices, password recovery, etc.). But that would mean building infrastructure that holds sensitive credentials—infrastructure that could be breached, subpoenaed, or misused.

By keeping everything client-side, there's nothing to breach.

## How Image Processing Works

When you edit an image in StaticKit, here's the actual data flow:

Step 1: You upload an image. The image loads directly into your browser's memory. It's not uploaded to any server—it stays in your browser tab.

Step 2: You describe an edit. "Change the background to a sunny beach" or "Make the lighting warmer" or just click a preset.

Step 3: StaticKit builds the API request. This is where the complexity happens. StaticKit constructs a carefully engineered prompt that preserves your subject while applying your requested changes. This prompt engineering is one of the main things you're getting from StaticKit—the difference between "make it a beach" (which might distort your product) and a multi-part prompt that maintains subject fidelity.

Step 4: Direct API call to Google. Your browser makes a direct HTTPS request to Google's Gemini API. The request includes your API key (from localStorage) and the image/prompt data. This goes directly from your browser to Google—StaticKit's servers are not involved.

Step 5: Google returns the edited image. The response comes directly back to your browser, where you can review it, iterate, or download.

At no point does your image pass through StaticKit infrastructure. The only servers involved are yours (your browser) and Google's (the AI).

## Why the BYOK Model Works

Skeptics often ask: "If it's free, what's the catch?" Here's why BYOK makes sense for everyone:

For users: No subscription treadmill—pay Google a few cents per edit instead of $15/month whether you use it or not. No lock-in—your API key works with any Gemini-compatible tool. You're not trapped in our ecosystem. No data concerns—your images go to Google (which you've agreed to by using their API) and nowhere else. Unlimited usage—there's no "you've used your 50 monthly credits" moment.

For StaticKit: No infrastructure costs—we don't run GPU servers, don't store images, don't manage user accounts. The biggest cost centers in AI SaaS don't exist. No billing complexity—we don't handle payments, refunds, subscription management, or failed charges. No liability—we're not holding your images or your credentials.

This model lets us focus entirely on building great software instead of managing a SaaS business.

## What Happens on Your Device vs. Google's Servers

Let's be precise about what runs where:

Entirely on your device (browser): Image upload and display, API key storage, background removal (WebGPU-powered, no server needed), version history and undo, export and download, and all UI interactions.

On Google's servers (via direct API call): AI image generation and editing, image analysis, and prompt expansion.

The only data that leaves your browser is what you explicitly send to Google for AI processing. And that's governed by Google's AI terms, not ours.

## Privacy Compared to Traditional Tools

Let's compare StaticKit's architecture to typical AI editing tools:

Traditional AI editor: You create an account (email, password stored on their servers). You upload images (stored on their servers, possibly indefinitely). Their servers call AI APIs (they see your images). Results stored on their servers (tied to your account). They may train on your images (check the ToS). Data breach exposes: your email, password, all images, usage history.

StaticKit: No account (nothing to store). Images stay in your browser (nothing to upload). Your browser calls Google directly (we never see images). Results stay in your browser (nothing to store). We can't train on images we never see. Data breach exposes: nothing (we have nothing).

The architecture makes privacy the default, not a policy promise.

## The Technology Stack

For the technically curious, here's what powers StaticKit:

- **Next.js** handles the web application framework
- **Gemini API** (via @google/generative-ai) powers all AI image operations
- **WebGPU + ONNX Runtime** enables client-side background removal without any server
- **localStorage** provides simple, secure API key persistence
- **No backend database** means no user data to protect or breach

The entire codebase is open source (MIT licensed). You can read every line, verify the claims in this post, or run your own instance.

## Getting Started

If you've read this far, you understand the model. Here's how to start:

1. Get a Gemini API key (free): Go to [Google AI Studio](https://aistudio.google.com), click "Get API Key", and create one.

2. Open StaticKit: Visit [statickit.ai](https://statickit.ai) or run it locally from the GitHub repo.

3. Enter your key once: Paste your API key when prompted. It's saved to your browser.

4. Start editing: Upload an image and describe what you want to change.

That's it. No email confirmation, no credit card, no 14-day trial that auto-converts. Just software that works.

## Key Takeaways

- **BYOK means you control the AI.** Your key, your usage, your costs.
- **Client-side storage means true privacy.** We can't leak what we don't have.
- **Direct API calls mean no middleman.** Your images go straight to Google and back.
- **Open source means trust but verify.** Don't take our word for it—read the code.

The best software disappears. You don't think about the architecture, the business model, or the privacy policy. You just edit images. That's what we're building.`,
  },
  'nano-banana-pro-without-watermarks': {
    title: 'How to Use Nano Banana Pro Without Watermarks',
    description: 'Learn how to use Nano Banana Pro (Google\'s AI image tool) without watermarks. Use your own API key with free tools like StaticKit for clean, watermark-free output.',
    excerpt: 'The watermark isn\'t a limitation of the AI — it\'s added by consumer interfaces. Here\'s how to get clean output with your own API key.',
    readTime: '4 min read',
    date: '2025-01-12',
    author: 'Corey Rabazinski',
    coverImage: '/blog/nano_banana_no_watermark.jpg',
    content: `If you've been using Google's AI image generation — sometimes called "Nano Banana Pro" in certain corners of the internet — you've probably noticed the watermark.

Every image comes out marked. For personal experiments, that's fine. For anything you actually want to use? Not so much.

Here's the thing: the watermark isn't a limitation of the AI itself. It's added by Google's consumer interfaces. Access the same model through the API with your own key, and you get clean output.

## Why the watermark exists (and when it doesn't)

Google adds watermarks to AI-generated images for content authenticity and responsible AI practices. These are reasonable goals for public-facing consumer tools.

But the API is different. It's designed for developers building their own applications. Google assumes if you're paying for API access, you'll handle content policies yourself.

Result: no watermark.

## What you need

Two things:

- **A Google AI API key** (free to create, pay-per-use)
- **A way to call the API** (code or a GUI tool)

The first takes two minutes. The second is where most people get stuck.

## Getting your API key

Go to [Google AI Studio](https://aistudio.google.com). Click "Get API Key" in the left sidebar. Create a new key. Copy it somewhere safe.

That's it. Google gives you free credits to start, and after that it's usage-based pricing — typically a few cents per image.

## Option 1: Use the API directly

If you're comfortable with code, you can call the API with Python or JavaScript. It works, but you're writing code every time you want to generate or edit something.

## Option 2: Use a GUI tool

If you'd rather not write code for every image, you need a tool that wraps the API in a usable interface.

[StaticKit](https://statickit.ai) is a free, open-source image editor that connects to Google's AI using your own API key. You get natural language editing, one-click presets for common tasks, no watermarks, and no subscription fees.

Setup takes about a minute: paste your API key, and you're editing.

## The cost comparison

For light to moderate use, paying per image through the API is significantly cheaper than subscription tools.

API costs: roughly $0.01-0.05 per image. Compare that to $10-20/month for subscription tools — and you're not locked into any platform.

## Key takeaways

- **The watermark is a product decision, not a technical limitation.** The API outputs clean images.
- **You need an API key** (free to create) and a way to use it (StaticKit or code).
- **BYOK is often cheaper than subscriptions** for anyone who isn't generating hundreds of images daily.

So next time someone asks how to use Nano Banana Pro without watermarks, you'll know: get an API key, use a BYOK tool, and skip the markup.`,
  },
  'iterate-meta-ads-ai-image-editing': {
    title: 'How to Iterate on Winning Meta Ads Without Killing Performance',
    description: 'Learn the post-Andromeda framework for testing Meta ad creative variations. Use AI to test location swaps, lighting changes, and model variations in minutes instead of weeks.',
    excerpt: 'Stop paying for expensive photoshoots every time you need a new ad variation. The AI-powered approach to creative testing.',
    readTime: '10 min read',
    date: '2025-01-09',
    author: 'Corey Rabazinski',
    coverImage: '/blog/meta-ads-iteration.jpg',
    content: `If you're running Meta ads in 2025, you've probably noticed something: the old "spray and pray" approach to creative testing is dead.

Post-Andromeda, Meta's algorithm rewards meaningful creative variation, not 47 versions of the same ad with slightly different text overlays.

[Nick Theriot](https://x.com/nicktheriot_), who manages $1M+/month across 10+ ad accounts, recently broke down his exact system for scaling winners. The framework is elegant: Iterations (change ONE thing like location or person) before Variations (change MULTIPLE things like format, hook pattern, or style).

The problem? Creating these variations traditionally requires new photoshoots ($500-$5,000 each), days or weeks of turnaround, and gambling budget on unproven concepts.

What if you could test 10 visual iterations in an afternoon, before committing to a single reshoot?

## The Post-Andromeda Creative Testing Framework

Meta's Andromeda update fundamentally changed how the algorithm evaluates creative. When you upload ads that are too visually similar, Meta consolidates delivery to a single version (wasting your test budget), flags them as "creative similar" in Ads Manager, and limits reach because it sees redundant content.

Nick's rule of thumb: "If Meta can't tell them apart visually, neither can your audience."

This means swapping a white-wall bathroom for a white-wall living room isn't different enough. But bathroom → car → poolside? That's three distinct visual contexts Meta will treat as separate creative.

## Iteration Type #1: Location Swaps

The fastest way to breathe new life into a winning static image ad is changing the environment.

- **The Traditional Way** Book a new location, hire photographer, coordinate talent schedules, edit and retouch. Timeline: 1-2 weeks. Cost: $500-$2,000.

- **The AI-Powered Way** With [StaticKit](https://statickit.com)'s background replacement, you can test location hypotheses before investing in production. Upload your winning creative, describe the new environment in natural language ("Replace background with a sunny outdoor café patio, European style, morning light"), and StaticKit automatically extracts your product/subject, generates the new environment, and adjusts lighting to match.

![Background swap example showing the same model in two different locations](/blog/background_change.jpg)

## Pro Tip: Test Lighting Variations Too

The same location can feel completely different with alternate lighting. Golden hour creates warm, aspirational, lifestyle vibes, perfect for wellness, travel, and premium products. Bright studio lighting feels clean, trustworthy, and professional, ideal for SaaS, B2B, and health products. Neon/moody lighting is edgy, youthful, and bold, great for fashion, nightlife, and Gen Z brands.

StaticKit includes one-click lighting presets, so you can test whether your winning creative performs differently in "golden hour" vs. "studio" lighting, all without re-shooting.

![Lighting change example showing day to night transformation](/blog/lighting_change_ai.jpg)

## Iteration Type #2: Subject Variations

Nick's second iteration lever is testing different people: "Say your winning ad uses a creator in their 20s. Test different ethnicities, different ages, different demographics. This lets you appeal to different subsets WITHIN your target market."

If your winning ad shows a 25-year-old using your product, you might be missing the 45-55 demographic who can't see themselves in the image, different cultural contexts that resonate with other segments, and gender variations that could unlock new audiences.

StaticKit's reference image feature lets you extract a subject from one image, apply your product/context to that subject, and maintain pose and composition while changing the person.

![Model swap example showing different person in the same pose and outfit](/blog/model_change_ai.jpg)

## From Iterations to Variations: Changing Multiple Elements

Once you've exhausted single-variable iterations, Nick recommends moving to variations: changing multiple elements while keeping the core message.

- **Lifestyle → Studio** Change environment and lighting using background replacement plus lighting presets.

- **Single product → Flatlay** Adjust composition and context with reference image compositing.

- **Portrait → Landscape** Change aspect ratio and framing with smart resize (AI extends canvas intelligently).

- **Polished → Raw/organic** Shift overall aesthetic with lighting presets and natural language adjustments.

## Smart Aspect Ratio Resizing for Placement Testing

Different Meta placements have different optimal ratios: Feed works best at 1:1 or 4:5, Stories/Reels need 9:16, and right column uses 1.91:1.

Instead of cropping (which loses content) or letterboxing (which looks lazy), StaticKit's smart resize intelligently extends your image to fit new aspect ratios.

## The Hypothesis-Driven Testing Workflow

Nick emphasizes that every iteration needs a hypothesis: "I'm not just cranking out creative for the sake of it."

Before iterating, document your winner: visual elements (location, subject, lighting, composition), message (core desire, awareness level, target persona), and performance (CTR, conversion rate, ROAS, frequency before fatigue).

Then generate hypotheses like "Outdoor setting will feel more aspirational" (test: pool/patio background), "Older demographic needs to see themselves" (test: 45+ model reference), or "Stories placement is underperforming due to crop" (test: smart resize to 9:16).

## Real Cost Comparison

For a realistic testing sprint with 8 iterations (4 locations, 2 demographics, 2 lighting styles):

- **Traditional Production** Location scout, photographer, talent, editing = $1,100-$2,300 over 7-10 days.

- **AI-Powered Production** StaticKit (free, open source) + Gemini API usage (~$0.50-$2.00) + 1-2 hours of your time = ~$2.00, same day.

The math is obvious. But more importantly: you can test hypotheses before committing production budget. If your "poolside location" iteration bombs, you've lost $0.25 in API costs, not $800 in location fees.

## Getting Started: Your First Iteration Sprint

Install [StaticKit](https://statickit.com) (clone the repo, run npm install, then npm run dev). Grab a free Gemini API key from Google AI Studio and you're ready to go.

Gather your top 3 performing static image ads from the last 90 days. These are your iteration candidates.

Run a location sprint: for each winner, generate 3 location variations (current location as control, opposite environment like indoor→outdoor, and aspirational setting where your customer wants to be).

Test lighting variations on your best-performing location variant: original lighting, golden hour preset, and studio/clean preset.

Upload to Meta with proper naming conventions like [Winner_Name]_LOC_pool or [Winner_Name]_LIGHT_goldenhour. After 3-5 days of data, analyze which iteration types drive improvement, then double down.

## Stop Guessing, Start Iterating

The brands winning on Meta in 2025 aren't spending more on creative. They're iterating smarter.

Nick Theriot's framework gives you the strategic foundation: iterations (one variable) before variations (multiple variables), visually distinct enough for Meta to differentiate, and every test tied to a hypothesis.

[StaticKit](https://statickit.com) gives you the execution speed: location swaps in seconds, lighting variations with one click, smart resizing for every placement, and zero watermarks with zero subscriptions.

The combination? A creative testing machine that lets you find winners faster and scale them further, without burning budget on production gambles.`,
  },
  'gemini-image-generation-no-watermark': {
    title: 'How to use Gemini image generation without watermarks',
    description: 'Remove watermarks from Gemini AI-generated images by using the API directly. Learn how to get a free API key and use tools like StaticKit for watermark-free output.',
    excerpt: 'Google\'s Gemini adds watermarks to AI-generated images — unless you use your own API key. Here\'s how.',
    readTime: '5 min read',
    date: '2025-01-03',
    author: 'Corey Rabazinski',
    coverImage: '/blog/geminiwatermark_blog.jpg',
    content: `Google's Gemini can generate and edit images. It's genuinely impressive. There's just one problem: every image comes with a watermark.

If you're using Gemini through Google's free interfaces, your outputs are marked. For personal projects, that's fine. For anything you want to actually use? Not ideal.

Here's the thing: the watermark isn't baked into Gemini itself. It's added by Google's consumer-facing products. Access the same model through the API with your own key, and the watermark disappears.

## Why Gemini adds watermarks (and when it doesn't)

Google adds watermarks to AI-generated images for content authenticity and responsible AI practices. These are reasonable goals. But they assume you're distributing images publicly without context.

If you're editing your own photos, creating assets for a project you control, or generating reference images for your own use, the watermark just gets in the way.

The API doesn't add watermarks because it's designed for developers building their own applications. Google assumes if you're paying for API access, you'll handle content policies yourself.

## What you need

To generate watermark-free images with Gemini, you need:

- **A Google AI API key** Free to create, pay-per-use pricing

- **A way to call the API** Either code or a tool with a GUI

The first part takes about 2 minutes. The second part is where most people get stuck.

## Getting your Gemini API key

Go to Google AI Studio (aistudio.google.com), click "Get API Key" in the left sidebar, create a new key or use an existing Google Cloud project, and copy your key somewhere safe.

That's it. Google gives you free credits to start, and after that it's usage-based pricing. For image generation, costs are typically a few cents per image.

## Option 1: Use the API directly

If you're comfortable with code, you can call the Gemini API directly with Python or any other language. This works, but it's not exactly user-friendly for quick edits. You're writing code every time you want to change something.

## Option 2: Use a GUI tool

If you'd rather not write Python every time you want to edit an image, you need a tool that wraps the API in a usable interface.

[StaticKit](https://statickit.ai) is a free, open-source image editor that connects to Gemini using your own API key. You get natural language editing, one-click presets for common tasks, no watermarks, and no subscription fees.

Setup takes about a minute: paste your API key, and you're editing.

## The cost comparison

For light to moderate use, paying per image through the API is significantly cheaper than a subscription. Gemini API costs roughly $0.01-0.05 per image edit. Compare that to $10-20/month for subscription tools. And you're not locked into any platform.

## Key takeaways

- **The watermark is a product decision, not a technical limitation.** Gemini's API outputs clean images.

- **You need an API key.** Takes 2 minutes, free to create, pay-per-use after free credits.

- **You need a way to use the API.** Either write code or use a GUI tool like [StaticKit](https://statickit.ai).

- **BYOK is often cheaper than subscriptions** for anyone who isn't generating hundreds of images daily.`,
  },
  'natural-language-image-editing': {
    title: 'Edit images by describing what you want',
    description: 'Natural language image editing lets you describe changes instead of learning complex tools. Discover what works well, what doesn\'t, and how to get better results.',
    excerpt: '"Remove the background." "Make it warmer." "Change her shirt to blue." This is image editing now.',
    readTime: '6 min read',
    date: '2025-01-03',
    author: 'Corey Rabazinski',
    coverImage: '/blog/painting_with_words.jpg',
    content: `"Remove the coffee cup from the table."

"Change her shirt to red."

"Make it look like the photo was taken at sunset."

This is image editing now. Not selection tools and layer masks. Not watching YouTube tutorials on how to use the clone stamp. Just describing what you want.

Natural language image editing has gone from research demo to genuinely useful in the past year. The models are good enough that for most common edits, typing a sentence beats learning Photoshop.

## What natural language editing actually means

Traditional image editing is manipulation-based. You select pixels, apply transformations, paint over areas, blend layers. The software does exactly what you tell it, which means you need to know exactly what to tell it.

Natural language editing is intent-based. You describe the outcome you want, and the AI figures out the manipulation. "Remove the background" triggers segmentation, masking, and inpainting, but you never touch any of those tools directly.

The trade-off is obvious: you give up fine control for speed and accessibility. For surgical edits where every pixel matters, you still want traditional tools. For 80% of common editing tasks, natural language is faster. Tools like [StaticKit](https://statickit.ai) make this accessible without any learning curve.

## What works well

AI text-to-edit is particularly good at:

- **Object removal** "Remove the trash can on the left." The AI identifies the object, masks it, and fills with contextually appropriate content.

- **Color and lighting changes** "Make the lighting warmer" or "change the car to blue." Global adjustments that affect mood or specific objects.

- **Background replacement** "Put them on a beach" or "change the background to a studio setting." The AI segments the foreground and generates or replaces the background.

- **Style transfer** "Make it look like a film photo" or "add a cinematic look." Applies aesthetic changes across the image.

- **Adding elements** "Add clouds to the sky" or "put a plant in the corner." Generates and composites new elements.

## What doesn't work well (yet)

Some edits are still hit-or-miss:

- **Precise positioning** "Move the lamp 3 inches to the left." AI interprets intent loosely; exact measurements are unreliable.

- **Complex multi-step edits** Better to do these as separate operations.

- **Text in images** Editing or adding text is notoriously difficult for current models.

For these cases, traditional tools or multiple simpler prompts work better.

## How to get better results

Even with good tooling, some prompting habits help:

- **Be specific about what, not how.** Say "Remove the person in the red jacket" not "Use inpainting to mask the area."

- **One change at a time.** "Change the sky to sunset" then "Add some birds" works better than combining them.

- **Describe the outcome, not the process.** "Make it look like a professional product photo" beats listing specific adjustments.

- **Use comparison language when helpful.** "Lighting like late afternoon, golden hour" gives the AI useful context.

## Key takeaways

- **Natural language editing is intent-based.** Describe outcomes, not manipulations.

- **It's best for common edits.** Object removal, color changes, backgrounds, style adjustments.

- **Simple prompts beat complex ones** when the tool has good prompt engineering underneath.

- **The underlying model matters less than the implementation.** Same model, different results depending on the tool. [StaticKit](https://statickit.ai) is built with optimized prompts under the hood so you don't have to be a prompt engineer.`,
  },
  'best-free-ai-image-editors': {
    title: 'Best free AI image editors in 2026',
    description: 'A no-BS guide to actually free AI image editors. Compare BYOK tools, open source options, and free tiers without hidden paywalls or watermarks.',
    excerpt: 'Most "free AI image editors" aren\'t really free. Here are the tools that actually deliver.',
    readTime: '7 min read',
    date: '2025-01-03',
    author: 'Corey Rabazinski',
    coverImage: '/blog/statickit_before_after.jpg',
    content: `Searching for "free AI image editor" is an exercise in frustration. Half the results are subscription tools with a free trial. The other half are ad-riddled web apps that watermark everything.

Genuinely free AI image editing exists. You just have to know where to look and what trade-offs you're accepting.

This guide covers tools that are actually free. Not "free for 3 images" or "free with watermark." Each has limitations, but none will surprise you with a paywall mid-edit.

## What "free" actually means

Let's be clear about the different flavors of free:

- **Free tier (limited)** You get X images/month, then pay. Fine for occasional use.

- **Free with ads** The tool is free, you're the product. Usually web-based, often sketchy.

- **Free + API costs (BYOK)** The tool is free, you pay the AI provider directly for usage. Often the best deal for regular users.

- **Open source** Truly free, run it yourself. Requires some technical comfort.

This list focuses on the last two categories.

## StaticKit

Free + BYOK (Gemini API)

[StaticKit](https://statickit.ai) is a desktop-quality image editor that runs in your browser and uses your own Google AI API key. No account required, no usage limits from the tool itself. You just pay Google's API rates.

- **Best for** Regular users who want full AI editing capabilities without subscriptions.

- **Strengths** Full natural language editing, smart presets for common tasks, no watermarks, no artificial limits, open source.

- **Limitations** Requires setting up a Google AI API key (takes 2 minutes). Only supports Gemini models currently.

- **True cost** Roughly $0.01-0.05 per image edit depending on complexity.

## Photopea + AI Plugins

Free with ads (optional paid to remove)

Photopea is a Photoshop clone that runs in browser. It doesn't have built-in AI, but supports plugins that add AI capabilities. The base editor is legitimately powerful.

- **Best for** Users who want traditional editing tools with optional AI assist.

- **Strengths** Full Photoshop-level editing capability, PSD file support, no account required.

- **Limitations** AI features depend on third-party plugins. Plugin quality varies. Ads (removable with $5/month).

## GIMP + Stable Diffusion Plugins

Open source

GIMP is the original free Photoshop alternative. With community plugins, you can connect it to Stable Diffusion for AI generation and editing.

- **Best for** Technical users comfortable with setup and configuration.

- **Strengths** Completely free and open source, no usage limits, full control over models and settings.

- **Limitations** Significant setup required, UI is dated, plugins require local Stable Diffusion installation.

## Canva (Free Tier)

Freemium

Canva's free tier includes limited AI features. It's not unlimited, but the limits are reasonable for casual use.

- **Best for** Casual users who want simple edits without setup.

- **Strengths** Zero setup, works immediately, intuitive interface, includes design templates.

- **Limitations** AI features limited on free tier, some features watermarked until you pay.

## How to choose

- **If you edit images regularly** and want real AI capabilities without subscriptions: [StaticKit](https://statickit.ai)

- **If you need Photoshop-level control** with optional AI: Photopea

- **If you're technical** and want maximum control: GIMP + Stable Diffusion

- **If you just need occasional simple edits**: Canva free tier

## The hidden cost of "free"

A note on sustainability: truly free tools either have a business model you can't see (ads, data) or are passion projects that may disappear.

BYOK tools are transparent: the tool is free, you pay the AI provider. This is often the best deal because AI API costs are commoditized and dropping, you're not subsidizing other users, and the tool creator doesn't need to enshittify the product to make money.

Know which model you're dealing with.

## Key takeaways

- **Actually free options exist.** BYOK and open source tools have no usage fees.

- **BYOK is often the best deal** for regular users. Pay-per-use beats subscriptions for most people.

- **"Free tier" usually means "limited trial."** Check what's actually included before committing.

- **Consider the business model.** It tells you how the tool will evolve.`,
  },
};

// Get all post slugs for static generation
export function getAllPostSlugs(): string[] {
  return Object.keys(posts);
}

// Get post by slug
export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts[slug];
}
