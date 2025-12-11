'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignInButton } from '@clerk/nextjs';
import { X } from 'lucide-react';
import { LandingHero } from './LandingHero';
import { BentoGrid } from './BentoGrid';
import { UseCases } from './UseCases';
import { HowItWorks } from './HowItWorks';
import { Pricing } from './Pricing';
import { LandingCTA } from './LandingCTA';

interface LandingPageProps {
  onUpload?: (file: File) => void;
}

export function LandingPage({ onUpload }: LandingPageProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="StaticKit" className="w-6 h-6" />
            <span>StaticKit</span>
          </div>

          <SignInButton mode="modal">
            <button className="text-sm text-white/50 hover:text-white transition-colors">
              Sign in
            </button>
          </SignInButton>
        </div>
      </header>

      {/* Main content */}
      <main>
        <LandingHero onUpload={onUpload} />
        <BentoGrid />
        <HowItWorks />
        <UseCases />
        <Pricing />
        <LandingCTA />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="StaticKit" className="w-5 h-5 opacity-50" />
            <span>StaticKit</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setShowPrivacy(true)}
              className="hover:text-white/50 transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => setShowTerms(true)}
              className="hover:text-white/50 transition-colors"
            >
              Terms
            </button>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] text-sm text-white/70 space-y-4">
              <p className="text-white/40 text-xs">Last updated: December 2024</p>

              <section>
                <h3 className="font-semibold text-white mb-2">Our Privacy Commitment</h3>
                <p>StaticKit is designed to be privacy-respecting. We collect only what&apos;s necessary to provide the service and nothing more.</p>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">What We Collect</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Images you upload:</strong> Processed to generate variations, then handled as described below</li>
                  <li><strong>Account information:</strong> Email address when you sign up (via Clerk authentication)</li>
                  <li><strong>Usage data:</strong> Basic analytics to improve the service</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">How Your Images Are Processed</h3>
                <p className="mb-2">Your uploaded images are sent to Google&apos;s Gemini AI API for analysis and variation generation. Important disclosures per Google&apos;s API terms:</p>
                <ul className="list-disc list-inside space-y-1 bg-white/5 p-3 rounded-lg">
                  <li>For unpaid/free tier usage: Google may use inputs to improve their services</li>
                  <li>Human reviewers at Google may read and annotate API inputs and outputs</li>
                  <li>Do not upload sensitive, confidential, or personal information</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">What We Don&apos;t Do</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>We don&apos;t sell your data to third parties</li>
                  <li>We don&apos;t use tracking cookies for advertising</li>
                  <li>We don&apos;t store your images permanently on our servers (processed client-side where possible)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Your Rights</h3>
                <p>You can request access to, correction of, or deletion of your personal data at any time by contacting us.</p>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Third-Party Services</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Google Gemini AI:</strong> Image analysis and generation</li>
                  <li><strong>Clerk:</strong> Authentication</li>
                  <li><strong>Vercel:</strong> Hosting</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Contact</h3>
                <p>Questions about this policy? Email us at privacy@statickit.io</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">Terms of Service</h2>
              <button
                onClick={() => setShowTerms(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] text-sm text-white/70 space-y-4">
              <p className="text-white/40 text-xs">Last updated: December 2024</p>

              <section>
                <h3 className="font-semibold text-white mb-2">Service Description</h3>
                <p>StaticKit is an AI-powered tool that generates ad variations from your uploaded images. The service uses artificial intelligence and results may vary.</p>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Eligibility</h3>
                <p>You must be at least 18 years old to use this service, as required by our AI provider&apos;s terms.</p>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Acceptable Use</h3>
                <p className="mb-2">You agree not to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload illegal, harmful, or infringing content</li>
                  <li>Generate content that violates Google&apos;s AI Prohibited Use Policy</li>
                  <li>Attempt to reverse engineer or extract AI models</li>
                  <li>Use the service for deceptive or fraudulent advertising</li>
                  <li>Upload content you don&apos;t have rights to use</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">AI-Generated Content</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Generated images are created using AI and may not be perfect</li>
                  <li>You are responsible for reviewing and approving all generated content before use</li>
                  <li>We make no guarantees about the accuracy or suitability of generated content</li>
                  <li>You retain rights to your original uploads; generated variations are licensed for your commercial use</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Intellectual Property</h3>
                <p>You retain ownership of images you upload. You grant us a limited license to process your images for the purpose of providing the service. Generated variations are provided for your use in advertising.</p>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Limitation of Liability</h3>
                <p>StaticKit is provided &quot;as is&quot; without warranties. We are not liable for any damages arising from use of the service or AI-generated content. Our total liability is limited to the amount you paid for the service.</p>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Service Modifications</h3>
                <p>We may modify or discontinue the service at any time. We&apos;ll provide notice for material changes.</p>
              </section>

              <section>
                <h3 className="font-semibold text-white mb-2">Contact</h3>
                <p>Questions about these terms? Email us at legal@statickit.io</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
