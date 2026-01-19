"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

/**
 * Convex Provider with Clerk Authentication
 *
 * This provider wraps the app with both Clerk (auth) and Convex (backend).
 * ConvexProviderWithClerk automatically:
 * - Syncs Clerk's authentication state with Convex
 * - Passes Clerk JWTs to Convex for authenticated queries/mutations
 * - Handles token refresh automatically
 *
 * Note: Clerk must wrap Convex for the useAuth hook to be available
 */

// Validate required environment variables
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!convexUrl) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL environment variable");
}

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

interface ConvexClerkProviderProps {
  children: ReactNode;
}

export function ConvexClerkProvider({ children }: ConvexClerkProviderProps) {
  // Show error if required env vars are missing
  if (!convexUrl || !clerkKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Configuration Error</h1>
          <p className="text-muted-foreground">
            Missing required environment variables:
          </p>
          <ul className="text-sm text-red-500 space-y-1">
            {!convexUrl && <li>• NEXT_PUBLIC_CONVEX_URL</li>}
            {!clerkKey && <li>• NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>}
          </ul>
          <p className="text-xs text-muted-foreground">
            Please add these to your Vercel environment variables and redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      afterSignOutUrl="/"
    >
      <ConvexProviderWithClerk client={convex!} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
