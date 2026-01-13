"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, Clock, HardDrive } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatBytes, getRelativeTime } from "@/lib/session-storage";

interface ResumeSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thumbnailUrl: string | null;
  savedAt: number;
  sessionSize: number;
  onContinue: () => void;
  onStartFresh: () => void;
  isLoading?: boolean;
}

export function ResumeSessionModal({
  open,
  onOpenChange,
  thumbnailUrl,
  savedAt,
  sessionSize,
  onContinue,
  onStartFresh,
  isLoading = false,
}: ResumeSessionModalProps) {
  const t = useTranslations();
  const [relativeTime, setRelativeTime] = useState(() => getRelativeTime(savedAt));

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(savedAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [savedAt]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-card border-border text-foreground"
        onOpenAutoFocus={(e) => {
          if (window.innerWidth < 640) {
            e.preventDefault();
          }
        }}
      >
        <div className="space-y-6 py-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {t("session.resumeTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("session.resumeDescription")}
            </p>
          </div>

          {/* Thumbnail Preview */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-muted/30 border border-border">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Previous session preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Session Info */}
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{relativeTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>{formatBytes(sessionSize)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onContinue}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("session.continueEditing")
              )}
            </Button>
            <Button
              onClick={onStartFresh}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {t("session.startFresh")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
