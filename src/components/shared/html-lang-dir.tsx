"use client";
import { useEffect } from "react";
import { useI18n } from "@/i18n/use-i18n";

// Applies <html lang=... dir=...> dynamically based on the chosen language.
export function HtmlLangDir() {
  const { lang, dir } = useI18n();
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dir;
  }, [lang, dir]);
  return null;
}
