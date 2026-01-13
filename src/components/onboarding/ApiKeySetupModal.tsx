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
import { track } from "@/lib/analytics";
import Link from "next/link";

interface ApiKeySetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGeminiKeySet?: (apiKey: string) => void;
  onOpenAIKeySet?: (apiKey: string) => void;
  onDashScopeKeySet?: (apiKey: string) => void;
  currentGeminiKey?: string | null;
  currentOpenAIKey?: string | null;
  currentDashScopeKey?: string | null;
  initialTab?: 'gemini' | 'openai'; // kept for backwards compat but unused now
  // Legacy prop for backwards compatibility
  onApiKeySet?: (apiKey: string) => void;
  currentApiKey?: string | null;
}

// Official Google Gemini logo SVG component
const GeminiLogo = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65">
    <mask id="gemini-mask" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="65" height="65">
      <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000"/>
      <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#gemini-gradient)"/>
    </mask>
    <g mask="url(#gemini-mask)">
      <g filter="url(#gemini-f0)"><path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432"/></g>
      <g filter="url(#gemini-f1)"><path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D"/></g>
      <g filter="url(#gemini-f2)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g>
      <g filter="url(#gemini-f3)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g>
      <g filter="url(#gemini-f4)"><path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C"/></g>
      <g filter="url(#gemini-f5)"><path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF"/></g>
      <g filter="url(#gemini-f6)"><path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04"/></g>
      <g filter="url(#gemini-f7)"><path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF"/></g>
      <g filter="url(#gemini-f8)"><path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF"/></g>
      <g filter="url(#gemini-f9)"><path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D"/></g>
      <g filter="url(#gemini-f10)"><path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48"/></g>
    </g>
    <defs>
      <filter id="gemini-f0" x="-19.824" y="13.152" width="39.274" height="43.217" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f1" x="-15.001" y="-40.257" width="84.868" height="85.688" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f2" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f3" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f4" x="-19.845" y="15.459" width="79.731" height="81.505" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f5" x="29.832" y="-11.552" width="75.117" height="73.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f6" x="-38.583" y="-16.253" width="78.135" height="78.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f7" x="8.107" y="-5.966" width="78.877" height="77.539" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f8" x="13.587" y="-18.488" width="56.272" height="51.81" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f9" x="-15.526" y="-31.297" width="70.856" height="69.306" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur"/></filter>
      <filter id="gemini-f10" x="-14.168" y="20.964" width="55.501" height="51.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur"/></filter>
      <linearGradient id="gemini-gradient" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse"><stop stopColor="#4893FC"/><stop offset=".27" stopColor="#4893FC"/><stop offset=".777" stopColor="#969DFF"/><stop offset="1" stopColor="#BD99FE"/></linearGradient>
    </defs>
  </svg>
);

// OpenAI logo SVG component
const OpenAILogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

// Qwen logo SVG component (Alibaba Cloud DashScope)
const QwenLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z"/>
  </svg>
);

export function ApiKeySetupModal({
  open,
  onOpenChange,
  onGeminiKeySet,
  onOpenAIKeySet,
  onDashScopeKeySet,
  currentGeminiKey,
  currentOpenAIKey,
  currentDashScopeKey,
  // Legacy props
  onApiKeySet,
  currentApiKey,
}: ApiKeySetupModalProps) {
  // Use legacy props if new ones aren't provided
  const effectiveGeminiKey = currentGeminiKey ?? currentApiKey;
  const effectiveGeminiCallback = onGeminiKeySet ?? onApiKeySet;

  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [dashscopeKeyInput, setDashscopeKeyInput] = useState("");
  const [geminiValidating, setGeminiValidating] = useState(false);
  const [openaiValidating, setOpenaiValidating] = useState(false);
  const [dashscopeValidating, setDashscopeValidating] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [openaiError, setOpenaiError] = useState<string | null>(null);
  const [dashscopeError, setDashscopeError] = useState<string | null>(null);
  const [geminiSuccess, setGeminiSuccess] = useState(false);
  const [openaiSuccess, setOpenaiSuccess] = useState(false);
  const [dashscopeSuccess, setDashscopeSuccess] = useState(false);

  // Mask API key to show only first 2-4 characters
  const getMaskedKey = (key: string) => {
    if (!key || key.length < 4) return "************";
    return key.substring(0, 4) + "************";
  };

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
        setGeminiError(data.error || "Invalid API key");
        track('api_key_validated', { success: false });
        return;
      }

      if (effectiveGeminiCallback) {
        effectiveGeminiCallback(geminiKeyInput.trim());
      }

      track('api_key_validated', { success: true });
      setGeminiSuccess(true);
      setGeminiKeyInput("");

      setTimeout(() => {
        setGeminiSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Gemini API key validation error:", err);
      setGeminiError("Failed to validate API key. Please try again.");
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
        setOpenaiError(data.error || "Invalid API key");
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
      setOpenaiError("Failed to validate API key. Please try again.");
    } finally {
      setOpenaiValidating(false);
    }
  };

  const handleSaveDashScope = async () => {
    if (!dashscopeKeyInput.trim()) return;

    setDashscopeValidating(true);
    setDashscopeError(null);

    try {
      const response = await fetch("/api/validate-dashscope-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: dashscopeKeyInput.trim() }),
      });

      const data = await response.json();

      if (!data.valid) {
        setDashscopeError(data.error || "Invalid API key");
        return;
      }

      if (onDashScopeKeySet) {
        onDashScopeKeySet(dashscopeKeyInput.trim());
      }

      setDashscopeSuccess(true);
      setDashscopeKeyInput("");

      setTimeout(() => {
        setDashscopeSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("DashScope API key validation error:", err);
      setDashscopeError("Failed to validate API key. Please try again.");
    } finally {
      setDashscopeValidating(false);
    }
  };

  const handleRemoveGeminiKey = () => {
    localStorage.removeItem('statickit_gemini_api_key');
    window.location.reload();
  };

  const handleRemoveOpenAIKey = () => {
    localStorage.removeItem('statickit_openai_api_key');
    window.location.reload();
  };

  const handleRemoveDashScopeKey = () => {
    localStorage.removeItem('statickit_dashscope_api_key');
    window.location.reload();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setGeminiKeyInput("");
      setOpenaiKeyInput("");
      setDashscopeKeyInput("");
      setGeminiError(null);
      setOpenaiError(null);
      setDashscopeError(null);
      setGeminiSuccess(false);
      setOpenaiSuccess(false);
      setDashscopeSuccess(false);
    }
    onOpenChange(newOpen);
  };

  const hasGeminiKey = !!effectiveGeminiKey;
  const hasOpenAIKey = !!currentOpenAIKey;
  const hasDashScopeKey = !!currentDashScopeKey;

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
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            API Key Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gemini Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GeminiLogo className="w-5 h-5" />
              <span className="font-medium text-foreground">Google Gemini</span>
              {hasGeminiKey && (
                <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            {hasGeminiKey ? (
              <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground font-mono">
                  {getMaskedKey(effectiveGeminiKey!)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveGeminiKey}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 flex items-center px-3 bg-muted/30 border border-border rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                    <input
                      type="password"
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
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm py-2.5"
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
                      "Save"
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
                  Get a free API key from Google
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 my-1" />

          {/* OpenAI Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <OpenAILogo className="w-5 h-5" />
              <span className="font-medium text-foreground">OpenAI</span>
              {hasOpenAIKey && (
                <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            {hasOpenAIKey ? (
              <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground font-mono">
                  {getMaskedKey(currentOpenAIKey!)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveOpenAIKey}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 flex items-center px-3 bg-muted/30 border border-border rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                    <input
                      type="password"
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
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm py-2.5"
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
                      "Save"
                    )}
                  </Button>
                </div>
                {openaiError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <X className="w-3 h-3" />
                    {openaiError}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    Get an API key from OpenAI
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs text-amber-500/80">Paid account required</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 my-1" />

          {/* DashScope (Qwen) Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <QwenLogo className="w-5 h-5" />
              <span className="font-medium text-foreground">Qwen (Alibaba)</span>
              {hasDashScopeKey && (
                <span className="ml-auto text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            {hasDashScopeKey ? (
              <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground font-mono">
                  {getMaskedKey(currentDashScopeKey!)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveDashScopeKey}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 flex items-center px-3 bg-muted/30 border border-border rounded-lg focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={dashscopeKeyInput}
                      onChange={(e) => {
                        setDashscopeKeyInput(e.target.value);
                        setDashscopeError(null);
                        setDashscopeSuccess(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && dashscopeKeyInput.trim()) {
                          handleSaveDashScope();
                        }
                      }}
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm py-2.5"
                    />
                  </div>
                  <Button
                    onClick={handleSaveDashScope}
                    disabled={dashscopeValidating || !dashscopeKeyInput.trim() || dashscopeSuccess}
                    size="sm"
                    className={`px-4 h-auto ${
                      dashscopeSuccess
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : "bg-blue-600 hover:bg-blue-500"
                    } text-white`}
                  >
                    {dashscopeValidating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : dashscopeSuccess ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
                {dashscopeError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <X className="w-3 h-3" />
                    {dashscopeError}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <a
                    href="https://dashscope.console.aliyun.com/apiKey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    Get an API key from Alibaba Cloud
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs text-amber-500/80">Paid account required</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-5 mt-2 border-t border-border/60 space-y-4">
            <p className="text-xs text-muted-foreground/60 text-center">
              API keys are stored locally in your browser and never sent to our servers.{" "}
              <Link href="/blog/how-statickit-works" className="text-blue-500 dark:text-blue-400 hover:underline">
                Learn more
              </Link>
            </p>

            {(hasGeminiKey || hasOpenAIKey || hasDashScopeKey) ? (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Done
              </Button>
            ) : (
              <button
                onClick={() => onOpenChange(false)}
                className="w-full text-sm text-muted-foreground/70 hover:text-foreground transition-colors py-2"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
