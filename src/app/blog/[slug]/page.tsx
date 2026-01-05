'use client';

import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/landing/Footer';

// Blog posts content - add new posts here
const posts: Record<string, {
  title: string;
  date: string;
  author: string;
  authorUrl?: string;
  coverImage?: string;
  content: string;
}> = {
  'gemini-image-generation-no-watermark': {
    title: 'How to use Gemini image generation without watermarks',
    date: '2025-01-03',
    author: 'StaticKit',
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
    date: '2025-01-03',
    author: 'StaticKit',
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
    date: '2025-01-03',
    author: 'StaticKit',
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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = posts[slug];
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Post not found</h1>
          <Link href="/blog" className="text-primary hover:text-primary/80">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  // Parse content into sections
  const renderContent = (content: string) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, i) => {
      // Heading
      if (paragraph.startsWith('## ')) {
        return (
          <h2 key={i} className="text-xl text-foreground font-serif mt-12 mb-4">
            {paragraph.replace('## ', '')}
          </h2>
        );
      }

      // List items
      if (paragraph.startsWith('- **')) {
        const items = paragraph.split('\n').filter(Boolean);
        return (
          <ul key={i} className="space-y-3 my-6">
            {items.map((item, j) => {
              const match = item.match(/- \*\*(.+?)\*\* (.+)/);
              if (match) {
                return (
                  <li key={j} className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-border">
                    <strong className="text-foreground/80">{match[1]}</strong> {match[2]}
                  </li>
                );
              }
              return (
                <li key={j} className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-border">
                  {item.replace('- ', '')}
                </li>
              );
            })}
          </ul>
        );
      }

      // Regular paragraph
      return (
        <p key={i} className="text-muted-foreground leading-relaxed mb-6">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-foreground/70 text-sm hover:text-foreground transition-colors">
              <img src="/logo.svg" alt="StaticKit" className="w-5 h-5 dark:invert" />
              <span className="font-medium">StaticKit</span>
            </Link>
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              )}
              <Link
                href="/blog"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Blog
              </Link>
            </div>
          </div>
        </header>

        {/* Article */}
        <article className="px-6 pt-8 pb-20">
          <div className="max-w-2xl mx-auto">
            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-10 -mx-6 sm:mx-0 sm:rounded-xl overflow-hidden bg-muted">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto"
                  onError={(e) => {
                    // Hide if image doesn't exist
                    (e.target as HTMLElement).parentElement!.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">
              {post.title}
            </h1>

            {/* Byline */}
            <div className="flex items-center gap-3 mb-12 pb-8 border-b border-border">
              <div className="text-sm">
                <span className="text-muted-foreground">by </span>
                {post.authorUrl ? (
                  <a
                    href={post.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/70 hover:text-primary transition-colors"
                  >
                    {post.author}
                  </a>
                ) : (
                  <span className="text-foreground/70">{post.author}</span>
                )}
              </div>
              <span className="text-border">·</span>
              <time className="text-muted-foreground/70 text-sm">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </div>

            {/* Content */}
            <div className="post-content">
              {renderContent(post.content)}
            </div>

            {/* CTA */}
            <div className="mt-16 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Try StaticKit free
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Edit images with AI using your own API key. No account required, no watermarks.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg transition-colors"
              >
                Start editing
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Back link */}
            <div className="mt-8 pt-8 border-t border-border">
              <Link
                href="/blog"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to blog
              </Link>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}
