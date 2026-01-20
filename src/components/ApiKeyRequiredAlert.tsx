"use client";

import { Button } from "@/components/ui/button";
import { Key, Cloud, Lock, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useClerk } from "@clerk/nextjs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApiKeyRequiredAlertProps {
  onAddApiKeys: () => void;
  className?: string;
}

export function ApiKeyRequiredAlert({ onAddApiKeys, className = "" }: ApiKeyRequiredAlertProps) {
  const t = useTranslations();
  const { openSignUp } = useClerk();

  return (
    <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              {t("apiKeyRequired.title")}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t("apiKeyRequired.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Sign up option */}
            <Button
              onClick={() => openSignUp()}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Cloud className="w-3.5 h-3.5 mr-1.5" />
              {t("apiKeyRequired.signUp")}
            </Button>

            {/* Add API keys option with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onAddApiKeys}
                    variant="outline"
                    size="sm"
                  >
                    <Key className="w-3.5 h-3.5 mr-1.5" />
                    {t("apiKeyRequired.addKeys")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[250px] p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{t("apiKeyRequired.browserStorageHint")}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
