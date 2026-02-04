# Regulatory Branding & Compliance Guide

## Platform Positioning

Finora is positioned as:
- **Primary**: Personal Finance Management Platform
- **Secondary**: Financial Insights Platform

## Regulatory Mode

The `REGULATORY_MODE` flag is **ENABLED** by default to ensure strict compliance.

### What Regulatory Mode Enforces:
1. **Non-Banking Positioning**: All messaging positions Finora as a personal finance management tool, NOT a bank
2. **No Licensed Features**: All licensed financial services features are disabled
3. **Content Validation**: Content is validated to ensure no banking implications
4. **Visual Compliance**: No visual elements suggest custody or banking services

## Licensed Features (Disabled - Future Hooks)

The following features are disabled and serve as hooks for future licensed capabilities:

1. **INVESTMENT_ADVISORY** - Requires investment advisory license
2. **BROKERAGE_SERVICES** - Requires brokerage license
3. **CUSTODY_SERVICES** - Requires custody license
4. **LENDING_SERVICES** - Requires lending license
5. **PAYMENT_PROCESSING** - Requires payment processing license
6. **DEPOSIT_SERVICES** - Requires banking license
7. **INSURANCE_PRODUCTS** - Requires insurance license
8. **CRYPTO_CUSTODY** - Requires crypto custody license

**Important**: These features cannot be enabled while `REGULATORY_MODE` is active.

## Branding Guidelines

### ✅ Allowed Terminology:
- Personal finance management
- Financial insights
- Financial tracking
- Financial analysis
- Financial planning tools
- Budget management
- Expense tracking
- Savings goals
- Financial metrics
- AI-powered insights

### ❌ Prohibited Terminology:
- Bank account
- Deposit account
- Checking account
- Savings account
- We hold your funds
- Custody of assets
- Safekeeping
- We store your money
- We manage your money
- We invest your money
- We lend
- We provide credit
- We process payments (between parties)
- We transfer funds
- We execute trades

## Visual Guidelines

### ✅ Allowed Visuals:
- Charts and graphs showing user's own data
- Financial metrics displays
- Progress indicators for goals
- Category breakdowns
- Trend visualizations

### ❌ Prohibited Visuals:
- Bank vault imagery
- Money transfer animations
- Deposit/withdrawal interfaces
- Account balance displays that imply custody
- Payment processing flows (except subscription payments)
- Trading interfaces
- Lending application forms

## Implementation

### Feature Flags
- Location: `src/lib/feature-flags.ts`
- `REGULATORY_MODE`: `true` (enabled)
- All licensed features: `false` (disabled)

### Regulatory Compliance Utilities
- Location: `src/lib/regulatory-compliance.ts`
- Provides validation and sanitization functions
- Enforces non-banking content compliance

### Usage Example:
```typescript
import { isRegulatoryMode, enforceCompliance } from '@/lib/regulatory-compliance';

// Check if in regulatory mode
if (isRegulatoryMode()) {
  // Enforce compliance
  enforceCompliance();
  
  // Validate content
  const validation = validateNonBankingContent(userContent);
  if (!validation.isCompliant) {
    // Handle violations
  }
}
```

## Legal Disclaimers

All legal pages (Privacy Policy, Terms of Service, Disclaimer) explicitly state:
- Finora is NOT a bank
- Finora is NOT licensed by SAMA
- Finora does NOT provide banking services
- Finora does NOT hold customer funds
- All insights are informational only

## Content Review Checklist

Before publishing any user-facing content:
- [ ] Does it position Finora as a personal finance management platform?
- [ ] Does it avoid any banking terminology?
- [ ] Does it avoid implying custody or safekeeping?
- [ ] Does it avoid suggesting we hold, manage, or invest user funds?
- [ ] Does it clearly state insights are informational only?
- [ ] Does it comply with regulatory mode requirements?

## Future Licensed Features

When appropriate licenses are obtained:
1. Disable `REGULATORY_MODE` (set to `false`)
2. Enable the specific licensed feature flag
3. Update legal disclaimers to reflect licensed status
4. Update branding to reflect licensed capabilities
5. Ensure all regulatory requirements for that license are met
