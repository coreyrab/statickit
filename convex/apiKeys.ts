import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * API Key Management Functions for Convex
 *
 * These functions handle CRUD operations for encrypted API keys.
 * Note: Encryption/decryption happens in Next.js API routes (server-side)
 * because Convex functions don't have access to Node.js crypto module.
 *
 * Security flow:
 * 1. Client sends plaintext key to Next.js API route
 * 2. API route encrypts key using AES-256-GCM
 * 3. API route calls Convex mutation with encrypted data
 * 4. For retrieval, API route decrypts the key before returning
 */

/**
 * Store an encrypted API key for a user
 * Called from Next.js API route after encryption
 */
export const storeKey = mutation({
  args: {
    userId: v.string(),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("dashscope")
    ),
    encryptedKey: v.string(),
    iv: v.string(),
    authTag: v.string(),
    keyPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if key already exists for this user/provider
    const existing = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      // Update existing key
      await ctx.db.patch(existing._id, {
        encryptedKey: args.encryptedKey,
        iv: args.iv,
        authTag: args.authTag,
        keyPrefix: args.keyPrefix,
        updatedAt: now,
      });
      return existing._id;
    }

    // Insert new key
    return await ctx.db.insert("apiKeys", {
      userId: args.userId,
      provider: args.provider,
      encryptedKey: args.encryptedKey,
      iv: args.iv,
      authTag: args.authTag,
      keyPrefix: args.keyPrefix,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Remove an API key for a user
 */
export const removeKey = mutation({
  args: {
    userId: v.string(),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("dashscope")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }

    return false;
  },
});

/**
 * Get all API keys for a user (returns masked data only)
 * Safe to call from client - never exposes actual keys
 */
export const getKeys = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Return only safe data (no encrypted keys)
    return keys.map((key) => ({
      id: key._id,
      provider: key.provider,
      keyPrefix: key.keyPrefix,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  },
});

/**
 * Get encrypted key data for decryption
 * Should only be called from server-side (API routes)
 */
export const getEncryptedKey = query({
  args: {
    userId: v.string(),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("dashscope")
    ),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (!key) {
      return null;
    }

    return {
      encryptedKey: key.encryptedKey,
      iv: key.iv,
      authTag: key.authTag,
    };
  },
});

/**
 * Check if a user has a specific key stored
 */
export const hasKey = query({
  args: {
    userId: v.string(),
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("dashscope")
    ),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    return key !== null;
  },
});

/**
 * Check if a user has any API keys stored
 */
export const hasAnyKey = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return keys !== null;
  },
});
