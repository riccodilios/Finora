# How to Verify Encryption is Working

This guide shows you multiple ways to verify that financial data encryption is working correctly in your Finora application.

## 1. Quick Test - Run the Test Function

The easiest way to verify encryption is working:

```bash
npx convex run test_encryption:testEncryption
```

**Expected Output:**
- `success: true`
- All test values encrypt/decrypt correctly
- `encryptionKeySet: "Yes"`

## 2. Check Database - Verify Encrypted Data

### Method A: Convex Dashboard

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to **Data** → **Tables** → **userProfiles**
3. Look at financial fields (`monthlyIncome`, `monthlyExpenses`, `netWorth`, etc.)

**What to Look For:**
- ✅ **Encrypted values** are long base64 strings (e.g., `"k0lVS0jfOfajUU5Pu93S+QB9qIZUvc..."`)
- ❌ **Unencrypted values** are plain numbers (e.g., `5000.50`)

**Example of Encrypted Data:**
```json
{
  "monthlyIncome": "k0lVS0jfOfajUU5Pu93S+QB9qIZUvc...",
  "monthlyExpenses": "wtJOj2NPV84rArHasoICyrTtad2yxe...",
  "netWorth": "lpMHMPpZ3yo5Yk0c7GAt6Sit6Tdfgw..."
}
```

**Example of Unencrypted Data (Legacy):**
```json
{
  "monthlyIncome": 5000.50,
  "monthlyExpenses": 3000.00,
  "netWorth": 100000.00
}
```

### Method B: Check via Convex Functions

Create a temporary query to inspect data:

```typescript
// convex/inspect-data.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const inspectUserProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    
    if (!profile) return null;
    
    return {
      // Check if values are encrypted (strings) or unencrypted (numbers)
      monthlyIncome: {
        value: profile.monthlyIncome,
        type: typeof profile.monthlyIncome,
        isEncrypted: typeof profile.monthlyIncome === "string",
        length: typeof profile.monthlyIncome === "string" ? profile.monthlyIncome.length : null,
      },
      monthlyExpenses: {
        value: profile.monthlyExpenses,
        type: typeof profile.monthlyExpenses,
        isEncrypted: typeof profile.monthlyExpenses === "string",
      },
      netWorth: {
        value: profile.netWorth,
        type: typeof profile.netWorth,
        isEncrypted: typeof profile.netWorth === "string",
      },
    };
  },
});
```

Run it:
```bash
npx convex run inspectUserProfile --arg clerkUserId="your-user-id"
```

## 3. Test End-to-End - Create/Update Profile

### Step 1: Create or Update a User Profile

Use your app's UI or API to set financial data:
- Monthly Income: 10000
- Monthly Expenses: 5000
- Net Worth: 50000

### Step 2: Check Database

Verify the values in the database are encrypted strings, not numbers.

### Step 3: Retrieve Profile via API

Call `getUserProfile` and verify:
- ✅ Values are decrypted back to numbers
- ✅ Values match what you entered
- ✅ No errors in decryption

## 4. Check Logs - Verify Encryption Happening

### Method A: Convex Dashboard Logs

1. Go to **Logs** in Convex Dashboard
2. Look for log entries when creating/updating profiles
3. Search for: `"Encrypting"` or `"SAFE_LOG"`

**What to Look For:**
```
[SAFE_LOG] Encrypting monthlyIncome for user { clerkUserId: "..." }
[SAFE_LOG] Creating new user profile with encrypted financial data { clerkUserId: "..." }
```

**Important:** Financial values should be masked in logs:
- ✅ `[FINANCIAL_VALUE]` - masked
- ❌ `5000.50` - should NOT appear in logs

### Method B: Check Log Masking

Verify that raw financial numbers don't appear in logs:

```typescript
// This should show masked values
safeLog("User profile created", {
  monthlyIncome: 5000.50,  // Should be masked as [FINANCIAL_VALUE]
  monthlyExpenses: 3000.00, // Should be masked as [FINANCIAL_VALUE]
});
```

## 5. Test Decryption - Verify Users See Correct Data

### Test Scenario:

1. **Create a profile** with:
   - Monthly Income: 15000
   - Monthly Expenses: 8000
   - Net Worth: 100000

2. **Check database** - values should be encrypted strings

3. **Retrieve profile** via `getUserProfile` query

4. **Verify**:
   - ✅ Decrypted values match what you entered
   - ✅ Values are numbers (not encrypted strings)
   - ✅ Calculations work correctly (e.g., savings = income - expenses)

### Test Query:

```bash
# Get user profile (should return decrypted values)
npx convex run functions:getUserProfile --arg clerkUserId="your-user-id"
```

**Expected Output:**
```json
{
  "monthlyIncome": 15000,      // ✅ Decrypted number
  "monthlyExpenses": 8000,     // ✅ Decrypted number
  "netWorth": 100000,          // ✅ Decrypted number
  ...
}
```

## 6. Verify RBAC - Admin Cannot See Raw Values

### Test Scenario:

1. **As a regular user**: Create profile with financial data
2. **As an admin**: Try to access the profile
3. **Verify**: Admin should see encrypted strings (not decrypted values)

**Note:** Currently, admins see encrypted values by default. This is by design for security.

## 7. Performance Check - No Regression

Verify encryption doesn't cause performance issues:

1. **Before encryption**: Note response time for `getUserProfile`
2. **After encryption**: Check response time again
3. **Verify**: No significant slowdown (< 100ms difference is acceptable)

## 8. Error Handling - Test Edge Cases

### Test Invalid Encrypted Data:

1. Manually corrupt an encrypted value in the database
2. Try to retrieve the profile
3. **Verify**: 
   - ✅ Decryption fails gracefully
   - ✅ Returns `null` or `0` for corrupted fields
   - ✅ Error is logged (but masked)

### Test Missing Encryption Key:

1. Temporarily remove `FINANCIAL_DATA_ENCRYPTION_KEY` from environment
2. Try to create/update a profile
3. **Verify**: 
   - ✅ Error is thrown clearly
   - ✅ Operation fails (doesn't store unencrypted data)

## 9. Migration Check - Legacy Data

If you have existing unencrypted data:

1. **Check**: Some profiles may have `number` values (legacy)
2. **Verify**: System handles both:
   - ✅ Encrypted strings (new data)
   - ✅ Plain numbers (legacy data)
3. **Test**: Legacy data should still work correctly

## 10. Automated Verification Script

Create a verification script:

```typescript
// convex/verify-encryption.ts
import { query } from "./_generated/server";
import { decryptFinancialValue } from "./lib/encryption";

export const verifyEncryption = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("userProfiles").take(10);
    
    const results = {
      totalProfiles: profiles.length,
      encryptedFields: 0,
      unencryptedFields: 0,
      decryptionTests: [] as any[],
    };
    
    for (const profile of profiles) {
      const fields = ["monthlyIncome", "monthlyExpenses", "netWorth"];
      
      for (const field of fields) {
        const value = (profile as any)[field];
        
        if (value === null || value === undefined) continue;
        
        if (typeof value === "string") {
          results.encryptedFields++;
          // Test decryption
          try {
            const decrypted = await decryptFinancialValue(value);
            results.decryptionTests.push({
              field,
              encrypted: value.substring(0, 20) + "...",
              decrypted,
              success: true,
            });
          } catch (error) {
            results.decryptionTests.push({
              field,
              encrypted: value.substring(0, 20) + "...",
              error: (error as Error).message,
              success: false,
            });
          }
        } else if (typeof value === "number") {
          results.unencryptedFields++;
        }
      }
    }
    
    return {
      ...results,
      encryptionRate: results.encryptedFields / (results.encryptedFields + results.unencryptedFields) * 100,
      allDecryptionsSuccessful: results.decryptionTests.every(t => t.success),
    };
  },
});
```

Run it:
```bash
npx convex run verify-encryption
```

## Quick Checklist

- [ ] Test function passes (`test_encryption:testEncryption`)
- [ ] Database shows encrypted strings (not plain numbers)
- [ ] Users can retrieve and see correct decrypted values
- [ ] Logs show masked financial values (`[FINANCIAL_VALUE]`)
- [ ] No performance regression
- [ ] Error handling works (corrupted data, missing key)
- [ ] Legacy unencrypted data still works
- [ ] RBAC works (admins see encrypted by default)

## Troubleshooting

### Issue: Values are still numbers in database

**Solution:**
- Check `FINANCIAL_DATA_ENCRYPTION_KEY` is set in Convex Dashboard
- Verify `createOrUpdateUserProfile` is using `encryptFinancialValue`
- Check for errors in Convex logs

### Issue: Decryption fails

**Solution:**
- Verify encryption key matches between encryption and decryption
- Check data format (should be base64 string)
- Look for errors in Convex logs

### Issue: Performance is slow

**Solution:**
- Encryption/decryption is async - ensure you're using `await`
- Consider caching decrypted values if needed
- Check for unnecessary re-encryption

## Security Notes

✅ **DO:**
- Keep encryption key secure (never commit to git)
- Rotate keys periodically
- Monitor for decryption failures
- Use log masking for all financial data

❌ **DON'T:**
- Log raw financial values
- Store encryption key in code
- Allow unencrypted data in new records
- Skip encryption for "test" data
