"use client";

import { useUser, useClerk } from "@clerk/nextjs";

/**
 * Custom authentication hook that wraps Clerk's hooks
 *
 * Provides a simplified interface for:
 * - Checking auth status
 * - Accessing user info
 * - Triggering sign in/out flows
 *
 * This abstraction makes it easier to swap auth providers if needed
 * and provides a cleaner API for common auth operations.
 */
export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, openSignIn, openSignUp } = useClerk();

  return {
    // Auth state
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    isGuest: isLoaded && !isSignedIn,

    // User info (only available when signed in)
    user: isSignedIn
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          name: user.fullName ?? user.firstName ?? null,
          imageUrl: user.imageUrl,
          provider:
            user.externalAccounts?.[0]?.provider ??
            (user.primaryEmailAddress ? "email" : null),
        }
      : null,

    // Auth actions
    signIn: () => openSignIn(),
    signUp: () => openSignUp(),
    signOut: () => signOut({ redirectUrl: "/" }),
  };
}

// Type for the user object returned by useAuth
export type AuthUser = NonNullable<ReturnType<typeof useAuth>["user"]>;
