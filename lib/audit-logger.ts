import { createServerSupabase } from './supabaseServer';
import { DocumentClassification } from './document-classification';
import type { NextApiRequest } from 'next';

export enum AuditAction {
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_PROCESSING_START = 'document_processing_start',
  DOCUMENT_PROCESSING_COMPLETE = 'document_processing_complete',
  DOCUMENT_ACCESS = 'document_access',
  DOCUMENT_DELETE = 'document_delete',
  EXTERNAL_AI_CONSENT = 'external_ai_consent',
  DATA_SANITIZATION = 'data_sanitization',
  SCREENSHOT_GENERATION = 'screenshot_generation',
  EMAIL_GENERATION = 'email_generation',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  ACCESS_DENIED = 'access_denied',
  SENSITIVE_DATA_DETECTED = 'sensitive_data_detected',
  RETENTION_POLICY_APPLIED = 'retention_policy_applied'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  id?: string;
  action: AuditAction;
  user_id: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  severity: AuditSeverity;
  details: Record<string, any>;
  document_id?: string;
  document_classification?: DocumentClassification;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface AuditContext {
  req?: NextApiRequest;
  userId: string;
  sessionId?: string;
  documentId?: string;
  documentClassification?: DocumentClassification;
}

export class AuditLogger {
  private supabase = createServerSupabase();

  /**
   * Logs an audit event
   */
  async log(
    action: AuditAction,
    context: AuditContext,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const entry: AuditLogEntry = {
        action,
        user_id: context.userId,
        session_id: context.sessionId,
        timestamp: new Date().toISOString(),
        severity: this.determineSeverity(action, context.documentClassification, success),
        details: this.sanitizeDetails(details),
        document_id: context.documentId,
        document_classification: context.documentClassification,
        success,
        error_message: errorMessage,
        ip_address: this.extractIpAddress(context.req),
        user_agent: context.req?.headers['user-agent'],
        metadata: {
          request_id: this.generateRequestId(),
          app_version: process.env.npm_package_version || 'unknown'
        }
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert(entry);

      if (error) {
        console.error('Failed to write audit log:', error);
        // Fallback to file logging or external service
        this.fallbackLog(entry);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't let audit failures break the main application
    }
  }

  /**
   * Logs document upload event
   */
  async logDocumentUpload(
    context: AuditContext,
    fileName: string,
    fileSize: number,
    classification: DocumentClassification
  ): Promise<void> {
    await this.log(
      AuditAction.DOCUMENT_UPLOAD,
      { ...context, documentClassification: classification },
      {
        file_name: fileName,
        file_size: fileSize,
        classification
      }
    );
  }

  /**
   * Logs external AI processing consent
   */
  async logExternalAIConsent(
    context: AuditContext,
    consentGiven: boolean,
    sanitizationEnabled: boolean,
    retentionDays: number
  ): Promise<void> {
    await this.log(
      AuditAction.EXTERNAL_AI_CONSENT,
      context,
      {
        consent_given: consentGiven,
        sanitization_enabled: sanitizationEnabled,
        retention_days: retentionDays,
        external_service: 'google_gemini'
      }
    );
  }

  /**
   * Logs sensitive data detection
   */
  async logSensitiveDataDetection(
    context: AuditContext,
    detectedPatterns: Array<{ type: string; count: number; description: string }>
  ): Promise<void> {
    await this.log(
      AuditAction.SENSITIVE_DATA_DETECTED,
      context,
      {
        pattern_count: detectedPatterns.length,
        total_matches: detectedPatterns.reduce((sum, p) => sum + p.count, 0),
        pattern_types: detectedPatterns.map(p => p.type)
      }
    );
  }

  /**
   * Logs access denied events
   */
  async logAccessDenied(
    context: AuditContext,
    reason: string,
    requiredRole?: string
  ): Promise<void> {
    await this.log(
      AuditAction.ACCESS_DENIED,
      context,
      {
        denial_reason: reason,
        required_role: requiredRole,
        attempted_resource: context.documentId || 'unknown'
      },
      false
    );
  }

  /**
   * Logs document processing events
   */
  async logDocumentProcessing(
    context: AuditContext,
    stage: 'start' | 'complete',
    processingDetails: Record<string, any> = {}
  ): Promise<void> {
    const action = stage === 'start'
      ? AuditAction.DOCUMENT_PROCESSING_START
      : AuditAction.DOCUMENT_PROCESSING_COMPLETE;

    await this.log(action, context, {
      processing_stage: stage,
      ...processingDetails
    });
  }

  /**
   * Retrieves audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    severity?: AuditSeverity;
    documentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    let query = this.supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate.toISOString());
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.documentId) {
      query = query.eq('document_id', filters.documentId);
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generates audit report for compliance
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    options: {
      includeUserActivity?: boolean;
      includeDocumentAccess?: boolean;
      includeSecurityEvents?: boolean;
      format?: 'json' | 'csv';
    } = {}
  ): Promise<any> {
    const filters = { startDate, endDate };
    const logs = await this.getAuditLogs(filters);

    const report = {
      generated_at: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        total_events: logs.length,
        unique_users: new Set(logs.map(l => l.user_id)).size,
        security_events: logs.filter(l =>
          [AuditAction.ACCESS_DENIED, AuditAction.SENSITIVE_DATA_DETECTED].includes(l.action)
        ).length,
        document_processing: logs.filter(l =>
          l.action.includes('document')
        ).length
      },
      events: logs
    };

    return options.format === 'csv' ? this.convertToCsv(report) : report;
  }

  private determineSeverity(
    action: AuditAction,
    classification?: DocumentClassification,
    success?: boolean
  ): AuditSeverity {
    if (!success) {
      return AuditSeverity.HIGH;
    }

    if (action === AuditAction.ACCESS_DENIED || action === AuditAction.SENSITIVE_DATA_DETECTED) {
      return AuditSeverity.HIGH;
    }

    if (classification === DocumentClassification.RESTRICTED) {
      return AuditSeverity.CRITICAL;
    }

    if (classification === DocumentClassification.CONFIDENTIAL) {
      return AuditSeverity.HIGH;
    }

    if ([
      AuditAction.DOCUMENT_PROCESSING_START,
      AuditAction.EXTERNAL_AI_CONSENT,
      AuditAction.DOCUMENT_DELETE
    ].includes(action)) {
      return AuditSeverity.MEDIUM;
    }

    return AuditSeverity.LOW;
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };

    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'content', 'document_text'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    // Truncate long strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].substring(0, 500) + '... (truncated)';
      }
    });

    return sanitized;
  }

  private extractIpAddress(req?: NextApiRequest): string | undefined {
    if (!req) return undefined;

    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           (req.headers['x-real-ip'] as string) ||
           req.socket?.remoteAddress;
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private fallbackLog(entry: AuditLogEntry): void {
    // In production, this could write to a file, send to an external service, etc.
    console.log('AUDIT_LOG_FALLBACK:', JSON.stringify(entry));
  }

  private convertToCsv(report: any): string {
    // Simple CSV conversion for audit reports
    const headers = ['timestamp', 'action', 'user_id', 'severity', 'success', 'details'];
    const rows = report.events.map((event: AuditLogEntry) => [
      event.timestamp,
      event.action,
      event.user_id,
      event.severity,
      event.success,
      JSON.stringify(event.details)
    ]);

    return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
  }
}

// Singleton instance
let auditLoggerInstance: AuditLogger | null = null;

export const getAuditLogger = (): AuditLogger => {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
};

// Convenience functions
export const auditLog = async (
  action: AuditAction,
  context: AuditContext,
  details: Record<string, any> = {},
  success: boolean = true,
  errorMessage?: string
): Promise<void> => {
  return getAuditLogger().log(action, context, details, success, errorMessage);
};