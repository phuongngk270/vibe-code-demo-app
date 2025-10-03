import type { NextApiRequest, NextApiResponse } from 'next';
import {
  EmailGenerationInputs,
  EmailGenerationResult,
} from '../../lib/email';
import { generateEmailWithN8n } from '../../lib/n8n';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailGenerationResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const inputs: EmailGenerationInputs = req.body;

  try {
    // Get user ID for audit trail
    const { userId } = getAuth(req);

    // Call n8n webhook for email generation instead of Gemini
    const result = await generateEmailWithN8n(inputs, userId || undefined);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
}
