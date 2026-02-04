 "use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Globe, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { formatDate as formatDateUtil } from "@/i18n/format";

type Region = "ksa" | "uae" | "us" | "global";
type Tab = "articles" | "news";

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

export default function ArticlesPage() {
  const { user, isLoaded } = useUser();
  const { language, isRTL, locale, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("articles");
  const [selectedRegion, setSelectedRegion] = useState<Region>("global");

  const REGIONS: { value: Region; label: string }[] = [
    { value: "ksa", label: t("news.region.ksa") },
    { value: "uae", label: t("news.region.uae") },
    { value: "us", label: t("news.region.us") },
    { value: "global", label: t("news.region.global") },
  ];

  // Get user subscription to determine plan
  const subscription = useQuery(
    api.functions.getSubscription,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const currentUser = useQuery(
    api.functions.getUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Get articles filtered for user
  const articles = useQuery(
    api.functions.getArticlesForUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  const normalizedLanguage = language === "ar" ? "ar" : "en";

  const newsSnapshot = useQuery(
    api.news.getLatestNewsByRegion,
    activeTab === "news"
      ? {
          region: selectedRegion,
          language: normalizedLanguage as "en" | "ar",
        }
      : "skip"
  ) as NewsSnapshot | undefined;

  const newsLoading = activeTab === "news" && newsSnapshot === undefined;
  const newsError: string | null = null;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">{t("articles.signIn")}</p>
      </div>
    );
  }

  // Show loading state while data is loading
  if (subscription === undefined || currentUser === undefined || articles === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t("articles.loading")}</p>
        </div>
      </div>
    );
  }

  const plan = subscription?.plan || currentUser?.plan || "free";
  const isPro = plan === "pro";
  const articlesList = Array.isArray(articles) ? articles : [];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) {
        return t("articles.date.justNow");
      } else if (diffHours < 24) {
        return t("articles.date.hoursAgo", { hours: String(diffHours) });
      } else if (diffDays < 7) {
        return t("articles.date.daysAgo", { days: String(diffDays) });
      } else {
        return formatDateUtil(date, language, {
          month: "short",
          day: "numeric",
          year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch {
      return t("articles.date.recently");
    }
  };

  return (
    <div className={`space-y-6 transition-colors ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div 
        className={`${isRTL ? "flex flex-col items-end text-right" : "flex flex-col items-start text-left"}`} 
        dir={isRTL ? "rtl" : "ltr"}
        style={isRTL ? { textAlign: 'right', alignItems: 'flex-end' } : { textAlign: 'left', alignItems: 'flex-start' }}
      >
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2" style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>{t("articles.title")}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400" style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>{t("articles.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 border-b border-gray-200 dark:border-slate-700 ${isRTL ? "flex-row-reverse" : ""}`}>
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "articles"
              ? "border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <FileText className={`w-4 h-4 inline ${isRTL ? "ml-2" : "mr-2"}`} />
          {t("articles.tab.educational")}
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "news"
              ? "border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <Globe className={`w-4 h-4 inline ${isRTL ? "ml-2" : "mr-2"}`} />
          {t("articles.tab.news")}
        </button>
      </div>

      {/* Articles Tab */}
      {activeTab === "articles" && (
        <>
          {articles === null ? (
            <Card className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 shadow">
              <CardContent className="text-center py-12">
                <h2 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-2">
                  {t("articles.unable.title")}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {t("articles.unable.subtitle")}
                </p>
              </CardContent>
            </Card>
          ) : articlesList.length === 0 ? (
            <Card className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 shadow transition-colors">
              <CardContent className="text-center py-12">
                <h2 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-2">
                  {t("articles.empty.title")}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {t("articles.empty.subtitle")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articlesList.map((article) => {
                const isPremium = article.plan === "pro";
                const canView = !isPremium || isPro;

                return (
                  <Link
                    key={article._id}
                    href={`/dashboard/articles/${article._id}`}
                    className="block transition-transform hover:scale-[1.02]"
                  >
                    <Card
                      className={`bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 shadow hover:shadow-md transition-all duration-200 cursor-pointer ${
                        !canView ? "opacity-75" : ""
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {article.category && (
                              <span className="px-2 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                                {article.category}
                              </span>
                            )}
                            {isPremium && (
                              <span className="px-2 py-1 text-xs font-medium bg-emerald-600 text-white rounded">
                                {t("articles.pro")}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t("articles.readTime", { minutes: String(article.readTime) })}
                          </span>
                        </div>

                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                          {article.title}
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.author}</span>
                          <span>
                            {new Date(article.publishedAt).toLocaleDateString(locale, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* News Tab */}
      {activeTab === "news" && (
        <>
          {/* Compliance Disclaimer */}
          <Card className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">{t("news.disclaimer.title")}</strong>{" "}
                  {t("news.disclaimer.text")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Region Selector */}
          <div className={`flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            {REGIONS.map((region) => (
              <Button
                key={region.value}
                variant={selectedRegion === region.value ? "default" : "outline"}
                onClick={() => setSelectedRegion(region.value)}
                className={
                  selectedRegion === region.value
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }
              >
                <Globe className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {region.label}
              </Button>
            ))}
            {/* Manual refresh button is no longer needed because data comes from daily cron snapshots */}
          </div>

          {/* Loading State */}
          {newsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800"
                >
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-3 bg-gray-200 dark:bg-white/10" />
                    <Skeleton className="h-3 w-1/2 mb-4 bg-gray-200 dark:bg-white/10" />
                    <Skeleton className="h-20 w-full mb-4 bg-gray-200 dark:bg-white/10" />
                    <Skeleton className="h-3 w-1/3 bg-gray-200 dark:bg-white/10" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {newsError && !newsLoading && (
            <Card className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800">
              <CardContent className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("news.failed.title")}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {newsError}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <RefreshCw className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t("news.tryAgain")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* News Articles from Convex daily snapshots */}
          {!newsLoading && !newsError && newsSnapshot && (
            <>
              {newsSnapshot.articles.length === 0 ? (
                <Card className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800">
                  <CardContent className="text-center py-12">
                    <Globe className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {t("news.none.title")}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("news.none.subtitle")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsSnapshot.articles.map((article, index) => (
                      <Card
                        key={index}
                        className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-800 hover:shadow-md transition-all duration-200"
                      >
                        <CardContent className="p-6">
                          {/* Source and Date */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {article.source}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(article.publishedAt)}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2">
                            {article.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                            {article.description}
                          </p>

                          {/* Read More Link */}
                          <a
                      href={article.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                          >
                            {t("news.readArticle")}
                            <ExternalLink className={`w-4 h-4 ${isRTL ? "mr-1" : "ml-1"}`} />
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Results Count */}
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {t("news.showing", {
                      count: String(newsSnapshot.articles.length),
                      region: REGIONS.find((r) => r.value === selectedRegion)?.label || "",
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
