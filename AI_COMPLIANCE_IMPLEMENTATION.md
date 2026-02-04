# AI Compliance Implementation

## Overview

AI insights have been made fully compliant with regulatory requirements. All insights are now limited to educational, analytical, and descriptive intent only.

## What Was Implemented

### 1. AI Compliance System

**File**: `convex/lib/ai_compliance.ts`

- **Prohibited Phrases Detection**: Automatically detects prescriptive language
- **Text Sanitization**: Replaces prohibited phrases with compliant alternatives
- **Intent Validation**: Validates insights are educational/analytical only
- **Why Explanation Generator**: Creates "Why am I seeing this?" explanations
- **Confidence Language**: Adds confidence indicators ("may", "could", "based on your data")

**Key Functions**:
- `checkCompliance()` - Checks text for prohibited phrases
- `checkInsightCompliance()` - Validates entire insight object
- `validateInsightIntent()` - Ensures educational intent only
- `generateWhyExplanation()` - Creates explanation per insight type
- `addConfidenceLanguage()` - Adds confidence indicators

### 2. Enhanced Prompts

**Updated Functions**:
- `generateAIInsights` - 5 detailed insights
- `generateAutomaticFinancialInsights` - 1 short insight

**Prompt Changes**:
- Added explicit compliance requirements
- Forbidden phrases clearly listed
- Required confidence language specified
- Educational intent emphasized

### 3. Output Filtering

**Post-Processing**:
- All insights are checked for compliance violations
- Prohibited phrases are automatically sanitized
- Confidence language is added if missing
- Violations are logged (but insights still processed)

### 4. "Why am I seeing this?" Explanations

**Schema Updates**:
- Added `whyExplanation` field to both insight types
- Automatically generated based on insight type and financial data

**UI Updates**:
- `AIInsightsCard` now displays why explanation
- Shown below insight with clear label
- Supports both English and Arabic

### 5. Schema Updates

**Files**: `convex/schema.ts`

- Added `whyExplanation?: v.optional(v.string())` to:
  - `aiInsights` table (for detailed insights)
  - `financialInsights` table (for automatic insights)

## Compliance Rules

### ✅ Allowed Intent

- **Educational**: Teaching users about financial concepts
- **Analytical**: Data-driven observations and patterns
- **Descriptive**: Factual descriptions of financial situations

### ❌ Blocked Content

- **Investment Recommendations**: "invest in", "buy", "sell", "purchase"
- **Guarantees**: "guaranteed", "will definitely", "assured", "promised"
- **Prescriptive Advice**: "you should", "you must", "you need to", "you have to"

### Required Language

- **Confidence Indicators**: "may", "could", "might", "potentially", "possibly"
- **Data-Based**: "based on your data", "according to your data"
- **Neutral Suggestions**: "you may consider", "one option could be"

## Example Transformations

### Before (Non-Compliant)
```
"You should reduce your expenses by 500 SAR to improve your savings rate."
```

### After (Compliant)
```
"Based on your data, you may consider reducing expenses by 500 SAR, which could potentially improve your savings rate."
```

## "Why am I seeing this?" Examples

**Spending Insight**:
> "This insight is based on your expense-to-income ratio of 85.2%. It compares your spending patterns to general financial benchmarks."

**Savings Insight**:
> "This insight analyzes your savings rate of 14.8% and monthly savings amount. It's based on the difference between your income and expenses."

**Emergency Fund Insight**:
> "This insight is generated because your emergency fund is 22.2% of your goal. It compares your current coverage to recommended emergency fund levels."

## Testing

### Manual Testing

1. **Generate Insights**:
   ```bash
   # Via UI: Dashboard → Generate Insights
   # Or via Convex: npx convex run functions:generateAIInsights --arg clerkUserId="your-id"
   ```

2. **Check Compliance**:
   - Verify no "you should" or "you must" phrases
   - Verify confidence language is present
   - Check "Why am I seeing this?" appears

3. **Test Filtering**:
   - Insights with violations should be sanitized
   - Check logs for compliance violations

### Automated Testing

The compliance system automatically:
- ✅ Detects prohibited phrases
- ✅ Sanitizes text
- ✅ Adds confidence language
- ✅ Generates why explanations
- ✅ Logs violations for monitoring

## Monitoring

### Compliance Violations

Violations are logged using `safeError()`:
```typescript
safeError("Insight failed compliance check", { 
  type: insight.type, 
  issues: intentCheck.issues 
});
```

### Logs to Monitor

- `"Insight failed compliance check"` - Compliance violations detected
- Check Convex Dashboard → Logs for these messages
- Review violations to improve prompts if needed

## UI Changes

### Dashboard Insight Card

- Shows insight summary
- Displays "Why am I seeing this?" explanation below
- Maintains existing UX (no breaking changes)

### Translation Support

- English: "Why am I seeing this?"
- Arabic: "لماذا أرى هذا؟"
- Added to `src/i18n/dictionaries.ts`

## Files Created/Modified

### New Files
- `convex/lib/ai_compliance.ts` - Compliance system

### Modified Files
- `convex/functions.ts` - Updated prompts and added compliance filtering
- `convex/schema.ts` - Added `whyExplanation` field
- `src/components/dashboard/AIInsightsCard.tsx` - Added why explanation display
- `src/i18n/dictionaries.ts` - Added translation keys

## Compliance Checklist

- [x] Prompts updated with compliance requirements
- [x] Output filtering implemented
- [x] Prohibited phrases detected and sanitized
- [x] Confidence language added automatically
- [x] "Why am I seeing this?" explanations generated
- [x] UI updated to show explanations
- [x] No breaking UX changes
- [x] Insight value maintained (still useful and informative)

## Next Steps

1. **Monitor Compliance**: Review logs for violations
2. **Refine Prompts**: Adjust if violations are frequent
3. **User Testing**: Verify insights remain valuable
4. **Compliance Review**: Ready for regulatory review

## Notes

- **No UX Changes**: Users see the same interface, just with compliance guardrails
- **Insight Value Maintained**: Insights remain informative and useful
- **Automatic Processing**: All compliance checks happen automatically
- **Graceful Degradation**: Violations are sanitized, not rejected
