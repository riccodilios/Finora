import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-8 max-w-md w-full text-center border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-center mb-4">
          <FileQuestion size={64} className="w-16 h-16 text-gray-400 dark:text-gray-500 shrink-0" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors text-sm font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
