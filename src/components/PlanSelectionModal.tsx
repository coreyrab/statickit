'use client';

import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanSelectionModal({ isOpen, onClose }: PlanSelectionModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const handleSelectPlan = async (planKey: PlanKey) => {
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
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
      setLoadingPlan(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Choose your plan</h2>
              <p className="text-white/50 text-sm mt-1">
                Select a plan to start creating ad variations
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-xl p-5 relative flex flex-col ${
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

                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-white">{plan.name}</h3>
                  <p className="text-white/50 text-xs mt-1">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/50 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-violet-400' : 'text-white/40'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={loadingPlan !== null}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-violet-500 hover:bg-violet-400 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {loadingPlan === plan.key ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Select Plan'
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
