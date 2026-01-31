'use client';

import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/landing/Footer';
import { useCases, getAllUseCaseSlugs } from '@/lib/use-cases';

const slugs = getAllUseCaseSlugs();

export default function UseCasesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-foreground/70 text-sm hover:text-foreground transition-colors">
              <img src="/logo.svg" alt="StaticKit" className="w-5 h-5 dark:invert" />
              <span className="font-medium">StaticKit</span>
            </Link>
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              )}
              <Link
                href="/"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="px-6 pt-16 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Page title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
              Use Cases
            </h1>
            <p className="text-muted-foreground mb-12 max-w-2xl">
              Discover how teams use StaticKit&apos;s AI-powered image editor to transform their visual marketing — from product photography to ad creative production.
            </p>

            {/* Use cases grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slugs.map((slug) => {
                const useCase = useCases[slug];
                return (
                  <Link key={slug} href={`/use-cases/${slug}`} className="block group">
                    <div className="rounded-xl border border-border p-6 hover:bg-muted/50 transition-colors h-full">
                      <div className="text-3xl mb-3">{useCase.icon}</div>
                      <h2 className="text-foreground font-medium mb-2 group-hover:text-primary transition-colors">
                        {useCase.title}
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {useCase.excerpt}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
