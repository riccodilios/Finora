"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side only rendering to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/");
    }
  }, [isLoaded, user, router]);

  // Show loading state until mounted and user data is loaded
  if (!isMounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render user-specific content if user doesn't exist (will redirect)
  if (!user) {
    return null;
  }

  // Safely access user properties with null checks
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "Unknown";
  const userId = user?.id ? user.id.substring(0, 12) + "..." : "Unknown";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-white">👋</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign Out</h1>
          
          <p className="text-gray-600 mb-6">
            You are currently signed in as:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="font-medium text-gray-900">{userEmail}</p>
            <p className="text-sm text-gray-500 mt-1">User ID: {userId}</p>
          </div>
          
          <p className="text-gray-600 mb-8">
            Are you sure you want to sign out of your Finora account?
          </p>
          
          <div className="space-y-4">
            <SignOutButton>
              <button className="w-full py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium rounded-lg hover:from-gray-900 hover:to-black transition-all duration-200 shadow-md">
                Yes, Sign Me Out
              </button>
            </SignOutButton>
            
            <Link 
              href="/dashboard"
              className="block w-full py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Need help?{" "}
              <a href="mailto:support@finora.com" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}