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
  Plus,
  Check,
  ExternalLink,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useApiKeys, ApiProvider, StoredKey } from "@/hooks/useApiKeys";
import { getMaskedKey } from "@/lib/encryption";
import { track } from "@/lib/analytics";

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
  const { keys, removeKey, setKey, isLoading, hasKey } = useApiKeys();
  const [testingKey, setTestingKey] = useState<ApiProvider | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: ApiProvider;
    success: boolean;
    message: string;
  } | null>(null);
  const [removingKey, setRemovingKey] = useState<ApiProvider | null>(null);

  // Add key states
  const [showAddGemini, setShowAddGemini] = useState(false);
  const [showAddOpenAI, setShowAddOpenAI] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [savingGemini, setSavingGemini] = useState(false);
  const [savingOpenAI, setSavingOpenAI] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [openaiError, setOpenaiError] = useState<string | null>(null);
  const [geminiSuccess, setGeminiSuccess] = useState(false);
  const [openaiSuccess, setOpenaiSuccess] = useState(false);

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

  const handleSaveGemini = async () => {
    if (!geminiKeyInput.trim()) return;

    setSavingGemini(true);
    setGeminiError(null);

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() }),
      });

      const data = await response.json();

      if (!data.valid) {
        setGeminiError(data.error || t("apiKey.invalidApiKey"));
        track("api_key_validated", { success: false });
        return;
      }

      await setKey("gemini", geminiKeyInput.trim());
      track("api_key_validated", { success: true });
      setGeminiSuccess(true);
      setGeminiKeyInput("");
      setShowAddGemini(false);

      setTimeout(() => setGeminiSuccess(false), 1500);
    } catch (err) {
      console.error("Gemini API key validation error:", err);
      setGeminiError(t("apiKey.validationFailed"));
    } finally {
      setSavingGemini(false);
    }
  };

  const handleSaveOpenAI = async () => {
    if (!openaiKeyInput.trim()) return;

    setSavingOpenAI(true);
    setOpenaiError(null);

    try {
      const response = await fetch("/api/validate-openai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: openaiKeyInput.trim() }),
      });

      const data = await response.json();

      if (!data.valid) {
        setOpenaiError(data.error || t("apiKey.invalidApiKey"));
        return;
      }

      await setKey("openai", openaiKeyInput.trim());
      setOpenaiSuccess(true);
      setOpenaiKeyInput("");
      setShowAddOpenAI(false);

      setTimeout(() => setOpenaiSuccess(false), 1500);
    } catch (err) {
      console.error("OpenAI API key validation error:", err);
      setOpenaiError(t("apiKey.validationFailed"));
    } finally {
      setSavingOpenAI(false);
    }
  };

  const hasGeminiKey = hasKey("gemini");
  const hasOpenAIKey = hasKey("openai");

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

          {/* Add New Keys Section */}
          {(!hasGeminiKey || !hasOpenAIKey) && (
            <div className="pt-3 border-t space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t("account.addNewKey")}
              </h4>

              {/* Add Gemini Key */}
              {!hasGeminiKey && (
                <div className="space-y-2">
                  {!showAddGemini ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowAddGemini(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className={providerInfo.gemini.color}>
                        {t("account.addGeminiKey")}
                      </span>
                    </Button>
                  ) : (
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${providerInfo.gemini.color}`}>
                          {providerInfo.gemini.name}
                        </span>
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {t("account.getKey")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <input
                        type="password"
                        value={geminiKeyInput}
                        onChange={(e) => {
                          setGeminiKeyInput(e.target.value);
                          setGeminiError(null);
                        }}
                        placeholder={t("apiKey.keyPlaceholder")}
                        className="w-full px-3 py-2 text-sm rounded-md border bg-background"
                        autoFocus
                      />
                      {geminiError && (
                        <p className="text-xs text-red-500">{geminiError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveGemini}
                          disabled={savingGemini || !geminiKeyInput.trim()}
                          className="flex-1"
                        >
                          {savingGemini ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : geminiSuccess ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            t("account.saveKey")
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddGemini(false);
                            setGeminiKeyInput("");
                            setGeminiError(null);
                          }}
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add OpenAI Key */}
              {!hasOpenAIKey && (
                <div className="space-y-2">
                  {!showAddOpenAI ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowAddOpenAI(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className={providerInfo.openai.color}>
                        {t("account.addOpenAIKey")}
                      </span>
                    </Button>
                  ) : (
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${providerInfo.openai.color}`}>
                          {providerInfo.openai.name}
                        </span>
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          {t("account.getKey")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <input
                        type="password"
                        value={openaiKeyInput}
                        onChange={(e) => {
                          setOpenaiKeyInput(e.target.value);
                          setOpenaiError(null);
                        }}
                        placeholder={t("apiKey.keyPlaceholder")}
                        className="w-full px-3 py-2 text-sm rounded-md border bg-background"
                        autoFocus
                      />
                      {openaiError && (
                        <p className="text-xs text-red-500">{openaiError}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveOpenAI}
                          disabled={savingOpenAI || !openaiKeyInput.trim()}
                          className="flex-1"
                        >
                          {savingOpenAI ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : openaiSuccess ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            t("account.saveKey")
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddOpenAI(false);
                            setOpenaiKeyInput("");
                            setOpenaiError(null);
                          }}
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
