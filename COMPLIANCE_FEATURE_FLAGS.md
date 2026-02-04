# Compliance Feature Flags - Implementation Guide

## Overview

This document describes the compliance-focused feature flag system implemented to enforce non-financial execution requirements. **All financial execution features are explicitly disabled by default** to ensure regulatory compliance.

## Feature Flags Location

**File**: `src/lib/feature-flags.ts`

## Critical Compliance Rules

### ❌ DISABLED Features (Default: `false`)

These features are **explicitly disabled** and must **never** be enabled without:
1. Legal/compliance review
2. Regulatory approval
3. Explicit written authorization
4. Code review by senior compliance engineer

- **MONEY_MOVEMENT**: Transfer funds between accounts
- **TRANSFERS**: Internal or external fund transfers
- **PAYMENTS_EXECUTION**: Payment processing and execution (except subscription payments)
- **INVESTMENT_EXECUTION**: Execute investment trades or orders
- **CREDIT_DECISIONING**: Approve/deny credit applications

### ✅ ALLOWED Features (Default: `true`)

These features are safe and allowed:
- **SUBSCRIPTION_PAYMENTS**: User-to-platform subscription payments (user paying for service)
- **FINANCIAL_DATA_VIEWING**: Read-only financial data display
- **FINANCIAL_DATA_ENTRY**: Manual entry of financial data
- **AI_INSIGHTS**: AI-generated financial insights (non-directive)
- **AI_CHAT**: AI financial consultant chat (with neutral language enforcement)

### 🔒 READ_ONLY_MODE

When enabled, prevents **all write operations** globally. This is a safety mechanism for compliance scenarios.

## Implementation Details

### API Route Guards

All API routes that handle financial operations are protected:

- **`/api/pay`**: Subscription payment initiation
  - Checks: `SUBSCRIPTION_PAYMENTS`, `READ_ONLY_MODE`
  
- **`/api/webhooks/moyasar`**: Payment webhook processing
  - Checks: `SUBSCRIPTION_PAYMENTS`, `READ_ONLY_MODE`
  
- **`/api/pro`**: Pro feature access
  - Checks: `READ_ONLY_MODE`

### UI-Level Guards

The subscription page (`src/app/dashboard/subscription/page.tsx`) includes:
- Feature flag checks before payment operations
- Button disabling when flags are disabled
- User-friendly error messages

### AI Language Enforcement

All AI prompts have been updated to use **neutral, non-directive language**:

**Before (Directive)**:
- ❌ "You should reduce expenses"
- ❌ "You must increase savings"
- ❌ "Prioritize building emergency fund"

**After (Neutral)**:
- ✅ "You may consider reducing expenses"
- ✅ "One option could be to increase savings"
- ✅ "You might want to consider building an emergency fund"

**Files Updated**:
- `convex/functions.ts`: `generateAIInsights`, `generateAutomaticFinancialInsights`, `sendChatMessage`

## Usage Examples

### Checking Feature Flags

```typescript
import { isFeatureEnabled, requireFeature, checkFeature, isReadOnlyMode } from '@/lib/feature-flags';

// Non-throwing check
if (isFeatureEnabled('SUBSCRIPTION_PAYMENTS')) {
  // Proceed with payment
}

// Throwing guard (for API routes)
requireFeature('SUBSCRIPTION_PAYMENTS'); // Throws if disabled

// Read-only mode check
if (isReadOnlyMode()) {
  return { error: 'System is in read-only mode' };
}
```

### Adding New Guards

When adding new financial execution features:

1. **Add flag to `FEATURE_FLAGS`** (default to `false`)
2. **Add guard in API route**:
   ```typescript
   requireFeature('YOUR_FEATURE_FLAG');
   if (isReadOnlyMode()) {
     return NextResponse.json({ error: 'Read-only mode' }, { status: 503 });
   }
   ```
3. **Add UI-level check**:
   ```typescript
   const featureEnabled = checkFeature('YOUR_FEATURE_FLAG');
   <button disabled={!featureEnabled || isReadOnlyMode()}>
   ```

## Preventing Accidental Activation

### Code-Level Protections

1. **Type Safety**: Flags are typed as `const` to prevent accidental mutation
2. **Explicit Checks**: All guards use explicit `requireFeature()` or `checkFeature()` calls
3. **Default Disabled**: All financial execution features default to `false`

### Review Process

Before enabling any disabled feature:

1. **Legal Review**: Confirm feature is legally permitted
2. **Compliance Review**: Verify regulatory compliance
3. **Code Review**: Senior compliance engineer must approve
4. **Documentation**: Update this file with reason and approval
5. **Testing**: Verify guards work correctly in disabled state

### Warning Comments

All disabled features include warning comments:
```typescript
/**
 * Money Movement: Transfer funds between accounts
 * DISABLED: No money movement allowed
 * ⚠️ DO NOT ENABLE without compliance review
 */
MONEY_MOVEMENT: false,
```

## Testing

### Verify Guards Work

1. **API Routes**: Attempt to call protected endpoints → Should return 503/error
2. **UI Components**: Buttons should be disabled when flags are off
3. **Read-Only Mode**: All write operations should be blocked

### Test Scenarios

```bash
# Test subscription payment guard
curl -X POST /api/pay -d '{"userId":"test","email":"test@example.com"}'
# Should fail if SUBSCRIPTION_PAYMENTS is false

# Test read-only mode
# Set READ_ONLY_MODE: true
# All write operations should fail
```

## Maintenance

### Regular Audits

- **Monthly**: Review all feature flags
- **Quarterly**: Audit API route guards
- **Annually**: Full compliance review

### Change Log

Document all flag changes:
- Date
- Feature flag name
- Old value → New value
- Reason
- Approved by

## Emergency Procedures

### Disable All Features

Set `READ_ONLY_MODE: true` to immediately disable all write operations.

### Re-enable Features

1. Verify issue is resolved
2. Get approval from compliance team
3. Set `READ_ONLY_MODE: false`
4. Monitor for issues

## Contact

For questions or concerns about feature flags:
- **Compliance Team**: [Contact Info]
- **Engineering Lead**: [Contact Info]

---

**Last Updated**: [Date]
**Version**: 1.0
**Status**: Active
