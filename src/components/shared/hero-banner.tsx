import React from "react";
import { useRouter } from "@/store/ui-store";
import { useI18n } from "@/i18n/use-i18n";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft, ArrowRight } from "lucide-react";
import { EnhancedSearch } from "@/components/shared/enhanced-search";

interface HeroBannerProps {
  siteName: string;
  siteDescription: string;
  status: string;
}

export function HeroBanner({ siteName, siteDescription, status }: HeroBannerProps) {
  const { navigate } = useRouter();
  const { t, lang, isRTL } = useI18n();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const headline =
    lang === "ar"
      ? "بوابة الشاملة لكل المحاضرات والملخصات الجامعية"
      : lang === "fr"
      ? "Portail complet pour tous les cours et résumés universitaires"
      : "Complete gateway to university lectures and summaries";

  return (
    <section className="relative overflow-hidden bg-black text-white border-b border-zinc-800/80 flex items-center justify-center">
      <div className="container relative mx-auto px-4 py-14 sm:py-20 text-center space-y-6 max-w-4xl z-10">
        {/* Subtle tag badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
          <span>{t("site.tagline")}</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
            {siteName}
          </h1>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            {headline}
          </p>
        </div>

        {/* Subtitle */}
        <p
          className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed font-normal"
          dir="auto"
        >
          {siteDescription || t("site.tagline")}
        </p>

        {/* Search Bar Embedded in Hero with Live Results Dropdown */}
        <div className="max-w-xl mx-auto pt-2">
          <EnhancedSearch variant="hero" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3.5 justify-center pt-2">
          <Button
            size="lg"
            onClick={() => navigate("/universities")}
            className="gap-2 bg-white text-black hover:bg-zinc-200 font-semibold shadow-md transition-all"
          >
            <GraduationCap className="h-4 w-4" />
            <span>{t("nav.browse")}</span>
            <Arrow className="h-4 w-4" />
          </Button>
          {status !== "authenticated" ? (
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/signup")}
              className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900 hover:text-white"
            >
              {t("nav.signup")}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900 hover:text-white"
            >
              {t("nav.dashboard")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
