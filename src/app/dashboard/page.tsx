"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { FileText, TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, DollarSign, Edit, LineChart, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CashFlowCard } from "@/components/dashboard/CashFlowCard";
import { ExpenseBreakdownCard } from "@/components/dashboard/ExpenseBreakdownCard";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";
import { EmergencyFundCard } from "@/components/dashboard/EmergencyFundCard";
import { NewsFeedCard } from "@/components/dashboard/NewsFeedCard";
import { EditFinancialDataModal } from "@/components/EditFinancialDataModal";
import { useCurrency } from "@/components/CurrencyProvider";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { useFormattedCurrency } from "@/hooks/useFormattedCurrency";
import { useLanguage } from "@/components/LanguageProvider";
import { formatNumber } from "@/i18n/format";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { currency } = useCurrency();
  const { language, isRTL, t } = useLanguage();
  
  // Convex queries and mutations - only query when user exists
  // Subscription is the source of truth for plan status
  const subscription = useQuery(
    api.functions.getSubscription,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const currentUser = useQuery(
    api.functions.getUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const userProfile = useQuery(
    api.functions.getUserProfile,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const isOnboarded = useQuery(
    api.functions.isUserOnboarded,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const financialInsights = useQuery(
    api.functions.getLatestFinancialInsights,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const generateInsights = useAction(api.functions.generateAutomaticFinancialInsights);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationStartTime, setRegenerationStartTime] = useState<number | null>(null);
  const createOrUpdateUser = useMutation(api.functions.createOrUpdateUser);
  const financialProfile = useQuery(
    api.functions.getOrCreateFinancialProfile,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const userPreferences = useQuery(
    api.functions.getUserPreferences,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const consentFlags = useQuery(
    api.compliance.getConsent,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Metrics queries (for admin view) - safe to call without user
  const totalRevenue = useQuery(api.functions.getTotalRevenue);
  const activeProUsers = useQuery(api.functions.getActiveProUsers);
  const monthlyRevenue = useQuery(api.functions.getMonthlyRecurringRevenue);
  const paymentStats = useQuery(api.functions.getPaymentStats);

  // Initialize user in Convex when they sign in
  useEffect(() => {
    if (isLoaded && user && !currentUser) {
      createOrUpdateUser({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
      });
    }
  }, [isLoaded, user, currentUser, createOrUpdateUser]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Defensive null-safe checks
  // Prefer subscription.plan as source of truth, fallback to users.plan for backward compatibility
  const plan = subscription?.plan || currentUser?.plan || "free";
  const isPro = plan === "pro";
  const planDisplay = plan.toUpperCase();
  
  // Main admin user ID (always has access)
  const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
  const isMainAdmin = user?.id === MAIN_ADMIN_USER_ID;

  // Check admin status
  const isAdminQuery = useQuery(
    api.admin.isAdmin,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  // Combine main admin check with query result
  const isAdmin = isMainAdmin || isAdminQuery === true;
  
  // Auto-detect region from user preferences
  const detectedRegion = useMemo(() => {
    if (!userPreferences?.region) return "global";
    const regionMap: Record<string, "ksa" | "uae" | "us" | "global"> = {
      ksa: "ksa",
      uae: "uae",
      us: "us",
    };
    return regionMap[userPreferences.region] || "global";
  }, [userPreferences?.region]);

  // Calculate financial metrics from financialProfile (preferred) or fallback to userProfile
  // Memoized to avoid unnecessary recalculations
  // IMPORTANT: All hooks must be called before any conditional returns
  const metrics = useMemo(() => {
    if (financialProfile) {
      // Calculate from detailed financialProfile
      const totalIncome = (financialProfile.incomeSources || [])
        .filter((source: any) => source.isRecurring)
        .reduce((sum: number, source: any) => sum + source.amount, 0);
      
      const totalExpenses = (financialProfile.expenses || [])
        .filter((exp: any) => exp.isRecurring)
        .reduce((sum: number, exp: any) => sum + exp.amount, 0);
      
      const totalInvestments = (financialProfile.investments || [])
        .reduce((sum: number, inv: any) => sum + inv.value, 0);
      
      const totalDebts = (financialProfile.debts || [])
        .reduce((sum: number, debt: any) => sum + debt.principal, 0);
      
      const savings = financialProfile.savings || {
        emergencyFundCurrent: 0,
        emergencyFundGoal: 0,
        otherSavings: 0,
      };
      
      const netWorth = totalInvestments - totalDebts + savings.emergencyFundCurrent + (savings.otherSavings || 0);
      
      return {
        monthlyIncome: totalIncome,
        monthlyExpenses: totalExpenses,
        netWorth,
        emergencyFundCurrent: savings.emergencyFundCurrent,
        emergencyFundGoal: savings.emergencyFundGoal,
        expenses: financialProfile.expenses || [],
        updatedAt: financialProfile.updatedAt,
      };
    }
    
    // Fallback to userProfile for backward compatibility
    return {
      monthlyIncome: userProfile?.monthlyIncome || 0,
      monthlyExpenses: userProfile?.monthlyExpenses || 0,
      netWorth: userProfile?.netWorth || 0,
      emergencyFundCurrent: userProfile?.emergencyFundCurrent || 0,
      emergencyFundGoal: userProfile?.emergencyFundGoal || 0,
      expenses: [],
      updatedAt: userProfile?.updatedAt,
    };
  }, [financialProfile, userProfile]);

  // Calculate month-over-month deltas
  // Since we don't have historical data, we show "No previous data" for first-time users
  const deltas = useMemo<{
    monthlyIncome: number | null;
    monthlyExpenses: number | null;
    netWorth: number | null;
    savingsRate: number | null;
  }>(() => {
    // For now, we don't have historical data, so all deltas are null (no previous data)
    // This will be updated when historical tracking is implemented
    return {
      monthlyIncome: null, // null = no previous data
      monthlyExpenses: null,
      netWorth: null,
      savingsRate: null,
    };
  }, []);

  const monthlyIncome = metrics.monthlyIncome;
  const monthlyExpenses = metrics.monthlyExpenses;
  const netWorth = metrics.netWorth;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlySavings / monthlyIncome) * 100).toFixed(1) : "0.0";
  const emergencyFundCurrent = metrics.emergencyFundCurrent;
  const emergencyFundGoal = metrics.emergencyFundGoal;
  const emergencyFundProgress = emergencyFundGoal > 0 ? Math.min((emergencyFundCurrent / emergencyFundGoal) * 100, 100) : 0;

  // Currency formatting hooks
  const incomeFormatted = useFormattedCurrency(monthlyIncome || 0);
  const expensesFormatted = useFormattedCurrency(monthlyExpenses || 0);
  const netWorthFormatted = useFormattedCurrency(netWorth || 0);
  const savingsFormatted = useFormattedCurrency(Math.abs(monthlySavings));

  // Track the insight ID when regeneration starts to detect when it changes
  const insightIdBeforeRegen = useRef<string | null>(null);
  
  // Watch for insights updates after regeneration
  useEffect(() => {
    if (regenerationStartTime) {
      // If we have a new insight with a different ID, we're done
      if (financialInsights?._id && financialInsights._id !== insightIdBeforeRegen.current) {
        setIsRegenerating(false);
        setRegenerationStartTime(null);
        insightIdBeforeRegen.current = null;
        return;
      }
      
      // Also check timestamp as fallback
      if (financialInsights?.createdAt) {
        const insightTime = new Date(financialInsights.createdAt).getTime();
        // If the insight was created after we started regenerating, we're done
        if (insightTime >= regenerationStartTime - 5000) { // 5 second buffer for clock skew and processing
          setIsRegenerating(false);
          setRegenerationStartTime(null);
          insightIdBeforeRegen.current = null;
          return;
        }
      }
      
      // Timeout after 20 seconds to prevent infinite loading
      const timeout = setTimeout(() => {
        setIsRegenerating(false);
        setRegenerationStartTime(null);
        insightIdBeforeRegen.current = null;
      }, 20000);
      
      return () => clearTimeout(timeout);
    }
  }, [financialInsights?._id, financialInsights?.createdAt, regenerationStartTime]);

  // Regenerate insights when language changes if insights exist but are in wrong language
  // Only regenerate if language actually changed (not on initial load)
  const prevLanguageRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id || !financialInsights || !userPreferences) {
      // Store current language for next check
      if (language) prevLanguageRef.current = language;
      return;
    }
    
    const currentLanguage = language || "en";
    const prevLanguage = prevLanguageRef.current;
    
    // If language changed (not initial load) and we have insights, regenerate them
    if (prevLanguage && prevLanguage !== currentLanguage && 
        financialInsights.insights && financialInsights.insights.length > 0 &&
        !isRegenerating) {
      // Regenerate with new language - pass current UI language
      const startTime = Date.now();
      setRegenerationStartTime(startTime);
      setIsRegenerating(true);
      insightIdBeforeRegen.current = financialInsights._id || null;
      generateInsights({ 
        clerkUserId: user.id,
        language: currentLanguage as "en" | "ar", // Pass current UI language
      }).catch((error: any) => {
        console.error("Failed to regenerate insights for language change:", error);
        setIsRegenerating(false);
        setRegenerationStartTime(null);
        insightIdBeforeRegen.current = null;
      });
    }
    
    // Update ref for next check
    prevLanguageRef.current = currentLanguage;
  }, [language, financialInsights, user?.id, isRegenerating, generateInsights, userPreferences, setRegenerationStartTime]);

  const greeting = useMemo(() => {
    const arabicName = (userPreferences as any)?.displayNameAr?.trim?.() as string | undefined;
    const fallbackName =
      user?.firstName ||
      user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "User";
    const name = language === "ar" && arabicName ? arabicName : fallbackName;

    const hour = new Date().getHours();
    const key =
      hour < 12
        ? "dashboard.greeting.morning"
        : hour < 18
          ? "dashboard.greeting.afternoon"
          : "dashboard.greeting.evening";

    return t(key as any, { name });
  }, [t, user, language, userPreferences]);

  const planLabel = useMemo(() => {
    if (plan === "pro") return t("dashboard.plan.pro");
    if (plan === "free") return t("dashboard.plan.free");
    return plan.toUpperCase();
  }, [plan, t]);
  
  // Calculate expenses by category for the chart (backward compatibility)
  const expensesByCategory = useMemo(() => {
    if (metrics.expenses && metrics.expenses.length > 0) {
      return JSON.stringify(
        metrics.expenses.reduce((acc: any, exp: any) => {
          if (exp.isRecurring) {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          }
          return acc;
        }, {})
      );
    }
    return typeof userProfile?.expensesByCategory === 'string' ? userProfile.expensesByCategory : undefined;
  }, [metrics.expenses, userProfile?.expensesByCategory]);

  // Early returns AFTER all hooks have been called (required by React hooks rules)
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-32 bg-slate-800" />
          <Skeleton className="h-10 w-full bg-slate-800" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 bg-slate-800" />
            <Skeleton className="h-24 bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while subscription/user data is loading
  if (subscription === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-6 w-32 bg-slate-800" />
          <Skeleton className="h-10 w-full bg-slate-800" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 bg-slate-800" />
            <Skeleton className="h-24 bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* HERO HEADER */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
              {t("dashboard.overview")}
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white">
              {isOnboarded === false
                ? t("dashboard.welcome")
                : greeting}
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 max-w-xl">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-center text-center">
              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-500 mb-1">
                {t("dashboard.plan")}
              </span>
              <span className="inline-flex items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                {planLabel}
              </span>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            >
              <Edit size={16} className="w-4 h-4" />
              {t("dashboard.updateData")}
            </Button>
          </div>
        </section>

        {/* ADMIN STRIP (IF APPLICABLE) */}
        {isAdmin && (
          <section>
            <Card className="border border-emerald-500/10 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-slate-900/80 dark:to-slate-900/40 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      Admin dashboard
                    </CardTitle>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      Platform-level metrics only visible to administrators.
                    </p>
                  </div>
                  <span className="inline-flex h-6 items-center rounded-full bg-emerald-500/10 px-3 text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                    Internal
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-100 dark:bg-slate-900/40 p-4">
                    <div className="text-xs text-gray-600 dark:text-slate-400">Total revenue</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-50">
                      {totalRevenue && totalRevenue.total !== undefined
                        ? `${(totalRevenue.total / 100).toFixed(2)} ${
                            totalRevenue.currency || "SAR"
                          }`
                        : "0.00 SAR"}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">
                      {totalRevenue?.count ?? 0} payments
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-100 dark:bg-slate-900/40 p-4">
                    <div className="text-xs text-gray-600 dark:text-slate-400">
                      Active Pro users
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-50">
                      {activeProUsers ?? 0}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">
                      Active subscribers
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-100 dark:bg-slate-900/40 p-4">
                    <div className="text-xs text-gray-600 dark:text-slate-400">
                      Monthly revenue
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-50">
                      {monthlyRevenue && monthlyRevenue.mrr !== undefined
                        ? `${(monthlyRevenue.mrr / 100).toFixed(2)} ${
                            monthlyRevenue.currency || "SAR"
                          }`
                        : "0.00 SAR"}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">
                      {monthlyRevenue?.count ?? 0} this month
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-100 dark:bg-slate-900/40 p-4">
                    <div className="text-xs text-gray-600 dark:text-slate-400">Total payments</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-slate-50">
                      {paymentStats?.total ?? 0}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-500">All time</div>
                  </div>
                </div>

                {paymentStats?.byStatus &&
                  Object.keys(paymentStats.byStatus).length > 0 && (
                    <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
                      <p className="mb-2 text-xs font-medium text-gray-700 dark:text-slate-300">
                        Payment status mix
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {Object.entries(paymentStats.byStatus).map(
                          ([status, count]) => (
                            <span
                              key={status}
                              className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-slate-900/60 px-3 py-1 text-gray-800 dark:text-slate-200"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span className="capitalize">{status}</span>
                              <span className="text-gray-600 dark:text-slate-400">
                                • {count ?? 0}
                              </span>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* MAIN USER VIEW */}
        {isOnboarded === true &&
        userProfile &&
        (monthlyIncome || monthlyExpenses || netWorth) ? (
          <>
            {/* KPI BAND */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium text-gray-900 dark:text-slate-200">
                    {t("dashboard.keyMetrics.title")}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-slate-500">
                    {t("dashboard.keyMetrics.subtitle")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  title={t("dashboard.kpi.monthlyIncome")}
                  value={
                    monthlyIncome
                      ? incomeFormatted.isLoading
                        ? "—"
                        : `${formatNumber(incomeFormatted.convertedAmount / 1000, language, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}${t("charts.thousandSuffix")}`
                      : "—"
                  }
                  subtitle={currency}
                  delta={
                    deltas.monthlyIncome !== null &&
                    typeof deltas.monthlyIncome === "number"
                      ? {
                          value: deltas.monthlyIncome,
                          isPositive: deltas.monthlyIncome >= 0,
                          label: t("dashboard.kpi.vsLastMonth"),
                        }
                      : undefined
                  }
                  icon={DollarSign}
                  statusText={t("dashboard.kpi.activeIncome")}
                  statusIcon={TrendingUp}
                />
                <KpiCard
                  title={t("dashboard.kpi.monthlyExpenses")}
                  value={
                    monthlyExpenses
                      ? expensesFormatted.isLoading
                        ? "—"
                        : `${formatNumber(expensesFormatted.convertedAmount / 1000, language, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}${t("charts.thousandSuffix")}`
                      : "—"
                  }
                  subtitle={currency}
                  delta={
                    deltas.monthlyExpenses !== null &&
                    typeof deltas.monthlyExpenses === "number"
                      ? {
                          value: Math.abs(deltas.monthlyExpenses),
                          isPositive: deltas.monthlyExpenses <= 0,
                          label: t("dashboard.kpi.vsLastMonth"),
                        }
                      : undefined
                  }
                icon={Wallet}
                  statusText={t("dashboard.kpi.monthlySpending")}
                  statusIcon={ArrowDownRight}
                />
                <KpiCard
                  title={t("dashboard.kpi.netWorth")}
                  value={
                    netWorth
                      ? netWorthFormatted.isLoading
                        ? "—"
                        : `${formatNumber(netWorthFormatted.convertedAmount / 1000, language, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}${t("charts.thousandSuffix")}`
                      : "—"
                  }
                  subtitle={currency}
                  delta={
                    deltas.netWorth !== null &&
                    typeof deltas.netWorth === "number"
                      ? {
                          value: deltas.netWorth,
                          isPositive: deltas.netWorth >= 0,
                          label: t("dashboard.kpi.vsLastMonth"),
                        }
                      : undefined
                  }
                icon={LineChart}
                  statusText={t("dashboard.kpi.totalAssets")}
                  statusIcon={TrendingUp}
                />
                <KpiCard
                  title={t("dashboard.kpi.savingsRate")}
                  value={`${formatNumber(Number(savingsRate), language, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`}
                  subtitle={
                    savingsFormatted.isLoading
                      ? "—"
                      : monthlySavings >= 0
                      ? `+${savingsFormatted.formatted}`
                      : `-${savingsFormatted.formatted}`
                  }
                  delta={
                    deltas.savingsRate !== null &&
                    typeof deltas.savingsRate === "number"
                      ? {
                          value: deltas.savingsRate,
                          isPositive: deltas.savingsRate >= 0,
                          label: t("dashboard.kpi.vsLastMonth"),
                        }
                      : undefined
                  }
                  icon={PiggyBank}
                  statusText={
                    monthlySavings >= 0
                      ? t("dashboard.kpi.positiveSavings")
                      : t("dashboard.kpi.negativeSavings")
                  }
                  statusIcon={monthlySavings >= 0 ? ArrowUpRight : ArrowDownRight}
                />
              </div>
            </section>

            {/* CHART ROW */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CashFlowCard
                monthlyIncome={monthlyIncome}
                monthlyExpenses={monthlyExpenses}
                updatedAt={metrics.updatedAt}
                clerkUserId={user?.id || ""}
              />
              <ExpenseBreakdownCard
                monthlyExpenses={monthlyExpenses}
                expensesByCategory={expensesByCategory}
                expenses={metrics.expenses}
              />
            </section>

            {/* LOWER BAND: AI + EMERGENCY FUND */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                {/* AI Insights Consent Banner */}
                {consentFlags && !consentFlags.aiAnalysisConsent && (
                  <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        <Lightbulb size={20} className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          {t("dashboard.aiInsight.consentDisabled")}{" "}
                          <Link
                            href="/dashboard/settings"
                            className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                          >
                            {t("dashboard.aiInsight.enableInSettings")}
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <AIInsightsCard
                  insights={financialInsights || undefined}
                  isRegenerating={isRegenerating}
                  onRegenerate={async () => {
                    if (!user?.id || isRegenerating) return;
                    
                    // Store the current insight ID to detect when a new one arrives
                    const currentInsightId = financialInsights?._id || null;
                    const startTime = Date.now();
                    setRegenerationStartTime(startTime);
                    setIsRegenerating(true);
                    insightIdBeforeRegen.current = currentInsightId;
                    
                    try {
                      // Pass current UI language to ensure insights are in correct language
                      await generateInsights({ 
                        clerkUserId: user.id,
                        language: language as "en" | "ar", // Pass current UI language
                      });
                      // The useEffect above will detect when the query updates with new insights
                      // If it doesn't update within 20 seconds, the timeout in useEffect will stop loading
                    } catch (error: any) {
                      console.error("Failed to regenerate insights:", error);
                      setIsRegenerating(false);
                      setRegenerationStartTime(null);
                      insightIdBeforeRegen.current = null;
                      alert(
                        error?.message ||
                          "Failed to regenerate insights. Please try again."
                      );
                    }
                  }}
                />
              </div>

              {emergencyFundGoal > 0 && (
                <div>
                  <EmergencyFundCard
                    current={emergencyFundCurrent}
                    goal={emergencyFundGoal}
                    monthlyContribution={monthlySavings}
                  />
                </div>
              )}
            </section>

            {/* NEWS FEED SECTION */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <NewsFeedCard region={detectedRegion} />
            </section>
          </>
        ) : isOnboarded === true ? (
          // EMPTY STATE WHEN NO FINANCIAL DATA
          <section>
            <Card className="border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60">
              <CardContent className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800">
                  <FileText className="h-8 w-8 text-gray-500 dark:text-slate-400" />
                </div>
                <h3 className="mb-2 text-base font-medium text-gray-900 dark:text-slate-50">
                  Complete your financial profile
                </h3>
                <p className="mx-auto mb-5 max-w-md text-sm text-gray-600 dark:text-slate-400">
                  Add your income, expenses, debts and savings so Finora can
                  calculate your true cash flow, runway and savings trajectory.
                </p>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-400"
                >
                  Start setting up
                </Button>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* ADMIN PLATFORM OVERVIEW (SECONDARY) */}
        {isAdmin && (
          <section>
            <Card className="bg-gray-100 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800">
              <CardContent className="pt-6">
                <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-slate-200">
                  Platform overview
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-white dark:bg-slate-800/70 p-4 text-center">
                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {activeProUsers ?? 0}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                      Pro members
                    </div>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800/70 p-4 text-center">
                    <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {totalRevenue?.count ? totalRevenue.count + 1 : 1}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                      Total upgrades
                    </div>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800/70 p-4 text-center">
                    <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
                      99%
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                      Success rate
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Edit Financial Data Modal (existing implementation) */}
      {user && isEditModalOpen && (
        <EditFinancialDataModal
          isOpen={isEditModalOpen}
          onClose={() => {
            console.log("Closing modal");
            setIsEditModalOpen(false);
          }}
          clerkUserId={user.id}
        />
      )}
    </>
  );
}
