import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
  }

  const form = formidable({
    maxFileSize: MAX_FILE_SIZE,
    multiples: false,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      if (err.message.includes('maxFileSize exceeded')) {
      return res.status(413).json({ error: 'File is too large.' });
    }
      return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Invalid file type. Only PDF is allowed.' });
    }

    let tempPath: string | undefined;
    try {
      tempPath = file.filepath;
      const fileBuffer = fs.readFileSync(tempPath);
      const base64File = fileBuffer.toString('base64');

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
      "locationHint": "Reference parent sections for the error. If not possible, provide the page number."
    }
  ],
  "summary": { "issueCount": 0, "pagesAffected": [1,2 }
}
`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64File,
            mimeType: 'application/pdf',
          },
        },
      ]);

      const raw = result.response.text().trim();
      const cleaned = raw.replace(/```json|```/g, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return res.status(502).json({ error: 'Bad model JSON', raw });
      }

      parsed.fileName = file.originalFilename || 'unknown';

      return res.status(200).json({ ok: true, data: parsed });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e?.message ?? 'An unexpected error occurred.' });
    } finally {
      if (tempPath) {
        fs.unlinkSync(tempPath);
      }
    }
  });
}

