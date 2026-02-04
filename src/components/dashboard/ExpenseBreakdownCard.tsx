import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { ExpenseBreakdownChart } from "@/components/charts/ExpenseBreakdownChart";
import { useLanguage } from "@/components/LanguageProvider";

interface ExpenseBreakdownCardProps {
  monthlyExpenses: number;
  // Can be a precomputed map or a serialized string from the backend/page
  expensesByCategory?: Record<string, number> | string;
  expenses?: any[];
}

export function ExpenseBreakdownCard({
  monthlyExpenses,
  expensesByCategory,
  expenses,
}: ExpenseBreakdownCardProps) {
  const { t, isRTL } = useLanguage();
  return (
    <Card className="bg-white dark:bg-[#1e293b] border-none shadow-lg overflow-hidden">
      <CardHeader>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#17373d" }}>
            <PieChart size={20} className="w-5 h-5 shrink-0" style={{ color: "#30c28f" }} />
          </div>
          <div>
            <CardTitle className="text-gray-900 dark:text-white">{t("dashboard.expenseBreakdown.title")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">{t("dashboard.expenseBreakdown.subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ExpenseBreakdownChart
          monthlyExpenses={monthlyExpenses}
          expensesByCategory={typeof expensesByCategory === "string" ? expensesByCategory : expensesByCategory ? JSON.stringify(expensesByCategory) : undefined}
          expenses={expenses}
        />
      </CardContent>
    </Card>
  );
}
