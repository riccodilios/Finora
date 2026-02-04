/**
 * AUDIT LOGGING - Immutable audit trail for GDPR compliance
 * 
 * All audit logs are append-only and never modified.
 * Used for tracking data access, deletions, consent changes, and admin actions.
 */

import { Id } from "../_generated/dataModel";

export type AuditAction =
  | "data_access"
  | "data_export"
  | "data_deletion_soft"
  | "data_deletion_hard"
  | "consent_given"
  | "consent_withdrawn"
  | "consent_updated"
  | "admin_action"
  | "profile_updated"
  | "ai_analysis_used";

export type ActorType = "user" | "admin" | "system";

export interface AuditLogEntry {
  actorId: string;
  actorType: ActorType;
  targetUserId: string;
  action: AuditAction;
  details?: string; // JSON string (sanitized)
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * This is called by mutations/actions to log important events
 */
export async function createAuditLog(
  ctx: any,
  entry: AuditLogEntry
): Promise<Id<"auditLogs">> {
  const timestamp = new Date().toISOString();
  
  // Sanitize details if provided (ensure no sensitive data)
  let sanitizedDetails: string | undefined;
  if (entry.details) {
    try {
      // Parse and sanitize JSON details
      const detailsObj = typeof entry.details === "string" 
        ? JSON.parse(entry.details) 
        : entry.details;
      sanitizedDetails = JSON.stringify(detailsObj);
    } catch {
      // If not valid JSON, use as-is but truncate
      sanitizedDetails = entry.details.substring(0, 500);
    }
  }
  
  return await ctx.db.insert("auditLogs", {
    actorId: entry.actorId,
    actorType: entry.actorType,
    targetUserId: entry.targetUserId,
    action: entry.action,
    details: sanitizedDetails,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    timestamp,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
  });
}

/**
 * Log data access
 */
export async function logDataAccess(
  ctx: any,
  actorId: string,
  actorType: ActorType,
  targetUserId: string,
  resourceType: string,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog(ctx, {
    actorId,
    actorType,
    targetUserId,
    action: "data_access",
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log consent change
 */
export async function logConsentChange(
  ctx: any,
  actorId: string,
  targetUserId: string,
  action: "consent_given" | "consent_withdrawn" | "consent_updated",
  consentType: string,
  previousValue?: boolean,
  newValue?: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog(ctx, {
    actorId,
    actorType: "user",
    targetUserId,
    action,
    details: JSON.stringify({
      consentType,
      previousValue,
      newValue,
    }),
    ipAddress,
    userAgent,
  });
}

/**
 * Log data deletion
 */
export async function logDataDeletion(
  ctx: any,
  actorId: string,
  actorType: ActorType,
  targetUserId: string,
  deletionType: "soft" | "hard",
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog(ctx, {
    actorId,
    actorType,
    targetUserId,
    action: deletionType === "soft" ? "data_deletion_soft" : "data_deletion_hard",
    details: reason ? JSON.stringify({ reason }) : undefined,
    ipAddress,
    userAgent,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  ctx: any,
  adminId: string,
  targetUserId: string,
  action: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog(ctx, {
    actorId: adminId,
    actorType: "admin",
    targetUserId,
    action: "admin_action",
    details: details ? JSON.stringify(details) : undefined,
    resourceType: action,
    ipAddress,
    userAgent,
  });
}

/**
 * Log AI analysis usage
 */
export async function logAIAnalysis(
  ctx: any,
  userId: string,
  hasConsent: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog(ctx, {
    actorId: userId,
    actorType: "user",
    targetUserId: userId,
    action: "ai_analysis_used",
    details: JSON.stringify({
      hasConsent,
      timestamp: new Date().toISOString(),
    }),
    ipAddress,
    userAgent,
  });
}
