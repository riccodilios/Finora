/**
 * FEATURE_FLAGS - Compliance-Focused Feature Guardrails
 * 
 * This configuration explicitly disables financial execution features
 * to ensure compliance with non-financial execution requirements.
 * 
 * CRITICAL: All flags default to DISABLED for safety.
 * Only enable features after explicit compliance review.
 * 
 * REGULATORY_MODE: When enabled, enforces strict regulatory compliance
 * and positions Finora as a personal finance management and financial
 * insights platform (NOT a bank or financial institution).
 */

export const FEATURE_FLAGS = {
  // ===== REGULATORY MODE =====
  
  /**
   * REGULATORY_MODE: Enables strict regulatory compliance mode
   * When enabled:
   * - Enforces non-banking positioning
   * - Disables all licensed financial services features
   * - Ensures all messaging positions Finora as a personal finance management platform
   * ENABLED: Regulatory compliance mode is active
   */
  REGULATORY_MODE: true,
  
  // ===== LICENSED FEATURES (DISABLED - Future hooks) =====
  
  /**
   * INVESTMENT_ADVISORY: Licensed investment advisory services
   * DISABLED: Requires investment advisory license
   * Hook for future: When licensed, can provide personalized investment recommendations
   */
  INVESTMENT_ADVISORY: false,
  
  /**
   * BROKERAGE_SERVICES: Securities trading and brokerage services
   * DISABLED: Requires brokerage license
   * Hook for future: When licensed, can execute trades on behalf of users
   */
  BROKERAGE_SERVICES: false,
  
  /**
   * CUSTODY_SERVICES: Asset custody and safekeeping
   * DISABLED: Requires custody license
   * Hook for future: When licensed, can hold and safeguard user assets
   */
  CUSTODY_SERVICES: false,
  
  /**
   * LENDING_SERVICES: Credit extension and lending
   * DISABLED: Requires lending license
   * Hook for future: When licensed, can extend credit to users
   */
  LENDING_SERVICES: false,
  
  /**
   * PAYMENT_PROCESSING: Third-party payment processing
   * DISABLED: Requires payment processing license
   * Hook for future: When licensed, can process payments between parties
   */
  PAYMENT_PROCESSING: false,
  
  /**
   * DEPOSIT_SERVICES: Deposit account services
   * DISABLED: Requires banking license
   * Hook for future: When licensed, can accept and hold deposits
   */
  DEPOSIT_SERVICES: false,
  
  /**
   * INSURANCE_PRODUCTS: Insurance product distribution
   * DISABLED: Requires insurance license
   * Hook for future: When licensed, can distribute insurance products
   */
  INSURANCE_PRODUCTS: false,
  
  /**
   * CRYPTO_CUSTODY: Cryptocurrency custody services
   * DISABLED: Requires crypto custody license
   * Hook for future: When licensed, can provide crypto custody services
   */
  CRYPTO_CUSTODY: false,
  
  // ===== EXISTING FEATURES =====
  // ===== FINANCIAL EXECUTION FEATURES (DISABLED) =====
  
  /**
   * Money Movement: Transfer funds between accounts
   * DISABLED: No money movement allowed
   */
  MONEY_MOVEMENT: false,
  
  /**
   * Transfers: Internal or external fund transfers
   * DISABLED: No transfer functionality allowed
   */
  TRANSFERS: false,
  
  /**
   * Payments: Payment processing and execution
   * NOTE: Subscription payments are allowed (user-to-platform only)
   * DISABLED: No payment execution features
   */
  PAYMENTS_EXECUTION: false,
  
  /**
   * Investment Execution: Execute investment trades or orders
   * DISABLED: No investment execution allowed
   */
  INVESTMENT_EXECUTION: false,
  
  /**
   * Credit Decisioning: Approve/deny credit applications
   * DISABLED: No credit decisioning allowed
   */
  CREDIT_DECISIONING: false,
  
  // ===== READ-ONLY MODE =====
  
  /**
   * READ_ONLY_MODE: When enabled, prevents all write operations
   * This is a global safety flag for compliance scenarios
   * DISABLED: Write operations are allowed (with other feature flags still enforced)
   */
  READ_ONLY_MODE: false as boolean,
  
  // ===== ALLOWED FEATURES =====
  
  /**
   * Subscription Payments: User-to-platform subscription payments
   * ENABLED: Subscription payments are allowed (user paying for service)
   */
  SUBSCRIPTION_PAYMENTS: true,
  
  /**
   * Financial Data Viewing: Read-only financial data display
   * ENABLED: Users can view their financial data
   */
  FINANCIAL_DATA_VIEWING: true,
  
  /**
   * Financial Data Entry: Manual entry of financial data
   * ENABLED: Users can manually update their financial profile
   */
  FINANCIAL_DATA_ENTRY: true,
  
  /**
   * AI Insights: AI-generated financial insights and recommendations
   * ENABLED: AI can provide analytical insights (non-directive)
   */
  AI_INSIGHTS: true,
  
  /**
   * AI Chat: AI financial consultant chat
   * ENABLED: AI chat is allowed (with neutral language enforcement)
   */
  AI_CHAT: true,
} as const;

/**
 * Type-safe feature flag checker
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] === true;
}

/**
 * Check if READ_ONLY_MODE is enabled
 */
export function isReadOnlyMode(): boolean {
  return FEATURE_FLAGS.READ_ONLY_MODE === true;
}

/**
 * Compliance guard: Throws error if feature is disabled
 */
export function requireFeature(flag: keyof typeof FEATURE_FLAGS): void {
  if (!isFeatureEnabled(flag)) {
    throw new Error(
      `Feature '${flag}' is disabled for compliance reasons. This action is not permitted.`
    );
  }
}

/**
 * Compliance guard: Returns false if feature is disabled (non-throwing)
 */
export function checkFeature(flag: keyof typeof FEATURE_FLAGS): boolean {
  return isFeatureEnabled(flag);
}

/**
 * Get all disabled features (for logging/debugging)
 */
export function getDisabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => !enabled)
    .map(([key]) => key);
}

/**
 * Check if REGULATORY_MODE is enabled
 */
export function isRegulatoryMode(): boolean {
  return FEATURE_FLAGS.REGULATORY_MODE === true;
}

/**
 * Get all licensed features (for future activation)
 */
export function getLicensedFeatures(): string[] {
  return [
    'INVESTMENT_ADVISORY',
    'BROKERAGE_SERVICES',
    'CUSTODY_SERVICES',
    'LENDING_SERVICES',
    'PAYMENT_PROCESSING',
    'DEPOSIT_SERVICES',
    'INSURANCE_PRODUCTS',
    'CRYPTO_CUSTODY',
  ];
}

/**
 * Check if any licensed feature is enabled (should be false in regulatory mode)
 */
export function hasAnyLicensedFeatureEnabled(): boolean {
  const licensedFeatures = getLicensedFeatures();
  return licensedFeatures.some(feature => 
    isFeatureEnabled(feature as keyof typeof FEATURE_FLAGS)
  );
}

/**
 * Compliance guard: Ensures regulatory mode compliance
 * Throws error if licensed features are enabled in regulatory mode
 */
export function enforceRegulatoryMode(): void {
  if (isRegulatoryMode() && hasAnyLicensedFeatureEnabled()) {
    throw new Error(
      'Licensed features cannot be enabled while REGULATORY_MODE is active. ' +
      'These features require appropriate licenses and regulatory approval.'
    );
  }
}
