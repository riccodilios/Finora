import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

interface AIInsightsCardProps {
  insights?: {
    insights?: Array<{ 
      summary?: string;
      whyExplanation?: string;
    }>;
  };
  isRegenerating: boolean;
  onRegenerate: () => void;
}

export function AIInsightsCard({
  insights,
  isRegenerating,
  onRegenerate,
}: AIInsightsCardProps) {
  const { t, isRTL } = useLanguage();
  return (
    <Card className="bg-white dark:bg-[#1e293b] border-none shadow-lg overflow-hidden p-0">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t("dashboard.aiInsight.title")}</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t("dashboard.aiInsight.subtitle")}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isRegenerating ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded animate-pulse w-5/6" />
          </div>
        ) : insights?.insights && insights.insights.length > 0 ? (
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
              {insights.insights[0]?.summary ||
                t("dashboard.aiInsight.fallback")}
            </p>
            {insights.insights[0]?.whyExplanation && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                  {t("dashboard.aiInsight.whySeeingThis") || "Why am I seeing this?"}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                  {insights.insights[0].whyExplanation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
            {t("dashboard.aiInsight.fallback")}
          </p>
        )}

        <Link
          href="/dashboard/ai"
          className={`mt-4 inline-flex items-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 px-0 py-2 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
        >
          {t("dashboard.aiInsight.ask")}
          <ChevronRight className={`h-4 w-4 ${isRTL ? "mr-1 rotate-180" : "ml-1"}`} />
        </Link>
      </div>
    </Card>
  );
}
