import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { emailType, jobTitle, companyName, optimizedResume } = body;

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
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 });
  }
}
