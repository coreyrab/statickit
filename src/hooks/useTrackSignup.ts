"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { track, identify } from "@/lib/analytics";

const SIGNUP_TRACKED_KEY = "statickit_signup_tracked";
const NEW_USER_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to track user signups in OpenPanel analytics
 *
 * Detects new signups by checking if the user's account was created
 * within the last 5 minutes. Uses localStorage to prevent duplicate tracking.
 */
export function useTrackSignup() {
  const { user, isLoaded, isSignedIn } = useUser();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || hasTracked.current) {
      return;
    }

    // Check if we've already tracked this user's signup
    const trackedUsers = JSON.parse(
      localStorage.getItem(SIGNUP_TRACKED_KEY) || "[]"
    ) as string[];

    if (trackedUsers.includes(user.id)) {
      hasTracked.current = true;
      // Still identify returning users
      identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? user.firstName ?? undefined,
      });
      return;
    }

    // Check if user was created recently (within threshold)
    const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    const now = Date.now();
    const isNewUser = now - createdAt < NEW_USER_THRESHOLD_MS;

    // Identify the user
    identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? user.firstName ?? undefined,
    });

    if (isNewUser) {
      // Determine the auth provider
      const provider =
        user.externalAccounts?.[0]?.provider ??
        (user.primaryEmailAddress ? "email" : "unknown");

      // Track the signup event
      track("user_signed_up", { provider });
    }

    // Mark as tracked to prevent duplicates
    trackedUsers.push(user.id);
    localStorage.setItem(SIGNUP_TRACKED_KEY, JSON.stringify(trackedUsers));
    hasTracked.current = true;
  }, [isLoaded, isSignedIn, user]);
}
