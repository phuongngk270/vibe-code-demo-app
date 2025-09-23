import formidable from 'formidable';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabaseClient';
import { createServerSupabase } from './supabaseServer';
import type { NextApiRequest } from 'next';

const MODEL_TIMEOUT = 120000; // 2 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type AnalysisIssue = {
  page: number;
  type: 'typo' | 'spacing' | 'punctuation' | 'capitalization' | 'alignment' | 'font' | 'formatting' | 'cross_reference' | 'other';
  message: string;
  original: string;
  suggestion: string;
  locationHint: string;
  screenshotUrl?: string;
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
First, extract all section headers (e.g., "Section 1", "Section I", "Appendix A").
Then, for each cross-reference found in the text (e.g., "see Section 1"), check if the referenced section header actually exists.
If a cross-reference points to a non-existent section, emit an issue object with the type 'cross_reference'.
Also, detect standard typos and formatting issues (spacing, punctuation, capitalization, alignment, font inconsistencies, numbering/bullets).
Return STRICT JSON ONLY (no prose, no code fences) matching this schema:\n{\n  "fileName": "string",\n  "issues": [\n    {\n      "page": 1,\n      "type": "typo|spacing|punctuation|capitalization|alignment|font|formatting|cross_reference|other",\n      "message": "string",\n      "original": "string",\n      "suggestion": "string",\n      "locationHint": "paragraph/line context or short snippet"\n    }\n  ],\n  "summary": { "issueCount": 0, "pagesAffected": [1, 2 ] }\n}\n`;

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
    try {
      const parsed = JSON.parse(cleaned) as AnalysisResult;
      return parsed;
    } catch (jsonError) {
      console.error('JSON Parse Error:', jsonError);
      console.error('Raw response from model:', cleaned); // Log the entire raw response
      throw new Error(`Failed to parse JSON response from the model. Raw response: ${cleaned}`);
    }
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

  const allowedTypes: AnalysisIssue['type'][] = ['typo', 'spacing', 'punctuation', 'capitalization', 'alignment', 'font', 'formatting', 'cross_reference', 'other'];
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
  const { data, error } = await supabase
    .from('demo_requests')
    .insert({ user_input: normalizedData.fileName, ai_result: normalizedData })
    .select('id')
    .single();

  if (error) {
    return { error: error };
  }
  return { id: data?.id };
};

export const saveToSupabaseServer = async (normalizedData: AnalysisResult) => {
  const supabaseServer = createServerSupabase();
  const { data, error } = await supabaseServer
    .from('demo_requests')
    .insert({ user_input: normalizedData.fileName, ai_result: normalizedData })
    .select('id')
    .single();

  if (error) {
    return { error:error };
  }
  return { id: data?.id };
};

