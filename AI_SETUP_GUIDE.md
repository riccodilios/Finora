# AI Consultant Setup Guide

## Prerequisites

The AI Consultant backend is now implemented. Follow these steps to enable it:

## Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in with your OpenAI account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (you'll need it in the next step)

## Step 2: Set Environment Variable in Convex

1. Open your terminal in the project root
2. Run the following command to set the environment variable:

```bash
npx convex env set OPENAI_API_KEY "your-api-key-here"
```

Replace `"your-api-key-here"` with your actual API key from Step 1.

**Important:** Make sure you're using a valid API key from OpenAI Platform. The key should start with `sk-` and be the full key, not just a partial string.

**Verify the key is set:**
```bash
npx convex env list
```

You should see `OPENAI_API_KEY` in the list.

## Step 3: Deploy Schema Changes

The schema has been updated with the `aiInsights` table. Deploy it:

```bash
npx convex deploy
```

## Step 4: Test the Implementation

1. Make sure you have a Pro account (or upgrade to Pro)
2. Complete your financial profile in Settings
3. Navigate to `/dashboard/ai`
4. Click "Generate Insights" to test the AI Consultant

## Verification

To verify everything is working:

1. Check Convex dashboard → Environment Variables → `OPENAI_API_KEY` is set
2. Check Convex dashboard → Data → `aiInsights` table exists
3. Try generating insights from the AI page

## Troubleshooting

### Error: "AI service is not configured"
- Make sure `OPENAI_API_KEY` is set in Convex environment variables
- Run `npx convex env list` to verify

### Error: "AI insights are only available for Pro members"
- Upgrade to Pro plan in Subscription page
- Verify your subscription status in Convex dashboard

### Error: "Financial profile not found"
- Complete your profile in Settings page
- Ensure you have at least monthly income/expenses entered

### Error: "AI service error: 400/401/403"
- Verify your API key is valid
- Check API key permissions in OpenAI Platform
- Ensure you have sufficient credits in your OpenAI account
- Verify the model `gpt-4o-mini` is available for your account

### Error: "AI service error: 429" (Rate Limit)
- You've exceeded the API rate limit
- Free tier has rate limits based on your OpenAI plan
- Wait 1-2 minutes before trying again
- Consider upgrading your OpenAI plan for higher limits
- Avoid rapid repeated requests

## API Usage

The backend generates exactly 5 insights covering:
1. Spending patterns
2. Savings behavior
3. Emergency fund status
4. Risk management
5. Next actionable step

Each insight includes:
- Type (spending/savings/emergency/risk/next_action)
- Title (brief, actionable)
- Explanation (2-3 sentences)
- Severity (good/warning/critical)
- Confidence (0-100)
- Action (specific step)

## Next Steps

After setup, the frontend will automatically:
- Display existing insights if available
- Allow Pro users to generate new insights
- Show appropriate error messages for Free users
