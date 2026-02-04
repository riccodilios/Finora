"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/components/CurrencyProvider";

interface CurrencyDisplayProps {
  amountSAR: number;
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  };
  fallback?: string;
}

/**
 * Component that displays currency with automatic conversion
 * Handles async conversion and shows loading state
 */
export function CurrencyDisplay({ 
  amountSAR, 
  options,
  fallback 
}: CurrencyDisplayProps) {
  const { format, isLoading } = useCurrency();
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isConverting, setIsConverting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    const convertAndFormat = async () => {
      setIsConverting(true);
      try {
        const formatted = await format(amountSAR, options);
        if (!cancelled) {
          setDisplayValue(formatted);
          setIsConverting(false);
        }
      } catch (error) {
        console.error("Currency conversion error:", error);
        if (!cancelled) {
          setDisplayValue(fallback || `${amountSAR.toLocaleString()} SAR`);
          setIsConverting(false);
        }
      }
    };

    convertAndFormat();

    return () => {
      cancelled = true;
    };
  }, [amountSAR, format, options, fallback]);

  if (isLoading || isConverting) {
    return <span className="animate-pulse">{fallback || `${amountSAR.toLocaleString()}...`}</span>;
  }

  return <span>{displayValue}</span>;
}
