import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, PLANS, PlanType } from '@/lib/stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    // Validate plan
    if (!plan || !['starter', 'pro', 'ultra'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const selectedPlan = PLANS[plan as PlanType];
    if (!('priceId' in selectedPlan) || !selectedPlan.priceId) {
      return NextResponse.json(
        { error: 'Plan price not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });

    let stripeCustomerId = user?.stripeCustomerId;

    // Create Stripe customer if needed
    if (!stripeCustomerId) {
      const { sessionClaims } = await auth();
      const customer = await stripe.customers.create({
        email: sessionClaims?.email as string || undefined,
        metadata: {
          clerkId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID to Convex (we'll do this via webhook for reliability)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      metadata: {
        clerkId: userId,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          clerkId: userId,
          plan: plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error?.message },
      { status: 500 }
    );
  }
}
