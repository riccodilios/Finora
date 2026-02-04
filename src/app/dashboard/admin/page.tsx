"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Shield, User, Crown, X, Check, Loader2, AlertCircle, FileText, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type AdminTab = "users" | "articles";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { t, isRTL } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);

  // Main admin user ID (always has access)
  const MAIN_ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
  // Normalize user ID for comparison (trim whitespace)
  const normalizedUserId = user?.id?.trim();
  const normalizedMainAdminId = MAIN_ADMIN_USER_ID.trim();
  const isMainAdmin = normalizedUserId === normalizedMainAdminId;

  // Check admin status
  const isAdminQuery = useQuery(
    api.admin.isAdmin,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  // Combine main admin check with query result
  const isAdmin = isMainAdmin || isAdminQuery === true;

  // Get all users (admin only)
  // CRITICAL: Only call when we're absolutely certain user is admin
  // NEVER call the query until we're 100% sure the user is admin
  // For main admin: call immediately (no query needed)
  // For others: wait for isAdminQuery to return true (not undefined, not false)
  const canFetchUsers = isLoaded && 
    user?.id && 
    (isMainAdmin || (isAdminQuery === true)); // Must be main admin OR confirmed admin
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (isLoaded && user?.id) {
      console.log("[Admin Debug]", {
        userId: user.id,
        normalizedUserId,
        isMainAdmin,
        isAdminQuery,
        canFetchUsers,
        mainAdminId: MAIN_ADMIN_USER_ID
      });
    }
  }, [isLoaded, user?.id, isMainAdmin, isAdminQuery, canFetchUsers, normalizedUserId]);
  
  // Only call query if we're absolutely certain user is admin
  // This prevents the error from happening during initial render
  // CRITICAL: Only call if:
  // 1. User is loaded AND
  // 2. User ID exists AND  
  // 3. Either main admin (immediate) OR confirmed admin from query (must be exactly true, not undefined)
  // NEVER call if isAdminQuery is undefined (still loading) unless user is main admin
  const shouldCallQuery = isLoaded && 
    !!user?.id && 
    (isMainAdmin || (isAdminQuery === true)); // Must be exactly true, not undefined or false
  
  // Debug: Log what's happening
  useEffect(() => {
    if (isLoaded && user?.id) {
      console.log("[Admin Debug - getAllUsers]", {
        userId: user.id,
        normalizedUserId,
        isMainAdmin,
        isAdminQuery,
        shouldCallQuery,
        mainAdminId: MAIN_ADMIN_USER_ID,
        idsMatch: normalizedUserId === normalizedMainAdminId
      });
    }
  }, [isLoaded, user?.id, isMainAdmin, isAdminQuery, shouldCallQuery, normalizedUserId, normalizedMainAdminId]);
  
  // CRITICAL: Only call query when we're 100% certain user is admin
  // Use a computed value to ensure the query doesn't run prematurely
  const queryArgs = useMemo(() => {
    if (!shouldCallQuery || !user?.id) {
      return "skip";
    }
    // Double-check admin status before calling
    if (!isMainAdmin && isAdminQuery !== true) {
      return "skip";
    }
    return { adminUserId: user.id };
  }, [shouldCallQuery, user?.id, isMainAdmin, isAdminQuery]);
  
  const allUsers = useQuery(
    api.admin.getAllUsers,
    queryArgs
  );

  const updateUserPlan = useMutation(api.admin.updateUserPlan);
  const toggleAdminStatus = useMutation(api.admin.toggleAdminStatus);
  
  // Article management
  const allArticles = useQuery(
    api.admin.getAllArticles,
    shouldCallQuery && user?.id ? { adminUserId: user.id } : "skip"
  );
  const createArticle = useMutation(api.admin.createArticle);
  const updateArticle = useMutation(api.admin.updateArticle);
  const deleteArticle = useMutation(api.admin.deleteArticle);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Article form state
  const [articleForm, setArticleForm] = useState({
    language: "en" as "en" | "ar",
    title: "",
    excerpt: "",
    content: "",
    author: "",
    publishedAt: new Date().toISOString().split("T")[0],
    readTime: 5,
    category: "",
    tags: [] as string[],
    region: "global",
    riskProfile: "" as "" | "conservative" | "moderate" | "aggressive",
    financialLevel: "" as "" | "beginner" | "intermediate" | "advanced",
    plan: "free" as "free" | "pro",
  });
  const [tagInput, setTagInput] = useState("");
  const [isSavingArticle, setIsSavingArticle] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400">{t("admin.signInRequired") || "Please sign in"}</p>
      </div>
    );
  }

  // CRITICAL: Don't render anything that might trigger queries until we know admin status
  // Show loading if:
  // 1. Not main admin AND
  // 2. Admin query is still loading (undefined)
  if (!isMainAdmin && isAdminQuery === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">Checking admin access...</p>
      </div>
    );
  }

  // Only show unauthorized if we're sure they're not admin
  // (not if query is still loading)
  if (!isMainAdmin && isAdminQuery === false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t("admin.unauthorized") || "Unauthorized"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("admin.unauthorizedMessage") || "You do not have admin access."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdatePlan = async (targetUserId: string, newPlan: "free" | "pro") => {
    if (!user?.id) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserPlan({
        adminUserId: user.id,
        targetUserId,
        newPlan,
      });
      setSuccess(`User plan updated to ${newPlan}`);
    } catch (err: any) {
      setError(err.message || "Failed to update user plan");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAdmin = async (targetUserId: string, currentStatus: boolean) => {
    if (!user?.id) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await toggleAdminStatus({
        adminUserId: user.id,
        targetUserId,
        isAdmin: !currentStatus,
      });
      setSuccess(`Admin status ${!currentStatus ? "granted" : "revoked"}`);
    } catch (err: any) {
      setError(err.message || "Failed to update admin status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 px-4 sm:px-0 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
          {t("admin.title") || "Admin Panel"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {t("admin.subtitle") || "Manage users and subscriptions"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle size={18} className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-red-800 dark:text-red-300">{t("admin.error") || "Error"}</p>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 mt-1 break-words">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Check size={18} className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-green-800 dark:text-green-300 break-words">{success}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-2 border-b border-gray-200 dark:border-slate-700 ${isRTL ? "flex-row-reverse" : ""}`}>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <User className={`w-4 h-4 inline ${isRTL ? "ml-2" : "mr-2"}`} />
          {t("admin.users") || "Users"}
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "articles"
              ? "border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <FileText className={`w-4 h-4 inline ${isRTL ? "ml-2" : "mr-2"}`} />
          {t("admin.articles") || "Articles"}
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.users") || "All Users"}</CardTitle>
        </CardHeader>
        <CardContent>
          {!shouldCallQuery ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin.loading") || "Verifying admin access..."}
              </p>
            </div>
          ) : allUsers === undefined ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : allUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              {t("admin.noUsers") || "No users found"}
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {allUsers.map((userData) => (
                <div
                  key={userData._id}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className={`flex flex-col sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""} items-start sm:items-center justify-between gap-3 sm:gap-4`}>
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className={`flex flex-wrap ${isRTL ? "flex-row-reverse" : ""} items-center gap-2 mb-2`}>
                        <User size={16} className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words min-w-0">{userData.email}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {userData.isAdmin && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center gap-1 shrink-0">
                              <Crown size={12} className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                            userData.plan === "pro"
                              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                          }`}>
                            {userData.plan.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 break-all">
                        {t("admin.userId") || "User ID"}: {userData.clerkUserId}
                      </p>
                      {userData.createdAt && (
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t("admin.createdAt") || "Created"}: {new Date(userData.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className={`flex flex-col sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""} gap-2 w-full sm:w-auto`}>
                      {/* Toggle Admin */}
                      <Button
                        size="sm"
                        variant={userData.isAdmin ? "destructive" : "outline"}
                        onClick={() => handleToggleAdmin(userData.clerkUserId, userData.isAdmin || false)}
                        disabled={isUpdating || userData.clerkUserId === user?.id}
                        className="text-xs w-full sm:w-auto"
                        title={userData.clerkUserId === user?.id ? "Cannot remove your own admin status" : undefined}
                      >
                        {userData.isAdmin ? (
                          <>
                            <X size={14} className="w-3.5 h-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">{t("admin.removeAdmin") || "Remove Admin"}</span>
                            <span className="sm:hidden">{t("admin.removeAdmin") || "Remove Admin"}</span>
                          </>
                        ) : (
                          <>
                            <Crown size={14} className="w-3.5 h-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">{t("admin.makeAdmin") || "Make Admin"}</span>
                            <span className="sm:hidden">{t("admin.makeAdmin") || "Make Admin"}</span>
                          </>
                        )}
                      </Button>
                      
                      {/* Update Plan */}
                      <Button
                        size="sm"
                        variant={userData.plan === "pro" ? "outline" : "default"}
                        onClick={() => handleUpdatePlan(userData.clerkUserId, userData.plan === "pro" ? "free" : "pro")}
                        disabled={isUpdating}
                        className="text-xs w-full sm:w-auto"
                      >
                        {userData.plan === "pro" 
                          ? (t("admin.downgradeToFree") || "Downgrade to Free")
                          : (t("admin.upgradeToPro") || "Upgrade to Pro")
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Articles Tab */}
      {activeTab === "articles" && (
        <Card>
          <CardHeader>
            <div className={`flex flex-col sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""} items-start sm:items-center justify-between gap-3`}>
              <CardTitle className="text-lg">{t("admin.articles") || "Educational Articles"}</CardTitle>
              <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingArticle(null);
                      setArticleForm({
                        language: "en",
                        title: "",
                        excerpt: "",
                        content: "",
                        author: "",
                        publishedAt: new Date().toISOString().split("T")[0],
                        readTime: 5,
                        category: "",
                        tags: [],
                        region: "global",
                        riskProfile: "",
                        financialLevel: "",
                        plan: "free",
                      });
                    }}
                    className="text-xs"
                  >
                    <Plus size={14} className="w-3.5 h-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">{t("admin.createArticle") || "Create Article"}</span>
                    <span className="sm:hidden">{t("admin.create") || "Create"}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingArticle ? (t("admin.editArticle") || "Edit Article") : (t("admin.createArticle") || "Create Article")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.language") || "Language"}</label>
                        <select
                          value={articleForm.language}
                          onChange={(e) => setArticleForm({ ...articleForm, language: e.target.value as "en" | "ar" })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                        >
                          <option value="en">English</option>
                          <option value="ar">Arabic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.plan") || "Plan"}</label>
                        <select
                          value={articleForm.plan}
                          onChange={(e) => setArticleForm({ ...articleForm, plan: e.target.value as "free" | "pro" })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.title") || "Title"} *</label>
                      <input
                        type="text"
                        value={articleForm.title}
                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        placeholder={t("admin.article.titlePlaceholder") || "Article title"}
                        className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.excerpt") || "Excerpt"} *</label>
                      <textarea
                        value={articleForm.excerpt}
                        onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                        placeholder={t("admin.article.excerptPlaceholder") || "Short summary"}
                        rows={3}
                        className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.content") || "Content"} *</label>
                      <textarea
                        value={articleForm.content}
                        onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                        placeholder={t("admin.article.contentPlaceholder") || "Full article content"}
                        rows={10}
                        className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.author") || "Author"} *</label>
                        <input
                          type="text"
                          value={articleForm.author}
                          onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                          placeholder={t("admin.article.authorPlaceholder") || "Author name"}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.readTime") || "Read Time (minutes)"} *</label>
                        <input
                          type="number"
                          value={articleForm.readTime}
                          onChange={(e) => setArticleForm({ ...articleForm, readTime: parseInt(e.target.value) || 5 })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.category") || "Category"}</label>
                        <input
                          type="text"
                          value={articleForm.category}
                          onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                          placeholder={t("admin.article.categoryPlaceholder") || "e.g., Debt, Savings, Investment"}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.region") || "Region"}</label>
                        <select
                          value={articleForm.region}
                          onChange={(e) => setArticleForm({ ...articleForm, region: e.target.value })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                        >
                          <option value="global">Global</option>
                          <option value="saudi">Saudi Arabia</option>
                          <option value="uae">UAE</option>
                          <option value="us">United States</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.riskProfile") || "Risk Profile"}</label>
                        <select
                          value={articleForm.riskProfile}
                          onChange={(e) => setArticleForm({ ...articleForm, riskProfile: e.target.value as any })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Any</option>
                          <option value="conservative">Conservative</option>
                          <option value="moderate">Moderate</option>
                          <option value="aggressive">Aggressive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.financialLevel") || "Financial Level"}</label>
                        <select
                          value={articleForm.financialLevel}
                          onChange={(e) => setArticleForm({ ...articleForm, financialLevel: e.target.value as any })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Any</option>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.tags") || "Tags (comma-separated)"}</label>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const tags = tagInput.split(",").map(t => t.trim()).filter(t => t);
                            if (tags.length > 0) {
                              setArticleForm({ ...articleForm, tags: [...articleForm.tags, ...tags] });
                              setTagInput("");
                            }
                          }
                        }}
                        placeholder={t("admin.article.tagsPlaceholder") || "e.g., debt, savings, investment (press Enter to add)"}
                        className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                      />
                      {articleForm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {articleForm.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs flex items-center gap-1"
                            >
                              {tag}
                              <button
                                onClick={() => setArticleForm({ ...articleForm, tags: articleForm.tags.filter((_, i) => i !== idx) })}
                                className="hover:text-red-600"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("admin.article.publishedAt") || "Published Date"} *</label>
                      <input
                        type="date"
                        value={articleForm.publishedAt}
                        onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                        className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowArticleDialog(false);
                          setEditingArticle(null);
                        }}
                        disabled={isSavingArticle}
                      >
                        {t("admin.cancel") || "Cancel"}
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!user?.id) return;
                          if (!articleForm.title || !articleForm.excerpt || !articleForm.content || !articleForm.author) {
                            setError("Please fill in all required fields");
                            return;
                          }
                          setIsSavingArticle(true);
                          setError(null);
                          try {
                            if (editingArticle) {
                              await updateArticle({
                                adminUserId: user.id,
                                articleId: editingArticle._id,
                                ...articleForm,
                                publishedAt: new Date(articleForm.publishedAt).toISOString(),
                                riskProfile: articleForm.riskProfile || undefined,
                                financialLevel: articleForm.financialLevel || undefined,
                              });
                              setSuccess("Article updated successfully");
                            } else {
                              await createArticle({
                                adminUserId: user.id,
                                ...articleForm,
                                publishedAt: new Date(articleForm.publishedAt).toISOString(),
                                riskProfile: articleForm.riskProfile || undefined,
                                financialLevel: articleForm.financialLevel || undefined,
                              });
                              setSuccess("Article created successfully");
                            }
                            setShowArticleDialog(false);
                            setEditingArticle(null);
                            setArticleForm({
                              language: "en",
                              title: "",
                              excerpt: "",
                              content: "",
                              author: "",
                              publishedAt: new Date().toISOString().split("T")[0],
                              readTime: 5,
                              category: "",
                              tags: [],
                              region: "global",
                              riskProfile: "",
                              financialLevel: "",
                              plan: "free",
                            });
                          } catch (err: any) {
                            setError(err.message || "Failed to save article");
                          } finally {
                            setIsSavingArticle(false);
                          }
                        }}
                        disabled={isSavingArticle}
                      >
                        {isSavingArticle ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                            <span className="hidden sm:inline">{t("admin.saving") || "Saving..."}</span>
                          </>
                        ) : (
                          editingArticle ? (t("admin.save") || "Save") : (t("admin.create") || "Create")
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {allArticles === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : allArticles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                {t("admin.noArticles") || "No articles found. Create your first article!"}
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {allArticles.map((article: any) => (
                  <div
                    key={article._id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className={`flex flex-col sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""} items-start sm:items-center justify-between gap-3 sm:gap-4`}>
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className={`flex flex-wrap ${isRTL ? "flex-row-reverse" : ""} items-center gap-2 mb-2`}>
                          <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words min-w-0">{article.title}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {article.category && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                                {article.category}
                              </span>
                            )}
                            {article.plan === "pro" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white shrink-0">
                                Pro
                              </span>
                            )}
                            {article.language && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 shrink-0">
                                {article.language.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">{article.excerpt}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          <span>{t("admin.article.author") || "Author"}: {article.author}</span>
                          <span>•</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                          {article.tags && article.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{article.tags.join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`flex flex-col sm:flex-row ${isRTL ? "sm:flex-row-reverse" : ""} gap-2 w-full sm:w-auto`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingArticle(article);
                            setArticleForm({
                              language: article.language || "en",
                              title: article.title,
                              excerpt: article.excerpt,
                              content: article.content,
                              author: article.author,
                              publishedAt: new Date(article.publishedAt).toISOString().split("T")[0],
                              readTime: article.readTime,
                              category: article.category || "",
                              tags: article.tags || [],
                              region: article.region || "global",
                              riskProfile: article.riskProfile || "",
                              financialLevel: article.financialLevel || "",
                              plan: article.plan || "free",
                            });
                            setShowArticleDialog(true);
                          }}
                          className="text-xs w-full sm:w-auto"
                        >
                          <Edit size={14} className="w-3.5 h-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">{t("admin.edit") || "Edit"}</span>
                          <span className="sm:hidden">{t("admin.edit") || "Edit"}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!user?.id) return;
                            if (!confirm(t("admin.confirmDelete") || "Are you sure you want to delete this article?")) return;
                            setIsUpdating(true);
                            setError(null);
                            try {
                              await deleteArticle({
                                adminUserId: user.id,
                                articleId: article._id,
                              });
                              setSuccess("Article deleted successfully");
                            } catch (err: any) {
                              setError(err.message || "Failed to delete article");
                            } finally {
                              setIsUpdating(false);
                            }
                          }}
                          disabled={isUpdating}
                          className="text-xs w-full sm:w-auto"
                        >
                          <Trash2 size={14} className="w-3.5 h-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">{t("admin.delete") || "Delete"}</span>
                          <span className="sm:hidden">{t("admin.delete") || "Delete"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
