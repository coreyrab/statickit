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

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

interface ConvexClerkProviderProps {
  children: ReactNode;
}

export function ConvexClerkProvider({ children }: ConvexClerkProviderProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
