import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon: LucideIcon;
  statusText?: string;
  statusIcon?: LucideIcon;
}

export function KpiCard({
  title,
  value,
  subtitle,
  delta,
  icon: Icon,
  statusText,
  statusIcon: StatusIcon,
}: KpiCardProps) {
  return (
    <Card className="bg-white dark:bg-[#1e293b] border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 font-medium">{title}</p>
            <h3 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">{value}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
            {delta && (
              <div
                className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                  delta.isPositive
                    ? "text-emerald-500 bg-emerald-500/20"
                    : "text-red-500 bg-red-500/20"
                }`}
              >
                {delta.isPositive ? (
                  <TrendingUp size={12} className="w-3 h-3 shrink-0" />
                ) : (
                  <TrendingDown size={12} className="w-3 h-3 shrink-0" />
                )}
                <span>{Math.abs(delta.value).toFixed(1)}%</span>
                {delta.label && (
                  <span className="text-gray-500 dark:text-slate-400 ml-1">{delta.label}</span>
                )}
              </div>
            )}
          </div>
          <div
            className="p-2 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#17373d" }}
          >
            <Icon size={20} className="w-5 h-5 shrink-0" style={{ color: "#30c28f" }} />
          </div>
        </div>
        {statusText && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
            {StatusIcon && (
              <StatusIcon size={14} className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{statusText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
