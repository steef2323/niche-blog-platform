import { NextRequest, NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

// Simple rate limiting - in production, you'd want to use Redis or similar
const submissionTracker = new Map<string, number>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      date,
      preferredTime,
      location,
      numberOfGuests,
      extraInformation,
      siteId
    } = body;

    // Basic validation
    if (!name || !email || !phone || !date || !location || !siteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Rate limiting check
    const now = Date.now();
    const lastSubmission = submissionTracker.get(clientIP);
    
    if (lastSubmission && (now - lastSubmission) < RATE_LIMIT_WINDOW) {
      // Count submissions in the window
      const submissionCount = Array.from(submissionTracker.values())
        .filter(timestamp => (now - timestamp) < RATE_LIMIT_WINDOW).length;
      
      if (submissionCount >= MAX_SUBMISSIONS_PER_WINDOW) {
        return NextResponse.json(
          { error: 'Too many submissions. Please wait before submitting again.' },
          { status: 429 }
        );
      }
    }

    // Simple honeypot check (could be expanded)
    if (body.website || body.url) {
      return NextResponse.json(
        { error: 'Spam detected' },
        { status: 400 }
      );
    }

    // Combine date and time into a single datetime string
    // Format as space-separated to prevent timezone conversion
    let combinedDateTime = date;
    if (preferredTime) {
      combinedDateTime = `${date} ${preferredTime}:00`;
    }

    // Create record in Airtable
    const record = await base(TABLES.PRIVATE_EVENT_REQUESTS).create({
      'Name': name,
      'Email': email,
      'Phone': phone,
      'Date': combinedDateTime,
      'Location': location,
      'Number of guests': numberOfGuests ? parseInt(numberOfGuests) : undefined,
      'Extra information': extraInformation || '',
      'Site link': [siteId],
      'Status': 'New'
    });

    // Update rate limiting tracker
    submissionTracker.set(clientIP, now);

    // Clean up old entries (optional optimization)
    for (const [ip, timestamp] of submissionTracker.entries()) {
      if ((now - timestamp) > RATE_LIMIT_WINDOW) {
        submissionTracker.delete(ip);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Private event request submitted successfully',
        id: record.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating private event request:', error);
    
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    );
  }
} 