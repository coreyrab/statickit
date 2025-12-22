'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Blog posts data - add new posts here
const posts = [
  {
    slug: 'why-iteration-beats-creation',
    title: 'Why iteration beats creation',
    date: '2024-12-22',
    excerpt: 'The best performing ads aren\'t created from scratch. They\'re iterated from winners.',
    readTime: '3 min read',
  },
];

export default function BlogPage() {
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
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-neutral-300 text-sm hover:text-neutral-100 transition-colors">
              <img src="/logo.svg" alt="StaticKit" className="w-5 h-5" />
              <span className="font-medium">StaticKit</span>
            </Link>
            <Link
              href="/"
              className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </header>

        {/* Main */}
        <main className="px-6 pt-16 pb-32">
          <div className="max-w-xl mx-auto">
            {/* Page title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-neutral-100 mb-4">
              Blog
            </h1>
            <p className="text-neutral-500 mb-16">
              Thoughts on ad creative, iteration, and performance marketing.
            </p>

            {/* Posts list */}
            {posts.length > 0 ? (
              <div className="space-y-12">
                {posts.map((post) => (
                  <article key={post.slug} className="group">
                    <Link href={`/blog/${post.slug}`} className="block">
                      <time className="text-neutral-600 text-xs font-mono">
                        {new Date(post.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                      <h2 className="text-neutral-100 text-xl mt-2 mb-2 group-hover:text-amber-400 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-neutral-500 text-sm leading-relaxed mb-2">
                        {post.excerpt}
                      </p>
                      <span className="text-neutral-600 text-xs font-mono">
                        {post.readTime}
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600 text-sm font-mono">
                No posts yet. Check back soon.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
