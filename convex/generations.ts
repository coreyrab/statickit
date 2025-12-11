import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all generations for a user (resolves file storage IDs to URLs)
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const generations = await ctx.db
      .query("generations")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();

    // Resolve file storage IDs to URLs
    const resolvedGenerations = await Promise.all(
      generations.map(async (gen) => {
        // Resolve original image URL (convert null to undefined)
        let originalImageUrl: string | undefined = gen.originalImageUrl;
        if (gen.originalImageId) {
          const url = await ctx.storage.getUrl(gen.originalImageId);
          originalImageUrl = url ?? undefined;
        }

        // Resolve variation image URLs
        const variations = await Promise.all(
          gen.variations.map(async (v) => {
            let image_url: string | undefined = v.image_url;
            if (v.imageId) {
              const url = await ctx.storage.getUrl(v.imageId);
              image_url = url ?? undefined;
            }
            return { ...v, image_url };
          })
        );

        return {
          ...gen,
          originalImageUrl,
          variations,
        };
      })
    );

    return resolvedGenerations;
  },
});

// Create a new generation (supports both file storage IDs and legacy data URLs)
export const create = mutation({
  args: {
    originalImageUrl: v.optional(v.string()), // Legacy: data URL
    originalImageId: v.optional(v.id("_storage")), // New: Convex file storage ID
    originalFilename: v.string(),
    aspectRatio: v.string(),
    analysis: v.object({
      product: v.string(),
      brand_style: v.string(),
      visual_elements: v.array(v.string()),
      key_selling_points: v.array(v.string()),
      target_audience: v.string(),
      colors: v.array(v.string()),
      mood: v.string(),
    }),
    variations: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        image_url: v.optional(v.string()), // Legacy: data URL
        imageId: v.optional(v.id("_storage")), // New: Convex file storage ID
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const generationId = await ctx.db.insert("generations", {
      userId: identity.subject,
      originalImageUrl: args.originalImageUrl,
      originalImageId: args.originalImageId,
      originalFilename: args.originalFilename,
      aspectRatio: args.aspectRatio,
      analysis: args.analysis,
      variations: args.variations,
    });

    return generationId;
  },
});

// Delete a generation (also cleans up stored files)
export const remove = mutation({
  args: { id: v.id("generations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const generation = await ctx.db.get(args.id);
    if (!generation || generation.userId !== identity.subject) {
      throw new Error("Not authorized");
    }

    // Clean up stored files
    if (generation.originalImageId) {
      await ctx.storage.delete(generation.originalImageId);
    }
    for (const variation of generation.variations) {
      if (variation.imageId) {
        await ctx.storage.delete(variation.imageId);
      }
    }

    await ctx.db.delete(args.id);
  },
});
