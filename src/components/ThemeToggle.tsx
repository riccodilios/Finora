"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon size={18} className="w-[18px] h-[18px] text-gray-600 dark:text-gray-300 shrink-0" />
      ) : (
        <Sun size={18} className="w-[18px] h-[18px] text-gray-600 dark:text-gray-300 shrink-0" />
      )}
    </button>
  );
}
