"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";

const stepsEn = [
  {
    id: 0,
    title: "What should we call you?",
    field: "displayName",
    placeholder: "Finora user",
    label: "What name would you like Finora to use?",
  },
  {
    id: 1,
    title: "Monthly Income",
    field: "monthlyIncome",
    placeholder: "5000",
    label: "What is your monthly income? (SAR)",
  },
  {
    id: 2,
    title: "Monthly Expenses",
    field: "monthlyExpenses",
    placeholder: "3500",
    label: "What are your monthly expenses? (SAR)",
  },
  {
    id: 3,
    title: "Net Worth",
    field: "netWorth",
    placeholder: "150000",
    label: "What is your total net worth? (SAR) - Assets minus total debts (can be negative)",
  },
  {
    id: 4,
    title: "Current Savings",
    field: "emergencyFundCurrent",
    placeholder: "15000",
    label: "How much do you currently have saved? (SAR)",
  },
  {
    id: 5,
    title: "Emergency Fund Goal",
    field: "emergencyFundGoal",
    placeholder: "30000",
    label: "What is your emergency fund goal? (SAR)",
  },
  {
    id: 6,
    title: "Risk Tolerance",
    field: "riskTolerance",
    label: "What is your risk tolerance?",
    type: "select",
    options: [
      { value: "conservative", label: "Conservative - Prefer stable, low-risk investments" },
      { value: "moderate", label: "Moderate - Balanced approach to risk and return" },
      { value: "aggressive", label: "Aggressive - Willing to take higher risks for higher returns" },
    ],
  },
];

const stepsAr = [
  {
    id: 0,
    title: "بماذا نُناديك؟",
    field: "displayName",
    placeholder: "اسمك هنا",
    label: "ما الاسم الذي تفضل أن نستخدمه في فينورا؟",
  },
  {
    id: 1,
    title: "الدخل الشهري",
    field: "monthlyIncome",
    placeholder: "٥٠٠٠",
    label: "ما هو دخلك الشهري؟ (ريال سعودي)",
  },
  {
    id: 2,
    title: "المصروفات الشهرية",
    field: "monthlyExpenses",
    placeholder: "٣٥٠٠",
    label: "ما هي مصروفاتك الشهرية؟ (ريال سعودي)",
  },
  {
    id: 3,
    title: "صافي الثروة",
    field: "netWorth",
    placeholder: "١٥٠٠٠٠",
    label: "ما هو صافي ثروتك الإجمالي؟ (الأصول ناقص إجمالي الديون، ويمكن أن يكون سالبًا)",
  },
  {
    id: 4,
    title: "المدخرات الحالية",
    field: "emergencyFundCurrent",
    placeholder: "١٥٠٠٠",
    label: "كم لديك حاليًا من مدخرات؟ (ريال سعودي)",
  },
  {
    id: 5,
    title: "هدف صندوق الطوارئ",
    field: "emergencyFundGoal",
    placeholder: "٣٠٠٠٠",
    label: "ما هو هدفك لصندوق الطوارئ؟ (ريال سعودي)",
  },
  {
    id: 6,
    title: "تحمل المخاطر",
    field: "riskTolerance",
    label: "ما هو مستوى تحملك للمخاطر؟",
    type: "select",
    options: [
      { value: "conservative", label: "محافظ - تفضل الاستثمارات المستقرة منخفضة المخاطر" },
      { value: "moderate", label: "متوازن - توازن بين المخاطر والعائد" },
      { value: "aggressive", label: "جريء - مستعد لتحمل مخاطر أعلى مقابل عوائد أعلى" },
    ],
  },
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { language, isRTL } = useLanguage();

  const steps = language === "ar" ? stepsAr : stepsEn;
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    displayName: "",
    monthlyIncome: "",
    monthlyExpenses: "",
    netWorth: "",
    emergencyFundCurrent: "",
    emergencyFundGoal: "",
    riskTolerance: "moderate",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const createOrUpdateUserProfile = useMutation(
    api.functions.createOrUpdateUserProfile
  );
  const createOrUpdateUserPreferences = useMutation(
    api.functions.createOrUpdateUserPreferences
  );

  // Check if user is already onboarded
  const isOnboarded = useQuery(
    api.functions.isUserOnboarded,
    isLoaded && user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Redirect if already onboarded
  if (isLoaded && user && isOnboarded === true) {
    router.push("/dashboard");
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const backLabel = language === "ar" ? "رجوع" : "Back";
  const nextLabel = language === "ar" ? "التالي" : "Next";
  const savingLabel = language === "ar" ? "جاري الحفظ..." : "Saving...";
  const completeLabel = language === "ar" ? "إكمال الإعداد" : "Complete Setup";

  const handleNext = () => {
    const value = formData[currentStepData.field as keyof typeof formData];
    if (!value || value === "") {
      setFieldError(`Please fill in ${currentStepData.title.toLowerCase()} before continuing.`);
      return;
    }
    setFieldError(null);
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      if (formData.displayName.trim()) {
        await createOrUpdateUserPreferences({
          clerkUserId: user.id,
          displayNameAr: formData.displayName.trim(),
        });
      }

      await createOrUpdateUserProfile({
        clerkUserId: user.id,
        monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
        monthlyExpenses: formData.monthlyExpenses ? parseFloat(formData.monthlyExpenses) : undefined,
        netWorth: formData.netWorth ? parseFloat(formData.netWorth) : undefined,
        emergencyFundCurrent: formData.emergencyFundCurrent ? parseFloat(formData.emergencyFundCurrent) : undefined,
        emergencyFundGoal: formData.emergencyFundGoal ? parseFloat(formData.emergencyFundGoal) : undefined,
        riskTolerance: formData.riskTolerance as any,
        isOnboarded: true,
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to save onboarding data:", error);
      setError(error?.message || "Unable to save your information. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative ${
        isRTL ? "text-right" : "text-left"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Language toggle fixed at top-right of viewport */}
      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>

      <div className="max-w-2xl w-full bg-white dark:bg-white rounded-xl shadow-lg p-8 text-gray-900 dark:text-gray-900">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900 mb-2">
            {currentStepData.title}
          </h1>
          <p className="text-gray-700 dark:text-gray-800 mb-6">{currentStepData.label}</p>

          {currentStepData.type === "select" ? (
            <div className="space-y-3">
              {currentStepData.options?.map((option) => (
                <label
                  key={option.value}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData[currentStepData.field as keyof typeof formData] === option.value
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={currentStepData.field}
                    value={option.value}
                    checked={formData[currentStepData.field as keyof typeof formData] === option.value}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span className="font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              type={currentStepData.field === "displayName" ? "text" : "number"}
              name={currentStepData.field}
              value={formData[currentStepData.field as keyof typeof formData]}
              onChange={handleChange}
              placeholder={currentStepData.placeholder}
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
              autoFocus
            />
          )}
        </div>

        {/* Error messages */}
        {fieldError && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-md">
            {fieldError}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              isFirstStep
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {backLabel}
          </button>
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? savingLabel
              : isLastStep
              ? completeLabel
              : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
