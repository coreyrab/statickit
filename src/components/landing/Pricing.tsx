'use client';

import { useState } from 'react';
import { SignInButton, useUser } from '@clerk/nextjs';
import { Check, Loader2 } from 'lucide-react';

type PlanKey = 'starter' | 'pro' | 'ultra';

const plans: Array<{
  key: PlanKey;
  name: string;
  price: string;
  period: string;
  description: string;
  credits: number;
  features: string[];
  popular: boolean;
}> = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$19',
    period: '/month',
    description: 'For individual creators',
    credits: 30,
    features: [
      '30 iterations/month',
      'All variation types',
      'Version history',
      'Basic resize',
      'Email support',
    ],
    popular: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For growing brands',
    credits: 300,
    features: [
      '300 iterations/month',
      'All variation types',
      'Version history',
      'AI resize to any format',
      'Priority support',
    ],
    popular: true,
  },
  {
    key: 'ultra',
    name: 'Ultra',
    price: '$99',
    period: '/month',
    description: 'For power users',
    credits: 800,
    features: [
      '800 iterations/month',
      'All variation types',
      'Version history',
      'AI resize to any format',
      'Dedicated support',
    ],
    popular: false,
  },
];

export function Pricing() {
  const { isSignedIn, isLoaded } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const handleCheckout = async (planKey: PlanKey) => {
    if (!isSignedIn) return;

    setLoadingPlan(planKey);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
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
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-20 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Simple pricing
          </h2>
          <p className="text-white/50">
            Choose the plan that fits your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-xl p-6 relative flex flex-col ${
                plan.popular
                  ? 'bg-violet-500/10 border-2 border-violet-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-lg text-white mb-1">{plan.name}</h3>
                <p className="text-white/50 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/50">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-violet-400' : 'text-white/40'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isLoaded && isSignedIn ? (
                <button
                  onClick={() => handleCheckout(plan.key)}
                  disabled={loadingPlan !== null}
                  className={`w-full py-2.5 rounded-lg font-medium transition-colors mt-6 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-violet-500 hover:bg-violet-400 text-white disabled:bg-violet-500/50'
                      : 'bg-white/10 hover:bg-white/20 text-white disabled:bg-white/5'
                  }`}
                >
                  {loadingPlan === plan.key ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors mt-6 ${
                      plan.popular
                        ? 'bg-violet-500 hover:bg-violet-400 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    Get started
                  </button>
                </SignInButton>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-white/40 mt-10">
          All plans include a 7-day money-back guarantee. Need more?{' '}
          <a href="mailto:hello@statickit.com" className="text-white/60 hover:text-white underline underline-offset-2">
            Contact us
          </a>{' '}
          for enterprise plans.
        </p>
      </div>
    </section>
  );
}
