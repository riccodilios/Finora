"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { formatNumber } from "@/i18n/format";

interface CashFlowData {
  month: string;
  monthName: string;
  income: number;
  expenses: number;
  net: number;
}

interface CashFlowChartProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  updatedAt?: string; // ISO timestamp from financialProfile
  clerkUserId?: string; // For fetching historical data
}

/**
 * Cash Flow Area Chart Component
 * Shows monthly income vs expenses over time using real historical data
 * Starts from current month and shows last 6 months
 * Supports dark mode and RTL
 */
export function CashFlowChart({ monthlyIncome, monthlyExpenses, updatedAt, clerkUserId }: CashFlowChartProps) {
  const { theme } = useTheme();
  const { currency, convert } = useCurrency();
  const { language, locale, isRTL, t } = useLanguage();
  const isDark = theme === "dark";
  const [convertedData, setConvertedData] = useState<CashFlowData[]>([]);

  // Fetch historical monthly data (only if clerkUserId is provided and not empty)
  const monthlyData = useQuery(
    api.functions.getMonthlyCashFlow,
    clerkUserId && clerkUserId.trim() !== "" ? { clerkUserId, months: 6 } : "skip"
  );

  // Transform historical data for the chart
  const data = useMemo((): CashFlowData[] => {
    // If we have historical data, use it
    if (monthlyData && Array.isArray(monthlyData) && monthlyData.length > 0) {
      return monthlyData.map(item => ({
        month: item.month,
        monthName: item.monthName,
        income: item.income,
        expenses: item.expenses,
        net: item.savings, // savings = income - expenses
      }));
    }

    // Fallback: if no historical data but we have current values, show current month only
    // This ensures charts always show something when there's data, even if query is loading
    if (monthlyIncome > 0 || monthlyExpenses > 0) {
      const now = new Date();
      const monthName = new Intl.DateTimeFormat(locale, { month: "short" }).format(now);
      return [{
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        monthName,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        net: monthlyIncome - monthlyExpenses,
      }];
    }

    return [];
  }, [monthlyData, monthlyIncome, monthlyExpenses]);

  const chartData = useMemo(() => {
    const base = convertedData.length > 0 ? convertedData : data;
    return base.map((item) => {
      // Prefer locale-aware month label derived from YYYY-MM when available
      let label = item.monthName;
      if (item.month && /^\d{4}-\d{2}$/.test(item.month)) {
        const [y, m] = item.month.split("-").map(Number);
        const d = new Date(y, (m || 1) - 1, 1);
        label = new Intl.DateTimeFormat(locale, { month: "short" }).format(d);
      }
      return { ...item, monthLabel: label };
    });
  }, [convertedData, data, locale]);

  // Convert chart data when currency changes
  useEffect(() => {
    const convertData = async () => {
      if (data.length === 0) {
        setConvertedData([]);
        return;
      }

      const converted = await Promise.all(
        data.map(async (item) => ({
          ...item,
          income: await convert(item.income),
          expenses: await convert(item.expenses),
          net: await convert(item.net),
        }))
      );
      setConvertedData(converted);
    };

    convertData();
  }, [data, convert, currency]);

  // Format currency for tooltip (synchronous with converted values)
  const formatCurrency = (value: number): string =>
    formatCurrencyUtil(value, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0, locale });

  // Colors following Base44 design system
  const incomeColor = "#10b981"; // emerald-500
  const expenseColor = "#f43f5e"; // rose-500
  const gridColor = isDark ? "#334155" : "#e2e8f0"; // slate-700 / slate-200
  const textColor = isDark ? "#94a3b8" : "#94a3b8"; // slate-400
  const bgColor = isDark ? "#0f172a" : "#ffffff"; // slate-900 / white

  // Show empty state if no data at all
  if (data.length === 0 && (monthlyIncome === 0 && monthlyExpenses === 0)) {
    return (
      <div className="h-72 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("charts.cashFlow.noData.title")}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{t("charts.cashFlow.noData.subtitle")}</p>
      </div>
    );
  }

  // Custom tooltip matching Base44
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl">
          <p className="text-sm font-medium text-slate-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height={288}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: isRTL ? 0 : 10, left: isRTL ? 10 : 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={incomeColor} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={incomeColor} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={expenseColor} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={expenseColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="monthLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 12 }}
            reversed={isRTL}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: textColor, fontSize: 12 }}
            orientation={isRTL ? "right" : "left"}
            mirror={isRTL}
            tickFormatter={(value) => {
              const k = formatNumber(value / 1000, language, { maximumFractionDigits: 0 });
              return `${k}${t("charts.thousandSuffix")}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="income"
            stroke={incomeColor}
            strokeWidth={2}
            fill="url(#incomeGradient)"
            name={t("charts.cashFlow.income")}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke={expenseColor}
            strokeWidth={2}
            fill="url(#expenseGradient)"
            name={t("charts.cashFlow.expenses")}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
