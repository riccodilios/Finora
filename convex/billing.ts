import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { safeLog, safeError } from "./lib/log_masking";

/**
 * BILLING FUNCTIONS - Isolated from Financial Analytics
 * 
 * COMPLIANCE RULES:
 * - Only stores: subscription status, plan type, billing period
 * - NO card data, tokens, or payment details stored
 * - Receipts labeled as "service subscription fees"
 * - Billing system fully separated from financial analytics
 * - Prevents future expansion into money handling
 */

/**
 * Update subscription from payment webhook
 * ONLY updates subscription status, plan, billing period
 * NO payment details stored beyond what's needed for subscription management
 */
export const updateSubscriptionFromPayment = mutation({
  args: {
    clerkUserId: v.string(),
    moyasarPaymentId: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
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

    // Record payment (minimal data - only for subscription tracking)
    // NO card data, tokens, or sensitive payment details stored
    await ctx.db.insert("payments", {
      clerkUserId: args.clerkUserId,
      moyasarPaymentId: args.moyasarPaymentId,
      amount: args.amount,
      currency: args.currency,
      status: "paid",
      timestamp: args.timestamp,
      processedAt: new Date().toISOString(),
    });

    // Calculate period end date based on billing cycle
    const now = new Date();
    const days = args.billingCycle === "annual" ? 365 : 30;
    const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Update user plan
    await ctx.db.patch(user._id, {
      plan: "pro",
      upgradedAt: now.toISOString(),
      lastPaymentId: args.moyasarPaymentId,
      updatedAt: now.toISOString(),
    });

    // Update or create subscription
    // ONLY stores: status, plan type, billing period
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (subscription) {
      // Update existing subscription
      await ctx.db.patch(subscription._id, {
        plan: "pro",
        status: "active",
        billingCycle: args.billingCycle,
        currentPeriodEndsAt: periodEnd.toISOString(),
        trialEndsAt: undefined,
        updatedAt: now.toISOString(),
      });
    } else {
      // Create subscription if it doesn't exist
      await ctx.db.insert("subscriptions", {
        clerkUserId: args.clerkUserId,
        plan: "pro",
        status: "active",
        billingCycle: args.billingCycle,
        currentPeriodEndsAt: periodEnd.toISOString(),
        aiChatsUsed: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    // Log plan change
    await ctx.db.insert("planChanges", {
      clerkUserId: args.clerkUserId,
      fromPlan: user.plan,
      toPlan: "pro",
      paymentId: args.moyasarPaymentId,
      changedAt: now.toISOString(),
    });

    safeLog("Subscription updated from payment", {
      clerkUserId: args.clerkUserId,
      billingCycle: args.billingCycle,
    });

    return { success: true };
  },
});

/**
 * Handle payment failure
 * Updates subscription status when payment fails
 */
export const handlePaymentFailure = mutation({
  args: {
    clerkUserId: v.string(),
    moyasarPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!subscription) {
      safeLog("Subscription not found for payment failure", {
        clerkUserId: args.clerkUserId,
      });
      return { success: false };
    }

    // Check if payment period has expired
    const now = new Date();
    const periodEnd = subscription.currentPeriodEndsAt
      ? new Date(subscription.currentPeriodEndsAt)
      : null;

    if (periodEnd && now > periodEnd) {
      // Period has expired, mark subscription as expired
      await ctx.db.patch(subscription._id, {
        status: "expired",
        updatedAt: now.toISOString(),
      });

      // Downgrade user to free plan
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) =>
          q.eq("clerkUserId", args.clerkUserId)
        )
        .first();

      if (user) {
        await ctx.db.patch(user._id, {
          plan: "free",
          updatedAt: now.toISOString(),
        });
      }

      safeLog("Subscription expired due to payment failure", {
        clerkUserId: args.clerkUserId,
      });
    } else {
      // Period not expired yet, just log the failure
      // Subscription remains active until period end
      safeLog("Payment failure logged, subscription still active", {
        clerkUserId: args.clerkUserId,
        moyasarPaymentId: args.moyasarPaymentId,
      });
    }

    return { success: true };
  },
});

/**
 * Get subscription billing history
 * Returns only payment records (no card data, tokens, or sensitive details)
 */
export const getBillingHistory = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .order("desc")
      .collect();

    // Return only safe data (no sensitive payment details)
    return payments.map((payment) => ({
      id: payment._id,
      moyasarPaymentId: payment.moyasarPaymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      timestamp: payment.timestamp,
      processedAt: payment.processedAt,
      // NO card data, tokens, or sensitive details returned
    }));
  },
});
