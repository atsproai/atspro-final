import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../lib/supabase';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestTracker = new Map();

function getRateLimitKey(userId, ip) {
  return `jobs-${userId}-${ip}`;
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

export async function GET(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = getRateLimitKey(userId, ip);
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        rateLimited: true 
      }, { status: 429 });
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({ applications: data || [] });

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = getRateLimitKey(userId, ip);
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        rateLimited: true 
      }, { status: 429 });
    }

    const body = await req.json();
    const { company_name, job_title, job_url, status, salary_range, notes } = body;

    if (!company_name || !job_title) {
      return NextResponse.json({ error: 'Company name and job title are required' }, { status: 400 });
    }

    if (company_name.length > 200 || job_title.length > 200) {
      return NextResponse.json({ error: 'Company name or job title too long' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .insert([{
        user_id: userId,
        company_name,
        job_title,
        job_url: job_url || null,
        status: status || 'applied',
        salary_range: salary_range || null,
        notes: notes || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ application: data });

  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = getRateLimitKey(userId, ip);
    
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        rateLimited: true 
      }, { status: 429 });
    }

    const body = await req.json();
    const { id, company_name, job_title, job_url, status, salary_range, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    const updateData = {};
    if (company_name) updateData.company_name = company_name;
    if (job_title) updateData.job_title = job_title;
    if (job_url !== undefined) updateData.job_url = job_url;
    if (status) updateData.status = status;
    if (salary_range !== undefined) updateData.salary_range = salary_range;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({ application: data });

  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting application:', error);
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
