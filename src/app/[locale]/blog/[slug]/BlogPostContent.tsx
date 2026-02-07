'use client';

import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { Footer } from '@/components/landing/Footer';
import type { BlogPost } from '@/lib/blog-posts';

interface BlogPostContentProps {
  post: BlogPost;
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse inline markdown (bold and links) into JSX
  const parseInline = (text: string): React.ReactNode => {
    const inlineRegex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2] !== undefined) {
        // Bold: **text**
        parts.push(<strong key={`b${match.index}`} className="text-foreground">{match[2]}</strong>);
      } else if (match[3] !== undefined) {
        // Link: [text](url)
        parts.push(
          <a
            key={`l${match.index}`}
            href={match[4]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            {match[3]}
          </a>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  // Parse content into sections
  const renderContent = (content: string) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, i) => {
      // Image - ![alt text](src)
      const imageMatch = paragraph.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        return (
          <figure key={i} className="my-8">
            <img
              src={imageMatch[2]}
              alt={imageMatch[1]}
              className="w-full rounded-lg border border-border"
            />
            {imageMatch[1] && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2">
                {imageMatch[1]}
              </figcaption>
            )}
          </figure>
        );
      }

      // Heading
      if (paragraph.startsWith('## ')) {
        return (
          <h2 key={i} className="text-2xl text-foreground font-serif font-semibold mt-12 mb-4">
            {parseInline(paragraph.replace('## ', ''))}
          </h2>
        );
      }

      // Unordered list items
      if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter(Boolean);
        return (
          <ul key={i} className="space-y-3 my-6">
            {items.map((item, j) => (
              <li key={j} className="text-muted-foreground text-[17px] leading-[1.8] pl-4 border-l-2 border-border">
                {parseInline(item.replace(/^- /, ''))}
              </li>
            ))}
          </ul>
        );
      }

      // Ordered (numbered) list items
      if (/^\d+\.\s/.test(paragraph)) {
        const items = paragraph.split('\n').filter(Boolean);
        return (
          <ol key={i} className="space-y-3 my-6 list-decimal list-outside pl-6">
            {items.map((item, j) => (
              <li key={j} className="text-muted-foreground text-[17px] leading-[1.8]">
                {parseInline(item.replace(/^\d+\.\s/, ''))}
              </li>
            ))}
          </ol>
        );
      }

      // Regular paragraph
      return (
        <p key={i} className="text-muted-foreground text-[17px] leading-[1.8] mb-6">
          {parseInline(paragraph)}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
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
                href="/blog"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Blog
              </Link>
            </div>
          </div>
        </header>

        {/* Article */}
        <article className="px-6 pt-8 pb-20">
          <div className="max-w-2xl mx-auto">
            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-10 -mx-6 sm:mx-0 sm:rounded-xl overflow-hidden bg-muted">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto"
                  onError={(e) => {
                    // Hide if image doesn't exist
                    (e.target as HTMLElement).parentElement!.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">
              {post.title}
            </h1>

            {/* Byline */}
            <div className="flex items-center gap-3 mb-12 pb-8 border-b border-border">
              <div className="text-sm">
                <span className="text-muted-foreground">by </span>
                {post.authorUrl ? (
                  <a
                    href={post.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/70 hover:text-primary transition-colors"
                  >
                    {post.author}
                  </a>
                ) : (
                  <span className="text-foreground/70">{post.author}</span>
                )}
              </div>
              <span className="text-border">·</span>
              <time className="text-muted-foreground/70 text-sm">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </div>

            {/* Content */}
            <div className="post-content">
              {renderContent(post.content)}
            </div>

            {/* CTA */}
            <div className="mt-16 p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Try StaticKit free
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Edit images with AI using your own API key. No account required, no watermarks.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg transition-colors"
              >
                Start editing
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            {/* Back link */}
            <div className="mt-8 pt-8 border-t border-border">
              <Link
                href="/blog"
                className="text-muted-foreground text-sm hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to blog
              </Link>
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}
