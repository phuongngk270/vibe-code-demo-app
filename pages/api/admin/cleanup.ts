import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@clerk/nextjs/server';
import { getRetentionManager } from '../../../lib/retention-policy';
import { getSecureScreenshotManager } from '../../../lib/secure-screenshot';
import { auditLog, AuditAction, type AuditContext } from '../../../lib/audit-logger';

interface CleanupResult {
  success: boolean;
  summary: {
    documentsProcessed: number;
    documentsDeleted: number;
    documentsArchived: number;
    screenshotsDeleted: number;
    notificationsSent: number;
    errors: string[];
  };
  executedAt: string;
  executionTimeMs: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResult | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Authenticate user (could add admin role check here)
    const { userId } = await auth();
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if this is a cron job or admin request
    const cronSecret = req.headers['x-cron-secret'];
    const isValidCronRequest = cronSecret === process.env.CRON_SECRET;

    if (!isValidCronRequest) {
      // For non-cron requests, you might want to check admin privileges
      // This is a placeholder - implement your admin check logic
      console.log('Manual cleanup request from user:', userId);
    }

    const retentionManager = getRetentionManager();
    const screenshotManager = getSecureScreenshotManager();

    // Process expired documents
    const documentResults = await retentionManager.processExpiredDocuments();

    // Send retention notifications
    const notificationResults = await retentionManager.sendRetentionNotifications();

    // Cleanup expired screenshots
    const screenshotsDeleted = await screenshotManager.cleanupExpiredScreenshots();

    const result: CleanupResult = {
      success: true,
      summary: {
        documentsProcessed: documentResults.processed,
        documentsDeleted: documentResults.deleted,
        documentsArchived: documentResults.archived,
        screenshotsDeleted,
        notificationsSent: notificationResults.sent,
        errors: [...documentResults.errors, ...notificationResults.errors]
      },
      executedAt: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };

    // Audit log the cleanup operation
    const auditContext: AuditContext = {
      req,
      userId: userId || 'system'
    };

    await auditLog(
      AuditAction.RETENTION_POLICY_APPLIED,
      auditContext,
      {
        cleanup_type: isValidCronRequest ? 'automated' : 'manual',
        documents_processed: documentResults.processed,
        documents_deleted: documentResults.deleted,
        screenshots_deleted: screenshotsDeleted,
        execution_time_ms: result.executionTimeMs,
        error_count: result.summary.errors.length
      }
    );

    // Log summary
    console.log('Cleanup completed:', {
      documentsProcessed: documentResults.processed,
      documentsDeleted: documentResults.deleted,
      screenshotsDeleted,
      errors: result.summary.errors.length
    });

    return res.status(200).json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Audit log the failure
    const { userId } = await auth();
    if (userId) {
      const auditContext: AuditContext = {
        req,
        userId
      };

      await auditLog(
        AuditAction.RETENTION_POLICY_APPLIED,
        auditContext,
        {
          cleanup_type: 'failed',
          error: errorMessage
        },
        false,
        errorMessage
      );
    }

    console.error('Cleanup operation failed:', error);

    const result: CleanupResult = {
      success: false,
      summary: {
        documentsProcessed: 0,
        documentsDeleted: 0,
        documentsArchived: 0,
        screenshotsDeleted: 0,
        notificationsSent: 0,
        errors: [errorMessage]
      },
      executedAt: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };

    return res.status(500).json(result);
  }
}