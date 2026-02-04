import { v } from "convex/values";
import { mutation, query } from "convex/_generated/server";

export const recordPayment = mutation({
  args: {
    clerkUserId: v.string(),
    moyasarPaymentId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx: any, args: any) => {  // ADDED TYPE ANNOTATIONS
    // First, check if payment already exists
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_moyasar_id", (q: any) =>  // ADDED TYPE
        q.eq("moyasarPaymentId", args.moyasarPaymentId)
      )
      .first();

    if (existing) {
      console.log(`Payment ${args.moyasarPaymentId} already recorded`);
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
  handler: async (ctx: any, args: any) => {  // ADDED TYPE
    return await ctx.db
      .query("payments")
      .withIndex("by_moyasar_id", (q: any) =>  // ADDED TYPE
        q.eq("moyasarPaymentId", args.moyasarId)
      )
      .first();
  },
});