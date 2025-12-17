import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  try {
    // Get authenticated user
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check/create user in database
    let { data: userData, error: userError } = await supabase
      .from('user_scans')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If user doesn't exist, create them
    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from('user_scans')
        .insert([{ user_id: userId, scan_count: 0, subscription_status: 'free' }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      userData = newUser;
    }

    // Check if user has reached their limit
    if (userData.subscription_status === 'free' && userData.scan_count >= 1) {
      return NextResponse.json({ 
        error: 'Free plan limit reached. Please upgrade to continue.',
        limitReached: true 
      }, { status: 403 });
    }

    const formData = await req.formData();
    const resume = formData.get('resume');
    const jobDescription = formData.get('jobDescription');

    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 });
    }

    const resumeText = await resume.text();

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.

Job Description:
${jobDescription}

Resume:
${resumeText}

Provide:
1. An ATS compatibility score (0-100)
2. List of missing keywords from the job description
3. An optimized version of the resume that includes the missing keywords naturally

Format your response as:
SCORE: [number]
MISSING: [comma-separated keywords]
OPTIMIZED_RESUME:
[the optimized resume text]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;
    const scoreMatch = responseText.match(/SCORE:\s*(\d+)/);
    const missingMatch = responseText.match(/MISSING:\s*(.+?)(?=OPTIMIZED_RESUME:|$)/s);
    const optimizedMatch = responseText.match(/OPTIMIZED_RESUME:\s*(.+)/s);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const missing = missingMatch ? missingMatch[1].trim().split(',').map(k => k.trim()) : [];
    const optimizedResume = optimizedMatch ? optimizedMatch[1].trim() : resumeText;

    // Increment scan count
    const { error: updateError } = await supabase
      .from('user_scans')
      .update({ scan_count: userData.scan_count + 1 })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating scan count:', updateError);
    }

    return NextResponse.json({
      score,
      missing,
      optimizedResume,
      scansRemaining: userData.subscription_status === 'free' ? 0 : 'unlimited'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
