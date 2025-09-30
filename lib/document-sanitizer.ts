export interface SanitizationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface SanitizationResult {
  sanitizedContent: string;
  detectedPatterns: Array<{
    type: string;
    count: number;
    description: string;
  }>;
}

export class DocumentSanitizer {
  private rules: SanitizationRule[] = [
    // Social Security Numbers
    {
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: '[SSN-REDACTED]',
      description: 'Social Security Number'
    },
    // Credit Card Numbers (basic pattern)
    {
      pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      replacement: '[CARD-REDACTED]',
      description: 'Credit Card Number'
    },
    // Phone Numbers
    {
      pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      replacement: '[PHONE-REDACTED]',
      description: 'Phone Number'
    },
    // Email Addresses
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL-REDACTED]',
      description: 'Email Address'
    },
    // Dollar Amounts (with various formats)
    {
      pattern: /\$[\d,]+(?:\.\d{2})?/g,
      replacement: '[AMOUNT-REDACTED]',
      description: 'Dollar Amount'
    },
    // Bank Account Numbers (generic pattern)
    {
      pattern: /\b\d{8,17}\b/g,
      replacement: '[ACCOUNT-REDACTED]',
      description: 'Potential Account Number'
    },
    // IP Addresses
    {
      pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      replacement: '[IP-REDACTED]',
      description: 'IP Address'
    },
    // Dates (MM/DD/YYYY, MM-DD-YYYY, etc.)
    {
      pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
      replacement: '[DATE-REDACTED]',
      description: 'Date'
    }
  ];

  /**
   * Sanitizes document content by replacing sensitive patterns
   */
  sanitize(content: string): SanitizationResult {
    let sanitizedContent = content;
    const detectedPatterns: Array<{ type: string; count: number; description: string }> = [];

    for (const rule of this.rules) {
      const matches = content.match(rule.pattern);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        sanitizedContent = sanitizedContent.replace(rule.pattern, rule.replacement);
        detectedPatterns.push({
          type: rule.replacement,
          count,
          description: rule.description
        });
      }
    }

    return {
      sanitizedContent,
      detectedPatterns
    };
  }

  /**
   * Adds a custom sanitization rule
   */
  addRule(rule: SanitizationRule): void {
    this.rules.push(rule);
  }

  /**
   * Removes all rules of a specific type
   */
  removeRule(replacement: string): void {
    this.rules = this.rules.filter(rule => rule.replacement !== replacement);
  }

  /**
   * Gets all current rules
   */
  getRules(): SanitizationRule[] {
    return [...this.rules];
  }

  /**
   * Quick sanitization with default rules
   */
  static quickSanitize(content: string): string {
    const sanitizer = new DocumentSanitizer();
    return sanitizer.sanitize(content).sanitizedContent;
  }

  /**
   * Checks if content contains sensitive information without modifying it
   */
  detectSensitiveContent(content: string): boolean {
    return this.rules.some(rule => rule.pattern.test(content));
  }

  /**
   * Gets a summary of what would be sanitized without actually sanitizing
   */
  getSanitizationPreview(content: string): Array<{ type: string; count: number; description: string }> {
    const detectedPatterns: Array<{ type: string; count: number; description: string }> = [];

    for (const rule of this.rules) {
      const matches = content.match(rule.pattern);
      const count = matches ? matches.length : 0;

      if (count > 0) {
        detectedPatterns.push({
          type: rule.replacement,
          count,
          description: rule.description
        });
      }
    }

    return detectedPatterns;
  }
}

// Singleton instance
let sanitizerInstance: DocumentSanitizer | null = null;

export const getSanitizer = (): DocumentSanitizer => {
  if (!sanitizerInstance) {
    sanitizerInstance = new DocumentSanitizer();
  }
  return sanitizerInstance;
};

// Convenience functions
export const sanitizeDocument = (content: string): SanitizationResult => {
  return getSanitizer().sanitize(content);
};

export const quickSanitize = (content: string): string => {
  return DocumentSanitizer.quickSanitize(content);
};

export const detectSensitiveContent = (content: string): boolean => {
  return getSanitizer().detectSensitiveContent(content);
};