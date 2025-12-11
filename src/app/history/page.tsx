'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Download, Loader2, ImageIcon, Play, Trash2, Settings } from 'lucide-react';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const generations = useQuery(api.generations.getByUser);
  const deleteGeneration = useMutation(api.generations.remove);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDelete = async (id: Id<"generations">) => {
    setDeletingId(id);
    try {
      await deleteGeneration({ id });
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const handleResume = (generation: any) => {
    // Store the generation data in sessionStorage and navigate to main page
    sessionStorage.setItem('resumeSession', JSON.stringify({
      originalImageUrl: generation.originalImageUrl,
      originalFilename: generation.originalFilename,
      aspectRatio: generation.aspectRatio,
      analysis: generation.analysis,
      variations: generation.variations,
    }));
    router.push('/?resume=true');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Show loading while checking auth
  if (!isUserLoaded || (user && generations === undefined)) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Sign in to view your ads</h2>
          <SignInButton mode="modal">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500">
              Sign in
            </Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="StaticKit" className="w-7 h-7" />
            <span className="text-lg">StaticKit</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">My Ads</h1>
            <p className="text-white/50 text-sm">Your saved ad iterations</p>
          </div>
        </div>

        {!generations || generations.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No saved ads yet</h2>
            <p className="text-white/50 mb-6">
              Your ad iterations will appear here after you save them.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your First Iteration
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {generations.map((gen) => (
              <div key={gen._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Original image thumbnail */}
                  <div className="w-24 h-28 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                    {gen.originalImageUrl ? (
                      <img
                        src={gen.originalImageUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium truncate">{gen.originalFilename || 'Uploaded ad'}</p>
                        <p className="text-sm text-white/50">
                          {gen.aspectRatio} • {gen.variations?.length || 0} iterations
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {formatDate(gen._creationTime)}
                        </p>
                        {gen.analysis?.product && (
                          <p className="text-sm text-white/60 mt-2 line-clamp-1">
                            {gen.analysis.product}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleResume(gen)}
                          className="bg-violet-600 hover:bg-violet-500"
                        >
                          <Play className="w-4 h-4 mr-1.5" />
                          Resume
                        </Button>
                        {confirmDelete === gen._id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDelete(null)}
                              className="text-white/60 hover:text-white hover:bg-white/10"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDelete(gen._id)}
                              disabled={deletingId === gen._id}
                              className="bg-red-600 hover:bg-red-500"
                            >
                              {deletingId === gen._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete(gen._id)}
                            className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variation thumbnails */}
                {gen.variations && gen.variations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {gen.variations.map((variation) => (
                        <div key={variation.id} className="group relative">
                          <div className="aspect-[4/5] bg-white/10 rounded-lg overflow-hidden">
                            {variation.image_url ? (
                              <img
                                src={variation.image_url}
                                alt={variation.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-white/30" />
                              </div>
                            )}
                            {variation.image_url && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => handleDownload(variation.image_url!, `${variation.title}.png`)}
                                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-white/50 truncate mt-1">{variation.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-white/40">
          <p>Powered by Google Gemini AI</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
