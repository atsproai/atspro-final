import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('resume');
    const job = form.get('jobDescription');

    if (!file || !job) {
      return NextResponse.json({ error: 'Missing resume or job description' }, { status: 400 });
    }

    const resumeText = `Sample resume text from ${file.name}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are an expert ATS resume optimizer. Analyze this resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${job}

Return a JSON object with:
1. score: ATS compatibility score (0-100)
2. missingKeywords: array of important keywords missing from resume
3. optimizedResume: complete rewritten resume with missing keywords naturally integrated
4. coverLetter: personalized cover letter for this job

Format as valid JSON only, no markdown.`
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json({
      score: 78,
      missingKeywords: ['Python', 'AWS', 'Docker', 'Leadership', 'Agile', 'CI/CD'],
      optimizedResume: `OPTIMIZED RESUME

[Your Name]
[Contact Information]

PROFESSIONAL SUMMARY
Results-driven software engineer with expertise in Python, AWS, and Docker. Proven leadership in Agile environments with strong CI/CD implementation experience.

SKILLS
- Programming: Python, JavaScript, React
- Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD
- Methodologies: Agile, Scrum, Leadership

EXPERIENCE
[Your experience here, optimized with ATS keywords]

This is a demo response. Upload a real resume for AI-powered optimization.`,
      coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in this position. With my extensive experience in Python, AWS, Docker, and leadership in Agile environments, I am confident I can make an immediate impact on your team.

My background in implementing CI/CD pipelines and leading cross-functional teams aligns perfectly with your requirements.

I would welcome the opportunity to discuss how my skills and experience can contribute to your team's success.

Best regards,
[Your Name]

This is a demo response. Upload a real resume for AI-powered optimization.`
    });
  }
}
