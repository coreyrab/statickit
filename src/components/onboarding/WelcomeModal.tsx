"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SecurityBadge } from "./SecurityBadge";
import {
  Sparkles,
  Pencil,
  GitBranch,
  Key,
  LogIn,
} from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-white/60">{description}</p>
      </div>
    </div>
  );
}

export function WelcomeModal({
  open,
  onOpenChange,
  onDismiss,
}: WelcomeModalProps) {
  const handleDismiss = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md !bg-[#1a1a1a] border-white/10 text-white" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to StaticKit</DialogTitle>
          <DialogDescription>
            AI-powered ad variations in seconds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Feature highlights */}
          <div className="space-y-3">
            <FeatureItem
              icon={<Sparkles className="w-4 h-4 text-violet-400" />}
              title="Smart Defaults & AI Suggestions"
              description="Preset configurations that work well, plus AI-powered suggestions for variations"
            />
            <FeatureItem
              icon={<Pencil className="w-4 h-4 text-violet-400" />}
              title="Natural Language Editing"
              description="Describe what you want changed in plain English"
            />
            <FeatureItem
              icon={<GitBranch className="w-4 h-4 text-violet-400" />}
              title="Version Control"
              description="Every edit is saved. Navigate your creative history anytime."
            />
          </div>

          {/* BYOK explanation */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-medium text-violet-400">
                Bring Your Own Key
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              StaticKit uses your Google Gemini API key for AI features. Get
              unlimited generations with your own free key.
            </p>
          </div>

          {/* Security badge */}
          <SecurityBadge variant="inline">
            Your API key is encrypted with AES-256 and stored securely. We never
            log or share your key.
          </SecurityBadge>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleDismiss}
            className="w-full sm:flex-1 bg-transparent border border-white/20 text-white hover:bg-white/10"
          >
            Explore the App
          </Button>
          <SignInButton mode="modal">
            <Button className="w-full sm:flex-1 bg-violet-600 hover:bg-violet-500 text-white">
              <LogIn className="w-4 h-4" />
              Sign up free
            </Button>
          </SignInButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
