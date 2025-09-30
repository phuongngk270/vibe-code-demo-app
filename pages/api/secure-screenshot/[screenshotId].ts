import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@clerk/nextjs/server';
import { getSecureScreenshotManager } from '../../../lib/secure-screenshot';
import { auditLog, AuditAction, type AuditContext } from '../../../lib/audit-logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { screenshotId } = req.query;
    if (!screenshotId || typeof screenshotId !== 'string') {
      return res.status(400).json({ error: 'Invalid screenshot ID' });
    }

    // Get secure screenshot
    const screenshotManager = getSecureScreenshotManager();
    const result = await screenshotManager.getSecureScreenshot(screenshotId, userId);

    if (!result) {
      // Audit log failed access attempt
      const auditContext: AuditContext = {
        req,
        userId
      };

      await auditLog(
        AuditAction.ACCESS_DENIED,
        auditContext,
        {
          screenshot_id: screenshotId,
          reason: 'Screenshot not found or access denied'
        },
        false,
        'Screenshot access denied'
      );

      return res.status(404).json({ error: 'Screenshot not found or access denied' });
    }

    const { buffer, metadata } = result;

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Optional: Add content disposition for download
    res.setHeader('Content-Disposition', `inline; filename="screenshot_${metadata.fileName}_page_${metadata.pageNumber}.jpg"`);

    // Send the image buffer
    res.send(buffer);

  } catch (error) {
    console.error('Error serving secure screenshot:', error);

    // Audit log the error
    const { userId } = await auth();
    if (userId) {
      const auditContext: AuditContext = {
        req,
        userId
      };

      await auditLog(
        AuditAction.DOCUMENT_ACCESS,
        auditContext,
        {
          screenshot_id: req.query.screenshotId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        false,
        'Screenshot access error'
      );
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}