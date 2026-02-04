import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { EmergencyFundProgress } from "@/components/charts/EmergencyFundProgress";
import { useLanguage } from "@/components/LanguageProvider";

interface EmergencyFundCardProps {
  current: number;
  goal: number;
  monthlyContribution?: number;
}

export function EmergencyFundCard({
  current,
  goal,
  monthlyContribution,
}: EmergencyFundCardProps) {
  const { t, isRTL } = useLanguage();
  return (
    <Card className="bg-white dark:bg-[#1e293b] border-none shadow-lg">
      <CardHeader>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
          <div className="p-2 rounded-lg" style={{ backgroundColor: "#17373d" }}>
            <Shield size={20} className="w-5 h-5 shrink-0" style={{ color: "#30c28f" }} />
          </div>
          <div>
            <CardTitle className="text-gray-900 dark:text-white">{t("dashboard.emergencyFund.title")}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">{t("dashboard.emergencyFund.subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EmergencyFundProgress
          current={current}
          goal={goal}
          monthlyContribution={monthlyContribution}
        />
      </CardContent>
    </Card>
  );
}
