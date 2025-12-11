import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, PlanType } from '@/lib/stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import Stripe from 'stripe';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Disable body parsing for webhook
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Reset credits on successful payment (subscription renewal)
        if (invoice.billing_reason === 'subscription_cycle') {
          await handleSubscriptionRenewal(invoice);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for customer:', invoice.customer);
        // You might want to send an email notification here
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkId = session.metadata?.clerkId;
  const plan = session.metadata?.plan as PlanType;

  if (!clerkId || !plan) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Update user with Stripe customer ID and subscription info
  const customerId = session.customer as string;

  // First, set the Stripe customer ID
  await convex.mutation(api.users.setStripeCustomerId, {
    clerkId,
    stripeCustomerId: customerId,
  });

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;

  const planCredits = PLANS[plan]?.credits || PLANS.starter.credits;

  // Update subscription info
  await convex.mutation(api.users.updateSubscription, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripePriceId: subscription.items.data[0]?.price.id,
    plan: plan,
    subscriptionStatus: subscription.status,
    // Use billing_cycle_anchor as a reference point (current_period_end removed in Stripe v20)
    currentPeriodEnd: subscription.billing_cycle_anchor,
    credits: planCredits,
  });

  console.log(`Checkout completed for ${clerkId}, plan: ${plan}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const plan = subscription.metadata?.plan as PlanType || 'free';

  await convex.mutation(api.users.updateSubscription, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id,
    plan: plan,
    subscriptionStatus: subscription.status,
    currentPeriodEnd: subscription.billing_cycle_anchor,
  });

  console.log(`Subscription updated for customer ${customerId}, status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Remove plan and credits when subscription is canceled
  await convex.mutation(api.users.updateSubscription, {
    stripeCustomerId: customerId,
    plan: 'none',
    subscriptionStatus: 'canceled',
    credits: 0,
  });

  console.log(`Subscription canceled for customer ${customerId}`);
}

async function handleSubscriptionRenewal(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Reset credits on renewal
  await convex.mutation(api.users.resetCredits, {
    stripeCustomerId: customerId,
  });

  console.log(`Credits reset for customer ${customerId}`);
}
