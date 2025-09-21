import formidable from 'formidable';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabaseClient';
import { createServerSupabase } from './supabaseServer';
import type { NextApiRequest } from 'next';

const MODEL_TIMEOUT = 120000; // 2 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type AnalysisIssue = {
  page: number;
  type: 'typo' | 'spacing' | 'punctuation' | 'capitalization' | 'alignment' | 'font' | 'formatting' | 'other';
  message: string;
  original: string;
  suggestion: string;
  locationHint: string;
};

export type AnalysisResult = {
  fileName: string;
  issues: AnalysisIssue[];
  summary: {
    issueCount: number;
    pagesAffected: number[];
  };
};

/**
 * Parses a multipart/form-data request to extract files and fields.
 */
export const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      multiples: false,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

/**
 * Calls the Gemini API with the provided PDF file content.
 * @param base64File The base64-encoded PDF file content.
 * @returns The parsed JSON response from the model.
 */
export const callGemini = async (base64File: string): Promise<AnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Server missing GEMINI_API_KEY');

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
  "summary": { "issueCount": 0, "pagesAffected": [1, 2] }
}
`;

  try {
    const modelPromise = model.generateContent([
      prompt,
      { inlineData: { data: base64File, mimeType: 'application/pdf' } },
    ]);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Model timeout')), MODEL_TIMEOUT);
    });

    const result = await Promise.race([modelPromise, timeoutPromise]);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as AnalysisResult;
  } catch (e) {
    console.error('Error calling or parsing Gemini response:', e);
    throw new Error('Failed to get a valid JSON response from the model.');
  }
};

/**
 * Normalizes the data from the model to ensure it matches the expected schema.
 * @param data The raw data object from the model.
 * @param fileName The name of the uploaded file.
 * @returns A normalized data object.
 */
export const normalizeData = (data: Partial<AnalysisResult>, fileName: string): AnalysisResult => {
    data.fileName = fileName;
    if (!Array.isArray(data.issues)) {
        data.issues = [];
    }

    const allowedTypes: AnalysisIssue['type'][] = ['typo', 'spacing', 'punctuation', 'capitalization', 'alignment', 'font', 'formatting', 'other'];
    data.issues = data.issues.map((issue: Partial<AnalysisIssue>): AnalysisIssue => ({
        page: Math.max(1, parseInt(String(issue.page), 10) || 1),
        type: allowedTypes.includes(issue.type as AnalysisIssue['type']) ? (issue.type as AnalysisIssue['type']) : 'other',
        message: String(issue.message || ''),
        original: String(issue.original || ''),
        suggestion: String(issue.suggestion || ''),
        locationHint: String(issue.locationHint || ''),
    }));

    if (!data.summary) {
        data.summary = { issueCount: 0, pagesAffected: [] };
    }
    data.summary.issueCount = data.issues.length;
    data.summary.pagesAffected = [...new Set(data.issues.map((i: AnalysisIssue) => i.page))];
    return data as AnalysisResult;
};

/**
 * Saves the analysis result to the Supabase database.
 * @param normalizedData The normalized analysis data.
 * @returns An object containing the new record's ID or an error.
 */
export const saveToSupabase = async (normalizedData: AnalysisResult) => {
    const { data: dbData, error: dbError } = await supabase
        .from('demo_requests')
        .insert({ user_input: normalizedData.fileName, ai_result: normalizedData })
        .select('id')
        .single();

    if (dbError) {
        return { error: dbError };
    }
    return { id: dbData.id };
};

export const saveToSupabaseServer = async (normalizedData: AnalysisResult) => {
    const supabaseServer = createServerSupabase();
    const { data: dbData, error: dbError } = await supabaseServer
        .from('demo_requests')
        .insert({ user_input: normalizedData.fileName, ai_result: normalizedData })
        .select('id')
        .single();

    if (dbError) {
        return { error: dbError };
    }
    return { id: dbData.id };
};
