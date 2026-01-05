"use client";

import Image from "next/image";
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
          <DialogTitle className="text-xl">By a Human</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm text-muted-foreground">
            {/* Profile and Signature Header */}
            <div className="flex items-center gap-4">
              <Image
                src="/corey_profile.jpeg"
                alt="Corey Rabazinski"
                width={64}
                height={64}
                className="rounded-full object-cover flex-shrink-0"
              />
              <Image
                src="/corey-rabazinski.svg"
                alt="Corey Rabazinski signature"
                width={180}
                height={48}
                className="dark:invert opacity-80"
              />
            </div>

            <p className="text-base text-foreground">
              Hi, I&apos;m Corey Rabazinski, and I built StaticKit.
            </p>

            <p>
              I&apos;ve spent my career in marketing, leading teams at{" "}
              <a
                href="https://scite.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Scite.ai
              </a>{" "}
              (current),{" "}
              <a
                href="https://www.revenuecat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                RevenueCat
              </a>
              , and several others. More recently, I&apos;ve been building AI tools
              for marketing teams. Tools that solve the small but frustrating
              problems that slow people down.
            </p>

            <p>
              My goal is to uncover hidden use cases for AI models through simple,
              focused tools that help folks move faster.
            </p>

            <p>
              StaticKit was designed to make it easy to fly through image edits
              with AI models rather than waiting around in a clunky chat interface.
              No more copy-pasting prompts, wrestling with aspect ratios, or losing
              track of your best outputs.
            </p>

            <p>
              I&apos;ve baked in good prompts, presets, and tools that have been
              helpful for me and my teams. This is very much a living project. If
              you want to contribute or have ideas for how I can make StaticKit
              better, I&apos;d love to hear from you.
            </p>

            <section className="space-y-3 pt-2">
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
