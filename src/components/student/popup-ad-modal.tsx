"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import { useI18n } from "@/i18n/use-i18n";
import { api } from "@/lib/utils-client";

// Auto-shows a popup ad modal when a STUDENT is logged in and there are active,
// undismissed POPUP ads targeting them.
export function PopupAdModal() {
  const { data: session, status } = useSession();
  const { t, lang } = useI18n();
  const [popupAds, setPopupAds] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  // Load active popup ads when a student session becomes available.
  // We only auto-open once per browser session (so closing the tab and reopening
  // would show it again — that's the desired "show on login" behavior).
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if ((session.user as any).role !== "STUDENT") return;
    // Only auto-open once per browser session
    if (sessionStorage.getItem("dalil-popup-seen")) return;
    api("/api/public/ads?type=POPUP")
      .then((r: any) => {
        const ads = r.ads || [];
        if (ads.length > 0) {
          setPopupAds(ads);
          setIdx(0);
          setOpen(true);
          sessionStorage.setItem("dalil-popup-seen", "1");
        }
      })
      .catch(() => {});
  }, [status, session]);

  // Reset index when opening
  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  if (!session || (session.user as any).role !== "STUDENT") return null;
  const current = popupAds[idx];
  if (!current) return null;

  const close = async () => {
    // Record dismissal so it doesn't show again (unless showEveryLogin)
    if (current.id) {
      try {
        await api("/api/public/ads", { method: "POST", body: { adId: current.id } });
      } catch {}
    }
    if (idx < popupAds.length - 1) {
      setIdx(idx + 1);
    } else {
      setOpen(false);
      setPopupAds([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else setOpen(o); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {current.imageUrl ? (
          <a
            href={current.linkUrl || "#"}
            target={current.linkTarget === "_self" ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="block w-full"
          >
            <img src={current.imageUrl} alt={current.title} className="w-full h-auto block" />
          </a>
        ) : null}
        <div className="p-5 space-y-3">
          <DialogTitle className="text-lg font-semibold">{current.title}</DialogTitle>
          {current.content && (
            <DialogDescription className="text-foreground/80 whitespace-pre-line text-sm">
              {current.content}
            </DialogDescription>
          )}
          <div className="flex items-center justify-between pt-2">
            {current.linkUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={current.linkUrl} target={current.linkTarget === "_self" ? "_self" : "_blank"} rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> {t("admin.ads.linkUrl")}
                </a>
              </Button>
            ) : <span />}
            {current.dismissible !== false && (
              <Button onClick={close} size="sm" variant="ghost" className="gap-1">
                <X className="h-4 w-4" /> {t("notif.close")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
