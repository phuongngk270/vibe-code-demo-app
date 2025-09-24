import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('demo_requests')
      .delete()
      .neq('id', ''); // This deletes all records

    if (error) {
      console.error('Error clearing history:', error);
      return res.status(500).json({ error: 'Failed to clear history' });
    }

    return res.status(200).json({
      success: true,
      message: 'History cleared successfully'
    });
  } catch (error) {
    console.error('Unexpected error clearing history:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}