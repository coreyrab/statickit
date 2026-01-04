'use client';

import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Blog posts data - add new posts here
const posts = [
  {
    slug: 'gemini-image-generation-no-watermark',
    title: 'How to use Gemini image generation without watermarks',
    date: '2025-01-03',
    excerpt: 'Google\'s Gemini adds watermarks to AI-generated images — unless you use your own API key. Here\'s how.',
    readTime: '5 min read',
  },
  {
    slug: 'natural-language-image-editing',
    title: 'Edit images by describing what you want',
    date: '2025-01-03',
    excerpt: '"Remove the background." "Make it warmer." "Change her shirt to blue." This is image editing now.',
    readTime: '6 min read',
  },
  {
    slug: 'best-free-ai-image-editors',
    title: 'Best free AI image editors in 2026',
    date: '2025-01-03',
    excerpt: 'Most "free AI image editors" aren\'t really free. Here are the tools that actually deliver.',
    readTime: '7 min read',
  },
];

export default function BlogPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-xl mx-auto flex items-center justify-between">
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
        <main className="px-6 pt-16 pb-32">
          <div className="max-w-xl mx-auto">
            {/* Page title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
              Blog
            </h1>
            <p className="text-muted-foreground mb-16">
              Thoughts on AI image editing, creative tools, and making things easier.
            </p>

            {/* Posts list */}
            {posts.length > 0 ? (
              <div className="space-y-12">
                {posts.map((post) => (
                  <article key={post.slug} className="group">
                    <Link href={`/blog/${post.slug}`} className="block">
                      <time className="text-muted-foreground/70 text-xs font-mono">
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                      <h2 className="text-foreground text-xl mt-2 mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                        {post.excerpt}
                      </p>
                      <span className="text-muted-foreground/70 text-xs font-mono">
                        {post.readTime}
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground/70 text-sm font-mono">
                No posts yet. Check back soon.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
