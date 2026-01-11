"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Terms of Service</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-muted-foreground">
            <p className="text-xs text-muted-foreground/70">
              Last updated: January 2026
            </p>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing and using StaticKit (&quot;the Service&quot;), you
                accept and agree to be bound by these Terms of Service. If you
                do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                2. Description of Service
              </h3>
              <p>
                StaticKit is a free, open-source AI-powered image editing tool
                that runs entirely in your browser. The Service allows you to
                edit images using AI capabilities provided through your own API
                keys.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                3. User Responsibilities
              </h3>
              <p>You agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Use the Service only for lawful purposes and in accordance
                  with these Terms
                </li>
                <li>
                  Not use the Service to create, upload, or share content that
                  is illegal, harmful, threatening, abusive, defamatory, or
                  otherwise objectionable
                </li>
                <li>
                  Not attempt to interfere with or disrupt the Service or
                  servers
                </li>
                <li>
                  Be responsible for maintaining the confidentiality of your API
                  keys
                </li>
                <li>
                  Comply with all applicable laws and regulations regarding your
                  use of the Service
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                4. Intellectual Property
              </h3>
              <p>
                StaticKit is open-source software licensed under the MIT
                license. You retain all rights to the images you create or edit using
                the Service. We claim no ownership over your content.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                5. API Keys and Third-Party Services
              </h3>
              <p>
                The Service requires you to provide your own API keys for AI
                functionality. Your API keys are stored locally in your browser
                and are never transmitted to our servers. You are responsible
                for any charges incurred through your use of third-party API
                services.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                6. Privacy and Data
              </h3>
              <p>
                All image processing occurs locally in your browser. We do not
                collect, store, or have access to the images you edit. Please
                refer to our Privacy Policy for more information about how we
                handle data.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                7. Disclaimer of Warranties
              </h3>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, either express
                or implied. We do not warrant that the Service will be
                uninterrupted, error-free, or free of viruses or other harmful
                components.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                8. Limitation of Liability
              </h3>
              <p>
                To the fullest extent permitted by law, StaticKit and its
                contributors shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, or any loss of
                profits or revenues, whether incurred directly or indirectly.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                9. Changes to Terms
              </h3>
              <p>
                We reserve the right to modify these Terms at any time. We will
                notify users of any material changes by updating the
                &quot;Last updated&quot; date. Your continued use of the Service
                after such modifications constitutes acceptance of the updated
                Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                10. Contact
              </h3>
              <p>
                If you have any questions about these Terms, please visit our
                GitHub repository to open an issue or discussion.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
