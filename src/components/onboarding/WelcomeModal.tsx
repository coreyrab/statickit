"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ExternalLink, Key, Shield, RefreshCw, Cloud, Sparkles, Image, Wand2, Layers, Lock, Globe } from "lucide-react";
import { track } from "@/lib/analytics";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet?: (apiKey: string) => void;
  onOpenAIKeySet?: (apiKey: string) => void;
}

// Official Google Gemini logo SVG component
const GeminiLogo = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65">
    <mask id="welcome-gemini-mask" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="65" height="65">
      <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000"/>
      <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#welcome-gemini-gradient)"/>
    </mask>
    <g mask="url(#welcome-gemini-mask)">
      <g filter="url(#welcome-gemini-f0)"><path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432"/></g>
      <g filter="url(#welcome-gemini-f1)"><path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D"/></g>
      <g filter="url(#welcome-gemini-f2)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g>
      <g filter="url(#welcome-gemini-f3)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g>
      <g filter="url(#welcome-gemini-f4)"><path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C"/></g>
      <g filter="url(#welcome-gemini-f5)"><path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF"/></g>
      <g filter="url(#welcome-gemini-f6)"><path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04"/></g>
      <g filter="url(#welcome-gemini-f7)"><path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF"/></g>
      <g filter="url(#welcome-gemini-f8)"><path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF"/></g>
      <g filter="url(#welcome-gemini-f9)"><path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D"/></g>
      <g filter="url(#welcome-gemini-f10)"><path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48"/></g>
    </g>
    <defs>
      <filter id="welcome-gemini-f0" x="-19.824" y="13.152" width="39.274" height="43.217" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f1" x="-15.001" y="-40.257" width="84.868" height="85.688" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f2" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f3" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f4" x="-19.845" y="15.459" width="79.731" height="81.505" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f5" x="29.832" y="-11.552" width="75.117" height="73.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f6" x="-38.583" y="-16.253" width="78.135" height="78.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f7" x="8.107" y="-5.966" width="78.877" height="77.539" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f8" x="13.587" y="-18.488" width="56.272" height="51.81" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f9" x="-15.526" y="-31.297" width="70.856" height="69.306" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur"/></filter>
      <filter id="welcome-gemini-f10" x="-14.168" y="20.964" width="55.501" height="51.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur"/></filter>
      <linearGradient id="welcome-gemini-gradient" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse"><stop stopColor="#4893FC"/><stop offset=".27" stopColor="#4893FC"/><stop offset=".777" stopColor="#969DFF"/><stop offset="1" stopColor="#BD99FE"/></linearGradient>
    </defs>
  </svg>
);

// OpenAI logo SVG component
const OpenAILogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

export function WelcomeModal({
  open,
  onOpenChange,
  onApiKeySet,
  onOpenAIKeySet,
}: WelcomeModalProps) {
  const { openSignUp } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const t = useTranslations();

  // View state: "auth" shows options, "keys" shows API key inputs (authenticated), "guest-keys" shows API key inputs (guest/browser storage)
  const [view, setView] = useState<"auth" | "keys" | "guest-keys">(isSignedIn ? "keys" : "auth");
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [geminiValidating, setGeminiValidating] = useState(false);
  const [openaiValidating, setOpenaiValidating] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [openaiError, setOpenaiError] = useState<string | null>(null);
  const [geminiSuccess, setGeminiSuccess] = useState(false);
  const [openaiSuccess, setOpenaiSuccess] = useState(false);

  const handleSaveGemini = async () => {
    if (!geminiKeyInput.trim()) return;

    setGeminiValidating(true);
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
        track('api_key_validated', { success: false });
        return;
      }

      if (onApiKeySet) {
        onApiKeySet(geminiKeyInput.trim());
      }

      track('api_key_validated', { success: true });
      setGeminiSuccess(true);
      setGeminiKeyInput("");

      setTimeout(() => {
        setGeminiSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Gemini API key validation error:", err);
      setGeminiError(t("apiKey.validationFailed"));
    } finally {
      setGeminiValidating(false);
    }
  };

  const handleSaveOpenAI = async () => {
    if (!openaiKeyInput.trim()) return;

    setOpenaiValidating(true);
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

      if (onOpenAIKeySet) {
        onOpenAIKeySet(openaiKeyInput.trim());
      }

      setOpenaiSuccess(true);
      setOpenaiKeyInput("");

      setTimeout(() => {
        setOpenaiSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("OpenAI API key validation error:", err);
      setOpenaiError(t("apiKey.validationFailed"));
    } finally {
      setOpenaiValidating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setGeminiKeyInput("");
      setOpenaiKeyInput("");
      setGeminiError(null);
      setOpenaiError(null);
      setGeminiSuccess(false);
      setOpenaiSuccess(false);
      setView(isSignedIn ? "keys" : "auth");
      setIsGuestMode(false);
    }
    onOpenChange(newOpen);
  };

  const handleGuestMode = () => {
    setIsGuestMode(true);
    setView("guest-keys");
  };

  const handleSignUp = () => {
    openSignUp();
    // Keep modal open - will be closed when auth completes
  };

  // If user just signed in, go directly to keys view
  if (isLoaded && isSignedIn && view === "auth") {
    setView("keys");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg bg-card border-border text-foreground"
        onOpenAutoFocus={(e) => {
          if (window.innerWidth < 640) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold text-foreground">
            {t("welcome.title")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("welcome.tagline")}
          </p>
        </DialogHeader>
        <div className="space-y-5 py-4">

          {/* Auth View: Sign up required */}
          {view === "auth" && (
            <>
              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  { icon: <Wand2 className="w-4 h-4 text-violet-500 shrink-0" />, title: t("welcome.features.presets"), desc: t("welcome.features.presetsDesc") },
                  { icon: <Image className="w-4 h-4 text-blue-500 shrink-0" />, title: t("welcome.features.backgrounds"), desc: t("welcome.features.backgroundsDesc") },
                  { icon: <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />, title: t("welcome.features.models"), desc: t("welcome.features.modelsDesc") },
                  { icon: <Layers className="w-4 h-4 text-emerald-500 shrink-0" />, title: t("welcome.features.versions"), desc: t("welcome.features.versionsDesc") },
                ].map((feature, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-3 sm:flex-col sm:gap-0 sm:min-h-[5.5rem]">
                    <div className="flex items-center gap-2 sm:mb-1">
                      {feature.icon}
                      <span className="text-sm font-medium text-foreground leading-tight">{feature.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed sm:flex-1">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Free callout */}
              <div className="text-center py-2">
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-4 h-4" />
                  {t("welcome.freeCallout")}
                </span>
              </div>

              {/* Two option buttons */}
              <div className="space-y-3">
                {/* Create account option */}
                <Button
                  onClick={handleSignUp}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  {t("welcome.createAccount")}
                </Button>

                {/* Divider with "or" */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-card text-muted-foreground">{t("common.or")}</span>
                  </div>
                </div>

                {/* Guest mode option */}
                <Button
                  onClick={handleGuestMode}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {t("welcome.addApiKeys")}
                </Button>

                {/* Guest storage note */}
                <p className="text-xs text-muted-foreground/70 text-center flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-500/70" />
                  {t("welcome.guestStorageDescription")}
                </p>
              </div>

              {/* Already have an account */}
              <div className="text-center">
                <button
                  onClick={handleSignUp}
                  className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  {t("auth.alreadyHaveAccount")}
                </button>
              </div>

              {/* Learn more link */}
              <div className="text-center">
                <Link
                  href="/blog/how-statickit-works"
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  {t("welcome.learnMore")} →
                </Link>
              </div>
            </>
          )}

          {/* Keys View: API key inputs (both authenticated and guest) */}
          {(view === "keys" || view === "guest-keys") && (
            <>
              {/* BYOK Explanation - different for auth vs guest */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{t("welcome.byok")}</span>
                  {view === "keys" ? (
                    <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {t("account.encrypted")}
                    </span>
                  ) : (
                    <span className="ml-auto text-xs text-blue-600 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {t("welcome.browserStorage")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {view === "keys" ? t("welcome.byokDescriptionAuth") : t("welcome.byokDescriptionGuest")}
                </p>
              </div>

          {/* API Key Inputs - Stacked */}
          <div className="space-y-5">
            {/* Gemini Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GeminiLogo className="w-4 h-4" />
                <span className="text-sm font-medium text-foreground">{t("apiKey.googleGemini")}</span>
              </div>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 flex items-center px-3 bg-muted/30 border border-border rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                  <input
                    type="text"
                    placeholder="AIza..."
                    value={geminiKeyInput}
                    onChange={(e) => {
                      setGeminiKeyInput(e.target.value);
                      setGeminiError(null);
                      setGeminiSuccess(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && geminiKeyInput.trim()) {
                        handleSaveGemini();
                      }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm py-2.5"
                    style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                  />
                </div>
                <Button
                  onClick={handleSaveGemini}
                  disabled={geminiValidating || !geminiKeyInput.trim() || geminiSuccess}
                  size="sm"
                  className={`px-4 h-auto ${
                    geminiSuccess
                      ? "bg-emerald-600 hover:bg-emerald-600"
                      : "bg-blue-600 hover:bg-blue-500"
                  } text-white`}
                >
                  {geminiValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : geminiSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    t("apiKey.save")
                  )}
                </Button>
              </div>
              {geminiError && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <X className="w-3 h-3" />
                  {geminiError}
                </div>
              )}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-1"
              >
                {t("apiKey.getGeminiKey")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* OpenAI Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <OpenAILogo className="w-4 h-4" />
                <span className="text-sm font-medium text-foreground">{t("apiKey.openai")}</span>
              </div>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 flex items-center px-3 bg-muted/30 border border-border rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                  <input
                    type="text"
                    placeholder="sk-..."
                    value={openaiKeyInput}
                    onChange={(e) => {
                      setOpenaiKeyInput(e.target.value);
                      setOpenaiError(null);
                      setOpenaiSuccess(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && openaiKeyInput.trim()) {
                        handleSaveOpenAI();
                      }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm py-2.5"
                    style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                  />
                </div>
                <Button
                  onClick={handleSaveOpenAI}
                  disabled={openaiValidating || !openaiKeyInput.trim() || openaiSuccess}
                  size="sm"
                  className={`px-4 h-auto ${
                    openaiSuccess
                      ? "bg-emerald-600 hover:bg-emerald-600"
                      : "bg-blue-600 hover:bg-blue-500"
                  } text-white`}
                >
                  {openaiValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : openaiSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    t("apiKey.save")
                  )}
                </Button>
              </div>
              {openaiError && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <X className="w-3 h-3" />
                  {openaiError}
                </div>
              )}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-1"
              >
                {t("apiKey.getOpenAIKey")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Footer for keys view */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                {/* For guest mode: show sign up prompt */}
                {view === "guest-keys" && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setIsGuestMode(false);
                        handleSignUp();
                      }}
                      className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
                    >
                      {t("welcome.wantEncryption")}
                    </button>
                  </div>
                )}
                <div className="text-center">
                  <button
                    onClick={() => onOpenChange(false)}
                    className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    {t("welcome.skip")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
