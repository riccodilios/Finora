/**
 * TEST ENCRYPTION - Quick test function for encryption/decryption
 * 
 * Run this in Convex dashboard to verify encryption is working:
 * 1. Go to Convex Dashboard → Functions
 * 2. Find "testEncryption" function
 * 3. Click "Run Function"
 * 
 * Or via CLI:
 * npx convex run testEncryption
 */

import { query } from "./_generated/server";
import { encryptFinancialValue, decryptFinancialValue } from "./lib/encryption";

export const testEncryption = query({
  args: {},
  handler: async () => {
    try {
      // Test 1: Basic encryption/decryption
      const testValue = 5000.50;
      const encrypted = await encryptFinancialValue(testValue);
      
      if (!encrypted) {
        return {
          success: false,
          message: "Encryption returned null",
        };
      }
      
      const decrypted = await decryptFinancialValue(encrypted);
      
      // Test 2: Test with different values
      const testCases = [
        0,
        100,
        1000.99,
        1000000,
        -500, // Negative value (debt)
      ];
      
      const results = await Promise.all(
        testCases.map(async (value) => {
          const enc = await encryptFinancialValue(value);
          const dec = await decryptFinancialValue(enc);
          return {
            original: value,
            encrypted: enc?.substring(0, 30) + "...", // Show first 30 chars
            decrypted: dec,
            match: dec === value,
          };
        })
      );
      
      // Test 3: Test null/undefined handling
      const nullEncrypted = await encryptFinancialValue(null);
      const undefinedEncrypted = await encryptFinancialValue(undefined);
      
      return {
        success: true,
        message: "Encryption/Decryption test completed",
        basicTest: {
          original: testValue,
          encrypted: encrypted.substring(0, 30) + "...",
          decrypted: decrypted,
          match: decrypted === testValue,
        },
        multipleValues: results,
        nullHandling: {
          nullInput: nullEncrypted,
          undefinedInput: undefinedEncrypted,
        },
        encryptionKeySet: process.env.FINANCIAL_DATA_ENCRYPTION_KEY ? "Yes" : "No",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Encryption test failed",
        error: error.message,
        stack: error.stack,
        encryptionKeySet: process.env.FINANCIAL_DATA_ENCRYPTION_KEY ? "Yes" : "No",
      };
    }
  },
});
