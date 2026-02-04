"use client";

import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { formatPercent } from "@/i18n/format";

interface ExpenseCategory {
  name: string;
  value: number;
  percentage: number;
}

interface ExpenseBreakdownChartProps {
  monthlyExpenses: number;
  expensesByCategory?: string; // JSON string from userProfile or financialProfile
  expenses?: Array<{ category: string; amount: number }>; // Direct expense array from financialProfile
}

const CATEGORY_KEY_TO_T: Record<string, string> = {
  housing: "expenseCategory.housing",
  food: "expenseCategory.food",
  transport: "expenseCategory.transport",
  subscriptions: "expenseCategory.subscriptions",
  utilities: "expenseCategory.utilities",
  healthcare: "expenseCategory.healthcare",
  entertainment: "expenseCategory.entertainment",
  other: "expenseCategory.other",
};

/**
 * Expense Breakdown Pie/Donut Chart Component
 * Shows expenses by category with percentage and amount using real data
 * Supports dark mode and RTL
 */
export function ExpenseBreakdownChart({ 
  monthlyExpenses, 
  expensesByCategory,
  expenses 
}: ExpenseBreakdownChartProps) {
  const { theme } = useTheme();
  const { currency, convert } = useCurrency();
  const { language, locale, isRTL, t } = useLanguage();
  const isDark = theme === "dark";
  const [convertedData, setConvertedData] = useState<ExpenseCategory[]>([]);

  const getCategoryLabel = (category: string): string => {
    const key = CATEGORY_KEY_TO_T[category];
    if (key) return t(key as any);
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Parse expenses by category from real data
  const data = useMemo((): ExpenseCategory[] => {
    // Priority 1: Use direct expenses array from financialProfile
    if (expenses && Array.isArray(expenses) && expenses.length > 0) {
      const categoryMap: Record<string, number> = {};
      
      expenses.forEach((exp: any) => {
        // Check if expense has required properties
        if (exp && typeof exp === 'object' && exp.category && typeof exp.amount === 'number') {
          // Include ALL expenses in the breakdown (not just recurring)
          if (exp.amount > 0) {
            const category = exp.category;
            categoryMap[category] = (categoryMap[category] || 0) + exp.amount;
          }
        }
      });

      const total = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
      
      if (total > 0) {
        return Object.entries(categoryMap)
          .map(([category, value]) => ({
            name: getCategoryLabel(category),
            value,
            percentage: total > 0 ? Math.round((value / total) * 100) : 0,
          }))
          .sort((a, b) => b.value - a.value); // Sort by value descending
      }
    }

    // Priority 2: Parse from JSON string (backward compatibility)
    if (expensesByCategory && typeof expensesByCategory === 'string') {
      try {
        const parsed = JSON.parse(expensesByCategory);
        if (parsed && typeof parsed === 'object') {
          const categoryMap: Record<string, number> = {};
          let total = 0;

          Object.entries(parsed).forEach(([key, value]) => {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
            if (numValue > 0) {
              categoryMap[key] = numValue;
              total += numValue;
            }
          });

          if (total > 0) {
            return Object.entries(categoryMap)
              .map(([category, value]) => ({
                name: getCategoryLabel(category),
                value: value as number,
                percentage: total > 0 ? Math.round(((value as number) / total) * 100) : 0,
              }))
              .sort((a, b) => b.value - a.value);
          }
        }
      } catch (e) {
        console.error("Failed to parse expensesByCategory:", e);
      }
    }

    // Fallback: If we have monthlyExpenses but no category breakdown, create a single "Other" category
    // This ensures the chart shows something when expenses exist but aren't categorized
    if (monthlyExpenses > 0) {
      return [{
        name: t("charts.expenses.other"),
        value: monthlyExpenses,
        percentage: 100,
      }];
    }

    // No data available
    return [];
  }, [expenses, expensesByCategory, monthlyExpenses]);

  // Convert expense data when currency changes
  useEffect(() => {
    const convertExpenses = async () => {
      if (data.length === 0) {
        setConvertedData([]);
        return;
      }

      const converted = await Promise.all(
        data.map(async (item) => ({
          ...item,
          value: await convert(item.value),
        }))
      );
      setConvertedData(converted);
    };

    convertExpenses();
  }, [data, convert, currency]);

  // Base colors (original palette)
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  // Format currency helper
  const formatCurrency = (value: number): string => {
    return formatCurrencyUtil(value, currency, { minimumFractionDigits: 0, maximumFractionDigits: 0, locale });
  };

  // Custom tooltip matching Base44
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-lg font-semibold">{formatCurrency(data.value)}</p>
          <p className="text-xs text-slate-400">
            {t("charts.expenses.ofTotal", {
              percent: formatPercent(Number(data.percentage) / 100, language, { maximumFractionDigits: 1 }),
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Show empty state only if we truly have no data
  if (data.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("charts.expenses.noData.title")}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{t("charts.expenses.noData.subtitle")}</p>
      </div>
    );
  }

  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: item.percentage.toFixed(1)
  }));

  return (
    <div className="w-full">
      <div className={`flex flex-col lg:flex-row items-center gap-6 w-full ${isRTL ? "lg:flex-row-reverse" : ""}`}>
        <div className="flex-shrink-0 relative" style={{ width: '192px', height: '192px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart width={192} height={192}>
              <Pie
                data={convertedData.length > 0 ? convertedData.map(item => ({ ...item, percentage: item.percentage.toFixed(1) })) : dataWithPercentage}
                cx={96}
                cy={96}
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {(convertedData.length > 0 ? convertedData : dataWithPercentage).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3 w-full lg:w-auto">
          {dataWithPercentage.map((item, index) => (
            <div key={item.name} className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
              <div 
                className="h-3 w-3 rounded-full shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-200">
                  {formatPercent(Number(item.percentage) / 100, language, { maximumFractionDigits: 1 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
