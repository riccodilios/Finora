import { v } from "convex/values";
import { mutation } from "./_generated/server";

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

    await ctx.db.patch(user._id, {
      plan: args.newPlan,
    });

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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    if (user.plan === "pro") {
      console.log(`User ${args.clerkUserId} already Pro, skipping upgrade`);
      return user._id;
    }

    await ctx.db.patch(user._id, {
      plan: "pro",
      upgradedAt: new Date().toISOString(),
      lastPaymentId: args.moyasarPaymentId,
    });

    return user._id;
  },
});
