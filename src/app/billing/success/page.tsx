"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
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
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isManuallyVerifying, setIsManuallyVerifying] = useState(false);

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
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // If we have a payment ID, try to verify manually (for test payments)
        if (paymentId && user?.id) {
          try {
            const verifyResponse = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId,
                userId: user.id,
              }),
            });

            if (verifyResponse.ok) {
              console.log("Payment verified successfully");
            } else {
              const errorData = await verifyResponse.json();
              console.log("Payment verification response:", errorData);
              // Don't show error - webhook might have already processed it
            }
          } catch (error) {
            console.error("Manual verification error:", error);
            // Don't show error - webhook might have already processed it
          }
        }
        
        setIsVerifying(false);
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
              {verificationError && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                  {verificationError}
                </div>
              )}
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
                {paymentId && (
                  <button
                    onClick={async () => {
                      if (!user?.id || !paymentId) return;
                      setIsManuallyVerifying(true);
                      setVerificationError(null);
                      try {
                        const response = await fetch("/api/billing/verify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            paymentId,
                            userId: user.id,
                          }),
                        });
                        const data = await response.json();
                        if (response.ok) {
                          setVerificationError(null);
                          // Refresh page to show updated subscription
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          setVerificationError(data.error || "Failed to verify payment");
                        }
                      } catch (error: any) {
                        setVerificationError("Failed to verify payment. Please try again.");
                      } finally {
                        setIsManuallyVerifying(false);
                      }
                    }}
                    disabled={isManuallyVerifying}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isManuallyVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Verify Payment
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
