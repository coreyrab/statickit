# How to Use Nano Banana Pro Without Watermarks

> The watermark isn't a limitation of the AI — it's added by consumer interfaces. Here's how to get clean output with your own API key.

**Author:** Corey Rabazinski
**Date:** 2025-01-12
**Read Time:** 4 min read

---

If you've been using Google's AI image generation — sometimes called "Nano Banana Pro" in certain corners of the internet — you've probably noticed the watermark.

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

So next time someone asks how to use Nano Banana Pro without watermarks, you'll know: get an API key, use a BYOK tool, and skip the markup.

---

*Originally published at [statickit.ai/blog/nano-banana-pro-without-watermarks](https://statickit.ai/blog/nano-banana-pro-without-watermarks)*
