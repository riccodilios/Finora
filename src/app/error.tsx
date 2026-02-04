"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);

    // Auto-retry once for transient errors like "Illegal constructor"
    if (
      typeof window !== "undefined" &&
      typeof error?.message === "string" &&
      error.message.toLowerCase().includes("illegal constructor")
    ) {
      try {
        const key = "finora-last-illegal-constructor-path";
        const currentPath = window.location.pathname;
        const lastPath = window.sessionStorage.getItem(key);

        // Only auto-reset once per path to avoid infinite loops
        if (lastPath !== currentPath) {
          window.sessionStorage.setItem(key, currentPath);
          reset();
        }
      } catch {
        // If sessionStorage is not available, fall back to showing the error UI
      }
    }
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-8 max-w-md w-full border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-center mb-4">
          <AlertCircle size={48} className="w-12 h-12 text-red-600 dark:text-red-400 shrink-0" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors text-sm font-medium"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
