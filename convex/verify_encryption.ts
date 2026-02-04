/**
 * VERIFY ENCRYPTION - Check if encryption is working in your database
 * 
 * This function checks your actual user profiles to verify:
 * 1. Financial fields are encrypted (strings, not numbers)
 * 2. Decryption works correctly
 * 3. Encryption coverage (how many fields are encrypted)
 * 
 * Run: npx convex run verify_encryption
 */

import { query } from "./_generated/server";
import { decryptFinancialValue } from "./lib/encryption";

export const verifyEncryption = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("userProfiles").take(20);
    
    if (profiles.length === 0) {
      return {
        message: "No user profiles found in database",
        totalProfiles: 0,
      };
    }
    
    const results = {
      totalProfiles: profiles.length,
      encryptedFields: 0,
      unencryptedFields: 0,
      nullFields: 0,
      decryptionTests: [] as any[],
      profiles: [] as any[],
    };
    
    for (const profile of profiles) {
      const profileResult: any = {
        clerkUserId: profile.clerkUserId,
        fields: {} as any,
      };
      
      const financialFields = [
        "monthlyIncome",
        "monthlyExpenses", 
        "netWorth",
        "emergencyFundGoal",
        "emergencyFundCurrent",
      ];
      
      for (const field of financialFields) {
        const value = (profile as any)[field];
        
        if (value === null || value === undefined) {
          results.nullFields++;
          profileResult.fields[field] = {
            status: "null",
            value: null,
          };
          continue;
        }
        
        if (typeof value === "string") {
          // Encrypted value
          results.encryptedFields++;
          profileResult.fields[field] = {
            status: "encrypted",
            encryptedPreview: value.substring(0, 30) + "...",
            length: value.length,
          };
          
          // Test decryption
          try {
            const decrypted = await decryptFinancialValue(value);
            profileResult.fields[field].decrypted = decrypted;
            profileResult.fields[field].decryptionSuccess = true;
            
            results.decryptionTests.push({
              field,
              clerkUserId: profile.clerkUserId,
              success: true,
              decrypted,
            });
          } catch (error) {
            profileResult.fields[field].decryptionSuccess = false;
            profileResult.fields[field].decryptionError = (error as Error).message;
            
            results.decryptionTests.push({
              field,
              clerkUserId: profile.clerkUserId,
              success: false,
              error: (error as Error).message,
            });
          }
        } else if (typeof value === "number") {
          // Unencrypted (legacy data)
          results.unencryptedFields++;
          profileResult.fields[field] = {
            status: "unencrypted",
            value: value,
            warning: "This field is not encrypted! Consider migrating to encrypted format.",
          };
        } else {
          profileResult.fields[field] = {
            status: "unknown",
            type: typeof value,
            value: value,
          };
        }
      }
      
      results.profiles.push(profileResult);
    }
    
    const totalFields = results.encryptedFields + results.unencryptedFields;
    const encryptionRate = totalFields > 0 
      ? (results.encryptedFields / totalFields) * 100 
      : 0;
    
    const allDecryptionsSuccessful = results.decryptionTests.length > 0 &&
      results.decryptionTests.every(t => t.success);
    
    return {
      summary: {
        totalProfiles: results.totalProfiles,
        encryptedFields: results.encryptedFields,
        unencryptedFields: results.unencryptedFields,
        nullFields: results.nullFields,
        encryptionRate: `${encryptionRate.toFixed(1)}%`,
        allDecryptionsSuccessful,
        encryptionKeySet: process.env.FINANCIAL_DATA_ENCRYPTION_KEY ? "Yes" : "No",
      },
      details: {
        decryptionTests: results.decryptionTests,
        profiles: results.profiles,
      },
      recommendations: [
        ...(results.unencryptedFields > 0 
          ? [`⚠️ Found ${results.unencryptedFields} unencrypted fields. Consider migrating legacy data.`]
          : []),
        ...(encryptionRate < 100 && totalFields > 0
          ? [`⚠️ Encryption rate is ${encryptionRate.toFixed(1)}%. Some fields are not encrypted.`]
          : []),
        ...(!allDecryptionsSuccessful
          ? [`❌ Some decryptions failed. Check encryption key and data integrity.`]
          : []),
        ...(allDecryptionsSuccessful && encryptionRate === 100
          ? [`✅ All fields are encrypted and decryption works correctly!`]
          : []),
      ],
    };
  },
});
