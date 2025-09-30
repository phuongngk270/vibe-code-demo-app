import formidable from 'formidable';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerSupabase } from './supabaseServer';
import { encryptDocument, type EncryptionResult } from './encryption';
import { sanitizeDocument, detectSensitiveContent, type SanitizationResult } from './document-sanitizer';
import { classifyDocument, type ClassificationResult, DocumentClassification } from './document-classification';
import { auditLog, AuditAction, type AuditContext } from './audit-logger';
import { generateSecureScreenshots } from './secure-screenshot';
import { scheduleDocumentRetention } from './retention-policy';
import { analyzeDocumentWithCompanyLLM } from './company-llm';
import { processDocumentWithPatterns } from './local-patterns';
import type { NextApiRequest } from 'next';
import type { AnalysisIssue, AnalysisResult } from './review';

const MODEL_TIMEOUT = 120000; // 2 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type ProcessingMethod = 'company_llm' | 'external_ai' | 'local_patterns' | 'manual_only';

export interface EnhancedConsentData {
  processingMethod: ProcessingMethod;
  dataRetention: number; // days
  sensitiveDataDetected: boolean;
  sanitizationRequired: boolean;
  explicitConsent: boolean;
}

export interface SecureProcessingOptions {
  userId: string;
  req: NextApiRequest;
  consent: EnhancedConsentData;
  fileName: string;
  fileBuffer: Buffer;
}

export interface SecureAnalysisResult extends AnalysisResult {
  documentId?: string;
  classification: ClassificationResult;
  sanitization?: SanitizationResult;
  encryptionApplied: boolean;
  consentRecorded: EnhancedConsentData;
  retentionScheduled: boolean;
  processingMethod: ProcessingMethod;
}

export class SecureReviewService {
  private supabase = createServerSupabase();

  /**
   * Parses form data with security checks
   */
  async parseSecureForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
    return new Promise((resolve, reject) => {
      const form = formidable({
        maxFileSize: MAX_FILE_SIZE,
        multiples: false,
        // Additional security options
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(new Error(`Form parsing failed: ${err.message}`));
        } else {
          resolve({ fields, files });
        }
      });
    });
  }

  /**
   * Processes document with full security pipeline
   */
  async processDocumentSecurely(options: SecureProcessingOptions): Promise<SecureAnalysisResult> {
    const { userId, req, consent, fileName, fileBuffer } = options;

    const auditContext: AuditContext = {
      req,
      userId
    };

    try {
      // Step 1: Classify document
      const classification = await this.classifyDocumentContent(fileBuffer, fileName);

      // Step 2: Detect sensitive content
      const pdfText = await this.extractTextFromPdf(fileBuffer);
      const hasSensitiveContent = detectSensitiveContent(pdfText);
      let sanitization: SanitizationResult | undefined;

      // Step 3: Apply sanitization if required
      let processedContent = pdfText;
      if (consent.sanitizationRequired && hasSensitiveContent) {
        sanitization = sanitizeDocument(pdfText);
        processedContent = sanitization.sanitizedContent;
      }

      // Audit log document upload and classification
      await auditLog(
        AuditAction.DOCUMENT_UPLOAD,
        { ...auditContext, documentClassification: classification.classification },
        {
          file_name: fileName,
          file_size: fileBuffer.length,
          classification: classification.classification,
          confidence: classification.confidence,
          sensitive_data_detected: hasSensitiveContent,
          sanitization_applied: !!sanitization
        }
      );

      // Step 4: Record consent
      await auditLog(
        AuditAction.EXTERNAL_AI_CONSENT,
        auditContext,
        {
          processing_method: consent.processingMethod,
          consent_retention_days: consent.dataRetention,
          sanitization_required: consent.sanitizationRequired,
          explicit_consent: consent.explicitConsent
        }
      );

      // Step 5: Process document based on chosen method
      let analysisResult: AnalysisResult;
      const processingMethod = consent.processingMethod;

      switch (processingMethod) {
        case 'company_llm':
          analysisResult = await this.processWithCompanyLLM(processedContent, fileName, !!sanitization);
          break;
        case 'external_ai':
          analysisResult = await this.callGeminiSecure(fileBuffer, processedContent, !!sanitization);
          break;
        case 'local_patterns':
          analysisResult = await this.processWithLocalPatterns(processedContent, fileName);
          break;
        case 'manual_only':
          analysisResult = await this.processManualOnly(fileName);
          break;
        default:
          throw new Error(`Unknown processing method: ${processingMethod}`);
      }

      // Step 6: Encrypt and store document
      const encryptedDocument = encryptDocument(fileBuffer);
      const documentId = await this.storeSecureDocument(
        fileName,
        analysisResult,
        encryptedDocument,
        classification.classification,
        userId
      );

      // Step 7: Generate secure screenshots
      const secureScreenshots = await generateSecureScreenshots(
        fileBuffer,
        fileName,
        analysisResult.issues,
        userId,
        classification.classification
      );

      // Update analysis result with secure screenshots
      analysisResult.issues.forEach((issue, index) => {
        issue.screenshotUrl = secureScreenshots[index] || undefined;
      });

      // Step 8: Schedule retention
      const retentionScheduled = documentId ? await this.scheduleRetention(
        documentId,
        userId,
        fileName,
        classification.classification,
        consent.dataRetention
      ) : false;

      // Step 9: Final audit log
      await auditLog(
        AuditAction.DOCUMENT_PROCESSING_COMPLETE,
        { ...auditContext, documentId, documentClassification: classification.classification },
        {
          issues_found: analysisResult.issues.length,
          processing_method: processingMethod,
          screenshots_generated: secureScreenshots.filter(url => url !== null).length,
          retention_scheduled: retentionScheduled
        }
      );

      return {
        ...analysisResult,
        documentId,
        classification,
        sanitization,
        encryptionApplied: true,
        consentRecorded: consent,
        retentionScheduled,
        processingMethod
      };

    } catch (error) {
      // Audit log the error
      await auditLog(
        AuditAction.DOCUMENT_PROCESSING_COMPLETE,
        auditContext,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          file_name: fileName
        },
        false,
        error instanceof Error ? error.message : 'Document processing failed'
      );

      throw error;
    }
  }

  private async classifyDocumentContent(
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ClassificationResult> {
    try {
      const text = await this.extractTextFromPdf(fileBuffer);
      return classifyDocument(text, fileName);
    } catch (error) {
      // Fallback to filename-based classification
      console.warn('Could not extract text for classification, using filename only');
      return classifyDocument('', fileName);
    }
  }

  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdf = await import('pdf-parse');
      const data = await pdf.default(buffer);
      return data.text || '';
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return '';
    }
  }

  /**
   * Processes document using company's internal LLM
   */
  private async processWithCompanyLLM(
    content: string,
    fileName: string,
    wasSanitized: boolean
  ): Promise<AnalysisResult> {
    try {
      return await analyzeDocumentWithCompanyLLM(content, fileName, wasSanitized);
    } catch (error) {
      console.error('Company LLM processing failed, falling back to local patterns:', error);
      // Fallback to local patterns if company LLM fails
      return await this.processWithLocalPatterns(content, fileName);
    }
  }

  /**
   * Processes document using local pattern matching
   */
  private async processWithLocalPatterns(content: string, fileName: string): Promise<AnalysisResult> {
    return await processDocumentWithPatterns(content, fileName);
  }

  /**
   * Creates a minimal result for manual-only processing
   */
  private async processManualOnly(fileName: string): Promise<AnalysisResult> {
    return {
      fileName,
      issues: [{
        page: 1,
        type: 'other',
        message: 'Document uploaded for manual review only',
        original: '',
        suggestion: 'Please review this document manually',
        locationHint: 'Manual review required'
      }],
      summary: {
        issueCount: 1,
        pagesAffected: [1]
      }
    };
  }

  private async callGeminiSecure(
    originalBuffer: Buffer,
    processedContent: string,
    wasSanitized: boolean
  ): Promise<AnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Server missing GEMINI_API_KEY');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Act as a PDF QA checker for a data science team specializing in subscription documents.
${wasSanitized ? 'NOTE: This document has been sanitized to remove sensitive information.' : ''}
First, extract all section headers (e.g., "Section 1", "Section I", "Appendix A").
Then, for each cross-reference found in the text (e.g., "see Section 1"), check if the referenced section header actually exists.
If a cross-reference points to a non-existent section, emit an issue object with the type 'cross_reference'.
Also, detect standard typos and formatting issues (spacing, punctuation, capitalization, alignment, font inconsistencies, numbering/bullets).

ADDITIONALLY, detect the following logic points that require customer confirmation and emit as type 'logic_point':
1. Funds exclusiveness issues - multiple funds mentioned without clear exclusiveness
2. Missing pages or mismatched table of contents
3. LPA/PA/PPM references that may be incorrect or outdated
4. Subscription amount or percentage discrepancies
5. Date inconsistencies (closing dates, commitment periods)
6. Signature page issues or missing signatures
7. Capital call timing or process unclear
8. Management fee calculation errors
9. Carried interest terms unclear
10. Investment period definitions inconsistent
11. Key person provisions unclear
12. Transfer restrictions not properly defined
13. Advisory committee composition unclear
14. Indemnification terms inconsistent
15. Tax election procedures unclear
16. Reporting frequency or format unclear
17. Termination or withdrawal provisions inconsistent

For logic_point issues, the message should describe what needs customer confirmation, original should contain the problematic text, and suggestion should indicate what clarification is needed.

Return STRICT JSON ONLY (no prose, no code fences) matching this schema:\n{\n  "fileName": "string",\n  "issues": [\n    {\n      "page": 1,\n      "type": "typo|spacing|punctuation|capitalization|alignment|font|formatting|cross_reference|logic_point|other",\n      "message": "string",\n      "original": "string",\n      "suggestion": "string",\n      "locationHint": "paragraph/line context or short snippet"\n    }\n  ],\n  "summary": { "issueCount": 0, "pagesAffected": [1, 2 ] }\n}\n`;

    try {
      const base64File = originalBuffer.toString('base64');
      const modelPromise = model.generateContent([
        prompt,
        { inlineData: { data: base64File, mimeType: 'application/pdf' } },
      ]);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Model timeout')), MODEL_TIMEOUT);
      });

      const result = await Promise.race([modelPromise, timeoutPromise]);
      const raw = result.response.text().trim();

      const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);
      let cleaned = raw;
      if (jsonMatch && jsonMatch[1]) {
        cleaned = jsonMatch[1].trim();
      } else {
        cleaned = raw.replace(/```json|```/g, '').trim();
      }

      const parsed = JSON.parse(cleaned) as AnalysisResult;
      return parsed;
    } catch (e) {
      console.error('Error calling Gemini securely:', e);
      throw new Error('Failed to get a valid JSON response from the model.');
    }
  }

  private async storeSecureDocument(
    fileName: string,
    analysisResult: AnalysisResult,
    encryptedDocument: EncryptionResult,
    classification: DocumentClassification,
    userId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('demo_requests')
        .insert({
          user_input: fileName,
          ai_result: analysisResult,
          encrypted_document: encryptedDocument.encrypted,
          encryption_iv: encryptedDocument.iv,
          encryption_auth_tag: encryptedDocument.authTag,
          document_classification: classification,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing secure document:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error storing secure document:', error);
      return null;
    }
  }

  private async scheduleRetention(
    documentId: string,
    userId: string,
    fileName: string,
    classification: DocumentClassification,
    retentionDays: number
  ): Promise<boolean> {
    try {
      const retentionId = await scheduleDocumentRetention(
        documentId,
        userId,
        fileName,
        classification,
        retentionDays
      );
      return retentionId !== null;
    } catch (error) {
      console.error('Error scheduling retention:', error);
      return false;
    }
  }
}

// Singleton instance
let secureReviewInstance: SecureReviewService | null = null;

export const getSecureReviewService = (): SecureReviewService => {
  if (!secureReviewInstance) {
    secureReviewInstance = new SecureReviewService();
  }
  return secureReviewInstance;
};