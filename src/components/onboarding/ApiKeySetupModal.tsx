"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface ApiKeySetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeySetupModal({
  open,
  onOpenChange,
}: ApiKeySetupModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setApiKeyMutation = useMutation(api.users.setApiKey);

  const handleSave = async () => {
    if (!apiKeyInput.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      const data = await response.json();

      if (!data.valid) {
        setError(data.error || "Invalid API key");
        return;
      }

      // Save encrypted key to Convex
      await setApiKeyMutation({
        encryptedApiKey: data.encrypted,
        apiKeyIv: data.iv,
        apiKeyAuthTag: data.authTag,
      });

      setSuccess(true);
      setApiKeyInput("");

      // Close modal after short delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("API key validation error:", err);
      setError("Failed to validate API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setApiKeyInput("");
      setError(null);
      setSuccess(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg !bg-[#1a1a1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Manage your API keys</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-white/60 text-center">
            Your API key is encrypted and stored securely. It is only used to make requests on your behalf.
          </p>

          {/* Gemini API Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Google Gemini API Key:</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Get API key here
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="password"
                  placeholder="AIza..."
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setError(null);
                    setSuccess(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && apiKeyInput.trim()) {
                      handleSave();
                    }
                  }}
                  className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isValidating || !apiKeyInput.trim() || success}
                className={`px-4 ${
                  success
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : "bg-blue-600 hover:bg-blue-500"
                } text-white`}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Saved
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <X className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
