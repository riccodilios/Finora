"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Shield, User, Crown, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { t, isRTL } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

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

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    <div className={`space-y-6 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Shield className="w-8 h-8" />
          {t("admin.title") || "Admin Panel"}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("admin.subtitle") || "Manage users and subscriptions"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-red-800 dark:text-red-300">{t("admin.error") || "Error"}</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Check size={20} className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

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
            <div className="space-y-4">
              {allUsers.map((userData) => (
                <div
                  key={userData._id}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className={`flex ${isRTL ? "flex-row-reverse" : ""} items-start justify-between gap-4`}>
                    <div className="flex-1">
                      <div className={`flex ${isRTL ? "flex-row-reverse" : ""} items-center gap-2 mb-1`}>
                        <User size={16} className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{userData.email}</span>
                        {userData.isAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <Crown size={12} className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          userData.plan === "pro"
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                        }`}>
                          {userData.plan.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("admin.userId") || "User ID"}: {userData.clerkUserId}
                      </p>
                      {userData.createdAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t("admin.createdAt") || "Created"}: {new Date(userData.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className={`flex ${isRTL ? "flex-row-reverse" : ""} gap-2`}>
                      {/* Toggle Admin */}
                      <Button
                        size="sm"
                        variant={userData.isAdmin ? "destructive" : "outline"}
                        onClick={() => handleToggleAdmin(userData.clerkUserId, userData.isAdmin || false)}
                        disabled={isUpdating || userData.clerkUserId === user?.id}
                        className="text-xs"
                        title={userData.clerkUserId === user?.id ? "Cannot remove your own admin status" : undefined}
                      >
                        {userData.isAdmin ? (
                          <>
                            <X size={14} className="w-3.5 h-3.5 mr-1" />
                            {t("admin.removeAdmin") || "Remove Admin"}
                          </>
                        ) : (
                          <>
                            <Crown size={14} className="w-3.5 h-3.5 mr-1" />
                            {t("admin.makeAdmin") || "Make Admin"}
                          </>
                        )}
                      </Button>
                      
                      {/* Update Plan */}
                      <Button
                        size="sm"
                        variant={userData.plan === "pro" ? "outline" : "default"}
                        onClick={() => handleUpdatePlan(userData.clerkUserId, userData.plan === "pro" ? "free" : "pro")}
                        disabled={isUpdating}
                        className="text-xs"
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
    </div>
  );
}
