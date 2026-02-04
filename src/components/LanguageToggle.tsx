"use client";

import { useLanguage } from "./LanguageProvider";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="relative inline-flex items-center h-8 w-16 rounded-full bg-gray-200 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 overflow-hidden"
      aria-label={`Switch to ${language === "en" ? "Arabic" : "English"}`}
      title={`Switch to ${language === "en" ? "Arabic" : "English"}`}
    >
      {/* Sliding thumb with label */}
      <span
        className={`absolute top-1 h-6 w-7 rounded-full bg-white dark:bg-slate-900 shadow-md text-[10px] font-semibold text-gray-800 dark:text-gray-100 flex items-center justify-center transition-all duration-200 ${
          language === "en" ? "left-1" : "right-1"
        }`}
      >
        {language === "en" ? "EN" : "AR"}
      </span>
    </button>
  );
}
