import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  parseForm,
  callGemini,
  normalizeData,
  saveToSupabaseServer,
} from '../../lib/review';
// Temporarily disable screenshots to fix the immediate issue
// import { generateScreenshots } from '../../lib/screenshot';

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
    const { files } = await parseForm(req);
    const file = files.file;

    if (!file || file.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const singleFile = Array.isArray(file) ? file[0] : file;

    const fileBuffer = await fs.readFile(singleFile.filepath);
    const fileContent = fileBuffer.toString('base64');
    const rawResult = await callGemini(fileContent);

    const normalizedData = normalizeData(
      rawResult,
      singleFile.originalFilename || 'uploaded_file'
    );
    normalizedData.summary.issueCount = normalizedData.issues.length;

    // Temporarily disable screenshots for quick fix
    // const screenshotUrls = await generateScreenshots(
    //   fileBuffer,
    //   singleFile.originalFilename || 'uploaded_file',
    //   normalizedData.issues
    // );

    // normalizedData.issues.forEach((issue, index) => {
    //   issue.screenshotUrl = screenshotUrls[index] || undefined;
    // });

    const { error } = await saveToSupabaseServer(normalizedData);
    // Save to database
    if (error) {
      console.error('Supabase error:', error);
      // Decide if you want to fail the request or just log the error
      // For now, we'll just log it and proceed to return the data to the user.
    }

    return res.status(200).json({ ok: true, data: normalizedData });
  } catch (e) {
    console.error('API Route Error:', e);
    const statusCode =
      e instanceof Object && 'statusCode' in e && typeof e.statusCode === 'number'
        ? e.statusCode
        : 500;
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred.';
    return res.status(statusCode).json({ error: message });
  }
}

