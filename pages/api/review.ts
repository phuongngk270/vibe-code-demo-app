import type { NextApiRequest, NextApiResponse } from 'next';
import {
  parseForm,
  callGemini,
  normalizeData,
  saveToSupabaseServer,
} from '../../lib/review';
export const config = {
  api: {
    bodyParser: false,
  },
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { file } = await parseForm(req);

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const rawResult = await callGemini(file);

    const normalizedData = normalizeData(rawResult, file);
    normalizedData.summary.issueCount = normalizedData.issues.length;

    // Save to database
    const { id, error } = await saveToSupabaseServer(normalizedData);
    if (error) {
      console.error('Supabase error:', error);
      // Decide if you want to fail the request or just log the error
      // For now, we'll just log it and proceed to return the data to the user.
    }

    return res.status(200).json({ ok: true, data: normalizedData });
    } catch (e: any) {
    console.error('API Route Error:', e);
    return res
      .status(e.statusCode || 500)
      .json({ error: e.message || 'An unexpected error occurred.' });
      }
}
