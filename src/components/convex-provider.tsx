"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Initialize Convex client with error handling
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL is not set. Please check your .env.local file.");
}

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-8 max-w-md w-full border border-gray-200 dark:border-slate-800 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Configuration Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            NEXT_PUBLIC_CONVEX_URL is not configured. Please check your .env.local file.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            The app requires a Convex URL to function. Please set NEXT_PUBLIC_CONVEX_URL in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}