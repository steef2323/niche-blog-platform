import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

async function getAirtableSchema() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !apiKey) {
    throw new Error('Missing required environment variables');
  }

  console.log('Fetching schema for base:', baseId);
  
  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const schema = await response.json();
    console.log('Schema:', JSON.stringify(schema, null, 2));
  } catch (error) {
    console.error('Error fetching schema:', error);
  }
}

getAirtableSchema(); 