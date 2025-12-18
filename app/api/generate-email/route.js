import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestTracker = new Map();

function getRateLimitKey(userId, ip) {
  return `email-${userId}-${ip}`;
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
        error: 'Rate limit exceeded. Please wait a moment before generating another email.',
        rateLimited: true 
      }, { status: 429 });
    }

    const body = await req.json();
    const { emailType, jobTitle, companyName, optimizedResume } = body;

    if (!emailType || !jobTitle || !companyName || !optimizedResume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['follow-up', 'thank-you', 'networking'].includes(emailType)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (jobTitle.length > 200 || companyName.length > 200) {
      return NextResponse.json({ error: 'Job title or company name too long' }, { status: 400 });
    }

    if (optimizedResume.length > 5000) {
      return NextResponse.json({ error: 'Background summary too long. Maximum 5000 characters.' }, { status: 400 });
    }

    let prompt = '';
    
    if (emailType === 'follow-up') {
      prompt = `Write a professional follow-up email for a job application. 
Job Title: ${jobTitle}
Company: ${companyName}
The email should:
- Be polite and professional
- Express continued interest in the position
- Briefly highlight 1-2 key qualifications from my background
- Ask about the status of my application
- Be concise (under 150 words)
- Use a friendly but professional tone
My background:
${optimizedResume.substring(0, 500)}
Write ONLY the email body (no subject line, no "Dear Hiring Manager" - I'll add that). Start directly with the content.`;
    } else if (emailType === 'thank-you') {
      prompt = `Write a professional thank you email after a job interview.
Job Title: ${jobTitle}
Company: ${companyName}
The email should:
- Thank them for their time
- Reiterate interest in the position
- Mention 1 specific thing discussed in the interview that excited you
- Briefly reinforce why you're a great fit
- Be warm and genuine
- Be concise (under 150 words)
My background:
${optimizedResume.substring(0, 500)}
Write ONLY the email body (no subject line, no "Dear [Name]" - I'll add that). Start directly with the content.`;
    } else if (emailType === 'networking') {
      prompt = `Write a professional networking/cold outreach email.
Target Role: ${jobTitle}
Company: ${companyName}
The email should:
- Introduce myself briefly
- Mention specific interest in their company/role
- Ask for a brief informational chat or advice
- Be humble and respectful of their time
- Include a clear call-to-action
- Be concise (under 150 words)
My background:
${optimizedResume.substring(0, 500)}
Write ONLY the email body (no subject line, no "Dear [Name]" - I'll add that). Start directly with the content.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const emailContent = message.content[0].text;

    return NextResponse.json({ emailContent });

  } catch (error) {
    console.error('Email generation error:', error);
    
    if (error.message?.includes('rate_limit')) {
      return NextResponse.json({ 
        error: 'API rate limit reached. Please try again in a moment.',
        rateLimited: true 
      }, { status: 429 });
    }
    
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
  }
}
