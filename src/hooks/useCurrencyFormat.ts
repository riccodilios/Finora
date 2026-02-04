"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

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
  const { currency, convert } = useCurrency();
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
      return formatCurrencyUtil(cached, currency, options);
    }

    // Trigger async conversion and cache result
    convert(amountSAR).then((converted) => {
      setConvertedAmounts((prev) => {
        const next = new Map(prev);
        next.set(amountSAR, converted);
        return next;
      });
    });

    // Return placeholder with SAR for now
    return formatCurrencyUtil(amountSAR, currency, options);
  };

  return {
    formatCurrency: formatCurrencySync,
    currency,
  };
}
