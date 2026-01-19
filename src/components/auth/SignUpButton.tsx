"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

interface SignUpButtonProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

export function SignUpButton({
  variant = "default",
  size = "sm",
  className,
  showIcon = true,
}: SignUpButtonProps) {
  const { openSignUp } = useClerk();
  const t = useTranslations();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => openSignUp()}
    >
      {showIcon && <UserPlus className="h-4 w-4 mr-2" />}
      {t("auth.signUp")}
    </Button>
  );
}
