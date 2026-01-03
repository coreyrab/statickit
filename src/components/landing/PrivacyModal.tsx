"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Privacy Policy</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-muted-foreground">
            <p className="text-xs text-muted-foreground/70">
              Last updated: January 2026
            </p>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                1. Introduction
              </h3>
              <p>
                StaticKit (&quot;we&quot;, &quot;our&quot;, or &quot;the
                Service&quot;) is committed to protecting your privacy. This
                Privacy Policy explains how we handle information when you use
                our free, open-source AI image editing tool.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                2. Information We Do Not Collect
              </h3>
              <p>
                StaticKit is designed with privacy as a core principle. We do
                not collect, store, or process:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your images or edited content</li>
                <li>Your API keys</li>
                <li>Personal identification information</li>
                <li>Usage data or analytics</li>
                <li>Cookies for tracking purposes</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                3. Local Processing
              </h3>
              <p>
                All image processing and AI operations occur entirely within
                your web browser. Your images never leave your device and are
                not transmitted to our servers. This means:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your images remain private and under your control</li>
                <li>We cannot access or view your content</li>
                <li>No image data is stored on our infrastructure</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                4. API Keys
              </h3>
              <p>
                When you provide an API key to use AI features, this key is:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Stored only in your browser&apos;s local storage</li>
                <li>Never transmitted to StaticKit servers</li>
                <li>Used only to communicate directly with the AI provider</li>
                <li>
                  Removable at any time by clearing your browser data or using
                  our remove key feature
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                5. Third-Party Services
              </h3>
              <p>
                When you use AI features, your requests are sent directly from
                your browser to the AI provider (e.g., Google Gemini). These
                communications are subject to the respective provider&apos;s
                privacy policy:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Google Gemini:{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Privacy Policy
                  </a>
                </li>
              </ul>
              <p>
                We recommend reviewing the privacy policies of any AI providers
                whose services you use through StaticKit.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                6. Hosting and Infrastructure
              </h3>
              <p>
                The StaticKit website is hosted on standard web infrastructure.
                While we don&apos;t collect user data, our hosting provider may
                collect basic server logs (such as IP addresses and access
                times) as part of normal web server operations. These logs are
                not used for tracking and are subject to the hosting
                provider&apos;s policies.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                7. Open Source
              </h3>
              <p>
                StaticKit is open-source software. You can review our source
                code on GitHub to verify our privacy practices. We believe
                transparency is essential to trust.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                8. Children&apos;s Privacy
              </h3>
              <p>
                StaticKit is not directed at children under the age of 13. We do
                not knowingly collect any information from children.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                9. Changes to This Policy
              </h3>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify users of any material changes by updating the &quot;Last
                updated&quot; date at the top of this policy. We encourage you
                to review this policy periodically.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                10. Contact Us
              </h3>
              <p>
                If you have any questions about this Privacy Policy, please
                visit our GitHub repository to open an issue or discussion.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
