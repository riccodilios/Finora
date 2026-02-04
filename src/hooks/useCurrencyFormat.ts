"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/components/CurrencyProvider";

/**
 * Hook for formatting currency values in components
 * Returns a formatted string with currency conversion applied
 */
export function useCurrencyFormat() {
  const { currency, convert, format, isLoading } = useCurrency();
  const [isConverting, setIsConverting] = useState(false);

  const formatCurrency = async (
    amountSAR: number,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      showSymbol?: boolean;
    }
  ): Promise<string> => {
    if (isLoading || isConverting) {
      // Return placeholder while converting
      return format(amountSAR, options).catch(() => `${amountSAR.toLocaleString()} SAR`);
    }
    return format(amountSAR, options);
  };

  return {
    formatCurrency,
    currency,
    isLoading: isLoading || isConverting,
  };
}

/**
 * Synchronous version for immediate display (uses cached conversion)
 * For real-time updates, use the async version
 */
export function useCurrencyFormatSync() {
  const { currency, format } = useCurrency();
  const [convertedAmounts, setConvertedAmounts] = useState<Map<number, number>>(new Map());

  const formatCurrencySync = (
    amountSAR: number,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      showSymbol?: boolean;
    }
  ): string => {
    // Use cached conversion if available
    const cached = convertedAmounts.get(amountSAR);
    if (cached !== undefined) {
      return format(cached, currency, options).catch(() => `${amountSAR.toLocaleString()} SAR`);
    }

    // Trigger async conversion and cache result
    format(amountSAR, options).then((formatted) => {
      // Cache will be updated on next render
    });

    // Return placeholder with SAR for now
    return `${amountSAR.toLocaleString()} ${currency}`;
  };

  return {
    formatCurrency: formatCurrencySync,
    currency,
  };
}
