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

    const formData = await req.formData();
    const resume = formData.get('resume');
    const targetRole = formData.get('targetRole') || '';

    if (!resume) {
      return NextResponse.json({ error: 'Missing resume' }, { status: 400 });
    }

    // Convert PDF to base64 for Claude
    const resumeBuffer = await resume.arrayBuffer();
    const resumeBase64 = Buffer.from(resumeBuffer).toString('base64');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
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
            text: `You are a LinkedIn optimization expert. Analyze this resume and create optimized LinkedIn profile sections.

${targetRole ? `Target Role: ${targetRole}` : 'Use their current experience to determine the best positioning.'}

Create the following LinkedIn sections using the person's ACTUAL information from their resume:

1. HEADLINE: A compelling LinkedIn headline (220 characters max) that showcases their expertise and value proposition
2. ABOUT: An engaging "About" section (2500 characters max) written in first person that tells their professional story
3. EXPERIENCE: Optimized descriptions for their top 3 job positions (use their actual job titles and companies)

FORMATTING RULES:
- Use the person's REAL name, experience, and accomplishments
- Write in a professional but personable tone
- NO markdown symbols (no *, #, -, bullets)
- Use plain text with line breaks for readability
- Make it engaging and human (not robotic)
- Include relevant keywords naturally

Format your response EXACTLY like this:

HEADLINE:
[Optimized headline - 220 chars max]

ABOUT:
[Compelling about section in first person - 2500 chars max]

EXPERIENCE_1:
TITLE: [Actual job title]
COMPANY: [Actual company name]
DESCRIPTION:
[Optimized job description highlighting key achievements and impact]

EXPERIENCE_2:
TITLE: [Actual job title]
COMPANY: [Actual company name]
DESCRIPTION:
[Optimized job description highlighting key achievements and impact]

EXPERIENCE_3:
TITLE: [Actual job title]
COMPANY: [Actual company name]
DESCRIPTION:
[Optimized job description highlighting key achievements and impact]`
          }
        ]
      }]
    });

    const responseText = message.content[0].text;
    
    // Parse the response
    const headlineMatch = responseText.match(/HEADLINE:\s*(.+?)(?=ABOUT:|$)/s);
    const aboutMatch = responseText.match(/ABOUT:\s*(.+?)(?=EXPERIENCE_1:|$)/s);
    
    const exp1Match = responseText.match(/EXPERIENCE_1:\s*TITLE:\s*(.+?)\s*COMPANY:\s*(.+?)\s*DESCRIPTION:\s*(.+?)(?=EXPERIENCE_2:|$)/s);
    const exp2Match = responseText.match(/EXPERIENCE_2:\s*TITLE:\s*(.+?)\s*COMPANY:\s*(.+?)\s*DESCRIPTION:\s*(.+?)(?=EXPERIENCE_3:|$)/s);
    const exp3Match = responseText.match(/EXPERIENCE_3:\s*TITLE:\s*(.+?)\s*COMPANY:\s*(.+?)\s*DESCRIPTION:\s*(.+?)$/s);

    const headline = headlineMatch ? headlineMatch[1].trim() : '';
    const about = aboutMatch ? aboutMatch[1].trim() : '';
    
    const experiences = [];
    if (exp1Match) {
      experiences.push({
        title: exp1Match[1].trim(),
        company: exp1Match[2].trim(),
        description: exp1Match[3].trim()
      });
    }
    if (exp2Match) {
      experiences.push({
        title: exp2Match[1].trim(),
        company: exp2Match[2].trim(),
        description: exp2Match[3].trim()
      });
    }
    if (exp3Match) {
      experiences.push({
        title: exp3Match[1].trim(),
        company: exp3Match[2].trim(),
        description: exp3Match[3].trim()
      });
    }

    return NextResponse.json({
      headline,
      about,
      experiences
    });

  } catch (error) {
    console.error('LinkedIn optimization error:', error);
    return NextResponse.json({ error: 'Failed to optimize LinkedIn profile' }, { status: 500 });
  }
}
