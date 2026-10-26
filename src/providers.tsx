import { SessionProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { useEffect } from "react";
import { useRouter } from "@/store/ui-store";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Hydrate the hash router on first load
  const hydrate = useRouter((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="system">
        {children}
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </SessionProvider>
  );
}
