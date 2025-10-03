import crypto from 'crypto';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_EMAIL_WEBHOOK_URL = process.env.N8N_EMAIL_WEBHOOK_URL;

if (!N8N_WEBHOOK_URL) {
  console.warn('N8N_WEBHOOK_URL not set - n8n integration will not work');
}

if (!N8N_API_KEY) {
  console.warn('N8N_API_KEY not set - webhook authentication will not work');
}

if (!N8N_EMAIL_WEBHOOK_URL) {
  console.warn('N8N_EMAIL_WEBHOOK_URL not set - email generation will not work');
}

/**
 * Generates signature for webhook authentication
 * Simple approach: just return the API key for direct comparison
 */
function generateSignature(payload: string): string {
  if (!N8N_API_KEY) return '';
  return N8N_API_KEY;
}

/**
 * Calls n8n webhook for document analysis
 * @param base64File The base64-encoded PDF file content
 * @param fileName The name of the file
 * @param userId Optional user ID for audit trail
 * @returns The analysis result from n8n
 */
export async function analyzeDocumentWithN8n(
  base64File: string,
  fileName: string,
  userId?: string
): Promise<any> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('N8N_WEBHOOK_URL not configured');
  }

  const payload = {
    file: base64File,
    fileName,
    userId,
    timestamp: new Date().toISOString(),
  };

  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Signature': signature,
        'X-User-Id': userId || 'anonymous',
      },
      body: payloadString,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'n8n analysis failed');
    }

    return result.data;
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    throw error;
  }
}

/**
 * Calls n8n webhook for email generation
 * @param emailInputs The email generation inputs
 * @param userId Optional user ID for audit trail
 * @returns The generated email result from n8n
 */
export async function generateEmailWithN8n(
  emailInputs: any,
  userId?: string
): Promise<any> {
  if (!N8N_EMAIL_WEBHOOK_URL) {
    throw new Error('N8N_EMAIL_WEBHOOK_URL not configured');
  }

  const payload = {
    ...emailInputs,
    userId,
    timestamp: new Date().toISOString(),
  };

  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString);

  try {
    const response = await fetch(N8N_EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-Signature': signature,
        'X-User-Id': userId || 'anonymous',
      },
      body: payloadString,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n email webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'n8n email generation failed');
    }

    return result.data;
  } catch (error) {
    console.error('Error calling n8n email webhook:', error);
    throw error;
  }
}
