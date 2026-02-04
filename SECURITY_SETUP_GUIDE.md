# Financial Data Protection - Setup Guide

## Quick Start

### 1. Generate Encryption Key

```bash
# Generate 256-bit encryption key (64 hex characters)
openssl rand -hex 32
```

**Example output**:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 2. Set Environment Variable in Convex

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add Variable**
5. Name: `FINANCIAL_DATA_ENCRYPTION_KEY`
6. Value: Paste the generated key from step 1
7. Click **Save**

⚠️ **CRITICAL**: Never commit this key to git or share it publicly.

### 3. Deploy

```bash
npx convex deploy
```

### 4. Verify

1. Create/update a user profile with financial data
2. Check Convex dashboard - financial fields should be encrypted strings
3. Check logs - should see `[SAFE_LOG]` and `[ENCRYPTED]` instead of raw numbers
4. Test user access - should see decrypted values
5. Test admin access - should see encrypted values (privacy protection)

## Testing

### Test Encryption

```typescript
// In Convex dashboard, run:
const { encryptFinancialValue, decryptFinancialValue } = await import('./lib/encryption');

// Encrypt
const encrypted = encryptFinancialValue(5000);
console.log(encrypted); // Should be base64 string

// Decrypt
const decrypted = decryptFinancialValue(encrypted);
console.log(decrypted); // Should be 5000
```

### Test Access Control

1. **User Access**: User should see decrypted values for own data
2. **Admin Access**: Admin should see encrypted values (privacy protection)
3. **Unauthorized**: Should get "Unauthorized" error

### Test Log Masking

Check Convex logs - all financial values should appear as:
- `[FINANCIAL_VALUE]` for numbers
- `[ENCRYPTED]` for encrypted strings
- `[PERSONAL_DATA]` for personal info

## Troubleshooting

### Error: "FINANCIAL_DATA_ENCRYPTION_KEY environment variable is not set"

**Solution**: Set the environment variable in Convex dashboard (see step 2 above)

### Error: "FINANCIAL_DATA_ENCRYPTION_KEY must be 64 hex characters"

**Solution**: Key must be exactly 64 hex characters. Regenerate with `openssl rand -hex 32`

### Error: "Decryption failed - data may be corrupted or key invalid"

**Possible Causes**:
1. Wrong encryption key
2. Data corrupted
3. Legacy unencrypted data (should still work)

**Solution**: 
- Verify encryption key is correct
- Check if data is legacy (number) vs encrypted (string)
- Legacy data should work without decryption

### Performance Issues

**Symptom**: Slow queries after encryption

**Solution**:
- Encryption/decryption is fast (< 10ms per field)
- If slow, check for unnecessary decryption calls
- Consider caching decrypted values for frequently accessed data

## Migration from Legacy Data

### Current State
- Schema accepts both `number` (legacy) and `string` (encrypted)
- New writes are automatically encrypted
- Reads handle both formats

### Future Migration
1. Create migration script to encrypt all legacy data
2. Run during maintenance window
3. Verify all data encrypted
4. Update schema to only accept strings

## Security Best Practices

### Key Management
- ✅ Store key in Convex environment variables (encrypted at rest)
- ✅ Never commit key to git
- ✅ Rotate key periodically (requires re-encryption)
- ✅ Backup key securely (encrypted backup)

### Access Control
- ✅ Users can only access own data
- ✅ Admins cannot view raw financial values by default
- ✅ All access attempts logged (masked)

### Monitoring
- ✅ Monitor for decryption errors (may indicate key issues)
- ✅ Monitor for unauthorized access attempts
- ✅ Review logs regularly for security issues

## Support

For security issues or questions:
- **Security Team**: [Contact Info]
- **Engineering Lead**: [Contact Info]

---

**Last Updated**: [Current Date]
**Version**: 1.0
