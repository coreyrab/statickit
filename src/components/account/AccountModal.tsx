"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  LogOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useApiKeys, ApiProvider, StoredKey } from "@/hooks/useApiKeys";
import { getMaskedKey } from "@/lib/encryption";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Provider display info
const providerInfo: Record<ApiProvider, { name: string; color: string }> = {
  gemini: { name: "Google Gemini", color: "text-blue-500" },
  openai: { name: "OpenAI", color: "text-green-500" },
  dashscope: { name: "Alibaba DashScope", color: "text-orange-500" },
};

export function AccountModal({ open, onOpenChange }: AccountModalProps) {
  const t = useTranslations();
  const { user, signOut, isSignedIn } = useAuth();
  const { keys, removeKey, isLoading } = useApiKeys();
  const [testingKey, setTestingKey] = useState<ApiProvider | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: ApiProvider;
    success: boolean;
    message: string;
  } | null>(null);
  const [removingKey, setRemovingKey] = useState<ApiProvider | null>(null);

  if (!isSignedIn || !user) {
    return null;
  }

  // Get initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() ?? "U";

  const handleTestKey = async (provider: ApiProvider) => {
    setTestingKey(provider);
    setTestResult(null);

    try {
      // Get the decrypted key
      const response = await fetch(`/api/keys?provider=${provider}`);
      if (!response.ok) {
        setTestResult({
          provider,
          success: false,
          message: t("account.keyNotFound"),
        });
        return;
      }

      const { apiKey } = await response.json();

      // Validate the key
      const validateEndpoint =
        provider === "openai" ? "/api/validate-openai-key" : "/api/validate-key";
      const validateResponse = await fetch(validateEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const result = await validateResponse.json();

      setTestResult({
        provider,
        success: result.valid,
        message: result.valid ? t("account.keyValid") : result.error,
      });
    } catch (error) {
      setTestResult({
        provider,
        success: false,
        message: t("account.testFailed"),
      });
    } finally {
      setTestingKey(null);
    }
  };

  const handleRemoveKey = async (provider: ApiProvider) => {
    setRemovingKey(provider);
    try {
      await removeKey(provider);
      // Clear test result if it was for this provider
      if (testResult?.provider === provider) {
        setTestResult(null);
      }
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("account.title")}</DialogTitle>
          <DialogDescription>{t("account.description")}</DialogDescription>
        </DialogHeader>

        {/* User Info Section */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.imageUrl} alt={user.name ?? "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            {user.name && (
              <span className="font-medium truncate">{user.name}</span>
            )}
            {user.email && (
              <span className="text-sm text-muted-foreground truncate">
                {user.email}
              </span>
            )}
            {user.provider && (
              <span className="text-xs text-muted-foreground capitalize">
                via {user.provider}
              </span>
            )}
          </div>
        </div>

        {/* API Keys Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">{t("account.connectedKeys")}</h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
              {t("account.noKeys")}
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((key: StoredKey) => (
                <div
                  key={key.provider}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-medium ${providerInfo[key.provider].color}`}
                      >
                        {providerInfo[key.provider].name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs text-muted-foreground font-mono">
                          {getMaskedKey(key.keyPrefix)}
                        </code>
                        <Shield className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          {t("account.encrypted")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Test Result */}
                    {testResult?.provider === key.provider && (
                      <div className="mr-2">
                        {testResult.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}

                    {/* Test Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestKey(key.provider)}
                      disabled={testingKey === key.provider}
                    >
                      {testingKey === key.provider ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("account.test")
                      )}
                    </Button>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveKey(key.provider)}
                      disabled={removingKey === key.provider}
                      className="text-destructive hover:text-destructive"
                    >
                      {removingKey === key.provider ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Test Result Message */}
          {testResult && (
            <p
              className={`text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}
            >
              {testResult.message}
            </p>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              signOut();
              onOpenChange(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("auth.signOut")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
