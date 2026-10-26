import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "ADMIN";
  universityId?: string | null;
  degreeLevelId?: string | null;
  majorId?: string | null;
  academicYearId?: string | null;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

interface AuthContextType {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<void>;
  setSessionUser: (user: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  data: null,
  status: "loading",
  update: async () => {},
  setSessionUser: () => {},
});

const TOKEN_KEY = "elearning_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const checkSession = useCallback(async () => {
    try {
      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/auth/session", {
        headers,
        credentials: "include",
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.user) {
          setData(json);
          setStatus("authenticated");
          return;
        }
      }
      setData(null);
      setStatus("unauthenticated");
    } catch {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  const setSessionUser = useCallback((user: SessionUser | null) => {
    if (user) {
      setData({
        user,
        expires: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      });
      setStatus("authenticated");
    } else {
      setData(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkSession();

    const handleAuthChange = () => {
      checkSession();
    };

    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [checkSession]);

  return (
    <AuthContext.Provider value={{ data, status, update: checkSession, setSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  return useContext(AuthContext);
}

export async function signIn(
  provider: string,
  options?: { email?: string; password?: string; redirect?: boolean; [key: string]: any }
) {
  try {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options || {}),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      return {
        error: data.error || data.message || "Invalid credentials",
        status: res.status || 401,
        ok: false,
        user: null,
      };
    }

    // Persist token in localStorage for cross-origin / iframe reliability
    if (data.token) {
      setStoredToken(data.token);
    }

    // Notify all context listeners immediately
    window.dispatchEvent(new Event("auth-changed"));

    return {
      error: null,
      status: 200,
      ok: true,
      user: data.user,
      token: data.token,
      url: options?.callbackUrl || "/",
    };
  } catch (err: any) {
    return {
      error: err.message || "Network error",
      status: 500,
      ok: false,
      user: null,
    };
  }
}

export async function signOut(options?: { redirect?: boolean }) {
  setStoredToken(null);
  try {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    });
  } catch {}

  window.dispatchEvent(new Event("auth-changed"));
}
