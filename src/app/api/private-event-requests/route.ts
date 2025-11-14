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
      siteId,
      createOnly
    } = body;

    // Basic validation - only name and email are required (siteId is optional)
    if (!name || !email) {
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
    
    // Rate limiting check (only for full submissions, not initial creation)
    if (!createOnly) {
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
    }

    // Simple honeypot check (could be expanded)
    if (body.website || body.url) {
      return NextResponse.json(
        { error: 'Spam detected' },
        { status: 400 }
      );
    }

    // If createOnly, just create a minimal record
    if (createOnly) {
      // Build record data - try to include Site link if siteId is provided
      const recordData: any = {
        'Name': name,
        'Email': email,
        'Status': 'New'
      };
      
      // Try to add Site link if siteId is provided and looks like a valid Airtable record ID
      // If it fails, we'll create the record without the link
      if (siteId && siteId.startsWith('rec') && siteId.length > 10) {
        // Only add if it's not a placeholder/masked ID
        if (!siteId.includes('X')) {
          recordData['Site link'] = [siteId];
          console.log(`✅ Adding Site link: ${siteId}`);
        } else {
          console.warn(`⚠️ Skipping Site link - appears to be a placeholder ID: ${siteId}`);
        }
      } else {
        console.warn(`⚠️ Invalid or missing siteId: ${siteId}`);
      }

      try {
        const records = await base(TABLES.PRIVATE_EVENT_REQUESTS).create(recordData);
        const record = Array.isArray(records) ? records[0] : records;
        return NextResponse.json(
          { 
            success: true, 
            message: 'Initial record created',
            id: record.id 
          },
          { status: 201 }
        );
      } catch (createError: any) {
        // If creation fails due to invalid Site link, try again without it
        if (createError.error === 'ROW_DOES_NOT_EXIST' && recordData['Site link']) {
          console.warn('⚠️ Site link failed, creating record without Site link');
          delete recordData['Site link'];
          const records = await base(TABLES.PRIVATE_EVENT_REQUESTS).create(recordData);
          const record = Array.isArray(records) ? records[0] : records;
          return NextResponse.json(
            { 
              success: true, 
              message: 'Initial record created (without Site link)',
              id: record.id 
            },
            { status: 201 }
          );
        }
        throw createError;
      }

    }

    // Combine date and time into a single datetime string (only if provided)
    // Format as space-separated to prevent timezone conversion
    let combinedDateTime: string | undefined = undefined;
    if (date) {
      combinedDateTime = date;
      if (preferredTime) {
        combinedDateTime = `${date} ${preferredTime}:00`;
      }
    }

    // Build record data - try to include Site link if siteId is provided
    const recordData: any = {
      'Name': name,
      'Email': email,
      'Status': 'New'
    };
    
    // Add optional fields only if they are provided
    if (phone) recordData['Phone'] = phone;
    if (combinedDateTime) recordData['Date'] = combinedDateTime;
    if (location) recordData['Location'] = location;
    if (numberOfGuests) recordData['Number of guests'] = parseInt(numberOfGuests);
    if (extraInformation) recordData['Extra information'] = extraInformation;
    
    // Try to add Site link if siteId is provided and looks like a valid Airtable record ID
    // If it fails, we'll create the record without the link
    if (siteId && siteId.startsWith('rec') && siteId.length > 10) {
      // Only add if it's not a placeholder/masked ID
      if (!siteId.includes('X')) {
        recordData['Site link'] = [siteId];
        console.log(`✅ Adding Site link: ${siteId}`);
      } else {
        console.warn(`⚠️ Skipping Site link - appears to be a placeholder ID: ${siteId}`);
      }
    } else {
      console.warn(`⚠️ Invalid or missing siteId: ${siteId}`);
    }

    // Create full record in Airtable
    // If creation fails due to invalid Site link, try again without it
    let record;
    try {
      const records = await base(TABLES.PRIVATE_EVENT_REQUESTS).create(recordData);
      record = Array.isArray(records) ? records[0] : records;
    } catch (createError: any) {
      // If creation fails due to invalid Site link, try again without it
      if (createError.error === 'ROW_DOES_NOT_EXIST' && recordData['Site link']) {
        console.warn('⚠️ Site link failed, creating record without Site link');
        delete recordData['Site link'];
        const records = await base(TABLES.PRIVATE_EVENT_REQUESTS).create(recordData);
        record = Array.isArray(records) ? records[0] : records;
      } else {
        throw createError;
      }
    }

    // Update rate limiting tracker (only for full submissions)
    const now = Date.now();
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