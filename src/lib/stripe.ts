import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors when env vars aren't available
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility (will fail at build time if used at module level)
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
} as Stripe;

// Price IDs for each plan (set these in your Stripe dashboard and env vars)
export const STRIPE_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  ultra: process.env.STRIPE_PRICE_ULTRA || '',
} as const;

// Plan details matching landing page pricing
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    credits: 30,
    priceId: STRIPE_PRICES.starter,
    features: ['30 iterations/month', 'All variation types', 'Version history', 'Basic resize', 'Email support'],
  },
  pro: {
    name: 'Pro',
    price: 49,
    credits: 300,
    priceId: STRIPE_PRICES.pro,
    features: ['300 iterations/month', 'All variation types', 'Version history', 'AI resize to any format', 'Priority support'],
  },
  ultra: {
    name: 'Ultra',
    price: 99,
    credits: 800,
    priceId: STRIPE_PRICES.ultra,
    features: ['800 iterations/month', 'All variation types', 'Version history', 'AI resize to any format', 'Dedicated support'],
  },
} as const;

export type PlanType = keyof typeof PLANS;
