'use client';

import { SignInButton } from '@clerk/nextjs';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="py-20 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Start iterating on your winners
        </h2>
        <p className="text-white/40 mb-8">
          Free to try. No credit card required.
        </p>

        <SignInButton mode="modal">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors">
            Get started
            <ArrowRight className="w-4 h-4" />
          </button>
        </SignInButton>
      </div>
    </section>
  );
}
