import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase';
import pdf from 'pdf-parse';

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
    let { data: userData, error: userError } = await supabaseAdmin
      .from('user_scans')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If user doesn't exist, create them
    if (userError && userError.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabaseAdmin
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

    // Parse PDF to extract text
    const resumeBuffer = Buffer.from(await resume.arrayBuffer());
    const pdfData = await pdf(resumeBuffer);
    const resumeText = pdfData.text;

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description and create an optimized version plus a cover letter.

Job Description:
${jobDescription}

Current Resume:
${resumeText}

Your task:
1. Calculate an ATS compatibility score (0-100) based on keyword matching
2. Identify missing keywords from the job description
3. Create an optimized resume using the ACTUAL person's information from their current resume (same name, contact info, experience, etc.) - just improve it by naturally incorporating missing keywords
4. Write a professional cover letter tailored to this job

CRITICAL FORMATTING RULES:
- Use the person's REAL name, contact info, and experience from their resume
- NO markdown symbols (no *, #, -, bullets, etc.)
- Use simple plain text with line breaks for sections
- Make it clean and ready to copy/paste

Format your response EXACTLY like this:

SCORE: [number only, e.g., 75]
MISSING: [comma-separated keywords, e.g., Docker, Kubernetes, GraphQL]
OPTIMIZED_RESUME:
[Full optimized resume in plain text format. Use the actual person's name and info. Include sections like CONTACT, SUMMARY, EXPERIENCE, SKILLS, EDUCATION. No special characters or formatting symbols.]

COVER_LETTER:
[Professional cover letter in plain text addressing this specific job. Use the person's real name and relevant experience from their resume. No special formatting symbols.]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;
    const scoreMatch = responseText.match(/SCORE:\s*(\d+)/);
    const missingMatch = responseText.match(/MISSING:\s*(.+?)(?=OPTIMIZED_RESUME:|$)/s);
    const optimizedMatch = responseText.match(/OPTIMIZED_RESUME:\s*(.+?)(?=COVER_LETTER:|$)/s);
    const coverLetterMatch = responseText.match(/COVER_LETTER:\s*(.+)/s);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const missing = missingMatch ? missingMatch[1].trim().split(',').map(k => k.trim()) : [];
    const optimizedResume = optimizedMatch ? optimizedMatch[1].trim() : resumeText;
    const coverLetter = coverLetterMatch ? coverLetterMatch[1].trim() : '';

    // Increment scan count
    const { error: updateError } = await supabaseAdmin
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
      coverLetter,
      scansRemaining: userData.subscription_status === 'free' ? 0 : 'unlimited'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
