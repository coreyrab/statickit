"use client";

import { useState } from "react";
import Link from "next/link";
import { TermsModal } from "./TermsModal";
import { PrivacyModal } from "./PrivacyModal";
import { MadeByHumanModal } from "./MadeByHumanModal";

export function Footer() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [madeByHumanOpen, setMadeByHumanOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <button
                onClick={() => setMadeByHumanOpen(true)}
                className="hover:text-primary transition-colors"
              >
                Made by a human
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                className="hover:text-primary transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => setTermsOpen(true)}
                className="hover:text-primary transition-colors"
              >
                Terms
              </button>
              <Link
                href="/blog"
                className="hover:text-primary transition-colors"
              >
                Blog
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              &copy; 2026 StaticKit
            </p>
          </div>
        </div>
      </footer>

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <MadeByHumanModal open={madeByHumanOpen} onOpenChange={setMadeByHumanOpen} />
    </>
  );
}
