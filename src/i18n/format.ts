import type { Language } from "./index";
import { getLocale } from "./index";

export function formatNumber(
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(
  value: number,
  language: Language,
  options?: Intl.NumberFormatOptions
): string {
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, { style: "percent", ...options }).format(value);
}

export function formatDate(
  date: string | number | Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocale(language);
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

