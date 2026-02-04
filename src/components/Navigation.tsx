"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "./LanguageProvider";
import { Lock } from "lucide-react";

const tabs = [
  { id: "dashboard", labelKey: "nav.dashboard", path: "/dashboard", proOnly: false },
  { id: "articles", labelKey: "nav.articles", path: "/dashboard/articles", proOnly: false },
  { id: "ai", labelKey: "nav.ai", path: "/dashboard/ai", proOnly: true },
  { id: "subscription", labelKey: "nav.subscription", path: "/dashboard/subscription", proOnly: false },
  { id: "settings", labelKey: "nav.settings", path: "/dashboard/settings", proOnly: false },
];

export default function Navigation() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { isRTL, t } = useLanguage();
  
  // Get user plan status
  const subscription = useQuery(
    api.functions.getSubscription,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  const currentUser = useQuery(
    api.functions.getUser,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  const plan = subscription?.plan || currentUser?.plan || "free";
  const isPro = plan === "pro";
  
  // Show navigation only when user is loaded and exists
  if (!isLoaded || !user) {
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-[49px]"></div>
        </div>
      </nav>
    );
  }

  const handleProTabClick = (e: React.MouseEvent, tab: typeof tabs[0]) => {
    if (tab.proOnly && !isPro) {
      e.preventDefault();
      router.push("/dashboard/subscription");
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
          <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} gap-1`}>
            {tabs.map((tab) => {
              const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
              const isLocked = tab.proOnly && !isPro;
              const tabName = t(tab.labelKey as any);
              
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  onClick={(e) => handleProTabClick(e, tab)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    isLocked
                      ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60"
                      : isActive
                      ? "text-[#059669] dark:text-emerald-400 border-b-2 border-[#059669] dark:border-emerald-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  title={isLocked ? t("nav.proLockedTitle") : undefined}
                >
                  {tabName}
                  {isLocked && (
                    <Lock size={12} className={`${isRTL ? 'mr' : 'ml'}-1.5 w-3 h-3 shrink-0`} aria-label="Locked" />
                  )}
                </Link>
              );
            })}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
