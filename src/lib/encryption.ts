/**
 * Encryption utilities for secure API key storage
 *
 * Uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption.
 * GCM provides both confidentiality and integrity protection.
 *
 * Security properties:
 * - 256-bit key strength
 * - Unique IV per encryption prevents pattern analysis
 * - Auth tag prevents tampering
 * - Server-side only - ENCRYPTION_KEY never exposed to client
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get the encryption key from environment
 * Must be a 32-byte (64 hex character) string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

export interface EncryptedData {
  encrypted: string; // Base64 encoded ciphertext
  iv: string;        // Base64 encoded initialization vector
  authTag: string;   // Base64 encoded authentication tag
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt (e.g., an API key)
 * @returns Encrypted data with IV and auth tag
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

/**
 * Decrypts data that was encrypted with the encrypt function
 *
 * @param data - The encrypted data object
 * @returns The original plaintext string
 * @throws If decryption fails (wrong key, tampered data, etc.)
 */
export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Extracts a prefix from an API key for display purposes
 * Shows first 4 characters, which typically indicate the provider:
 * - "AIza" for Gemini/Google
 * - "sk-p" for OpenAI
 * - etc.
 *
 * @param apiKey - The full API key
 * @returns First 4 characters of the key
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 4);
}

/**
 * Creates a masked version of an API key for display
 * Shows prefix + asterisks (e.g., "AIza****")
 *
 * @param keyPrefix - The prefix (first 4 chars)
 * @returns Masked key string
 */
export function getMaskedKey(keyPrefix: string): string {
  return `${keyPrefix}${"*".repeat(8)}`;
}
