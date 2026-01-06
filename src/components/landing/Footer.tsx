"use client";

import { useState } from "react";
import Link from "next/link";
import { TermsModal } from "./TermsModal";
import { PrivacyModal } from "./PrivacyModal";
import { MadeByHumanModal } from "./MadeByHumanModal";
import { WelcomeModal } from "@/components/onboarding";

export function Footer() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [madeByHumanOpen, setMadeByHumanOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border/50 py-4 md:py-6 px-3 md:px-6">
        <div className="flex flex-nowrap items-center justify-center md:justify-start gap-x-1 text-xs text-muted-foreground">
            <button
              onClick={() => setAboutOpen(true)}
              className="hover:text-foreground transition-colors"
            >
              About
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => setTermsOpen(true)}
              className="hover:text-foreground transition-colors"
            >
              Terms
            </button>
            <span className="text-muted-foreground/40">·</span>
            <Link
              href="/blog"
              className="hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => setMadeByHumanOpen(true)}
              className="hover:text-foreground transition-colors"
            >
              By a human
            </button>
            <span className="text-muted-foreground/40">·</span>
            <span>&copy; 2025 StaticKit</span>
        </div>
      </footer>

      <WelcomeModal open={aboutOpen} onOpenChange={setAboutOpen} />
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <MadeByHumanModal open={madeByHumanOpen} onOpenChange={setMadeByHumanOpen} />
    </>
  );
}
