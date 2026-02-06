import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    upgradedAt: v.optional(v.string()),
    lastPaymentId: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()), // Admin role flag
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_plan", ["plan"])
    .index("by_is_admin", ["isAdmin"]),

  payments: defineTable({
    clerkUserId: v.string(),
    moyasarPaymentId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    timestamp: v.string(),
    processedAt: v.string(),
  })
    .index("by_moyasar_id", ["moyasarPaymentId"])
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_status", ["status"]),

  planChanges: defineTable({
    clerkUserId: v.string(),
    fromPlan: v.string(),
    toPlan: v.string(),
    paymentId: v.optional(v.string()),
    changedAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // NEW: User Financial Profiles
  // SECURITY: Financial fields (monthlyIncome, monthlyExpenses, netWorth, emergencyFund*) are encrypted
  // They are stored as strings (encrypted) but validated as numbers in functions
  userProfiles: defineTable({
    clerkUserId: v.string(),
    riskTolerance: v.union(v.literal("conservative"), v.literal("moderate"), v.literal("aggressive")),
    profileTags: v.array(v.string()),
    financialGoals: v.array(v.string()),
    monthlyIncome: v.optional(v.union(v.number(), v.string())), // Can be number (legacy) or string (encrypted)
    monthlyExpenses: v.optional(v.union(v.number(), v.string())), // Can be number (legacy) or string (encrypted)
    netWorth: v.optional(v.union(v.number(), v.string())), // Can be number (legacy) or string (encrypted)
    emergencyFundGoal: v.optional(v.union(v.number(), v.string())), // Can be number (legacy) or string (encrypted)
    emergencyFundCurrent: v.optional(v.union(v.number(), v.string())), // Can be number (legacy) or string (encrypted)
    expensesByCategory: v.optional(v.string()), // JSON string
    isOnboarded: v.optional(v.boolean()), // Optional to handle existing records without this field
    updatedAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // Centralized Financial Profile - Detailed financial data structure
  financialProfiles: defineTable({
    clerkUserId: v.string(),
    // Income Sources: array of income entries
    incomeSources: v.array(
      v.object({
        id: v.string(), // Unique ID for this income source
        name: v.string(), // e.g., "Salary", "Freelance", "Rental Income"
        amount: v.number(), // Monthly amount
        type: v.union(v.literal("salary"), v.literal("freelance"), v.literal("rental"), v.literal("investment"), v.literal("other")),
        isRecurring: v.boolean(),
      })
    ),
    // Expenses: array of expense entries (fixed and variable)
    expenses: v.array(
      v.object({
        id: v.string(),
        name: v.string(), // e.g., "Rent", "Groceries", "Utilities"
        amount: v.number(), // Monthly amount
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
    ),
    // Debts: array of debt entries
    debts: v.array(
      v.object({
        id: v.string(),
        name: v.string(), // e.g., "Credit Card", "Student Loan", "Mortgage"
        principal: v.number(), // Total amount owed
        monthlyPayment: v.number(), // Monthly payment amount
        interestRate: v.optional(v.number()), // Annual interest rate (percentage)
        type: v.union(
          v.literal("credit_card"),
          v.literal("personal_loan"),
          v.literal("student_loan"),
          v.literal("mortgage"),
          v.literal("car_loan"),
          v.literal("other")
        ),
      })
    ),
    // Investments: array of investment entries
    investments: v.array(
      v.object({
        id: v.string(),
        name: v.string(), // e.g., "Stocks", "Bonds", "Real Estate"
        value: v.number(), // Current value
        type: v.union(
          v.literal("stocks"),
          v.literal("bonds"),
          v.literal("real_estate"),
          v.literal("crypto"),
          v.literal("mutual_funds"),
          v.literal("other")
        ),
        monthlyContribution: v.optional(v.number()), // Monthly contribution if applicable
      })
    ),
    // Savings: emergency fund and other savings
    savings: v.object({
      emergencyFundCurrent: v.number(),
      emergencyFundGoal: v.number(),
      otherSavings: v.optional(v.number()), // Other savings accounts
    }),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // User Preferences (separated from Financial Profile)
  userPreferences: defineTable({
    clerkUserId: v.string(),
    language: v.union(v.literal("en"), v.literal("ar")),
    theme: v.union(v.literal("light"), v.literal("dark")),
    // Optional: Arabic display name for better localization (Clerk name may be Latin)
    displayNameAr: v.optional(v.string()),
    region: v.optional(v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"))),
    currency: v.optional(v.union(v.literal("SAR"), v.literal("AED"), v.literal("USD"))),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // NEW: Financial Metrics History
  financialMetrics: defineTable({
    clerkUserId: v.string(),
    month: v.string(), // Format: "YYYY-MM"
    income: v.number(),
    expenses: v.number(),
    savings: v.number(),
    netWorth: v.number(),
    createdAt: v.string(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_month", ["clerkUserId", "month"]),

  // Unified Subscription Entity
  subscriptions: defineTable({
    clerkUserId: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    status: v.union(v.literal("trial"), v.literal("active"), v.literal("cancelled"), v.literal("expired")),
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    trialEndsAt: v.optional(v.string()),
    currentPeriodEndsAt: v.optional(v.string()),
    aiChatsUsed: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // AI Insights generated by Google Gemini (user-triggered)
  aiInsights: defineTable({
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
        whyExplanation: v.optional(v.string()), // "Why am I seeing this?" explanation
      })
    ),
    createdAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // Automatic Financial Insights (auto-generated when data changes)
  financialInsights: defineTable({
    clerkUserId: v.string(),
    insights: v.array(
      v.object({
        title: v.string(),
        summary: v.string(), // Short insight (2-3 sentences)
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
    dataHash: v.string(), // Hash of financial data to detect changes
    createdAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // AI Conversations table for chat history
  aiConversations: defineTable({
    clerkUserId: v.string(),
    messages: v.array(
      v.object({
        role: v.string(), // "user" | "assistant" | "system"
        content: v.string(),
        timestamp: v.string(), // ISO timestamp
      })
    ),
    rollingSummary: v.optional(v.string()), // Rolling summary of conversation
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  // Articles table for financial education content
  articles: defineTable({
    language: v.optional(v.union(v.literal("en"), v.literal("ar"))),
    title: v.string(),
    excerpt: v.string(), // Short summary for list view
    content: v.string(), // Full article content
    author: v.string(),
    publishedAt: v.string(), // ISO timestamp
    readTime: v.number(), // Minutes
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Filtering fields
    region: v.optional(v.string()), // e.g., "saudi", "global", "uae", etc.
    riskProfile: v.optional(
      v.union(v.literal("conservative"), v.literal("moderate"), v.literal("aggressive"))
    ), // Target risk profile
    financialLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ), // Target financial level
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))), // Access level: free or pro
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_published", ["publishedAt"])
    .index("by_region", ["region"])
    .index("by_risk_profile", ["riskProfile"])
    .index("by_financial_level", ["financialLevel"])
    .index("by_plan", ["plan"]),

  // GDPR Compliance: Consent Flags
  consentFlags: defineTable({
    clerkUserId: v.string(),
    // Explicit consent flags
    onboardingDataConsent: v.boolean(), // Consent to store onboarding financial data
    aiAnalysisConsent: v.boolean(), // Consent to use data for AI analysis
    marketingConsent: v.optional(v.boolean()), // Optional marketing consent
    // Metadata
    consentVersion: v.string(), // Version of consent terms (for tracking changes)
    consentedAt: v.string(), // ISO timestamp when consent was given
    lastUpdatedAt: v.string(), // ISO timestamp when consent was last updated
    ipAddress: v.optional(v.string()), // IP address when consent was given (for audit)
    userAgent: v.optional(v.string()), // User agent when consent was given
  })
    .index("by_clerk_user_id", ["clerkUserId"]),

  // GDPR Compliance: Immutable Audit Logs (append-only, never modified)
  auditLogs: defineTable({
    // Actor information
    actorId: v.string(), // Clerk user ID of person performing action
    actorType: v.union(v.literal("user"), v.literal("admin"), v.literal("system")), // Type of actor
    // Target information
    targetUserId: v.string(), // User whose data is being accessed/modified
    // Action details
    action: v.union(
      v.literal("data_access"), // Data was accessed
      v.literal("data_export"), // Data was exported
      v.literal("data_deletion_soft"), // Account marked for deletion (soft)
      v.literal("data_deletion_hard"), // Account permanently deleted (hard)
      v.literal("consent_given"), // Consent was granted
      v.literal("consent_withdrawn"), // Consent was withdrawn
      v.literal("consent_updated"), // Consent was updated
      v.literal("admin_action"), // Admin performed action
      v.literal("profile_updated"), // Profile was updated
      v.literal("ai_analysis_used") // AI analysis was performed
    ),
    // Action metadata
    details: v.optional(v.string()), // JSON string with additional details (sanitized)
    resourceType: v.optional(v.string()), // Type of resource accessed (e.g., "userProfile", "financialMetrics")
    resourceId: v.optional(v.string()), // ID of resource accessed
    // Timestamp (immutable)
    timestamp: v.string(), // ISO timestamp - never changes
    // IP and user agent for audit trail
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_actor", ["actorId"])
    .index("by_target_user", ["targetUserId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"])
    .index("by_actor_and_target", ["actorId", "targetUserId"]),

  // Account Deletion: Soft delete tracking
  deletedAccounts: defineTable({
    clerkUserId: v.string(),
    deletedAt: v.string(), // ISO timestamp when soft deletion was initiated
    scheduledHardDeleteAt: v.string(), // ISO timestamp when hard deletion will occur (30 days)
    reason: v.optional(v.string()), // Optional reason for deletion
    // Keep minimal data for audit trail
    email: v.string(), // Email at time of deletion (for audit)
    createdAt: v.string(), // Original account creation date
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_scheduled_delete", ["scheduledHardDeleteAt"]),

  // Cached daily financial news snapshots (per region & language)
  newsSnapshots: defineTable({
    region: v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"), v.literal("global")),
    language: v.union(v.literal("en"), v.literal("ar")),
    // ISO timestamp when this snapshot was fetched
    fetchedAt: v.string(),
    // Normalized article objects (metadata only, no full content)
    articles: v.array(
      v.object({
        title: v.string(),
        source: v.string(),
        publishedAt: v.string(),
        description: v.string(),
        url: v.optional(v.string()),
        urlToImage: v.optional(v.union(v.string(), v.null())),
      })
    ),
  })
    .index("by_region_language", ["region", "language"])
    .index("by_fetchedAt", ["fetchedAt"]),

  // Individual financial news articles with deduplication by URL
  newsArticles: defineTable({
    title: v.string(),
    description: v.string(),
    source: v.string(),
    url: v.string(), // Logically unique per article (enforced in code with index)
    image: v.optional(v.union(v.string(), v.null())),
    region: v.union(v.literal("ksa"), v.literal("uae"), v.literal("us"), v.literal("global")),
    language: v.union(v.literal("en"), v.literal("ar")),
    // Original publish timestamp from the external API (NEVER mutated)
    publishedAt: v.string(),
    // When this record was fetched and stored in our system
    fetchedAt: v.string(),
  })
    .index("by_url", ["url"])
    .index("by_region_language_publishedAt", ["region", "language", "publishedAt"]),

  // Metadata for news ingestion (e.g. last successful fetch timestamp)
  newsMeta: defineTable({
    key: v.string(), // e.g. "global" singleton key
    lastFetchedAt: v.optional(v.string()),
  }).index("by_key", ["key"]),
});