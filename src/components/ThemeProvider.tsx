"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage or system preference immediately
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light";
    
    // First, check localStorage
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme && (storedTheme === "light" || storedTheme === "dark")) {
      return storedTheme;
    }

    // If no stored theme, check system preference
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Apply theme to HTML element immediately
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    // Always remove first, then add if needed to ensure clean state
    root.classList.remove("dark");
    if (newTheme === "dark") {
      root.classList.add("dark");
    }
  }, []);

  // Apply initial theme immediately on mount
  useEffect(() => {
    if (isInitialized) return;
    applyTheme(theme);
    setIsInitialized(true);
  }, [isInitialized, theme, applyTheme]);

  // Watch for theme changes and apply immediately
  useEffect(() => {
    if (!isInitialized) return;
    applyTheme(theme);
  }, [theme, isInitialized, applyTheme]);

  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }, [applyTheme]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
