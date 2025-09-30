import { createServerSupabase } from './supabaseServer';
import { DocumentClassification } from './document-classification';
import { auditLog, AuditAction, type AuditContext } from './audit-logger';
import { getSecureScreenshotManager } from './secure-screenshot';

export interface RetentionPolicy {
  id: string;
  classification: DocumentClassification;
  retentionDays: number;
  autoDelete: boolean;
  archiveBeforeDelete: boolean;
  notifyBeforeDelete: boolean;
  notifyDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRetention {
  id?: string;
  document_id: string;
  user_id: string;
  file_name: string;
  classification: DocumentClassification;
  created_at: string;
  expires_at: string;
  policy_id: string;
  status: 'active' | 'pending_deletion' | 'deleted' | 'archived';
  notification_sent?: boolean;
  metadata?: Record<string, any>;
}

export interface RetentionStats {
  totalDocuments: number;
  pendingDeletion: number;
  expiredDocuments: number;
  archivedDocuments: number;
  byClassification: Record<DocumentClassification, number>;
}

export class RetentionPolicyManager {
  private supabase = createServerSupabase();

  private defaultPolicies: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      classification: DocumentClassification.PUBLIC,
      retentionDays: 365,
      autoDelete: true,
      archiveBeforeDelete: false,
      notifyBeforeDelete: false,
      notifyDaysBefore: 7
    },
    {
      classification: DocumentClassification.INTERNAL,
      retentionDays: 180,
      autoDelete: true,
      archiveBeforeDelete: true,
      notifyBeforeDelete: true,
      notifyDaysBefore: 14
    },
    {
      classification: DocumentClassification.CONFIDENTIAL,
      retentionDays: 90,
      autoDelete: true,
      archiveBeforeDelete: true,
      notifyBeforeDelete: true,
      notifyDaysBefore: 30
    },
    {
      classification: DocumentClassification.RESTRICTED,
      retentionDays: 30,
      autoDelete: false, // Manual deletion required for restricted documents
      archiveBeforeDelete: true,
      notifyBeforeDelete: true,
      notifyDaysBefore: 7
    }
  ];

  /**
   * Initializes default retention policies
   */
  async initializeDefaultPolicies(): Promise<void> {
    try {
      for (const policy of this.defaultPolicies) {
        await this.createOrUpdatePolicy(policy);
      }
    } catch (error) {
      console.error('Error initializing default retention policies:', error);
    }
  }

  /**
   * Schedules document for deletion based on retention policy
   */
  async scheduleDocumentRetention(
    documentId: string,
    userId: string,
    fileName: string,
    classification: DocumentClassification,
    customRetentionDays?: number
  ): Promise<string | null> {
    try {
      const policy = await this.getPolicyForClassification(classification);
      if (!policy) {
        throw new Error(`No retention policy found for classification: ${classification}`);
      }

      const retentionDays = customRetentionDays || policy.retentionDays;
      const expiresAt = new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000));

      const retention: Omit<DocumentRetention, 'id'> = {
        document_id: documentId,
        user_id: userId,
        file_name: fileName,
        classification,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        policy_id: policy.id,
        status: 'active',
        metadata: {
          retention_days: retentionDays,
          auto_delete: policy.autoDelete,
          archive_before_delete: policy.archiveBeforeDelete
        }
      };

      const { data, error } = await this.supabase
        .from('document_retention')
        .insert(retention)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Audit log
      const auditContext: AuditContext = {
        userId,
        documentId,
        documentClassification: classification
      };

      await auditLog(
        AuditAction.RETENTION_POLICY_APPLIED,
        auditContext,
        {
          retention_days: retentionDays,
          expires_at: expiresAt.toISOString(),
          policy_id: policy.id,
          auto_delete: policy.autoDelete
        }
      );

      return data?.id || null;
    } catch (error) {
      console.error('Error scheduling document retention:', error);
      return null;
    }
  }

  /**
   * Processes expired documents (cleanup job)
   */
  async processExpiredDocuments(): Promise<{
    processed: number;
    deleted: number;
    archived: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      deleted: 0,
      archived: 0,
      errors: [] as string[]
    };

    try {
      // Get expired documents
      const { data: expiredDocs, error } = await this.supabase
        .from('document_retention')
        .select('*')
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      if (!expiredDocs || expiredDocs.length === 0) {
        return result;
      }

      for (const doc of expiredDocs) {
        try {
          result.processed++;

          const policy = await this.getPolicy(doc.policy_id);
          if (!policy) {
            result.errors.push(`Policy not found for document ${doc.document_id}`);
            continue;
          }

          if (policy.autoDelete) {
            if (policy.archiveBeforeDelete) {
              await this.archiveDocument(doc);
              result.archived++;
            }
            await this.deleteDocument(doc);
            result.deleted++;
          } else {
            // Mark for manual deletion
            await this.markForManualDeletion(doc);
          }

        } catch (error) {
          const errorMsg = `Error processing document ${doc.document_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      result.errors.push(`Error processing expired documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Sends retention notifications
   */
  async sendRetentionNotifications(): Promise<{
    sent: number;
    errors: string[];
  }> {
    const result = {
      sent: 0,
      errors: [] as string[]
    };

    try {
      // Get documents that need notification
      const { data: docs, error } = await this.supabase
        .from('document_retention')
        .select(`
          *,
          retention_policies (*)
        `)
        .eq('status', 'active')
        .eq('notification_sent', false)
        .or(`notification_sent.is.null`);

      if (error) {
        throw error;
      }

      if (!docs || docs.length === 0) {
        return result;
      }

      for (const doc of docs) {
        try {
          const policy = doc.retention_policies;
          if (!policy || !policy.notify_before_delete) {
            continue;
          }

          const expiresAt = new Date(doc.expires_at);
          const notifyDate = new Date(expiresAt.getTime() - (policy.notify_days_before * 24 * 60 * 60 * 1000));

          if (new Date() >= notifyDate) {
            await this.sendRetentionNotification(doc);

            // Mark notification as sent
            await this.supabase
              .from('document_retention')
              .update({ notification_sent: true })
              .eq('id', doc.id);

            result.sent++;
          }

        } catch (error) {
          const errorMsg = `Error sending notification for document ${doc.document_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
        }
      }

    } catch (error) {
      result.errors.push(`Error sending retention notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Gets retention statistics
   */
  async getRetentionStats(): Promise<RetentionStats> {
    try {
      const { data: docs, error } = await this.supabase
        .from('document_retention')
        .select('classification, status, expires_at');

      if (error) {
        throw error;
      }

      const stats: RetentionStats = {
        totalDocuments: docs?.length || 0,
        pendingDeletion: 0,
        expiredDocuments: 0,
        archivedDocuments: 0,
        byClassification: {
          [DocumentClassification.PUBLIC]: 0,
          [DocumentClassification.INTERNAL]: 0,
          [DocumentClassification.CONFIDENTIAL]: 0,
          [DocumentClassification.RESTRICTED]: 0
        }
      };

      if (docs) {
        const now = new Date();
        for (const doc of docs) {
          stats.byClassification[doc.classification as DocumentClassification]++;

          if (doc.status === 'pending_deletion') {
            stats.pendingDeletion++;
          } else if (doc.status === 'archived') {
            stats.archivedDocuments++;
          } else if (new Date(doc.expires_at) <= now) {
            stats.expiredDocuments++;
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting retention stats:', error);
      return {
        totalDocuments: 0,
        pendingDeletion: 0,
        expiredDocuments: 0,
        archivedDocuments: 0,
        byClassification: {
          [DocumentClassification.PUBLIC]: 0,
          [DocumentClassification.INTERNAL]: 0,
          [DocumentClassification.CONFIDENTIAL]: 0,
          [DocumentClassification.RESTRICTED]: 0
        }
      };
    }
  }

  /**
   * Manually deletes a document before expiration
   */
  async manuallyDeleteDocument(
    documentId: string,
    userId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { data: retention, error } = await this.supabase
        .from('document_retention')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error || !retention) {
        return false;
      }

      // Check if user owns the document or has admin rights
      if (retention.user_id !== userId) {
        // Could add admin check here
        return false;
      }

      await this.deleteDocument(retention);

      // Audit log
      const auditContext: AuditContext = {
        userId,
        documentId,
        documentClassification: retention.classification as DocumentClassification
      };

      await auditLog(
        AuditAction.DOCUMENT_DELETE,
        auditContext,
        {
          deletion_type: 'manual',
          reason,
          original_expires_at: retention.expires_at
        }
      );

      return true;
    } catch (error) {
      console.error('Error manually deleting document:', error);
      return false;
    }
  }

  private async createOrUpdatePolicy(
    policyData: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RetentionPolicy | null> {
    try {
      const { data: existingPolicy } = await this.supabase
        .from('retention_policies')
        .select('*')
        .eq('classification', policyData.classification)
        .single();

      if (existingPolicy) {
        // Update existing policy
        const { data, error } = await this.supabase
          .from('retention_policies')
          .update({
            ...policyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPolicy.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new policy
        const { data, error } = await this.supabase
          .from('retention_policies')
          .insert({
            ...policyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error creating/updating retention policy:', error);
      return null;
    }
  }

  private async getPolicyForClassification(classification: DocumentClassification): Promise<RetentionPolicy | null> {
    try {
      const { data, error } = await this.supabase
        .from('retention_policies')
        .select('*')
        .eq('classification', classification)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting retention policy:', error);
      return null;
    }
  }

  private async getPolicy(policyId: string): Promise<RetentionPolicy | null> {
    try {
      const { data, error } = await this.supabase
        .from('retention_policies')
        .select('*')
        .eq('id', policyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting retention policy:', error);
      return null;
    }
  }

  private async archiveDocument(retention: DocumentRetention): Promise<void> {
    // Update status to archived
    await this.supabase
      .from('document_retention')
      .update({
        status: 'archived',
        metadata: {
          ...retention.metadata,
          archived_at: new Date().toISOString()
        }
      })
      .eq('id', retention.id);

    // Archive document data (move to archive table or external storage)
    // This is a placeholder - implement based on your archival strategy
  }

  private async deleteDocument(retention: DocumentRetention): Promise<void> {
    try {
      // Delete from main documents table
      await this.supabase
        .from('demo_requests')
        .delete()
        .eq('id', retention.document_id);

      // Clean up any associated screenshots
      const screenshotManager = getSecureScreenshotManager();
      await screenshotManager.cleanupExpiredScreenshots();

      // Update retention status
      await this.supabase
        .from('document_retention')
        .update({
          status: 'deleted',
          metadata: {
            ...retention.metadata,
            deleted_at: new Date().toISOString()
          }
        })
        .eq('id', retention.id);

    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  private async markForManualDeletion(retention: DocumentRetention): Promise<void> {
    await this.supabase
      .from('document_retention')
      .update({
        status: 'pending_deletion',
        metadata: {
          ...retention.metadata,
          marked_for_deletion_at: new Date().toISOString()
        }
      })
      .eq('id', retention.id);
  }

  private async sendRetentionNotification(retention: DocumentRetention): Promise<void> {
    // Implement notification logic (email, in-app notification, etc.)
    // This is a placeholder - integrate with your notification system
    console.log(`Retention notification for document ${retention.document_id} (expires: ${retention.expires_at})`);
  }
}

// Singleton instance
let retentionManagerInstance: RetentionPolicyManager | null = null;

export const getRetentionManager = (): RetentionPolicyManager => {
  if (!retentionManagerInstance) {
    retentionManagerInstance = new RetentionPolicyManager();
  }
  return retentionManagerInstance;
};

// Convenience functions
export const scheduleDocumentRetention = (
  documentId: string,
  userId: string,
  fileName: string,
  classification: DocumentClassification,
  customRetentionDays?: number
): Promise<string | null> => {
  return getRetentionManager().scheduleDocumentRetention(
    documentId,
    userId,
    fileName,
    classification,
    customRetentionDays
  );
};