"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, AlertCircle, Globe, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface NewsArticle {
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  url?: string;
  urlToImage?: string | null;
}

interface NewsSnapshot {
  region: string;
  language: string;
  articles: NewsArticle[];
  fetchedAt: string | null;
}

interface NewsFeedCardProps {
  region?: "ksa" | "uae" | "us" | "global";
}

export function NewsFeedCard({ region = "global" }: NewsFeedCardProps) {
  const { language, isRTL, t, locale } = useLanguage();

  const normalizedLanguage = language === "ar" ? "ar" : "en";

  const newsSnapshot = useQuery(api.news.getLatestNewsByRegion, {
    region,
    language: normalizedLanguage as "en" | "ar",
  }) as NewsSnapshot | undefined;

  const loading = !newsSnapshot;
  const error: string | null = null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        return t("news.date.justNow") || "Just now";
      } else if (diffHours < 24) {
        return t("news.date.hoursAgo", { hours: String(diffHours) }) || `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return t("news.date.daysAgo", { days: String(diffDays) }) || `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString(locale || "en-US", {
          month: "short",
          day: "numeric",
          year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch {
      return t("news.date.recently") || "Recently";
    }
  };

  return (
    <Card className="bg-white dark:bg-[#1e293b] border-none shadow-lg h-full">
      <CardHeader>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Globe size={20} className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-gray-900 dark:text-white">{t("news.title") || "Financial News"}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">{t("news.subtitle") || "Latest financial news and updates"}</CardDescription>
          </div>
          <Link
            href="/dashboard/articles?tab=news"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <span>{t("news.learnMore") || "Learn More"}</span>
            <ArrowRight size={14} className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
          <p className="font-medium mb-1">{t("news.disclaimer.title") || "Disclaimer"}</p>
          <p>{t("news.disclaimer.text") || "News is for informational purposes only and does not constitute financial advice."}</p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle size={16} className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{t("news.error") || "Error loading news"}</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && newsSnapshot && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {newsSnapshot.articles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t("news.noArticles") || "No news articles available at this time."}
              </p>
            ) : (
              newsSnapshot.articles.slice(0, 5).map((article, index) => {
                // Validate URL - ensure it's a valid URL, not '#' or empty
                const articleUrl =
                  article.url && article.url !== "#" && article.url.startsWith("http") ? article.url : null;
                
                return (
                <article
                  key={index}
                  className="border-b border-gray-200 dark:border-slate-700 pb-4 last:border-b-0 last:pb-0"
                >
                  {articleUrl ? (
                    <a
                      href={articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group hover:opacity-80 transition-opacity"
                    >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className={`flex ${isRTL ? "flex-row-reverse" : ""} items-center gap-2 text-xs text-gray-500 dark:text-gray-400`}>
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{formatDate(article.publishedAt)}</span>
                      <ExternalLink size={12} className="w-3 h-3 ml-auto text-gray-400 dark:text-gray-500" />
                    </div>
                  </a>
                  ) : (
                    <div className="block group">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {article.description}
                        </p>
                      )}
                      <div className={`flex ${isRTL ? "flex-row-reverse" : ""} items-center gap-2 text-xs text-gray-500 dark:text-gray-400`}>
                        <span>{article.source}</span>
                        <span>•</span>
                        <span>{formatDate(article.publishedAt)}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">No link available</span>
                      </div>
                    </div>
                  )}
                </article>
              );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
