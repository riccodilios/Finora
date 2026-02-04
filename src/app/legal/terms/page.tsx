"use client";

import { getLegalContent } from "@/lib/LEGAL_COPY";
import { useLanguage } from "@/components/LanguageProvider";

export default function TermsPage() {
  const { language, isRTL } = useLanguage();
  const content = getLegalContent("terms", language);

  return (
    <div className={`min-h-screen bg-white dark:bg-[#0f172a] py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {content.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {content.lastUpdatedLabel} {content.lastUpdated}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {content.sections.map((section, index) => (
            <section key={index} className="border-b border-gray-200 dark:border-slate-700 pb-6 last:border-b-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {section.heading}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>{content.footerNote.heading}:</strong> {content.footerNote.content}
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <a
            href="/"
            className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm"
          >
            {content.backLink}
          </a>
        </div>
      </div>
    </div>
  );
}
