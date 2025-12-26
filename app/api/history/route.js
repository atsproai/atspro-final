import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's resume history
    const { data: resumeHistory, error: resumeError } = await supabaseAdmin
      .from('resume_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (resumeError) {
      console.error('Error fetching resume history:', resumeError);
      return NextResponse.json({ error: 'Failed to fetch resume history' }, { status: 500 });
    }

    // Fetch user's interview prep history
    const { data: interviewHistory, error: interviewError } = await supabaseAdmin
      .from('interview_prep_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (interviewError) {
      console.error('Error fetching interview prep history:', interviewError);
      return NextResponse.json({ error: 'Failed to fetch interview prep history' }, { status: 500 });
    }

    return NextResponse.json({ 
      history: resumeHistory || [],
      interviewHistory: interviewHistory || []
    });

  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
