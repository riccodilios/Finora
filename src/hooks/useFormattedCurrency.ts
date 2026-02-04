"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";

/**
 * Hook that returns formatted currency values
 * Caches conversions for performance
 */
export function useFormattedCurrency(amountSAR: number) {
  const { convert, currency, isLoading } = useCurrency();
  const { locale } = useLanguage();
  const [formatted, setFormatted] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<number>(amountSAR);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const converted = await convert(amountSAR);
        if (!cancelled) {
          setConvertedAmount(converted);
          setFormatted(formatCurrencyUtil(converted, currency, { locale }));
        }
      } catch (error) {
        console.error("Currency conversion error:", error);
        if (!cancelled) {
          setFormatted(formatCurrencyUtil(amountSAR, "SAR", { locale }));
          setConvertedAmount(amountSAR);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [amountSAR, convert, currency, locale]);

  return {
    formatted: formatted || formatCurrencyUtil(amountSAR, currency, { locale }),
    convertedAmount,
    currency,
    isLoading,
  };
}
