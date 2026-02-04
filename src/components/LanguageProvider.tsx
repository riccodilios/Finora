"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getDictionary, getLocale, interpolate, type Language, type TranslationKey } from "@/i18n";

interface LanguageContextType {
  language: Language;
  locale: string;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  registerDbPersist?: (fn: (lang: Language) => void) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isInitialized, setIsInitialized] = useState(false);
  const persistToDbRef = useRef<((lang: Language) => void) | null>(null);

  // Register function to persist to database (called from LanguageSync)
  const registerDbPersist = (fn: (lang: Language) => void) => {
    persistToDbRef.current = fn;
  };

  // Apply language and RTL to HTML element
  const applyLanguage = (newLanguage: Language) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("lang", newLanguage);
      const direction = newLanguage === "ar" ? "rtl" : "ltr";
      root.setAttribute("dir", direction);
      // Force reflow to ensure RTL is applied
      root.style.direction = direction;
      
      // Apply font family based on language
      if (newLanguage === "ar") {
        root.style.fontFamily = "var(--font-cairo), var(--font-tajawal), system-ui, sans-serif";
      } else {
        root.style.fontFamily = "var(--font-inter), system-ui, sans-serif";
      }
    }
  };

  // Initialize language on mount
  useEffect(() => {
    if (isInitialized) return;

    // Check localStorage
    const storedLanguage = localStorage.getItem("language") as Language | null;
    
    if (storedLanguage && (storedLanguage === "en" || storedLanguage === "ar")) {
      setLanguageState(storedLanguage);
      applyLanguage(storedLanguage);
      setIsInitialized(true);
      return;
    }

    // Default to English
    setLanguageState("en");
    applyLanguage("en");
    setIsInitialized(true);
  }, [isInitialized]);

  // Apply language whenever state changes (after initialization)
  useEffect(() => {
    if (isInitialized) {
      applyLanguage(language);
    }
  }, [language, isInitialized]);

  // Set language and persist
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
    // Apply immediately
    applyLanguage(newLanguage);
    // Persist to database if function is registered
    if (persistToDbRef.current) {
      persistToDbRef.current(newLanguage);
    }
  };

  // Toggle language
  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    setLanguage(newLanguage);
  };

  const isRTL = language === "ar";
  const dir: "ltr" | "rtl" = isRTL ? "rtl" : "ltr";
  const locale = useMemo(() => {
    try {
      return getLocale(language);
    } catch {
      return "en-US"; // Fallback locale
    }
  }, [language]);
  const dict = useMemo(() => {
    try {
      return getDictionary(language);
    } catch {
      return getDictionary("en"); // Fallback dictionary
    }
  }, [language]);

  const t = useMemo(() => {
    return (key: TranslationKey, params?: Record<string, string | number>) => {
      const template = dict[key] ?? key;
      return interpolate(template, params);
    };
  }, [dict]);

  return (
    <LanguageContext.Provider value={{ language, locale, dir, isRTL, t, setLanguage, toggleLanguage, registerDbPersist }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { Language, TranslationKey };
