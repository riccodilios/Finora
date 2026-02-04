/**
 * CONSENT MANAGEMENT - GDPR-compliant consent tracking
 * 
 * Manages explicit user consent for:
 * - Onboarding data collection
 * - AI analysis of financial data
 * - Optional marketing communications
 */

import { Id } from "../_generated/dataModel";

export interface ConsentFlags {
  onboardingDataConsent: boolean;
  aiAnalysisConsent: boolean;
  marketingConsent?: boolean;
  consentVersion: string;
  consentedAt: string;
  lastUpdatedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get user's consent flags
 */
export async function getConsentFlags(
  ctx: any,
  clerkUserId: string
): Promise<ConsentFlags | null> {
  const consent = await ctx.db
    .query("consentFlags")
    .withIndex("by_clerk_user_id", (q: any) => q.eq("clerkUserId", clerkUserId))
    .first();
  
  if (!consent) {
    return null;
  }
  
  return {
    onboardingDataConsent: consent.onboardingDataConsent,
    aiAnalysisConsent: consent.aiAnalysisConsent,
    marketingConsent: consent.marketingConsent,
    consentVersion: consent.consentVersion,
    consentedAt: consent.consentedAt,
    lastUpdatedAt: consent.lastUpdatedAt,
    ipAddress: consent.ipAddress,
    userAgent: consent.userAgent,
  };
}

/**
 * Check if user has given consent for onboarding data
 */
export async function hasOnboardingConsent(
  ctx: any,
  clerkUserId: string
): Promise<boolean> {
  const consent = await getConsentFlags(ctx, clerkUserId);
  return consent?.onboardingDataConsent === true;
}

/**
 * Check if user has given consent for AI analysis
 */
export async function hasAIConsent(
  ctx: any,
  clerkUserId: string
): Promise<boolean> {
  const consent = await getConsentFlags(ctx, clerkUserId);
  return consent?.aiAnalysisConsent === true;
}

/**
 * Create or update consent flags
 */
export async function updateConsentFlags(
  ctx: any,
  clerkUserId: string,
  consent: {
    onboardingDataConsent?: boolean;
    aiAnalysisConsent?: boolean;
    marketingConsent?: boolean;
  },
  consentVersion: string = "1.0.0",
  ipAddress?: string,
  userAgent?: string
): Promise<Id<"consentFlags">> {
  const existing = await ctx.db
    .query("consentFlags")
    .withIndex("by_clerk_user_id", (q: any) => q.eq("clerkUserId", clerkUserId))
    .first();
  
  const now = new Date().toISOString();
  
  if (existing) {
    // Update existing consent
    const updateData: any = {
      lastUpdatedAt: now,
      consentVersion,
    };
    
    if (consent.onboardingDataConsent !== undefined) {
      updateData.onboardingDataConsent = consent.onboardingDataConsent;
    }
    if (consent.aiAnalysisConsent !== undefined) {
      updateData.aiAnalysisConsent = consent.aiAnalysisConsent;
    }
    if (consent.marketingConsent !== undefined) {
      updateData.marketingConsent = consent.marketingConsent;
    }
    if (ipAddress) {
      updateData.ipAddress = ipAddress;
    }
    if (userAgent) {
      updateData.userAgent = userAgent;
    }
    
    // If consenting for the first time, update consentedAt
    if (
      (consent.onboardingDataConsent === true && !existing.onboardingDataConsent) ||
      (consent.aiAnalysisConsent === true && !existing.aiAnalysisConsent)
    ) {
      updateData.consentedAt = now;
    }
    
    await ctx.db.patch(existing._id, updateData);
    return existing._id;
  } else {
    // Create new consent record
    const consentId = await ctx.db.insert("consentFlags", {
      clerkUserId,
      onboardingDataConsent: consent.onboardingDataConsent ?? false,
      aiAnalysisConsent: consent.aiAnalysisConsent ?? false,
      marketingConsent: consent.marketingConsent,
      consentVersion,
      consentedAt: now,
      lastUpdatedAt: now,
      ipAddress,
      userAgent,
    });
    return consentId;
  }
}

/**
 * Withdraw all consent
 */
export async function withdrawAllConsent(
  ctx: any,
  clerkUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const existing = await ctx.db
    .query("consentFlags")
    .withIndex("by_clerk_user_id", (q: any) => q.eq("clerkUserId", clerkUserId))
    .first();
  
  if (existing) {
    await ctx.db.patch(existing._id, {
      onboardingDataConsent: false,
      aiAnalysisConsent: false,
      marketingConsent: false,
      lastUpdatedAt: new Date().toISOString(),
      ipAddress,
      userAgent,
    });
  }
}
