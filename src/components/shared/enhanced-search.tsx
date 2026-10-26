import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "@/store/ui-store";
import { useI18n } from "@/i18n/use-i18n";
import { api } from "@/lib/utils-client";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  Building2,
  School,
  GraduationCap,
  Library,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  FileText,
  User,
  X,
} from "lucide-react";

interface EnhancedSearchProps {
  variant?: "header" | "hero";
  placeholder?: string;
  className?: string;
  onSelectResult?: () => void;
  autoFocus?: boolean;
}

interface SearchResults {
  universities?: any[];
  faculties?: any[];
  majors?: any[];
  subjects?: any[];
  lessons?: any[];
}

export function EnhancedSearch({
  variant = "header",
  placeholder,
  className = "",
  onSelectResult,
  autoFocus = false,
}: EnhancedSearchProps) {
  const { navigate } = useRouter();
  const { t, lang, isRTL } = useI18n();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  // Localize helper
  const loc = (item: any, field: string = "name") => {
    if (!item) return "";
    if (lang === "ar" && item[`${field}Ar`]) return item[`${field}Ar`];
    if (lang === "fr" && item[`${field}Fr`]) return item[`${field}Fr`];
    return item[field] || item[`${field}Ar`] || item[`${field}Fr`] || "";
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced live search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      api(`/api/public/search?q=${encodeURIComponent(trimmed)}`)
        .then((data: SearchResults) => {
          setResults(data || {});
          setIsOpen(true);
          setHighlightedIndex(-1);
        })
        .catch(() => {
          setResults({ universities: [], faculties: [], majors: [], subjects: [], lessons: [] });
        })
        .finally(() => {
          setLoading(false);
        });
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Flattened items for keyboard navigation
  const flatItems: Array<{
    type: "university" | "faculty" | "major" | "subject" | "lesson" | "view-all";
    id: string;
    title: string;
    subtitle?: string;
    badge?: string;
    action: () => void;
  }> = [];

  if (results) {
    (results.universities || []).slice(0, 3).forEach((u) => {
      flatItems.push({
        type: "university",
        id: `univ-${u.id}`,
        title: loc(u, "name"),
        subtitle: u.city || "",
        badge: t("nav.step.university") || "جامعة",
        action: () => {
          navigate(`/u/${u.id}`);
          close();
        },
      });
    });

    (results.faculties || []).slice(0, 3).forEach((f) => {
      flatItems.push({
        type: "faculty",
        id: `fac-${f.id}`,
        title: loc(f, "name"),
        subtitle: loc(f.university, "name"),
        badge: t("nav.step.faculty") || "كلية",
        action: () => {
          navigate(`/u/${f.universityId}/f/${f.id}`);
          close();
        },
      });
    });

    (results.majors || []).slice(0, 3).forEach((m) => {
      flatItems.push({
        type: "major",
        id: `maj-${m.id}`,
        title: loc(m, "name"),
        subtitle: [loc(m.faculty, "name"), loc(m.university, "name")].filter(Boolean).join(" • "),
        badge: loc(m.degreeLevel, "name") || t("nav.step.major") || "تخصص",
        action: () => {
          const facPart = m.facultyId ? `/f/${m.facultyId}` : "";
          const degPart = m.degreeLevelId ? `/d/${m.degreeLevelId}` : "";
          navigate(`/u/${m.universityId}${facPart}${degPart}/m/${m.id}`);
          close();
        },
      });
    });

    (results.subjects || []).slice(0, 3).forEach((s) => {
      flatItems.push({
        type: "subject",
        id: `subj-${s.id}`,
        title: loc(s, "name"),
        subtitle: s._count?.lessons ? `${s._count.lessons} ${t("admin.stat.publishedLessons") || "درس"}` : "",
        badge: loc(s.semester, "name") || t("nav.step.subject") || "مادة",
        action: () => {
          navigate("/search", { q: loc(s, "name") });
          close();
        },
      });
    });

    (results.lessons || []).slice(0, 4).forEach((l) => {
      flatItems.push({
        type: "lesson",
        id: `les-${l.id}`,
        title: loc(l, "title"),
        subtitle: [loc(l.subject, "name"), loc(l.professor, "name")].filter(Boolean).join(" • "),
        badge: t("admin.stat.publishedLessons") || "درس",
        action: () => {
          navigate(`/lesson/${l.id}`);
          close();
        },
      });
    });
  }

  const close = () => {
    setIsOpen(false);
    onSelectResult?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && flatItems[highlightedIndex]) {
      flatItems[highlightedIndex].action();
      return;
    }
    const trimmed = query.trim();
    if (trimmed) {
      navigate("/search", { q: trimmed });
      close();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatItems.length === 0) {
      if (e.key === "Escape") setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const hasAnyResults = flatItems.length > 0;
  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`relative flex items-center transition-all ${
            isHero
              ? "rounded-xl p-1.5 bg-zinc-900/95 border border-zinc-700/80 shadow-xl focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-600/40"
              : "rounded-lg border border-border/80 bg-background/70 shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60"
          }`}
        >
          {loading ? (
            <Loader2
              className={`pointer-events-none ms-3 h-4 w-4 animate-spin ${
                isHero ? "text-zinc-400" : "text-muted-foreground"
              }`}
            />
          ) : (
            <Search
              className={`pointer-events-none ms-3 h-4 w-4 ${
                isHero ? "text-zinc-400" : "text-muted-foreground"
              }`}
            />
          )}

          <input
            ref={inputRef}
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t("search.placeholder") || "ابحث عن جامعة، تخصص، مادة، درس..."}
            className={`w-full bg-transparent px-3 py-2 text-sm outline-none transition-colors ${
              isHero
                ? "text-white placeholder:text-zinc-500"
                : "text-foreground placeholder:text-muted-foreground"
            }`}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(null);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 me-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="مسح البحث"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {isHero && (
            <Button
              type="submit"
              size="sm"
              className="shrink-0 gap-1 rounded-lg bg-white text-black hover:bg-zinc-200 font-semibold shadow-sm"
            >
              <span>{t("nav.search") || "Search"}</span>
              <Arrow className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </form>

      {/* Live Search Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div
          className={`absolute start-0 end-0 top-full mt-2 z-50 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 ${
            isHero
              ? "bg-zinc-950/98 border-zinc-800 text-white"
              : "bg-popover/98 border-border text-popover-foreground"
          }`}
          style={{ maxHeight: "420px" }}
        >
          {loading && !results ? (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{t("common.loading") || "جاري البحث..."}</span>
            </div>
          ) : !hasAnyResults ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                {lang === "ar" ? "لا توجد نتائج مطابقة" : "No results found"}
              </p>
              <p className="text-xs">
                {lang === "ar"
                  ? `لم نتمكن من العثور على أي نتائج لـ "${query}"`
                  : `We couldn't find anything matching "${query}"`}
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto divide-y divide-border/40" style={{ maxHeight: "380px" }}>
              {/* Category: Universities */}
              {results?.universities && results.universities.length > 0 && (
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 className="h-3 w-3 text-blue-500" />
                    <span>{t("nav.universities") || "الجامعات"}</span>
                  </div>
                  {results.universities.map((u) => {
                    const idx = flatItems.findIndex((it) => it.id === `univ-${u.id}`);
                    const isSelected = highlightedIndex === idx;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          navigate(`/u/${u.id}`);
                          close();
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-start flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? isHero
                              ? "bg-zinc-800 text-white"
                              : "bg-accent text-accent-foreground"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium truncate">{loc(u, "name")}</span>
                        </div>
                        {u.city && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {u.city}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Category: Faculties */}
              {results?.faculties && results.faculties.length > 0 && (
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <School className="h-3 w-3 text-emerald-500" />
                    <span>{t("nav.step.faculty") || "الكليات"}</span>
                  </div>
                  {results.faculties.map((f) => {
                    const idx = flatItems.findIndex((it) => it.id === `fac-${f.id}`);
                    const isSelected = highlightedIndex === idx;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          navigate(`/u/${f.universityId}/f/${f.id}`);
                          close();
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-start flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? isHero
                              ? "bg-zinc-800 text-white"
                              : "bg-accent text-accent-foreground"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <School className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{loc(f, "name")}</div>
                            {f.university && (
                              <div className="text-[11px] text-muted-foreground truncate">
                                {loc(f.university, "name")}
                              </div>
                            )}
                          </div>
                        </div>
                        <Arrow className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Category: Majors */}
              {results?.majors && results.majors.length > 0 && (
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <GraduationCap className="h-3 w-3 text-purple-500" />
                    <span>{t("nav.step.major") || "التخصصات"}</span>
                  </div>
                  {results.majors.map((m) => {
                    const idx = flatItems.findIndex((it) => it.id === `maj-${m.id}`);
                    const isSelected = highlightedIndex === idx;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const facPart = m.facultyId ? `/f/${m.facultyId}` : "";
                          const degPart = m.degreeLevelId ? `/d/${m.degreeLevelId}` : "";
                          navigate(`/u/${m.universityId}${facPart}${degPart}/m/${m.id}`);
                          close();
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-start flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? isHero
                              ? "bg-zinc-800 text-white"
                              : "bg-accent text-accent-foreground"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                            <GraduationCap className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{loc(m, "name")}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {[loc(m.faculty, "name"), loc(m.university, "name")].filter(Boolean).join(" • ")}
                            </div>
                          </div>
                        </div>
                        {m.degreeLevel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 shrink-0 font-medium">
                            {loc(m.degreeLevel, "name")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Category: Subjects */}
              {results?.subjects && results.subjects.length > 0 && (
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Library className="h-3 w-3 text-amber-500" />
                    <span>{t("nav.step.subject") || "المواد"}</span>
                  </div>
                  {results.subjects.map((s) => {
                    const idx = flatItems.findIndex((it) => it.id === `subj-${s.id}`);
                    const isSelected = highlightedIndex === idx;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          navigate("/search", { q: loc(s, "name") });
                          close();
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-start flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? isHero
                              ? "bg-zinc-800 text-white"
                              : "bg-accent text-accent-foreground"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{loc(s, "name")}</div>
                            {s.semester && (
                              <div className="text-[11px] text-muted-foreground truncate">
                                {loc(s.semester, "name")}
                              </div>
                            )}
                          </div>
                        </div>
                        {s._count?.lessons ? (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {s._count.lessons} {t("admin.stat.publishedLessons") || "درس"}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Category: Lessons */}
              {results?.lessons && results.lessons.length > 0 && (
                <div className="p-2">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <FileText className="h-3 w-3 text-primary" />
                    <span>{t("admin.stat.publishedLessons") || "الدروس والمحاضرات"}</span>
                  </div>
                  {results.lessons.map((l) => {
                    const idx = flatItems.findIndex((it) => it.id === `les-${l.id}`);
                    const isSelected = highlightedIndex === idx;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          navigate(`/lesson/${l.id}`);
                          close();
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-start flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? isHero
                              ? "bg-zinc-800 text-white"
                              : "bg-accent text-accent-foreground"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary shrink-0">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{loc(l, "title")}</div>
                            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-2">
                              {l.subject && <span>{loc(l.subject, "name")}</span>}
                              {l.professor && (
                                <span className="flex items-center gap-1">
                                  <User className="h-2.5 w-2.5" />
                                  {loc(l.professor, "name")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Arrow className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* View all results footer */}
              <div className="p-2 bg-muted/30">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/search", { q: query.trim() });
                    close();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isHero
                      ? "hover:bg-zinc-800 text-zinc-300 hover:text-white"
                      : "hover:bg-muted text-primary"
                  }`}
                >
                  <span>
                    {lang === "ar"
                      ? `عرض جميع النتائج لـ "${query}"`
                      : `View all results for "${query}"`}
                  </span>
                  <Arrow className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
