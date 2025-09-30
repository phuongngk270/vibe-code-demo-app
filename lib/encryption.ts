import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  authTag: string;
}

export interface EncryptionConfig {
  key: string;
  algorithm?: string;
}

class DocumentEncryption {
  private key: Buffer;
  private algorithm: string;

  constructor(config: EncryptionConfig) {
    this.algorithm = config.algorithm || ALGORITHM;
    // Ensure key is 32 bytes for AES-256
    this.key = crypto.scryptSync(config.key, 'salt', 32);
  }

  /**
   * Encrypts a buffer using AES-256-GCM
   */
  encrypt(buffer: Buffer): EncryptionResult {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('document-encryption', 'utf8'));

    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypts data using AES-256-GCM
   */
  decrypt(encryptionResult: EncryptionResult): Buffer {
    const { encrypted, iv, authTag } = encryptionResult;

    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('document-encryption', 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  /**
   * Encrypts a string
   */
  encryptString(text: string): EncryptionResult {
    return this.encrypt(Buffer.from(text, 'utf8'));
  }

  /**
   * Decrypts to string
   */
  decryptToString(encryptionResult: EncryptionResult): string {
    return this.decrypt(encryptionResult).toString('utf8');
  }

  /**
   * Generates a secure random key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Singleton instance
let encryptionInstance: DocumentEncryption | null = null;

export const getEncryption = (): DocumentEncryption => {
  if (!encryptionInstance) {
    const key = process.env.DOCUMENT_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('DOCUMENT_ENCRYPTION_KEY environment variable not set');
    }
    encryptionInstance = new DocumentEncryption({ key });
  }
  return encryptionInstance;
};

// Convenience functions
export const encryptDocument = (buffer: Buffer): EncryptionResult => {
  return getEncryption().encrypt(buffer);
};

export const decryptDocument = (encryptionResult: EncryptionResult): Buffer => {
  return getEncryption().decrypt(encryptionResult);
};

export const encryptString = (text: string): EncryptionResult => {
  return getEncryption().encryptString(text);
};

export const decryptString = (encryptionResult: EncryptionResult): string => {
  return getEncryption().decryptToString(encryptionResult);
};