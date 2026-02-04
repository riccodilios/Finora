import { v } from "convex/values";
import { mutation } from "convex/_generated/server";

export const createOrUpdateUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
  },
  handler: async (ctx: any, args: any) => {  // ADDED TYPE
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q: any) =>  // ADDED TYPE
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (existingUser) {
      // Update email if changed
      if (existingUser.email !== args.email) {
        await ctx.db.patch(existingUser._id, {
          email: args.email,
          updatedAt: new Date().toISOString(),
        });
      }
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      plan: "free", // Default to free plan
      createdAt: new Date().toISOString(),
    });

    return userId;
  },
});