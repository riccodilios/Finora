/**
 * MIGRATE ENCRYPTION - Encrypt existing unencrypted financial data
 * 
 * This function migrates legacy unencrypted financial fields to encrypted format.
 * It finds all profiles with unencrypted numbers and encrypts them.
 * 
 * WARNING: This is a one-time migration. Run it carefully.
 * 
 * Run: npx convex run migrate_encryption:migrateLegacyData
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { encryptFinancialValue } from "./lib/encryption";
import { safeLog, safeError } from "./lib/log_masking";

export const migrateLegacyData = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // Default to true (safe mode)
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun !== false; // Default to true (safe mode)
    
    if (!dryRun) {
      safeLog("MIGRATION STARTING - This will modify database records", {});
    } else {
      safeLog("DRY RUN MODE - No changes will be made", {});
    }
    
    const profiles = await ctx.db.query("userProfiles").collect();
    
    const results = {
      totalProfiles: profiles.length,
      profilesProcessed: 0,
      fieldsEncrypted: 0,
      fieldsSkipped: 0,
      errors: [] as any[],
      details: [] as any[],
    };
    
    for (const profile of profiles) {
      const profileResult: any = {
        clerkUserId: profile.clerkUserId,
        profileId: profile._id,
        fieldsUpdated: [] as string[],
        fieldsSkipped: [] as string[],
        errors: [] as string[],
      };
      
      const financialFields = [
        "monthlyIncome",
        "monthlyExpenses",
        "netWorth",
        "emergencyFundGoal",
        "emergencyFundCurrent",
      ];
      
      const updateData: any = {};
      
      for (const field of financialFields) {
        const value = (profile as any)[field];
        
        // Skip if null/undefined
        if (value === null || value === undefined) {
          profileResult.fieldsSkipped.push(`${field}: null/undefined`);
          results.fieldsSkipped++;
          continue;
        }
        
        // Skip if already encrypted (string)
        if (typeof value === "string") {
          profileResult.fieldsSkipped.push(`${field}: already encrypted`);
          results.fieldsSkipped++;
          continue;
        }
        
        // Encrypt if it's a number (unencrypted legacy data)
        if (typeof value === "number") {
          try {
            const encrypted = await encryptFinancialValue(value);
            
            if (encrypted !== null) {
              updateData[field] = encrypted;
              profileResult.fieldsUpdated.push(field);
              results.fieldsEncrypted++;
            } else {
              profileResult.errors.push(`${field}: encryption returned null`);
              results.errors.push({
                profileId: profile._id,
                field,
                error: "Encryption returned null",
              });
            }
          } catch (error) {
            const errorMsg = (error as Error).message;
            profileResult.errors.push(`${field}: ${errorMsg}`);
            results.errors.push({
              profileId: profile._id,
              field,
              error: errorMsg,
            });
            safeError(`Failed to encrypt ${field} for profile ${profile._id}`, error);
          }
        }
      }
      
      // Update profile if there are fields to encrypt
      if (Object.keys(updateData).length > 0) {
        if (!dryRun) {
          try {
            await ctx.db.patch(profile._id, updateData);
            safeLog("Profile migrated", {
              clerkUserId: profile.clerkUserId,
              fieldsEncrypted: Object.keys(updateData),
            });
          } catch (error) {
            const errorMsg = (error as Error).message;
            profileResult.errors.push(`Database update failed: ${errorMsg}`);
            results.errors.push({
              profileId: profile._id,
              error: `Database update failed: ${errorMsg}`,
            });
            safeError(`Failed to update profile ${profile._id}`, error);
          }
        } else {
          safeLog("Would migrate profile (DRY RUN)", {
            clerkUserId: profile.clerkUserId,
            fieldsToEncrypt: Object.keys(updateData),
            updateData: Object.keys(updateData).reduce((acc, key) => {
              acc[key] = `${updateData[key]?.substring(0, 30)}...`;
              return acc;
            }, {} as any),
          });
        }
        
        results.profilesProcessed++;
        profileResult.wouldUpdate = !dryRun;
      }
      
      if (profileResult.fieldsUpdated.length > 0 || profileResult.errors.length > 0) {
        results.details.push(profileResult);
      }
    }
    
    return {
      dryRun,
      summary: {
        totalProfiles: results.totalProfiles,
        profilesProcessed: results.profilesProcessed,
        fieldsEncrypted: results.fieldsEncrypted,
        fieldsSkipped: results.fieldsSkipped,
        errors: results.errors.length,
      },
      details: results.details,
      nextSteps: dryRun
        ? [
            "✅ Dry run completed. Review the results above.",
            "⚠️ To actually perform the migration, run:",
            "   npx convex run migrate_encryption:migrateLegacyData --arg dryRun=false",
          ]
        : [
            "✅ Migration completed!",
            "✅ Run verify_encryption:verifyEncryption to verify all data is encrypted.",
          ],
    };
  },
});
