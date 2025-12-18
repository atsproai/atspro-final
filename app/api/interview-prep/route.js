import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestTracker = new Map();

function getRateLimitKey(userId, ip) {
  return `interview-${userId}-${ip}`;
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
        error: 'Rate limit exceeded. Please wait a moment before generating more interview prep.',
        rateLimited: true 
      }, { status: 429 });
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

    const resumeBuffer = await resume.arrayBuffer();
    const resumeBase64 = Buffer.from(resumeBuffer).toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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
            text: `You are an expert interview coach. Analyze this resume and job description to create a comprehensive interview prep guide.

Job Description:
${jobDescription}

Your task:
1. Generate 8-10 likely interview questions (mix of behavioral and technical/role-specific)
2. For each question, provide a personalized answer suggestion using the candidate's ACTUAL experience from their resume
3. Add a brief tip for answering each question effectively

CRITICAL RULES:
- Use the person's REAL experience, achievements, and skills from their resume
- Make answers specific and detailed (not generic)
- Keep each answer 3-4 sentences
- Use the STAR method where appropriate (Situation, Task, Action, Result)
- Make it sound natural, not robotic

Format your response EXACTLY like this:

QUESTION_1:
Q: [Interview question]
A: [Personalized answer using their real experience]
TIP: [Brief tip for this question type]

QUESTION_2:
Q: [Interview question]
A: [Personalized answer using their real experience]
TIP: [Brief tip for this question type]

[Continue for all 8-10 questions]`
          }
        ]
      }]
    });

    const responseText = message.content[0].text;
    
    const questionBlocks = responseText.split(/QUESTION_\d+:/g).filter(Boolean);
    
    const questions = questionBlocks.map(block => {
      const qMatch = block.match(/Q:\s*(.+?)(?=A:)/s);
      const aMatch = block.match(/A:\s*(.+?)(?=TIP:)/s);
      const tipMatch = block.match(/TIP:\s*(.+?)(?=QUESTION_|$)/s);
      
      return {
        question: qMatch ? qMatch[1].trim() : '',
        answer: aMatch ? aMatch[1].trim() : '',
        tip: tipMatch ? tipMatch[1].trim() : ''
      };
    }).filter(q => q.question && q.answer);

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Interview prep error:', error);
    
    if (error.message?.includes('rate_limit')) {
      return NextResponse.json({ 
        error: 'API rate limit reached. Please try again in a moment.',
        rateLimited: true 
      }, { status: 429 });
    }
    
    return NextResponse.json({ error: 'Failed to generate interview prep' }, { status: 500 });
  }
}
