# Billing System - Isolated from Financial Analytics

## Compliance Rules

This billing system is **fully isolated** from financial analytics to ensure SAMA compliance.

### ✅ What We Store
- Subscription status (`active`, `trial`, `cancelled`, `expired`)
- Plan type (`free`, `pro`)
- Billing period (`monthly`, `annual`)
- Payment transaction IDs (for tracking only)
- Payment amounts and currency (for receipts)

### ❌ What We NEVER Store
- Card numbers, CVV, or card details
- Payment tokens
- Bank account information
- Wallet balances
- Financial transaction data (beyond subscription payments)

### Receipt Labeling
All receipts are labeled as **"Service Subscription Fees"** to clearly indicate this is a service payment, not a financial transaction.

### Test Mode
- Controlled by `PAYMENTS_TEST_MODE` environment variable
- **NO test indicators visible to users**
- Test mode uses test keys, live mode uses live keys
- Users cannot tell if they're in test or live mode

### API Routes

#### `POST /api/billing/subscribe`
Creates a subscription payment with Moyasar hosted payment flow.

**Request:**
```json
{
  "userId": "user_xxx",
  "email": "user@example.com",
  "billingCycle": "monthly" | "annual"
}
```

**Response:**
```json
{
  "paymentUrl": "https://moyasar.com/pay/xxx",
  "paymentId": "inv_xxx",
  "amount": 6000,
  "currency": "SAR",
  "billingCycle": "monthly"
}
```

#### `POST /api/billing/webhook`
Moyasar webhook endpoint for payment status updates.

**Webhook URL:** `https://your-domain.com/api/billing/webhook`

**Events Handled:**
- `payment.paid` - Updates subscription to active
- `payment.failed` - Handles payment failures

### Convex Functions

All billing functions are in `convex/billing.ts` (isolated from `convex/functions.ts`).

- `updateSubscriptionFromPayment` - Updates subscription from webhook
- `handlePaymentFailure` - Handles failed payments
- `getBillingHistory` - Returns payment history (no sensitive data)

### Environment Variables

```bash
# Moyasar Keys (Live)
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_live_xxx
MOYASAR_SECRET_KEY=sk_live_xxx

# Moyasar Keys (Test - optional)
MOYASAR_SECRET_KEY_TEST=sk_test_xxx

# Payment Mode
PAYMENTS_TEST_MODE=false  # Set to "true" for test mode

# Webhook Secret
MOYASAR_WEBHOOK_SECRET=your_webhook_secret
```

### Pricing

- **Monthly:** 60 SAR (6000 halalas)
- **Annual:** 600 SAR (60000 halalas) - 16% discount

### Security

- All webhooks verify Moyasar signature
- No card data ever touches our servers
- Moyasar hosted payment flow (PCI compliant)
- Billing system isolated from financial analytics

### Future Expansion Prevention

The billing system is designed to **prevent** future expansion into:
- Money movement
- Wallet functionality
- Balance management
- Financial transactions beyond subscriptions

All billing logic is isolated in `/billing` directory and `convex/billing.ts`.
