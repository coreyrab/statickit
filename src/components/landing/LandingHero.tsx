'use client';

import { useRef } from 'react';
import { ArrowRight, Upload, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <Button
      variant="outline"
      onClick={() => fileInputRef.current?.click()}
      className="w-full h-auto p-5 justify-start"
    >
      <div className="flex items-center gap-4 w-full">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
          <Upload className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground mb-0.5">Upload your image</p>
          <p className="text-sm text-muted-foreground">PNG, JPG, WebP</p>
        </div>
      </div>
    </Button>
  );

  return (
    <section className="pt-8 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main content - two column layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text + Upload */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-[1.1] tracking-tight text-foreground">
              One ad in.
              <br />
              <span className="text-muted-foreground">Infinite iterations out.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-md">
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

              {uploadButton}

              {/* See how it works - video CTA */}
              <Button
                variant="ghost"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-4 w-full text-muted-foreground"
              >
                {/* Video thumbnail frame */}
                <div className="relative w-12 h-8 rounded bg-muted border border-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-foreground/80 border-b-[3px] border-b-transparent ml-0.5" />
                    </div>
                  </div>
                </div>
                <span>See how it works</span>
              </Button>
            </div>
          </div>

          {/* Right: Product preview - showing transformation */}
          <div className="relative">
            {/* Before/After visualization */}
            <div className="relative">
              {/* "Before" - Original ad */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-32 sm:w-40 z-10">
                <div className="bg-card border border-border rounded-lg p-2">
                  <img
                    src="/hero/uploaded_image.jpg"
                    alt="Original ad"
                    className="aspect-[4/5] w-full object-cover rounded"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center uppercase tracking-wide">Input</p>
              </div>

              {/* Arrow */}
              <div className="absolute left-28 sm:left-36 top-1/2 -translate-y-1/2 z-20">
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* "After" - Generated variations */}
              <div className="ml-auto w-64 sm:w-72">
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="bg-card border border-border rounded-lg p-1.5">
                      <img
                        src={`/hero/iteration${num}.png`}
                        alt={`Iteration ${num}`}
                        className="aspect-[4/5] w-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center uppercase tracking-wide">Output</p>
              </div>
            </div>

            {/* Size badges and download below */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Resize</span>
              <div className="flex items-center gap-1.5">
                {['1:1', '9:16', '16:9', '4:5'].map((size) => (
                  <Badge key={size} variant="outline" className="text-[10px] text-green-500 border-green-500/30 bg-green-500/10">
                    <Check className="w-2.5 h-2.5" />
                    {size}
                  </Badge>
                ))}
              </div>
              <div className="w-px h-4 bg-border" />
              <Badge variant="outline" className="text-[10px]">
                <Download className="w-3 h-3" />
                Download all
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
