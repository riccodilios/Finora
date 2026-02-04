# Dashboard Testing Guide

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - Sign in with your Clerk account

## Testing Checklist

### ✅ 1. Authentication & Navigation
- [ ] Sign in successfully
- [ ] Redirected to `/dashboard` after sign-in
- [ ] Navigation bar appears at top with tabs: Dashboard, Articles, AI Consultant, Subscription, Settings
- [ ] Active tab is highlighted (blue border)
- [ ] Can click between tabs without errors

### ✅ 2. Dashboard Page (`/dashboard`)
- [ ] Page loads without errors
- [ ] Shows "Finora Dashboard" heading
- [ ] Displays welcome message with your name/email
- [ ] Shows your current plan (Free or Pro)
- [ ] "System Status" section shows:
  - User in DB status
  - Plan status
  - Email
  - User ID
- [ ] "Your Plan" section displays correctly
- [ ] No console errors in browser DevTools

### ✅ 3. Articles Page (`/dashboard/articles`)
- [ ] Page loads without errors
- [ ] Shows "Articles" heading
- [ ] Displays "Coming Soon" message
- [ ] Shows placeholder article cards (gray boxes)
- [ ] Navigation tab is highlighted when on this page

### ✅ 4. AI Consultant Page (`/dashboard/ai`)
- [ ] Page loads without errors
- [ ] Shows "AI Consultant" heading
- [ ] Displays "Coming Soon" message
- [ ] Shows placeholder sections for:
  - Financial Analysis
  - Recommendations
- [ ] No loading spinner stuck on screen

### ✅ 5. Subscription Page (`/dashboard/subscription`)
- [ ] Page loads without errors
- [ ] Shows "Subscription" heading
- [ ] Displays your current plan (Free or Pro)
- [ ] If Free: Shows "Upgrade to Pro" section with link
- [ ] If Pro: Shows "Pro Features" list
- [ ] "Billing History" section shows placeholder
- [ ] No console errors

### ✅ 6. Settings Page (`/dashboard/settings`)
- [ ] Page loads without errors
- [ ] Shows "Settings" heading
- [ ] Displays form sections:
  - Account (Name, Email - read-only)
  - Financial Profile (Income, Expenses, etc.)
  - Preferences (Theme, Language)
- [ ] Can fill out form fields
- [ ] "Save Settings" button works
- [ ] Success/error message appears after saving

### ✅ 7. Pro Features Page (`/dashboard/pro`)
- [ ] If Free user: Shows "Pro Plan Required" message
- [ ] If Pro user: Shows "Pro Analytics Dashboard"
- [ ] Pro page displays analytics placeholders
- [ ] "Back to Dashboard" button works

## Error Scenarios to Test

### Test 1: Slow Network / Loading States
- [ ] All pages show loading spinner while data loads
- [ ] No blank screens or crashes during loading
- [ ] Pages eventually render even if Convex is slow

### Test 2: Missing Data
- [ ] Dashboard works even if user not in Convex DB yet
- [ ] Shows "Connecting..." or "Setting up..." status
- [ ] Plan defaults to "FREE" if data missing

### Test 3: Navigation While Loading
- [ ] Can switch tabs while pages are loading
- [ ] No errors when navigating quickly between tabs
- [ ] Each tab loads independently

### Test 4: Browser Console
- [ ] Open DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Should see NO red errors
- [ ] Warnings are OK (yellow)

## What Success Looks Like

✅ **All Good:**
- All pages load without errors
- Navigation works smoothly
- Data displays correctly (or shows placeholders)
- No console errors
- Loading states work properly

❌ **Problems to Watch For:**
- Blank white pages
- "Failed to compile" errors
- Console errors (red)
- Pages that never finish loading
- Navigation that doesn't work
- Crashes when clicking tabs

## Quick Test Script

Run through these URLs in order:
1. `http://localhost:3000/dashboard` - Main dashboard
2. `http://localhost:3000/dashboard/articles` - Articles
3. `http://localhost:3000/dashboard/ai` - AI Consultant
4. `http://localhost:3000/dashboard/subscription` - Subscription
5. `http://localhost:3000/dashboard/settings` - Settings

Each should load within 1-2 seconds and show content (or placeholders).

## Terminal Output to Check

When running `npm run dev`, you should see:
- ✅ "Compiled successfully" (green)
- ✅ "Ready" message
- ❌ NO "Failed to compile" errors
- ❌ NO "Error:" messages

## Browser DevTools Checks

1. **Console Tab:**
   - No red errors
   - Check for any React warnings

2. **Network Tab:**
   - All requests return 200 (success)
   - No failed requests

3. **React DevTools (if installed):**
   - Components render correctly
   - No error boundaries triggered
