import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { parseForm, callGemini, normalizeData, saveToSupabase } from '../../lib/review';

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let tempFilePath: string | undefined;

  try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Invalid file type. Only PDF is allowed.' });
    }

    tempFilePath = file.filepath;

    const fileBuffer = fs.readFileSync(tempFilePath);
      const base64File = fileBuffer.toString('base64');

    const parsed = await callGemini(base64File);
    const normalizedData = normalizeData(parsed, file.originalFilename || 'unknown');

    const { id, error: dbError } = await saveToSupabase(normalizedData);

    if (dbError) {
      return res.status(200).json({
        ok: true,
        data: normalizedData,
        warning: 'db_insert_failed',
        dbError: dbError.message,
      });
    }

    return res.status(200).json({ ok: true, data: normalizedData, id });

    } catch (e: any) {
    if (e.message.includes('maxFileSize')) {
      return res.status(413).json({ error: `File size exceeds the limit.` });
      }
    if (e.message === 'Model timeout') {
        return res.status(504).json({ error: 'Model timeout' });
    }
    if (e.message === 'Bad model JSON') {
      return res.status(502).json({ error: 'Bad model JSON' });
}
    return res.status(500).json({ error: e?.message ?? 'An unexpected error occurred.' });
  } finally {
    if (tempFilePath) {
      fs.unlinkSync(tempFilePath);
}
  }
}
