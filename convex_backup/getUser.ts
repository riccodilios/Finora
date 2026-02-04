// Make sure the correct path is used and the module is generated
import { query, QueryCtx } from "../convex/_generated/server";

export const getUser = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    
    return user;
  },
});
