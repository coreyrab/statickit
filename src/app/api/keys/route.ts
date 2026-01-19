import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { encrypt, decrypt, getKeyPrefix } from "@/lib/encryption";

/**
 * API Route for encrypted key management
 *
 * Handles:
 * - POST: Store a new API key (encrypted)
 * - GET: Retrieve a decrypted API key (for making API calls)
 * - DELETE: Remove a stored API key
 *
 * Security:
 * - All endpoints require Clerk authentication
 * - Keys are encrypted server-side before storage
 * - Decryption only happens server-side
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type Provider = "gemini" | "openai" | "dashscope";

function isValidProvider(provider: string): provider is Provider {
  return ["gemini", "openai", "dashscope"].includes(provider);
}

/**
 * POST /api/keys
 * Store an encrypted API key
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !isValidProvider(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'gemini', 'openai', or 'dashscope'" },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const { encrypted, iv, authTag } = encrypt(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);

    // Store in Convex
    await convex.mutation(api.apiKeys.storeKey, {
      userId,
      provider,
      encryptedKey: encrypted,
      iv,
      authTag,
      keyPrefix,
    });

    return NextResponse.json({
      success: true,
      keyPrefix,
    });
  } catch (error) {
    console.error("Error storing API key:", error);
    return NextResponse.json(
      { error: "Failed to store API key" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/keys?provider=gemini
 * Retrieve a decrypted API key for use in API calls
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = request.nextUrl.searchParams.get("provider");

    if (!provider || !isValidProvider(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'gemini', 'openai', or 'dashscope'" },
        { status: 400 }
      );
    }

    // Get encrypted data from Convex
    const encryptedData = await convex.query(api.apiKeys.getEncryptedKey, {
      userId,
      provider,
    });

    if (!encryptedData) {
      return NextResponse.json(
        { error: "No API key found for this provider" },
        { status: 404 }
      );
    }

    // Decrypt the key
    const apiKey = decrypt({
      encrypted: encryptedData.encryptedKey,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
    });

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return NextResponse.json(
      { error: "Failed to retrieve API key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keys?provider=gemini
 * Remove a stored API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const provider = request.nextUrl.searchParams.get("provider");

    if (!provider || !isValidProvider(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'gemini', 'openai', or 'dashscope'" },
        { status: 400 }
      );
    }

    // Remove from Convex
    const removed = await convex.mutation(api.apiKeys.removeKey, {
      userId,
      provider,
    });

    return NextResponse.json({ success: removed });
  } catch (error) {
    console.error("Error removing API key:", error);
    return NextResponse.json(
      { error: "Failed to remove API key" },
      { status: 500 }
    );
  }
}
