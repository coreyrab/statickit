"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

interface SignInButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

export function SignInButton({
  variant = "outline",
  size = "sm",
  className,
  showIcon = true,
}: SignInButtonProps) {
  const { openSignIn } = useClerk();
  const t = useTranslations();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => openSignIn()}
    >
      {showIcon && <LogIn className="h-4 w-4 mr-2" />}
      {t("auth.signIn")}
    </Button>
  );
}
