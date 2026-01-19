import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema for StaticKit
 *
 * This schema defines the database structure for storing encrypted API keys.
 * Keys are encrypted using AES-256-GCM before storage, ensuring that even
 * if the database were compromised, the actual API keys remain secure.
 */
export default defineSchema({
  /**
   * API Keys table - stores encrypted API keys for authenticated users
   *
   * Security model:
   * - encryptedKey: The actual key, encrypted with AES-256-GCM
   * - iv: Unique initialization vector per encryption (required for GCM)
   * - authTag: Authentication tag to verify integrity (GCM provides this)
   * - keyPrefix: First 4 chars shown to users for identification (e.g., "AIza")
   */
  apiKeys: defineTable({
    userId: v.string(),           // Clerk user ID (e.g., "user_2abc123...")
    provider: v.union(
      v.literal("gemini"),
      v.literal("openai"),
      v.literal("dashscope")
    ),
    encryptedKey: v.string(),     // AES-256-GCM encrypted key (base64)
    iv: v.string(),               // Initialization vector (base64)
    authTag: v.string(),          // GCM authentication tag (base64)
    keyPrefix: v.string(),        // First 4 characters for display
    createdAt: v.number(),        // Unix timestamp
    updatedAt: v.number(),        // Unix timestamp
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),
});
