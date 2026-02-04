import { ar, en, type TranslationKey } from "./dictionaries";

export type Language = "en" | "ar";

export function getLocale(language: Language): string {
  return language === "ar" ? "ar-SA" : "en-US";
}

export function getDictionary(language: Language): Record<TranslationKey, string> {
  return language === "ar" ? ar : en;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const val = params[key];
    return val === undefined || val === null ? "" : String(val);
  });
}

