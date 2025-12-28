import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const subscriptionId = session.subscription;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    let subscriptionStatus = 'free';
    if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
      subscriptionStatus = 'monthly';
    } else if (priceId === process.env.STRIPE_ANNUAL_PRICE_ID) {
      subscriptionStatus = 'annual';
    }

    const { error } = await supabase
      .from('user_scans')
      .upsert({
        user_id: userId,
        subscription_status: subscriptionStatus,
        scan_count: 0,
      });

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`Subscription activated for user ${userId}: ${subscriptionStatus}`);
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    console.log('Subscription cancelled for customer:', customerId);
  }

  return NextResponse.json({ received: true });
}
