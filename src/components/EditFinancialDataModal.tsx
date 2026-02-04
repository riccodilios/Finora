"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Check } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";

interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  type: "salary" | "freelance" | "rental" | "investment" | "other";
  isRecurring: boolean;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: "housing" | "food" | "transport" | "subscriptions" | "utilities" | "healthcare" | "entertainment" | "other";
  type: "fixed" | "variable";
  isRecurring: boolean;
}

interface Debt {
  id: string;
  name: string;
  principal: number;
  monthlyPayment: number;
  interestRate?: number;
  type: "credit_card" | "personal_loan" | "student_loan" | "mortgage" | "car_loan" | "other";
}

interface Investment {
  id: string;
  name: string;
  value: number;
  type: "stocks" | "bonds" | "real_estate" | "crypto" | "mutual_funds" | "other";
  monthlyContribution?: number;
}

interface Savings {
  emergencyFundCurrent: number;
  emergencyFundGoal: number;
  otherSavings?: number;
}

interface EditFinancialDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  clerkUserId: string;
}

export function EditFinancialDataModal({ isOpen, onClose, clerkUserId }: EditFinancialDataModalProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isRTL = language === "ar";
  const isDark = theme === "dark";
  const financialProfile = useQuery(
    api.functions.getOrCreateFinancialProfile, 
    clerkUserId ? { clerkUserId } : "skip"
  );
  const updateFinancialProfile = useMutation(api.functions.updateFinancialProfile);
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"income" | "expenses" | "debts" | "investments" | "savings">("income");
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});

  // Translations
  const t = {
    title: language === "ar" ? "تعديل البيانات المالية" : "Edit Financial Data",
    income: language === "ar" ? "الدخل" : "Income",
    expenses: language === "ar" ? "المصروفات" : "Expenses",
    debts: language === "ar" ? "الديون" : "Debts",
    investments: language === "ar" ? "الاستثمارات" : "Investments",
    savings: language === "ar" ? "الادخار" : "Savings",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    saveChanges: language === "ar" ? "حفظ التغييرات" : "Save Changes",
    saving: language === "ar" ? "جاري الحفظ..." : "Saving...",
    addIncomeSource: language === "ar" ? "إضافة مصدر دخل" : "Add Income Source",
    addExpense: language === "ar" ? "إضافة مصروف" : "Add Expense",
    addDebt: language === "ar" ? "إضافة دين" : "Add Debt",
    addInvestment: language === "ar" ? "إضافة استثمار" : "Add Investment",
    incomeSources: language === "ar" ? "مصادر الدخل" : "Income Sources",
    noIncomeSources: language === "ar" ? "لم يتم إضافة مصادر دخل. انقر على \"إضافة مصدر دخل\" للبدء." : "No income sources added. Click \"Add Income Source\" to get started.",
    noExpenses: language === "ar" ? "لم يتم إضافة مصروفات. انقر على \"إضافة مصروف\" للبدء." : "No expenses added. Click \"Add Expense\" to get started.",
    noDebts: language === "ar" ? "لم يتم إضافة ديون. انقر على \"إضافة دين\" للبدء." : "No debts added. Click \"Add Debt\" to get started.",
    noInvestments: language === "ar" ? "لم يتم إضافة استثمارات. انقر على \"إضافة استثمار\" للبدء." : "No investments added. Click \"Add Investment\" to get started.",
    sourceName: language === "ar" ? "اسم المصدر" : "Source name",
    amount: language === "ar" ? "المبلغ (ريال)" : "Amount (SAR)",
    recurring: language === "ar" ? "متكرر" : "Recurring",
    expenseName: language === "ar" ? "اسم المصروف" : "Expense name",
    debtName: language === "ar" ? "اسم الدين" : "Debt name",
    principal: language === "ar" ? "المبلغ الأصلي (ريال)" : "Principal (SAR)",
    monthlyPayment: language === "ar" ? "الدفعة الشهرية (ريال)" : "Monthly Payment (SAR)",
    interestRate: language === "ar" ? "معدل الفائدة (%)" : "Interest Rate (%)",
    investmentName: language === "ar" ? "اسم الاستثمار" : "Investment name",
    value: language === "ar" ? "القيمة (ريال)" : "Value (SAR)",
    monthlyContribution: language === "ar" ? "المساهمة الشهرية (ريال)" : "Monthly Contribution (SAR)",
    emergencyFundCurrent: language === "ar" ? "صندوق الطوارئ الحالي (ريال)" : "Emergency Fund Current (SAR)",
    emergencyFundGoal: language === "ar" ? "هدف صندوق الطوارئ (ريال)" : "Emergency Fund Goal (SAR)",
    otherSavings: language === "ar" ? "مدخرات أخرى (ريال)" : "Other Savings (SAR)",
    salary: language === "ar" ? "راتب" : "Salary",
    freelance: language === "ar" ? "عمل حر" : "Freelance",
    rental: language === "ar" ? "إيجار" : "Rental",
    investment: language === "ar" ? "استثمار" : "Investment",
    other: language === "ar" ? "أخرى" : "Other",
    fixed: language === "ar" ? "ثابت" : "Fixed",
    variable: language === "ar" ? "متغير" : "Variable",
    housing: language === "ar" ? "سكن" : "Housing",
    food: language === "ar" ? "طعام" : "Food",
    transport: language === "ar" ? "مواصلات" : "Transport",
    subscriptions: language === "ar" ? "اشتراكات" : "Subscriptions",
    utilities: language === "ar" ? "مرافق" : "Utilities",
    healthcare: language === "ar" ? "رعاية صحية" : "Healthcare",
    entertainment: language === "ar" ? "ترفيه" : "Entertainment",
    creditCard: language === "ar" ? "بطاقة ائتمان" : "Credit Card",
    personalLoan: language === "ar" ? "قرض شخصي" : "Personal Loan",
    studentLoan: language === "ar" ? "قرض طالب" : "Student Loan",
    mortgage: language === "ar" ? "رهن عقاري" : "Mortgage",
    carLoan: language === "ar" ? "قرض سيارة" : "Car Loan",
    stocks: language === "ar" ? "أسهم" : "Stocks",
    bonds: language === "ar" ? "سندات" : "Bonds",
    realEstate: language === "ar" ? "عقارات" : "Real Estate",
    crypto: language === "ar" ? "عملة رقمية" : "Crypto",
    mutualFunds: language === "ar" ? "صناديق استثمارية" : "Mutual Funds",
  };

  // Form state
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [savings, setSavings] = useState<Savings>({
    emergencyFundCurrent: 0,
    emergencyFundGoal: 0,
    otherSavings: 0,
  });

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (financialProfile) {
        setIncomeSources(financialProfile.incomeSources || []);
        setExpenses(financialProfile.expenses || []);
        setDebts(financialProfile.debts || []);
        setInvestments(financialProfile.investments || []);
        setSavings(financialProfile.savings || {
          emergencyFundCurrent: 0,
          emergencyFundGoal: 0,
          otherSavings: 0,
        });
      } else {
        // Reset to empty state if no profile exists yet
        setIncomeSources([]);
        setExpenses([]);
        setDebts([]);
        setInvestments([]);
        setSavings({
          emergencyFundCurrent: 0,
          emergencyFundGoal: 0,
          otherSavings: 0,
        });
      }
    }
  }, [isOpen, financialProfile]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateFinancialProfile({
        clerkUserId,
        incomeSources,
        expenses,
        debts,
        investments,
        savings,
      });
      onClose();
      // Data will refresh automatically via Convex reactivity
    } catch (error: any) {
      console.error("Failed to save financial data:", error);
      alert(error?.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (financialProfile) {
      setIncomeSources(financialProfile.incomeSources || []);
      setExpenses(financialProfile.expenses || []);
      setDebts(financialProfile.debts || []);
      setInvestments(financialProfile.investments || []);
      setSavings(financialProfile.savings || {
        emergencyFundCurrent: 0,
        emergencyFundGoal: 0,
        otherSavings: 0,
      });
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 9999,
        backgroundColor: isDark 
          ? 'rgba(0, 0, 0, 0.4)' // Darker backdrop for dark mode
          : 'rgba(0, 0, 0, 0.15)', // 15% opacity for light mode
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="shadow-2xl max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-4 my-2 sm:my-4 w-full sm:w-auto"
        style={{ 
          width: 'calc(100% - 1rem)',
          maxWidth: '650px',
          borderRadius: '8px',
          border: 'none',
          outline: 'none',
          boxShadow: isDark 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backgroundColor: isDark 
            ? 'rgba(31, 41, 55, 0.95)' // gray-800 with 95% opacity for better coverage
            : 'rgba(255, 255, 255, 0.95)', // white with 95% opacity
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        dir={isRTL ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 bg-gray-50 dark:bg-gray-900/50 relative">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100 pr-8">{t.title}</h2>
          <button
            onClick={handleCancel}
            className="absolute p-2 transition-all duration-200"
            style={{ 
              top: '12px',
              right: '12px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <X size={20} className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-start sm:justify-center px-4 sm:px-6 md:px-10 py-3 bg-transparent gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: "income", label: t.income },
            { key: "expenses", label: t.expenses },
            { key: "debts", label: t.debts },
            { key: "investments", label: t.investments },
            { key: "savings", label: t.savings },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-300 ease-in-out relative whitespace-nowrap flex-shrink-0"
              style={{ 
                borderRadius: '6px',
                backgroundColor: activeTab === key
                  ? (isDark ? 'rgba(55, 65, 81, 0.8)' : 'rgba(229, 231, 235, 0.8)')
                  : 'transparent',
                color: activeTab === key
                  ? (isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)')
                  : (isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'),
                borderBottom: 'none',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== key) {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(55, 65, 81, 0.4)' : 'rgba(229, 231, 235, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-10 py-4 sm:py-6 bg-transparent">
          {/* Income Sources */}
          {activeTab === "income" && (
            <div 
              style={{ 
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
              <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.incomeSources}</h3>
                <button
                  onClick={() =>
                    setIncomeSources([
                      ...incomeSources,
                      { id: generateId(), name: "", amount: 0, type: "salary", isRecurring: true },
                    ])
                  }
                  className="flex items-center gap-2 px-4 py-2 transition-all duration-200 ease-in-out text-sm font-medium"
                  style={{ 
                    borderRadius: '6px',
                    backgroundColor: isDark ? '#0e131a' : 'rgba(107, 114, 128, 0.8)',
                    border: '1px solid transparent',
                    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(255, 255, 255)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                >
                  +Add
                </button>
              </div>
              {incomeSources.map((source, index) => {
                const dropdownKey = `income-${source.id}`;
                const isDropdownOpen = openDropdowns[dropdownKey] || false;
                const incomeTypes = [
                  { value: "salary", label: t.salary },
                  { value: "freelance", label: t.freelance },
                  { value: "rental", label: t.rental },
                  { value: "investment", label: t.investment },
                  { value: "other", label: t.other },
                ];
                return (
                  <div key={source.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/50" style={{ borderRadius: '12px' }}>
                    <input
                      type="text"
                      placeholder={t.sourceName}
                      value={source.name}
                      onChange={(e) => {
                        const updated = [...incomeSources];
                        updated[index].name = e.target.value;
                        setIncomeSources(updated);
                      }}
                      className="w-full sm:col-span-4 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <input
                      type="number"
                      placeholder={t.amount}
                      value={source.amount || ""}
                      onChange={(e) => {
                        const updated = [...incomeSources];
                        updated[index].amount = parseFloat(e.target.value) || 0;
                        setIncomeSources(updated);
                      }}
                      className="w-full sm:col-span-3 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <div className="w-full sm:col-span-4 relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdowns({ ...openDropdowns, [dropdownKey]: !isDropdownOpen })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-all flex items-center justify-between text-sm sm:text-base"
                        style={{ 
                          borderRadius: '6px', 
                          border: '1px solid transparent',
                          backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                          color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isDropdownOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onBlur={(e) => {
                          if (!isDropdownOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <span>{incomeTypes.find(t => t.value === source.type)?.label || t.other}</span>
                        <span className="text-xs">{isDropdownOpen ? '▲' : '▼'}</span>
                      </button>
                      {isDropdownOpen && (
                        <div 
                          className="absolute z-10 w-full mt-1 shadow-lg"
                          style={{
                            borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
                          }}
                        >
                          {incomeTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                const updated = [...incomeSources];
                                updated[index].type = type.value as any;
                                setIncomeSources(updated);
                                setOpenDropdowns({ ...openDropdowns, [dropdownKey]: false });
                              }}
                              className="w-full px-4 py-2 text-left flex items-center justify-between transition-colors text-gray-900 dark:text-gray-100"
                              style={{
                                backgroundColor: source.type === type.value 
                                  ? (isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)')
                                  : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (source.type !== type.value) {
                                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(30, 58, 138, 0.3)' : 'rgba(107, 114, 128, 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (source.type !== type.value) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <span>{type.label}</span>
                              {source.type === type.value && (
                                <Check size={16} className="text-gray-900 dark:text-gray-100" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIncomeSources(incomeSources.filter((_, i) => i !== index))}
                      className="w-full sm:w-auto sm:col-span-1 p-2 sm:p-3 transition-all flex items-center justify-center sm:justify-start"
                      style={{ 
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <Trash2 size={16} className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                );
              })}
              {incomeSources.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t.noIncomeSources}
                </p>
              )}
              </div>
            </div>
          )}

          {/* Expenses */}
          {activeTab === "expenses" && (
            <div 
              style={{ 
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
              <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.expenses}</h3>
                <button
                  onClick={() =>
                    setExpenses([
                      ...expenses,
                      { id: generateId(), name: "", amount: 0, category: "other", type: "variable", isRecurring: true },
                    ])
                  }
                  className="flex items-center gap-2 px-4 py-2 transition-all duration-200 ease-in-out text-sm font-medium"
                  style={{ 
                    borderRadius: '6px',
                    backgroundColor: isDark ? '#0e131a' : 'rgba(107, 114, 128, 0.8)',
                    border: '1px solid transparent',
                    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(255, 255, 255)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                >
                  +Add
                </button>
              </div>
              {expenses.map((expense, index) => {
                const categoryDropdownKey = `expense-category-${expense.id}`;
                const typeDropdownKey = `expense-type-${expense.id}`;
                const isCategoryOpen = openDropdowns[categoryDropdownKey] || false;
                const isTypeOpen = openDropdowns[typeDropdownKey] || false;
                const categories = [
                  { value: "housing", label: t.housing },
                  { value: "food", label: t.food },
                  { value: "transport", label: t.transport },
                  { value: "subscriptions", label: t.subscriptions },
                  { value: "utilities", label: t.utilities },
                  { value: "healthcare", label: t.healthcare },
                  { value: "entertainment", label: t.entertainment },
                  { value: "other", label: t.other },
                ];
                const expenseTypes = [
                  { value: "fixed", label: t.fixed },
                  { value: "variable", label: t.variable },
                ];
                return (
                  <div key={expense.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/50" style={{ borderRadius: '12px' }}>
                    <input
                      type="text"
                      placeholder={t.expenseName}
                      value={expense.name}
                      onChange={(e) => {
                        const updated = [...expenses];
                        updated[index].name = e.target.value;
                        setExpenses(updated);
                      }}
                      className="w-full sm:col-span-3 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <input
                      type="number"
                      placeholder={t.amount}
                      value={expense.amount || ""}
                      onChange={(e) => {
                        const updated = [...expenses];
                        updated[index].amount = parseFloat(e.target.value) || 0;
                        setExpenses(updated);
                      }}
                      className="w-full sm:col-span-2 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <div className="w-full sm:col-span-3 relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdowns({ ...openDropdowns, [categoryDropdownKey]: !isCategoryOpen })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-all flex items-center justify-between text-sm sm:text-base"
                        style={{ 
                          borderRadius: '6px', 
                          border: '1px solid transparent',
                          backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                          color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCategoryOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onBlur={(e) => {
                          if (!isCategoryOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <span>{categories.find(c => c.value === expense.category)?.label || t.other}</span>
                        <span className="text-xs">{isCategoryOpen ? '▲' : '▼'}</span>
                      </button>
                      {isCategoryOpen && (
                        <div 
                          className="absolute z-10 w-full mt-1 shadow-lg max-h-48 overflow-y-auto"
                          style={{
                            borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
                          }}
                        >
                          {categories.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => {
                                const updated = [...expenses];
                                updated[index].category = cat.value as any;
                                setExpenses(updated);
                                setOpenDropdowns({ ...openDropdowns, [categoryDropdownKey]: false });
                              }}
                              className="w-full px-4 py-2 text-left flex items-center justify-between transition-colors text-gray-900 dark:text-gray-100"
                              style={{
                                backgroundColor: expense.category === cat.value 
                                  ? (isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)')
                                  : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (expense.category !== cat.value) {
                                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(30, 58, 138, 0.3)' : 'rgba(107, 114, 128, 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (expense.category !== cat.value) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <span>{cat.label}</span>
                              {expense.category === cat.value && (
                                <Check size={16} className="text-gray-900 dark:text-gray-100" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-full sm:col-span-3 relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdowns({ ...openDropdowns, [typeDropdownKey]: !isTypeOpen })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-all flex items-center justify-between text-sm sm:text-base"
                        style={{ 
                          borderRadius: '6px', 
                          border: '1px solid transparent',
                          backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                          color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isTypeOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onBlur={(e) => {
                          if (!isTypeOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <span>{expenseTypes.find(et => et.value === expense.type)?.label || t.variable}</span>
                        <span className="text-xs">{isTypeOpen ? '▲' : '▼'}</span>
                      </button>
                      {isTypeOpen && (
                        <div 
                          className="absolute z-10 w-full mt-1 shadow-lg"
                          style={{
                            borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
                          }}
                        >
                          {expenseTypes.map((et) => (
                            <button
                              key={et.value}
                              type="button"
                              onClick={() => {
                                const updated = [...expenses];
                                updated[index].type = et.value as any;
                                setExpenses(updated);
                                setOpenDropdowns({ ...openDropdowns, [typeDropdownKey]: false });
                              }}
                              className="w-full px-4 py-2 text-left flex items-center justify-between transition-colors text-gray-900 dark:text-gray-100"
                              style={{
                                backgroundColor: expense.type === et.value 
                                  ? (isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)')
                                  : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (expense.type !== et.value) {
                                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(30, 58, 138, 0.3)' : 'rgba(107, 114, 128, 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (expense.type !== et.value) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <span>{et.label}</span>
                              {expense.type === et.value && (
                                <Check size={16} className="text-gray-900 dark:text-gray-100" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setExpenses(expenses.filter((_, i) => i !== index))}
                      className="w-full sm:w-auto sm:col-span-1 p-2 sm:p-3 transition-all flex items-center justify-center sm:justify-start"
                      style={{ 
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <Trash2 size={16} className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                );
              })}
              {expenses.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t.noExpenses}
                </p>
              )}
            </div>
            </div>
          )}

          {/* Debts */}
          {activeTab === "debts" && (
            <div 
              style={{ 
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.debts}</h3>
                <button
                  onClick={() =>
                    setDebts([
                      ...debts,
                      { id: generateId(), name: "", principal: 0, monthlyPayment: 0, type: "other" },
                    ])
                  }
                  className="flex items-center gap-2 px-4 py-2 transition-all duration-200 ease-in-out text-sm font-medium"
                  style={{ 
                    borderRadius: '6px',
                    backgroundColor: isDark ? '#0e131a' : 'rgba(107, 114, 128, 0.8)',
                    border: '1px solid transparent',
                    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(255, 255, 255)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                >
                  +Add
                </button>
              </div>
              {debts.map((debt, index) => {
                const debtTypeDropdownKey = `debt-type-${debt.id}`;
                const isDebtTypeOpen = openDropdowns[debtTypeDropdownKey] || false;
                const debtTypes = [
                  { value: "credit_card", label: t.creditCard },
                  { value: "personal_loan", label: t.personalLoan },
                  { value: "student_loan", label: t.studentLoan },
                  { value: "mortgage", label: t.mortgage },
                  { value: "car_loan", label: t.carLoan },
                  { value: "other", label: t.other },
                ];
                return (
                  <div key={debt.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/50" style={{ borderRadius: '12px' }}>
                    <input
                      type="text"
                      placeholder={t.debtName}
                      value={debt.name}
                      onChange={(e) => {
                        const updated = [...debts];
                        updated[index].name = e.target.value;
                        setDebts(updated);
                      }}
                      className="w-full sm:col-span-3 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <input
                      type="number"
                      placeholder={t.principal}
                      value={debt.principal || ""}
                      onChange={(e) => {
                        const updated = [...debts];
                        updated[index].principal = parseFloat(e.target.value) || 0;
                        setDebts(updated);
                      }}
                      className="w-full sm:col-span-2 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <input
                      type="number"
                      placeholder={t.monthlyPayment}
                      value={debt.monthlyPayment || ""}
                      onChange={(e) => {
                        const updated = [...debts];
                        updated[index].monthlyPayment = parseFloat(e.target.value) || 0;
                        setDebts(updated);
                      }}
                      className="w-full sm:col-span-2 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <input
                      type="number"
                      placeholder={t.interestRate}
                      value={debt.interestRate || ""}
                      onChange={(e) => {
                        const updated = [...debts];
                        updated[index].interestRate = parseFloat(e.target.value) || undefined;
                        setDebts(updated);
                      }}
                      className="w-full sm:col-span-2 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <div className="w-full sm:col-span-2 relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdowns({ ...openDropdowns, [debtTypeDropdownKey]: !isDebtTypeOpen })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-all flex items-center justify-between text-sm sm:text-base"
                        style={{ 
                          borderRadius: '6px', 
                          border: '1px solid transparent',
                          backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                          color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isDebtTypeOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onBlur={(e) => {
                          if (!isDebtTypeOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <span>{debtTypes.find(dt => dt.value === debt.type)?.label || t.other}</span>
                        <span className="text-xs">{isDebtTypeOpen ? '▲' : '▼'}</span>
                      </button>
                      {isDebtTypeOpen && (
                        <div 
                          className="absolute z-10 w-full mt-1 shadow-lg max-h-48 overflow-y-auto"
                          style={{
                            borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
                          }}
                        >
                          {debtTypes.map((dt) => (
                            <button
                              key={dt.value}
                              type="button"
                              onClick={() => {
                                const updated = [...debts];
                                updated[index].type = dt.value as any;
                                setDebts(updated);
                                setOpenDropdowns({ ...openDropdowns, [debtTypeDropdownKey]: false });
                              }}
                              className="w-full px-4 py-2 text-left flex items-center justify-between transition-colors text-gray-900 dark:text-gray-100"
                              style={{
                                backgroundColor: debt.type === dt.value 
                                  ? (isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)')
                                  : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (debt.type !== dt.value) {
                                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(30, 58, 138, 0.3)' : 'rgba(107, 114, 128, 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (debt.type !== dt.value) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <span>{dt.label}</span>
                              {debt.type === dt.value && (
                                <Check size={16} className="text-gray-900 dark:text-gray-100" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setDebts(debts.filter((_, i) => i !== index))}
                      className="w-full sm:w-auto sm:col-span-1 p-2 sm:p-3 transition-all flex items-center justify-center sm:justify-start"
                      style={{ 
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <Trash2 size={16} className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                );
              })}
              {debts.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t.noDebts}
                </p>
              )}
            </div>
            </div>
          )}

          {/* Investments */}
          {activeTab === "investments" && (
            <div 
              style={{ 
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{t.investments}</h3>
                <button
                  onClick={() =>
                    setInvestments([
                      ...investments,
                      { id: generateId(), name: "", value: 0, type: "stocks" },
                    ])
                  }
                  className="flex items-center gap-2 px-4 py-2 transition-all duration-200 ease-in-out text-sm font-medium"
                  style={{ 
                    borderRadius: '6px',
                    backgroundColor: isDark ? '#0e131a' : 'rgba(107, 114, 128, 0.8)',
                    border: '1px solid transparent',
                    color: isDark ? 'rgb(243, 244, 246)' : 'rgb(255, 255, 255)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                  }}
                >
                  +Add
                </button>
              </div>
              {investments.map((investment, index) => {
                const investmentTypeDropdownKey = `investment-type-${investment.id}`;
                const isInvestmentTypeOpen = openDropdowns[investmentTypeDropdownKey] || false;
                const investmentTypes = [
                  { value: "stocks", label: t.stocks },
                  { value: "bonds", label: t.bonds },
                  { value: "real_estate", label: t.realEstate },
                  { value: "crypto", label: t.crypto },
                  { value: "mutual_funds", label: t.mutualFunds },
                  { value: "other", label: t.other },
                ];
                return (
                  <div key={investment.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/50" style={{ borderRadius: '12px' }}>
                    <input
                      type="text"
                      placeholder={t.investmentName}
                      value={investment.name}
                      onChange={(e) => {
                        const updated = [...investments];
                        updated[index].name = e.target.value;
                        setInvestments(updated);
                      }}
                      className="w-full sm:col-span-4 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <input
                      type="number"
                      placeholder={t.value}
                      value={investment.value || ""}
                      onChange={(e) => {
                        const updated = [...investments];
                        updated[index].value = parseFloat(e.target.value) || 0;
                        setInvestments(updated);
                      }}
                      className="w-full sm:col-span-3 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <div className="w-full sm:col-span-3 relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdowns({ ...openDropdowns, [investmentTypeDropdownKey]: !isInvestmentTypeOpen })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left transition-all flex items-center justify-between text-sm sm:text-base"
                        style={{ 
                          borderRadius: '6px', 
                          border: '1px solid transparent',
                          backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                          color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isInvestmentTypeOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
                        }}
                        onBlur={(e) => {
                          if (!isInvestmentTypeOpen) {
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        <span>{investmentTypes.find(it => it.value === investment.type)?.label || t.other}</span>
                        <span className="text-xs">{isInvestmentTypeOpen ? '▲' : '▼'}</span>
                      </button>
                      {isInvestmentTypeOpen && (
                        <div 
                          className="absolute z-10 w-full mt-1 shadow-lg max-h-48 overflow-y-auto"
                          style={{
                            borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
                          }}
                        >
                          {investmentTypes.map((it) => (
                            <button
                              key={it.value}
                              type="button"
                              onClick={() => {
                                const updated = [...investments];
                                updated[index].type = it.value as any;
                                setInvestments(updated);
                                setOpenDropdowns({ ...openDropdowns, [investmentTypeDropdownKey]: false });
                              }}
                              className="w-full px-4 py-2 text-left flex items-center justify-between transition-colors text-gray-900 dark:text-gray-100"
                              style={{
                                backgroundColor: investment.type === it.value 
                                  ? (isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)')
                                  : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (investment.type !== it.value) {
                                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(30, 58, 138, 0.3)' : 'rgba(107, 114, 128, 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (investment.type !== it.value) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <span>{it.label}</span>
                              {investment.type === it.value && (
                                <Check size={16} className="text-gray-900 dark:text-gray-100" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder={t.monthlyContribution}
                      value={investment.monthlyContribution || ""}
                      onChange={(e) => {
                        const updated = [...investments];
                        updated[index].monthlyContribution = parseFloat(e.target.value) || undefined;
                        setInvestments(updated);
                      }}
                      className="w-full sm:col-span-1 px-3 sm:px-4 py-2 sm:py-3 transition-all text-sm sm:text-base"
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid transparent',
                        outline: 'none',
                        backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                        color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (document.activeElement !== e.currentTarget) {
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                    <button
                      onClick={() =>
                        setInvestments(investments.filter((_, i) => i !== index))
                      }
                      className="w-full sm:w-auto sm:col-span-1 flex h-10 sm:h-8 w-full sm:w-8 items-center justify-center mx-auto rounded-full border border-transparent text-red-600 hover:border-red-500 focus:border-red-500 transition-colors"
                    >
                      <Trash2 size={16} className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                );
              })}
              {investments.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t.noInvestments}
                </p>
              )}
            </div>
            </div>
          )}

          {/* Savings */}
          {activeTab === "savings" && (
            <div 
              style={{ 
                animation: 'fadeIn 0.3s ease-in-out',
              }}
            >
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t.savings}</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50" style={{ borderRadius: '12px' }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.emergencyFundCurrent}
                  </label>
                  <input
                    type="number"
                    value={savings.emergencyFundCurrent || ""}
                    onChange={(e) =>
                      setSavings({ ...savings, emergencyFundCurrent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 transition-all"
                    style={{ 
                      borderRadius: '6px', 
                      border: '1px solid transparent',
                      outline: 'none',
                      backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                      color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.currentTarget) {
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50" style={{ borderRadius: '12px' }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.emergencyFundGoal}
                  </label>
                  <input
                    type="number"
                    value={savings.emergencyFundGoal || ""}
                    onChange={(e) =>
                      setSavings({ ...savings, emergencyFundGoal: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 transition-all"
                    style={{ 
                      borderRadius: '6px', 
                      border: '1px solid transparent',
                      outline: 'none',
                      backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                      color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.currentTarget) {
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50" style={{ borderRadius: '12px' }}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.otherSavings}
                  </label>
                  <input
                    type="number"
                    value={savings.otherSavings || ""}
                    onChange={(e) =>
                      setSavings({ ...savings, otherSavings: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-3 transition-all"
                    style={{ 
                      borderRadius: '6px', 
                      border: '1px solid transparent',
                      outline: 'none',
                      backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
                      color: isDark ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.currentTarget) {
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  />
                </div>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            style={{ 
              borderRadius: '6px',
              backgroundColor: isDark ? '#0e131a' : 'rgba(249, 250, 251, 0.8)',
              border: '1px solid transparent',
              color: isDark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onMouseDown={(e) => {
              if (!isSaving) {
                e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(107, 114, 128, 0.7)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.borderColor = isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)';
            }}
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-white transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            style={{ 
              borderRadius: '4px',
              backgroundColor: '#22c55e',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                e.currentTarget.style.backgroundColor = '#16a34a';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onMouseDown={(e) => {
              if (!isSaving) {
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.7)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
            }}
          >
            {isSaving ? t.saving : t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
