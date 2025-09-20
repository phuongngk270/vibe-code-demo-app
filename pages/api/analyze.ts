import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hint: 'POST { text } to this endpoint' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body as { text?: string };
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Return STRICT JSON only (no prose, no code fences) with this schema:
{"sentiment":"positive|negative|neutral","confidence":0..1,"keywords":string[]}

Text:
"""${text}"""
`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Bad model JSON', raw });
    }

    return res.status(200).json({ ok: true, data: parsed });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? 'Model call failed' });
  }
}