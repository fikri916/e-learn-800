"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/utils-client";
import { Skeleton } from "@/components/ui/skeleton";

// Renders active HERO_BANNER ads under the hero on the home page.
// Each ad carries TWO images:
//   - imageMobile: shown on phone screens (sm and below)
//   - imageDesktop: shown on laptop+ screens (md and up)
// If only one image is provided, it is used for both breakpoints.
export function HeroBannerAd() {
  const [ads, setAds] = useState<any[] | null>(null);

  useEffect(() => {
    api("/api/public/ads?type=HERO_BANNER")
      .then((r: any) => setAds(r.ads || []))
      .catch(() => setAds([]));
  }, []);

  if (ads === null) {
    return <Skeleton className="h-32 md:h-48 w-full rounded-xl" />;
  }
  if (ads.length === 0) return null;

  return (
    <section className="container mx-auto px-4 -mt-8 md:-mt-12 relative z-10 space-y-4">
      {ads.map((ad) => {
        const mobile = ad.imageMobile || ad.imageDesktop;
        const desktop = ad.imageDesktop || ad.imageMobile;
        const linkEl = (children: React.ReactNode, cls: string) => {
          if (!ad.linkUrl) return <div className={cls}>{children}</div>;
          return (
            <a
              href={ad.linkUrl}
              target={ad.linkTarget === "_self" ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className={`${cls} group block overflow-hidden rounded-xl border border-border shadow-md hover:shadow-lg transition-shadow`}
              aria-label={ad.title}
            >
              {children}
            </a>
          );
        };
        return (
          <div key={ad.id} className="space-y-1">
            {linkEl(
              <>
                {mobile && (
                  <img
                    src={mobile}
                    alt={ad.title}
                    className="md:hidden block w-full h-auto"
                    loading="lazy"
                  />
                )}
                {desktop && (
                  <img
                    src={desktop}
                    alt={ad.title}
                    className="hidden md:block w-full h-auto"
                    loading="lazy"
                  />
                )}
              </>,
              "w-full"
            )}
          </div>
        );
      })}
    </section>
  );
}
