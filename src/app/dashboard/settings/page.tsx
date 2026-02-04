"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { Button } from "@/components/ui/button";
import { getCurrencyName, getRegionName, getDefaultCurrencyForRegion, type Currency, type Region } from "@/lib/currency";

// Inner component that uses the queries
// If the queries fail, ErrorBoundary will catch it
function SettingsPageWithQuery() {
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();
  
  // Query both profile and preferences
  // ErrorBoundary will catch errors if functions don't exist
  const userProfile = useQuery(
    api.functions.getUserProfile,
    user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  const userPreferences = useQuery(
    api.functions.getUserPreferences,
    user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  const consentFlags = useQuery(
    api.compliance.getConsent,
    user?.id ? { clerkUserId: user.id } : "skip"
  );
  
  // Show loading state while queries are loading
  if (!isLoaded || !user || userProfile === undefined || userPreferences === undefined || consentFlags === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("settings.loading")}</p>
        </div>
      </div>
    );
  }
  
  return (
    <SettingsPageContent 
      userProfile={userProfile}
      userPreferences={userPreferences}
      consentFlags={consentFlags}
      isLoaded={isLoaded}
      user={user}
    />
  );
}

// Main content component that doesn't use the queries
function SettingsPageContent({ 
  userProfile,
  userPreferences,
  consentFlags,
  isLoaded,
  user 
}: { 
  userProfile?: any;
  userPreferences?: any;
  consentFlags?: any;
  isLoaded: boolean;
  user: any;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageType, setSaveMessageType] = useState<"success" | "error" | "info" | "">("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mutations
  const createOrUpdateUserProfile = useMutation(
    api.functions.createOrUpdateUserProfile
  );
  const createOrUpdateUserPreferences = useMutation(
    api.functions.createOrUpdateUserPreferences
  );
  const deleteAccount = useMutation(
    api.compliance.deleteAccount
  );
  const updateConsent = useMutation(
    api.compliance.updateConsent
  );
  const { theme, setTheme: setThemeContext } = useTheme();
  const { language, setLanguage: setLanguageContext, t, isRTL } = useLanguage();
  const { currency, region, setCurrency: setCurrencyContext, setRegion: setRegionContext } = useCurrency();

  // Form state
  const [formData, setFormData] = useState({
    riskTolerance: "moderate",
    monthlyIncome: "",
    monthlyExpenses: "",
    netWorth: "",
    emergencyFundGoal: "",
    emergencyFundCurrent: "",
    appearance: theme,
    language: "en",
    displayNameAr: "",
    region: region,
    currency: currency,
  });

  // Load existing profile and preferences data
  useEffect(() => {
    if (userProfile || userPreferences) {
      setFormData((prev) => ({
        ...prev,
        // Financial profile data
        riskTolerance: userProfile?.riskTolerance || prev.riskTolerance || "moderate",
        monthlyIncome: userProfile?.monthlyIncome?.toString() || prev.monthlyIncome || "",
        monthlyExpenses: userProfile?.monthlyExpenses?.toString() || prev.monthlyExpenses || "",
        netWorth: userProfile?.netWorth?.toString() || prev.netWorth || "",
        emergencyFundGoal: userProfile?.emergencyFundGoal?.toString() || prev.emergencyFundGoal || "",
        emergencyFundCurrent: userProfile?.emergencyFundCurrent?.toString() || prev.emergencyFundCurrent || "",
        // Preferences data (from separate table)
        appearance: userPreferences?.theme || theme || prev.appearance || "light",
        language: userPreferences?.language || prev.language || "en",
        displayNameAr: userPreferences?.displayNameAr || prev.displayNameAr || "",
        region: userPreferences?.region || prev.region || "ksa",
        currency: userPreferences?.currency || prev.currency || "SAR",
      }));
    }
  }, [userProfile, userPreferences, theme]);

  // Sync form appearance with theme context (when theme changes via toggle button)
  useEffect(() => {
    if (theme && formData.appearance !== theme) {
      setFormData((prev) => ({ ...prev, appearance: theme }));
    }
  }, [theme, formData.appearance]);

  // Sync form language with language context (when language changes via toggle button)
  useEffect(() => {
    if (language && formData.language !== language) {
      setFormData((prev) => ({ ...prev, language: language }));
    }
  }, [language, formData.language]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveMessage("");
    setSaveMessageType("");

    try {
      // Update theme, language, currency, and region context immediately when saving
      if (formData.appearance === "light" || formData.appearance === "dark") {
        setThemeContext(formData.appearance as "light" | "dark");
      }
      if (formData.language === "en" || formData.language === "ar") {
        setLanguageContext(formData.language as "en" | "ar");
      }
      if (formData.region === "ksa" || formData.region === "uae" || formData.region === "us") {
        setRegionContext(formData.region);
      }
      if (formData.currency === "SAR" || formData.currency === "AED" || formData.currency === "USD") {
        setCurrencyContext(formData.currency);
      }

      // Save financial profile and preferences separately
      await Promise.all([
        createOrUpdateUserProfile({
          clerkUserId: user.id,
          riskTolerance: formData.riskTolerance as any,
          monthlyIncome: formData.monthlyIncome
            ? parseFloat(formData.monthlyIncome)
            : undefined,
          monthlyExpenses: formData.monthlyExpenses
            ? parseFloat(formData.monthlyExpenses)
            : undefined,
          netWorth: formData.netWorth
            ? parseFloat(formData.netWorth)
            : undefined,
          emergencyFundGoal: formData.emergencyFundGoal
            ? parseFloat(formData.emergencyFundGoal)
            : undefined,
          emergencyFundCurrent: formData.emergencyFundCurrent
            ? parseFloat(formData.emergencyFundCurrent)
            : undefined,
        }),
        createOrUpdateUserPreferences({
          clerkUserId: user.id,
          theme: formData.appearance as any,
          language: formData.language as any,
          displayNameAr: formData.displayNameAr ? String(formData.displayNameAr) : undefined,
          region: formData.region as any,
          currency: formData.currency as any,
        }),
      ]);

      setSaveMessage(t("settings.save.success"));
      setSaveMessageType("success");
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      setSaveMessage(error?.message || "Unable to save settings. Please try again.");
      setSaveMessageType("error");
    } finally {
      setIsSaving(false);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout to clear message
      timeoutRef.current = setTimeout(() => {
        setSaveMessage("");
        setSaveMessageType("");
        timeoutRef.current = null;
      }, 3000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // If theme is changed, update immediately via context
    if (name === "appearance" && (value === "light" || value === "dark")) {
      setThemeContext(value as "light" | "dark");
    }
    
    // If language is changed, update immediately via context
    if (name === "language" && (value === "en" || value === "ar")) {
      setLanguageContext(value as "en" | "ar");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    const confirmed = window.confirm(
      language === "ar" 
        ? "هل أنت متأكد؟ سيتم حذف حسابك نهائياً بعد 30 يوماً. لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure? Your account will be permanently deleted after 30 days. This action cannot be undone."
    );

    if (!confirmed) {
      setShowDeleteConfirm(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount({
        clerkUserId: user.id,
        reason: "User requested deletion via settings",
      });
      setSaveMessage(
        language === "ar"
          ? "تم طلب حذف الحساب. سيتم الحذف النهائي بعد 30 يوماً."
          : "Account deletion requested. Permanent deletion will occur after 30 days."
      );
      // Redirect to home after a delay
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      setSaveMessage(error?.message || t("settings.dangerZone.deleteError"));
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

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
        <p className="text-gray-600">{t("settings.signInToAccess")}</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${isRTL ? "text-right" : ""}`}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t("settings.title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t("settings.subtitle")}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Info */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t("settings.account.title")}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.account.name")}</label>
              <input 
                type="text" 
                value={user.fullName || ""} 
                readOnly 
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.account.email")}</label>
              <input 
                type="email" 
                value={user.primaryEmailAddress?.emailAddress || ""} 
                readOnly 
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Financial Profile */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t("settings.financial.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.financial.monthlyIncome")}</label>
              <input
                type="number"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.financial.monthlyExpenses")}</label>
              <input
                type="number"
                name="monthlyExpenses"
                value={formData.monthlyExpenses}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                placeholder="3500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.financial.netWorth")}</label>
              <input
                type="number"
                name="netWorth"
                value={formData.netWorth}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                placeholder="150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.financial.riskTolerance")}</label>
              <select
                name="riskTolerance"
                value={formData.riskTolerance}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-colors"
              >
                <option value="conservative">{t("settings.financial.risk.conservative")}</option>
                <option value="moderate">{t("settings.financial.risk.moderate")}</option>
                <option value="aggressive">{t("settings.financial.risk.aggressive")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.financial.emergencyGoal")}</label>
              <input
                type="number"
                name="emergencyFundGoal"
                value={formData.emergencyFundGoal}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                placeholder="30000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.financial.emergencyCurrent")}</label>
              <input
                type="number"
                name="emergencyFundCurrent"
                value={formData.emergencyFundCurrent}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100"
                placeholder="15000"
              />
            </div>
          </div>
        </div>

        {/* Region & Currency */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t("settings.regionCurrency.title")}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t("settings.regionCurrency.help")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.region.label")}</label>
              <select
                name="region"
                value={formData.region}
                onChange={(e) => {
                  const newRegion = e.target.value as Region;
                  setFormData((prev) => {
                    const defaultCurrency = getDefaultCurrencyForRegion(newRegion);
                    return { ...prev, region: newRegion, currency: defaultCurrency };
                  });
                  setRegionContext(newRegion);
                  const defaultCurrency = getDefaultCurrencyForRegion(newRegion);
                  setCurrencyContext(defaultCurrency);
                }}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-colors"
              >
                <option value="ksa">{t("settings.region.ksa")}</option>
                <option value="uae">{t("settings.region.uae")}</option>
                <option value="us">{t("settings.region.us")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("settings.currency.label")}</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={(e) => {
                  const newCurrency = e.target.value as Currency;
                  setFormData((prev) => ({ ...prev, currency: newCurrency }));
                  setCurrencyContext(newCurrency);
                }}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-colors"
              >
                <option value="SAR">{t("settings.currency.SAR")}</option>
                <option value="AED">{t("settings.currency.AED")}</option>
                <option value="USD">{t("settings.currency.USD")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-4 dark:text-gray-100">
            {t("settings.preferences.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t("settings.theme.label")}
              </label>
              <select
                name="appearance"
                value={formData.appearance}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-colors"
              >
                <option value="light">{t("settings.theme.light")}</option>
                <option value="dark">{t("settings.theme.dark")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t("settings.language.label")}
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-colors"
              >
                <option value="en">{t("settings.language.en")}</option>
                <option value="ar">{t("settings.language.ar")}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t("settings.displayNameAr.label")}
              </label>
              <input
                type="text"
                name="displayNameAr"
                value={formData.displayNameAr}
                onChange={handleChange}
                placeholder={t("settings.displayNameAr.placeholder")}
                dir="rtl"
                className="w-full p-3 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-colors"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("settings.displayNameAr.help")}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy & Consent */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow p-6 border border-gray-200 dark:border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t("settings.consent.title")}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t("settings.consent.description")}</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{t("settings.consent.aiAnalysis.title")}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("settings.consent.aiAnalysis.description")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentFlags?.aiAnalysisConsent !== true}
                  onChange={async (e) => {
                    if (!user?.id) return;
                    try {
                      const newValue = !e.target.checked; // Invert: unchecked (green) = enabled, checked (grey) = disabled
                      await updateConsent({
                        clerkUserId: user.id,
                        aiAnalysisConsent: newValue,
                      });
                      setSaveMessage(
                        newValue 
                          ? (language === "ar" ? "تم تفعيل تحليل الذكاء الاصطناعي" : "AI analysis enabled")
                          : (language === "ar" ? "تم إلغاء تحليل الذكاء الاصطناعي" : "AI analysis disabled")
                      );
                      setSaveMessageType(newValue ? "success" : "info");
                      setTimeout(() => setSaveMessage(""), 3000);
                    } catch (error: any) {
                      console.error("Failed to update consent:", error);
                      setSaveMessage(error?.message || t("settings.consent.updateError"));
                      setSaveMessageType("error");
                      setTimeout(() => setSaveMessage(""), 3000);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-emerald-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full dark:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gray-200 dark:peer-checked:bg-gray-700"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{t("settings.consent.onboardingData.title")}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("settings.consent.onboardingData.description")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentFlags?.onboardingDataConsent !== true}
                  onChange={async (e) => {
                    if (!user?.id) return;
                    try {
                      const newValue = !e.target.checked; // Invert: unchecked (green) = enabled, checked (grey) = disabled
                      await updateConsent({
                        clerkUserId: user.id,
                        onboardingDataConsent: newValue,
                      });
                      setSaveMessage(
                        newValue 
                          ? (language === "ar" ? "تم تفعيل معالجة بيانات الإعداد" : "Onboarding data processing enabled")
                          : (language === "ar" ? "تم إلغاء معالجة بيانات الإعداد" : "Onboarding data processing disabled")
                      );
                      setSaveMessageType(newValue ? "success" : "info");
                      setTimeout(() => setSaveMessage(""), 3000);
                    } catch (error: any) {
                      console.error("Failed to update consent:", error);
                      setSaveMessage(error?.message || t("settings.consent.updateError"));
                      setSaveMessageType("error");
                      setTimeout(() => setSaveMessage(""), 3000);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-emerald-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full dark:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gray-200 dark:peer-checked:bg-gray-700"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl shadow p-6 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-bold mb-4 text-red-900 dark:text-red-300">{t("settings.dangerZone.title")}</h2>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">{t("settings.dangerZone.description")}</p>
          {showDeleteConfirm && (
            <p className="text-sm text-red-800 dark:text-red-300 mb-4 font-medium">
              {t("settings.dangerZone.confirmMessage")}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isDeleting 
                ? t("settings.dangerZone.deleting")
                : showDeleteConfirm
                ? t("settings.dangerZone.confirmDelete")
                : t("settings.dangerZone.deleteButton")
              }
            </Button>
            {showDeleteConfirm && (
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
            {isSaving 
              ? t("common.saving")
              : t("common.save")
            }
          </Button>
        </div>

        {saveMessage && (
          <div
            className={`p-3 rounded-xl ${
              saveMessageType === "success"
                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                : saveMessageType === "info"
                ? "bg-gray-100 dark:bg-slate-800/40 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700"
                : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {saveMessage}
          </div>
        )}
      </form>
    </div>
  );
}

// Fallback component that doesn't use the query
function SettingsPageFallback() {
  const { user, isLoaded } = useUser();
  
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
        <p className="text-gray-600">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> The Convex function &quot;getUserProfile&quot; is not deployed. 
              Please run <code className="bg-yellow-100 px-1 rounded">npx convex dev</code> or <code className="bg-yellow-100 px-1 rounded">npx convex deploy</code> to deploy functions.
              You can still use the form below, but existing profile data will not be loaded.
            </p>
          </div>
        </div>
      </div>
      <SettingsPageContent 
        userProfile={undefined}
        userPreferences={undefined}
        isLoaded={isLoaded}
        user={user}
      />
    </>
  );
}

export default function SettingsPage() {
  return (
    <ErrorBoundary fallback={<SettingsPageFallback />}>
      <SettingsPageWithQuery />
    </ErrorBoundary>
  );
}
