/**
 * Finora Design System Constants
 * Based on Base44 Design System
 */

// Card styles - 16px border radius, subtle shadows
export const cardStyles = {
  base: "bg-white dark:bg-[#1e293b] rounded-xl shadow",
  hover: "hover:shadow-md transition-shadow",
};

// Button variants
export const buttonVariants = {
  primary: "px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  secondary: "px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  gradient: "px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  outline: "px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors",
};

// Button sizes
export const buttonSizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

// Font sizes (standardized)
export const fontSizes = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};
