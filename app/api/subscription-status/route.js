import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's subscription status from database
    const { data, error } = await supabaseAdmin
      .from('user_scans')
      .select('subscription_status')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching subscription status:', error);
      return NextResponse.json({ subscriptionStatus: 'free' });
    }

    const subscriptionStatus = data?.subscription_status || 'free';

    return NextResponse.json({ subscriptionStatus });

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ subscriptionStatus: 'free' });
  }
}
