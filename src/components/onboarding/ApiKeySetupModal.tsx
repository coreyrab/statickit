"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, Settings } from "lucide-react";

interface ApiKeySetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeySetupModal({
  open,
  onOpenChange,
}: ApiKeySetupModalProps) {
  const router = useRouter();

  const handleGetApiKey = () => {
    window.open("https://aistudio.google.com/apikey", "_blank");
  };

  const handleGoToSettings = () => {
    onOpenChange(false);
    router.push("/settings?setup=true");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md !bg-[#1a1a1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Add your API key</DialogTitle>
          <DialogDescription>
            One more step to start creating
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-white/60">
            StaticKit uses Google&apos;s Gemini AI. You&apos;ll need a free API key from
            Google AI Studio to use the editor.
          </p>

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Get your API key
                </p>
                <p className="text-xs text-white/50">
                  Visit Google AI Studio (free account)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Add it to settings
                </p>
                <p className="text-xs text-white/50">
                  Paste your key in the settings page
                </p>
              </div>
            </div>
          </div>

          {/* Security messaging */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                Secure Storage
              </span>
            </div>
            <p className="text-xs text-white/60">
              Your key is encrypted with AES-256-GCM before storage. It&apos;s only
              decrypted server-side when needed for API calls.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleGetApiKey}
            className="w-full sm:w-auto bg-transparent border border-white/20 text-white hover:bg-white/10"
          >
            <ExternalLink className="w-4 h-4" />
            Get API Key
          </Button>
          <Button
            onClick={handleGoToSettings}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Settings className="w-4 h-4" />
            Go to Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
