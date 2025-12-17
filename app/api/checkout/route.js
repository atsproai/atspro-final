import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { priceId } = await req.json();
    
    const session = await stripe.checkout.sessions.create({
      mode: priceId === process.env.STRIPE_PRICE_FREE ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://atspro-final.vercel.app'}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://atspro-final.vercel.app'}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
