/**
 * AI COMPLIANCE - Guardrails for AI insights
 * 
 * Ensures AI insights are:
 * - Educational (informational only)
 * - Analytical (data-driven observations)
 * - Descriptive (factual descriptions)
 * 
 * Blocks:
 * - Investment recommendations
 * - Guarantees or promises
 * - Prescriptive advice ("you should", "you must")
 */

export interface ComplianceCheck {
  passed: boolean;
  violations: string[];
  sanitized: string;
}

/**
 * Prohibited phrases that indicate prescriptive advice
 */
const PROHIBITED_PHRASES = [
  // Directives
  "you should",
  "you must",
  "you need to",
  "you have to",
  "you ought to",
  "you are required to",
  "you are obligated to",
  
  // Guarantees
  "guaranteed",
  "will definitely",
  "will certainly",
  "will always",
  "will never",
  "assured",
  "promised",
  
  // Investment recommendations
  "invest in",
  "buy",
  "sell",
  "purchase",
  "trade",
  "recommend investing",
  "suggest buying",
  "advise purchasing",
  
  // Financial advice
  "financial advisor recommends",
  "we recommend",
  "we suggest",
  "we advise",
  "our recommendation",
  
  // Absolute statements
  "always",
  "never",
  "definitely",
  "certainly",
  "absolutely",
];

/**
 * Replacement phrases for prohibited language
 */
const REPLACEMENTS: Record<string, string> = {
  "you should": "you may consider",
  "you must": "you might want to",
  "you need to": "you could",
  "you have to": "one option could be",
  "will definitely": "may",
  "will certainly": "could",
  "guaranteed": "potentially",
  "always": "often",
  "never": "rarely",
  "definitely": "likely",
  "certainly": "possibly",
};

/**
 * Check if text contains prohibited phrases
 */
function containsProhibitedPhrases(text: string): string[] {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const phrase of PROHIBITED_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      violations.push(phrase);
    }
  }
  
  return violations;
}

/**
 * Sanitize text by replacing prohibited phrases
 */
function sanitizeText(text: string): string {
  let sanitized = text;
  
  for (const [prohibited, replacement] of Object.entries(REPLACEMENTS)) {
    const regex = new RegExp(prohibited, "gi");
    sanitized = sanitized.replace(regex, replacement);
  }
  
  return sanitized;
}

/**
 * Check compliance of AI insight text
 */
export function checkCompliance(text: string): ComplianceCheck {
  const violations = containsProhibitedPhrases(text);
  const sanitized = violations.length > 0 ? sanitizeText(text) : text;
  
  return {
    passed: violations.length === 0,
    violations,
    sanitized,
  };
}

/**
 * Check compliance of entire insight object
 */
export function checkInsightCompliance(insight: {
  title?: string;
  explanation?: string;
  action?: string;
  [key: string]: any;
}): {
  title: ComplianceCheck;
  explanation: ComplianceCheck;
  action: ComplianceCheck;
  overall: ComplianceCheck;
} {
  const titleCheck = checkCompliance(insight.title || "");
  const explanationCheck = checkCompliance(insight.explanation || "");
  const actionCheck = checkCompliance(insight.action || "");
  
  const allText = [
    insight.title || "",
    insight.explanation || "",
    insight.action || "",
  ].join(" ");
  const overallCheck = checkCompliance(allText);
  
  return {
    title: titleCheck,
    explanation: explanationCheck,
    action: actionCheck,
    overall: overallCheck,
  };
}

/**
 * Generate "Why am I seeing this?" explanation based on insight type and data
 */
export function generateWhyExplanation(
  insightType: string,
  financialData: {
    monthlyIncome?: number;
    monthlyExpenses?: number;
    savingsRate?: number;
    emergencyFundProgress?: number;
    [key: string]: any;
  }
): string {
  const explanations: Record<string, string> = {
    spending: `This insight is based on your expense-to-income ratio of ${financialData.monthlyExpenses && financialData.monthlyIncome ? ((financialData.monthlyExpenses / financialData.monthlyIncome) * 100).toFixed(1) : "N/A"}%. It compares your spending patterns to general financial benchmarks.`,
    
    savings: `This insight analyzes your savings rate of ${financialData.savingsRate?.toFixed(1) || "N/A"}% and monthly savings amount. It's based on the difference between your income and expenses.`,
    
    emergency: `This insight is generated because your emergency fund is ${financialData.emergencyFundProgress?.toFixed(1) || "N/A"}% of your goal. It compares your current coverage to recommended emergency fund levels.`,
    
    risk: `This insight is based on your risk tolerance profile and net worth. It provides analytical observations about your financial position.`,
    
    next_action: `This insight suggests potential next steps based on patterns in your financial data. It's informational and educational only.`,
  };
  
  return explanations[insightType] || "This insight is based on your financial data and provides analytical observations for educational purposes.";
}

/**
 * Add confidence language to text if missing
 */
export function addConfidenceLanguage(text: string): string {
  // Check if text already contains confidence indicators
  const confidenceIndicators = ["may", "could", "might", "potentially", "possibly", "based on", "according to"];
  const hasConfidenceLanguage = confidenceIndicators.some(indicator => 
    text.toLowerCase().includes(indicator)
  );
  
  if (hasConfidenceLanguage) {
    return text;
  }
  
  // Add confidence language at the beginning if it's a statement
  if (text.trim().length > 0 && !text.toLowerCase().startsWith("based on")) {
    return `Based on your data, ${text.charAt(0).toLowerCase() + text.slice(1)}`;
  }
  
  return text;
}

/**
 * Validate insight is educational/analytical only
 */
export function validateInsightIntent(insight: {
  title?: string;
  explanation?: string;
  action?: string;
}): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const allText = [
    insight.title || "",
    insight.explanation || "",
    insight.action || "",
  ].join(" ").toLowerCase();
  
  // Check for investment recommendations
  if (allText.includes("invest") || allText.includes("buy") || allText.includes("sell")) {
    issues.push("Contains investment recommendations");
  }
  
  // Check for guarantees
  if (allText.includes("guarantee") || allText.includes("will definitely") || allText.includes("assured")) {
    issues.push("Contains guarantees or promises");
  }
  
  // Check for prescriptive language
  if (allText.includes("you should") || allText.includes("you must") || allText.includes("you need to")) {
    issues.push("Contains prescriptive advice");
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}
