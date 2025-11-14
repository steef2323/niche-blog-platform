import { NextRequest, NextResponse } from 'next/server';
import base, { TABLES } from '@/lib/airtable/config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordId = params.id;
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

    // Basic validation - only name and email are required
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

    // Combine date and time into a single datetime string (only if provided)
    // Format as space-separated to prevent timezone conversion
    let combinedDateTime: string | undefined = undefined;
    if (date) {
      combinedDateTime = date;
      if (preferredTime) {
        combinedDateTime = `${date} ${preferredTime}:00`;
      }
    }

    // Build update data - only include fields that are provided
    const updateData: any = {
      'Name': name,
      'Email': email,
      'Status': 'New'
    };
    
    // Add optional fields only if they are provided
    if (phone) updateData['Phone'] = phone;
    if (combinedDateTime) updateData['Date'] = combinedDateTime;
    if (location) updateData['Location'] = location;
    if (numberOfGuests) updateData['Number of guests'] = parseInt(numberOfGuests);
    if (extraInformation !== undefined) updateData['Extra information'] = extraInformation || '';
    
    // Try to add Site link if siteId is provided and looks like a valid Airtable record ID
    // Only add if it's not a placeholder/masked ID
    if (siteId && siteId.startsWith('rec') && siteId.length > 10 && !siteId.includes('X')) {
      updateData['Site link'] = [siteId];
      console.log(`✅ Updating Site link: ${siteId}`);
    } else if (siteId) {
      console.warn(`⚠️ Invalid or placeholder siteId: ${siteId}`);
    }

    // Update record in Airtable
    // If update fails due to invalid Site link, try again without it
    let record;
    try {
      record = await base(TABLES.PRIVATE_EVENT_REQUESTS).update(recordId, updateData);
    } catch (updateError: any) {
      // If update fails due to invalid Site link, try again without it
      if (updateError.error === 'ROW_DOES_NOT_EXIST' && updateData['Site link']) {
        console.warn('⚠️ Site link failed, updating record without Site link');
        delete updateData['Site link'];
        record = await base(TABLES.PRIVATE_EVENT_REQUESTS).update(recordId, updateData);
      } else {
        throw updateError;
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Private event request updated successfully',
        id: record.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating private event request:', error);
    
    // Check if it's a record not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update request. Please try again.' },
      { status: 500 }
    );
  }
}

