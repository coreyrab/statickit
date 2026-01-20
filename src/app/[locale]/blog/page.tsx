'use client';

import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/landing/Footer';
import { getAllPosts, type BlogMessages } from '@/lib/blog-posts';
import { useTranslations, useMessages, useLocale } from 'next-intl';

export default function BlogPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const messages = useMessages();
  const t = useTranslations('blog');

  // Get blog messages for posts
  const blogMessages = (messages as { blog?: BlogMessages }).blog;

  // Get translated posts
  const posts = blogMessages ? getAllPosts(blogMessages) : [];

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format date based on locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
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
                {t('back')}
              </Link>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="px-6 pt-16 pb-20">
          <div className="max-w-3xl mx-auto">
            {/* Page title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
              {t('pageTitle')}
            </h1>
            <p className="text-muted-foreground mb-12">
              {t('pageDescription')}
            </p>

            {/* Posts grid */}
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <article key={post.slug} className="group">
                    <Link href={`/blog/${post.slug}`} className="block">
                      {/* Cover image */}
                      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-4">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                          <time className="font-mono">
                            {formatDate(post.date)}
                          </time>
                          <span>·</span>
                          <span className="font-mono">{post.readTime}</span>
                        </div>
                        <h2 className="text-foreground font-medium leading-snug group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground/70 text-sm font-mono">
                {t('noPosts')}
              </p>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
