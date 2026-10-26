"use client";
import { useSettings } from "@/store/ui-store";
import { translate, isRTL, type Lang } from "@/i18n/dictionaries";

export function useI18n() {
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const t = (key: string) => translate(lang, key);
  const dir = isRTL(lang) ? "rtl" : "ltr";
  return { lang, setLang, t, dir, isRTL: isRTL(lang) };
}

export function localizeField(obj: any, field: string, lang: Lang): string {
  if (!obj) return "";
  const map: Record<Lang, string> = {
    ar: obj[`${field}Ar`] || obj[field] || obj[`${field}Fr`] || "",
    fr: obj[`${field}Fr`] || obj[field] || obj[`${field}Ar`] || "",
    en: obj[field] || obj[`${field}Fr`] || obj[`${field}Ar`] || "",
  };
  return map[lang] || obj[field] || "";
}
