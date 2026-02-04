import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { safeLog, safeError } from "./lib/log_masking";

/**
 * ADMIN FUNCTIONS
 * 
 * Functions for admin users to manage other users and subscriptions
 */

/**
 * Check if user is admin
 * Main admin user (user_38vftq2ScgNF9AEmYVnswcUuVpH) is always admin
 */
export const isAdmin = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    // Main admin user is always admin
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const normalizedUserId = (args.clerkUserId || "").trim();
    const normalizedMainAdminId = MAIN_ADMIN_USER_ID.trim();
    
    if (normalizedUserId === normalizedMainAdminId) {
      // Main admin is always admin - no database check needed
      // Note: The admin flag will be set by createOrUpdateUser mutation on sign-in
      return true;
    }
    
    // Check other users
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", normalizedUserId))
      .first();
    
    return user?.isAdmin === true;
  },
});

/**
 * Get all users (admin only)
 */
export const getAllUsers = query({
  args: { adminUserId: v.string() },
  handler: async (ctx, args) => {
    // Verify admin (main admin user is always admin)
    // CRITICAL: Check main admin FIRST before any database queries
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    
    // Normalize user ID - remove any whitespace and ensure exact match
    const normalizedAdminUserId = (args.adminUserId || "").trim();
    const normalizedMainAdminId = MAIN_ADMIN_USER_ID.trim();
    const isMainAdmin = normalizedAdminUserId === normalizedMainAdminId;
    
    // If main admin, grant access immediately - don't check database
    if (isMainAdmin) {
      safeLog("Main admin access granted immediately", { 
        adminUserId: args.adminUserId,
        normalizedAdminUserId 
      });
      
      // Note: We can't patch in a query, but main admin always has access
      // The admin flag will be set by createOrUpdateUser mutation on sign-in
      
      // Main admin always has access - proceed to fetch users
      // Skip the else block entirely for main admin
      const users = await ctx.db.query("users").collect();
      const subscriptions = await ctx.db.query("subscriptions").collect();

      // Combine user data with subscription data
      return users.map((user) => {
        const subscription = subscriptions.find(
          (sub) => sub.clerkUserId === user.clerkUserId
        );
        
        return {
          _id: user._id,
          clerkUserId: user.clerkUserId,
          email: user.email,
          plan: subscription?.plan || user.plan || "free",
          status: subscription?.status || (user.plan === "pro" ? "active" : "trial"),
          isAdmin: user.isAdmin || false,
          createdAt: user.createdAt,
          upgradedAt: user.upgradedAt,
        };
      });
    }
    
    // Only check database for non-main-admin users
    // Check other users
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", normalizedAdminUserId))
      .first();
    
    if (!admin || admin.isAdmin !== true) {
      safeError("Unauthorized admin access attempt", { 
        adminUserId: args.adminUserId,
        normalizedAdminUserId,
        adminFound: !!admin,
        adminIsAdmin: admin?.isAdmin,
        expectedMainAdmin: MAIN_ADMIN_USER_ID,
        isMainAdminCheck: normalizedAdminUserId === MAIN_ADMIN_USER_ID
      });
      throw new Error("Unauthorized: Admin access required");
    }

    // Fetch users for non-main-admin users (main admin already returned above)
    const users = await ctx.db.query("users").collect();
    const subscriptions = await ctx.db.query("subscriptions").collect();

    // Combine user data with subscription data
    return users.map((user) => {
      const subscription = subscriptions.find(
        (sub) => sub.clerkUserId === user.clerkUserId
      );
      
      return {
        _id: user._id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        plan: subscription?.plan || user.plan || "free",
        status: subscription?.status || (user.plan === "pro" ? "active" : "trial"),
        isAdmin: user.isAdmin || false,
        createdAt: user.createdAt,
        upgradedAt: user.upgradedAt,
      };
    });
  },
});

/**
 * Update user plan (admin only)
 */
export const updateUserPlan = mutation({
  args: {
    adminUserId: v.string(),
    targetUserId: v.string(),
    newPlan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, args) => {
    // Verify admin (main admin user is always admin)
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const isMainAdmin = args.adminUserId === MAIN_ADMIN_USER_ID;
    
    if (!isMainAdmin) {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.adminUserId))
        .first();
      
      if (!admin || admin.isAdmin !== true) {
        throw new Error("Unauthorized: Admin access required");
      }
    }

    // Find target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.targetUserId))
      .first();

    if (!targetUser) {
      throw new Error("User not found");
    }

    const now = new Date().toISOString();

    // Update user plan
    await ctx.db.patch(targetUser._id, {
      plan: args.newPlan,
      upgradedAt: args.newPlan === "pro" ? now : undefined,
      updatedAt: now,
    });

    // Update or create subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.targetUserId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        plan: args.newPlan,
        status: args.newPlan === "pro" ? "active" : "trial",
        currentPeriodEndsAt: args.newPlan === "pro" 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        clerkUserId: args.targetUserId,
        plan: args.newPlan,
        status: args.newPlan === "pro" ? "active" : "trial",
        billingCycle: "monthly",
        currentPeriodEndsAt: args.newPlan === "pro" 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        aiChatsUsed: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Log plan change
    await ctx.db.insert("planChanges", {
      clerkUserId: args.targetUserId,
      fromPlan: targetUser.plan,
      toPlan: args.newPlan,
      changedAt: now,
    });

    safeLog("Admin updated user plan", {
      adminUserId: args.adminUserId,
      targetUserId: args.targetUserId,
      newPlan: args.newPlan,
    });

    return { success: true };
  },
});

/**
 * Toggle admin status (admin only)
 */
export const toggleAdminStatus = mutation({
  args: {
    adminUserId: v.string(),
    targetUserId: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Verify admin (main admin user is always admin)
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const isMainAdmin = args.adminUserId === MAIN_ADMIN_USER_ID;
    
    if (!isMainAdmin) {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.adminUserId))
        .first();
      
      if (!admin || admin.isAdmin !== true) {
        throw new Error("Unauthorized: Admin access required");
      }
    }

    // Prevent self-demotion (main admin cannot be demoted)
    if (args.adminUserId === MAIN_ADMIN_USER_ID && !args.isAdmin) {
      throw new Error("Cannot remove main admin status");
    }
    
    // Prevent self-demotion
    if (args.adminUserId === args.targetUserId && !args.isAdmin) {
      throw new Error("Cannot remove your own admin status");
    }

    // Find target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.targetUserId))
      .first();

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Update admin status
    await ctx.db.patch(targetUser._id, {
      isAdmin: args.isAdmin,
      updatedAt: new Date().toISOString(),
    });

    safeLog("Admin toggled user admin status", {
      adminUserId: args.adminUserId,
      targetUserId: args.targetUserId,
      isAdmin: args.isAdmin,
    });

    return { success: true };
  },
});

/**
 * Admin: Get all articles (for admin interface)
 */
export const getAllArticles = query({
  args: { adminUserId: v.string() },
  handler: async (ctx, args) => {
    // Verify admin (main admin user is always admin)
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const isMainAdmin = args.adminUserId === MAIN_ADMIN_USER_ID;
    
    if (!isMainAdmin) {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.adminUserId))
        .first();
      
      if (!admin || admin.isAdmin !== true) {
        throw new Error("Unauthorized: Admin access required");
      }
    }

    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published")
      .order("desc")
      .collect();
    return articles;
  },
});

/**
 * Admin: Create article
 */
export const createArticle = mutation({
  args: {
    adminUserId: v.string(),
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
    // Verify admin
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const isMainAdmin = args.adminUserId === MAIN_ADMIN_USER_ID;
    
    if (!isMainAdmin) {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.adminUserId))
        .first();
      
      if (!admin || admin.isAdmin !== true) {
        throw new Error("Unauthorized: Admin access required");
      }
    }

    const now = new Date().toISOString();
    const { adminUserId, ...articleData } = args;
    const articleId = await ctx.db.insert("articles", {
      language: articleData.language || "en",
      title: articleData.title,
      excerpt: articleData.excerpt,
      content: articleData.content,
      author: articleData.author,
      publishedAt: articleData.publishedAt,
      readTime: articleData.readTime,
      category: articleData.category,
      tags: articleData.tags || [],
      region: articleData.region,
      riskProfile: articleData.riskProfile,
      financialLevel: articleData.financialLevel,
      plan: articleData.plan || "free",
      createdAt: now,
      updatedAt: now,
    });
    
    safeLog("Admin created article", {
      adminUserId: args.adminUserId,
      articleId,
      title: args.title,
    });
    
    return { success: true, articleId };
  },
});

/**
 * Admin: Update article
 */
export const updateArticle = mutation({
  args: {
    adminUserId: v.string(),
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
    // Verify admin
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const isMainAdmin = args.adminUserId === MAIN_ADMIN_USER_ID;
    
    if (!isMainAdmin) {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.adminUserId))
        .first();
      
      if (!admin || admin.isAdmin !== true) {
        throw new Error("Unauthorized: Admin access required");
      }
    }

    const { adminUserId, articleId, ...updates } = args;
    const article = await ctx.db.get(articleId);
    if (!article) {
      throw new Error("Article not found");
    }
    
    await ctx.db.patch(articleId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    safeLog("Admin updated article", {
      adminUserId: args.adminUserId,
      articleId,
    });
    
    return { success: true };
  },
});

/**
 * Admin: Delete article
 */
export const deleteArticle = mutation({
  args: {
    adminUserId: v.string(),
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
    const isMainAdmin = args.adminUserId === MAIN_ADMIN_USER_ID;
    
    if (!isMainAdmin) {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.adminUserId))
        .first();
      
      if (!admin || admin.isAdmin !== true) {
        throw new Error("Unauthorized: Admin access required");
      }
    }

    await ctx.db.delete(args.articleId);
    
    safeLog("Admin deleted article", {
      adminUserId: args.adminUserId,
      articleId: args.articleId,
    });
    
    return { success: true };
  },
});
