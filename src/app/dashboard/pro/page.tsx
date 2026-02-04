"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function ProFeaturesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Only query when user exists
  // Subscription is the source of truth for plan status
  const subscription = useQuery(
    api.functions.getSubscription,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const currentUser = useQuery(
    api.functions.getUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Show loading while query is in progress
  if (subscription === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  // Check if user is Pro - prefer subscription.plan as source of truth
  const plan = subscription?.plan || currentUser?.plan || "free";
  if (plan !== "pro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-xl shadow text-center max-w-md border border-gray-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="w-8 h-8 text-red-600 dark:text-red-400 shrink-0" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Pro required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This feature is available for Pro members. Upgrade to access advanced analytics.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard/subscription")}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors text-sm font-medium"
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pro Analytics Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Exclusive features for Pro members</p>
          </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Back
            </button>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Advanced Analytics</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-2">Revenue Trends</h3>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Monthly growth: <span className="font-bold">+15.3%</span>
                  </p>
                  <div className="h-4 bg-emerald-100 dark:bg-emerald-950/40 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <h3 className="font-bold text-green-800 dark:text-green-300 mb-2 text-lg">User Engagement</h3>
                  <p className="text-sm text-green-700 dark:text-green-400">Active sessions: <span className="font-bold">342</span></p>
                  <div className="h-4 bg-green-200 dark:bg-green-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-600 dark:bg-green-400 rounded-full w-3/5"></div>
                  </div>
                </div>
                
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                  <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-2 text-lg">Conversion Rate</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Free to Pro: <span className="font-bold">8.2%</span>
                  </p>
                  <div className="h-4 bg-emerald-100 dark:bg-emerald-950/40 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full w-[45%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Pro Benefits</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Real-time analytics</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Export to CSV/PDF</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Custom reports</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">API access</span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">White-label reports</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-lg mb-4 dark:text-gray-100">Your Pro Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">PRO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Since:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {currentUser?.upgradedAt 
                      ? new Date(currentUser.upgradedAt).toLocaleDateString() 
                      : 'Recently'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                  <span className="font-mono text-xs text-gray-800 dark:text-gray-200">{user.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
