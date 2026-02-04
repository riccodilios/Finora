/**
 * REGULATORY_COMPLIANCE - Regulatory Mode Utilities
 * 
 * This module provides utilities for enforcing regulatory compliance
 * and ensuring Finora is positioned as a personal finance management
 * and financial insights platform (NOT a bank or financial institution).
 * 
 * All functions here enforce non-banking positioning and prevent
 * any visual or functional implications of custody or banking services.
 */

import { isRegulatoryMode, enforceRegulatoryMode } from './feature-flags';

/**
 * Platform positioning constants
 */
export const PLATFORM_POSITIONING = {
  PRIMARY: 'Personal Finance Management Platform',
  SECONDARY: 'Financial Insights Platform',
  NOT_A_BANK: 'Finora is NOT a bank, credit union, or financial institution',
  NOT_LICENSED: 'Finora is NOT licensed, regulated, or supervised by SAMA or any financial regulatory body',
} as const;

/**
 * Check if regulatory mode is active
 */
export function isInRegulatoryMode(): boolean {
  return isRegulatoryMode();
}

/**
 * Enforce regulatory compliance (throws if violated)
 */
export function enforceCompliance(): void {
  enforceRegulatoryMode();
}

/**
 * Get platform positioning statement
 */
export function getPlatformPositioning(): {
  primary: string;
  secondary: string;
  disclaimers: string[];
} {
  return {
    primary: PLATFORM_POSITIONING.PRIMARY,
    secondary: PLATFORM_POSITIONING.SECONDARY,
    disclaimers: [
      PLATFORM_POSITIONING.NOT_A_BANK,
      PLATFORM_POSITIONING.NOT_LICENSED,
    ],
  };
}

/**
 * Validate that text/content doesn't imply banking services
 * Returns true if content is compliant, false if it suggests banking
 */
export function validateNonBankingContent(content: string): {
  isCompliant: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const lowerContent = content.toLowerCase();
  
  // Banking-related terms that should be avoided
  const bankingTerms = [
    'bank account',
    'deposit account',
    'checking account',
    'savings account',
    'hold your funds',
    'custody of assets',
    'safekeeping',
    'we hold',
    'we store your money',
    'we manage your money',
    'we invest your money',
    'we lend',
    'we provide credit',
    'we process payments',
    'we transfer funds',
    'we execute trades',
  ];
  
  bankingTerms.forEach(term => {
    if (lowerContent.includes(term)) {
      violations.push(`Content suggests banking services: "${term}"`);
    }
  });
  
  return {
    isCompliant: violations.length === 0,
    violations,
  };
}

/**
 * Sanitize content to remove banking implications
 */
export function sanitizeContent(content: string): string {
  let sanitized = content;
  
  // Replace banking-like phrases with compliant alternatives
  const replacements: [RegExp, string][] = [
    [/bank account/gi, 'financial profile'],
    [/deposit account/gi, 'financial profile'],
    [/we hold your/gi, 'you track your'],
    [/we store your money/gi, 'you track your finances'],
    [/we manage your money/gi, 'you manage your finances'],
    [/we invest your money/gi, 'you can track your investments'],
    [/we process payments/gi, 'you can track your payments'],
  ];
  
  replacements.forEach(([pattern, replacement]) => {
    sanitized = sanitized.replace(pattern, replacement);
  });
  
  return sanitized;
}

/**
 * Get compliant feature description
 * Ensures descriptions don't imply banking or custody
 */
export function getCompliantFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    'financial_tracking': 'Track and analyze your personal financial data',
    'insights': 'Get AI-powered insights into your financial patterns',
    'budgeting': 'Plan and monitor your income and expenses',
    'savings_goals': 'Set and track your savings goals',
    'expense_analysis': 'Analyze your spending patterns by category',
    'financial_metrics': 'View key financial metrics and trends',
  };
  
  return descriptions[feature] || 'Manage your personal finances';
}
