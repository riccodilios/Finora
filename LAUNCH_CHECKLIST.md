# Official Launch Checklist

## 🎯 Pre-Launch Requirements

### ✅ Completed
- [x] GDPR compliance (consent, data export, deletion, audit logs)
- [x] AI compliance (intent validation, confidence language, explanations)
- [x] Regulatory mode enabled (non-banking positioning)
- [x] Feature flags system (licensed features disabled)
- [x] Legal pages (Privacy Policy, Terms, Disclaimer) - English & Arabic
- [x] Encryption for sensitive financial data
- [x] RBAC (Role-Based Access Control)
- [x] Multi-language support (English & Arabic with RTL)
- [x] Currency support (SAR, AED, USD)
- [x] AI insights generation
- [x] AI consultant chat
- [x] Financial dashboard with metrics
- [x] Subscription management
- [x] User settings and preferences
- [x] Account deletion (soft → hard)
- [x] Data export functionality

### 🔴 Critical - Must Fix Before Launch

#### 1. Environment Variables & Configuration
- [ ] **Production Clerk Keys**
  - Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (production)
  - Set `CLERK_SECRET_KEY` (production)
  - Verify webhook endpoints configured in Clerk dashboard

- [ ] **Production Moyasar Keys**
  - Set `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` (production)
  - Set `MOYASAR_SECRET_KEY` (production)
  - Set `MOYASAR_WEBHOOK_SECRET` (production) - **CRITICAL for webhook verification**
  - Configure webhook URL in Moyasar dashboard: `https://your-domain.com/api/webhooks/moyasar`

- [ ] **Convex Production Deployment**
  - Run `npx convex deploy --prod`
  - Set `NEXT_PUBLIC_CONVEX_URL` (production URL)
  - Set `CONVEX_DEPLOYMENT_URL` (production URL)
  - Verify all functions are deployed

- [ ] **OpenAI API Key** (for AI features)
  - Set `OPENAI_API_KEY` in Convex production environment
  - Run: `npx convex env set OPENAI_API_KEY "your-key" --prod`

- [ ] **News API Key** (optional, for news articles)
  - Set `NEWS_API_KEY` in production environment
  - Or remove news feature if not needed

- [ ] **App URL**
  - Set `NEXT_PUBLIC_APP_URL` to production domain (e.g., `https://finora.app`)

#### 2. Security & Production Hardening
- [ ] **Remove Test Endpoints**
  - Delete or protect `src/app/api/test-convex/route.ts`
  - Add authentication if keeping for admin use

- [ ] **Webhook Signature Verification**
  - Implement proper Moyasar webhook signature verification
  - Currently has TODO comment in `src/app/api/webhooks/moyasar/route.ts:72`
  - Install `moyasar` package for signature verification

- [ ] **Middleware Update**
  - Update `src/middleware.ts` to use `authMiddleware` instead of deprecated `withClerkMiddleware`
  - Prevents future breaking changes

- [ ] **Error Handling**
  - Fix plan enforcement middleware error handling (currently allows access on error)
  - Add React Error Boundaries for graceful error handling
  - Add proper error logging/monitoring (Sentry, LogRocket, etc.)

- [ ] **Rate Limiting**
  - Add rate limiting to API routes
  - Protect against abuse and DDoS

- [ ] **Admin User ID**
  - Move hardcoded admin user ID to environment variable
  - Currently in `src/app/dashboard/page.tsx:94`

#### 3. Payment System
- [ ] **Recurring Subscription Billing**
  - Currently only handles one-time payments
  - Implement monthly/annual renewal logic
  - Handle subscription expiration
  - Add grace period for failed payments

- [ ] **Subscription Lifecycle**
  - Subscription cancellation handling
  - Subscription downgrade/upgrade flows
  - Prorated billing calculations
  - Payment retry logic for failed payments

- [ ] **Invoice Generation**
  - Generate and email invoices to users
  - Store invoice records in database

- [ ] **Payment Method Management**
  - Allow users to save/update payment methods
  - Handle card expiration

#### 4. Code Cleanup
- [ ] **Remove Backup Files**
  - Delete `convex_backup/` directory (if not needed)
  - Delete `src/app/dashboard/page.old.tsx` (if not needed)
  - Remove any other `.old` or backup files

- [ ] **Clean Up TODOs**
  - Review and address or document all TODO comments
  - Remove development-only code

- [ ] **Fix Known Bugs**
  - Monthly revenue calculation bug (mutates date object)
  - Payment stats missing error handling
  - Settings page setTimeout cleanup pattern

### 🟡 Important - Should Fix Soon

#### 5. Monitoring & Observability
- [ ] **Error Tracking**
  - Set up Sentry, LogRocket, or similar
  - Track client-side errors
  - Track server-side errors
  - Set up alerts for critical errors

- [ ] **Analytics**
  - Set up user analytics (privacy-compliant)
  - Track key metrics (sign-ups, conversions, feature usage)
  - Monitor performance metrics

- [ ] **Logging**
  - Structured logging for production
  - Log rotation and retention policies
  - Separate logs by environment

#### 6. Performance Optimization
- [ ] **Image Optimization**
  - Ensure all images are optimized
  - Use Next.js Image component properly
  - Add proper alt text for accessibility

- [ ] **Bundle Size**
  - Analyze bundle size
  - Code splitting where appropriate
  - Remove unused dependencies

- [ ] **Database Optimization**
  - Review Convex query performance
  - Add indexes where needed
  - Optimize expensive queries

- [ ] **Caching Strategy**
  - Implement proper caching for static content
  - Cache API responses where appropriate
  - Set proper cache headers

#### 7. Testing
- [ ] **End-to-End Testing**
  - Test complete user flows (sign-up → onboarding → dashboard)
  - Test payment flow end-to-end
  - Test AI features with real API keys
  - Test multi-language switching

- [ ] **Load Testing**
  - Test with multiple concurrent users
  - Verify database performance under load
  - Test API rate limits

- [ ] **Security Testing**
  - Penetration testing
  - SQL injection testing (if applicable)
  - XSS testing
  - CSRF protection verification

#### 8. Documentation
- [ ] **User Documentation**
  - User guide/help center
  - FAQ section
  - Video tutorials (optional)

- [ ] **Developer Documentation**
  - API documentation (if exposing APIs)
  - Deployment guide
  - Environment variable documentation
  - Architecture overview

- [ ] **Operations Documentation**
  - Runbook for common issues
  - Incident response procedures
  - Backup and recovery procedures

### 🟢 Nice to Have - Post-Launch

#### 9. Feature Enhancements
- [ ] **Recurring Subscriptions**
  - Automatic monthly/annual renewals
  - Subscription management UI improvements

- [ ] **Email Notifications**
  - Welcome emails
  - Payment confirmations
  - Subscription renewal reminders
  - Account activity notifications

- [ ] **Mobile App** (if planned)
  - React Native or native app
  - Push notifications

- [ ] **Advanced Analytics**
  - More detailed financial insights
  - Trend analysis
  - Goal tracking improvements

#### 10. Marketing & Growth
- [ ] **SEO Optimization**
  - Meta tags
  - Sitemap
  - robots.txt
  - Structured data

- [ ] **Social Media Integration**
  - Social sharing
  - Social login (if needed)

- [ ] **Referral Program** (if planned)
  - Referral links
  - Rewards system

## 📋 Launch Day Checklist

### Pre-Launch (24 hours before)
- [ ] Final security review
- [ ] Backup all data
- [ ] Verify all environment variables are set
- [ ] Test payment flow with real payment gateway (test mode)
- [ ] Verify webhook endpoints are accessible
- [ ] Check all legal pages are accessible
- [ ] Verify GDPR compliance features work
- [ ] Test account deletion flow
- [ ] Test data export functionality
- [ ] Verify AI features work with production API keys
- [ ] Test in production-like environment

### Launch Day
- [ ] Switch payment gateway to production mode
- [ ] Monitor error logs closely
- [ ] Monitor payment webhooks
- [ ] Monitor user sign-ups
- [ ] Have rollback plan ready
- [ ] Team on standby for issues

### Post-Launch (First Week)
- [ ] Monitor error rates
- [ ] Monitor payment success rates
- [ ] Monitor user feedback
- [ ] Review analytics
- [ ] Address critical bugs immediately
- [ ] Plan first update/improvements

## 🔐 Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled everywhere
- [ ] CORS properly configured
- [ ] Rate limiting on API routes
- [ ] Input validation on all user inputs
- [ ] SQL injection protection (if applicable)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure session management
- [ ] Encryption at rest for sensitive data
- [ ] Encryption in transit (HTTPS)
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

## 📊 Success Metrics to Track

- User sign-ups
- Payment conversion rate
- Active users (DAU/MAU)
- Feature usage (AI insights, chat, etc.)
- Error rates
- Page load times
- Payment success rate
- User retention
- Support ticket volume

## 🚨 Rollback Plan

1. **Immediate Rollback Triggers:**
   - Critical security vulnerability
   - Payment processing failures
   - Data loss or corruption
   - Widespread user-facing errors

2. **Rollback Steps:**
   - Revert to previous deployment
   - Disable new features via feature flags
   - Notify users if necessary
   - Investigate and fix issues
   - Re-deploy when ready

## 📝 Notes

- Most critical items are environment variables and payment webhook verification
- Recurring subscriptions can be added post-launch if needed
- Monitoring and error tracking should be set up before launch
- Test thoroughly in staging environment that mirrors production
