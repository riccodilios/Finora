"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Currency, Region } from "@/lib/currency";
import { convertFromSAR, formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { useLanguage } from "@/components/LanguageProvider";

interface CurrencyContextType {
  currency: Currency;
  region: Region;
  setCurrency: (currency: Currency) => Promise<void>;
  setRegion: (region: Region) => Promise<void>;
  convert: (amountSAR: number) => Promise<number>;
  format: (amountSAR: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number; showSymbol?: boolean }) => Promise<string>;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { locale } = useLanguage();
  const [currency, setCurrencyState] = useState<Currency>("SAR");
  const [region, setRegionState] = useState<Region>("ksa");
  const [isLoading, setIsLoading] = useState(true);

  const userPreferences = useQuery(
    api.functions.getUserPreferences,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  const updatePreferences = useMutation(api.functions.createOrUpdateUserPreferences);

  // Load preferences from database
  useEffect(() => {
    if (userPreferences) {
      setCurrencyState((userPreferences.currency as Currency) || "SAR");
      setRegionState((userPreferences.region as Region) || "ksa");
      setIsLoading(false);
    } else if (isLoaded && !user) {
      // Not logged in, use defaults
      setCurrencyState("SAR");
      setRegionState("ksa");
      setIsLoading(false);
    }
  }, [userPreferences, isLoaded, user]);

  const setCurrency = useCallback(
    async (newCurrency: Currency) => {
      setCurrencyState(newCurrency);
      if (user?.id) {
        try {
          await updatePreferences({
            clerkUserId: user.id,
            currency: newCurrency,
          });
        } catch (error) {
          console.error("Failed to save currency preference:", error);
        }
      }
    },
    [user, updatePreferences]
  );

  const setRegion = useCallback(
    async (newRegion: Region) => {
      setRegionState(newRegion);
      if (user?.id) {
        try {
          await updatePreferences({
            clerkUserId: user.id,
            region: newRegion,
          });
        } catch (error) {
          console.error("Failed to save region preference:", error);
        }
      }
    },
    [user, updatePreferences]
  );

  const convert = useCallback(
    async (amountSAR: number): Promise<number> => {
      if (currency === "SAR") return amountSAR;
      return await convertFromSAR(amountSAR, currency);
    },
    [currency]
  );

  const format = useCallback(
    async (
      amountSAR: number,
      options?: { minimumFractionDigits?: number; maximumFractionDigits?: number; showSymbol?: boolean }
    ): Promise<string> => {
      const converted = await convert(amountSAR);
      return formatCurrencyUtil(converted, currency, { ...options, locale });
    },
    [currency, convert, locale]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        region,
        setCurrency,
        setRegion,
        convert,
        format,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
