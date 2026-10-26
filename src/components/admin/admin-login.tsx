import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/store/ui-store";
import { useI18n } from "@/i18n/use-i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FooterCredit } from "@/components/shared/footer-credit";
import { Loader2, Shield } from "lucide-react";
import { loginWithCredentials, logout } from "@/lib/auth-client";
import { toast } from "sonner";

export function AdminLogin({ siteName }: { siteName: string }) {
  const { data: session, status } = useSession();
  const { navigate } = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated as admin, jump straight to overview
  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
      navigate("/admin/overview");
    }
  }, [status, session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const actualEmail = email.trim();

    try {
      const res: any = await loginWithCredentials(actualEmail, password);
      if (res?.error || !res?.ok) {
        toast.error(t("admin.login.error") || "Invalid admin credentials");
        setLoading(false);
        return;
      }

      const userRole = res?.user?.role;
      if (userRole && userRole !== "ADMIN") {
        toast.error(t("admin.login.notAdmin") || "Access restricted to administrators");
        await logout();
        setLoading(false);
        return;
      }

      toast.success("Welcome back, Administrator!");
      navigate("/admin/overview");
    } catch {
      toast.error(t("admin.login.error") || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      <header className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">{siteName} · {t("admin.title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 grid place-items-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto h-12 w-12 grid place-items-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t("admin.login.title")}</CardTitle>
            <CardDescription>{siteName}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("admin.login.username")}</Label>
                <Input
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin email"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("admin.login.btn")}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Default admin: <code className="font-mono">adarmouchfikri@gmail.com</code> / <code className="font-mono">fikri@31048410@</code>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer className="border-t py-4">
        <FooterCredit />
      </footer>
    </div>
  );
}
