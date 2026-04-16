"use client";

import { useState } from "react";
import Link from "next/link";
import { TermsModal } from "./TermsModal";
import { PrivacyModal } from "./PrivacyModal";
import { WelcomeModal } from "@/components/onboarding";

export function Footer() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border/50 py-4 md:py-6 px-3 md:px-6">
        <div className="flex items-center justify-center gap-x-2 text-xs text-muted-foreground whitespace-nowrap">
            <button
              onClick={() => setAboutOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              About
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => setTermsOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span className="text-muted-foreground/40">·</span>
            <Link
              href="/blog"
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Blog
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <span>&copy; 2026 StaticKit</span>
        </div>
      </footer>

      <WelcomeModal open={aboutOpen} onOpenChange={setAboutOpen} />
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </>
  );
}
