/**
 * ENCRYPTION - Financial data encryption utilities
 * 
 * Uses AES-256-GCM for authenticated encryption
 * Encrypts sensitive financial fields before database storage
 * 
 * NOTE: Uses Web Crypto API (available in Convex runtime)
 * Convex mutations/queries run in V8 isolate, not Node.js
 */

// Encryption algorithm
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // 128 bits

/**
 * Get encryption key from environment
 * In production, this should be stored in Convex environment variables
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyHex = process.env.FINANCIAL_DATA_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("FINANCIAL_DATA_ENCRYPTION_KEY environment variable is not set");
  }
  
  // Key should be 64 hex characters (32 bytes = 256 bits)
  if (keyHex.length !== 64) {
    throw new Error("FINANCIAL_DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  
  // Convert hex string to ArrayBuffer
  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Import key for Web Crypto API
  return await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer,
    { name: ALGORITHM },
    false, // not extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt a number (financial value)
 * Returns base64-encoded string: iv:encrypted:tag
 */
export async function encryptFinancialValue(value: number | null | undefined): Promise<string | null> {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    const key = await getEncryptionKey();
    
    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Convert number to string for encryption
    const plaintext = new TextEncoder().encode(value.toString());
    
    // Encrypt using Web Crypto API
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      plaintext
    );
    
    // Extract tag (last 16 bytes in GCM mode)
    const encryptedArray = new Uint8Array(encrypted);
    const tag = encryptedArray.slice(-16);
    const ciphertext = encryptedArray.slice(0, -16);
    
    // Combine: iv:ciphertext:tag (all base64)
    const combined = new Uint8Array(iv.length + ciphertext.length + tag.length);
    combined.set(iv, 0);
    combined.set(ciphertext, iv.length);
    combined.set(tag, iv.length + ciphertext.length);
    
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error("[ENCRYPTION ERROR] Failed to encrypt financial value:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypt a number (financial value)
 * Input: base64-encoded string: iv:encrypted:tag
 */
export async function decryptFinancialValue(encrypted: string | null | undefined): Promise<number | null> {
  if (!encrypted || encrypted === null || encrypted === undefined) {
    return null;
  }

  try {
    const key = await getEncryptionKey();
    
    // Decode base64
    const combined = new Uint8Array(base64ToArrayBuffer(encrypted));
    
    // Extract components
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(-16);
    const ciphertext = combined.slice(IV_LENGTH, -16);
    
    // Reconstruct encrypted data with tag
    const encryptedWithTag = new Uint8Array(ciphertext.length + tag.length);
    encryptedWithTag.set(ciphertext, 0);
    encryptedWithTag.set(tag, ciphertext.length);
    
    // Decrypt using Web Crypto API
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      encryptedWithTag.buffer
    );
    
    // Convert back to number
    const plaintext = new TextDecoder().decode(decrypted);
    const value = parseFloat(plaintext);
    
    if (isNaN(value)) {
      throw new Error("Decrypted value is not a valid number");
    }
    
    return value;
  } catch (error) {
    console.error("[DECRYPTION ERROR] Failed to decrypt financial value:", error);
    throw new Error("Decryption failed - data may be corrupted or key invalid");
  }
}

/**
 * Encrypt an object's financial fields
 */
export async function encryptFinancialObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: string[]
): Promise<T> {
  const encrypted = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field] !== undefined && encrypted[field] !== null) {
      // Store as encrypted string
      (encrypted as any)[field] = await encryptFinancialValue(encrypted[field]);
    }
  }
  
  return encrypted;
}

/**
 * Decrypt an object's financial fields
 */
export async function decryptFinancialObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: string[]
): Promise<T> {
  const decrypted = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field] !== undefined && decrypted[field] !== null) {
      // Decrypt from string
      (decrypted as any)[field] = await decryptFinancialValue(decrypted[field]);
    }
  }
  
  return decrypted;
}
