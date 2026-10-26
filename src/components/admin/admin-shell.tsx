"use client";
import { useState } from "react";
import { useRouter } from "@/store/ui-store";
import { useI18n } from "@/i18n/use-i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FooterCredit } from "@/components/shared/footer-credit";
import { HtmlLangDir } from "@/components/shared/html-lang-dir";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, Users, Building2, Folder, GraduationCap, Library, Calendar,
  Layers, FolderTree, BookOpen, Image, Bell, Palette, Settings, ShieldAlert,
  ScrollText, Megaphone, Database, LogOut, Menu, ArrowLeft,
} from "lucide-react";
import { AdminViews } from "@/components/admin/admin-views";
import { useSession } from "next-auth/react";

const NAV_ITEMS = [
  { key: "/admin/overview", icon: LayoutGrid, tkey: "admin.nav.overview" },
  { key: "/admin/users", icon: Users, tkey: "admin.nav.users" },
  { key: "/admin/universities", icon: Building2, tkey: "admin.nav.universities" },
  { key: "/admin/faculties", icon: Folder, tkey: "admin.nav.faculties" },
  { key: "/admin/degrees", icon: GraduationCap, tkey: "admin.nav.degrees" },
  { key: "/admin/majors", icon: Library, tkey: "admin.nav.majors" },
  { key: "/admin/years", icon: Calendar, tkey: "admin.nav.years" },
  { key: "/admin/semesters", icon: Layers, tkey: "admin.nav.semesters" },
  { key: "/admin/professors", icon: Users, tkey: "admin.nav.professors" },
  { key: "/admin/subjects", icon: FolderTree, tkey: "admin.nav.subjects" },
  { key: "/admin/lessons", icon: BookOpen, tkey: "admin.nav.lessons" },
  { key: "/admin/media", icon: Image, tkey: "admin.nav.media" },
  { key: "/admin/notifications", icon: Bell, tkey: "admin.nav.notifications" },
  { key: "/admin/branding", icon: Palette, tkey: "admin.nav.branding" },
  { key: "/admin/settings", icon: Settings, tkey: "admin.nav.settings" },
  { key: "/admin/security", icon: ShieldAlert, tkey: "admin.nav.security" },
  { key: "/admin/audit", icon: ScrollText, tkey: "admin.nav.audit" },
  { key: "/admin/data", icon: Database, tkey: "admin.nav.data" },
  { key: "/admin/ads", icon: Megaphone, tkey: "admin.nav.ads" },
];

export function AdminShell({ siteName }: { siteName: string }) {
  const { path, navigate } = useRouter();
  const { t } = useI18n();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const Nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = path === item.key || path.startsWith(item.key + "/");
        return (
          <button
            key={item.key}
            onClick={() => { navigate(item.key); setMobileOpen(false); }}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t(item.tkey)}</span>
          </button>
        );
      })}
      <div className="my-2 border-t" />
      <button onClick={() => navigate("/")} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent">
        <ArrowLeft className="h-4 w-4 shrink-0" />
        {t("admin.nav.exit")}
      </button>
      <button onClick={async () => {
        const { logout } = await import("@/lib/auth-client");
        await logout();
        window.location.hash = "/";
        window.location.reload();
      }} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent">
        <LogOut className="h-4 w-4 shrink-0" />
        {t("nav.signout")}
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <HtmlLangDir />
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex items-center gap-3 px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-14 items-center gap-2 border-b px-4">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldAlert className="h-4 w-4" /></div>
              <span className="text-sm font-semibold truncate">{siteName}</span>
            </div>
            <ScrollArea className="h-[calc(100vh-3.5rem)]">{Nav}</ScrollArea>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldAlert className="h-4 w-4" /></div>
          <span className="text-sm font-semibold hidden sm:inline">{siteName} · {t("admin.title")}</span>
        </div>
        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          {session && (
            <div className="flex items-center gap-2 ps-2 border-s">
              <Avatar className="h-7 w-7"><AvatarFallback>{(session.user as any).name?.[0]?.toUpperCase() || "A"}</AvatarFallback></Avatar>
              <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-32">{(session.user as any).email}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:block w-64 border-r bg-background/50">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">{Nav}</ScrollArea>
        </aside>

        <main className="flex-1 min-w-0">
          <AdminViews />
        </main>
      </div>

      <footer className="border-t py-3 bg-background">
        <FooterCredit />
      </footer>
    </div>
  );
}
