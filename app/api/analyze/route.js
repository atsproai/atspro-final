import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestTracker = new Map();

function getRateLimitKey(userId, ip) {
  return `${userId}-${ip}`;
}

function checkRateLimit(key) {
  const now = Date.now();
  const userRequests = requestTracker.get(key) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  requestTracker.set(key, recentRequests);
  
  setTimeout(() => {
    const current = requestTracker.get(key) || [];
    const filtered = current.filter(time => Date.now() - time < RATE_LIMIT_WINDOW);
    if (filtered.length === 0) {
      requestTracker.delete(key);
    } else {
      requestTracker.set(key, filtered);
    }
  }, RATE_LIMIT_WINDOW);
  
  return true;
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = getRateLimitKey(userId, ip);
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please wait a moment before trying again.',
        rateLimited: true 
      }, { status: 429 });
    }

    let { data: userData, error: userError } = await supabaseAdmin
      .from('user_scans')
      .select('*')
      .eq('user_id', userId)
      .single();

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

    if (userData.subscription_status === 'free' && userData.scan_count >= 1) {
      return NextResponse.json({ 
        error: 'Free plan limit reached. Upgrade to continue analyzing resumes.',
        limitReached: true 
      }, { status: 403 });
    }

    const formData = await req.formData();
    const resume = formData.get('resume');
    const jobDescription = formData.get('jobDescription');

    if (!resume || !jobDescription) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 });
    }

    if (resume.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume file too large. Maximum 10MB.' }, { status: 400 });
    }

    if (jobDescription.length > 10000) {
      return NextResponse.json({ error: 'Job description too long. Maximum 10,000 characters.' }, { status: 400 });
    }

    const jobTitle = jobDescription.split('\n')[0].substring(0, 100) || 'Untitled Job';

    const resumeBuffer = await resume.arrayBuffer();
    const resumeBase64 = Buffer.from(resumeBuffer).toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: resumeBase64
            }
          },
          {
            type: 'text',
            text: `You are an ATS (Applicant Tracking System) expert. Analyze the resume in the PDF against this job description and create an optimized version plus a cover letter.

Job Description:
${jobDescription}

Your task:
1. Calculate an ATS compatibility score (0-100) based on keyword matching
2. Identify missing keywords from the job description
3. Analyze compatibility with major ATS systems (Workday, Greenhouse, Lever, Taleo)
4. Identify any formatting issues that could break ATS parsing
5. Create an optimized resume using the ACTUAL person's information
6. Write a professional cover letter tailored to this job

CRITICAL FORMATTING RULES:
- Use the person's REAL name, contact info, and experience from their resume
- NO markdown symbols (no *, #, -, bullets, etc.)
- Use simple plain text with line breaks for sections
- Make it clean and ready to copy/paste

Format your response EXACTLY like this:

SCORE: [number only, e.g., 75]
MISSING: [comma-separated keywords, e.g., Docker, Kubernetes, GraphQL]

ATS_COMPATIBILITY:
WORKDAY: [PASS/WARNING/FAIL] - [brief explanation]
GREENHOUSE: [PASS/WARNING/FAIL] - [brief explanation]
LEVER: [PASS/WARNING/FAIL] - [brief explanation]
TALEO: [PASS/WARNING/FAIL] - [brief explanation]

FORMATTING_ISSUES:
[List any formatting problems like: tables, columns, headers/footers, special characters, images, or write "None detected" if clean]

OPTIMIZED_RESUME:
[Full optimized resume in plain text format. Use the actual person's name and info. Include sections like CONTACT, SUMMARY, EXPERIENCE, SKILLS, EDUCATION. No special characters or formatting symbols.]

COVER_LETTER:
[Professional cover letter in plain text addressing this specific job. Use the person's real name and relevant experience from their resume. No special formatting symbols.]`
          }
        ]
      }]
    });

    const responseText = message.content[0].text;
    
    const scoreMatch = responseText.match(/SCORE:\s*(\d+)/);
    const missingMatch = responseText.match(/MISSING:\s*(.+?)(?=ATS_COMPATIBILITY:|$)/s);
    
    const atsSection = responseText.match(/ATS_COMPATIBILITY:\s*(.+?)(?=FORMATTING_ISSUES:|$)/s);
    const atsCompatibility = {};
    if (atsSection) {
      const atsText = atsSection[1];
      const workdayMatch = atsText.match(/WORKDAY:\s*(.+)/);
      const greenhouseMatch = atsText.match(/GREENHOUSE:\s*(.+)/);
      const leverMatch = atsText.match(/LEVER:\s*(.+)/);
      const taleoMatch = atsText.match(/TALEO:\s*(.+)/);
      
      if (workdayMatch) atsCompatibility.workday = workdayMatch[1].trim();
      if (greenhouseMatch) atsCompatibility.greenhouse = greenhouseMatch[1].trim();
      if (leverMatch) atsCompatibility.lever = leverMatch[1].trim();
      if (taleoMatch) atsCompatibility.taleo = taleoMatch[1].trim();
    }
    
    const formattingMatch = responseText.match(/FORMATTING_ISSUES:\s*(.+?)(?=OPTIMIZED_RESUME:|$)/s);
    const formattingIssues = formattingMatch ? formattingMatch[1].trim() : 'None detected';
    
    const optimizedMatch = responseText.match(/OPTIMIZED_RESUME:\s*(.+?)(?=COVER_LETTER:|$)/s);
    const coverLetterMatch = responseText.match(/COVER_LETTER:\s*(.+)/s);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const missing = missingMatch ? missingMatch[1].trim().split(',').map(k => k.trim()) : [];
    const optimizedResume = optimizedMatch ? optimizedMatch[1].trim() : '';
    const coverLetter = coverLetterMatch ? coverLetterMatch[1].trim() : '';

    const { error: historyError } = await supabaseAdmin
      .from('resume_history')
      .insert([{
        user_id: userId,
        job_title: jobTitle,
        job_description: jobDescription,
        score: score,
        missing_keywords: JSON.stringify(missing),
        optimized_resume: optimizedResume,
        cover_letter: coverLetter
      }]);

    if (historyError) {
      console.error('Error saving history:', historyError);
    }

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
      atsCompatibility,
      formattingIssues,
      optimizedResume,
      coverLetter,
      scansRemaining: userData.subscription_status === 'free' ? 0 : 'unlimited'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error.message?.includes('rate_limit')) {
      return NextResponse.json({ 
        error: 'API rate limit reached. Please try again in a moment.',
        rateLimited: true 
      }, { status: 429 });
    }
    
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
