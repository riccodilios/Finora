import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { encryptFinancialValue, decryptFinancialValue } from "./lib/encryption";
import { canAccessFinancialData, canViewRawFinancialData } from "./lib/rbac";
import { safeLog, safeError } from "./lib/log_masking";
import { 
  checkInsightCompliance, 
  generateWhyExplanation, 
  addConfidenceLanguage,
  validateInsightIntent 
} from "./lib/ai_compliance";
import {
  getConsentFlags,
  hasOnboardingConsent,
  hasAIConsent,
  updateConsentFlags,
  withdrawAllConsent,
} from "./lib/consent";
import {
  createAuditLog,
  logDataAccess,
  logConsentChange,
  logDataDeletion,
  logAdminAction,
  logAIAnalysis,
} from "./lib/audit";

// ===== USER FUNCTIONS =====
export const createOrUpdateUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (existingUser) {
      // Auto-set main admin user if not already set
      const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
      if (args.clerkUserId === MAIN_ADMIN_USER_ID && existingUser.isAdmin !== true) {
        await ctx.db.patch(existingUser._id, {
          isAdmin: true,
          updatedAt: new Date().toISOString(),
        });
      }
      
      // Update email if changed
      if (existingUser.email !== args.email) {
        await ctx.db.patch(existingUser._id, {
          email: args.email,
          updatedAt: new Date().toISOString(),
        });
      }
      
      // Ensure subscription exists (for backward compatibility)
      const existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
        .first();
      
      if (!existingSubscription) {
        // Create subscription from existing user plan
        const now = new Date().toISOString();
        await ctx.db.insert("subscriptions", {
          clerkUserId: args.clerkUserId,
          plan: existingUser.plan,
          status: existingUser.plan === "pro" ? "active" : "trial",
          billingCycle: "monthly",
          aiChatsUsed: 0,
          createdAt: now,
          updatedAt: now,
          ...(existingUser.plan === "free" ? { trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : {}),
        });
      } else {
        // Ensure users.plan mirrors subscriptions.plan (subscription is source of truth)
        if (existingUser.plan !== existingSubscription.plan) {
          await ctx.db.patch(existingUser._id, {
            plan: existingSubscription.plan,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      
      return existingUser._id;
    }

    // Create new user
    const plan = args.plan || "free";
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const isMainAdmin = args.clerkUserId === MAIN_ADMIN_USER_ID;
    
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      plan,
      isAdmin: isMainAdmin ? true : undefined, // Auto-set main admin user
      createdAt: new Date().toISOString(),
    });

    // Create subscription for new user
    const now = new Date().toISOString();
    await ctx.db.insert("subscriptions", {
      clerkUserId: args.clerkUserId,
      plan,
      status: plan === "pro" ? "active" : "trial",
      billingCycle: "monthly",
      aiChatsUsed: 0,
      createdAt: now,
      updatedAt: now,
      ...(plan === "free" ? { trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : {}),
    });

    return userId;
  },
});

export const getUser = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();
  },
});

// DEPRECATED: Use updateSubscriptionPlan instead. This function is kept for backward compatibility.
// It now updates both subscriptions and users.plan to maintain consistency.
export const updateUserPlan = mutation({
  args: {
    clerkUserId: v.string(),
    newPlan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    const now = new Date().toISOString();

    // Update users.plan
    await ctx.db.patch(user._id, {
      plan: args.newPlan,
      upgradedAt: args.newPlan === "pro" ? now : undefined,
      updatedAt: now,
    });

    // Also update subscriptions.plan (subscription is source of truth)
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        plan: args.newPlan,
        status: args.newPlan === "pro" ? "active" : "trial",
        updatedAt: now,
        ...(args.newPlan === "pro" 
          ? { 
              currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              trialEndsAt: undefined,
            }
          : {
              currentPeriodEndsAt: undefined,
              trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }
        ),
      });
    } else {
      // Create subscription if it doesn't exist
      await ctx.db.insert("subscriptions", {
        clerkUserId: args.clerkUserId,
        plan: args.newPlan,
        status: args.newPlan === "pro" ? "active" : "trial",
        billingCycle: "monthly",
        aiChatsUsed: 0,
        createdAt: now,
        updatedAt: now,
        ...(args.newPlan === "free" ? { trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : {}),
      });
    }

    return { success: true };
  },
});

// ===== SUBSCRIPTION FUNCTIONS =====
export const getSubscription = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

export const createSubscriptionIfMissing = mutation({
  args: {
    clerkUserId: v.string(),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) {
      // Ensure users.plan mirrors subscriptions.plan (subscription is source of truth)
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
        .first();

      if (user && user.plan !== existing.plan) {
        await ctx.db.patch(user._id, {
          plan: existing.plan,
          updatedAt: new Date().toISOString(),
        });
      }

      return existing._id;
    }

    // Get user's current plan from users table for backward compatibility
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const plan = args.plan || user?.plan || "free";
    const now = new Date().toISOString();

    // Create new subscription with defaults
    const subscriptionId = await ctx.db.insert("subscriptions", {
      clerkUserId: args.clerkUserId,
      plan,
      status: plan === "pro" ? "active" : "trial",
      billingCycle: "monthly",
      aiChatsUsed: 0,
      createdAt: now,
      updatedAt: now,
      // Set trial end date if on free plan (30 days from now)
      ...(plan === "free" ? { trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : {}),
    });

    // Ensure users.plan mirrors subscriptions.plan
    if (user && user.plan !== plan) {
      await ctx.db.patch(user._id, {
        plan,
        updatedAt: now,
      });
    }

    return subscriptionId;
  },
});

// TODO: Real payment gateway lifecycle - Intentionally deferred — not part of MVP backend completion.
// Current implementation only handles manual plan updates.
// Future implementation should include:
// - Automatic subscription renewal processing
// - Subscription cancellation with end-of-period handling
// - Payment retry logic for failed renewals
// - Prorated billing for mid-cycle upgrades/downgrades
// - Subscription expiration and grace period management
// - Webhook-driven subscription status updates
// - Subscription pause/resume functionality

export const updateSubscriptionPlan = mutation({
  args: {
    clerkUserId: v.string(),
    newPlan: v.union(v.literal("free"), v.literal("pro")),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!subscription) {
      throw new Error(`Subscription not found for user: ${args.clerkUserId}`);
    }

    const now = new Date().toISOString();
    const updateData: any = {
      plan: args.newPlan,
      updatedAt: now,
    };

    // Update status based on plan
    if (args.newPlan === "pro") {
      updateData.status = "active";
      // Set period end date (30 days from now for monthly, 365 for annual)
      const days = args.billingCycle === "annual" ? 365 : 30;
      updateData.currentPeriodEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      updateData.trialEndsAt = undefined;
    } else {
      updateData.status = "trial";
      updateData.currentPeriodEndsAt = undefined;
      updateData.trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (args.billingCycle) {
      updateData.billingCycle = args.billingCycle;
    }

    await ctx.db.patch(subscription._id, updateData);

    // Also update users.plan for backward compatibility
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        plan: args.newPlan,
        upgradedAt: args.newPlan === "pro" ? now : undefined,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

export const upgradeToPro = mutation({
  args: {
    clerkUserId: v.string(),
    moyasarPaymentId: v.string(),
    amount: v.number(),
    currency: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for existing payment first (idempotency)
    const existingPayment = await ctx.db
      .query("payments")
      .withIndex("by_moyasar_id", (q) =>
        q.eq("moyasarPaymentId", args.moyasarPaymentId)
      )
      .first();

    if (existingPayment) {
      safeLog("Payment already processed", { moyasarPaymentId: args.moyasarPaymentId });
      return { alreadyProcessed: true };
    }

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    // Only upgrade if currently free
    if (user.plan === "pro") {
      safeLog("User already Pro, skipping upgrade", { clerkUserId: args.clerkUserId });
      return user._id;
    }

    // Record payment
    const paymentId = await ctx.db.insert("payments", {
      clerkUserId: args.clerkUserId,
      moyasarPaymentId: args.moyasarPaymentId,
      amount: args.amount,
      currency: args.currency,
      status: "paid",
      timestamp: args.timestamp,
      processedAt: new Date().toISOString(),
    });

    // Update to Pro
    const now = new Date().toISOString();
    await ctx.db.patch(user._id, {
      plan: "pro",
      upgradedAt: now,
      lastPaymentId: args.moyasarPaymentId,
    });

    // Update subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (subscription) {
      // Update existing subscription
      await ctx.db.patch(subscription._id, {
        plan: "pro",
        status: "active",
        billingCycle: "monthly",
        currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        trialEndsAt: undefined,
        updatedAt: now,
      });
    } else {
      // Create subscription if it doesn't exist
      await ctx.db.insert("subscriptions", {
        clerkUserId: args.clerkUserId,
        plan: "pro",
        status: "active",
        billingCycle: "monthly",
        currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        aiChatsUsed: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Log plan change
    await ctx.db.insert("planChanges", {
      clerkUserId: args.clerkUserId,
      fromPlan: "free",
      toPlan: "pro",
      paymentId: args.moyasarPaymentId,
      changedAt: now,
    });

    return user._id;
  },
});

// ===== PAYMENT FUNCTIONS =====
export const recordPayment = mutation({
  args: {
    clerkUserId: v.string(),
    moyasarPaymentId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    // First, check if payment already exists
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_moyasar_id", (q) =>
        q.eq("moyasarPaymentId", args.moyasarPaymentId)
      )
      .first();

    if (existing) {
      safeLog("Payment already recorded", { moyasarPaymentId: args.moyasarPaymentId });
      return existing._id;
    }

    // Record new payment
    const paymentId = await ctx.db.insert("payments", {
      clerkUserId: args.clerkUserId,
      moyasarPaymentId: args.moyasarPaymentId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      timestamp: args.timestamp,
      processedAt: new Date().toISOString(),
    });

    return paymentId;
  },
});

export const getByMoyasarId = query({
  args: { moyasarId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_moyasar_id", (q) =>
        q.eq("moyasarPaymentId", args.moyasarId)
      )
      .first();
  },
});

// ===== PLAN ENFORCEMENT =====
export const requireProPlan = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    // Subscription is the source of truth for plan status
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (!user) {
      return { allowed: false, reason: "user_not_found" };
    }

    // Prefer subscription.plan as source of truth, fallback to users.plan for backward compatibility
    const plan = subscription?.plan || user.plan;

    return {
      allowed: plan === "pro",
      currentPlan: plan,
      user: {
        email: user.email,
        upgradedAt: user.upgradedAt,
      },
    };
  },
});

// ===== METRICS FUNCTIONS =====
export const getTotalRevenue = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();
    const successfulPayments = payments.filter(p => p.status === "paid");
    const total = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
    return { 
      total, 
      count: successfulPayments.length,
      currency: successfulPayments[0]?.currency || "SAR" 
    };
  },
});

export const getActiveProUsers = query({
  args: {},
  handler: async (ctx) => {
    const proUsers = await ctx.db
      .query("users")
      .withIndex("by_plan", (q) => q.eq("plan", "pro"))
      .collect();
    return proUsers.length;
  },
});

export const getMonthlyRecurringRevenue = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const payments = await ctx.db.query("payments").collect();
    const monthlyPayments = payments.filter(p => {
      const paymentDate = new Date(p.timestamp);
      return p.status === "paid" && paymentDate >= oneMonthAgo;
    });
    
    const mrr = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    return { 
      mrr, 
      count: monthlyPayments.length,
      currency: monthlyPayments[0]?.currency || "SAR"
    };
  },
});

// Get payment stats
export const getPaymentStats = query({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db.query("payments").collect();
    
    const byStatus = payments.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: payments.length,
      byStatus,
      latestPayments: payments
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    };
  },
});

// ===== USER PROFILE FUNCTIONS =====
/**
 * Helper: Decrypt financial fields in user profile
 * Only decrypts if user has permission to view raw financial data
 */
async function decryptUserProfile(
  profile: any,
  requestingUserId: string
): Promise<any> {
  if (!profile) return null;
  
  // Check if user can view raw financial data
  const canViewRaw = await canViewRawFinancialData(requestingUserId, profile.clerkUserId);
  
  if (!canViewRaw) {
    // Return profile without decrypting (for admin/support - they see encrypted values)
    safeLog("User does not have permission to view raw financial data", {
      requestingUserId,
      targetUserId: profile.clerkUserId,
    });
    return profile; // Return as-is (encrypted)
  }
  
  // Decrypt financial fields for authorized users
  const decrypted = { ...profile };
  
  // Decrypt financial fields (handle both legacy numbers and encrypted strings)
  const financialFields = ["monthlyIncome", "monthlyExpenses", "netWorth", "emergencyFundGoal", "emergencyFundCurrent"];
  for (const field of financialFields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      if (typeof decrypted[field] === "string") {
        // Encrypted value - decrypt it
        try {
          const decryptedValue = await decryptFinancialValue(decrypted[field]);
          decrypted[field] = decryptedValue;
        } catch (error) {
          safeError(`Failed to decrypt ${field}`, error);
          // If decryption fails, set to null (data may be corrupted)
          decrypted[field] = null;
        }
      }
      // If it's already a number (legacy data), keep it as-is
    }
  }
  
  return decrypted;
}

export const getUserProfile = query({
  args: { 
    clerkUserId: v.string(),
    requestingUserId: v.optional(v.string()), // For RBAC checks
  },
  handler: async (ctx, args) => {
    const requestingUserId = args.requestingUserId || args.clerkUserId;
    
    // SECURITY: Check access permission
    const hasAccess = await canAccessFinancialData(requestingUserId, args.clerkUserId);
    if (!hasAccess) {
      safeError("Unauthorized access attempt to user profile", {
        requestingUserId,
        targetUserId: args.clerkUserId,
      });
      throw new Error("Unauthorized: You do not have permission to access this profile");
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    
    if (!profile) {
      return null;
    }
    
    // GDPR: Log data access (async via scheduler - queries can't insert)
    // Note: We skip audit logging in queries to avoid performance impact
    // Audit logs are created in mutations/actions where data is modified
    // For compliance, we can add a separate action endpoint for explicit audit logging if needed
    
    // SECURITY: Decrypt financial fields only if user has permission
    return await decryptUserProfile(profile, requestingUserId);
  },
});

export const createOrUpdateUserProfile = mutation({
  args: {
    clerkUserId: v.string(),
    riskTolerance: v.optional(v.union(v.literal("conservative"), v.literal("moderate"), v.literal("aggressive"))),
    monthlyIncome: v.optional(v.number()),
    monthlyExpenses: v.optional(v.number()),
    netWorth: v.optional(v.number()),
    emergencyFundGoal: v.optional(v.number()),
    emergencyFundCurrent: v.optional(v.number()),
    expensesByCategory: v.optional(v.string()),
    isOnboarded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    // Calculate profile tags based on financial data
    const profileTags = [];
    if (args.monthlyIncome && args.monthlyExpenses) {
      const savingsRate = ((args.monthlyIncome - args.monthlyExpenses) / args.monthlyIncome) * 100;
      if (savingsRate > 20) profileTags.push("saver");
      if (savingsRate < 10) profileTags.push("spender");
    }
    if (args.netWorth && args.netWorth > 100000) profileTags.push("high-net-worth");
    if (args.monthlyExpenses && args.monthlyIncome && args.monthlyExpenses > args.monthlyIncome * 0.5) {
      profileTags.push("in-debt");
    }

    // Build update data - only include fields that are explicitly passed
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only update fields that are explicitly provided
    if (args.riskTolerance !== undefined) {
      updateData.riskTolerance = args.riskTolerance;
    }
    
    // SECURITY: Encrypt financial fields before storing
    if (args.monthlyIncome !== undefined) {
      updateData.monthlyIncome = await encryptFinancialValue(args.monthlyIncome);
      safeLog("Encrypting monthlyIncome for user", { clerkUserId: args.clerkUserId });
    }
    if (args.monthlyExpenses !== undefined) {
      updateData.monthlyExpenses = await encryptFinancialValue(args.monthlyExpenses);
      safeLog("Encrypting monthlyExpenses for user", { clerkUserId: args.clerkUserId });
    }
    if (args.netWorth !== undefined) {
      updateData.netWorth = await encryptFinancialValue(args.netWorth);
      safeLog("Encrypting netWorth for user", { clerkUserId: args.clerkUserId });
    }
    if (args.emergencyFundGoal !== undefined) {
      updateData.emergencyFundGoal = await encryptFinancialValue(args.emergencyFundGoal);
      safeLog("Encrypting emergencyFundGoal for user", { clerkUserId: args.clerkUserId });
    }
    if (args.emergencyFundCurrent !== undefined) {
      updateData.emergencyFundCurrent = await encryptFinancialValue(args.emergencyFundCurrent);
      safeLog("Encrypting emergencyFundCurrent for user", { clerkUserId: args.clerkUserId });
    }
    if (args.expensesByCategory !== undefined) {
      updateData.expensesByCategory = args.expensesByCategory;
    }
    if (args.isOnboarded !== undefined) {
      updateData.isOnboarded = args.isOnboarded;
    }

    // Always update profileTags if we have financial data
    if (profileTags.length > 0 || (args.monthlyIncome !== undefined || args.monthlyExpenses !== undefined || args.netWorth !== undefined)) {
      updateData.profileTags = profileTags;
    }

    let profileId;
    if (existing) {
      // Update existing profile - only patch fields that were explicitly provided
      await ctx.db.patch(existing._id, updateData);
      profileId = existing._id;
      
      // GDPR: Log profile update (optional - only if audit metadata provided)
      // Note: ipAddress and userAgent are optional in args, so we check if they exist
      const auditMetadata = (args as any).ipAddress || (args as any).userAgent;
      if (auditMetadata) {
        await createAuditLog(ctx, {
          actorId: args.clerkUserId,
          actorType: "user",
          targetUserId: args.clerkUserId,
          action: "profile_updated",
          resourceType: "userProfile",
          resourceId: existing._id,
          ipAddress: (args as any).ipAddress,
          userAgent: (args as any).userAgent,
        });
      }
    } else {
      // Create new profile with defaults
      // SECURITY: Encrypt financial fields before storing
      const encryptedIncome = await encryptFinancialValue(args.monthlyIncome ?? 0);
      const encryptedExpenses = await encryptFinancialValue(args.monthlyExpenses ?? 0);
      const encryptedNetWorth = await encryptFinancialValue(args.netWorth ?? 0);
      const encryptedGoal = await encryptFinancialValue(args.emergencyFundGoal ?? 0);
      const encryptedCurrent = await encryptFinancialValue(args.emergencyFundCurrent ?? 0);
      
      const profileData = {
        clerkUserId: args.clerkUserId,
        riskTolerance: args.riskTolerance || "moderate",
        profileTags,
        financialGoals: [],
        monthlyIncome: encryptedIncome ?? undefined,
        monthlyExpenses: encryptedExpenses ?? undefined,
        netWorth: encryptedNetWorth ?? undefined,
        emergencyFundGoal: encryptedGoal ?? undefined,
        emergencyFundCurrent: encryptedCurrent ?? undefined,
        expensesByCategory: args.expensesByCategory || "{}",
        isOnboarded: args.isOnboarded ?? false,
        updatedAt: new Date().toISOString(),
      };
      safeLog("Creating new user profile with encrypted financial data", { clerkUserId: args.clerkUserId });
      profileId = await ctx.db.insert("userProfiles", profileData);
    }

    // Seed detailed financialProfiles once, using onboarding/basic data,
    // so dashboard graphs and the Edit Financial Data modal have initial values.
    // Only create if a financialProfiles record does NOT already exist.
    const existingFinancialProfile = await ctx.db
      .query("financialProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const hasBasicFinancialData =
      args.monthlyIncome !== undefined ||
      args.monthlyExpenses !== undefined ||
      args.netWorth !== undefined ||
      args.emergencyFundGoal !== undefined ||
      args.emergencyFundCurrent !== undefined;

    if (!existingFinancialProfile && hasBasicFinancialData) {
      const income = typeof args.monthlyIncome === "number" ? args.monthlyIncome : 0;
      const expenses = typeof args.monthlyExpenses === "number" ? args.monthlyExpenses : 0;
      const netWorthValue = typeof args.netWorth === "number" ? args.netWorth : 0;
      const emergencyGoal =
        typeof args.emergencyFundGoal === "number" ? args.emergencyFundGoal : 0;
      const emergencyCurrent =
        typeof args.emergencyFundCurrent === "number" ? args.emergencyFundCurrent : 0;

      const nowIso = new Date().toISOString();

      await ctx.db.insert("financialProfiles", {
        clerkUserId: args.clerkUserId,
        incomeSources: income
          ? [
              {
                id: "onboarding-income",
                name: "Onboarding income",
                amount: income,
                type: "salary",
                isRecurring: true,
              },
            ]
          : [],
        expenses: expenses
          ? [
              {
                id: "onboarding-expenses",
                name: "Onboarding expenses",
                amount: expenses,
                category: "other",
                type: "fixed",
                isRecurring: true,
              },
            ]
          : [],
        debts: [],
        investments: netWorthValue > 0
          ? [
              {
                id: "onboarding-networth",
                name: "Onboarding net worth",
                value: netWorthValue,
                type: "other",
                monthlyContribution: 0,
              },
            ]
          : [],
        savings: {
          emergencyFundCurrent: emergencyCurrent,
          emergencyFundGoal: emergencyGoal,
          otherSavings: 0,
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // Automatically trigger financial insights generation when financial data changes
    // Only trigger if financial fields were updated
    const financialFieldsUpdated = 
      args.monthlyIncome !== undefined ||
      args.monthlyExpenses !== undefined ||
      args.netWorth !== undefined ||
      args.emergencyFundGoal !== undefined ||
      args.emergencyFundCurrent !== undefined;

    if (financialFieldsUpdated) {
      // Schedule it to run after a short delay to avoid blocking the mutation
      await ctx.scheduler.runAfter(0, api.functions.generateAutomaticFinancialInsights, {
        clerkUserId: args.clerkUserId,
      });
    }

    return profileId;
  },
});

// ===== FINANCIAL PROFILE FUNCTIONS =====
export const getOrCreateFinancialProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("financialProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) {
      return existing;
    }

    // Return default structure if not found (client will create on first save)
    return null;
  },
});

export const updateFinancialProfile = mutation({
  args: {
    clerkUserId: v.string(),
    incomeSources: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          amount: v.number(),
          type: v.union(v.literal("salary"), v.literal("freelance"), v.literal("rental"), v.literal("investment"), v.literal("other")),
          isRecurring: v.boolean(),
        })
      )
    ),
    expenses: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          amount: v.number(),
          category: v.union(
            v.literal("housing"),
            v.literal("food"),
            v.literal("transport"),
            v.literal("subscriptions"),
            v.literal("utilities"),
            v.literal("healthcare"),
            v.literal("entertainment"),
            v.literal("other")
          ),
          type: v.union(v.literal("fixed"), v.literal("variable")),
          isRecurring: v.boolean(),
        })
      )
    ),
    debts: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          principal: v.number(),
          monthlyPayment: v.number(),
          interestRate: v.optional(v.number()),
          type: v.union(
            v.literal("credit_card"),
            v.literal("personal_loan"),
            v.literal("student_loan"),
            v.literal("mortgage"),
            v.literal("car_loan"),
            v.literal("other")
          ),
        })
      )
    ),
    investments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          value: v.number(),
          type: v.union(
            v.literal("stocks"),
            v.literal("bonds"),
            v.literal("real_estate"),
            v.literal("crypto"),
            v.literal("mutual_funds"),
            v.literal("other")
          ),
          monthlyContribution: v.optional(v.number()),
        })
      )
    ),
    savings: v.optional(
      v.object({
        emergencyFundCurrent: v.number(),
        emergencyFundGoal: v.number(),
        otherSavings: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("financialProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const nowISO = new Date().toISOString();
    const updateData: any = {
      updatedAt: nowISO,
    };

    if (args.incomeSources !== undefined) updateData.incomeSources = args.incomeSources;
    if (args.expenses !== undefined) updateData.expenses = args.expenses;
    if (args.debts !== undefined) updateData.debts = args.debts;
    if (args.investments !== undefined) updateData.investments = args.investments;
    if (args.savings !== undefined) updateData.savings = args.savings;

    let profileId;
    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      profileId = existing._id;
    } else {
      // Create new profile with defaults
      const profileData = {
        clerkUserId: args.clerkUserId,
        incomeSources: args.incomeSources || [],
        expenses: args.expenses || [],
        debts: args.debts || [],
        investments: args.investments || [],
        savings: args.savings || {
          emergencyFundCurrent: 0,
          emergencyFundGoal: 0,
          otherSavings: 0,
        },
        createdAt: nowISO,
        updatedAt: nowISO,
      };
      profileId = await ctx.db.insert("financialProfiles", profileData);
    }

    // Sync aggregated values to userProfiles for backward compatibility
    const totalIncome = (args.incomeSources || existing?.incomeSources || []).reduce(
      (sum, source) => sum + (source.isRecurring ? source.amount : 0),
      0
    );
    const totalExpenses = (args.expenses || existing?.expenses || []).reduce(
      (sum, exp) => sum + (exp.isRecurring ? exp.amount : 0),
      0
    );
    const totalInvestments = (args.investments || existing?.investments || []).reduce(
      (sum, inv) => sum + inv.value,
      0
    );
    const totalDebts = (args.debts || existing?.debts || []).reduce(
      (sum, debt) => sum + debt.principal,
      0
    );
    const netWorth = totalInvestments - totalDebts + (args.savings?.emergencyFundCurrent || existing?.savings?.emergencyFundCurrent || 0) + (args.savings?.otherSavings || existing?.savings?.otherSavings || 0);

    // Update userProfiles for backward compatibility
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (userProfile) {
      await ctx.db.patch(userProfile._id, {
        monthlyIncome: totalIncome,
        monthlyExpenses: totalExpenses,
        netWorth: netWorth,
        emergencyFundCurrent: args.savings?.emergencyFundCurrent || existing?.savings?.emergencyFundCurrent || 0,
        emergencyFundGoal: args.savings?.emergencyFundGoal || existing?.savings?.emergencyFundGoal || 0,
        updatedAt: nowISO,
      });
    }

    // Record monthly financial metrics snapshot for historical tracking
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate current month's metrics
    const currentIncome = totalIncome;
    const currentExpenses = totalExpenses;
    const currentSavings = totalIncome - totalExpenses;
    const currentNetWorth = netWorth;
    
    // Check if metrics already exist for this month
    const existingMetrics = await ctx.db
      .query("financialMetrics")
      .withIndex("by_month", (q) => 
        q.eq("clerkUserId", args.clerkUserId).eq("month", currentMonth)
      )
      .first();
    
    const metricsData = {
      clerkUserId: args.clerkUserId,
      month: currentMonth,
      income: currentIncome,
      expenses: currentExpenses,
      savings: currentSavings,
      netWorth: currentNetWorth,
      createdAt: now.toISOString(),
    };
    
    if (existingMetrics) {
      // Update existing month's metrics
      await ctx.db.patch(existingMetrics._id, metricsData);
    } else {
      // Create new monthly snapshot
      await ctx.db.insert("financialMetrics", metricsData);
    }

    // Trigger insights regeneration
    await ctx.scheduler.runAfter(0, api.functions.generateAutomaticFinancialInsights, {
      clerkUserId: args.clerkUserId,
    });

    return profileId;
  },
});

// ===== ONBOARDING HELPER FUNCTIONS =====
export const isUserOnboarded = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!profile) {
      return false;
    }

    // If isOnboarded is explicitly set to true, return true
    if (profile.isOnboarded === true) {
      return true;
    }

    // If isOnboarded is explicitly set to false, return false
    if (profile.isOnboarded === false) {
      return false;
    }

    // For existing users without isOnboarded field but with financial data, treat as onboarded
    // Check if key financial fields are present (indicating user has completed onboarding)
    // Note: Financial fields may be encrypted strings, so we just check for presence
    const hasFinancialData = 
      (profile.monthlyIncome !== undefined && profile.monthlyIncome !== null) ||
      (profile.monthlyExpenses !== undefined && profile.monthlyExpenses !== null) ||
      (profile.netWorth !== undefined && profile.netWorth !== null);

    return hasFinancialData;
  },
});

// ===== USER PREFERENCES FUNCTIONS =====
export const getUserPreferences = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

export const createOrUpdateUserPreferences = mutation({
  args: {
    clerkUserId: v.string(),
    language: v.optional(v.union(v.literal("en"), v.literal("ar"))),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    displayNameAr: v.optional(v.string()),
    region: v.optional(v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"))),
    currency: v.optional(v.union(v.literal("SAR"), v.literal("AED"), v.literal("USD"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const now = new Date().toISOString();

    if (existing) {
      // Update existing preferences - only update provided fields
      const updateData: any = {
        updatedAt: now,
      };
      if (args.language !== undefined) updateData.language = args.language;
      if (args.theme !== undefined) updateData.theme = args.theme;
      if (args.displayNameAr !== undefined) updateData.displayNameAr = args.displayNameAr;
      if (args.region !== undefined) updateData.region = args.region;
      if (args.currency !== undefined) updateData.currency = args.currency;
      
      await ctx.db.patch(existing._id, updateData);
      return existing._id;
    } else {
      // Create new preferences with defaults
      return await ctx.db.insert("userPreferences", {
        clerkUserId: args.clerkUserId,
        language: args.language || "en",
        theme: args.theme || "light",
        displayNameAr: args.displayNameAr,
        region: args.region || "ksa",
        currency: args.currency || "SAR",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const recordFinancialMetrics = mutation({
  args: {
    clerkUserId: v.string(),
    income: v.number(),
    expenses: v.number(),
    savings: v.number(),
    netWorth: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Check if already recorded this month
    const existing = await ctx.db
      .query("financialMetrics")
      .withIndex("by_month", (q) => 
        q.eq("clerkUserId", args.clerkUserId).eq("month", month)
      )
      .first();

    const metricsData = {
      clerkUserId: args.clerkUserId,
      month,
      income: args.income,
      expenses: args.expenses,
      savings: args.savings,
      netWorth: args.netWorth,
      createdAt: new Date().toISOString(),
    };

    let metricsId;
    if (existing) {
      await ctx.db.patch(existing._id, metricsData);
      metricsId = existing._id;
    } else {
      metricsId = await ctx.db.insert("financialMetrics", metricsData);
    }

    // Automatically trigger financial insights generation when data changes
    // Schedule it to run after a short delay to avoid blocking the mutation
    await ctx.scheduler.runAfter(0, api.functions.generateAutomaticFinancialInsights, {
      clerkUserId: args.clerkUserId,
    });

    return metricsId;
  },
});

export const getFinancialHistory = query({
  args: { clerkUserId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query("financialMetrics")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .take(args.limit || 12);
    
    return metrics.reverse(); // Return oldest first for charts
  },
});

// Get monthly financial metrics for cash flow chart (last N months including current)
export const getMonthlyCashFlow = query({
  args: { clerkUserId: v.string(), months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthsToShow = args.months || 6;
    
    // Get all metrics for this user
    const allMetrics = await ctx.db
      .query("financialMetrics")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();
    
    // Create a map of month -> metrics
    const metricsMap = new Map<string, { income: number; expenses: number; savings: number; netWorth: number }>();
    allMetrics.forEach(metric => {
      metricsMap.set(metric.month, {
        income: metric.income,
        expenses: metric.expenses,
        savings: metric.savings,
        netWorth: metric.netWorth,
      });
    });
    
    // Generate array for last N months (including current month)
    const result = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Use stored metrics if available, otherwise use current month's data if it's the current month
      const stored = metricsMap.get(monthKey);
      if (stored) {
        result.push({
          month: monthKey,
          monthName: date.toLocaleDateString("en-US", { month: "short" }),
          income: stored.income,
          expenses: stored.expenses,
          savings: stored.savings,
          netWorth: stored.netWorth,
        });
      } else if (monthKey === currentMonth) {
        // For current month, get from financialProfile if no metrics exist yet
        const profile = await ctx.db
          .query("financialProfiles")
          .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
          .first();
        
        if (profile) {
          const income = (profile.incomeSources || []).reduce((sum, s) => sum + (s.isRecurring ? s.amount : 0), 0);
          const expenses = (profile.expenses || []).reduce((sum, e) => sum + (e.isRecurring ? e.amount : 0), 0);
          const investments = (profile.investments || []).reduce((sum, i) => sum + i.value, 0);
          const debts = (profile.debts || []).reduce((sum, d) => sum + d.principal, 0);
          const savings = profile.savings || { emergencyFundCurrent: 0, otherSavings: 0 };
          const netWorth = investments - debts + savings.emergencyFundCurrent + (savings.otherSavings || 0);
          
          result.push({
            month: monthKey,
            monthName: date.toLocaleDateString("en-US", { month: "short" }),
            income,
            expenses,
            savings: income - expenses,
            netWorth,
          });
        } else {
          result.push({
            month: monthKey,
            monthName: date.toLocaleDateString("en-US", { month: "short" }),
            income: 0,
            expenses: 0,
            savings: 0,
            netWorth: 0,
          });
        }
      } else {
        // For past months without data, use 0
        result.push({
          month: monthKey,
          monthName: date.toLocaleDateString("en-US", { month: "short" }),
          income: 0,
          expenses: 0,
          savings: 0,
          netWorth: 0,
        });
      }
    }
    
    return result;
  },
});

// ===== AI INSIGHTS FUNCTIONS =====

// Get latest financial metrics entry for a user
export const getLatestFinancialMetrics = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const metrics = await ctx.db
      .query("financialMetrics")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .first();
    
    return metrics || null;
  },
});

// Helper query to get user data for AI insights generation
export const getUserDataForAI = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const latestMetrics = await ctx.db
      .query("financialMetrics")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .first();

    return {
      user,
      subscription,
      userProfile,
      latestMetrics,
    };
  },
});

// Mutation to store AI insights in database
export const storeAIInsights = mutation({
  args: {
    clerkUserId: v.string(),
    insights: v.array(
      v.object({
        type: v.union(
          v.literal("spending"),
          v.literal("savings"),
          v.literal("emergency"),
          v.literal("risk"),
          v.literal("next_action")
        ),
        title: v.string(),
        explanation: v.string(),
        severity: v.union(v.literal("good"), v.literal("warning"), v.literal("critical")),
        confidence: v.number(),
        action: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const insightId = await ctx.db.insert("aiInsights", {
      clerkUserId: args.clerkUserId,
      insights: args.insights,
      createdAt: now,
    });

    return {
      id: insightId,
      insights: args.insights,
      createdAt: now,
    };
  },
});

// Generate AI insights using Google Gemini (Action - can use fetch)
export const generateAIInsights = action({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args): Promise<{
    id: any;
    insights: Array<{
      type: "spending" | "savings" | "emergency" | "risk" | "next_action";
      title: string;
      explanation: string;
      severity: "good" | "warning" | "critical";
      confidence: number;
      action: string;
    }>;
    createdAt: string;
  }> => {
    // Use runQuery to get user data (actions can call queries)
    const userData = await ctx.runQuery(api.functions.getUserDataForAI, {
      clerkUserId: args.clerkUserId,
    });

    if (!userData || !userData.user) {
      throw new Error("User not found. Please sign in.");
    }

    // Pro subscription check
    const plan = userData.subscription?.plan || userData.user.plan;
    if (plan !== "pro") {
      throw new Error("AI insights are only available for Pro members. Please upgrade to Pro.");
    }

    if (!userData.userProfile) {
      throw new Error("Financial profile not found. Please complete your profile in Settings.");
    }

    // GDPR: Check AI analysis consent
    const hasConsent = await ctx.runQuery(api.compliance.hasAIConsent, {
      clerkUserId: args.clerkUserId,
    });
    if (!hasConsent) {
      throw new Error("Consent required: You must provide explicit consent to use your data for AI analysis. Please update your consent settings.");
    }
    
    // GDPR: Log AI analysis usage
    await ctx.runMutation(api.compliance.logAIAnalysisUsage, {
      clerkUserId: args.clerkUserId,
    });

    // SECURITY: Decrypt financial fields for AI processing
    // Helper to safely convert encrypted/legacy values to numbers
    const toNumber = (value: number | string | null | undefined): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === "number") return value;
      // If it's a string, it's encrypted - we need to decrypt it
      // But for AI insights, we should use getSummarizedFinancialMetrics which already decrypts
      return 0;
    };

    // Use getSummarizedFinancialMetrics which already handles decryption
    const summarizedData = await ctx.runQuery(api.functions.getSummarizedFinancialMetrics, {
      clerkUserId: args.clerkUserId,
    });

    if (!summarizedData) {
      throw new Error("Failed to retrieve financial data");
    }

    // Build financial data summary for AI prompt (already decrypted)
    const financialData = {
      monthlyIncome: summarizedData.monthlyIncome || 0,
      monthlyExpenses: summarizedData.monthlyExpenses || 0,
      netWorth: summarizedData.netWorth || 0,
      emergencyFundCurrent: summarizedData.emergencyFundCurrent || 0,
      emergencyFundGoal: summarizedData.emergencyFundGoal || 0,
      riskTolerance: userData.userProfile.riskTolerance || "moderate",
      latestMetrics: summarizedData.latestMetrics || userData.latestMetrics,
    };

    // Calculate derived metrics
    const monthlySavings = financialData.monthlyIncome - financialData.monthlyExpenses;
    const savingsRate = financialData.monthlyIncome > 0 
      ? (monthlySavings / financialData.monthlyIncome) * 100 
      : 0;
    const emergencyFundProgress = financialData.emergencyFundGoal > 0
      ? (financialData.emergencyFundCurrent / financialData.emergencyFundGoal) * 100
      : 0;

    // Calculate additional ratios and metrics for deterministic analysis
    const monthlyExpenseRatio = financialData.monthlyIncome > 0 
      ? ((financialData.monthlyExpenses / financialData.monthlyIncome) * 100).toFixed(1)
      : "0";
    const emergencyFundMonths = financialData.monthlyExpenses > 0
      ? (financialData.emergencyFundCurrent / financialData.monthlyExpenses).toFixed(1)
      : "0";
    const emergencyFundGoalMonths = financialData.monthlyExpenses > 0
      ? (financialData.emergencyFundGoal / financialData.monthlyExpenses).toFixed(1)
      : "0";
    const netWorthToIncomeRatio = financialData.monthlyIncome > 0
      ? (financialData.netWorth / (financialData.monthlyIncome * 12)).toFixed(2)
      : "0";
    const emergencyFundGap = financialData.emergencyFundGoal - financialData.emergencyFundCurrent;
    const monthsToEmergencyGoal = monthlySavings > 0
      ? (emergencyFundGap / monthlySavings).toFixed(1)
      : "N/A";

    // Build compliant, educational prompt for AI insights
    const prompt = `You are a financial data analyst providing educational and analytical insights. Your role is EDUCATIONAL, ANALYTICAL, and DESCRIPTIVE only. You do NOT provide investment recommendations, guarantees, or prescriptive financial advice.
    
COMPLIANCE REQUIREMENTS:
- INTENT: Educational, analytical, descriptive only
- FORBIDDEN: Investment recommendations, guarantees, prescriptive advice ("you should", "you must")
- LANGUAGE: Use confidence indicators ("may", "could", "based on your data", "potentially")
- TONE: Neutral, analytical, non-directive
- PURPOSE: Help users understand their financial data, not tell them what to do

Analyze the following financial data and generate exactly 5 insights in JSON format. Use percentages, ratios, and specific numbers from the data.

FINANCIAL DATA:
- Monthly Income: ${financialData.monthlyIncome} SAR
- Monthly Expenses: ${financialData.monthlyExpenses} SAR
- Monthly Savings: ${monthlySavings} SAR
- Savings Rate: ${savingsRate.toFixed(1)}%
- Expense-to-Income Ratio: ${monthlyExpenseRatio}%
- Net Worth: ${financialData.netWorth} SAR
- Net Worth to Annual Income Ratio: ${netWorthToIncomeRatio}x
- Emergency Fund Current: ${financialData.emergencyFundCurrent} SAR
- Emergency Fund Goal: ${financialData.emergencyFundGoal} SAR
- Emergency Fund Gap: ${emergencyFundGap} SAR
- Emergency Fund Progress: ${emergencyFundProgress.toFixed(1)}%
- Emergency Fund Coverage: ${emergencyFundMonths} months of expenses
- Emergency Fund Goal Coverage: ${emergencyFundGoalMonths} months of expenses
- Months to Reach Emergency Goal: ${monthsToEmergencyGoal} months (at current savings rate)
- Risk Tolerance: ${financialData.riskTolerance}
${financialData.latestMetrics ? `- Latest Metrics: Income ${financialData.latestMetrics.income} SAR, Expenses ${financialData.latestMetrics.expenses} SAR, Savings ${financialData.latestMetrics.savings} SAR, Savings Rate ${((financialData.latestMetrics.savings / financialData.latestMetrics.income) * 100).toFixed(1)}%` : ''}

REQUIREMENTS:
1. Use exact numbers, percentages, and ratios from the data above
2. Calculate and reference specific metrics (e.g., "Your ${monthlyExpenseRatio}% expense ratio is...")
3. Compare against financial benchmarks (e.g., emergency fund may typically be 3-6 months expenses)
4. Provide analytical observations with numbers - use confidence language: "may", "could", "based on your data", "potentially"
5. FORBIDDEN PHRASES: "you should", "you must", "you need to", "guaranteed", "will definitely", "invest in", "buy", "sell"
6. REQUIRED LANGUAGE: "you may consider", "one option could be", "based on your data", "potentially", "could"
7. Each insight must reference specific data points and calculations
8. Educational intent only - describe patterns, not prescribe actions
9. No investment recommendations or financial product suggestions
10. No guarantees or promises about outcomes

OUTPUT FORMAT (JSON only, no markdown, no commentary):
{
  "insights": [
    {
      "type": "spending",
      "title": "Concise title with numbers (max 50 chars)",
      "explanation": "2-3 sentences using specific percentages/ratios from data. Example: 'Your ${monthlyExpenseRatio}% expense ratio exceeds the recommended 70% threshold. With ${financialData.monthlyExpenses} SAR monthly expenses against ${financialData.monthlyIncome} SAR income, reducing expenses by X% would free Y SAR monthly.'",
      "severity": "good" | "warning" | "critical",
      "confidence": 0-100,
      "action": "Neutral suggestion with numbers. Example: 'You may consider reducing monthly expenses by 500 SAR to potentially achieve a 65% expense ratio.'"
    },
    {
      "type": "savings",
      "title": "Concise title with numbers (max 50 chars)",
      "explanation": "2-3 sentences using savings rate and amounts. Example: 'Your ${savingsRate.toFixed(1)}% savings rate generates ${monthlySavings} SAR monthly. At this rate, you'll save ${(monthlySavings * 12).toFixed(0)} SAR annually.'",
      "severity": "good" | "warning" | "critical",
      "confidence": 0-100,
      "action": "Specific action with numbers"
    },
    {
      "type": "emergency",
      "title": "Concise title with numbers (max 50 chars)",
      "explanation": "2-3 sentences comparing current coverage (${emergencyFundMonths} months) to goal (${emergencyFundGoalMonths} months). Example: 'Your emergency fund covers ${emergencyFundMonths} months of expenses. The recommended 6-month buffer requires ${(financialData.monthlyExpenses * 6).toFixed(0)} SAR. You need ${emergencyFundGap} SAR more (${((emergencyFundGap / financialData.emergencyFundGoal) * 100).toFixed(1)}% of goal).'",
      "severity": "good" | "warning" | "critical",
      "confidence": 0-100,
      "action": "Specific action with numbers"
    },
    {
      "type": "risk",
      "title": "Concise title with numbers (max 50 chars)",
      "explanation": "2-3 sentences about risk tolerance (${financialData.riskTolerance}) and net worth (${netWorthToIncomeRatio}x annual income). Reference specific ratios.",
      "severity": "good" | "warning" | "critical",
      "confidence": 0-100,
      "action": "Specific action with numbers"
    },
    {
      "type": "next_action",
      "title": "Concise title with numbers (max 50 chars)",
      "explanation": "2-3 sentences prioritizing the most impactful action based on the data above. Use specific numbers.",
      "severity": "good" | "warning" | "critical",
      "confidence": 0-100,
      "action": "Specific action with numbers"
    }
  ]
}

CRITICAL: Output ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON.`;

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("AI service is not configured. Please contact support.");
    }

    // Call OpenAI API (actions can use fetch)
    try {
      const modelName = "gpt-4o-mini";
      const apiUrl = "https://api.openai.com/v1/chat/completions";
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "system",
              content: "You are a financial data analyst providing educational and analytical insights only. Your role is EDUCATIONAL, ANALYTICAL, and DESCRIPTIVE. You do NOT provide investment recommendations, guarantees, or prescriptive financial advice. Use confidence language ('may', 'could', 'based on your data'). Generate exactly 5 financial insights in JSON format only. Do not include any markdown, code blocks, or commentary outside the JSON structure.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        // Safely read error text without logging sensitive data
        const errorText = await response.text().catch(() => "Unknown error");
        // Log only status code, not error content (may contain sensitive data)
        safeError("OpenAI API error", { status: response.status });
        
        let errorMessage = `AI service error: ${response.status}. Please try again later.`;
        
        // Provide more specific error messages without exposing sensitive details
        if (response.status === 404) {
          errorMessage = "AI service endpoint not found. Please contact support.";
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = "AI service authentication failed. Please contact support.";
        } else if (response.status === 429) {
          errorMessage = "AI service rate limit exceeded. Please wait a few moments and try again.";
        } else if (response.status === 400) {
          errorMessage = "AI service request error. Please try again.";
        } else if (response.status >= 500) {
          errorMessage = "AI service is temporarily unavailable. Please try again in a few moments.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Extract JSON from OpenAI response
      // OpenAI returns: { choices: [{ message: { content: "..." } }] }
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) {
        throw new Error("AI service returned an invalid response. Please try again.");
      }

      // Parse and validate JSON response
      let parsedResponse: any;
      try {
        // Remove markdown code blocks if present (OpenAI may add them despite json_object format)
        const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        // Log parse error without exposing response content (may contain user data)
        safeError("Failed to parse AI response: Invalid JSON format");
        throw new Error("AI service returned invalid data. Please try again.");
      }

      // Validate response structure
      if (!parsedResponse.insights || !Array.isArray(parsedResponse.insights)) {
        throw new Error("AI service returned invalid insight format. Please try again.");
      }

      if (parsedResponse.insights.length !== 5) {
        throw new Error(`AI service returned ${parsedResponse.insights.length} insights, expected 5. Please try again.`);
      }

      // Validate and sanitize each insight for compliance
      const validTypes = ["spending", "savings", "emergency", "risk", "next_action"];
      const validSeverities = ["good", "warning", "critical"];
      
      const sanitizedInsights = [];
      for (const insight of parsedResponse.insights) {
        if (!insight.type || !validTypes.includes(insight.type)) {
          throw new Error(`Invalid insight type: ${insight.type}`);
        }
        if (!insight.title || typeof insight.title !== "string") {
          throw new Error("Missing or invalid insight title");
        }
        if (!insight.explanation || typeof insight.explanation !== "string") {
          throw new Error("Missing or invalid insight explanation");
        }
        if (!insight.severity || !validSeverities.includes(insight.severity)) {
          throw new Error(`Invalid insight severity: ${insight.severity}`);
        }
        if (typeof insight.confidence !== "number" || insight.confidence < 0 || insight.confidence > 100) {
          throw new Error(`Invalid insight confidence: ${insight.confidence}`);
        }
        if (!insight.action || typeof insight.action !== "string") {
          throw new Error("Missing or invalid insight action");
        }
        
        // COMPLIANCE: Check and sanitize insight
        const complianceChecks = checkInsightCompliance(insight);
        const intentCheck = validateInsightIntent(insight);
        
        if (!intentCheck.isValid) {
          safeError("Insight failed compliance check", { 
            type: insight.type, 
            issues: intentCheck.issues 
          });
          // Sanitize and continue rather than failing
        }
        
        // Sanitize text fields individually
        const sanitizedInsight = {
          ...insight,
          title: addConfidenceLanguage(complianceChecks.title.sanitized || insight.title),
          explanation: addConfidenceLanguage(complianceChecks.explanation.sanitized || insight.explanation),
          action: addConfidenceLanguage(complianceChecks.action.sanitized || insight.action),
          // Generate "Why am I seeing this?" explanation
          whyExplanation: generateWhyExplanation(insight.type, {
            monthlyIncome: financialData.monthlyIncome,
            monthlyExpenses: financialData.monthlyExpenses,
            savingsRate,
            emergencyFundProgress,
          }),
        };
        
        sanitizedInsights.push(sanitizedInsight);
      }

      // Store validated and sanitized insights using mutation (actions can call mutations)
      const result: {
        id: any;
        insights: typeof sanitizedInsights;
        createdAt: string;
      } = await ctx.runMutation(api.functions.storeAIInsights, {
        clerkUserId: args.clerkUserId,
        insights: sanitizedInsights,
      });

      return result;
    } catch (error: any) {
      // Handle errors gracefully without logging sensitive data
      const errorType = error?.constructor?.name || "Unknown";
      const errorMessage = error?.message || "Unknown error";
      
      // Check if this is a known, user-friendly error that we should re-throw
      const isKnownError = error?.message && (
        error.message.includes("AI service") || 
        error.message.includes("User not found") || 
        error.message.includes("Financial profile") || 
        error.message.includes("Pro members") ||
        error.message.includes("not configured") ||
        error.message.includes("rate limit")
      );
      
      if (isKnownError) {
        // For known errors (rate limits, auth, etc.), just re-throw without logging
        // These are expected and user-friendly messages are already set
        throw error;
      }
      
      // For unexpected errors, log and provide generic message (with masking)
      safeError("Error generating AI insights", { errorType, errorMessage });
      throw new Error("Unable to generate insights at this time. Please try again later.");
    }
  },
});

// Get latest AI insights for a user
export const getLatestAIInsights = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .first();
    
    return insights || null;
  },
});

// ===== AUTOMATIC FINANCIAL INSIGHTS (Non-Chat, Auto-Generated) =====

/**
 * Calculate a hash of financial data to detect changes.
 * This ensures insights are only regenerated when data actually changes.
 */
function calculateFinancialDataHash(data: {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  netWorth?: number;
  emergencyFundCurrent?: number;
  emergencyFundGoal?: number;
  latestMetrics?: {
    income: number;
    expenses: number;
    savings: number;
    netWorth: number;
  } | null;
}): string {
  // Create a deterministic string representation of the financial data
  const dataString = JSON.stringify({
    income: data.monthlyIncome || 0,
    expenses: data.monthlyExpenses || 0,
    netWorth: data.netWorth || 0,
    emergencyCurrent: data.emergencyFundCurrent || 0,
    emergencyGoal: data.emergencyFundGoal || 0,
    latestIncome: data.latestMetrics?.income || 0,
    latestExpenses: data.latestMetrics?.expenses || 0,
    latestSavings: data.latestMetrics?.savings || 0,
    latestNetWorth: data.latestMetrics?.netWorth || 0,
  });
  
  // Simple hash function (for production, consider using crypto)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Get summarized financial metrics for a user.
 * Used by automatic insights generator.
 * SECURITY: Decrypts financial data for authorized access (user's own data).
 */
export const getSummarizedFinancialMetrics = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    // SECURITY: Only users can access their own financial data for AI insights
    // This function is called internally by AI actions, so we trust the caller
    // (AI actions run with user's context)
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const latestMetrics = await ctx.db
      .query("financialMetrics")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .first();

    if (!userProfile) {
      return null;
    }

    // SECURITY: Decrypt financial fields (user accessing own data)
    const decryptField = async (value: number | string | null | undefined): Promise<number> => {
      if (value === null || value === undefined) return 0;
      if (typeof value === "number") return value; // Legacy unencrypted
      if (typeof value === "string") {
        try {
          const decrypted = await decryptFinancialValue(value);
          return decrypted ?? 0;
        } catch (error) {
          safeError("Failed to decrypt financial field in getSummarizedFinancialMetrics", error);
          return 0;
        }
      }
      return 0;
    };

    // Decrypt all fields in parallel
    const [monthlyIncome, monthlyExpenses, netWorth, emergencyFundCurrent, emergencyFundGoal] = await Promise.all([
      decryptField(userProfile.monthlyIncome),
      decryptField(userProfile.monthlyExpenses),
      decryptField(userProfile.netWorth),
      decryptField(userProfile.emergencyFundCurrent),
      decryptField(userProfile.emergencyFundGoal),
    ]);

    return {
      monthlyIncome,
      monthlyExpenses,
      netWorth,
      emergencyFundCurrent,
      emergencyFundGoal,
      latestMetrics: latestMetrics ? {
        income: latestMetrics.income,
        expenses: latestMetrics.expenses,
        savings: latestMetrics.savings,
        netWorth: latestMetrics.netWorth,
      } : null,
    };
  },
});

/**
 * Store automatic financial insights in database.
 */
export const storeFinancialInsights = mutation({
  args: {
    clerkUserId: v.string(),
    insights: v.array(
      v.object({
        title: v.string(),
        summary: v.string(),
        category: v.union(
          v.literal("spending"),
          v.literal("savings"),
          v.literal("emergency"),
          v.literal("risk"),
          v.literal("trend"),
          v.literal("opportunity")
        ),
        whyExplanation: v.optional(v.string()), // "Why am I seeing this?" explanation
      })
    ),
    dataHash: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Always insert new insights (allows regeneration even if data hasn't changed)
    // The query will return the latest one, so old insights are effectively replaced
    const insightId = await ctx.db.insert("financialInsights", {
      clerkUserId: args.clerkUserId,
      insights: args.insights,
      dataHash: args.dataHash,
      createdAt: now,
    });

    return {
      id: insightId,
      insights: args.insights,
      dataHash: args.dataHash,
      createdAt: now,
    };
  },
});

/**
 * Generate automatic financial insights (1 short insight).
 * This is triggered automatically when financial data changes.
 * Never accepts user input - purely data-driven.
 */
export const generateAutomaticFinancialInsights = action({
  args: { 
    clerkUserId: v.string(),
    language: v.optional(v.union(v.literal("en"), v.literal("ar"))), // Allow passing language from UI
  },
  handler: async (ctx, args): Promise<{
    id: any;
    insights: Array<{
      title: string;
      summary: string;
      category: "spending" | "savings" | "emergency" | "risk" | "trend" | "opportunity";
    }>;
    dataHash: string;
    createdAt: string;
  }> => {
    // Read user language preference (defaults to English if missing)
    // Use passed language from UI if provided, otherwise use database preference
    const prefs = await ctx.runQuery(api.functions.getUserPreferences, {
      clerkUserId: args.clerkUserId,
    });
    // Prefer passed language (from UI context) over database language
    const preferredLanguage = (args.language || (prefs?.language === "ar" ? "ar" : "en")) as "en" | "ar";

    // Get summarized financial metrics
    const financialData = await ctx.runQuery(api.functions.getSummarizedFinancialMetrics, {
      clerkUserId: args.clerkUserId,
    });

    if (!financialData) {
      throw new Error("Financial profile not found. Complete your profile to generate insights.");
    }

    // Calculate data hash to detect changes (needed for return value even if skipping)
    const dataHash = calculateFinancialDataHash(financialData);

    // GDPR: Check AI analysis consent
    const hasConsent = await ctx.runQuery(api.compliance.hasAIConsent, {
      clerkUserId: args.clerkUserId,
    });
    if (!hasConsent) {
      // Don't throw error for automatic insights - just skip generation silently
      // This is a background process, so we don't want to break the user flow
      safeLog("Skipping automatic insights generation - no AI consent", {
        clerkUserId: args.clerkUserId,
      });
      // Return empty result instead of throwing
      return {
        id: null,
        insights: [],
        dataHash,
        createdAt: new Date().toISOString(),
      };
    }
    
    // GDPR: Log AI analysis usage
    await ctx.runMutation(api.compliance.logAIAnalysisUsage, {
      clerkUserId: args.clerkUserId,
    });

    // Always generate a new insight (allows manual regeneration)
    // The hash is still stored for tracking purposes

    // Calculate derived metrics
    const monthlySavings = financialData.monthlyIncome - financialData.monthlyExpenses;
    const savingsRate = financialData.monthlyIncome > 0 
      ? (monthlySavings / financialData.monthlyIncome) * 100 
      : 0;
    const emergencyFundProgress = financialData.emergencyFundGoal > 0
      ? (financialData.emergencyFundCurrent / financialData.emergencyFundGoal) * 100
      : 0;
    const emergencyFundMonths = financialData.monthlyExpenses > 0
      ? (financialData.emergencyFundCurrent / financialData.monthlyExpenses)
      : 0;

    // Build concise prompt for 1 short insight
    const prompt =
      preferredLanguage === "ar"
        ? `أنت محلل مالي. حلّل البيانات التالية وأنشئ بالضبط ملاحظة واحدة قصيرة بصيغة JSON فقط.

البيانات المالية:
- الدخل الشهري: ${financialData.monthlyIncome} SAR
- المصروفات الشهرية: ${financialData.monthlyExpenses} SAR
- الادخار الشهري: ${monthlySavings} SAR
- معدل الادخار: ${savingsRate.toFixed(1)}%
- صافي الثروة: ${financialData.netWorth} SAR
- صندوق الطوارئ (الحالي): ${financialData.emergencyFundCurrent} SAR
- صندوق الطوارئ (الهدف): ${financialData.emergencyFundGoal} SAR
- تقدم صندوق الطوارئ: ${emergencyFundProgress.toFixed(1)}%
- تغطية صندوق الطوارئ: ${emergencyFundMonths.toFixed(1)} شهر من المصروفات
${financialData.latestMetrics ? `- آخر شهر: دخل ${financialData.latestMetrics.income} SAR، مصروفات ${financialData.latestMetrics.expenses} SAR، ادخار ${financialData.latestMetrics.savings} SAR` : ""}

المتطلبات:
1) أنشئ ملاحظة واحدة فقط (الأكثر أهمية)
2) الطول: 2–3 جمل كحد أقصى
3) استخدم أرقامًا محددة من البيانات
4) الأسلوب: تحليلي وغير توجيهي (تجنّب الأوامر المباشرة مثل "يجب" أو "ينبغي"؛ استخدم صياغات مثل "قد ترغب في النظر" و"يمكن أن تفكر" و"خيار محتمل")
5) بدون توصيات استثمارية أو توجيه لاتخاذ قرار شراء/بيع
6) بدون تنفيذ معاملات مالية أو توصيات مباشرة
7) التصنيف: spending أو savings أو emergency أو risk أو trend أو opportunity
8) اكتب العنوان والملخص باللغة العربية

صيغة الإخراج (JSON فقط، بدون markdown):
{
  "insights": [
    {
      "title": "عنوان قصير (حد أقصى 40 حرفًا)",
      "summary": "ملخص من 2–3 جمل مع أرقام محددة",
      "category": "spending" | "savings" | "emergency" | "risk" | "trend" | "opportunity"
    }
  ]
}

مهم جدًا: أخرج JSON صالح فقط. بدون كتل كود وبدون نص خارج JSON.`
        : `You are a financial analyst. Analyze the following financial data and generate exactly 1 short insight in JSON format. The insight should be concise (2-3 sentences max) and focus on the most important observation.

FINANCIAL DATA:
- Monthly Income: ${financialData.monthlyIncome} SAR
- Monthly Expenses: ${financialData.monthlyExpenses} SAR
- Monthly Savings: ${monthlySavings} SAR
- Savings Rate: ${savingsRate.toFixed(1)}%
- Net Worth: ${financialData.netWorth} SAR
- Emergency Fund Current: ${financialData.emergencyFundCurrent} SAR
- Emergency Fund Goal: ${financialData.emergencyFundGoal} SAR
- Emergency Fund Progress: ${emergencyFundProgress.toFixed(1)}%
- Emergency Fund Coverage: ${emergencyFundMonths.toFixed(1)} months of expenses
${financialData.latestMetrics ? `- Latest Month: Income ${financialData.latestMetrics.income} SAR, Expenses ${financialData.latestMetrics.expenses} SAR, Savings ${financialData.latestMetrics.savings} SAR` : ''}

COMPLIANCE REQUIREMENTS:
- INTENT: Educational, analytical, descriptive only
- FORBIDDEN: Investment recommendations, guarantees, prescriptive advice
- LANGUAGE: Use confidence indicators ("may", "could", "based on your data", "potentially")
- TONE: Neutral, analytical, non-directive

REQUIREMENTS:
1. Generate exactly 1 insight (the most important observation)
2. The insight must be 2-3 sentences maximum
3. Use specific numbers from the data
4. Focus on the most impactful analytical observation (not prescriptive)
5. Category: spending, savings, emergency, risk, trend, or opportunity
6. Use confidence language: "may", "could", "based on your data", "potentially"
7. FORBIDDEN: "you should", "you must", "guaranteed", "invest in", "buy", "sell"

OUTPUT FORMAT (JSON only, no markdown):
{
  "insights": [
    {
      "title": "Short title (max 40 chars)",
      "summary": "2-3 sentence insight with specific numbers",
      "category": "spending" | "savings" | "emergency" | "risk" | "trend" | "opportunity"
    }
  ]
}

CRITICAL: Output ONLY valid JSON. No markdown, no code blocks, no commentary.`;

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("AI service is not configured. Please contact support.");
    }

    // Call OpenAI API
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                preferredLanguage === "ar"
                  ? "أنت محلل مالي. أنشئ ملاحظة مالية قصيرة واحدة فقط بصيغة JSON فقط. اكتب الحقول النصية (title, summary) باللغة العربية. أسلوب تحليلي وغير توجيهي (تجنّب الأوامر المباشرة - استخدم صياغات مثل قد ترغب ويمكن أن تفكر). لا تستخدم markdown أو كتل كود أو أي نص خارج JSON."
                  : "You are a financial analyst. Generate exactly 1 short financial insight in JSON format only. Use neutral, analytical language (avoid 'you should' or 'you must' - use 'you may consider' or 'one option could be'). Do not include any markdown, code blocks, or commentary outside the JSON structure.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 400,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        safeError("OpenAI API error", { status: response.status });
        
        let errorMessage = `AI service error: ${response.status}. Please try again later.`;
        if (response.status === 429) {
          errorMessage = "AI service rate limit exceeded. Please wait a few moments.";
        } else if (response.status >= 500) {
          errorMessage = "AI service is temporarily unavailable. Please try again later.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;
      if (!responseText) {
        throw new Error("AI service returned an invalid response.");
      }

      // Parse JSON response
      let parsedResponse: any;
      try {
        const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        safeError("Failed to parse AI response: Invalid JSON format");
        throw new Error("AI service returned invalid data.");
      }

      // Validate response structure
      if (!parsedResponse.insights || !Array.isArray(parsedResponse.insights)) {
        throw new Error("AI service returned invalid insight format.");
      }

      if (parsedResponse.insights.length !== 1) {
        throw new Error(`AI service returned ${parsedResponse.insights.length} insights, expected 1.`);
      }

      // Validate and sanitize each insight for compliance
      const validCategories = ["spending", "savings", "emergency", "risk", "trend", "opportunity"];
      const sanitizedInsights = [];
      
      for (const insight of parsedResponse.insights) {
        if (!insight.title || typeof insight.title !== "string") {
          throw new Error("Missing or invalid insight title");
        }
        if (!insight.summary || typeof insight.summary !== "string") {
          throw new Error("Missing or invalid insight summary");
        }
        if (!insight.category || !validCategories.includes(insight.category)) {
          throw new Error(`Invalid insight category: ${insight.category}`);
        }
        
        // COMPLIANCE: Check and sanitize insight
        const complianceChecks = checkInsightCompliance({
          title: insight.title,
          explanation: insight.summary,
          action: "",
        });
        const intentCheck = validateInsightIntent({
          title: insight.title,
          explanation: insight.summary,
          action: "",
        });
        
        if (!intentCheck.isValid) {
          safeError("Insight failed compliance check", { 
            category: insight.category, 
            issues: intentCheck.issues 
          });
        }
        
        // Sanitize text fields individually
        const sanitizedInsight = {
          ...insight,
          title: addConfidenceLanguage(complianceChecks.title.sanitized || insight.title),
          summary: addConfidenceLanguage(complianceChecks.explanation.sanitized || insight.summary),
          // Generate "Why am I seeing this?" explanation
          whyExplanation: generateWhyExplanation(insight.category, {
            monthlyIncome: financialData.monthlyIncome,
            monthlyExpenses: financialData.monthlyExpenses,
            savingsRate,
            emergencyFundProgress,
          }),
        };
        
        sanitizedInsights.push(sanitizedInsight);
      }

      // Store sanitized insights using mutation
      const result = await ctx.runMutation(api.functions.storeFinancialInsights, {
        clerkUserId: args.clerkUserId,
        insights: sanitizedInsights,
        dataHash,
      });

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      
      // Check if this is a known, user-friendly error
      const isKnownError = error?.message && (
        error.message.includes("AI service") || 
        error.message.includes("Financial profile") ||
        error.message.includes("not configured") ||
        error.message.includes("rate limit")
      );
      
      if (isKnownError) {
        throw error;
      }
      
      // For unexpected errors, log and provide generic message
      safeError("Error generating automatic financial insights", { errorMessage });
      throw new Error("Unable to generate insights at this time. Please try again later.");
    }
  },
});

/**
 * Get latest automatic financial insights for a user.
 */
export const getLatestFinancialInsights = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("financialInsights")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .first();
    
    return insights || null;
  },
});

// ===== AI CONVERSATION FUNCTIONS =====

/**
 * Pre-classify if a question is finance-related using AI.
 * Returns true if the question is about finance, false otherwise.
 */
export const preClassifyFinanceQuestion = action({
  args: { question: v.string() },
  handler: async (ctx, args): Promise<{ isFinanceRelated: boolean }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("AI service is not configured.");
    }

    const prompt = `You are a financial question classifier. Determine if the following question is related to personal finance, money management, investing, budgeting, savings, expenses, income, debt, or financial planning.

Question: "${args.question}"

Respond with ONLY a JSON object: {"isFinanceRelated": true or false}

Examples:
- "How should I budget my monthly income?" → true
- "What's the weather today?" → false
- "Should I invest in stocks?" → true
- "How do I cook pasta?" → false
- "What's my savings rate?" → true`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a financial question classifier. Respond with JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      return { isFinanceRelated: result.isFinanceRelated === true };
    } catch (error: any) {
      safeError("Pre-classification error", error);
      // Default to allowing the question if classification fails
      return { isFinanceRelated: true };
    }
  },
});

/**
 * Get or create conversation for a user.
 */
export const getOrCreateConversation = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    // Get latest conversation
    const existing = await ctx.db
      .query("aiConversations")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .first();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const now = new Date().toISOString();
    const conversationId = await ctx.db.insert("aiConversations", {
      clerkUserId: args.clerkUserId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(conversationId);
  },
});

/**
 * Add message to conversation.
 */
export const addMessageToConversation = mutation({
  args: {
    conversationId: v.id("aiConversations"),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const newMessage = {
      role: args.role,
      content: args.content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...conversation.messages, newMessage];

    await ctx.db.patch(args.conversationId, {
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Check if user has reached chat limit and increment if allowed.
 */
export const checkAndIncrementChatLimit = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args): Promise<{ allowed: boolean; chatsUsed: number; chatsLimit: number }> => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Define limits based on plan
    const chatsLimit = subscription.plan === "pro" ? 100 : 10; // Pro: 100, Free: 10
    const chatsUsed = subscription.aiChatsUsed || 0;

    if (chatsUsed >= chatsLimit) {
      return {
        allowed: false,
        chatsUsed,
        chatsLimit,
      };
    }

    // Increment chat count
    await ctx.db.patch(subscription._id, {
      aiChatsUsed: chatsUsed + 1,
      updatedAt: new Date().toISOString(),
    });

    return {
      allowed: true,
      chatsUsed: chatsUsed + 1,
      chatsLimit,
    };
  },
});

/**
 * Send chat message and get AI response.
 */
export const sendChatMessage = action({
  args: {
    clerkUserId: v.string(),
    message: v.string(),
    conversationId: v.optional(v.id("aiConversations")),
  },
  handler: async (ctx, args): Promise<{ response: string; conversationId: string }> => {
    // 1. Check plan and limits
    const limitCheck = await ctx.runMutation(api.functions.checkAndIncrementChatLimit, {
      clerkUserId: args.clerkUserId,
    });

    if (!limitCheck.allowed) {
      throw new Error(`Chat limit reached. You've used ${limitCheck.chatsUsed}/${limitCheck.chatsLimit} chats. Please upgrade to Pro for more chats.`);
    }

    // 2. Pre-classify question
    const classification = await ctx.runAction(api.functions.preClassifyFinanceQuestion, {
      question: args.message,
    });

    if (!classification.isFinanceRelated) {
      // Use a simple error code that the frontend can localize for the user
      throw new Error("NON_FINANCE_QUESTION");
    }

    // 3. Get or create conversation
    let conversation;
    if (args.conversationId) {
      // Use the provided conversation
      conversation = await ctx.runQuery(api.functions.getConversation, {
        clerkUserId: args.clerkUserId,
        conversationId: args.conversationId,
      });
      if (!conversation) {
        throw new Error("Conversation not found");
      }
    } else {
      // Get or create the latest conversation
      conversation = await ctx.runMutation(api.functions.getOrCreateConversation, {
        clerkUserId: args.clerkUserId,
      });
      if (!conversation) {
        throw new Error("Failed to create conversation");
      }
    }

    // 4. Add user message
    await ctx.runMutation(api.functions.addMessageToConversation, {
      conversationId: conversation._id,
      role: "user",
      content: args.message,
    });

    // 5. Get financial context
    const financialData = await ctx.runQuery(api.functions.getSummarizedFinancialMetrics, {
      clerkUserId: args.clerkUserId,
    });

    // Build context string
    let contextString: string | null = null;
    if (financialData) {
      const monthlySavings = financialData.monthlyIncome - financialData.monthlyExpenses;
      const savingsRate = financialData.monthlyIncome > 0 
        ? (monthlySavings / financialData.monthlyIncome) * 100 
        : 0;
      contextString = `User Financial Context:
- Monthly Income: ${financialData.monthlyIncome} SAR
- Monthly Expenses: ${financialData.monthlyExpenses} SAR
- Monthly Savings: ${monthlySavings} SAR (${savingsRate.toFixed(1)}% savings rate)
- Net Worth: ${financialData.netWorth} SAR
- Emergency Fund: ${financialData.emergencyFundCurrent} SAR / ${financialData.emergencyFundGoal} SAR (${((financialData.emergencyFundCurrent / financialData.emergencyFundGoal) * 100).toFixed(1)}%)
${financialData.latestMetrics ? `- Latest Month: Income ${financialData.latestMetrics.income} SAR, Expenses ${financialData.latestMetrics.expenses} SAR, Savings ${financialData.latestMetrics.savings} SAR` : ''}`;
    }

    // 6. Get last 3-5 messages (excluding the one we just added)
    const recentMessages = conversation.messages.slice(-4); // Last 4, then we'll add the new one
    const messagesForAI = [
      ...recentMessages,
      { role: "user", content: args.message, timestamp: new Date().toISOString() },
    ].slice(-5); // Keep only last 5 messages

    // 7. Call OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("AI service is not configured.");
    }

    const systemPrompt = `You are a financial consultant AI assistant. Provide helpful, educational advice about personal finance, budgeting, investing, and money management.

${contextString ? `\nUser's Financial Context:\n${contextString}\n` : ''}

Guidelines:
- Be concise and analytical (non-directive)
- Use specific numbers from the user's context when relevant
- Provide educational explanations
- Focus on Saudi Arabia financial context when relevant
- Use neutral language: "you may consider" instead of "you should", "one option could be" instead of "you must"
- Avoid directive phrasing: never use "you should", "you must", "you need to", "you ought to"
- Never provide investment advice that could be considered financial planning
- Never execute financial transactions or provide direct investment recommendations
- Encourage users to consult with licensed financial advisors for complex decisions
- Present information analytically, allowing users to make their own informed decisions`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messagesForAI.map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 8. Add AI response to conversation
    await ctx.runMutation(api.functions.addMessageToConversation, {
      conversationId: conversation._id,
      role: "assistant",
      content: aiResponse,
    });

    return {
      response: aiResponse,
      conversationId: conversation._id,
    };
  },
});

/**
 * Get conversation messages.
 */
export const getConversation = query({
  args: { 
    clerkUserId: v.string(),
    conversationId: v.optional(v.id("aiConversations")),
  },
  handler: async (ctx, args) => {
    // If conversationId is provided, get that specific conversation
    if (args.conversationId) {
      const conversation = await ctx.db.get(args.conversationId);
      // Verify it belongs to the user
      if (conversation && conversation.clerkUserId === args.clerkUserId) {
        return conversation;
      }
      return null;
    }
    
    // Otherwise, get the latest conversation
    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .first();

    return conversation || null;
  },
});

/**
 * Get all conversations for a user.
 */
export const getAllConversations = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("aiConversations")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .collect();

    return conversations;
  },
});

/**
 * Create a new conversation (clears current conversation).
 */
export const createNewConversation = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const conversationId = await ctx.db.insert("aiConversations", {
      clerkUserId: args.clerkUserId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(conversationId);
  },
});

// Calculate user profile tags based on financial data
export const calculateProfileTags = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!profile) return [];

    // SECURITY: Decrypt financial fields before calculations
    const decryptField = async (value: number | string | null | undefined): Promise<number> => {
      if (value === null || value === undefined) return 0;
      if (typeof value === "number") return value; // Legacy unencrypted
      if (typeof value === "string") {
        try {
          const decrypted = await decryptFinancialValue(value);
          return decrypted ?? 0;
        } catch (error) {
          safeError("Failed to decrypt financial field in calculateProfileTags", error);
          return 0;
        }
      }
      return 0;
    };

    const [monthlyIncome, monthlyExpenses, netWorth, emergencyFundCurrent, emergencyFundGoal] = await Promise.all([
      decryptField(profile.monthlyIncome),
      decryptField(profile.monthlyExpenses),
      decryptField(profile.netWorth),
      decryptField(profile.emergencyFundCurrent),
      decryptField(profile.emergencyFundGoal),
    ]);

    const tags = [];

    if (monthlyIncome && monthlyExpenses) {
      const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
      if (savingsRate > 20) tags.push("saver");
      if (savingsRate < 10) tags.push("spender");
      if (monthlyExpenses > monthlyIncome) tags.push("overspending");
    }

    if (netWorth) {
      if (netWorth > 1000000) tags.push("millionaire");
      else if (netWorth > 100000) tags.push("high-net-worth");
      else if (netWorth < 0) tags.push("negative-net-worth");
    }

    if (emergencyFundCurrent && emergencyFundGoal) {
      const emergencyFundRatio = (emergencyFundCurrent / emergencyFundGoal) * 100;
      if (emergencyFundRatio >= 100) tags.push("emergency-funded");
      else if (emergencyFundRatio >= 50) tags.push("emergency-progress");
      else tags.push("emergency-needed");
    }

    return tags;
  },
});

// ===== ARTICLE FUNCTIONS =====

/**
 * Get articles filtered by user's region, risk profile, and financial level.
 * Returns minimal fields for list view, sorted newest first.
 */
export const getArticlesForUser = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    const preferredLanguage = prefs?.language === "ar" ? "ar" : "en";

    // Get user profile to determine filtering criteria
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    // Get detailed financial profile for debt/savings analysis
    const financialProfile = await ctx.db
      .query("financialProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    // SECURITY: Decrypt financial fields before calculations
    const decryptField = async (value: number | string | null | undefined): Promise<number> => {
      if (value === null || value === undefined) return 0;
      if (typeof value === "number") return value; // Legacy unencrypted
      if (typeof value === "string") {
        try {
          const decrypted = await decryptFinancialValue(value);
          return decrypted ?? 0;
        } catch (error) {
          safeError("Failed to decrypt financial field in getArticlesForUser", error);
          return 0;
        }
      }
      return 0;
    };

    const [decryptedIncome, decryptedExpenses, decryptedNetWorth, decryptedEmergencyCurrent, decryptedEmergencyGoal] = await Promise.all([
      decryptField(userProfile?.monthlyIncome),
      decryptField(userProfile?.monthlyExpenses),
      decryptField(userProfile?.netWorth),
      decryptField(userProfile?.emergencyFundCurrent),
      decryptField(userProfile?.emergencyFundGoal),
    ]);

    // Determine user's financial level based on monthly income
    // Default to "beginner" if no income data
    let financialLevel: "beginner" | "intermediate" | "advanced" = "beginner";
    if (decryptedIncome) {
      if (decryptedIncome >= 30000) {
        financialLevel = "advanced";
      } else if (decryptedIncome >= 10000) {
        financialLevel = "intermediate";
      } else {
        financialLevel = "beginner";
      }
    }

    // Get user's risk profile (default to "moderate" if not set)
    const riskProfile = userProfile?.riskTolerance || "moderate";

    // Get user's subscription plan to filter premium articles
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    const userPlan = subscription?.plan || "free";

    // Default region to "saudi" (app uses SAR currency) or match "global" articles
    const userRegion = "saudi";

    // Detect user profile types for personalized article matching
    const userProfileTypes = new Set<string>();
    
    // Check profileTags from userProfile
    if (userProfile?.profileTags) {
      userProfile.profileTags.forEach((tag: string) => {
        userProfileTypes.add(tag.toLowerCase());
      });
    }

    // Detect from financial data if profileTags not set (using decrypted values)
    if (decryptedIncome && decryptedExpenses) {
      const savingsRate = ((decryptedIncome - decryptedExpenses) / decryptedIncome) * 100;
      if (savingsRate > 20) userProfileTypes.add("saver");
      if (savingsRate < 10) userProfileTypes.add("spender");
    }

    // Check for high net worth (using decrypted value)
    if (decryptedNetWorth && decryptedNetWorth > 100000) {
      userProfileTypes.add("high-net-worth");
    }

    // Check for debt from financialProfile
    if (financialProfile?.debts && financialProfile.debts.length > 0) {
      const totalDebt = financialProfile.debts.reduce((sum: number, debt: any) => sum + (debt.principal || 0), 0);
      if (totalDebt > 0) {
        userProfileTypes.add("in-debt");
        // Check debt types
        financialProfile.debts.forEach((debt: any) => {
          if (debt.type === "credit_card") userProfileTypes.add("credit-card-debt");
          if (debt.type === "student_loan") userProfileTypes.add("student-loan");
          if (debt.type === "mortgage") userProfileTypes.add("mortgage");
        });
      }
    }

    // Check for emergency fund status (using decrypted values)
    if (decryptedEmergencyCurrent && decryptedEmergencyGoal) {
      const emergencyFundProgress = (decryptedEmergencyCurrent / decryptedEmergencyGoal) * 100;
      if (emergencyFundProgress < 50) {
        userProfileTypes.add("building-emergency-fund");
      } else if (emergencyFundProgress >= 100) {
        userProfileTypes.add("emergency-fund-complete");
      }
    }

    // Check for investments
    if (financialProfile?.investments && financialProfile.investments.length > 0) {
      userProfileTypes.add("investor");
      const hasStocks = financialProfile.investments.some((inv: any) => inv.type === "stocks");
      const hasRealEstate = financialProfile.investments.some((inv: any) => inv.type === "real_estate");
      if (hasStocks) userProfileTypes.add("stock-investor");
      if (hasRealEstate) userProfileTypes.add("real-estate-investor");
    }

    // Fetch all articles sorted by publishedAt (newest first)
    const allArticles = await ctx.db
      .query("articles")
      .withIndex("by_published")
      .order("desc")
      .collect();

    // Filter by preferred language (treat missing language as English)
    const languageFiltered = allArticles.filter((article: any) => {
      const lang = article.language || "en";
      return preferredLanguage === "ar" ? lang === "ar" : lang === "en";
    });

    // Filter and score articles by user's criteria
    const scoredArticles = languageFiltered.map((article) => {
      let score = 0;
      let matches = true;

      // Region filter: match user's region OR "global" articles
      const regionMatch =
        !article.region || article.region === userRegion || article.region === "global";
      if (!regionMatch) matches = false;

      // Risk profile filter: match user's risk profile OR articles without risk profile specified
      const riskMatch = !article.riskProfile || article.riskProfile === riskProfile;
      if (riskMatch && article.riskProfile) score += 2; // Bonus for matching risk profile

      // Financial level filter: match user's level OR articles without level specified
      let financialMatch = true;
      if (article.financialLevel) {
        if (financialLevel === "beginner") {
          financialMatch = article.financialLevel === "beginner";
        } else if (financialLevel === "intermediate") {
          financialMatch =
            article.financialLevel === "beginner" || article.financialLevel === "intermediate";
        } else {
          financialMatch = true;
        }
      }
      if (financialMatch && article.financialLevel === financialLevel) score += 3; // Bonus for exact level match

      // Plan filter: free users can only see free articles, pro users can see all
      const planMatch = !article.plan || article.plan === "free" || userPlan === "pro";
      if (!planMatch) matches = false;

      // Profile type matching: check if article tags match user profile types
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase().replace(/\s+/g, "-");
          if (userProfileTypes.has(normalizedTag) || userProfileTypes.has(tag.toLowerCase())) {
            score += 5; // High priority for profile-matched articles
          }
        });
      }

      // Category-based matching
      if (article.category) {
        const categoryLower = article.category.toLowerCase();
        if (userProfileTypes.has("in-debt") && (categoryLower.includes("debt") || categoryLower.includes("credit"))) {
          score += 4;
        }
        if (userProfileTypes.has("saver") && (categoryLower.includes("savings") || categoryLower.includes("emergency"))) {
          score += 4;
        }
        if (userProfileTypes.has("high-net-worth") && (categoryLower.includes("wealth") || categoryLower.includes("private"))) {
          score += 4;
        }
        if (userProfileTypes.has("investor") && categoryLower.includes("invest")) {
          score += 3;
        }
      }

      return { article, score, matches };
    });

    // Filter out non-matching articles and sort by relevance score
    const filteredArticles = scoredArticles
      .filter((item) => item.matches)
      .sort((a, b) => {
        // First sort by score (highest first)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Then by published date (newest first)
        const dateA = new Date(a.article.publishedAt).getTime();
        const dateB = new Date(b.article.publishedAt).getTime();
        return dateB - dateA;
      })
      .map((item) => item.article);

    // Sort by publishedAt (newest first) and return minimal fields for list view
    // Return minimal fields for list view (already sorted by relevance score, then date)
    return filteredArticles.map((article) => ({
        _id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
        readTime: article.readTime,
        category: article.category,
        author: article.author,
        plan: article.plan,
        language: article.language || "en",
      }));
  },
});

/**
 * Get a single article by ID.
 * Returns full article content for authenticated users.
 */
export const getArticleById = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    return article;
  },
});

/**
 * Seed the database with sample financial articles.
 * This is a one-time setup function for MVP mock data.
 */
export const seedArticles = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const existing = await ctx.db.query("articles").collect();
    const hasEn = existing.some((a: any) => (a.language || "en") === "en");
    const hasAr = existing.some((a: any) => a.language === "ar");

    const articlesEn = [
      {
        language: "en" as const,
        title: "Building Your First Emergency Fund in Saudi Arabia",
        excerpt: "Learn how to start and maintain an emergency fund tailored to the Saudi market, including recommended amounts in SAR.",
        content: "An emergency fund is your financial safety net. In Saudi Arabia, financial experts recommend saving 3-6 months of expenses. For someone earning 10,000 SAR monthly, aim for 30,000-60,000 SAR. Start small: set aside 500-1,000 SAR monthly. Open a separate savings account to avoid temptation. Consider high-yield savings accounts offered by local banks. Track your progress monthly. Once you reach your goal, maintain it by adjusting for inflation and lifestyle changes.",
        author: "Ahmed Al-Rashid",
        publishedAt: new Date("2024-01-15").toISOString(),
        readTime: 5,
        category: "Savings",
        tags: ["emergency fund", "savings", "saudi arabia"],
        region: "saudi",
        riskProfile: "conservative" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Understanding Tadawul: A Beginner's Guide to Saudi Stock Market",
        excerpt: "Navigate the Saudi stock market with confidence. Learn the basics of Tadawul, key indices, and how to start investing.",
        content: "Tadawul is Saudi Arabia's stock exchange, home to major companies like Aramco, SABIC, and Al Rajhi Bank. Before investing, understand market basics: research companies, diversify your portfolio, and start with small amounts. Consider index funds for beginners. Monitor market trends but avoid emotional trading. Set clear investment goals and time horizons. Use reputable brokers licensed by CMA (Capital Market Authority). Remember: past performance doesn't guarantee future results.",
        author: "Fatima Al-Zahra",
        publishedAt: new Date("2024-02-01").toISOString(),
        readTime: 7,
        category: "Investing",
        tags: ["stocks", "tadawul", "investing", "saudi arabia"],
        region: "saudi",
        riskProfile: "moderate" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Real Estate Investment Strategies for High Net Worth Individuals",
        excerpt: "Advanced strategies for building a diversified real estate portfolio in the GCC region, including tax considerations and market timing.",
        content: "High net worth individuals should consider real estate as a core portfolio component. In the GCC, focus on prime locations in Riyadh, Dubai, and Doha. Diversify across residential, commercial, and industrial properties. Consider REITs for liquidity. Understand local regulations: foreign ownership laws vary by country. Leverage financing strategically but maintain healthy debt-to-income ratios. Factor in maintenance costs (typically 1-2% of property value annually). Monitor market cycles: buy during downturns, sell during peaks. Consider property management services for passive income.",
        author: "Khalid Al-Mansouri",
        publishedAt: new Date("2024-02-20").toISOString(),
        readTime: 12,
        category: "Real Estate",
        tags: ["real estate", "investment", "gcc", "high net worth"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "advanced" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Cryptocurrency and Digital Assets: Risk Management for Aggressive Investors",
        excerpt: "Navigate the volatile world of crypto with proper risk management. Learn position sizing, diversification, and exit strategies.",
        content: "Cryptocurrency offers high potential returns but comes with extreme volatility. Aggressive investors should allocate no more than 5-10% of portfolio to crypto. Diversify across Bitcoin, Ethereum, and select altcoins. Use dollar-cost averaging to reduce timing risk. Set stop-loss orders to limit downside. Store assets in cold wallets for security. Stay updated on regulatory changes in your region. Understand tax implications: crypto gains may be taxable. Never invest more than you can afford to lose. Consider crypto as a speculative allocation, not core holdings.",
        author: "Omar Al-Saud",
        publishedAt: new Date("2024-03-05").toISOString(),
        readTime: 8,
        category: "Investing",
        tags: ["cryptocurrency", "digital assets", "risk management"],
        region: "global",
        riskProfile: "aggressive" as const,
        financialLevel: "intermediate" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Budgeting 101: Take Control of Your Finances",
        excerpt: "Simple budgeting techniques to track income and expenses, reduce unnecessary spending, and achieve your financial goals.",
        content: "Budgeting is the foundation of financial health. Start by tracking all income and expenses for one month. Categorize expenses: housing, food, transportation, entertainment, savings. Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Review your budget monthly and adjust as needed. Cut unnecessary subscriptions and dining out. Set specific savings goals. Use budgeting apps or spreadsheets. Involve family members in budget planning. Celebrate small wins. Remember: a budget is a tool, not a restriction—it gives you freedom to spend wisely.",
        author: "Sarah Al-Mutairi",
        publishedAt: new Date("2024-03-18").toISOString(),
        readTime: 6,
        category: "Budgeting",
        tags: ["budgeting", "personal finance", "savings"],
        region: "global",
        riskProfile: "conservative" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Sukuk vs Bonds: Islamic Finance for Conservative Investors",
        excerpt: "Understand Sharia-compliant investment options. Compare Sukuk and traditional bonds, their risks, and returns in the Saudi market.",
        content: "Sukuk are Sharia-compliant investment certificates, similar to bonds but structured to comply with Islamic principles. They're ideal for conservative investors seeking fixed income. Sukuk don't pay interest (riba) but provide returns through profit-sharing or asset leasing. In Saudi Arabia, government and corporate Sukuk are widely available. Compare yields: Sukuk typically offer competitive returns. Understand credit ratings: AAA-rated Sukuk are safest. Consider maturity dates: short-term (1-3 years) vs long-term (5-10 years). Diversify across issuers. Monitor market conditions affecting Sukuk prices. Consult with Islamic finance advisors for complex structures.",
        author: "Yusuf Al-Hashimi",
        publishedAt: new Date("2024-04-02").toISOString(),
        readTime: 9,
        category: "Investing",
        tags: ["sukuk", "islamic finance", "bonds", "saudi arabia"],
        region: "saudi",
        riskProfile: "conservative" as const,
        financialLevel: "intermediate" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Options Trading Strategies for Advanced Investors",
        excerpt: "Master covered calls, protective puts, and spreads. Learn to generate income and hedge positions using options in volatile markets.",
        content: "Options trading requires advanced knowledge and risk tolerance. Covered calls generate income from stock holdings: sell call options against owned shares. Protective puts hedge downside risk: buy puts to limit losses. Spreads combine multiple options: bull spreads profit from upward moves, bear spreads from downward moves. Understand Greeks: delta, gamma, theta, vega affect option prices. Start with paper trading to practice. Use options for income generation, not speculation. Set strict position size limits (typically 5% of portfolio). Monitor implied volatility: high IV means expensive options. Exit strategies are crucial: know when to close positions. Consider tax implications of options trading.",
        author: "Nora Al-Fahad",
        publishedAt: new Date("2024-04-15").toISOString(),
        readTime: 15,
        category: "Investing",
        tags: ["options", "trading", "advanced strategies", "derivatives"],
        region: "global",
        riskProfile: "aggressive" as const,
        financialLevel: "advanced" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Retirement Planning in the UAE: EPF and Private Savings",
        excerpt: "Navigate retirement planning in the UAE, including employer contributions, private pension plans, and investment strategies for expats.",
        content: "UAE retirement planning differs for nationals and expats. UAE nationals have access to government pension schemes. Expats must rely on private savings and investments. Start early: compound interest is your friend. Aim to save 15-20% of income for retirement. Consider employer-provided end-of-service benefits. Explore private pension plans offered by UAE banks. Invest in diversified portfolios: mix of stocks, bonds, and real estate. Consider international diversification to reduce country risk. Plan for healthcare costs in retirement. Review your plan annually. Factor in inflation: 3-4% annually erodes purchasing power. Consult with certified financial planners familiar with UAE regulations.",
        author: "Layla Al-Mazrouei",
        publishedAt: new Date("2024-04-28").toISOString(),
        readTime: 10,
        category: "Retirement",
        tags: ["retirement", "uae", "pension", "planning"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "intermediate" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Debt Management: Getting Out of Credit Card Debt",
        excerpt: "Practical strategies to eliminate credit card debt, including the snowball method, balance transfers, and negotiating with creditors.",
        content: "Credit card debt can spiral quickly due to high interest rates. Start by listing all debts: balances, interest rates, minimum payments. Choose a strategy: snowball method (pay smallest first) or avalanche method (pay highest interest first). Stop using credit cards while paying off debt. Consider balance transfers to lower-rate cards, but watch for fees. Negotiate with creditors: request lower rates or payment plans. Cut expenses to free up money for debt payments. Consider a side job for extra income. Avoid taking new debt. Track progress monthly. Celebrate milestones. Once debt-free, build emergency fund to avoid future debt. Use credit cards responsibly: pay in full monthly.",
        author: "Majed Al-Otaibi",
        publishedAt: new Date("2024-05-10").toISOString(),
        readTime: 7,
        category: "Debt Management",
        tags: ["debt", "credit cards", "personal finance"],
        region: "global",
        riskProfile: "conservative" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Portfolio Rebalancing: When and How to Adjust Your Investments",
        excerpt: "Learn when to rebalance your portfolio, how to maintain target allocations, and strategies to minimize taxes and transaction costs.",
        content: "Portfolio rebalancing maintains your target asset allocation as markets fluctuate. Review quarterly or when allocations drift 5% from targets. Rebalance by selling winners and buying losers—counterintuitive but effective. Consider tax implications: use tax-advantaged accounts when possible. Rebalance with new contributions to reduce transaction costs. Set bands: rebalance when stocks exceed 60% or fall below 40% of portfolio, for example. Use target-date funds for automatic rebalancing. Consider your risk tolerance: more aggressive investors may rebalance less frequently. Factor in transaction fees: frequent rebalancing can erode returns. Review asset allocation annually based on life changes. Stay disciplined: emotions can derail rebalancing plans.",
        author: "Hanan Al-Ghamdi",
        publishedAt: new Date("2024-05-22").toISOString(),
        readTime: 8,
        category: "Investing",
        tags: ["portfolio", "rebalancing", "asset allocation"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "intermediate" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Tax-Efficient Investing Strategies for Saudi Residents",
        excerpt: "Maximize after-tax returns through tax-efficient investment strategies, account types, and timing of transactions in Saudi Arabia.",
        content: "Saudi Arabia offers tax advantages for residents. No personal income tax means more disposable income for investing. Capital gains on listed stocks are tax-free for individuals. Dividends from Saudi companies are generally tax-free. Consider tax-loss harvesting: sell losing positions to offset gains. Time transactions to optimize tax outcomes. Use tax-advantaged accounts when available. Understand withholding taxes on foreign investments. Keep detailed records of transactions for tax reporting. Consult tax advisors for complex situations. Plan for potential future tax changes. Consider international tax implications if investing abroad. Maximize tax-free investment opportunities while they exist.",
        author: "Faisal Al-Shammari",
        publishedAt: new Date("2024-06-05").toISOString(),
        readTime: 9,
        category: "Tax Planning",
        tags: ["tax", "investing", "saudi arabia", "tax efficiency"],
        region: "saudi",
        riskProfile: "moderate" as const,
        financialLevel: "advanced" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Starting Your Investment Journey: First Steps for Young Professionals",
        excerpt: "A beginner-friendly guide to starting investments with limited capital. Learn about index funds, robo-advisors, and building wealth over time.",
        content: "Starting early gives you the power of compound interest. Begin with small amounts: even 500 SAR monthly adds up. Open a brokerage account with low minimums. Start with index funds: they're diversified and low-cost. Consider robo-advisors for automated investing. Set up automatic transfers: pay yourself first. Invest consistently regardless of market conditions. Don't try to time the market. Focus on long-term goals: retirement is decades away. Avoid high-fee investments. Educate yourself continuously. Join investment communities. Track your progress. Increase contributions as income grows. Stay patient: wealth building takes time. Avoid emotional decisions during market volatility.",
        author: "Reem Al-Dosari",
        publishedAt: new Date("2024-06-18").toISOString(),
        readTime: 6,
        category: "Investing",
        tags: ["beginner", "investing", "young professionals", "index funds"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Understanding Zakat: Financial Obligations and Investment Implications",
        excerpt: "Learn how Zakat affects your investments, savings, and financial planning in Saudi Arabia and the broader Islamic finance context.",
        content: "Zakat is one of the five pillars of Islam, requiring Muslims to give 2.5% of their wealth annually to those in need. For financial planning, calculate Zakat on: cash, gold, silver, stocks, business assets, and rental properties. Investment accounts and savings are subject to Zakat. Exemptions include: primary residence, personal vehicles, and business equipment. Calculate Zakat annually based on lunar calendar. Many financial institutions offer Zakat calculation services. Consider Zakat when planning investments: some prefer Zakat-exempt assets. Set aside Zakat funds monthly to avoid year-end burden. Consult Islamic scholars for complex situations. Zakat is both a religious obligation and a form of wealth purification.",
        author: "Dr. Ibrahim Al-Mutawa",
        publishedAt: new Date("2024-07-01").toISOString(),
        readTime: 8,
        category: "Islamic Finance",
        tags: ["zakat", "islamic finance", "saudi arabia", "tax planning"],
        region: "saudi",
        riskProfile: "conservative" as const,
        financialLevel: "intermediate" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Mutual Funds vs ETFs: Choosing the Right Investment Vehicle",
        excerpt: "Compare mutual funds and ETFs to understand fees, liquidity, tax implications, and which suits your investment strategy.",
        content: "Mutual funds and ETFs both offer diversification but differ in key ways. ETFs trade like stocks throughout the day; mutual funds price once daily. ETFs typically have lower expense ratios (0.03-0.50% vs 0.50-1.50% for mutual funds). ETFs are more tax-efficient due to in-kind redemptions. Mutual funds may have minimum investments ($1,000-$5,000). ETFs require brokerage account; mutual funds can be bought directly. Consider your investment style: active traders prefer ETFs; buy-and-hold investors may prefer mutual funds. Both offer index and actively managed options. Research expense ratios carefully—they compound over time. Consider tax implications in your jurisdiction. Start with low-cost index funds or ETFs for broad market exposure.",
        author: "Maha Al-Shehri",
        publishedAt: new Date("2024-07-15").toISOString(),
        readTime: 7,
        category: "Investing",
        tags: ["mutual funds", "etf", "investing", "diversification"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "intermediate" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Dollar-Cost Averaging: Building Wealth Through Consistent Investing",
        excerpt: "Learn how investing fixed amounts regularly reduces market timing risk and helps build long-term wealth automatically.",
        content: "Dollar-cost averaging (DCA) involves investing fixed amounts at regular intervals regardless of market conditions. Benefits: removes emotion from investing, reduces impact of market volatility, builds discipline. Example: invest 1,000 SAR monthly in index fund. When prices are high, you buy fewer shares; when low, you buy more—averaging out costs. DCA works best for long-term goals (5+ years). Set up automatic transfers to make it effortless. Choose low-cost index funds or ETFs for DCA. Review and adjust amounts annually as income grows. Don't stop DCA during market downturns—that's when it's most valuable. Combine DCA with periodic rebalancing. Track your progress but avoid checking daily. DCA is simple but powerful: time in market beats timing the market.",
        author: "Khalid Al-Zahrani",
        publishedAt: new Date("2024-08-01").toISOString(),
        readTime: 6,
        category: "Investing",
        tags: ["dollar cost averaging", "investing strategy", "long-term investing"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Private Banking Services for Ultra High Net Worth Individuals",
        excerpt: "Explore exclusive private banking services, wealth management strategies, and bespoke investment solutions for UHNW clients.",
        content: "Private banking serves ultra high net worth individuals (typically 5M+ USD) with personalized financial services. Services include: dedicated relationship managers, custom investment portfolios, estate planning, tax optimization, alternative investments (private equity, hedge funds), credit solutions, family office services. Benefits: personalized attention, access to exclusive investments, comprehensive wealth planning. Consider fees: typically 1-2% of assets under management. Evaluate banks: reputation, track record, service quality, global reach. Private banking isn't just for investments—it's holistic wealth management. Look for banks with strong Islamic finance capabilities if that's important. Interview multiple banks before choosing. Ensure alignment with your values and goals. Private banking is a long-term relationship, not a transaction.",
        author: "Sultan Al-Qasimi",
        publishedAt: new Date("2024-08-20").toISOString(),
        readTime: 11,
        category: "Wealth Management",
        tags: ["private banking", "wealth management", "uhnw", "high net worth"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "advanced" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "en" as const,
        title: "Behavioral Finance: Understanding Your Money Psychology",
        excerpt: "Discover how cognitive biases affect financial decisions and learn strategies to make more rational investment choices.",
        content: "Behavioral finance studies how psychology influences financial decisions. Common biases: loss aversion (fearing losses more than valuing gains), confirmation bias (seeking information that confirms beliefs), herd mentality (following the crowd), anchoring (relying too heavily on first information), overconfidence (overestimating abilities). Impact: leads to poor timing, excessive trading, holding losers too long, selling winners too early. Strategies: create investment plan and stick to it, automate decisions, review portfolio quarterly not daily, seek diverse perspectives, acknowledge emotions but don't let them drive decisions, use dollar-cost averaging, set clear goals, work with financial advisor for objectivity. Understanding biases is first step to overcoming them.",
        author: "Dr. Lina Al-Mansour",
        publishedAt: new Date("2024-09-05").toISOString(),
        readTime: 9,
        category: "Psychology",
        tags: ["behavioral finance", "psychology", "investing", "decision making"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "intermediate" as const,
        plan: "pro" as const,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const articlesAr = [
      {
        language: "ar" as const,
        title: "بناء صندوق الطوارئ الأول في السعودية",
        excerpt: "خطوات عملية لبناء صندوق طوارئ مناسب للسوق السعودي، مع أرقام واقعية بالريال.",
        content:
          "صندوق الطوارئ هو شبكة الأمان المالية. غالبًا ما يُنصح بتغطية 3–6 أشهر من المصروفات. ابدأ بتحديد مصروفاتك الشهرية ثم ضع هدفًا مرحليًا (مثلاً شهر واحد) قبل الوصول للهدف الكامل. خصص مبلغًا ثابتًا شهريًا وافعله تلقائيًا عبر تحويل بنكي. اجعل الحساب منفصلًا لتقليل الإغراء. راجع الهدف كل 3 أشهر وحدثه مع تغير الدخل أو الالتزامات.",
        author: "أحمد الراشد",
        publishedAt: new Date("2024-01-15").toISOString(),
        readTime: 6,
        category: "الادخار",
        tags: ["صندوق الطوارئ", "الادخار", "السعودية"],
        region: "saudi",
        riskProfile: "conservative" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "ar" as const,
        title: "إدارة الديون: الخروج من ديون بطاقات الائتمان",
        excerpt: "طرق عملية لسداد ديون البطاقات مثل كرة الثلج أو الانهيار، مع خطوات قابلة للتطبيق.",
        content:
          "ابدأ بحصر كل الديون: الرصيد، نسبة/تكلفة التمويل، والحد الأدنى للسداد. اختر منهجًا واضحًا: (كرة الثلج) سداد الأصغر أولًا لتعزيز الدافع، أو (الانهيار) سداد الأعلى تكلفة أولًا لتقليل الإجمالي. أوقف استخدام البطاقات مؤقتًا حتى تستقر الخطة. خفّض المصروفات المتغيرة ووجّه الفرق للديون. راجع تقدمك شهريًا وعدّل الخطة بدلًا من تغييرها بالكامل.",
        author: "ماجد العتيبي",
        publishedAt: new Date("2024-05-10").toISOString(),
        readTime: 8,
        category: "إدارة الديون",
        tags: ["الديون", "بطاقات الائتمان", "الميزانية"],
        region: "global",
        riskProfile: "conservative" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "ar" as const,
        title: "متوسط التكلفة: بناء الثروة عبر استثمار منتظم",
        excerpt: "كيف يساعد الاستثمار بمبلغ ثابت دوريًا على تقليل أثر توقيت السوق وبناء انضباط مالي.",
        content:
          "متوسط التكلفة (DCA) يعني استثمار مبلغ ثابت بشكل دوري بدل محاولة اختيار أفضل توقيت. عند ارتفاع الأسعار تشتري وحدات أقل، وعند انخفاضها تشتري وحدات أكثر، ما قد يخفف أثر تقلبات الدخول. الفكرة ليست ضمان أرباح، بل إنشاء سلوك استثماري منضبط وتقليل قرارات التوقيت العاطفية. اختر نسبة مناسبة من دخلك، ثم راجعها كل 6–12 شهرًا وفقًا لالتزاماتك.",
        author: "خالد الزهراني",
        publishedAt: new Date("2024-08-01").toISOString(),
        readTime: 7,
        category: "الاستثمار",
        tags: ["الاستثمار", "الادخار", "الانضباط"],
        region: "global",
        riskProfile: "moderate" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        language: "ar" as const,
        title: "فهم تداول: دليل مبسط للمبتدئين في سوق الأسهم السعودي",
        excerpt: "مدخل مبسط لتداول: ما هو، أهم المؤشرات، وكيف تبدأ بخطوات محسوبة.",
        content:
          "تداول هو سوق الأسهم السعودي ويضم شركات كبرى. قبل البدء، ركز على الأساسيات: تحديد الهدف الزمني، توزيع المخاطر، وتجنب التركيز في سهم واحد. للمبتدئين، قد تكون المنتجات المتنوعة أقل تقلبًا من اختيار أسهم فردية. راقب المصروفات والرسوم، وتأكد من التعامل مع وسيط مرخّص. الأهم هو بناء خطة واضحة والالتزام بها بدل اتخاذ قرارات سريعة بسبب حركة السوق اليومية.",
        author: "فاطمة الزهراء",
        publishedAt: new Date("2024-02-01").toISOString(),
        readTime: 8,
        category: "الاستثمار",
        tags: ["تداول", "الأسهم", "السعودية"],
        region: "saudi",
        riskProfile: "moderate" as const,
        financialLevel: "beginner" as const,
        plan: "free" as const,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const toInsert = [
      ...(hasEn ? [] : articlesEn),
      ...(hasAr ? [] : articlesAr),
    ];

    // Insert missing set(s)
    const insertedIds = [];
    for (const article of toInsert) {
      const id = await ctx.db.insert("articles", article);
      insertedIds.push(id);
    }

    return {
      success: true,
      count: insertedIds.length,
      message: `Successfully seeded ${insertedIds.length} articles`,
    };
  },
});

/**
 * Admin: Create a new article
 */
export const createArticle = mutation({
  args: {
    language: v.optional(v.union(v.literal("en"), v.literal("ar"))),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    author: v.string(),
    publishedAt: v.string(),
    readTime: v.number(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    region: v.optional(v.string()),
    riskProfile: v.optional(v.union(v.literal("conservative"), v.literal("moderate"), v.literal("aggressive"))),
    financialLevel: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const articleId = await ctx.db.insert("articles", {
      language: args.language || "en",
      title: args.title,
      excerpt: args.excerpt,
      content: args.content,
      author: args.author,
      publishedAt: args.publishedAt,
      readTime: args.readTime,
      category: args.category,
      tags: args.tags || [],
      region: args.region,
      riskProfile: args.riskProfile,
      financialLevel: args.financialLevel,
      plan: args.plan || "free",
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, articleId };
  },
});

/**
 * Admin: Update an existing article
 */
export const updateArticle = mutation({
  args: {
    articleId: v.id("articles"),
    language: v.optional(v.union(v.literal("en"), v.literal("ar"))),
    title: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    author: v.optional(v.string()),
    publishedAt: v.optional(v.string()),
    readTime: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    region: v.optional(v.string()),
    riskProfile: v.optional(v.union(v.literal("conservative"), v.literal("moderate"), v.literal("aggressive"))),
    financialLevel: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  },
  handler: async (ctx, args) => {
    const { articleId, ...updates } = args;
    const article = await ctx.db.get(articleId);
    if (!article) {
      throw new Error("Article not found");
    }
    await ctx.db.patch(articleId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

/**
 * Admin: Delete an article
 */
export const deleteArticle = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.articleId);
    return { success: true };
  },
});

/**
 * Admin: Get all articles (for admin interface)
 */
export const getAllArticles = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published")
      .order("desc")
      .collect();
    return articles;
  },
});