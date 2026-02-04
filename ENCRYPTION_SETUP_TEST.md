# Encryption Setup & Testing Guide

## Part 1: Setting Up Encryption

### Step 1: Generate Encryption Key

Open your terminal and run:

```bash
openssl rand -hex 32
```

**Example output**:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Important**: Copy this key - you'll need it in the next step. Keep it secure!

### Step 2: Set Environment Variable in Convex

1. **Go to Convex Dashboard**
   - Visit: https://dashboard.convex.dev
   - Sign in to your account

2. **Select Your Project**
   - Choose the "finora" project (or your project name)

3. **Navigate to Environment Variables**
   - Click **Settings** in the left sidebar
   - Click **Environment Variables** tab

4. **Add New Variable**
   - Click **Add Variable** button
   - **Variable Name**: `FINANCIAL_DATA_ENCRYPTION_KEY`
   - **Variable Value**: Paste the key you generated in Step 1
   - Click **Save**

5. **Verify**
   - You should see `FINANCIAL_DATA_ENCRYPTION_KEY` in the list
   - The value should be masked (showing `••••••••`)

### Step 3: Deploy to Convex

```bash
# Make sure you're in the project directory
cd c:\Users\2007r\finora

# Deploy to Convex
npx convex deploy
```

Wait for deployment to complete. You should see:
```
✓ Deployed successfully
```

---

## Part 2: Testing Encryption

### Test 1: Verify Encryption Key is Set

**Method 1: Test in Convex Dashboard**

1. Go to Convex Dashboard → Your Project
2. Click **Functions** in the left sidebar
3. Click **Run Function** (or use the function tester)
4. Create a test function or use the existing one

**Method 2: Test via Code**

Create a temporary test file `convex/test-encryption.ts`:

```typescript
import { encryptFinancialValue, decryptFinancialValue } from "./lib/encryption";

export const testEncryption = {
  args: {},
  handler: async () => {
    try {
      // Test encryption
      const testValue = 5000.50;
      const encrypted = encryptFinancialValue(testValue);
      
      console.log("Original value:", testValue);
      console.log("Encrypted value:", encrypted);
      console.log("Encrypted length:", encrypted?.length);
      
      // Test decryption
      const decrypted = decryptFinancialValue(encrypted);
      console.log("Decrypted value:", decrypted);
      
      // Verify
      if (decrypted === testValue) {
        return {
          success: true,
          message: "Encryption/Decryption working correctly!",
          original: testValue,
          encrypted: encrypted?.substring(0, 20) + "...", // Show first 20 chars
          decrypted: decrypted,
        };
      } else {
        return {
          success: false,
          message: "Decryption failed - values don't match",
          original: testValue,
          decrypted: decrypted,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Encryption test failed",
        error: error.message,
      };
    }
  },
};
```

Then run it in Convex dashboard or via CLI:
```bash
npx convex run testEncryption
```

**Expected Result**:
```json
{
  "success": true,
  "message": "Encryption/Decryption working correctly!",
  "original": 5000.5,
  "encrypted": "a1b2c3d4e5f678901234...",
  "decrypted": 5000.5
}
```

### Test 2: Test Real User Profile Encryption

**Step 1: Update a User Profile**

1. Go to your app: http://localhost:3000/dashboard/settings
2. Sign in as a test user
3. Enter financial data:
   - Monthly Income: `10000`
   - Monthly Expenses: `5000`
   - Net Worth: `50000`
4. Click **Save**

**Step 2: Check Database**

1. Go to Convex Dashboard → **Data**
2. Open `userProfiles` table
3. Find your test user's profile
4. Check the financial fields:
   - `monthlyIncome` should be a long base64 string (not `10000`)
   - `monthlyExpenses` should be a long base64 string (not `5000`)
   - `netWorth` should be a long base64 string (not `50000`)

**Expected**: All financial fields should be encrypted strings like:
```
"a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456..."
```

### Test 3: Test Decryption (User View)

**Step 1: View Profile as User**

1. Go to: http://localhost:3000/dashboard/settings
2. You should see your financial data **decrypted** (normal numbers)
3. Check browser console - should NOT see raw encrypted values

**Expected**: You see:
- Monthly Income: `10,000 SAR`
- Monthly Expenses: `5,000 SAR`
- Net Worth: `50,000 SAR`

### Test 4: Test Log Masking

**Step 1: Check Convex Logs**

1. Go to Convex Dashboard → **Logs**
2. Look for recent logs from profile updates
3. Search for `[SAFE_LOG]` or `[ENCRYPTED]`

**Expected**: Logs should show:
```
[SAFE_LOG] Encrypting monthlyIncome for user { clerkUserId: "user_abc123" }
[SAFE_LOG] Encrypting monthlyExpenses for user { clerkUserId: "user_abc123" }
```

**NOT**:
```
Encrypting monthlyIncome: 10000  ❌ (Should be masked)
```

### Test 5: Test Access Control

**Test User Access (Own Data)**

1. Sign in as User A
2. Go to `/dashboard/settings`
3. Should see decrypted financial values ✅

**Test Admin Access (Other User's Data)**

1. Sign in as Admin (user ID: `user_38vftq2ScgNF9AEmYVnswcUuVpH`)
2. Try to access another user's profile
3. Should see encrypted values (not decrypted) ✅
4. Should NOT see raw numbers ✅

**Test Unauthorized Access**

1. Sign in as User B
2. Try to access User A's data
3. Should get "Unauthorized" error ✅

---

## Troubleshooting

### Error: "FINANCIAL_DATA_ENCRYPTION_KEY environment variable is not set"

**Problem**: Encryption key not configured

**Solution**:
1. Go to Convex Dashboard → Settings → Environment Variables
2. Verify `FINANCIAL_DATA_ENCRYPTION_KEY` exists
3. If missing, add it (see Step 2 above)
4. Redeploy: `npx convex deploy`

### Error: "FINANCIAL_DATA_ENCRYPTION_KEY must be 64 hex characters"

**Problem**: Key format is incorrect

**Solution**:
1. Key must be exactly 64 hex characters (0-9, a-f)
2. Regenerate: `openssl rand -hex 32`
3. Update in Convex dashboard
4. Redeploy

### Error: "Decryption failed - data may be corrupted or key invalid"

**Problem**: Wrong encryption key or corrupted data

**Solution**:
1. **Check Key**: Verify the key in Convex matches the one you generated
2. **Legacy Data**: If you have old unencrypted data (numbers), it should still work
3. **New Data**: All new data should be encrypted strings

**To Fix Legacy Data**:
- Legacy data (stored as numbers) will work without decryption
- New writes will be encrypted
- You can migrate legacy data later (optional)

### Data Shows as Numbers (Not Encrypted)

**Possible Causes**:
1. Encryption not enabled yet
2. Legacy data (old unencrypted data)
3. Key not set correctly

**Solution**:
1. Verify key is set in Convex dashboard
2. Update a profile - new writes should be encrypted
3. Check database - new values should be strings

### Performance Issues

**Symptom**: Slow after enabling encryption

**Solution**:
- Encryption/decryption is fast (< 10ms per field)
- If slow, check for:
  - Too many decryption calls
  - Network latency
  - Database query performance

---

## Quick Test Checklist

- [ ] Encryption key generated (`openssl rand -hex 32`)
- [ ] Key set in Convex dashboard
- [ ] Deployed to Convex (`npx convex deploy`)
- [ ] Test encryption function works
- [ ] User profile data is encrypted in database
- [ ] User can see decrypted values in UI
- [ ] Logs show masked values (`[ENCRYPTED]`, `[FINANCIAL_VALUE]`)
- [ ] Admin cannot see raw financial values
- [ ] Unauthorized access is blocked

---

## Next Steps

Once encryption is working:

1. **Monitor Logs**: Check Convex logs regularly for encryption errors
2. **Test Edge Cases**: Test with null values, zero values, large numbers
3. **Performance**: Monitor query performance
4. **Migration**: Plan migration of legacy unencrypted data (optional)

---

## Support

If you encounter issues:

1. Check Convex logs for error messages
2. Verify encryption key is set correctly
3. Test with the test function above
4. Check browser console for client-side errors

For security concerns, contact the security team immediately.

---

**Last Updated**: [Current Date]
