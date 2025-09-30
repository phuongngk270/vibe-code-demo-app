export enum DocumentClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export enum UserRole {
  USER = 'user',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export interface ClassificationResult {
  classification: DocumentClassification;
  confidence: number;
  reasons: string[];
  suggestedActions: string[];
}

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  requiredRole?: UserRole;
}

export class DocumentClassifier {
  private confidentialPatterns = [
    /confidential/i,
    /proprietary/i,
    /trade\s+secret/i,
    /non-disclosure/i,
    /nda/i,
    /restricted/i,
    /internal\s+use\s+only/i,
    /private\s+and\s+confidential/i,
    /attorney-client\s+privilege/i,
    /privileged\s+and\s+confidential/i
  ];

  private restrictedPatterns = [
    /classified/i,
    /top\s+secret/i,
    /highly\s+confidential/i,
    /executive\s+only/i,
    /board\s+confidential/i,
    /merger/i,
    /acquisition/i,
    /regulatory\s+filing/i,
    /material\s+non-public/i
  ];

  private internalPatterns = [
    /internal/i,
    /employee\s+handbook/i,
    /company\s+policy/i,
    /staff\s+memo/i,
    /departmental/i,
    /team\s+update/i
  ];

  private financialPatterns = [
    /financial\s+statement/i,
    /balance\s+sheet/i,
    /income\s+statement/i,
    /cash\s+flow/i,
    /audit\s+report/i,
    /tax\s+return/i,
    /earnings/i,
    /revenue/i,
    /profit\s+and\s+loss/i
  ];

  private legalPatterns = [
    /contract/i,
    /agreement/i,
    /legal\s+opinion/i,
    /litigation/i,
    /settlement/i,
    /lawsuit/i,
    /legal\s+advice/i,
    /memorandum\s+of\s+understanding/i
  ];

  /**
   * Classifies a document based on its content
   */
  classifyDocument(content: string, fileName: string = ''): ClassificationResult {
    const reasons: string[] = [];
    let classification = DocumentClassification.PUBLIC;
    let confidence = 0.5;

    // Check for restricted patterns first (highest priority)
    const restrictedMatches = this.countMatches(content, this.restrictedPatterns);
    if (restrictedMatches > 0) {
      classification = DocumentClassification.RESTRICTED;
      confidence = Math.min(0.9, 0.7 + (restrictedMatches * 0.1));
      reasons.push(`Contains ${restrictedMatches} restricted indicator(s)`);
    }
    // Check for confidential patterns
    else if (this.countMatches(content, this.confidentialPatterns) > 0) {
      const matches = this.countMatches(content, this.confidentialPatterns);
      classification = DocumentClassification.CONFIDENTIAL;
      confidence = Math.min(0.85, 0.6 + (matches * 0.1));
      reasons.push(`Contains ${matches} confidential indicator(s)`);
    }
    // Check for internal patterns
    else if (this.countMatches(content, this.internalPatterns) > 0) {
      const matches = this.countMatches(content, this.internalPatterns);
      classification = DocumentClassification.INTERNAL;
      confidence = Math.min(0.8, 0.5 + (matches * 0.1));
      reasons.push(`Contains ${matches} internal indicator(s)`);
    }

    // Additional factors that can elevate classification
    const financialMatches = this.countMatches(content, this.financialPatterns);
    const legalMatches = this.countMatches(content, this.legalPatterns);

    if (financialMatches > 0) {
      if (classification === DocumentClassification.PUBLIC) {
        classification = DocumentClassification.INTERNAL;
        confidence = 0.7;
      }
      reasons.push(`Contains ${financialMatches} financial indicator(s)`);
    }

    if (legalMatches > 0) {
      if (classification === DocumentClassification.PUBLIC || classification === DocumentClassification.INTERNAL) {
        classification = DocumentClassification.CONFIDENTIAL;
        confidence = 0.75;
      }
      reasons.push(`Contains ${legalMatches} legal indicator(s)`);
    }

    // Check filename for classification hints
    if (fileName) {
      if (/confidential|restricted|private/i.test(fileName)) {
        if (classification === DocumentClassification.PUBLIC) {
          classification = DocumentClassification.CONFIDENTIAL;
          confidence = 0.7;
        }
        reasons.push('Filename indicates sensitive content');
      }
    }

    return {
      classification,
      confidence,
      reasons,
      suggestedActions: this.getSuggestedActions(classification)
    };
  }

  private countMatches(content: string, patterns: RegExp[]): number {
    return patterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private getSuggestedActions(classification: DocumentClassification): string[] {
    switch (classification) {
      case DocumentClassification.RESTRICTED:
        return [
          'Require admin approval for processing',
          'Log all access attempts',
          'Enable automatic deletion after 7 days',
          'Disable external AI processing',
          'Require additional authentication'
        ];
      case DocumentClassification.CONFIDENTIAL:
        return [
          'Enable data sanitization',
          'Require user consent for external processing',
          'Set shorter retention period',
          'Enable audit logging',
          'Require manager-level access'
        ];
      case DocumentClassification.INTERNAL:
        return [
          'Require employee-level access',
          'Enable basic audit logging',
          'Standard retention policy',
          'Allow external processing with consent'
        ];
      default:
        return [
          'Standard processing allowed',
          'Basic retention policy',
          'Standard access controls'
        ];
    }
  }
}

export class AccessController {
  private accessMatrix: Record<DocumentClassification, UserRole[]> = {
    [DocumentClassification.PUBLIC]: [UserRole.USER, UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
    [DocumentClassification.INTERNAL]: [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN],
    [DocumentClassification.CONFIDENTIAL]: [UserRole.MANAGER, UserRole.ADMIN],
    [DocumentClassification.RESTRICTED]: [UserRole.ADMIN]
  };

  /**
   * Checks if a user role can access a document classification
   */
  checkAccess(userRole: UserRole, classification: DocumentClassification): AccessCheckResult {
    const allowedRoles = this.accessMatrix[classification];
    const allowed = allowedRoles.includes(userRole);

    if (allowed) {
      return {
        allowed: true,
        reason: `Access granted for ${userRole} role`
      };
    }

    const requiredRoles = allowedRoles.filter(role =>
      this.getRoleLevel(role) >= this.getRoleLevel(userRole)
    );

    return {
      allowed: false,
      reason: `Insufficient privileges. Document classification: ${classification}`,
      requiredRole: requiredRoles[0]
    };
  }

  /**
   * Gets the minimum role required for a classification
   */
  getMinimumRole(classification: DocumentClassification): UserRole {
    const allowedRoles = this.accessMatrix[classification];
    return allowedRoles.reduce((min, role) =>
      this.getRoleLevel(role) < this.getRoleLevel(min) ? role : min
    );
  }

  /**
   * Updates access matrix for a classification
   */
  updateAccessMatrix(classification: DocumentClassification, roles: UserRole[]): void {
    this.accessMatrix[classification] = [...roles];
  }

  private getRoleLevel(role: UserRole): number {
    const levels = {
      [UserRole.USER]: 1,
      [UserRole.EMPLOYEE]: 2,
      [UserRole.MANAGER]: 3,
      [UserRole.ADMIN]: 4
    };
    return levels[role] || 0;
  }
}

// Singleton instances
let classifierInstance: DocumentClassifier | null = null;
let accessControllerInstance: AccessController | null = null;

export const getClassifier = (): DocumentClassifier => {
  if (!classifierInstance) {
    classifierInstance = new DocumentClassifier();
  }
  return classifierInstance;
};

export const getAccessController = (): AccessController => {
  if (!accessControllerInstance) {
    accessControllerInstance = new AccessController();
  }
  return accessControllerInstance;
};

// Convenience functions
export const classifyDocument = (content: string, fileName?: string): ClassificationResult => {
  return getClassifier().classifyDocument(content, fileName);
};

export const checkDocumentAccess = (userRole: UserRole, classification: DocumentClassification): AccessCheckResult => {
  return getAccessController().checkAccess(userRole, classification);
};