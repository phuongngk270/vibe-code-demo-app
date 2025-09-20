import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

import formidable from 'formidable';
import fs from 'fs';
import { supabase } from '../../lib/supabaseClient';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MODEL_TIMEOUT = 120000; // 2 minutes

// Promise-based wrapper for formidable
const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
  const form = formidable({
    maxFileSize: MAX_FILE_SIZE,
    multiples: false,
  });
    form.parse(req, (err, fields, files) => {
    if (err) {
        reject(err);
    }
      resolve({ fields, files });
    });
  });
};

const normalizeData = (data: any, fileName: string) => {
    data.fileName = fileName;
    if (!Array.isArray(data.issues)) {
        data.issues = [];
    }

    const allowedTypes = ['typo', 'spacing', 'punctuation', 'capitalization', 'alignment', 'font', 'formatting', 'other'];
    data.issues = data.issues.map((issue: any) => ({
        page: Math.max(1, parseInt(issue.page, 10) || 1),
        type: allowedTypes.includes(issue.type) ? issue.type : 'other',
        message: String(issue.message || ''),
        original: String(issue.original || ''),
        suggestion: String(issue.suggestion || ''),
        locationHint: String(issue.locationHint || ''),
    }));

    if (!data.summary) {
        data.summary = {};
    }
    data.summary.issueCount = data.issues.length;
    data.summary.pagesAffected = [...new Set(data.issues.map((i: any) => i.page));

    return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
















    try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {

      return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Invalid file type. Only PDF is allowed.' });
    }
    if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
    }


    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

      const fileBuffer = fs.readFileSync(file.filepath);
      const base64File = fileBuffer.toString('base64');
    fs.unlinkSync(file.filepath); // Clean up uploaded file immediately

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Act as a PDF QA checker for a data science team.
Detect typos, and formatting issues (spacing, punctuation, capitalization, alignment, font inconsistencies, numbering/bullets).
Return STRICT JSON ONLY (no prose, no code fences) matching this schema:
{
  "fileName": "string",
  "issues": [
    {
      "page": 1,
      "type": "typo|spacing|punctuation|capitalization|alignment|font|formatting|other",
      "message": "string",
      "original": "string",
      "suggestion": "string",
      "locationHint": "paragraph/line context or short snippet"
    }
  ],
  "summary": { "issueCount": 0, "pagesAffected": [1,2] }
}
`;


    const modelPromise = model.generateContent([
        prompt,








        { inlineData: { data: base64File, mimeType: 'application/pdf' } },
    );

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Model timeout')), MODEL_TIMEOUT);
    });

    // Race the model call against the timeout
    const result: any = await Promise.race([modelPromise, timeoutPromise]);
      const raw = result.response.text().trim();
      const cleaned = raw.replace(/```json|```/g, '').trim();
      
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(502).json({ error: 'Bad model JSON', raw });
      }


    const normalizedData = normalizeData(parsed, file.originalFilename || 'unknown');

      // Insert into Supabase
      const { data: dbData, error: dbError } = await supabase
        .from('demo_requests')

      .insert([{ user_input: normalizedData.fileName, ai_result: normalizedData }])
        .select('id')
        .single();

      if (dbError) {
        return res.status(200).json({
          ok: true,

        data: normalizedData,
          warning: 'db_insert_failed',
          dbError: dbError.message,
        });
      }


    return res.status(200).json({ ok: true, data: normalizedData, id: dbData.id });

    } catch (e: any) {




    if (e.message.includes('File size')) { // Handle formidable size error
        return res.status(400).json({ error: e.message });
      }
    if (e.message === 'Model timeout') {
        return res.status(504).json({ error: 'Model timeout' });
    }

    return res.status(500).json({ error: e?.message ?? 'An unexpected error occurred.' });
}


}

