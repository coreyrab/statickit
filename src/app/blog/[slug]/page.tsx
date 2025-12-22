'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

// Blog posts content - add new posts here
const posts: Record<string, {
  title: string;
  date: string;
  author: string;
  authorUrl?: string;
  coverImage?: string;
  content: string;
}> = {
  'why-iteration-beats-creation': {
    title: 'Why iteration beats creation',
    date: '2024-12-22',
    author: 'Corey Rabazinski',
    authorUrl: 'https://www.linkedin.com/in/crabazinski/',
    coverImage: '/blog/iteration-cover.png',
    content: `Most marketers approach ad creative backwards.

They spend weeks concepting, designing, and producing a single "perfect" ad. Then they launch it, cross their fingers, and hope it works.

But the best performing ads aren't created this way. They're iterated.

## The iteration mindset

When you have a winning ad, you don't need to reinvent the wheel. You need to test variations:

- **Same product, new background.** Your protein powder in a gym. Then a kitchen. Then outdoors. Same message, different context.

- **Same message, new model.** Test different demographics. Different ages. Different styles. Find who resonates.

- **Same creative, new format.** Your 1:1 feed ad becomes a 9:16 story. Your landscape becomes a square. Every platform, every placement.

## Why this works

Creative fatigue is real. Your audience stops seeing ads they've seen before. But a slight variation—a new background, a different model—registers as "new" while maintaining the winning formula.

The math is simple: instead of one ad that might work, you have ten variations of an ad that already works.

## What we're building

StaticKit is built for this workflow. Upload your winner. Generate variations. Resize for every platform. Edit with plain english.

Stop creating from scratch. Start iterating from success.`,
  },
};

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = posts[slug];

  if (!post) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Post not found</h1>
          <Link href="/blog" className="text-amber-400 hover:text-amber-300">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  // Parse content into sections
  const renderContent = (content: string) => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, i) => {
      // Heading
      if (paragraph.startsWith('## ')) {
        return (
          <h2 key={i} className="text-xl text-neutral-100 font-serif mt-12 mb-4">
            {paragraph.replace('## ', '')}
          </h2>
        );
      }

      // List items
      if (paragraph.startsWith('- **')) {
        const items = paragraph.split('\n').filter(Boolean);
        return (
          <ul key={i} className="space-y-3 my-6">
            {items.map((item, j) => {
              const match = item.match(/- \*\*(.+?)\*\* (.+)/);
              if (match) {
                return (
                  <li key={j} className="text-neutral-400 leading-relaxed pl-4 border-l-2 border-neutral-800">
                    <strong className="text-neutral-200">{match[1]}</strong> {match[2]}
                  </li>
                );
              }
              return (
                <li key={j} className="text-neutral-400 leading-relaxed pl-4 border-l-2 border-neutral-800">
                  {item.replace('- ', '')}
                </li>
              );
            })}
          </ul>
        );
      }

      // Regular paragraph
      return (
        <p key={i} className="text-neutral-400 leading-relaxed mb-6">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-neutral-300 text-sm hover:text-neutral-100 transition-colors">
              <img src="/logo.svg" alt="StaticKit" className="w-5 h-5" />
              <span className="font-medium">StaticKit</span>
            </Link>
            <Link
              href="/blog"
              className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Blog
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="px-6 pt-8 pb-32">
          <div className="max-w-2xl mx-auto">
            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-10 -mx-6 sm:mx-0 sm:rounded-xl overflow-hidden bg-neutral-900">
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
            <h1 className="font-serif text-3xl sm:text-4xl text-neutral-100 mb-6">
              {post.title}
            </h1>

            {/* Byline */}
            <div className="flex items-center gap-3 mb-12 pb-8 border-b border-neutral-900">
              <div className="text-sm">
                <span className="text-neutral-500">by </span>
                {post.authorUrl ? (
                  <a
                    href={post.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-300 hover:text-amber-400 transition-colors"
                  >
                    {post.author}
                  </a>
                ) : (
                  <span className="text-neutral-300">{post.author}</span>
                )}
              </div>
              <span className="text-neutral-800">·</span>
              <time className="text-neutral-600 text-sm">
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

            {/* Back link */}
            <div className="mt-16 pt-8 border-t border-neutral-900">
              <Link
                href="/blog"
                className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to blog
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
