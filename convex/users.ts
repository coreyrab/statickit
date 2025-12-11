import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Credit allocation per plan (monthly)
export const PLAN_CREDITS = {
  starter: 30,
  pro: 300,
  ultra: 800,
} as const;

// Get or create user (called on first interaction)
export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existing) {
      return existing;
    }

    // Create new user with no plan (must subscribe to get credits)
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email || "",
      name: identity.name,
      plan: "none",
      credits: 0,
    });

    return await ctx.db.get(userId);
  },
});

// Get current user
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// Get user by Clerk ID (for internal use)
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by Stripe customer ID (for webhooks)
export const getByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
  },
});

// Use credits (returns true if successful, false if insufficient)
export const useCredits = mutation({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < args.amount) {
      return { success: false, remainingCredits: user.credits };
    }

    await ctx.db.patch(user._id, {
      credits: user.credits - args.amount,
    });

    return { success: true, remainingCredits: user.credits - args.amount };
  },
});

// Add credits (for purchases, refunds, etc.)
export const addCredits = mutation({
  args: { clerkId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      credits: user.credits + args.amount,
    });

    return { success: true, newCredits: user.credits + args.amount };
  },
});

// Update subscription (called from Stripe webhook)
// Note: This is a regular mutation so it can be called from API routes via ConvexHttpClient
export const updateSubscription = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    plan: v.string(),
    subscriptionStatus: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    credits: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    if (!user) {
      throw new Error("User not found for Stripe customer");
    }

    const updates: any = {
      plan: args.plan,
    };

    if (args.stripeSubscriptionId !== undefined) {
      updates.stripeSubscriptionId = args.stripeSubscriptionId;
    }
    if (args.stripePriceId !== undefined) {
      updates.stripePriceId = args.stripePriceId;
    }
    if (args.subscriptionStatus !== undefined) {
      updates.subscriptionStatus = args.subscriptionStatus;
    }
    if (args.currentPeriodEnd !== undefined) {
      updates.currentPeriodEnd = args.currentPeriodEnd;
    }
    if (args.credits !== undefined) {
      updates.credits = args.credits;
    }

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

// Set Stripe customer ID (called after creating Stripe customer)
// Note: This is a regular mutation so it can be called from API routes via ConvexHttpClient
export const setStripeCustomerId = mutation({
  args: {
    clerkId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      stripeCustomerId: args.stripeCustomerId,
    });

    return { success: true };
  },
});

// Reset credits (called on subscription renewal)
// Note: This is a regular mutation so it can be called from API routes via ConvexHttpClient
export const resetCredits = mutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const planCredits = PLAN_CREDITS[user.plan as keyof typeof PLAN_CREDITS] || 0;

    await ctx.db.patch(user._id, {
      credits: planCredits,
    });

    return { success: true, newCredits: planCredits };
  },
});
