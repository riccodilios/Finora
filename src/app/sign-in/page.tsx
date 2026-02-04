"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  
  // Validate and sanitize redirect URL - only allow dashboard routes
  let safeRedirectUrl = "/dashboard";
  if (redirectUrl) {
    try {
      // Decode the URL first in case it's encoded
      const decodedUrl = decodeURIComponent(redirectUrl);
      
      // If it's a full URL, parse it; otherwise treat as pathname
      let pathname = decodedUrl;
      if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
        const url = new URL(decodedUrl);
        pathname = url.pathname;
      } else if (decodedUrl.startsWith("/")) {
        // Already a pathname
        pathname = decodedUrl;
      } else {
        // Might be a relative path, make it absolute
        pathname = "/" + decodedUrl.replace(/^\//, "");
      }
      
      // Only allow redirects to dashboard routes or home
      if (pathname.startsWith("/dashboard") || pathname === "/") {
        safeRedirectUrl = pathname;
      }
    } catch (e) {
      console.error("Error parsing redirect URL:", e, redirectUrl);
      // Invalid URL, use default
      safeRedirectUrl = "/dashboard";
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 transition-colors">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gray-900 dark:bg-white/5">
            <Image
              src="/finora-logo.png"
              alt="Finora"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to Finora</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to access your financial dashboard</p>
        </div>
        
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-8 transition-colors border border-gray-200 dark:border-slate-800">
          <SignIn 
            routing="hash"
            signUpUrl="/sign-up"
            afterSignInUrl={safeRedirectUrl}
            appearance={{
              elements: {
                rootBox: "w-full flex justify-center",
                card: "w-full mx-auto bg-transparent shadow-none",
                cardBox: "w-full bg-transparent",
                form: "w-full",
                formButtonPrimary: "bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-6 rounded-xl transition-colors text-sm w-full",
                formFieldInput: "rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm",
                formFieldLabel: "text-sm font-medium text-gray-700 dark:text-gray-300",
                formFieldSuccessText: "text-emerald-600 dark:text-emerald-400",
                formFieldErrorText: "text-red-600 dark:text-red-400",
                headerTitle: "text-gray-900 dark:text-gray-100",
                headerSubtitle: "text-gray-600 dark:text-gray-400",
                socialButtonsBlockButton: "rounded-xl border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800",
                socialButtonsBlockButtonText: "text-gray-700 dark:text-gray-300",
                dividerLine: "bg-gray-200 dark:bg-slate-700",
                dividerText: "text-gray-500 dark:text-gray-400",
                footer: "hidden",
                footerActionLink: "hidden",
                formFieldInputShowPasswordButton: "text-gray-500 dark:text-gray-400",
                identityPreviewText: "text-gray-900 dark:text-gray-100",
                identityPreviewEditButton: "text-emerald-600 dark:text-emerald-400",
                formFieldAction: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300",
                formButtonReset: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300",
                formResendCodeLink: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300",
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: false,
              },
            }}
          />
        </div>
        
        {/* Custom "Secured by Clerk" badge in Finora style */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Secured by Clerk</span>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
              Sign up
            </Link>
          </p>
          <p className="mt-4">
            <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}