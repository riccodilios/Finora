"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Lock, FileQuestion } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageProvider";

export default function ArticleDetailPage() {
  const { user, isLoaded } = useUser();
  const { isRTL, locale, t } = useLanguage();
  const params = useParams();
  const articleId = params?.id as string;
  const [isValidId, setIsValidId] = useState(false);

  // Validate article ID format
  useEffect(() => {
    if (articleId) {
      // Basic validation: Convex IDs are strings that match a pattern
      // We'll let the query handle validation, but check if it's a non-empty string
      setIsValidId(typeof articleId === "string" && articleId.length > 0);
    }
  }, [articleId]);

  // Get user subscription to determine plan
  const subscription = useQuery(
    api.functions.getSubscription,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const currentUser = useQuery(
    api.functions.getUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Get article by ID - only query if we have a valid ID
  const article = useQuery(
    api.functions.getArticleById,
    isValidId && articleId ? { articleId: articleId as Id<"articles"> } : "skip"
  );

  // Loading state: waiting for auth or invalid ID
  if (!isLoaded) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className={`space-y-6 max-w-4xl mx-auto ${isRTL ? "text-right" : ""}`}>
        <Link
          href="/dashboard/articles"
          className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {isRTL ? "→" : "←"} {t("articles.title")}
        </Link>
        <Card className="bg-white dark:bg-[#1e293b] rounded-xl shadow border border-gray-200 dark:border-slate-800">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t("common.error")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t("articles.signIn")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid article ID
  if (!isValidId || !articleId) {
    return (
      <div className={`space-y-6 max-w-4xl mx-auto ${isRTL ? "text-right" : ""}`}>
        <Link
          href="/dashboard/articles"
          className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {isRTL ? "→" : "←"} {t("articles.back")}
        </Link>
        <Card className="bg-white dark:bg-[#1e293b] rounded-xl shadow border border-gray-200 dark:border-slate-800">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t("articles.invalid.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t("articles.invalid.subtitle")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state: waiting for data
  if (subscription === undefined || currentUser === undefined || article === undefined) {
    return (
      <div className={`space-y-6 max-w-4xl mx-auto ${isRTL ? "text-right" : ""}`}>
        <Link
          href="/dashboard/articles"
          className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {isRTL ? "→" : "←"} {t("articles.back")}
        </Link>
        <Card className="bg-white dark:bg-[#1e293b] rounded-xl shadow border border-gray-200 dark:border-slate-800">
          {/* Loading skeleton */}
          <CardContent className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Article not found
  if (article === null) {
    return (
      <div className={`space-y-6 max-w-4xl mx-auto ${isRTL ? "text-right" : ""}`}>
        <Link
          href="/dashboard/articles"
          className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {isRTL ? "→" : "←"} {t("articles.back")}
        </Link>
        <Card className="bg-white dark:bg-[#1e293b] rounded-xl shadow border border-gray-200 dark:border-slate-800">
          <CardContent className="text-center py-12">
            <div className="mb-4">
              <FileQuestion size={64} className="w-16 h-16 mx-auto text-gray-400 shrink-0" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t("articles.notFound.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("articles.notFound.subtitle")}
            </p>
            <Link
              href="/dashboard/articles"
              className="inline-block px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors text-sm"
            >
              {t("articles.browseAll")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine user's plan (subscription is source of truth)
  const plan = subscription?.plan || currentUser?.plan || "free";
  const isPro = plan === "pro";
  
  // Check if article is premium
  const isPremium = article.plan === "pro";
  
  // Gate premium content: Free users cannot view premium articles
  const canViewFullContent = !isPremium || isPro;

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${isRTL ? "text-right" : ""}`}>
      {/* Back button */}
      <Link
        href="/dashboard/articles"
        className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        {isRTL ? "→" : "←"} {t("articles.title")}
      </Link>

      {/* Article header */}
      <Card className="bg-white dark:bg-[#1e293b] rounded-lg shadow border border-gray-200 dark:border-slate-800">
        <CardContent className="p-6 md:p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <span className="px-3 py-1 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                {article.category}
              </span>
            )}
            {isPremium && (
              <span className="px-3 py-1 text-sm font-medium bg-emerald-600 text-white rounded">
                {t("articles.pro")}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("articles.readTime", { minutes: String(article.readTime) })}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {article.title}
        </h1>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <span>{article.author}</span>
            <span>•</span>
            <span>
              {new Date(article.publishedAt).toLocaleDateString(locale, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Article content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {canViewFullContent ? (
            // Pro users see full content
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {article.content}
            </div>
          ) : (
            // Free users see preview (20-30% of content) + blurred rest + CTA
            <div className="relative">
              {(() => {
                // Calculate preview length (25% of content)
                const contentLength = article.content.length;
                const previewLength = Math.floor(contentLength * 0.25);
                const previewEnd = article.content.lastIndexOf(" ", previewLength);
                const previewContent = article.content.substring(0, previewEnd || previewLength);
                const remainingContent = article.content.substring(previewEnd || previewLength);

                return (
                  <>
                    {/* Visible preview (20-30% of content) */}
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {previewContent}
                      {previewEnd > 0 && "..."}
                    </div>

                    {/* Blurred remaining content */}
                    <div className="relative mt-4">
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed blur-sm select-none pointer-events-none opacity-60">
                        {remainingContent}
                      </div>

                      {/* Gradient fade and CTA overlay */}
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#1e293b] dark:via-[#1e293b]/90 pt-16 pb-8">
                        <div className="text-center px-4">
                          <div className="mb-4">
                            <Lock size={40} className="w-10 h-10 mx-auto text-emerald-500 shrink-0" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {t("articles.continueReading")}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t("articles.proCta")}
                          </p>
                          <Link
                            href="/dashboard/subscription"
                            className="inline-block px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors text-sm"
                          >
                            {t("articles.upgradeToPro")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
