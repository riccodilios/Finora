"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { checkFeature, isReadOnlyMode } from "@/lib/feature-flags";

export default function SubscriptionPage() {
  const { user, isLoaded } = useUser();
  const { t, isRTL } = useLanguage();
  
  // COMPLIANCE GUARD: Check if subscription payments are enabled
  const subscriptionPaymentsEnabled = checkFeature("SUBSCRIPTION_PAYMENTS");
  const readOnlyMode = isReadOnlyMode();
  
  // Query subscription from new subscriptions table
  const subscription = useQuery(
    api.functions.getSubscription,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Also query user for backward compatibility (in case subscription doesn't exist yet)
  const currentUser = useQuery(
    api.functions.getUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Mutation to create subscription if missing
  const createSubscriptionIfMissing = useMutation(
    api.functions.createSubscriptionIfMissing
  );
  const updateSubscriptionPlan = useMutation(
    api.functions.updateSubscriptionPlan
  );

  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [billingView, setBillingView] = useState<"monthly" | "annual">("monthly");
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Create subscription if user exists but subscription doesn't (for existing Pro users)
  useEffect(() => {
    if (isLoaded && user?.id && currentUser && !subscription) {
      createSubscriptionIfMissing({
        clerkUserId: user.id,
        plan: currentUser.plan,
      }).catch((error) => {
        console.error("Failed to create subscription:", error);
      });
    }
  }, [isLoaded, user?.id, currentUser, subscription, createSubscriptionIfMissing]);

  // Handle upgrade to Pro
  const handleUpgrade = async () => {
    if (!user) return;
    
    // COMPLIANCE GUARD: Check if subscription payments are enabled
    if (!subscriptionPaymentsEnabled) {
      setPaymentError("Subscription payments are currently disabled for compliance reasons.");
      return;
    }
    
    // COMPLIANCE GUARD: Check if system is in read-only mode
    if (readOnlyMode) {
      setPaymentError("System is in read-only mode. Payment operations are disabled.");
      return;
    }
    
    // Guardrail: Prevent Pro users from initiating upgrade
    const currentPlan = subscription?.plan || currentUser?.plan || "free";
    if (currentPlan === "pro") {
      setPaymentError(t("subscription.error.alreadyPro"));
      return;
    }
    
    // Guardrail: Prevent multiple simultaneous upgrade attempts
    if (isProcessingPayment) {
      return;
    }
    
    setIsProcessingPayment(true);
    setPaymentError(null);
    
    try {
      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          billingCycle: billingView,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        
        // Show the actual error message from the API
        const errorMessage = errorData.error || t("subscription.error.generic");
        console.error("Payment API error:", {
          status: response.status,
          error: errorData,
        });
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.paymentUrl) {
        throw new Error("Payment service did not return a valid payment URL. Please try again.");
      }
      
      // Redirect to Moyasar hosted payment page
      window.location.href = data.paymentUrl;
      // Note: isProcessingPayment will remain true since we're redirecting
      // This prevents double-clicks before redirect completes
    } catch (error: any) {
      console.error("Payment initiation failed:", error);
      
      // Provide user-friendly error message
      const errorMessage = error.message || t("subscription.error.generic");
      setPaymentError(errorMessage);
      setIsProcessingPayment(false);
    }
  };

  // Handle downgrade to Basic (free)
  const handleDowngrade = async () => {
    if (!user) return;
    if (isChangingPlan) return;
    
    // COMPLIANCE GUARD: Check if system is in read-only mode
    if (readOnlyMode) {
      setPaymentError("System is in read-only mode. Plan changes are disabled.");
      return;
    }

    setIsChangingPlan(true);
    setPaymentError(null);

    try {
      await updateSubscriptionPlan({
        clerkUserId: user.id,
        newPlan: "free",
      });
      // Simple reload to reflect new plan everywhere
      window.location.reload();
    } catch (error: any) {
      console.error("Plan change failed:", error);
      const errorMessage = error?.message || t("subscription.error.generic");
      setPaymentError(errorMessage);
    } finally {
      setIsChangingPlan(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">
          {t("subscription.signInRequired")}
        </p>
      </div>
    );
  }

  // Show loading state while subscription/user data is loading
  if (subscription === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("subscription.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Safe defaults when data is loading or missing
  // Fallback to users.plan for backward compatibility if subscription doesn't exist yet
  const plan = subscription?.plan || currentUser?.plan || "free";
  const isPro = plan === "pro";
  const planDisplay =
    plan === "pro" ? t("subscription.plan.pro") : t("subscription.plan.free");
  const status = subscription?.status || (plan === "pro" ? "active" : "trial");
  const billingCycle = subscription?.billingCycle || "monthly";

  const statusLabel = t("subscription.currentPlan.status", {
    status: t(`subscription.status.${status}` as any),
    billing: t(
      `subscription.billingLabel.${
        billingCycle === "annual" ? "annual" : "monthly"
      }` as any,
    ),
  });

  const isMonthly = billingView === "monthly";
  const proPriceValue = isMonthly ? 60 : 600;
  const proPriceSuffix = isMonthly ? "/month" : "/year";
  const proPriceLabel = `${proPriceValue.toLocaleString()} SAR${proPriceSuffix}`;

  return (
    <div
      className={`space-y-6 ${isRTL ? "text-right" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t("subscription.title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("subscription.subtitle")}
        </p>
      </div>
      
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-8 border border-gray-200 dark:border-slate-800">
        {/* Billing toggle centered */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em]">
            {t("subscription.ui.billingLabel")}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setBillingView("monthly")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                isMonthly
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {t("subscription.billing.monthly")}
            </button>
            <button
              type="button"
              onClick={() => setBillingView("annual")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                !isMonthly
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {t("subscription.billing.annual")}
            </button>
            {!isMonthly && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                {t("subscription.ui.save16")}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("subscription.ui.currentPlanLabel")}:{" "}
            <span className="font-semibold">
              {isPro ? t("subscription.plan.pro") : t("subscription.plan.basicLabel")}
            </span>{" "}
            · {statusLabel}
          </p>
        </div>

        {/* Two-pill layout: Basic and Pro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t("subscription.plan.basicLabel")}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("subscription.plan.basicDescription")}
                  </p>
                </div>
                { !isPro && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                    {t("subscription.ui.currentPlanLabel")}
                  </span>
                )}
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  0<span className="text-base align-top">.00</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                    {t("subscription.ui.priceSuffixMonthly")}
                  </span>
                </p>
              </div>

              <ul className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>• {t("subscription.ui.basic.features.dashboard")}</li>
                <li>• {t("subscription.ui.basic.features.tracking")}</li>
                <li>• {t("subscription.ui.basic.features.reports")}</li>
                <li>• {t("subscription.ui.basic.features.chats")}</li>
              </ul>
            </div>

            <button
              disabled={!isPro || isChangingPlan || !subscriptionPaymentsEnabled || readOnlyMode}
              onClick={handleDowngrade}
              className={`mt-6 w-full px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                !isPro
                  ? "border-gray-300 dark:border-slate-700 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-900 cursor-default"
                  : "border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
            >
              {!isPro
                ? t("subscription.ui.currentPlanLabel")
                : isChangingPlan
                ? t("subscription.ui.switching")
                : t("subscription.ui.downgradeToBasic")}
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-emerald-400/70 bg-emerald-50 dark:bg-emerald-900/20 p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    {t("subscription.plan.proLabel")}
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-200">
                    {t("subscription.plan.pro.features.insights")}
                  </p>
                </div>
                {isPro && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                    {t("subscription.ui.currentPlanLabel")}
                  </span>
                )}
              </div>

              <div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {proPriceValue.toLocaleString()}
                  <span className="text-sm font-medium text-emerald-800/80 dark:text-emerald-200 ml-1">
                    {isMonthly
                      ? t("subscription.ui.priceSuffixMonthly")
                      : t("subscription.ui.priceSuffixYearly")}
                  </span>
                </p>
                {!isMonthly && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-200">
                    {t("subscription.ui.save16")}
                  </p>
                )}
              </div>

              <ul className="mt-3 space-y-1 text-xs text-emerald-900 dark:text-emerald-100">
                <li>• {t("subscription.ui.pro.features.everythingBasic")}</li>
                <li>• {t("subscription.ui.pro.features.chats")}</li>
                <li>• {t("subscription.ui.pro.features.insightsShort")}</li>
                <li>• {t("subscription.ui.pro.features.prioritySupport")}</li>
              </ul>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={isPro || isProcessingPayment || !subscriptionPaymentsEnabled || readOnlyMode}
              className={`mt-6 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isPro || isProcessingPayment
                  ? "bg-emerald-600/60 text-white cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
              }`}
            >
              {isProcessingPayment
                ? t("subscription.ui.processing")
                : isPro
                ? t("subscription.ui.currentPlanLabel")
                : t("subscription.cta.upgrade")}
            </button>
          </div>
        </div>

        {paymentError && (
          <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            <div className="flex items-start">
              <AlertCircle
                size={20}
                className="w-5 h-5 text-red-600 shrink-0 mr-2 mt-0.5"
              />
              <div>
                <p className="font-medium">Payment error</p>
                <p className="mt-1">{paymentError}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          {t("subscription.billingHistory.title")}
        </h2>
        {/* TODO: Real payment gateway lifecycle - Intentionally deferred — not part of MVP backend completion.
            Future implementation should display:
            - List of all payment transactions from payments table
            - Invoice download links
            - Payment status and dates
            - Subscription renewal history
            - Failed payment attempts
        */}
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {t("subscription.billingHistory.emptyTitle")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
            {isPro
              ? t("subscription.billingHistory.proDescription")
              : t("subscription.billingHistory.freeDescription")}
          </p>
          {!isPro && (
            <button
              onClick={handleUpgrade}
              disabled={isProcessingPayment || !subscriptionPaymentsEnabled || readOnlyMode}
              className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {t("subscription.cta.upgrade")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
