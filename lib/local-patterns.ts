import type { AnalysisResult, AnalysisIssue } from './review';

export interface PatternRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  type: AnalysisIssue['type'];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  enabled: boolean;
}

export interface PatternMatch {
  rule: PatternRule;
  matches: Array<{
    text: string;
    index: number;
    page: number;
    context: string;
  }>;
}

export class LocalPatternProcessor {
  private rules: PatternRule[] = [
    // Typo and Spelling Rules
    {
      id: 'common_typos',
      name: 'Common Typos',
      description: 'Detects common spelling mistakes',
      pattern: /\b(teh|recieve|seperate|occurence|accomodate|definately|goverment|buisness|occured|managment)\b/gi,
      type: 'typo',
      severity: 'medium',
      suggestion: 'Check spelling and correct typos',
      enabled: true
    },
    {
      id: 'duplicate_words',
      name: 'Duplicate Words',
      description: 'Finds repeated words',
      pattern: /\b(\w+)\s+\1\b/gi,
      type: 'typo',
      severity: 'medium',
      suggestion: 'Remove duplicate word',
      enabled: true
    },

    // Punctuation Rules
    {
      id: 'missing_periods',
      name: 'Missing Periods',
      description: 'Sentences without ending punctuation',
      pattern: /[a-z]\s*\n\s*[A-Z]/g,
      type: 'punctuation',
      severity: 'low',
      suggestion: 'Add missing period at end of sentence',
      enabled: true
    },
    {
      id: 'double_spaces',
      name: 'Double Spaces',
      description: 'Multiple consecutive spaces',
      pattern: /  +/g,
      type: 'spacing',
      severity: 'low',
      suggestion: 'Replace multiple spaces with single space',
      enabled: true
    },
    {
      id: 'space_before_punctuation',
      name: 'Space Before Punctuation',
      description: 'Incorrect spacing before punctuation',
      pattern: /\s+[,.;:!?]/g,
      type: 'spacing',
      severity: 'medium',
      suggestion: 'Remove space before punctuation',
      enabled: true
    },

    // Capitalization Rules
    {
      id: 'sentence_capitalization',
      name: 'Sentence Capitalization',
      description: 'Sentences not starting with capital letters',
      pattern: /[.!?]\s+[a-z]/g,
      type: 'capitalization',
      severity: 'medium',
      suggestion: 'Capitalize first letter of sentence',
      enabled: true
    },

    // Financial Document Specific Rules
    {
      id: 'currency_formatting',
      name: 'Currency Formatting',
      description: 'Inconsistent currency formatting',
      pattern: /\$\s*\d+(?:\.\d{3,}|\.\d{1}(?!\d))/g,
      type: 'formatting',
      severity: 'medium',
      suggestion: 'Use consistent currency formatting (e.g., $1,000.00)',
      enabled: true
    },
    {
      id: 'percentage_formatting',
      name: 'Percentage Formatting',
      description: 'Inconsistent percentage formatting',
      pattern: /\d+\s*%|\d+\s*percent/gi,
      type: 'formatting',
      severity: 'low',
      suggestion: 'Use consistent percentage formatting',
      enabled: true
    },

    // Legal Document Specific Rules
    {
      id: 'missing_sections',
      name: 'Missing Section References',
      description: 'References to sections that may not exist',
      pattern: /(?:see|refer to|as per|according to|pursuant to)\s+(?:section|clause|paragraph|article)\s+([A-Z0-9]+(?:\.[A-Z0-9]+)*)/gi,
      type: 'cross_reference',
      severity: 'high',
      suggestion: 'Verify section reference exists in document',
      enabled: true
    },
    {
      id: 'undefined_terms',
      name: 'Undefined Terms',
      description: 'Terms that should be defined',
      pattern: /\b(the\s+)?(Company|Fund|Partnership|Agreement|Contract|LP|GP|LPA|PPM)\b(?!\s+(?:shall|will|may|is|are|means|refers?))/g,
      type: 'logic_point',
      severity: 'medium',
      suggestion: 'Ensure capitalized terms are properly defined',
      enabled: true
    },

    // Date and Number Consistency
    {
      id: 'date_formats',
      name: 'Inconsistent Date Formats',
      description: 'Mixed date formatting styles',
      pattern: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4}/gi,
      type: 'formatting',
      severity: 'low',
      suggestion: 'Use consistent date formatting throughout document',
      enabled: true
    },
    {
      id: 'number_formatting',
      name: 'Number Formatting',
      description: 'Inconsistent number formatting',
      pattern: /\b\d{4,}(?!\.\d{2}\b)(?![\/\-]\d)/g,
      type: 'formatting',
      severity: 'low',
      suggestion: 'Consider using comma separators for large numbers',
      enabled: true
    },

    // Logic Points for Subscription Documents
    {
      id: 'subscription_amounts',
      name: 'Subscription Amount Issues',
      description: 'Potential subscription amount discrepancies',
      pattern: /(?:subscription|commitment|capital)\s+(?:amount|commitment)?\s*[:=]?\s*\$?[\d,]+/gi,
      type: 'logic_point',
      severity: 'high',
      suggestion: 'Verify subscription amounts are consistent throughout document',
      enabled: true
    },
    {
      id: 'signature_pages',
      name: 'Signature Requirements',
      description: 'Signature page requirements',
      pattern: /(?:signature|executed|signed).*(?:page|below|witness)/gi,
      type: 'logic_point',
      severity: 'medium',
      suggestion: 'Verify signature requirements and execution instructions',
      enabled: true
    },
    {
      id: 'closing_dates',
      name: 'Closing Date References',
      description: 'Closing date mentions that need verification',
      pattern: /(?:closing|effective)\s+date.*?(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/gi,
      type: 'logic_point',
      severity: 'high',
      suggestion: 'Confirm closing dates are accurate and consistent',
      enabled: true
    }
  ];

  /**
   * Processes document content using pattern matching
   */
  async processDocument(content: string, fileName: string): Promise<AnalysisResult> {
    const pages = this.splitIntoPages(content);
    const allMatches: PatternMatch[] = [];

    // Process each rule against the content
    for (const rule of this.rules.filter(r => r.enabled)) {
      const matches = this.findPatternMatches(rule, content, pages);
      if (matches.matches.length > 0) {
        allMatches.push(matches);
      }
    }

    // Convert matches to issues
    const issues = this.convertMatchesToIssues(allMatches);

    return {
      fileName,
      issues,
      summary: {
        issueCount: issues.length,
        pagesAffected: [...new Set(issues.map(issue => issue.page))]
      }
    };
  }

  /**
   * Finds all matches for a specific pattern rule
   */
  private findPatternMatches(rule: PatternRule, content: string, pages: string[]): PatternMatch {
    const matches: PatternMatch['matches'] = [];
    let match;

    // Reset regex lastIndex
    rule.pattern.lastIndex = 0;

    while ((match = rule.pattern.exec(content)) !== null) {
      const index = match.index;
      const text = match[0];
      const page = this.getPageNumber(index, content, pages);
      const context = this.getContext(content, index, 100);

      matches.push({
        text,
        index,
        page,
        context
      });

      // Prevent infinite loops on global regexes
      if (!rule.pattern.global) break;
    }

    return {
      rule,
      matches
    };
  }

  /**
   * Converts pattern matches to analysis issues
   */
  private convertMatchesToIssues(matches: PatternMatch[]): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    for (const match of matches) {
      for (const m of match.matches) {
        issues.push({
          page: m.page,
          type: match.rule.type,
          message: this.generateIssueMessage(match.rule, m.text),
          original: m.text,
          suggestion: this.generateSuggestion(match.rule, m.text),
          locationHint: m.context
        });
      }
    }

    return issues;
  }

  /**
   * Generates a descriptive message for an issue
   */
  private generateIssueMessage(rule: PatternRule, matchedText: string): string {
    switch (rule.id) {
      case 'common_typos':
        return `Possible typo: "${matchedText}"`;
      case 'duplicate_words':
        return `Duplicate word found: "${matchedText}"`;
      case 'missing_periods':
        return 'Sentence appears to be missing ending punctuation';
      case 'double_spaces':
        return 'Multiple consecutive spaces found';
      case 'space_before_punctuation':
        return 'Unnecessary space before punctuation';
      case 'sentence_capitalization':
        return 'Sentence should start with capital letter';
      case 'currency_formatting':
        return `Currency formatting may be inconsistent: "${matchedText}"`;
      case 'missing_sections':
        return `Section reference may need verification: "${matchedText}"`;
      case 'undefined_terms':
        return `Capitalized term may need definition: "${matchedText}"`;
      case 'subscription_amounts':
        return `Subscription amount requires verification: "${matchedText}"`;
      case 'signature_pages':
        return `Signature requirement needs review: "${matchedText}"`;
      case 'closing_dates':
        return `Closing date needs verification: "${matchedText}"`;
      default:
        return `${rule.description}: "${matchedText}"`;
    }
  }

  /**
   * Generates a suggestion for fixing an issue
   */
  private generateSuggestion(rule: PatternRule, matchedText: string): string {
    switch (rule.id) {
      case 'common_typos':
        const corrections: Record<string, string> = {
          'teh': 'the',
          'recieve': 'receive',
          'seperate': 'separate',
          'occurence': 'occurrence',
          'accomodate': 'accommodate',
          'definately': 'definitely',
          'goverment': 'government',
          'buisness': 'business',
          'occured': 'occurred',
          'managment': 'management'
        };
        const correction = corrections[matchedText.toLowerCase()];
        return correction ? `Change to "${correction}"` : 'Check spelling';
      case 'duplicate_words':
        const word = matchedText.split(' ')[0];
        return `Remove duplicate "${word}"`;
      case 'currency_formatting':
        return 'Use format like "$1,000.00"';
      default:
        return rule.suggestion;
    }
  }

  /**
   * Splits content into pages (simple approximation)
   */
  private splitIntoPages(content: string): string[] {
    // Try to split by form feed characters first
    let pages = content.split('\f');

    // If no form feeds, split by estimated page length
    if (pages.length === 1) {
      const avgCharsPerPage = 3000; // Rough estimate
      const pageCount = Math.ceil(content.length / avgCharsPerPage);
      pages = [];
      for (let i = 0; i < pageCount; i++) {
        const start = i * avgCharsPerPage;
        const end = Math.min((i + 1) * avgCharsPerPage, content.length);
        pages.push(content.substring(start, end));
      }
    }

    return pages;
  }

  /**
   * Determines which page a character index belongs to
   */
  private getPageNumber(index: number, content: string, pages: string[]): number {
    let currentIndex = 0;
    for (let i = 0; i < pages.length; i++) {
      currentIndex += pages[i].length;
      if (index <= currentIndex) {
        return i + 1;
      }
    }
    return pages.length;
  }

  /**
   * Gets context around a match
   */
  private getContext(content: string, index: number, contextLength: number = 100): string {
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + contextLength / 2);
    const context = content.substring(start, end);

    // Clean up the context
    return context
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Adds a custom rule
   */
  addRule(rule: PatternRule): void {
    this.rules.push(rule);
  }

  /**
   * Removes a rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Enables/disables a rule
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Gets all available rules
   */
  getRules(): PatternRule[] {
    return [...this.rules];
  }

  /**
   * Gets enabled rules only
   */
  getEnabledRules(): PatternRule[] {
    return this.rules.filter(rule => rule.enabled);
  }
}

// Singleton instance
let patternProcessorInstance: LocalPatternProcessor | null = null;

export const getPatternProcessor = (): LocalPatternProcessor => {
  if (!patternProcessorInstance) {
    patternProcessorInstance = new LocalPatternProcessor();
  }
  return patternProcessorInstance;
};

// Convenience function
export const processDocumentWithPatterns = (
  content: string,
  fileName: string
): Promise<AnalysisResult> => {
  return getPatternProcessor().processDocument(content, fileName);
};