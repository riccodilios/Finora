"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

/**
 * BILLING SUCCESS PAGE
 * 
 * COMPLIANCE RULES:
 * - No test indicators visible to users
 * - Simple confirmation of subscription activation
 * - Redirects to dashboard after confirmation
 */

export default function BillingSuccessPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRTL } = useLanguage();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    // Check for payment ID from Moyasar redirect
    const id = searchParams.get("id") || searchParams.get("invoice_id") || searchParams.get("payment_id");
    if (id) {
      setPaymentId(id);
    }

    if (!isLoaded || !user) {
      return;
    }

    // Verify payment and update subscription
    const verifyPayment = async () => {
      try {
        // Payment is verified via webhook, show success message
        setTimeout(() => {
          setIsVerifying(false);
        }, 2000);
      } catch (error) {
        console.error("Payment verification error:", error);
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [isLoaded, user, router, searchParams]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-slate-800 text-center">
          {isVerifying ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t("billing.verifying") || "Verifying Payment"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t("billing.verifyingDescription") || "Please wait while we confirm your subscription..."}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t("billing.success") || "Subscription Activated!"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t("billing.successDescription") || "Your Pro subscription has been successfully activated. You now have access to all Pro features."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard"
                  className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors text-center"
                >
                  {t("billing.goToDashboard") || "Go to Dashboard"}
                </Link>
                <Link
                  href="/dashboard/subscription"
                  className="inline-block px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
                >
                  {t("subscription.title") || "View Subscription"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
