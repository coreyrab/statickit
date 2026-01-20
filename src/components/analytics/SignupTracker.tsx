"use client";

import { useTrackSignup } from "@/hooks/useTrackSignup";

/**
 * Invisible component that tracks user signups in OpenPanel analytics.
 * Should be placed inside ClerkProvider to have access to auth state.
 */
export function SignupTracker() {
  useTrackSignup();
  return null;
}
