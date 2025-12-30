"use client";

import { Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SecurityBadgeProps {
  variant: "inline" | "badge" | "tooltip";
  children?: React.ReactNode;
  className?: string;
}

export function SecurityBadge({
  variant,
  children,
  className,
}: SecurityBadgeProps) {
  const defaultMessage =
    "Your API key is encrypted with AES-256-GCM and stored securely.";

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded",
          className
        )}
      >
        <Shield className="w-3 h-3" />
        Encrypted
      </span>
    );
  }

  if (variant === "tooltip") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors",
              className
            )}
          >
            <Shield className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{children || defaultMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // inline variant
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-xs text-white/50",
        className
      )}
    >
      <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
      <span>{children || defaultMessage}</span>
    </div>
  );
}
