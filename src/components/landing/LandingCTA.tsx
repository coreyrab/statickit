'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingCTAProps {
  onGetStarted?: () => void;
}

export function LandingCTA({ onGetStarted }: LandingCTAProps) {
  const handleClick = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Start iterating on your winners
        </h2>
        <p className="text-muted-foreground mb-8">
          Free to try. Just add your own API key.
        </p>

        <Button size="lg" onClick={handleClick}>
          Get started
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
}
