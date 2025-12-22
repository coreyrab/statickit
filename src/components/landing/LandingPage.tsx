'use client';

import { useSearchParams } from 'next/navigation';
import { ComingSoon } from './ComingSoon';
import { LandingHero } from '../landing-backup/LandingHero';
import { BentoGrid } from '../landing-backup/BentoGrid';
import { HowItWorks } from '../landing-backup/HowItWorks';
import { UseCases } from '../landing-backup/UseCases';
import { Pricing } from '../landing-backup/Pricing';
import { LandingCTA } from '../landing-backup/LandingCTA';

interface LandingPageProps {
  onUpload?: (file: File) => void;
}

export function LandingPage({ onUpload }: LandingPageProps) {
  const searchParams = useSearchParams();
  const showApp = searchParams.get('app') === 'true';

  // Show full landing page if ?app=true, otherwise show coming soon
  if (!showApp) {
    return <ComingSoon />;
  }

  // Full landing page with upload functionality
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-300 text-sm">
            <img src="/logo.svg" alt="StaticKit" className="w-5 h-5" />
            <span className="font-medium">StaticKit</span>
          </div>
        </div>
      </header>
      <main>
        <LandingHero onUpload={onUpload} />
        <BentoGrid />
        <HowItWorks />
        <UseCases />
        <Pricing />
        <LandingCTA />
      </main>
    </div>
  );
}
