'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Loader2, Trash2, User, BarChart3, CreditCard, Sparkles, ExternalLink, Check, Key, X, Shield } from 'lucide-react';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { SecurityBadge } from '@/components/onboarding';

// Wrapper component to handle Suspense for useSearchParams
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const searchParams = useSearchParams();
  const generations = useQuery(api.generations.getByUser);
  const dbUser = useQuery(api.users.getCurrent);
  const deleteGeneration = useMutation(api.generations.remove);
  const hasApiKeyQuery = useQuery(api.users.hasApiKey);
  const setApiKeyMutation = useMutation(api.users.setApiKey);
  const removeApiKeyMutation = useMutation(api.users.removeApiKey);

  const [defaultWeirdness, setDefaultWeirdness] = useState(50);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isRemovingKey, setIsRemovingKey] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  // Check for success param from Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessMessage(true);
      // Remove the query param from URL
      window.history.replaceState({}, '', '/settings');
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  // Check for setup mode from onboarding redirect
  useEffect(() => {
    if (searchParams.get('setup') === 'true') {
      setIsSetupMode(true);
      // Remove the query param from URL
      window.history.replaceState({}, '', '/settings');
      // Scroll to API key section after a short delay
      setTimeout(() => {
        const apiKeySection = document.getElementById('api-key-section');
        if (apiKeySection) {
          apiKeySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [searchParams]);

  // Load saved weirdness preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('defaultWeirdness');
    if (saved) {
      setDefaultWeirdness(parseInt(saved));
    }
  }, []);

  // Save weirdness preference to localStorage
  const handleWeirdnessChange = (value: number) => {
    setDefaultWeirdness(value);
    localStorage.setItem('defaultWeirdness', value.toString());
  };

  const getWeirdnessLabel = (value: number) => {
    if (value <= 20) return { label: 'Standard', color: 'text-blue-400' };
    if (value <= 40) return { label: 'Lifestyle', color: 'text-green-400' };
    if (value <= 60) return { label: 'Attention', color: 'text-yellow-400' };
    if (value <= 80) return { label: 'Shareable', color: 'text-orange-400' };
    return { label: 'Viral', color: 'text-pink-400' };
  };

  // Calculate usage stats
  const totalSessions = generations?.length || 0;
  const totalVariations = generations?.reduce((acc, gen) => acc + (gen.variations?.length || 0), 0) || 0;

  // Plan display info
  const planInfo: Record<string, { name: string; credits: number; color: string }> = {
    none: { name: 'No Plan', credits: 0, color: 'text-gray-400' },
    starter: { name: 'Starter', credits: 30, color: 'text-blue-400' },
    pro: { name: 'Pro', credits: 300, color: 'text-violet-400' },
    ultra: { name: 'Ultra', credits: 800, color: 'text-amber-400' },
  };

  const currentPlan = dbUser?.plan || 'none';
  const currentPlanInfo = planInfo[currentPlan] || planInfo.none;
  const hasSubscription = currentPlan !== 'none' && dbUser?.stripeCustomerId;

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Portal error:', data.error);
        alert(data.error || 'Failed to open subscription management');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open subscription management');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    }
  };

  const handleDeleteAll = async () => {
    if (!generations || generations.length === 0) return;

    setIsDeleting(true);
    try {
      for (const gen of generations) {
        await deleteGeneration({ id: gen._id });
      }
    } catch (err) {
      console.error('Delete all error:', err);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteAll(false);
    }
  };

  const handleValidateAndSaveKey = async () => {
    if (!apiKeyInput.trim()) return;

    setIsValidatingKey(true);
    setApiKeyError(null);

    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      const data = await response.json();

      if (!data.valid) {
        setApiKeyError(data.error || 'Invalid API key');
        return;
      }

      // Save encrypted key to Convex
      await setApiKeyMutation({
        encryptedApiKey: data.encrypted,
        apiKeyIv: data.iv,
        apiKeyAuthTag: data.authTag,
      });

      setApiKeyInput('');
      setApiKeyError(null);
      setIsSetupMode(false); // Clear setup mode highlight
    } catch (err) {
      console.error('API key validation error:', err);
      setApiKeyError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    setIsRemovingKey(true);
    try {
      await removeApiKeyMutation({});
    } catch (err) {
      console.error('Remove API key error:', err);
    } finally {
      setIsRemovingKey(false);
    }
  };

  // Show loading while checking auth
  if (!isUserLoaded) {
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
          <h2 className="text-xl font-semibold mb-4">Sign in to access settings</h2>
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
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="StaticKit" className="w-7 h-7" />
            <span className="text-lg">StaticKit</span>
          </Link>

          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Success Message - Hidden for BYOK-only mode */}

        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-white/50 text-sm">Manage your preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="font-semibold">Account</h2>
                <p className="text-sm text-white/50">Your account information</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Email</span>
                <span className="font-medium">{user.emailAddresses?.[0]?.emailAddress || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-white/60">Name</span>
                <span className="font-medium">{user.fullName || user.firstName || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <div
            id="api-key-section"
            className={`bg-white/5 border rounded-2xl p-6 transition-all duration-300 ${
              isSetupMode && !hasApiKeyQuery
                ? 'border-violet-500/50 ring-2 ring-violet-500/20'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Google API Key</h2>
                  <p className="text-sm text-white/50">Use your own API key for unlimited generations</p>
                </div>
              </div>
              <SecurityBadge variant="tooltip">
                Your API key is encrypted with AES-256-GCM before storage. It&apos;s only decrypted server-side when needed for API calls. We never log or share your key.
              </SecurityBadge>
            </div>

            {hasApiKeyQuery ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">API Key Connected</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveKey}
                    disabled={isRemovingKey}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  >
                    {isRemovingKey ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Remove Key'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white/40">
                  {dbUser?.apiKeyAddedAt && (
                    <>Key added on {new Date(dbUser.apiKeyAddedAt).toLocaleDateString()}. </>
                  )}
                  Your key is encrypted and stored securely.
                </p>
                <div className="mt-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <p className="text-sm text-emerald-400">
                    You have unlimited access to the image editor using your own API key.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIza..."
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setApiKeyError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && apiKeyInput.trim()) {
                        handleValidateAndSaveKey();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  />
                  <Button
                    onClick={handleValidateAndSaveKey}
                    disabled={isValidatingKey || !apiKeyInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {isValidatingKey ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add Key'
                    )}
                  </Button>
                </div>
                {apiKeyError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <X className="w-4 h-4" />
                    {apiKeyError}
                  </div>
                )}
                <p className="text-xs text-white/40">
                  Get your API key from{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60">
                      <span className="font-medium text-emerald-400">Secure Storage:</span> Your key is encrypted with AES-256-GCM before storage and only decrypted server-side when needed. We never log or share your key.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-white/60">
                    <span className="font-medium text-white">Free:</span> Use your own API key for unlimited generations.
                    Download your images directly after generating.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Subscription & Billing Section - Hidden for BYOK-only mode */}
          {/* TODO: Uncomment when paid tiers are ready
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            ...subscription UI...
          </div>
          */}

          {/* Usage Stats Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold">Usage Stats</h2>
                <p className="text-sm text-white/50">Your generation history</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-violet-400">{totalSessions}</p>
                <p className="text-sm text-white/50">Saved Sessions</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-indigo-400">{totalVariations}</p>
                <p className="text-sm text-white/50">Total Iterations</p>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold">Preferences</h2>
                <p className="text-sm text-white/50">Customize your experience</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80">Default Virality Level</span>
                  <span className={`text-sm font-medium ${getWeirdnessLabel(defaultWeirdness).color}`}>
                    {getWeirdnessLabel(defaultWeirdness).label}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={defaultWeirdness}
                  onChange={(e) => handleWeirdnessChange(parseInt(e.target.value))}
                  className="w-full weirdness-slider"
                />
                <p className="text-xs text-white/40 mt-1">
                  This will be the default setting for generating new iterations
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-semibold text-red-400">Danger Zone</h2>
                <p className="text-sm text-white/50">Irreversible actions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80">Delete All Saved Ads</p>
                  <p className="text-sm text-white/40">
                    Permanently delete all {totalSessions} saved sessions and {totalVariations} iterations
                  </p>
                </div>
                {confirmDeleteAll ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDeleteAll(false)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleDeleteAll}
                      disabled={isDeleting || totalSessions === 0}
                      className="bg-red-600 hover:bg-red-500"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Confirm Delete'
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDeleteAll(true)}
                    disabled={totalSessions === 0}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 disabled:opacity-50"
                  >
                    Delete All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-white/40">
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
