"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MadeByHumanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MadeByHumanModal({ open, onOpenChange }: MadeByHumanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Made by a Human</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-muted-foreground">
            <p className="text-base text-foreground">
              Hi, I&apos;m{" "}
              <a
                href="https://x.com/coreyrab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Corey Rabazinski
              </a>
              , and I built StaticKit.
            </p>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                Why I Built This
              </h3>
              <p>
                I&apos;ve spent my career in marketing&mdash;leading teams at{" "}
                <a
                  href="https://www.revenuecat.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  RevenueCat
                </a>
                , Manifold (acquired by Snyk), and Code School (acquired by
                Pluralsight). Before that, I ran digital advertising for brands
                like Universal Studios and Holiday Inn.
              </p>
              <p>
                Throughout all of it, I&apos;ve watched marketers struggle with
                creative production. You have the ideas, but turning them into
                polished visuals often means waiting on designers, learning
                complex tools, or settling for &quot;good enough.&quot;
              </p>
              <p>
                AI is changing that. But most AI tools are still built for
                technical users, not marketers. I wanted to fix that.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                Making AI Accessible
              </h3>
              <p>
                StaticKit is designed to put powerful AI image editing directly
                in the hands of marketers. No complex prompts. No steep learning
                curve. Just upload your image, pick what you want to change, and
                let AI do the heavy lifting.
              </p>
              <p>
                It&apos;s open source because I believe these tools should be
                accessible to everyone&mdash;whether you&apos;re at a Fortune
                500 or running a one-person shop.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                Other Projects
              </h3>
              <p>
                I build tools for marketers. Check out{" "}
                <a
                  href="https://tinyfunnels.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  TinyFunnels
                </a>{" "}
                if you&apos;re interested in what else I&apos;m working on.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                Get in Touch
              </h3>
              <p>
                Got feedback, ideas, or just want to say hi? Find me on{" "}
                <a
                  href="https://x.com/coreyrab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  X @coreyrab
                </a>{" "}
                or check out my{" "}
                <a
                  href="https://linkedin.com/in/crabazinski"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  LinkedIn
                </a>
                .
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
