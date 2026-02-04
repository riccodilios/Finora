/**
 * LOG_MASKING - Prevents sensitive financial data from appearing in logs
 * 
 * Masks all financial values in log output
 */

import { getFieldClassification, requiresEncryption } from "./data_classification";

/**
 * Mask a financial value for logging
 * Returns masked string (e.g., "***.***" or "[ENCRYPTED]")
 */
export function maskFinancialValue(value: any): string {
  if (value === null || value === undefined) {
    return "[NULL]";
  }
  
  if (typeof value === "number") {
    // Mask numbers (financial values)
    return "[FINANCIAL_VALUE]";
  }
  
  if (typeof value === "string" && value.length > 20) {
    // Likely encrypted data
    return "[ENCRYPTED]";
  }
  
  return "[MASKED]";
}

/**
 * Mask an object's sensitive fields for logging
 */
export function maskSensitiveFields(obj: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return "[MAX_DEPTH]";
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === "number") {
    // All numbers are potentially financial - mask them
    return maskFinancialValue(obj);
  }
  
  if (typeof obj === "string") {
    // Check if it looks like encrypted data (base64, long string)
    if (obj.length > 50 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
      return "[ENCRYPTED]";
    }
    return obj; // Keep non-encrypted strings
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveFields(item, depth + 1));
  }
  
  if (typeof obj === "object") {
    const masked: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if field requires masking
      if (requiresEncryption(key) || getFieldClassification(key) === "financial") {
        masked[key] = maskFinancialValue(value);
      } else if (getFieldClassification(key) === "personal") {
        // Partially mask personal data
        if (key === "email" && typeof value === "string") {
          const [local, domain] = value.split("@");
          masked[key] = `${local.substring(0, 2)}***@${domain}`;
        } else if (key === "clerkUserId") {
          masked[key] = value ? `${String(value).substring(0, 8)}***` : "[NULL]";
        } else {
          masked[key] = "[PERSONAL_DATA]";
        }
      } else {
        // Recursively mask nested objects
        masked[key] = maskSensitiveFields(value, depth + 1);
      }
    }
    return masked;
  }
  
  return obj;
}

/**
 * Safe console.log that masks sensitive data
 */
export function safeLog(message: string, ...args: any[]): void {
  const maskedArgs = args.map(arg => maskSensitiveFields(arg));
  console.log(`[SAFE_LOG] ${message}`, ...maskedArgs);
}

/**
 * Safe console.error that masks sensitive data
 */
export function safeError(message: string, error?: any): void {
  const maskedError = error ? maskSensitiveFields(error) : undefined;
  console.error(`[SAFE_ERROR] ${message}`, maskedError);
}
