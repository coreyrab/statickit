"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

/**
 * API Key Management Hook (Authentication Required)
 *
 * Manages API keys stored encrypted in Convex via API routes.
 * All users must be authenticated to use this hook.
 *
 * Keys are encrypted with AES-256-GCM and stored securely in the cloud,
 * allowing users to access their keys from any device.
 */

export type ApiProvider = "gemini" | "openai" | "dashscope";

export interface StoredKey {
  provider: ApiProvider;
  keyPrefix: string;
  createdAt?: number;
  updatedAt?: number;
}

interface UseApiKeysReturn {
  // State
  keys: StoredKey[];
  isLoading: boolean;
  isAuthenticated: boolean;

  // Key operations
  getKey: (provider: ApiProvider) => Promise<string | null>;
  setKey: (provider: ApiProvider, apiKey: string) => Promise<boolean>;
  removeKey: (provider: ApiProvider) => Promise<boolean>;
  hasKey: (provider: ApiProvider) => boolean;
  hasAnyKey: () => boolean;

  // Refresh stored keys list
  refreshKeys: () => Promise<void>;
}


export function useApiKeys(): UseApiKeysReturn {
  const { isSignedIn, isLoaded } = useAuth();
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch keys from Convex via API
  const refreshKeys = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/keys/list");
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys || []);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, isLoaded]);

  // Refresh on mount and auth state changes
  useEffect(() => {
    refreshKeys();
  }, [refreshKeys]);

  // Get a decrypted key for use
  const getKey = useCallback(
    async (provider: ApiProvider): Promise<string | null> => {
      if (!isSignedIn) return null;

      try {
        const response = await fetch(`/api/keys?provider=${provider}`);
        if (response.ok) {
          const data = await response.json();
          return data.apiKey || null;
        }
        return null;
      } catch {
        return null;
      }
    },
    [isSignedIn]
  );

  // Store a new key (encrypted via API)
  const setKey = useCallback(
    async (provider: ApiProvider, apiKey: string): Promise<boolean> => {
      if (!isSignedIn) return false;

      try {
        const response = await fetch("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey }),
        });

        if (response.ok) {
          await refreshKeys();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error storing API key:", error);
        return false;
      }
    },
    [isSignedIn, refreshKeys]
  );

  // Remove a key via API
  const removeKey = useCallback(
    async (provider: ApiProvider): Promise<boolean> => {
      if (!isSignedIn) return false;

      try {
        const response = await fetch(`/api/keys?provider=${provider}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await refreshKeys();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error removing API key:", error);
        return false;
      }
    },
    [isSignedIn, refreshKeys]
  );

  // Check if a specific provider key exists
  const hasKey = useCallback(
    (provider: ApiProvider): boolean => {
      return keys.some((k) => k.provider === provider);
    },
    [keys]
  );

  // Check if any key exists
  const hasAnyKey = useCallback((): boolean => {
    return keys.length > 0;
  }, [keys]);

  return {
    keys,
    isLoading: isLoading || !isLoaded,
    isAuthenticated: isSignedIn ?? false,

    getKey,
    setKey,
    removeKey,
    hasKey,
    hasAnyKey,
    refreshKeys,
  };
}
