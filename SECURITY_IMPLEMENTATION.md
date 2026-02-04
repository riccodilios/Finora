# Financial Data Protection & Access Control - Implementation Guide

## Overview

This document describes the security implementation for financial data protection, encryption, and role-based access control (RBAC).

## Architecture

### 1. Data Classification (`convex/lib/data-classification.ts`)

**Purpose**: Classifies data by sensitivity level

**Classifications**:
- **Financial**: High sensitivity - Must be encrypted (income, expenses, net worth, etc.)
- **Personal**: Medium sensitivity - Partially masked in logs (email, user ID)
- **Behavioral**: Low sensitivity - Can be logged (preferences, tags)

**Key Functions**:
- `getFieldClassification(field)`: Returns classification for a field
- `requiresEncryption(field)`: Checks if field must be encrypted
- `isFinancialAmount(field, context)`: Checks if amount field is financial

### 2. Encryption (`convex/lib/encryption.ts`)

**Algorithm**: AES-256-GCM (Authenticated Encryption)

**Features**:
- Uses PBKDF2 for key derivation (100,000 iterations)
- Random salt and IV for each encryption
- Authentication tag for integrity verification
- Base64 encoding for storage

**Key Functions**:
- `encryptFinancialValue(value)`: Encrypts a number → base64 string
- `decryptFinancialValue(encrypted)`: Decrypts base64 string → number
- `encryptFinancialObject(obj, fields)`: Encrypts multiple fields
- `decryptFinancialObject(obj, fields)`: Decrypts multiple fields

**Storage Format**: `salt:iv:tag:encrypted` (all base64)

**Environment Variable**: `FINANCIAL_DATA_ENCRYPTION_KEY`
- Must be 64 hex characters (32 bytes = 256 bits)
- Generate with: `openssl rand -hex 32`

### 3. Role-Based Access Control (`convex/lib/rbac.ts`)

**Roles**:
- **user**: Can access and modify own data only
- **admin**: Can access all data but cannot view raw financial values by default
- **support**: Can access all data but cannot view raw financial values by default

**Key Functions**:
- `getUserRole(clerkUserId)`: Returns user's role
- `canAccessFinancialData(userId, targetUserId)`: Checks read access
- `canViewRawFinancialData(userId, targetUserId)`: Checks if user can see decrypted values
- `canModifyFinancialData(userId, targetUserId)`: Checks write access

**Access Rules**:
- Users can only access their own data
- Admins/support can access all data but see encrypted values (privacy protection)
- Only data owners can view decrypted values

### 4. Log Masking (`convex/lib/log-masking.ts`)

**Purpose**: Prevents sensitive data from appearing in logs

**Features**:
- Masks all financial numbers as `[FINANCIAL_VALUE]`
- Masks encrypted strings as `[ENCRYPTED]`
- Partially masks personal data (email: `ab***@domain.com`)
- Recursively masks nested objects

**Key Functions**:
- `maskFinancialValue(value)`: Masks a single value
- `maskSensitiveFields(obj)`: Masks entire object
- `safeLog(message, ...args)`: Safe console.log with masking
- `safeError(message, error)`: Safe console.error with masking

## Implementation Details

### Schema Changes

**File**: `convex/schema.ts`

Financial fields now accept both `number` (legacy) and `string` (encrypted):
```typescript
monthlyIncome: v.optional(v.union(v.number(), v.string())),
monthlyExpenses: v.optional(v.union(v.number(), v.string())),
netWorth: v.optional(v.union(v.number(), v.string())),
// ...
```

This allows:
- Legacy data (numbers) to continue working
- New data (encrypted strings) to be stored
- Gradual migration path

### Function Modifications

#### Write Operations (Encryption)

**File**: `convex/functions.ts` - `createOrUpdateUserProfile`

**Before**:
```typescript
updateData.monthlyIncome = args.monthlyIncome;
```

**After**:
```typescript
updateData.monthlyIncome = encryptFinancialValue(args.monthlyIncome);
safeLog("Encrypting monthlyIncome for user", { clerkUserId: args.clerkUserId });
```

All financial fields are encrypted before database write.

#### Read Operations (Decryption)

**File**: `convex/functions.ts` - `getUserProfile`

**Changes**:
1. Added RBAC check: `canAccessFinancialData()`
2. Added decryption helper: `decryptUserProfile()`
3. Only decrypts if user has permission to view raw values
4. Handles both legacy (number) and encrypted (string) data

**Decryption Logic**:
- If user is data owner → Decrypt and return
- If user is admin/support → Return encrypted (privacy protection)
- If user is unauthorized → Throw error

### Helper Functions

#### `decryptUserProfile(profile, requestingUserId)`

**Purpose**: Decrypts financial fields based on permissions

**Logic**:
1. Check if requesting user can view raw financial data
2. If yes: Decrypt all financial fields
3. If no: Return profile with encrypted values
4. Handle both legacy numbers and encrypted strings

## Security Features

### ✅ Encryption at Rest
- All financial values encrypted before database storage
- Uses industry-standard AES-256-GCM
- Unique salt/IV for each encryption

### ✅ Access Control
- RBAC system with three roles
- Users can only access own data
- Admins cannot view raw financial values by default

### ✅ Log Protection
- All financial values masked in logs
- No raw numbers in console output
- Safe logging functions prevent data leaks

### ✅ Backward Compatibility
- Handles legacy unencrypted data
- Gradual migration path
- No breaking changes

## Setup Instructions

### 1. Generate Encryption Key

```bash
# Generate 256-bit key (64 hex characters)
openssl rand -hex 32
```

### 2. Set Environment Variable

In Convex dashboard:
- Go to Settings → Environment Variables
- Add: `FINANCIAL_DATA_ENCRYPTION_KEY` = `<generated-key>`

### 3. Deploy

```bash
npx convex deploy
```

### 4. Verify

- Check logs for encryption messages
- Verify encrypted data in database
- Test user access permissions

## Migration Strategy

### Phase 1: Deploy with Dual Support
- Schema accepts both numbers and strings
- New writes are encrypted
- Reads handle both formats

### Phase 2: Migrate Legacy Data
- Create migration script to encrypt existing data
- Run during maintenance window
- Verify all data encrypted

### Phase 3: Enforce Encryption
- Update schema to only accept strings
- Remove legacy number support
- Complete migration

## Testing Checklist

### Encryption Tests
- [ ] Financial values encrypted before storage
- [ ] Encrypted values cannot be decrypted without key
- [ ] Decryption works for authorized users
- [ ] Legacy numbers still work

### Access Control Tests
- [ ] Users can only access own data
- [ ] Admins cannot view raw financial values
- [ ] Unauthorized access is blocked
- [ ] Error messages don't leak data

### Log Masking Tests
- [ ] Financial values masked in logs
- [ ] Encrypted strings masked in logs
- [ ] Personal data partially masked
- [ ] No raw numbers in console

### Performance Tests
- [ ] Encryption/decryption < 10ms per field
- [ ] No significant query slowdown
- [ ] Batch operations work correctly

## Security Considerations

### Key Management
- ⚠️ **CRITICAL**: Store encryption key securely
- ⚠️ **CRITICAL**: Never commit key to git
- ⚠️ **CRITICAL**: Rotate key periodically
- ⚠️ **CRITICAL**: Backup key securely

### Access Control
- ✅ Users can only access own data
- ✅ Admins need explicit permission for raw values
- ✅ All access attempts logged

### Data Protection
- ✅ Encryption at rest
- ✅ No plaintext in logs
- ✅ RBAC enforcement
- ✅ Audit trail via safe logging

## Troubleshooting

### Decryption Errors
**Symptom**: "Decryption failed" errors
**Cause**: Invalid key or corrupted data
**Fix**: Verify encryption key, check data integrity

### Performance Issues
**Symptom**: Slow queries
**Cause**: Encryption overhead
**Fix**: Optimize batch operations, cache decrypted values

### Access Denied Errors
**Symptom**: "Unauthorized" errors
**Cause**: RBAC check failing
**Fix**: Verify user role, check permission logic

## Future Enhancements

1. **Key Rotation**: Implement automatic key rotation
2. **Field-Level Permissions**: Granular access control
3. **Audit Logging**: Track all data access
4. **Data Anonymization**: Anonymize for analytics
5. **Compliance Reporting**: Generate access reports

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: ✅ Implemented
