"use client";

import { useEffect, useState } from "react";
import { Shield, TrendingUp } from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { useLanguage } from "@/components/LanguageProvider";
import { formatPercent, formatNumber } from "@/i18n/format";

interface EmergencyFundProgressProps {
  current: number;
  goal: number;
  monthlyContribution?: number;
}

/**
 * Enhanced Emergency Fund Progress Visualization
 * Shows animated progress bar with smooth transitions
 * Supports dark mode
 */
export function EmergencyFundProgress({ current, goal, monthlyContribution = 0 }: EmergencyFundProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const { currency } = useCurrency();
  const { language, t } = useLanguage();

  const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - current, 0);

  // Animate progress bar on mount and when progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  if (goal === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("emergencyFund.noGoal")}</p>
      </div>
    );
  }

  // Format currency helper - now uses CurrencyDisplay component
  
  const monthsRemaining = monthlyContribution > 0 
    ? Math.ceil((goal - current) / monthlyContribution) 
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-semibold text-slate-900 dark:text-white">
            <CurrencyDisplay amountSAR={current} />
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t("common.of")} <CurrencyDisplay amountSAR={goal} />
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-600 dark:bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          <span className="text-slate-600 dark:text-slate-300">
            {t("emergencyFund.complete", {
              percent: formatPercent(progress / 100, language, { maximumFractionDigits: 1 }),
            })}
          </span>
        </div>
        {monthsRemaining > 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t("emergencyFund.monthsToGoal", {
              months: formatNumber(monthsRemaining, language, { maximumFractionDigits: 0 }),
            })}
          </span>
        )}
      </div>
    </div>
  );
}
