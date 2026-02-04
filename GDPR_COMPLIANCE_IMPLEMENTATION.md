# GDPR Compliance Implementation

## Overview

Complete GDPR-style compliance system with explicit consent management, data control, and immutable audit logging.

## What Was Implemented

### 1. Consent Management System

**Schema**: `consentFlags` table
- `onboardingDataConsent`: Explicit consent for storing onboarding financial data
- `aiAnalysisConsent`: Explicit consent for AI analysis of financial data
- `marketingConsent`: Optional marketing consent
- Metadata: `consentVersion`, `consentedAt`, `lastUpdatedAt`, `ipAddress`, `userAgent`

**Functions** (`convex/lib/consent.ts`):
- `getConsentFlags()` - Get user's consent status
- `hasOnboardingConsent()` - Check onboarding consent
- `hasAIConsent()` - Check AI analysis consent
- `updateConsentFlags()` - Create/update consent
- `withdrawAllConsent()` - Withdraw all consent

**API Functions** (`convex/compliance.ts`):
- `getConsent` - Query user consent
- `hasOnboardingDataConsent` - Check onboarding consent
- `hasAIConsent` - Check AI consent
- `updateConsent` - Update consent (with audit logging)
- `withdrawConsent` - Withdraw all consent

### 2. Immutable Audit Logging

**Schema**: `auditLogs` table (append-only, never modified)
- `actorId`: Who performed the action
- `actorType`: "user" | "admin" | "system"
- `targetUserId`: Whose data was accessed/modified
- `action`: Type of action (see below)
- `details`: JSON string with additional context (sanitized)
- `resourceType`: Type of resource (e.g., "userProfile")
- `resourceId`: ID of resource
- `timestamp`: ISO timestamp (immutable)
- `ipAddress`, `userAgent`: For audit trail

**Actions Tracked**:
- `data_access` - Data was accessed
- `data_export` - Data was exported
- `data_deletion_soft` - Account marked for deletion
- `data_deletion_hard` - Account permanently deleted
- `consent_given` - Consent was granted
- `consent_withdrawn` - Consent was withdrawn
- `consent_updated` - Consent was updated
- `admin_action` - Admin performed action
- `profile_updated` - Profile was updated
- `ai_analysis_used` - AI analysis was performed

**Functions** (`convex/lib/audit.ts`):
- `createAuditLog()` - Create audit log entry
- `logDataAccess()` - Log data access
- `logConsentChange()` - Log consent changes
- `logDataDeletion()` - Log deletions
- `logAdminAction()` - Log admin actions
- `logAIAnalysis()` - Log AI analysis usage
- `logDataExport()` - Log data exports

### 3. Data Export (Right to Data Portability)

**Function**: `exportUserData` (action)
- Exports all user data in JSON format
- Includes: user, profile, preferences, subscription, financial history, insights, conversations
- Automatically decrypts financial data for export
- Logs export in audit trail

**Usage**:
```typescript
const exportData = await exportUserData({
  clerkUserId: user.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### 4. Account Deletion (Right to be Forgotten)

**Soft Deletion**:
- `deleteAccount` - Marks account for deletion
- Creates record in `deletedAccounts` table
- 30-day grace period before hard deletion
- Withdraws all consent automatically
- Logs soft deletion

**Hard Deletion**:
- `hardDeleteAccount` - Permanently deletes all user data
- Deletes: profile, financial data, preferences, subscriptions, insights, conversations, consent flags
- Can be triggered by admin or automatically after grace period
- Logs hard deletion (audit log remains)

**Cancel Deletion**:
- `cancelAccountDeletion` - Restores account if within grace period

**Schema**: `deletedAccounts` table
- Tracks soft-deleted accounts
- `scheduledHardDeleteAt`: When hard deletion will occur (30 days)
- Keeps minimal audit data (email, creation date)

### 5. Consent Integration

**Onboarding**:
- `createOrUpdateUserProfile` now requires `onboardingDataConsent: true`
- Automatically records consent when onboarding
- Logs consent in audit trail

**AI Analysis**:
- `generateAIInsights` checks `aiAnalysisConsent` before processing
- `generateAutomaticFinancialInsights` checks consent
- Throws error if consent not given
- Logs AI analysis usage

**Data Access**:
- `getUserProfile` logs all data access
- Tracks who accessed what and when

### 6. Audit Log Queries

**Functions**:
- `getAuditLogs` - Get audit logs for a user (users can only see their own)
- `getScheduledDeletions` - Get accounts scheduled for hard deletion (admin/system)

## Schema Changes

### New Tables

1. **`consentFlags`**
   - Tracks explicit user consent
   - Indexed by `clerkUserId`

2. **`auditLogs`**
   - Immutable audit trail
   - Indexed by: `actorId`, `targetUserId`, `action`, `timestamp`, `[actorId, targetUserId]`

3. **`deletedAccounts`**
   - Tracks soft-deleted accounts
   - Indexed by: `clerkUserId`, `scheduledHardDeleteAt`

## Files Created

- `convex/lib/audit.ts` - Audit logging system
- `convex/lib/consent.ts` - Consent management
- `convex/compliance.ts` - GDPR compliance API functions

## Files Modified

- `convex/schema.ts` - Added consent, audit, and deletion tables
- `convex/functions.ts` - Added consent checks and audit logging

## Usage Examples

### Check Consent
```typescript
const hasConsent = await hasAIConsent({ clerkUserId: user.id });
if (!hasConsent) {
  // Show consent UI
}
```

### Update Consent
```typescript
await updateConsent({
  clerkUserId: user.id,
  aiAnalysisConsent: true,
  consentVersion: "1.0.0",
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Export Data
```typescript
const exportData = await exportUserData({
  clerkUserId: user.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
// Return JSON to user
```

### Delete Account
```typescript
await deleteAccount({
  clerkUserId: user.id,
  reason: "User requested deletion",
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Get Audit Logs
```typescript
const logs = await getAuditLogs({
  clerkUserId: user.id,
  requestingUserId: user.id, // Must match
  limit: 100,
});
```

## Compliance Checklist

- [x] Explicit consent for onboarding data
- [x] Explicit consent for AI analysis
- [x] Consent withdrawal capability
- [x] Data export functionality
- [x] Account deletion (soft → hard)
- [x] Immutable audit logging
- [x] Data access logging
- [x] Consent change logging
- [x] Deletion logging
- [x] Admin action logging
- [x] No performance impact (async logging)

## Performance Considerations

- **Audit Logging**: All audit logs are created asynchronously
- **No Blocking**: Consent checks are fast queries (indexed)
- **Batch Operations**: Hard deletion processes all data in single transaction
- **Indexed Queries**: All audit log queries use indexes for performance

## Security Considerations

- **Immutable Logs**: Audit logs cannot be modified (append-only)
- **Access Control**: Users can only see their own audit logs
- **IP Tracking**: IP addresses stored for audit trail
- **Consent Versioning**: Tracks which version of terms user consented to

## Next Steps

1. **UI Integration**: Add consent checkboxes to onboarding and settings
2. **Scheduled Hard Deletion**: Create cron job to process scheduled deletions
3. **Admin Dashboard**: Build admin interface for viewing audit logs
4. **Data Export UI**: Add "Export My Data" button in settings
5. **Account Deletion UI**: Add "Delete Account" option in settings

## Notes

- **Grace Period**: 30-day grace period for account restoration
- **Audit Retention**: Audit logs are never deleted (compliance requirement)
- **Consent Versioning**: Track consent version for legal compliance
- **No Performance Impact**: All compliance features are optimized for performance
