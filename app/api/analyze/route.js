import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const form = await request.formData();
    const job = form.get('jobDescription');

    // Demo response - will add real AI later
    return NextResponse.json({
      score: 78,
      missingKeywords: ['Python', 'AWS', 'Docker', 'Leadership', 'Agile']
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      score: 75, 
      missingKeywords: ['Python', 'AWS', 'React'] 
    });
  }
}
