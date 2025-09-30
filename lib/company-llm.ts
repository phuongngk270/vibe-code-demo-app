import type { AnalysisResult } from './review';

export interface CompanyLLMConfig {
  apiUrl: string;
  apiKey: string;
  model?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface LLMRequest {
  prompt: string;
  documentContent: string;
  fileName: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export class CompanyLLMService {
  private config: CompanyLLMConfig;

  constructor(config: CompanyLLMConfig) {
    this.config = {
      timeout: 120000, // 2 minutes default
      ...config
    };
  }

  /**
   * Analyzes document using company's internal LLM
   */
  async analyzeDocument(
    documentContent: string,
    fileName: string,
    wasSanitized: boolean = false
  ): Promise<AnalysisResult> {
    const prompt = this.buildDocumentAnalysisPrompt(wasSanitized);

    try {
      const response = await this.callLLM({
        prompt,
        documentContent,
        fileName,
        maxTokens: 4000,
        temperature: 0.1 // Low temperature for consistent analysis
      });

      return this.parseAnalysisResponse(response.content, fileName);
    } catch (error) {
      console.error('Company LLM analysis failed:', error);
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generic method to call company LLM API
   */
  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    const requestBody = this.formatRequest(request);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...this.config.headers
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return this.formatResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timeout');
      }
      throw error;
    }
  }

  /**
   * Builds the document analysis prompt
   */
  private buildDocumentAnalysisPrompt(wasSanitized: boolean): string {
    return `
Act as a PDF QA checker for a data science team specializing in subscription documents.
${wasSanitized ? 'NOTE: This document has been sanitized to remove sensitive information.' : ''}

Your task is to analyze the document content and identify issues that need attention.

First, extract all section headers (e.g., "Section 1", "Section I", "Appendix A").
Then, for each cross-reference found in the text (e.g., "see Section 1"), check if the referenced section header actually exists.
If a cross-reference points to a non-existent section, emit an issue object with the type 'cross_reference'.

Also, detect standard typos and formatting issues:
- Spelling errors and typos
- Inconsistent spacing
- Punctuation errors
- Capitalization issues
- Font inconsistencies
- Numbering/bullet formatting problems

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

Return STRICT JSON ONLY (no prose, no code fences) matching this schema:
{
  "fileName": "string",
  "issues": [
    {
      "page": 1,
      "type": "typo|spacing|punctuation|capitalization|alignment|font|formatting|cross_reference|logic_point|other",
      "message": "string",
      "original": "string",
      "suggestion": "string",
      "locationHint": "paragraph/line context or short snippet"
    }
  ],
  "summary": { "issueCount": 0, "pagesAffected": [1, 2] }
}

Document content to analyze:
`;
  }

  /**
   * Formats request for different LLM API formats
   */
  private formatRequest(request: LLMRequest): any {
    // Default format - adjust based on your company's LLM API
    // This example assumes OpenAI-compatible format
    return {
      model: this.config.model || 'default',
      messages: [
        {
          role: 'system',
          content: request.prompt
        },
        {
          role: 'user',
          content: request.documentContent
        }
      ],
      max_tokens: request.maxTokens || 4000,
      temperature: request.temperature || 0.1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
  }

  /**
   * Formats response from different LLM API formats
   */
  private formatResponse(data: any): LLMResponse {
    // Default format - adjust based on your company's LLM API response
    // This example assumes OpenAI-compatible format
    return {
      content: data.choices?.[0]?.message?.content || data.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0
      } : undefined,
      model: data.model,
      finishReason: data.choices?.[0]?.finish_reason || data.finish_reason
    };
  }

  /**
   * Parses LLM response into structured analysis result
   */
  private parseAnalysisResponse(content: string, fileName: string): AnalysisResult {
    try {
      // Clean the response - remove code fences if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedContent);

      // Validate and normalize the response
      return {
        fileName: parsed.fileName || fileName,
        issues: Array.isArray(parsed.issues) ? parsed.issues.map(this.normalizeIssue) : [],
        summary: {
          issueCount: parsed.summary?.issueCount || 0,
          pagesAffected: Array.isArray(parsed.summary?.pagesAffected) ? parsed.summary.pagesAffected : []
        }
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Raw response:', content);

      // Return a fallback result
      return {
        fileName,
        issues: [],
        summary: {
          issueCount: 0,
          pagesAffected: []
        }
      };
    }
  }

  /**
   * Normalizes issue object to ensure consistent format
   */
  private normalizeIssue(issue: any): any {
    const validTypes = ['typo', 'spacing', 'punctuation', 'capitalization', 'alignment', 'font', 'formatting', 'cross_reference', 'logic_point', 'other'];

    return {
      page: Math.max(1, parseInt(String(issue.page), 10) || 1),
      type: validTypes.includes(issue.type) ? issue.type : 'other',
      message: String(issue.message || ''),
      original: String(issue.original || ''),
      suggestion: String(issue.suggestion || ''),
      locationHint: String(issue.locationHint || '')
    };
  }

  /**
   * Tests connection to company LLM API
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    try {
      const response = await this.callLLM({
        prompt: 'Respond with "OK" to confirm connection.',
        documentContent: 'Test connection',
        fileName: 'test.txt',
        maxTokens: 10
      });

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: 'Connection successful',
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

// Configuration builder for different LLM providers
export class LLMConfigBuilder {
  /**
   * OpenAI-compatible API configuration
   */
  static openAICompatible(apiUrl: string, apiKey: string, model?: string): CompanyLLMConfig {
    return {
      apiUrl: `${apiUrl}/chat/completions`,
      apiKey,
      model: model || 'gpt-3.5-turbo',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Anthropic Claude API configuration
   */
  static anthropic(apiKey: string, model?: string): CompanyLLMConfig {
    return {
      apiUrl: 'https://api.anthropic.com/v1/messages',
      apiKey,
      model: model || 'claude-3-sonnet-20240229',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    };
  }

  /**
   * Azure OpenAI configuration
   */
  static azureOpenAI(
    resourceName: string,
    deploymentName: string,
    apiKey: string,
    apiVersion: string = '2023-12-01-preview'
  ): CompanyLLMConfig {
    return {
      apiUrl: `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`,
      apiKey,
      model: deploymentName,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    };
  }

  /**
   * Custom internal API configuration
   */
  static custom(
    apiUrl: string,
    apiKey: string,
    options: {
      model?: string;
      timeout?: number;
      headers?: Record<string, string>;
    } = {}
  ): CompanyLLMConfig {
    return {
      apiUrl,
      apiKey,
      model: options.model,
      timeout: options.timeout,
      headers: options.headers
    };
  }
}

// Singleton instance
let companyLLMInstance: CompanyLLMService | null = null;

export const getCompanyLLM = (): CompanyLLMService => {
  if (!companyLLMInstance) {
    const apiUrl = process.env.COMPANY_LLM_API_URL;
    const apiKey = process.env.COMPANY_LLM_API_KEY;
    const model = process.env.COMPANY_LLM_MODEL;

    if (!apiUrl || !apiKey) {
      throw new Error('Company LLM configuration missing. Set COMPANY_LLM_API_URL and COMPANY_LLM_API_KEY environment variables.');
    }

    const config = LLMConfigBuilder.custom(apiUrl, apiKey, { model });
    companyLLMInstance = new CompanyLLMService(config);
  }
  return companyLLMInstance;
};

// Convenience function
export const analyzeDocumentWithCompanyLLM = (
  documentContent: string,
  fileName: string,
  wasSanitized?: boolean
): Promise<AnalysisResult> => {
  return getCompanyLLM().analyzeDocument(documentContent, fileName, wasSanitized);
};