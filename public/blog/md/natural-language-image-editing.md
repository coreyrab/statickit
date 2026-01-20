# Edit images by describing what you want

> "Remove the background." "Make it warmer." "Change her shirt to blue." This is image editing now.

**Author:** Corey Rabazinski
**Date:** 2025-01-03
**Read Time:** 6 min read

---

"Remove the coffee cup from the table."

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
- **The underlying model matters less than the implementation.** Same model, different results depending on the tool. [StaticKit](https://statickit.ai) is built with optimized prompts under the hood so you don't have to be a prompt engineer.

---

*Originally published at [statickit.ai/blog/natural-language-image-editing](https://statickit.ai/blog/natural-language-image-editing)*
