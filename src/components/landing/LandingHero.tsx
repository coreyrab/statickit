'use client';

import { useRef } from 'react';
import { SignInButton } from '@clerk/nextjs';
import { ArrowRight, Upload, Check, Download } from 'lucide-react';

interface LandingHeroProps {
  onUpload?: (file: File) => void;
}

export function LandingHero({ onUpload }: LandingHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const uploadButton = (
    <button
      onClick={() => onUpload && fileInputRef.current?.click()}
      className="group w-full border border-white/10 hover:border-white/30 rounded-xl p-5 text-left transition-all hover:bg-white/[0.02]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <Upload className="w-5 h-5 text-white/40 group-hover:text-white/60" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white/90 mb-0.5">Upload your image</p>
          <p className="text-sm text-white/40">PNG, JPG, WebP</p>
        </div>
      </div>
    </button>
  );

  return (
    <section className="pt-8 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main content - two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text + Upload */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-[1.1] tracking-tight text-white">
              One ad in.
              <br />
              <span className="text-white/40">Infinite iterations out.</span>
            </h1>

            <p className="text-lg text-white/50 mb-8 max-w-md">
              Upload an image and use AI to create endless iterations. No Photoshops or photoshoots required.
            </p>

            {/* Compact upload area */}
            <div className="max-w-md">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {onUpload ? (
                uploadButton
              ) : (
                <SignInButton mode="modal">
                  {uploadButton}
                </SignInButton>
              )}

              {/* See how it works - video CTA */}
              <button
                onClick={() => {
                  // TODO: Open video modal when video is ready
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-4 w-full flex items-center justify-center gap-3 text-sm text-white/50 hover:text-white/70 transition-colors group"
              >
                {/* Video thumbnail frame */}
                <div className="relative w-12 h-8 rounded bg-white/5 border border-white/10 overflow-hidden group-hover:border-white/20 transition-colors">
                  {/* Placeholder gradient - replace with actual video thumbnail */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
                  {/* Play icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white/80 border-b-[3px] border-b-transparent ml-0.5" />
                    </div>
                  </div>
                </div>
                <span>See how it works</span>
              </button>
            </div>
          </div>

          {/* Right: Product preview - showing transformation */}
          <div className="relative">
            {/* Before/After visualization */}
            <div className="relative">
              {/* "Before" - Original ad */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 sm:w-40 z-10">
                <div className="bg-white/5 border border-white/10 rounded-lg p-2">
                  <img
                    src="/hero/uploaded_image.jpg"
                    alt="Original ad"
                    className="aspect-[4/5] w-full object-cover rounded"
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-2 text-center uppercase tracking-wide">Input</p>
              </div>

              {/* Arrow */}
              <div className="absolute left-28 sm:left-36 top-1/2 -translate-y-1/2 z-20">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-white/40" />
                </div>
              </div>

              {/* "After" - Generated variations */}
              <div className="ml-auto w-64 sm:w-72">
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="bg-white/5 border border-white/10 rounded-lg p-1.5">
                      <img
                        src={`/hero/iteration${num}.png`}
                        alt={`Iteration ${num}`}
                        className="aspect-[4/5] w-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/30 mt-2 text-center uppercase tracking-wide">Output</p>
              </div>
            </div>

            {/* Size badges and download below */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Resize</span>
              <div className="flex items-center gap-1.5">
                {['1:1', '9:16', '16:9', '4:5'].map((size) => (
                  <span key={size} className="px-2 py-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    {size}
                  </span>
                ))}
              </div>
              <div className="w-px h-4 bg-white/10" />
              <span className="px-2 py-1 text-[10px] text-white/50 bg-white/5 border border-white/10 rounded flex items-center gap-1.5">
                <Download className="w-3 h-3" />
                Download all
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
