'use client';

import { useSearchParams } from 'next/navigation';
import { ComingSoon } from './ComingSoon';
import { LandingHero } from './LandingHero';
import { BentoGrid } from './BentoGrid';
import { HowItWorks } from './HowItWorks';
import { UseCases } from './UseCases';
import { Pricing } from './Pricing';
import { LandingCTA } from './LandingCTA';

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
        <Pricing onGetStarted={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        <LandingCTA onGetStarted={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      </main>
    </div>
  );
}
