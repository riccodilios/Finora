/**
 * Currency conversion and formatting utilities
 * All amounts are stored in SAR internally
 */

export type Currency = 'SAR' | 'AED' | 'USD';
export type Region = 'ksa' | 'uae' | 'us';

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: string;
}

// Default exchange rates (fallback if API fails)
const DEFAULT_RATES: Record<Currency, number> = {
  SAR: 1.0,
  AED: 0.98,
  USD: 0.27,
};

/**
 * Convert amount from SAR to target currency
 */
export async function convertFromSAR(
  amountSAR: number,
  targetCurrency: Currency
): Promise<number> {
  if (targetCurrency === 'SAR') return amountSAR;

  try {
    const response = await fetch(
      `/api/exchange-rates?from=SAR&to=${targetCurrency}`
    );
    if (response.ok) {
      const data: ExchangeRate = await response.json();
      return amountSAR * data.rate;
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rate, using default:', error);
  }

  // Fallback to default rate
  return amountSAR * DEFAULT_RATES[targetCurrency];
}

/**
 * Format currency amount with proper formatting
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    locale?: string;
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    showSymbol = true,
    locale = "en-US",
  } = options || {};

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  if (!showSymbol) return formatted;

  const symbols: Record<Currency, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
    USD: '$',
  };

  return currency === 'USD'
    ? `${symbols[currency]}${formatted}`
    : `${formatted} ${symbols[currency]}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
    USD: '$',
  };
  return symbols[currency];
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency): string {
  const names: Record<Currency, string> = {
    SAR: 'Saudi Riyal',
    AED: 'UAE Dirham',
    USD: 'US Dollar',
  };
  return names[currency];
}

/**
 * Get region name
 */
export function getRegionName(region: Region): string {
  const names: Record<Region, string> = {
    ksa: 'Saudi Arabia',
    uae: 'United Arab Emirates',
    us: 'United States',
  };
  return names[region];
}

/**
 * Get default currency for region
 */
export function getDefaultCurrencyForRegion(region: Region): Currency {
  const mapping: Record<Region, Currency> = {
    ksa: 'SAR',
    uae: 'AED',
    us: 'USD',
  };
  return mapping[region];
}
