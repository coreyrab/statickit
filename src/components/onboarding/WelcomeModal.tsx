"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ExternalLink, Key } from "lucide-react";
import { track } from "@/lib/analytics";
import Link from "next/link";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet?: (apiKey: string) => void;
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

export function WelcomeModal({
  open,
  onOpenChange,
  onApiKeySet,
}: WelcomeModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        track('api_key_validated', { success: false });
        return;
      }

      if (onApiKeySet) {
        onApiKeySet(apiKeyInput.trim());
      }

      track('api_key_validated', { success: true });
      setSuccess(true);
      setApiKeyInput("");

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
      setApiKeyInput("");
      setError(null);
      setSuccess(false);
    }
    onOpenChange(newOpen);
  };

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
        <div className="space-y-6 py-2">
          {/* Welcome Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Welcome to StaticKit 👋
            </h2>
          </div>

          {/* What is StaticKit */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              StaticKit is a free AI image editor. Adjust images, swap backgrounds, change models, resize to any aspect ratio, and more. Version control keeps track of every change so you can experiment without losing work.{" "}
              <Link href="/blog/how-statickit-works" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
                More about how it works here.
              </Link>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              It&apos;s faster than a chat interface because common edits are one click, with optimized prompts built in.
            </p>
          </div>

          {/* BYOK Explanation */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Bring Your Own Key</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              StaticKit uses your own API key to connect directly to AI models. Your key stays in your browser and is never sent to our servers. You only pay for what you use, with no subscriptions or hidden fees.
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GeminiLogo className="w-4 h-4" />
              <span className="text-sm font-medium text-foreground">Add your Gemini API Key</span>
            </div>
            <div className="flex items-stretch gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 bg-muted/50 border border-border rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                <input
                  type="password"
                  placeholder="Paste your API key here..."
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
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm py-3"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isValidating || !apiKeyInput.trim() || success}
                className={`px-5 h-auto ${
                  success
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : "bg-blue-600 hover:bg-blue-500"
                } text-white`}
              >
                {isValidating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Saved
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <X className="w-4 h-4" />
                {error}
              </div>
            )}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-1.5"
            >
              Get a free API key from Google
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Skip option */}
          <div className="pt-2 border-t border-border text-center">
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
