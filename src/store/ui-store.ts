"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Lang } from "@/i18n/dictionaries";
import { isRTL } from "@/i18n/dictionaries";

// ────────────────────────────────────────────────────────
//  Settings store (language + theme)
// ────────────────────────────────────────────────────────
type SettingsState = {
  lang: Lang;
  setLang: (l: Lang) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: "ar",
      setLang: (lang) => set({ lang }),
    }),
    {
      name: "dalil-settings",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ────────────────────────────────────────────────────────
//  Router store (client-side hash-based router)
//
//  Routes used:
//   /                    -> home (student)
//   /signin              -> student sign-in
//   /signup              -> student register
//   /dashboard           -> student dashboard
//   /profile             -> student profile
//   /notifications       -> notifications center
//   /search?q=...        -> search results
//   /u/<universityId>                  -> university -> degrees
//   /u/<universityId>/d/<degreeId>     -> major list
//   /u/<universityId>/d/<degreeId>/m/<majorId>          -> academic years
//   /u/<universityId>/d/<degreeId>/m/<majorId>/y/<yearId>      -> semesters
//   /u/<universityId>/d/<degreeId>/m/<majorId>/y/<yearId>/s/<semId>   -> subjects
//   /u/<universityId>/d/<degreeId>/m/<majorId>/y/<yearId>/s/<semId>/sub/<subId>   -> lessons
//   /lesson/<lessonId>   -> lesson view
//   /admin/login         -> admin login
//   /admin/overview, /admin/users, /admin/universities, etc.
// ────────────────────────────────────────────────────────
type RouteState = {
  path: string;
  query: Record<string, string>;
  navigate: (path: string, query?: Record<string, string>) => void;
  back: () => void;
  hydrate: () => void;
};

function parseHash(): { path: string; query: Record<string, string> } {
  if (typeof window === "undefined") return { path: "/", query: {} };
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  const query: Record<string, string> = {};
  if (qs) {
    new URLSearchParams(qs).forEach((v, k) => (query[k] = v));
  }
  return { path: path || "/", query };
}

export const useRouter = create<RouteState>((set, get) => ({
  path: "/",
  query: {},
  navigate: (path, query = {}) => {
    const qs = new URLSearchParams(query).toString();
    const hash = qs ? `${path}?${qs}` : path;
    if (typeof window !== "undefined") {
      window.location.hash = hash;
    }
    set({ path, query });
  },
  back: () => {
    if (typeof window !== "undefined") window.history.back();
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const { path, query } = parseHash();
    set({ path, query });
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const { path, query } = parseHash();
    useRouter.getState().navigate(path, query);
  });
}
