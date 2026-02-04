"use client";

import Link from "next/link";
import { getFooterDisclaimer, getFooterLinkText, getFooterCopyright } from "@/lib/LEGAL_COPY";
import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { language, isRTL } = useLanguage();
  const disclaimer = getFooterDisclaimer(language);
  const copyright = getFooterCopyright(language);

  return (
    <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`flex flex-col ${isRTL ? "items-end" : "items-start"} space-y-4`}>
          {/* Disclaimer Text */}
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-4xl">
            {disclaimer}
          </p>

          {/* Legal Links */}
          <div className={`flex flex-wrap gap-4 ${isRTL ? "flex-row-reverse" : ""} text-xs`}>
            <Link
              href="/legal/disclaimer"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline"
            >
              {getFooterLinkText("disclaimer", language)}
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link
              href="/legal/terms"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline"
            >
              {getFooterLinkText("terms", language)}
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link
              href="/legal/privacy"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline"
            >
              {getFooterLinkText("privacy", language)}
            </Link>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <Link
              href="/infrastructure"
              className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline"
            >
              {getFooterLinkText("infrastructure", language)}
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
