"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Automatically redirect logged-in users to the dashboard
  useEffect(() => {
    if (isLoaded && user) {
      router.replace("/dashboard");
    }
  }, [isLoaded, user, router]);

  // While auth state is loading or redirecting, show a minimal loader
  if (!isLoaded || (isLoaded && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-900 dark:bg-white/5">
                <Image
                  src="/finora-logo.png"
                  alt="Finora"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finora</span>
            </div>
            
            <Link 
              href="/sign-in"
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Get Started with{" "}
            <span className="text-emerald-600 dark:text-emerald-400">Finora</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Your personal finance management platform. Track your finances, gain AI-powered insights, 
            and make informed decisions—all in one intuitive dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/sign-up"
              className="group px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors text-base shadow hover:shadow-md flex items-center"
            >
              Get Started with Finora
              <ArrowRight size={18} className="w-[18px] h-[18px] shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/sign-in"
              className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>

          {/* Features Preview */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Financial Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get AI-powered insights into your financial patterns and opportunities
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Finance Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track income, expenses, and savings to understand your financial health
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your financial progress and track your goals over time
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2026 Finora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}