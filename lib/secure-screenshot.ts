import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import { encryptDocument, decryptDocument, type EncryptionResult } from './encryption';
import { auditLog, AuditAction, type AuditContext } from './audit-logger';
import { DocumentClassification } from './document-classification';

export interface SecureScreenshotOptions {
  pdfBuffer: Buffer;
  pageNumber: number;
  fileName: string;
  issueIndex: number;
  userId: string;
  documentClassification?: DocumentClassification;
  retentionHours?: number;
}

export interface SecureScreenshotMetadata {
  id: string;
  fileName: string;
  pageNumber: number;
  issueIndex: number;
  createdAt: string;
  expiresAt: string;
  classification: DocumentClassification;
  userId: string;
  checksum: string;
}

export interface EncryptedScreenshot {
  metadata: SecureScreenshotMetadata;
  encryption: EncryptionResult;
}

export class SecureScreenshotManager {
  private secureDir: string;
  private metadataFile: string;

  constructor() {
    this.secureDir = path.join(process.cwd(), 'secure-temp');
    this.metadataFile = path.join(this.secureDir, 'screenshot-metadata.json');
    this.ensureSecureDirectoryExists();
  }

  /**
   * Generates and securely stores a screenshot
   */
  async generateSecureScreenshot(options: SecureScreenshotOptions): Promise<string | null> {
    const {
      pdfBuffer,
      pageNumber,
      fileName,
      issueIndex,
      userId,
      documentClassification = DocumentClassification.INTERNAL,
      retentionHours = 24
    } = options;

    try {
      // Generate screenshot
      const imageBuffer = await this.generateScreenshotBuffer(pdfBuffer, pageNumber);
      if (!imageBuffer) {
        return null;
      }

      // Create metadata
      const screenshotId = this.generateScreenshotId(fileName, pageNumber, issueIndex);
      const expiresAt = new Date(Date.now() + (retentionHours * 60 * 60 * 1000));
      const checksum = this.generateChecksum(imageBuffer);

      const metadata: SecureScreenshotMetadata = {
        id: screenshotId,
        fileName,
        pageNumber,
        issueIndex,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        classification: documentClassification,
        userId,
        checksum
      };

      // Encrypt screenshot
      const encryption = encryptDocument(imageBuffer);

      // Store encrypted screenshot
      const encryptedScreenshot: EncryptedScreenshot = {
        metadata,
        encryption
      };

      await this.storeEncryptedScreenshot(screenshotId, encryptedScreenshot);
      await this.updateMetadataIndex(metadata);

      // Audit log
      const auditContext: AuditContext = {
        userId,
        documentClassification
      };

      await auditLog(
        AuditAction.SCREENSHOT_GENERATION,
        auditContext,
        {
          screenshot_id: screenshotId,
          page_number: pageNumber,
          file_name: fileName,
          retention_hours: retentionHours,
          image_size: imageBuffer.length
        }
      );

      // Return secure URL
      return `/api/secure-screenshot/${screenshotId}`;

    } catch (error) {
      console.error('Error generating secure screenshot:', error);

      // Audit log the failure
      const auditContext: AuditContext = {
        userId,
        documentClassification
      };

      await auditLog(
        AuditAction.SCREENSHOT_GENERATION,
        auditContext,
        {
          page_number: pageNumber,
          file_name: fileName,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        false,
        error instanceof Error ? error.message : 'Screenshot generation failed'
      );

      return null;
    }
  }

  /**
   * Retrieves and decrypts a screenshot
   */
  async getSecureScreenshot(
    screenshotId: string,
    userId: string
  ): Promise<{ buffer: Buffer; metadata: SecureScreenshotMetadata } | null> {
    try {
      const encryptedScreenshot = await this.loadEncryptedScreenshot(screenshotId);
      if (!encryptedScreenshot) {
        return null;
      }

      // Check expiration
      if (new Date() > new Date(encryptedScreenshot.metadata.expiresAt)) {
        await this.deleteExpiredScreenshot(screenshotId);
        return null;
      }

      // Check user access (basic check - owner only)
      if (encryptedScreenshot.metadata.userId !== userId) {
        // Audit log unauthorized access attempt
        const auditContext: AuditContext = {
          userId,
          documentClassification: encryptedScreenshot.metadata.classification
        };

        await auditLog(
          AuditAction.ACCESS_DENIED,
          auditContext,
          {
            screenshot_id: screenshotId,
            owner_user_id: encryptedScreenshot.metadata.userId,
            attempted_by: userId
          },
          false,
          'Unauthorized screenshot access attempt'
        );

        return null;
      }

      // Decrypt screenshot
      const buffer = decryptDocument(encryptedScreenshot.encryption);

      // Verify integrity
      const checksum = this.generateChecksum(buffer);
      if (checksum !== encryptedScreenshot.metadata.checksum) {
        throw new Error('Screenshot integrity check failed');
      }

      // Audit log successful access
      const auditContext: AuditContext = {
        userId,
        documentClassification: encryptedScreenshot.metadata.classification
      };

      await auditLog(
        AuditAction.DOCUMENT_ACCESS,
        auditContext,
        {
          screenshot_id: screenshotId,
          access_type: 'screenshot_retrieval'
        }
      );

      return {
        buffer,
        metadata: encryptedScreenshot.metadata
      };

    } catch (error) {
      console.error('Error retrieving secure screenshot:', error);
      return null;
    }
  }

  /**
   * Generates screenshots for multiple issues
   */
  async generateSecureScreenshots(
    pdfBuffer: Buffer,
    fileName: string,
    issues: Array<{ page: number }>,
    userId: string,
    documentClassification?: DocumentClassification
  ): Promise<Array<string | null>> {
    const screenshots: Array<string | null> = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const screenshotUrl = await this.generateSecureScreenshot({
        pdfBuffer,
        pageNumber: issue.page,
        fileName,
        issueIndex: i,
        userId,
        documentClassification
      });

      screenshots.push(screenshotUrl);
    }

    return screenshots;
  }

  /**
   * Cleans up expired screenshots
   */
  async cleanupExpiredScreenshots(): Promise<number> {
    try {
      const metadata = await this.loadMetadataIndex();
      const now = new Date();
      let cleanedCount = 0;

      for (const screenshotMetadata of metadata) {
        if (now > new Date(screenshotMetadata.expiresAt)) {
          await this.deleteExpiredScreenshot(screenshotMetadata.id);
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired screenshots:', error);
      return 0;
    }
  }

  /**
   * Deletes a specific screenshot
   */
  async deleteScreenshot(screenshotId: string, userId: string): Promise<boolean> {
    try {
      const encryptedScreenshot = await this.loadEncryptedScreenshot(screenshotId);
      if (!encryptedScreenshot) {
        return false;
      }

      // Check ownership
      if (encryptedScreenshot.metadata.userId !== userId) {
        return false;
      }

      await this.deleteExpiredScreenshot(screenshotId);

      // Audit log
      const auditContext: AuditContext = {
        userId,
        documentClassification: encryptedScreenshot.metadata.classification
      };

      await auditLog(
        AuditAction.DOCUMENT_DELETE,
        auditContext,
        {
          screenshot_id: screenshotId,
          deletion_type: 'manual'
        }
      );

      return true;
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      return false;
    }
  }

  private async generateScreenshotBuffer(pdfBuffer: Buffer, pageNumber: number): Promise<Buffer | null> {
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

      // Load PDF document
      const pdfDocument = await pdfjs.getDocument({
        data: pdfBuffer,
        useSystemFonts: true
      }).promise;

      if (pageNumber > pdfDocument.numPages) {
        throw new Error(`Page ${pageNumber} does not exist in PDF`);
      }

      // Get the specific page
      const page = await pdfDocument.getPage(pageNumber);

      // Set up rendering context
      const scale = 2.0; // Higher scale for better quality
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // Render page to canvas
      const renderContext = {
        canvasContext: context as any,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to buffer
      return canvas.toBuffer('image/jpeg', { quality: 0.9 });

    } catch (error) {
      console.error('Error generating screenshot buffer:', error);
      return null;
    }
  }

  private generateScreenshotId(fileName: string, pageNumber: number, issueIndex: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `screenshot_${timestamp}_${fileName}_p${pageNumber}_i${issueIndex}_${random}`;
  }

  private generateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private ensureSecureDirectoryExists(): void {
    if (!fs.existsSync(this.secureDir)) {
      fs.mkdirSync(this.secureDir, { recursive: true, mode: 0o700 });
    }
  }

  private async storeEncryptedScreenshot(id: string, encryptedScreenshot: EncryptedScreenshot): Promise<void> {
    const filePath = path.join(this.secureDir, `${id}.enc`);
    const data = JSON.stringify(encryptedScreenshot);
    fs.writeFileSync(filePath, data, { mode: 0o600 });
  }

  private async loadEncryptedScreenshot(id: string): Promise<EncryptedScreenshot | null> {
    try {
      const filePath = path.join(this.secureDir, `${id}.enc`);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading encrypted screenshot:', error);
      return null;
    }
  }

  private async updateMetadataIndex(metadata: SecureScreenshotMetadata): Promise<void> {
    try {
      const existingMetadata = await this.loadMetadataIndex();
      existingMetadata.push(metadata);

      // Keep only non-expired entries
      const now = new Date();
      const validMetadata = existingMetadata.filter(m => now < new Date(m.expiresAt));

      fs.writeFileSync(this.metadataFile, JSON.stringify(validMetadata, null, 2), { mode: 0o600 });
    } catch (error) {
      console.error('Error updating metadata index:', error);
    }
  }

  private async loadMetadataIndex(): Promise<SecureScreenshotMetadata[]> {
    try {
      if (!fs.existsSync(this.metadataFile)) {
        return [];
      }

      const data = fs.readFileSync(this.metadataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading metadata index:', error);
      return [];
    }
  }

  private async deleteExpiredScreenshot(id: string): Promise<void> {
    try {
      // Delete encrypted file
      const filePath = path.join(this.secureDir, `${id}.enc`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Update metadata index
      const metadata = await this.loadMetadataIndex();
      const filteredMetadata = metadata.filter(m => m.id !== id);
      fs.writeFileSync(this.metadataFile, JSON.stringify(filteredMetadata, null, 2), { mode: 0o600 });
    } catch (error) {
      console.error('Error deleting expired screenshot:', error);
    }
  }
}

// Singleton instance
let screenshotManagerInstance: SecureScreenshotManager | null = null;

export const getSecureScreenshotManager = (): SecureScreenshotManager => {
  if (!screenshotManagerInstance) {
    screenshotManagerInstance = new SecureScreenshotManager();
  }
  return screenshotManagerInstance;
};

// Convenience functions
export const generateSecureScreenshot = (options: SecureScreenshotOptions): Promise<string | null> => {
  return getSecureScreenshotManager().generateSecureScreenshot(options);
};

export const getSecureScreenshot = (screenshotId: string, userId: string) => {
  return getSecureScreenshotManager().getSecureScreenshot(screenshotId, userId);
};