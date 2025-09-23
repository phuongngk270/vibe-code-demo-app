import type { NextApiRequest, NextApiResponse } from 'next';
import {
  EmailGenerationInputs,
  EmailGenerationResult,
  generateReviewEmail,
} from '../../lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailGenerationResult | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const inputs: EmailGenerationInputs = req.body;

  try {
    const result = await generateReviewEmail(inputs);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
}
