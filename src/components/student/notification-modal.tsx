"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useI18n } from "@/i18n/use-i18n";
import { api, formatDate } from "@/lib/utils-client";
import { useRouter } from "@/store/ui-store";

export function NotificationModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: session } = useSession();
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (session && (session.user as any).role === "STUDENT") {
      api("/api/public/notifications").then((r: any) => {
        setNotifs(r.notifications || []);
      }).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (open) setIdx(0);
  }, [open]);

  if (!session || (session.user as any).role !== "STUDENT") return null;
  const current = notifs[idx];

  const dismiss = async () => {
    if (current) {
      try {
        await api("/api/public/dismiss-notif", { method: "POST", body: { notificationId: current.id } });
      } catch {}
    }
    if (idx < notifs.length - 1) {
      setIdx(idx + 1);
    } else {
      onOpenChange(false);
      setNotifs([]);
    }
  };

  return (
    <Dialog open={open && !!current} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {current && (
          <>
            {current.imageUrl && (
              <img src={current.imageUrl} alt={current.title} className="w-full h-auto block max-h-64 object-cover" />
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-amber-500/15 p-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                </div>
                <DialogTitle className="text-lg font-semibold">{current.title}</DialogTitle>
              </div>
              <DialogDescription className="text-foreground/80 whitespace-pre-line text-sm">
                {current.content}
              </DialogDescription>
              <p className="text-xs text-muted-foreground">{formatDate(current.createdAt, lang)}</p>
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => { onOpenChange(false); navigate("/notifications"); }}>
                  {t("notif.viewAll")}
                </Button>
                <Button onClick={dismiss} size="sm">{t("notif.close")}</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
