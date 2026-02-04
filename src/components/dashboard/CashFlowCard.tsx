import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { useLanguage } from "@/components/LanguageProvider";

interface CashFlowCardProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  updatedAt?: string;
  clerkUserId: string;
}

export function CashFlowCard({
  monthlyIncome,
  monthlyExpenses,
  updatedAt,
  clerkUserId,
}: CashFlowCardProps) {
  const { t, isRTL } = useLanguage();
  return (
    <Card className="bg-white dark:bg-[#1e293b] border-none shadow-lg">
      <CardHeader>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#17373d" }}>
            <BarChart3 size={20} className="w-5 h-5 shrink-0" style={{ color: "#30c28f" }} />
          </div>
          <div>
            <CardTitle className="text-gray-900 dark:text-white">{t("dashboard.cashFlow.title")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">{t("dashboard.cashFlow.subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CashFlowChart
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          updatedAt={updatedAt}
          clerkUserId={clerkUserId}
        />
      </CardContent>
    </Card>
  );
}
