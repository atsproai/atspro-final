import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Determine subscription type based on price ID
    const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;
    
    let subscriptionStatus = 'monthly';
    
    // Get the subscription from session
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;
      
      if (priceId === annualPriceId) {
        subscriptionStatus = 'annual';
      } else if (priceId === monthlyPriceId) {
        subscriptionStatus = 'monthly';
      }
    }

    // Update or insert user_scans record
    const { data: existingRecord } = await supabase
      .from('user_scans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRecord) {
      // Update existing record
      const { error } = await supabase
        .from('user_scans')
        .update({
          subscription_status: subscriptionStatus,
          scan_count: 0 // Reset scan count for new subscribers
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('user_scans')
        .insert({
          user_id: userId,
          scan_count: 0,
          subscription_status: subscriptionStatus
        });

      if (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      subscriptionStatus
    });

  } catch (error) {
    console.error('Error verifying checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
