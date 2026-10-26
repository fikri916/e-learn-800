import { useEffect, useState } from "react";
import React from "react";

export type ApiOptions = Omit<RequestInit, "body"> & { body?: any; skipCache?: boolean };

// Fast in-memory cache for public GET endpoints (0ms roundtrip for seamless, snappy navigation)
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(prefix)) {
      apiCache.delete(key);
    }
  }
}

// Small fetcher that includes JSON body + auth header + cookies + in-memory caching
export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = (opts.method || "GET").toUpperCase();
  const isCacheable = method === "GET" && path.startsWith("/api/public/") && !opts.skipCache;

  if (isCacheable) {
    const cached = apiCache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  // Clear cache if a mutation occurs
  if (method !== "GET") {
    clearApiCache();
  }

  const headers: Record<string, string> = { ...(opts.headers as any) };

  // Attach bearer token if stored in localStorage (vital for iframes & cross-origin embedding)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("elearning_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let body = opts.body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(path, { ...opts, headers, body, credentials: "include" });
  const ct = res.headers.get("content-type") || "";
  let data: any = null;
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText || "Request failed";
    const err = new Error(msg) as any;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  if (isCacheable && data) {
    apiCache.set(path, { data, timestamp: Date.now() });
  }

  return data as T;
}

// In-view lazy mount: only render children once mounted on client (avoids hydration issues with hash router)
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}

// Format file size
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// Format date in current locale
export function formatDate(d: Date | string, locale: string = "en"): string {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return String(d);
  }
}
