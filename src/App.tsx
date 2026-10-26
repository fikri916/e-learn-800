import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/store/ui-store";
import { useI18n } from "@/i18n/use-i18n";
import { api, ClientOnly } from "@/lib/utils-client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { HtmlLangDir } from "@/components/shared/html-lang-dir";
import { FooterCredit } from "@/components/shared/footer-credit";
import { EnhancedSearch } from "@/components/shared/enhanced-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  LayoutDashboard,
  User,
  LogOut,
  Bell,
  Search,
  Menu,
  GraduationCap,
  Shield,
  X,
} from "lucide-react";
import { StudentViews } from "@/components/student/student-views";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationModal } from "@/components/student/notification-modal";
import { PopupAdModal } from "@/components/student/popup-ad-modal";
import { Providers } from "@/providers";

export default function App() {
  return (
    <Providers>
      <ClientOnly>
        <AppInner />
      </ClientOnly>
    </Providers>
  );
}

function AppInner() {
  const { data: session, status } = useSession();
  const { path } = useRouter();
  const { t } = useI18n();
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    api("/api/public/website")
      .then((r: any) => setWebsiteSettings(r.settings))
      .catch(() => {});
  }, []);

  // Fetch current user (cached) — refresh when session changes
  useEffect(() => {
    if (status === "authenticated") {
      api("/api/public/me")
        .then((r: any) => setUser(r.user))
        .catch(() => {});
    } else {
      setUser(null);
    }
  }, [status]);

  const isAdminRoute = path.startsWith("/admin");
  const siteName = websiteSettings?.name || "e-learning";
  const siteDescription = websiteSettings?.description || "";

  return (
    <>
      <HtmlLangDir />
      {isAdminRoute ? (
        // Admin layout
        status === "loading" ? (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : status === "authenticated" && (session?.user as any)?.role === "ADMIN" ? (
          <AdminShell siteName={siteName} />
        ) : (
          <AdminLogin siteName={siteName} />
        )
      ) : (
        <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
          <Header
            siteName={siteName}
            session={session}
            status={status}
            user={user}
            onOpenNotif={() => setNotifOpen(true)}
          />
          <main className="flex-1 pb-20 md:pb-24">
            <StudentViews
              user={user}
              status={status}
              siteName={siteName}
              siteDescription={siteDescription}
            />
          </main>
          <Footer siteName={siteName} />
          <NotificationModal open={notifOpen} onOpenChange={setNotifOpen} />
          <PopupAdModal />
        </div>
      )}
    </>
  );
}

function Header({
  siteName,
  session,
  status,
  user,
  onOpenNotif,
}: {
  siteName: string;
  session: any;
  status: string;
  user: any;
  onOpenNotif: () => void;
}) {
  const { navigate } = useRouter();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 shrink-0"
          aria-label={siteName}
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight hidden sm:inline">
            {siteName}
          </span>
        </button>

        <div className="hidden md:flex flex-1 min-w-0 max-w-xl mx-2">
          <EnhancedSearch variant="header" />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 ms-auto md:ms-0 shrink-0">
          {status === "authenticated" && (session?.user as any)?.role === "ADMIN" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/overview")}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden xl:inline">{t("nav.admin")}</span>
            </Button>
          )}

          {status === "authenticated" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenNotif}
              aria-label={t("nav.notifications")}
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}

          <LanguageSwitcher />
          <ThemeToggle />

          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:bg-accent py-1 ps-1 pe-2 sm:pe-3 max-w-[220px] sm:max-w-none">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="hidden lg:inline text-sm font-medium truncate max-w-[160px] sm:max-w-[200px]"
                    dir="ltr"
                    style={{ textAlign: "start" }}
                  >
                    {user?.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p
                    className="font-medium truncate"
                    dir="ltr"
                    style={{ textAlign: "start" }}
                  >
                    {user?.name}
                  </p>
                  <p
                    className="text-xs text-muted-foreground truncate"
                    dir="ltr"
                    style={{ textAlign: "start" }}
                  >
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="me-2 h-4 w-4" />{" "}
                  {t("nav.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="me-2 h-4 w-4" /> {t("nav.profile")}
                </DropdownMenuItem>
                {(session?.user as any)?.role === "ADMIN" && (
                  <DropdownMenuItem onClick={() => navigate("/admin/overview")}>
                    <Shield className="me-2 h-4 w-4" /> {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    const { logout } = await import("@/lib/auth-client");
                    await logout();
                    window.location.hash = "/";
                    window.location.reload();
                  }}
                >
                  <LogOut className="me-2 h-4 w-4" /> {t("nav.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/signin")}
                className="hidden sm:inline-flex"
              >
                {t("nav.signin")}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/signup")}
                className="gap-2"
              >
                {t("nav.signup")}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto p-4 space-y-3">
            <EnhancedSearch variant="header" onSelectResult={() => setMobileOpen(false)} />
            {status !== "authenticated" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigate("/signin");
                    setMobileOpen(false);
                  }}
                >
                  {t("nav.signin")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    navigate("/signup");
                    setMobileOpen(false);
                  }}
                >
                  {t("nav.signup")}
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                navigate("/");
                setMobileOpen(false);
              }}
            >
              <Home className="me-2 h-4 w-4" /> {t("nav.home")}
            </Button>
            {status === "authenticated" && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/dashboard");
                    setMobileOpen(false);
                  }}
                >
                  <LayoutDashboard className="me-2 h-4 w-4" />{" "}
                  {t("nav.dashboard")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/profile");
                    setMobileOpen(false);
                  }}
                >
                  <User className="me-2 h-4 w-4" /> {t("nav.profile")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer({ siteName }: { siteName: string }) {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-sm font-semibold mb-2">{siteName}</div>
            <p className="text-xs text-muted-foreground">
              {t("site.tagline")}
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">
              {t("footer.about")}
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                <button
                  className="hover:text-foreground"
                  onClick={() => (window.location.hash = "/")}
                >
                  {t("nav.home")}
                </button>
              </li>
              <li>
                <button
                  className="hover:text-foreground"
                  onClick={() => (window.location.hash = "/universities")}
                >
                  {t("nav.universities")}
                </button>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">
              {t("footer.contact")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("footer.rights")} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <FooterCredit />
        </div>
      </div>
    </footer>
  );
}
