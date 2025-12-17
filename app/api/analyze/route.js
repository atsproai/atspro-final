import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase';

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

    // Extract job title from description (first line or first 50 chars)
    const jobTitle = jobDescription.split('\n')[0].substring(0, 100) || 'Untitled Job';

    // Convert PDF to base64 for Claude
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
    
    // Parse the response
    const scoreMatch = responseText.match(/SCORE:\s*(\d+)/);
    const missingMatch = responseText.match(/MISSING:\s*(.+?)(?=ATS_COMPATIBILITY:|$)/s);
    
    // Parse ATS compatibility
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
    
    // Parse formatting issues
    const formattingMatch = responseText.match(/FORMATTING_ISSUES:\s*(.+?)(?=OPTIMIZED_RESUME:|$)/s);
    const formattingIssues = formattingMatch ? formattingMatch[1].trim() : 'None detected';
    
    const optimizedMatch = responseText.match(/OPTIMIZED_RESUME:\s*(.+?)(?=COVER_LETTER:|$)/s);
    const coverLetterMatch = responseText.match(/COVER_LETTER:\s*(.+)/s);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const missing = missingMatch ? missingMatch[1].trim().split(',').map(k => k.trim()) : [];
    const optimizedResume = optimizedMatch ? optimizedMatch[1].trim() : '';
    const coverLetter = coverLetterMatch ? coverLetterMatch[1].trim() : '';

    // Save to resume history
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
      atsCompatibility,
      formattingIssues,
      optimizedResume,
      coverLetter,
      scansRemaining: userData.subscription_status === 'free' ? 0 : 'unlimited'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
