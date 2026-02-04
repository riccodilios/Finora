/**
 * DATA_CLASSIFICATION - Classifies data by sensitivity level
 * 
 * Used for access control and encryption decisions
 */

export type DataClassification = "personal" | "financial" | "behavioral";

export type DataField = 
  // Financial fields (HIGH SENSITIVITY - Must encrypt)
  | "monthlyIncome"
  | "monthlyExpenses"
  | "netWorth"
  | "emergencyFundCurrent"
  | "emergencyFundGoal"
  | "otherSavings"
  | "principal"
  | "monthlyPayment"
  | "value"
  | "monthlyContribution"
  | "amount" // When in financial context
  // Personal fields (MEDIUM SENSITIVITY)
  | "email"
  | "clerkUserId"
  | "name"
  | "displayNameAr"
  // Behavioral fields (LOW SENSITIVITY)
  | "riskTolerance"
  | "profileTags"
  | "financialGoals"
  | "preferences"
  | "usageStats";

/**
 * Get classification for a data field
 */
export function getFieldClassification(field: string): DataClassification {
  const financialFields: string[] = [
    "monthlyIncome",
    "monthlyExpenses",
    "netWorth",
    "emergencyFundCurrent",
    "emergencyFundGoal",
    "otherSavings",
    "principal",
    "monthlyPayment",
    "value",
    "monthlyContribution",
  ];

  const personalFields: string[] = [
    "email",
    "clerkUserId",
    "name",
    "displayNameAr",
  ];

  if (financialFields.includes(field)) {
    return "financial";
  }
  if (personalFields.includes(field)) {
    return "personal";
  }
  return "behavioral";
}

/**
 * Check if a field requires encryption
 */
export function requiresEncryption(field: string): boolean {
  return getFieldClassification(field) === "financial";
}

/**
 * Check if a field contains financial amount (in context)
 */
export function isFinancialAmount(field: string, context?: string): boolean {
  // If field is explicitly financial
  if (requiresEncryption(field)) {
    return true;
  }
  
  // If field is "amount" in financial context
  if (field === "amount") {
    const financialContexts = ["income", "expense", "debt", "investment", "payment", "savings"];
    return financialContexts.some(ctx => context?.toLowerCase().includes(ctx));
  }
  
  return false;
}
