'use client';

import { Check, Key, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PricingProps {
  onGetStarted?: () => void;
}

export function Pricing({ onGetStarted }: PricingProps) {
  const features = [
    'Unlimited image variations',
    'All variation types (color, background, model, product)',
    'AI-powered resize to any format',
    'Version history',
    'Download in PNG, JPG, WebP',
    'No account required',
  ];

  return (
    <section id="pricing" className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Free to use
          </h2>
          <p className="text-muted-foreground">
            Just add your own Gemini API key and start creating.
          </p>
        </div>

        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Bring Your Own Key</CardTitle>
            <CardDescription className="text-base">
              Get a free Gemini API key from Google AI Studio
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <ul className="grid sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onGetStarted} size="lg">
                <Sparkles className="w-4 h-4" />
                Get started
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('https://aistudio.google.com/apikey', '_blank')}
              >
                Get API key
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Your API key is stored locally in your browser. We never see or store your key.
        </p>
      </div>
    </section>
  );
}
