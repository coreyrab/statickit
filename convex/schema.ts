import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for credits and subscription tracking
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.string(), // 'free' | 'starter' | 'pro' | 'agency'
    credits: v.number(), // Current credit balance
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()), // 'active' | 'canceled' | 'past_due' etc.
    currentPeriodEnd: v.optional(v.number()), // Unix timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  generations: defineTable({
    userId: v.string(),
    // Support both legacy data URLs and new file storage IDs
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
  }).index("by_user", ["userId"]),
});
