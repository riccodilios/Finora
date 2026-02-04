# Moyasar Subscription Integration - Production Ready

## ✅ Implementation Complete

Finora now has a **production-ready Moyasar subscription system** that is:
- Fully isolated from financial analytics
- SAMA-compliant
- Uses hosted payment flow (no card data stored)
- Supports test mode (hidden from users)
- Prevents future expansion into money handling

## 🔑 Moyasar Keys Configured

**Live Keys (Production):**
- Get your publishable and secret keys from: https://moyasar.com/dashboard
- Add them to your environment variables

**Environment Variables:**
```bash
# Get these from Moyasar Dashboard → Settings → API Keys
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=your_publishable_key_here
MOYASAR_SECRET_KEY=your_secret_key_here
PAYMENTS_TEST_MODE=false  # Set to "true" for test mode
MOYASAR_WEBHOOK_SECRET=your_webhook_secret_from_moyasar_dashboard
```

## 🔗 Webhook Configuration

**Webhook URL for Moyasar Dashboard:**
```
https://finora.vercel.app/api/billing/webhook
```
*(Replace with your actual production domain)*

**Webhook Events to Subscribe:**
- `payment.paid` - Subscription payment successful
- `payment.failed` - Payment failure handling

**Webhook Secret:**
- Get from Moyasar Dashboard → Settings → Webhooks
- Add to environment variables as `MOYASAR_WEBHOOK_SECRET`

## 📁 File Structure

### Billing System (Isolated)
```
src/app/api/billing/
  ├── subscribe/route.ts    # Create subscription payment
  ├── webhook/route.ts       # Moyasar webhook handler
  └── README.md              # Billing system documentation

src/app/billing/
  └── success/page.tsx       # Payment success page

convex/
  └── billing.ts             # Billing functions (isolated from financial analytics)
```

### Updated Files
- `src/app/dashboard/subscription/page.tsx` - Uses new billing API
- `src/app/api/webhooks/moyasar/route.ts` - Updated to use billing functions
- `src/middleware.ts` - Allows billing webhook access
- `env.production` - Moyasar keys configured

## 💰 Pricing

- **Monthly:** 60 SAR (6000 halalas)
- **Annual:** 600 SAR (60000 halalas) - 16% discount

## 🔒 Compliance Features

### ✅ What We Store
- Subscription status, plan type, billing period
- Payment transaction IDs (for tracking)
- Payment amounts (for receipts)

### ❌ What We NEVER Store
- Card numbers, CVV, or card details
- Payment tokens
- Bank account information
- Wallet balances

### Receipt Labeling
All receipts labeled as **"Service Subscription Fees"**

### Test Mode
- Controlled by `PAYMENTS_TEST_MODE` environment variable
- **NO test indicators visible to users**
- Users cannot tell if they're in test or live mode

## 🚀 Usage

### Creating a Subscription

**Frontend:**
```typescript
const response = await fetch("/api/billing/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: user.id,
    email: user.email,
    billingCycle: "monthly" // or "annual"
  }),
});

const { paymentUrl } = await response.json();
window.location.href = paymentUrl; // Redirect to Moyasar
```

### Webhook Processing

Webhooks automatically:
1. Verify Moyasar signature
2. Update subscription status
3. Record payment (minimal data only)
4. Handle payment failures

## 🛡️ Security

- Moyasar hosted payment flow (PCI compliant)
- Webhook signature verification
- No card data touches our servers
- Billing isolated from financial analytics
- Prevents future money handling features

## 📝 Next Steps

1. **Set Webhook Secret:**
   - Get from Moyasar Dashboard
   - Add to Vercel environment variables

2. **Test Webhook:**
   - Use Moyasar test mode
   - Set `PAYMENTS_TEST_MODE=true`
   - Test payment flow

3. **Go Live:**
   - Set `PAYMENTS_TEST_MODE=false`
   - Use live Moyasar keys
   - Configure webhook URL in Moyasar dashboard

## ⚠️ Important Notes

- **Billing system is isolated** - Do not mix with financial analytics
- **No test indicators** - Users cannot see test mode
- **No payment amounts editable** - Fixed pricing only
- **No wallet/balance features** - Subscription payments only
- **SAMA-compliant** - Service subscription fees only
