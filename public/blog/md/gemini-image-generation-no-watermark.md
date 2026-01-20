# How to use Gemini image generation without watermarks

> Google's Gemini adds watermarks to AI-generated images — unless you use your own API key. Here's how.

**Author:** Corey Rabazinski
**Date:** 2025-01-03
**Read Time:** 5 min read

---

Google's Gemini can generate and edit images. It's genuinely impressive. There's just one problem: every image comes with a watermark.

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
- **BYOK is often cheaper than subscriptions** for anyone who isn't generating hundreds of images daily.

---

*Originally published at [statickit.ai/blog/gemini-image-generation-no-watermark](https://statickit.ai/blog/gemini-image-generation-no-watermark)*
