"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { Menu, LayoutDashboard, FileText, Sparkles, CreditCard, Settings, LogOut, Shield, Lock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { id: "dashboard", labelKey: "nav.dashboard", path: "/dashboard", icon: LayoutDashboard, proOnly: false },
  { id: "articles", labelKey: "nav.articles", path: "/dashboard/articles", icon: FileText, proOnly: false },
  { id: "ai", labelKey: "nav.ai", path: "/dashboard/ai", icon: Sparkles, proOnly: true },
  { id: "subscription", labelKey: "nav.subscription", path: "/dashboard/subscription", icon: CreditCard, proOnly: false },
  { id: "settings", labelKey: "nav.settings", path: "/dashboard/settings", icon: Settings, proOnly: false },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { isRTL, t } = useLanguage();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(pathname)}`;
      router.push(signInUrl);
    }
  }, [isLoaded, user, pathname, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }
  
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
  
  // Main admin user ID (always has access)
  const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
  const isMainAdmin = user?.id === MAIN_ADMIN_USER_ID;

  // Check admin status
  const isAdminQuery = useQuery(
    api.admin.isAdmin,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  // Combine main admin check with query result
  const isAdmin = isMainAdmin || isAdminQuery === true;

  const handleLogoClick = () => {
    // Use router.push instead of window.location.reload to avoid hydration issues
    router.push("/dashboard");
  };

  return (
    <OnboardingGuard>
      <div className="dashboard-layout-wrapper min-h-screen overflow-x-hidden bg-white dark:bg-[#0f172a]" style={{ margin: 0, padding: 0 }}>
        {/* Base44 Header - Gradient background, never changes */}
        <header className="finora-header-gradient fixed top-0 left-0 right-0 z-50 lg:hidden">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Left: Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  aria-label="Menu"
                >
                  <Menu size={24} className="w-6 h-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-[#0f172a] border-gray-800 text-white"
              >
                {navItems.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                  const isLocked = item.proOnly && !isPro;
                  const Icon = item.icon;
                  
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      asChild
                      disabled={isLocked}
                      className={`${
                        isActive
                          ? 'text-[#059669] bg-emerald-500/10'
                          : isLocked
                          ? 'text-gray-500 cursor-not-allowed opacity-60'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Link href={item.path} className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <Icon size={20} className="w-5 h-5" />
                        <span>{t(item.labelKey as any)}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      asChild
                      className={`${
                        pathname.startsWith('/dashboard/admin')
                          ? 'text-[#059669] bg-emerald-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Link href="/dashboard/admin" className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <Shield size={20} className="w-5 h-5" />
                        <span>{t("nav.admin") || "Admin"}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem asChild className="text-gray-400 hover:text-white hover:bg-white/5">
                  <SignOutButton>
                    <button className={`flex items-center gap-3 w-full ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}>
                      <LogOut size={20} className="w-5 h-5" />
                      <span>{t("nav.signOut")}</span>
                    </button>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Center: Logo (clickable, refreshes page) */}
            <button
              onClick={handleLogoClick}
              className="text-2xl font-semibold text-white tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
            >
              Finora
            </button>

            {/* Right: Placeholder for balance */}
            <div className="w-10" />
          </div>
        </header>

        {/* Desktop Layout: Sidebar + Main Content */}
        <div className="flex">
          {/* Sidebar - Fixed on left, always visible on desktop */}
          <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:bg-[#0f172a] lg:border-r lg:border-gray-800 lg:z-40" dir="ltr">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
              <button
                onClick={handleLogoClick}
                className="text-2xl font-semibold text-white tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
              >
                Finora
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                const isLocked = item.proOnly && !isPro;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    onClick={(e) => {
                      if (isLocked) {
                        e.preventDefault();
                        window.location.href = "/dashboard/subscription";
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'text-[#059669] bg-emerald-500/10'
                        : isLocked
                        ? 'text-gray-500 cursor-not-allowed opacity-60'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={isLocked ? t("nav.proLockedTitle") : undefined}
                  >
                    <Icon size={20} className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{t(item.labelKey as any)}</span>
                    {isLocked && (
                      <Lock size={12} className="ml-auto w-3 h-3 shrink-0" aria-label="Locked" />
                    )}
                  </Link>
                );
              })}
              
              {isAdmin && (
                <>
                  <div className="my-2 border-t border-gray-800"></div>
                  <Link
                    href="/dashboard/admin"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname.startsWith('/dashboard/admin')
                        ? 'text-[#059669] bg-emerald-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Shield size={20} className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{t("nav.admin") || "Admin"}</span>
                  </Link>
                </>
              )}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.emailAddresses?.[0]?.emailAddress || ""}
                  </p>
                </div>
              </div>
              <SignOutButton>
                <button className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                  <LogOut size={16} className="w-4 h-4" />
                  <span>{t("nav.signOut")}</span>
                </button>
              </SignOutButton>
            </div>
          </aside>

          {/* Main Content - Offset by sidebar width on desktop */}
          <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </OnboardingGuard>
  );
}
