'use client';

import { useState } from 'react';
import { Loader2, Check, ArrowRight } from 'lucide-react';

export function ComingSoon() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('loading');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'coming-soon' }),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500/30">
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
            <div className="flex items-center gap-2 text-neutral-300 text-sm">
              <img src="/logo.svg" alt="StaticKit" className="w-5 h-5" />
              <span className="font-medium">StaticKit</span>
            </div>
            <a
              href="/blog"
              className="text-neutral-500 text-sm hover:text-neutral-300 transition-colors"
            >
              Blog
            </a>
          </div>
        </header>

        {/* Main */}
        <main className="px-6 pt-16 pb-32">
          <div className="max-w-xl mx-auto">
            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl text-neutral-100 leading-tight mb-6">
              AI image editor<br />
              for marketers
            </h1>

            {/* Description */}
            <p className="text-neutral-400 text-lg leading-relaxed mb-12 max-w-md">
              Upload an ad. Get variations. Resize to any format.
              Edit with plain english. Ship faster.
            </p>

            {/* Email signup */}
            {status === 'success' ? (
              <div className="flex items-center gap-3 text-neutral-300 font-mono text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{message}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 font-mono text-sm transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  className="px-5 py-3 bg-amber-500 text-neutral-900 rounded-lg font-medium text-sm hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Notify me
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {status === 'error' && (
              <p className="mt-3 text-red-400 text-sm font-mono">{message}</p>
            )}

            {/* What we're building */}
            <div className="mt-32">
              <h2 className="text-neutral-500 text-xs font-mono uppercase tracking-widest mb-8">
                What we're building
              </h2>

              <div className="space-y-8">
                <div className="group">
                  <h3 className="text-neutral-200 mb-2">Iteration, not creation</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    You already have a winning ad. Upload it. We'll generate
                    variations—new backgrounds, new models, new contexts.
                    Same product, different environments.
                  </p>
                </div>

                <div className="group">
                  <h3 className="text-neutral-200 mb-2">Every format, one click</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    1:1 for feeds. 9:16 for stories. 16:9 for YouTube.
                    AI-powered resize that actually understands composition.
                    Not just cropping.
                  </p>
                </div>

                <div className="group">
                  <h3 className="text-neutral-200 mb-2">Edit in plain english</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    "Make the lighting warmer." "Change his shirt to blue."
                    "Add a sunset." Describe what you want. Get it.
                  </p>
                </div>

                <div className="group">
                  <h3 className="text-neutral-200 mb-2">Version control for images</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    Every edit saved. Every branch tracked. Navigate your
                    creative history like code. Never lose a good version.
                  </p>
                </div>
              </div>
            </div>

            {/* Terminal-style footer note */}
            <div className="mt-32 pt-8 border-t border-neutral-900 flex items-center justify-between">
              <p className="text-neutral-600 text-xs font-mono">
                launching q1 2026
              </p>
              <a
                href="/?app=true"
                className="text-neutral-600 text-xs font-mono hover:text-neutral-400 transition-colors"
              >
                open app →
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
