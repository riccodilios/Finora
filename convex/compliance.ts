/**
 * GDPR COMPLIANCE FUNCTIONS
 * 
 * Consent management, data export, and account deletion
 */

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import {
  getConsentFlags,
  hasOnboardingConsent,
  hasAIConsent as hasAIConsentLib,
  updateConsentFlags,
  withdrawAllConsent,
} from "./lib/consent";
import {
  logDataAccess,
  logConsentChange,
  logDataDeletion,
  logAIAnalysis,
  createAuditLog,
} from "./lib/audit";
import { decryptFinancialValue } from "./lib/encryption";
import { safeLog, safeError } from "./lib/log_masking";

// ===== CONSENT MANAGEMENT =====

/**
 * Get user's consent flags
 */
export const getConsent = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await getConsentFlags(ctx, args.clerkUserId);
  },
});

/**
 * Check if user has onboarding consent
 */
export const hasOnboardingDataConsent = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await hasOnboardingConsent(ctx, args.clerkUserId);
  },
});

/**
 * Check if user has AI analysis consent
 */
export const hasAIConsent = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await hasAIConsentLib(ctx, args.clerkUserId);
  },
});

/**
 * Update consent flags
 */
export const updateConsent = mutation({
  args: {
    clerkUserId: v.string(),
    onboardingDataConsent: v.optional(v.boolean()),
    aiAnalysisConsent: v.optional(v.boolean()),
    marketingConsent: v.optional(v.boolean()),
    consentVersion: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await getConsentFlags(ctx, args.clerkUserId);
    
    // Determine action type
    let actionType: "consent_given" | "consent_withdrawn" | "consent_updated" = "consent_updated";
    
    if (existing) {
      // Check if this is a withdrawal
      if (
        (args.onboardingDataConsent === false && existing.onboardingDataConsent) ||
        (args.aiAnalysisConsent === false && existing.aiAnalysisConsent)
      ) {
        actionType = "consent_withdrawn";
      } else if (
        (args.onboardingDataConsent === true && !existing.onboardingDataConsent) ||
        (args.aiAnalysisConsent === true && !existing.aiAnalysisConsent)
      ) {
        actionType = "consent_given";
      }
    } else {
      // First time consent
      if (args.onboardingDataConsent === true || args.aiAnalysisConsent === true) {
        actionType = "consent_given";
      }
    }
    
    // Update consent
    await updateConsentFlags(
      ctx,
      args.clerkUserId,
      {
        onboardingDataConsent: args.onboardingDataConsent,
        aiAnalysisConsent: args.aiAnalysisConsent,
        marketingConsent: args.marketingConsent,
      },
      args.consentVersion || "1.0.0",
      args.ipAddress,
      args.userAgent
    );
    
    // Log consent change
    if (args.onboardingDataConsent !== undefined) {
      await logConsentChange(
        ctx,
        args.clerkUserId,
        args.clerkUserId,
        actionType,
        "onboardingDataConsent",
        existing?.onboardingDataConsent,
        args.onboardingDataConsent,
        args.ipAddress,
        args.userAgent
      );
    }
    
    if (args.aiAnalysisConsent !== undefined) {
      await logConsentChange(
        ctx,
        args.clerkUserId,
        args.clerkUserId,
        actionType,
        "aiAnalysisConsent",
        existing?.aiAnalysisConsent,
        args.aiAnalysisConsent,
        args.ipAddress,
        args.userAgent
      );
    }
    
    return { success: true };
  },
});

/**
 * Withdraw all consent
 */
export const withdrawConsent = mutation({
  args: {
    clerkUserId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await withdrawAllConsent(ctx, args.clerkUserId, args.ipAddress, args.userAgent);
    
    // Log withdrawal
    await logConsentChange(
      ctx,
      args.clerkUserId,
      args.clerkUserId,
      "consent_withdrawn",
      "all",
      undefined,
      false,
      args.ipAddress,
      args.userAgent
    );
    
    return { success: true };
  },
});

// ===== DATA EXPORT =====

/**
 * Export all user data (GDPR right to data portability)
 */
export const exportUserData = action({
  args: {
    clerkUserId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all user data
    const user = await ctx.runQuery(api.functions.getUser, {
      clerkUserId: args.clerkUserId,
    });
    
    const profile = await ctx.runQuery(api.functions.getUserProfile, {
      clerkUserId: args.clerkUserId,
      requestingUserId: args.clerkUserId,
    });
    
    const preferences = await ctx.runQuery(api.functions.getUserPreferences, {
      clerkUserId: args.clerkUserId,
    });
    
    const subscription = await ctx.runQuery(api.functions.getSubscription, {
      clerkUserId: args.clerkUserId,
    });
    
    const financialHistory = await ctx.runQuery(api.functions.getFinancialHistory, {
      clerkUserId: args.clerkUserId,
    });
    
    const aiInsights = await ctx.runQuery(api.functions.getLatestAIInsights, {
      clerkUserId: args.clerkUserId,
    });
    
    const financialInsights = await ctx.runQuery(api.functions.getLatestFinancialInsights, {
      clerkUserId: args.clerkUserId,
    });
    
    const conversation = await ctx.runQuery(api.functions.getConversation, {
      clerkUserId: args.clerkUserId,
    });
    
    // Decrypt financial data for export
    const exportData: any = {
      user,
      profile: profile ? {
        ...profile,
        // Financial fields are already decrypted by getUserProfile
      } : null,
      preferences,
      subscription,
      financialHistory,
      aiInsights,
      financialInsights,
      conversation,
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
    };
    
    // Log data export
    await ctx.runMutation(api.compliance.logDataExport, {
      clerkUserId: args.clerkUserId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    
    return exportData;
  },
});

/**
 * Log data export (mutation wrapper for audit log)
 */
export const logDataExport = mutation({
  args: {
    clerkUserId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await createAuditLog(ctx, {
      actorId: args.clerkUserId,
      actorType: "user",
      targetUserId: args.clerkUserId,
      action: "data_export",
      details: JSON.stringify({
        exportedAt: new Date().toISOString(),
      }),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
  },
});

/**
 * Log AI analysis usage (mutation wrapper for audit log)
 */
export const logAIAnalysisUsage = mutation({
  args: {
    clerkUserId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await logAIAnalysis(
      ctx,
      args.clerkUserId,
      true, // hasConsent (already checked)
      args.ipAddress,
      args.userAgent
    );
  },
});

// ===== ACCOUNT DELETION =====

/**
 * Soft delete account (marks for deletion, hard delete after 30 days)
 */
export const deleteAccount = mutation({
  args: {
    clerkUserId: v.string(),
    reason: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already deleted
    const existing = await ctx.db
      .query("deletedAccounts")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    
    if (existing) {
      throw new Error("Account is already marked for deletion.");
    }
    
    // Get user email for audit trail
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    
    if (!user) {
      throw new Error("User not found.");
    }
    
    const now = new Date();
    const hardDeleteDate = new Date(now);
    hardDeleteDate.setDate(hardDeleteDate.getDate() + 30); // 30 days grace period
    
    // Create soft delete record
    await ctx.db.insert("deletedAccounts", {
      clerkUserId: args.clerkUserId,
      deletedAt: now.toISOString(),
      scheduledHardDeleteAt: hardDeleteDate.toISOString(),
      reason: args.reason,
      email: user.email,
      createdAt: user.createdAt || now.toISOString(),
    });
    
    // Withdraw all consent
    await withdrawAllConsent(ctx, args.clerkUserId, args.ipAddress, args.userAgent);
    
    // Log soft deletion
    await logDataDeletion(
      ctx,
      args.clerkUserId,
      "user",
      args.clerkUserId,
      "soft",
      args.reason,
      args.ipAddress,
      args.userAgent
    );
    
    return {
      success: true,
      deletedAt: now.toISOString(),
      scheduledHardDeleteAt: hardDeleteDate.toISOString(),
      message: "Account marked for deletion. Data will be permanently deleted in 30 days.",
    };
  },
});

/**
 * Cancel account deletion (restore account)
 */
export const cancelAccountDeletion = mutation({
  args: {
    clerkUserId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deleted = await ctx.db
      .query("deletedAccounts")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    
    if (!deleted) {
      throw new Error("Account is not marked for deletion.");
    }
    
    // Remove soft delete record
    await ctx.db.delete(deleted._id);
    
    // Log cancellation
    await ctx.db.insert("auditLogs", {
      actorId: args.clerkUserId,
      actorType: "user",
      targetUserId: args.clerkUserId,
      action: "data_deletion_soft",
      details: JSON.stringify({ cancelled: true }),
      timestamp: new Date().toISOString(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    
    return { success: true, message: "Account deletion cancelled." };
  },
});

/**
 * Hard delete account (permanent deletion - admin only or after grace period)
 */
export const hardDeleteAccount = mutation({
  args: {
    clerkUserId: v.string(),
    actorId: v.string(), // Admin or system
    reason: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user data before deletion
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    
    if (!user) {
      throw new Error("User not found.");
    }
    
    // Delete all user data
    // Note: In production, you might want to archive instead of hard delete for compliance
    
    // Delete user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (profile) {
      await ctx.db.delete(profile._id);
    }
    
    // Delete financial profile
    const financialProfile = await ctx.db
      .query("financialProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (financialProfile) {
      await ctx.db.delete(financialProfile._id);
    }
    
    // Delete preferences
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (preferences) {
      await ctx.db.delete(preferences._id);
    }
    
    // Delete financial metrics
    const metrics = await ctx.db
      .query("financialMetrics")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();
    for (const metric of metrics) {
      await ctx.db.delete(metric._id);
    }
    
    // Delete subscriptions
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
    
    // Delete AI insights
    const aiInsights = await ctx.db
      .query("aiInsights")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();
    for (const insight of aiInsights) {
      await ctx.db.delete(insight._id);
    }
    
    // Delete financial insights
    const financialInsights = await ctx.db
      .query("financialInsights")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();
    for (const insight of financialInsights) {
      await ctx.db.delete(insight._id);
    }
    
    // Delete conversations
    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (conversation) {
      await ctx.db.delete(conversation._id);
    }
    
    // Delete consent flags
    const consent = await ctx.db
      .query("consentFlags")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (consent) {
      await ctx.db.delete(consent._id);
    }
    
    // Delete user record
    await ctx.db.delete(user._id);
    
    // Remove from deletedAccounts if present
    const deleted = await ctx.db
      .query("deletedAccounts")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    if (deleted) {
      await ctx.db.delete(deleted._id);
    }
    
    // Log hard deletion
    await logDataDeletion(
      ctx,
      args.actorId,
      args.actorId === "system" ? "system" : "admin",
      args.clerkUserId,
      "hard",
      args.reason,
      args.ipAddress,
      args.userAgent
    );
    
    return { success: true, message: "Account permanently deleted." };
  },
});

// ===== AUDIT LOG QUERIES =====

/**
 * Get audit logs for a user (user can see their own logs)
 */
export const getAuditLogs = query({
  args: {
    clerkUserId: v.string(),
    requestingUserId: v.string(), // Must match clerkUserId for users
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Users can only see their own audit logs
    if (args.requestingUserId !== args.clerkUserId) {
      throw new Error("Unauthorized: You can only view your own audit logs.");
    }
    
    const limit = args.limit || 100;
    
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_target_user", (q) => q.eq("targetUserId", args.clerkUserId))
      .order("desc")
      .take(limit);
    
    return logs;
  },
});

/**
 * Get accounts scheduled for hard deletion (admin/system only)
 */
export const getScheduledDeletions = query({
  args: {
    beforeDate: v.optional(v.string()), // ISO date string
  },
  handler: async (ctx, args) => {
    // In production, add admin check here
    const beforeDate = args.beforeDate || new Date().toISOString();
    
    const deletions = await ctx.db
      .query("deletedAccounts")
      .withIndex("by_scheduled_delete", (q) => q.lte("scheduledHardDeleteAt", beforeDate))
      .collect();
    
    return deletions;
  },
});
