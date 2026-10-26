"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/store/ui-store";
import { useI18n, localizeField } from "@/i18n/use-i18n";
import { api, ClientOnly, formatDate } from "@/lib/utils-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { loginWithCredentials } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Search, Loader2, BookOpen, FileText, Video, Image as ImageIcon, Link as LinkIcon,
  FileQuestion, ChevronLeft, ChevronRight, Heart, HeartOff, ExternalLink,
  GraduationCap, Building2, Layers, Calendar, FolderTree, Library, ArrowRight, ArrowLeft, Bookmark, Eye,
  User, Bell, Folder,
} from "lucide-react";
import { LessonContent } from "@/components/student/lesson-content";
import { HeroBannerAd } from "@/components/student/hero-banner-ad";
import { HeroBanner } from "@/components/shared/hero-banner";

type Props = {
  user: any;
  status: string;
  siteName: string;
  siteDescription: string;
};

export function StudentViews({ user, status, siteName, siteDescription }: Props) {
  const { path, query } = useRouter();
  const { t, lang, isRTL } = useI18n();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [loading, setLoading] = useState(false);

  // Home
  if (path === "/" || path === "") {
    return <HomeView siteName={siteName} siteDescription={siteDescription} status={status} />;
  }
  // Sign in / Sign up
  if (path === "/signin") return <SignInView />;
  if (path === "/signup") return <SignUpView />;
  if (path === "/universities") return <UniversitiesView />;
  // Academic navigation
  // Pattern: /u/<id>/f/<facId>/d/<id>/m/<id>/y/<id>/s/<id>/sub/<id>/p/<id>
  // (Faculty step comes BETWEEN University and Degree Level — student picks
  //  university → faculty → degree level → major → year → semester → subject → professor → lessons)
  const m = path.match(/^\/u\/([^/]+)(?:\/f\/([^/]+)(?:\/d\/([^/]+)(?:\/m\/([^/]+)(?:\/y\/([^/]+)(?:\/s\/([^/]+)(?:\/sub\/([^/]+)(?:\/p\/([^/]+)?)?)?)?)?)?)?)?$/);
  if (m) {
    const [, universityId, facultyId, degreeId, majorId, yearId, semId, subId, profId] = m;
    if (profId) return <LessonsView universityId={universityId!} facultyId={facultyId!} degreeId={degreeId!} majorId={majorId!} yearId={yearId!} semesterId={semId!} subjectId={subId!} professorId={profId} />;
    if (subId) return <ProfessorsView universityId={universityId!} facultyId={facultyId!} degreeId={degreeId!} majorId={majorId!} yearId={yearId!} semesterId={semId!} subjectId={subId} />;
    if (semId) return <SubjectsView universityId={universityId!} facultyId={facultyId!} degreeId={degreeId!} majorId={majorId!} yearId={yearId!} semesterId={semId} />;
    if (yearId) return <SemestersView universityId={universityId!} facultyId={facultyId!} degreeId={degreeId!} majorId={majorId!} yearId={yearId} />;
    if (majorId) return <YearsView universityId={universityId!} facultyId={facultyId!} degreeId={degreeId!} majorId={majorId} />;
    if (degreeId) return <MajorsView universityId={universityId!} facultyId={facultyId!} degreeId={degreeId} />;
    if (facultyId) return <DegreesView universityId={universityId!} facultyId={facultyId} />;
    if (universityId) return <FacultiesView universityId={universityId} />;
  }
  if (path.startsWith("/lesson/")) return <LessonView lessonId={path.split("/lesson/")[1]} />;
  if (path === "/dashboard") {
    if (status === "loading") {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return status === "authenticated" ? <DashboardView user={user} /> : <SignInView />;
  }
  if (path === "/profile") {
    if (status === "loading") {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return status === "authenticated" ? <ProfileView user={user} /> : <SignInView />;
  }
  if (path === "/notifications") return <NotificationsCenterView />;
  if (path === "/search") return <SearchView q={query.q || ""} />;
  return <NotFoundView />;
}

// ────────────────────────────────────────────
// HOME
// ────────────────────────────────────────────
function HomeView({ siteName, siteDescription, status }: { siteName: string; siteDescription: string; status: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [univs, setUnivs] = useState<any[]>([]);
  const [stats, setStats] = useState({ universitiesCount: 1, subjectsCount: 3, lessonsCount: 4 });

  useEffect(() => {
    api("/api/public/universities").then((r: any) => setUnivs(r.universities || [])).catch(() => {});
    api("/api/public/stats").then((r: any) => {
      if (r) setStats(r);
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* Holographic Fluid Mesh Hero Banner */}
      <HeroBanner siteName={siteName} siteDescription={siteDescription} status={status} />

      {/* Space & content under hero banner */}
      <div className="space-y-12 md:space-y-16 pt-8 md:pt-12">
        {/* Hero banner ad */}
        <HeroBannerAd />

        {/* Quick stats */}
        <section className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Building2, label: t("nav.universities"), value: stats.universitiesCount || univs.length, color: "text-blue-600 dark:text-blue-400" },
              { icon: Library, label: t("admin.nav.subjects"), value: stats.subjectsCount, color: "text-emerald-600 dark:text-emerald-400" },
              { icon: BookOpen, label: t("admin.stat.publishedLessons"), value: stats.lessonsCount, color: "text-amber-600 dark:text-amber-400" },
            ].map((s, i) => (
              <Card key={i} className="p-6 flex items-center gap-4 border border-border/80 shadow-sm hover:shadow-md transition-shadow">
                <div className={`rounded-xl bg-muted/80 p-3.5 ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold tracking-tight mt-0.5">{s.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Universities */}
        <section className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t("nav.step.university")}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/universities")}>
              {t("common.next")}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {univs.slice(0, 6).map((u) => (
              <UniversityCard key={u.id} university={u} onClick={() => navigate(`/u/${u.id}`)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function UniversityCard({ university, onClick }: { university: any; onClick: () => void }) {
  const { lang, t } = useI18n();
  const name = localizeField(university, "name", lang);
  const desc = localizeField(university, "description", lang);
  return (
    <Card className="group cursor-pointer overflow-hidden hover:shadow-md transition-all" >
      <button onClick={onClick} className="w-full text-start">
        <div className="aspect-video relative overflow-hidden bg-muted">
          {university.coverImage ? (
            <img src={university.coverImage} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/10 to-accent">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {university.logo && (
            <img src={university.logo} alt="" className="absolute bottom-3 end-3 h-10 w-10 rounded-full border-2 border-background object-cover bg-background" />
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1">{name}</h3>
          {desc && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{desc}</p>}
          {university.city && <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{university.city}</p>}
          {university.degrees?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {university.degrees.slice(0, 4).map((d: any) => (
                <span key={d.id} className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs">
                  {localizeField(d, "name", lang)}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </button>
    </Card>
  );
}

// ────────────────────────────────────────────
// Universities Directory
// ────────────────────────────────────────────
function UniversitiesView() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [univs, setUnivs] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api("/api/public/universities")
      .then((r: any) => setUnivs(r.universities || []))
      .finally(() => setLoading(false));
  }, []);
  const filtered = univs.filter((u) => {
    if (!q) return true;
    const name = localizeField(u, "name", lang);
    return name.toLowerCase().includes(q.toLowerCase());
  });
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[{ label: t("nav.home"), href: "/" }, { label: t("nav.universities") }]} />
      <div>
        <h1 className="text-3xl font-bold">{t("nav.step.university")}</h1>
        <p className="text-muted-foreground mt-1">{t("site.tagline")}</p>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
      </div>
      {loading ? (
        <LoadingGrid />
      ) : filtered.length === 0 ? (
        <EmptyState message={t("nav.empty.universities")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <UniversityCard key={u.id} university={u} onClick={() => navigate(`/u/${u.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// FACULTIES — appears between Universities and Degrees
// ────────────────────────────────────────────
function FacultiesView({ universityId }: { universityId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [university, setUniversity] = useState<any>(null);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api("/api/public/universities"),
      api(`/api/public/faculties?universityId=${universityId}`),
    ]).then(([u, f]: any) => {
      setUniversity((u.universities || []).find((x: any) => x.id === universityId));
      setFaculties(f.faculties || []);
    }).finally(() => setLoading(false));
  }, [universityId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: university ? localizeField(university, "name", lang) : "..." },
      ]} />
      <div>
        <h1 className="text-3xl font-bold">{t("nav.step.faculty")}</h1>
        <p className="text-muted-foreground mt-1">{university ? localizeField(university, "name", lang) : ""}</p>
      </div>
      {loading ? <LoadingGrid /> : faculties.length === 0 ? <EmptyState message={t("nav.empty.faculties")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {faculties.map((f) => (
            <Card key={f.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/u/${universityId}/f/${f.id}`)}>
              <CardContent className="p-6">
                <div className="rounded-lg bg-amber-500/10 p-3 inline-block mb-3">
                  <Folder className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-semibold text-lg">{localizeField(f, "name", lang)}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{f._count?.majors ?? 0} {t("nav.step.major")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DegreesView({ universityId, facultyId }: { universityId: string; facultyId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [degrees, setDegrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api(`/api/public/degrees?universityId=${universityId}&facultyId=${facultyId}`)
      .then((r: any) => setDegrees(r.degrees || []))
      .finally(() => setLoading(false));
  }, [universityId, facultyId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: t("nav.step.faculty"), href: `/u/${universityId}` },
        { label: t("nav.step.degree") },
      ]} />
      <h1 className="text-3xl font-bold">{t("nav.step.degree")}</h1>
      {loading ? <LoadingGrid /> : degrees.length === 0 ? <EmptyState message={t("nav.empty.degrees")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {degrees.map((d) => (
            <Card key={d.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/u/${universityId}/f/${facultyId}/d/${d.id}`)}>
              <CardContent className="p-6">
                <div className="rounded-lg bg-primary/10 p-3 inline-block mb-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{localizeField(d, "name", lang)}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MajorsView({ universityId, facultyId, degreeId }: { universityId: string; facultyId: string; degreeId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [majors, setMajors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api(`/api/public/majors?universityId=${universityId}&degreeLevelId=${degreeId}&facultyId=${facultyId}`)
      .then((r: any) => setMajors(r.majors || []))
      .finally(() => setLoading(false));
  }, [universityId, degreeId, facultyId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: t("nav.step.faculty"), href: `/u/${universityId}` },
        { label: t("nav.step.degree"), href: `/u/${universityId}/f/${facultyId}` },
        { label: t("nav.step.major") },
      ]} />
      <h1 className="text-3xl font-bold">{t("nav.step.major")}</h1>
      {loading ? <LoadingGrid /> : majors.length === 0 ? <EmptyState message={t("nav.empty.majors")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {majors.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${m.id}`)}>
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 inline-block mb-3">
                  <Library className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-lg">{localizeField(m, "name", lang)}</h3>
                {m.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{localizeField(m, "description", lang)}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function YearsView({ universityId, facultyId, degreeId, majorId }: { universityId: string; facultyId: string; degreeId: string; majorId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api(`/api/public/years?majorId=${majorId}&degreeLevelId=${degreeId}`)
      .then((r: any) => setYears(r.years || []))
      .finally(() => setLoading(false));
  }, [majorId, degreeId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: t("nav.step.faculty"), href: `/u/${universityId}` },
        { label: t("nav.step.degree"), href: `/u/${universityId}/f/${facultyId}` },
        { label: t("nav.step.major"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}` },
        { label: t("nav.step.year") },
      ]} />
      <h1 className="text-3xl font-bold">{t("nav.step.year")}</h1>
      {loading ? <LoadingGrid /> : years.length === 0 ? <EmptyState message={t("nav.empty.years")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((y) => (
            <Card key={y.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${y.id}`)}>
              <CardContent className="p-6">
                <div className="rounded-lg bg-amber-500/10 p-3 inline-block mb-3">
                  <Calendar className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="font-semibold text-lg">{localizeField(y, "name", lang)}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SemestersView({ universityId, facultyId, degreeId, majorId, yearId }: { universityId: string; facultyId: string; degreeId: string; majorId: string; yearId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api(`/api/public/semesters?academicYearId=${yearId}`)
      .then((r: any) => setSemesters(r.semesters || []))
      .finally(() => setLoading(false));
  }, [yearId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: t("nav.step.faculty"), href: `/u/${universityId}` },
        { label: t("nav.step.degree"), href: `/u/${universityId}/f/${facultyId}` },
        { label: t("nav.step.major"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}` },
        { label: t("nav.step.year"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}` },
        { label: t("nav.step.semester") },
      ]} />
      <h1 className="text-3xl font-bold">{t("nav.step.semester")}</h1>
      {loading ? <LoadingGrid /> : semesters.length === 0 ? <EmptyState message={t("nav.empty.semesters")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}/s/${s.id}`)}>
              <CardContent className="p-6">
                <div className="rounded-lg bg-purple-500/10 p-3 inline-block mb-3">
                  <Layers className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-lg">{localizeField(s, "name", lang)}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectsView({ universityId, facultyId, degreeId, majorId, yearId, semesterId }: { universityId: string; facultyId: string; degreeId: string; majorId: string; yearId: string; semesterId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api(`/api/public/subjects?semesterId=${semesterId}`)
      .then((r: any) => setSubjects(r.subjects || []))
      .finally(() => setLoading(false));
  }, [semesterId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: t("nav.step.faculty"), href: `/u/${universityId}` },
        { label: t("nav.step.degree"), href: `/u/${universityId}/f/${facultyId}` },
        { label: t("nav.step.major"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}` },
        { label: t("nav.step.year"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}` },
        { label: t("nav.step.semester"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}` },
        { label: t("nav.step.subject") },
      ]} />
      <h1 className="text-3xl font-bold">{t("nav.step.subject")}</h1>
      {loading ? <LoadingGrid /> : subjects.length === 0 ? <EmptyState message={t("nav.empty.subjects")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}/s/${semesterId}/sub/${s.id}`)}>
              <CardContent className="p-6">
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted mb-3">
                  {s.coverImage ? (
                    <img src={s.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center bg-gradient-to-br from-emerald-500/10 to-emerald-500/20">
                      <FolderTree className="h-8 w-8 text-emerald-500" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{localizeField(s, "name", lang)}</h3>
                {s.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{localizeField(s, "description", lang)}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{s._count?.lessons ?? 0} {t("nav.step.lessons")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// PROFESSORS — appears between Subjects and Lessons
// ────────────────────────────────────────────
function ProfessorsView({ universityId, facultyId, degreeId, majorId, yearId, semesterId, subjectId }: { universityId: string; facultyId: string; degreeId: string; majorId: string; yearId: string; semesterId: string; subjectId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [professors, setProfessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api(`/api/public/professors?semesterId=${semesterId}&subjectId=${subjectId}`)
      .then((r: any) => setProfessors(r.professors || []))
      .finally(() => setLoading(false));
  }, [semesterId, subjectId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: t("nav.step.faculty"), href: `/u/${universityId}` },
        { label: t("nav.step.degree"), href: `/u/${universityId}/f/${facultyId}` },
        { label: t("nav.step.major"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}` },
        { label: t("nav.step.year"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}` },
        { label: t("nav.step.semester"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}` },
        { label: t("nav.step.subject"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}/s/${semesterId}` },
        { label: t("nav.step.professor") },
      ]} />
      <h1 className="text-3xl font-bold">{t("nav.step.professor")}</h1>
      {loading ? <LoadingGrid /> : professors.length === 0 ? <EmptyState message={t("nav.empty.professors")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professors.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}/s/${semesterId}/sub/${subjectId}/p/${p.id}`)}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  {p.photo ? (
                    <img src={p.photo} alt={localizeField(p, "name", lang)} className="h-16 w-16 rounded-full object-cover border" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/20 grid place-items-center">
                      <User className="h-7 w-7 text-blue-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg line-clamp-2">{localizeField(p, "name", lang)}</h3>
                    {p.email && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.email}</p>}
                  </div>
                </div>
                {(() => {
                  const bio = localizeField(p, "bio", lang);
                  return bio ? <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{bio}</p> : null;
                })()}
                <p className="mt-3 text-xs text-muted-foreground">{p._count?.lessons ?? 0} {t("nav.step.lessons")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonsView({ universityId, facultyId, degreeId, majorId, yearId, semesterId, subjectId, professorId }: { universityId: string; facultyId: string; degreeId: string; majorId: string; yearId: string; semesterId: string; subjectId: string; professorId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api(`/api/public/lessons?subjectId=${subjectId}&professorId=${professorId}`)
      .then((r: any) => setLessons(r.lessons || []))
      .finally(() => setLoading(false));
  }, [subjectId, professorId]);
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: t("nav.universities"), href: "/universities" },
        { label: t("nav.step.faculty"), href: `/u/${universityId}` },
        { label: t("nav.step.degree"), href: `/u/${universityId}/f/${facultyId}` },
        { label: t("nav.step.major"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}` },
        { label: t("nav.step.year"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}` },
        { label: t("nav.step.semester"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}` },
        { label: t("nav.step.subject"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}/s/${semesterId}` },
        { label: t("nav.step.professor"), href: `/u/${universityId}/f/${facultyId}/d/${degreeId}/m/${majorId}/y/${yearId}/s/${semesterId}/sub/${subjectId}` },
        { label: t("nav.step.lessons") },
      ]} />
      <h1 className="text-3xl font-bold">{t("nav.step.lessons")}</h1>
      {loading ? <LoadingGrid /> : lessons.length === 0 ? <EmptyState message={t("nav.empty.lessons")} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => (
            <Card key={l.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/lesson/${l.id}`)}>
              <CardContent className="p-5">
                {l.thumbnail && <img src={l.thumbnail} alt="" className="aspect-video w-full object-cover rounded-lg mb-3" />}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  {formatDate(l.updatedAt, lang)}
                </div>
                <h3 className="font-semibold text-lg line-clamp-2">{localizeField(l, "title", lang)}</h3>
                {l.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{localizeField(l, "description", lang)}</p>}
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> {l._count?.contentBlocks ?? 0} {t("lesson.text")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// LESSON VIEW
// ────────────────────────────────────────────
function LessonView({ lessonId }: { lessonId: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setLoading(true);
    api(`/api/public/lesson?id=${lessonId}`)
      .then((r: any) => {
        setData(r);
        setIsFavorite(r.isFavorite);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" /></div>;
  }
  if (!data || !data.lesson) {
    return <EmptyState message="Lesson not found" />;
  }
  const { lesson, prev, next, related } = data;

  const toggleFav = async () => {
    try {
      const r: any = await api("/api/public/favorite", {
        method: "POST",
        body: { lessonId, action: isFavorite ? "remove" : "add" },
      });
      setIsFavorite(!r.favorite);
      toast.success(r.favorite ? t("lesson.addToFavorites") : t("lesson.removeFromFavorites"));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[
        { label: t("nav.home"), href: "/" },
        { label: localizeField(lesson.subject, "name", lang), href: `/u/${lesson.universityId}/f/${lesson.major.facultyId}/d/${lesson.degreeLevelId}/m/${lesson.majorId}/y/${lesson.academicYearId}/s/${lesson.semesterId}/sub/${lesson.subjectId}` },
        ...(lesson.professor ? [{ label: localizeField(lesson.professor, "name", lang), href: `/u/${lesson.universityId}/f/${lesson.major.facultyId}/d/${lesson.degreeLevelId}/m/${lesson.majorId}/y/${lesson.academicYearId}/s/${lesson.semesterId}/sub/${lesson.subjectId}/p/${lesson.professorId}` }] : []),
        { label: localizeField(lesson, "title", lang) },
      ]} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{localizeField(lesson, "title", lang)}</h1>
          {lesson.description && <p className="mt-2 text-muted-foreground max-w-3xl">{localizeField(lesson, "description", lang)}</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            {t("lesson.lastUpdated")}: {formatDate(lesson.updatedAt, lang)}
          </p>
        </div>
        <Button variant="outline" onClick={toggleFav} className="gap-2">
          {isFavorite ? <HeartOff className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          {isFavorite ? t("lesson.removeFromFavorites") : t("lesson.addToFavorites")}
        </Button>
      </div>

      {/* Academic context */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { icon: Building2, label: localizeField(lesson.university, "name", lang) },
            { icon: GraduationCap, label: localizeField(lesson.degreeLevel, "name", lang) },
            { icon: Library, label: localizeField(lesson.major, "name", lang) },
            { icon: Calendar, label: localizeField(lesson.academicYear, "name", lang) },
            { icon: Layers, label: localizeField(lesson.semester, "name", lang) },
            ...(lesson.professor ? [{ icon: User, label: localizeField(lesson.professor, "name", lang) }] : []),
            { icon: FolderTree, label: localizeField(lesson.subject, "name", lang) },
          ].map((c, i) => (
            <div key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs">
              <c.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {c.label}
            </div>
          ))}
        </div>
        {lesson.professor && (() => {
          const bio = localizeField(lesson.professor, "bio", lang);
          if (!bio) return null;
          return (
            <div className="mt-3 flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              {lesson.professor.photo ? (
                <img src={lesson.professor.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium">{localizeField(lesson.professor, "name", lang)}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{bio}</p>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Content blocks */}
      <div className="space-y-6">
        {lesson.contentBlocks?.map((b: any, i: number) => (
          <LessonContent key={b.id || i} block={b} />
        ))}
      </div>

      {/* Prev/Next */}
      <div className="flex flex-wrap justify-between gap-3 pt-6 border-t border-border">
        {prev ? (
          <Button variant="outline" onClick={() => navigate(`/lesson/${prev.id}`)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="truncate max-w-40">{localizeField(prev, "title", lang)}</span>
          </Button>
        ) : <div />}
        {next ? (
          <Button variant="outline" onClick={() => navigate(`/lesson/${next.id}`)} className="gap-2">
            <span className="truncate max-w-40">{localizeField(next, "title", lang)}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : <div />}
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">{t("lesson.related")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r: any) => (
              <Card key={r.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/lesson/${r.id}`)}>
                <CardContent className="p-4">
                  <BookOpen className="h-5 w-5 text-muted-foreground mb-2" />
                  <h3 className="font-medium text-sm line-clamp-2">{localizeField(r, "title", lang)}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// SIGN IN
// ────────────────────────────────────────────
function SignInView() {
  const { data: session, status } = useSession();
  const { navigate } = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role === "ADMIN") {
        navigate("/admin/overview");
      } else {
        navigate("/dashboard");
      }
    }
  }, [status, session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res: any = await loginWithCredentials(email.trim(), password);
      if (res?.error || !res?.ok) {
        setError(t("auth.invalid") || "Invalid email or password");
        setLoading(false);
        return;
      }
      toast.success(t("auth.welcome") || "Welcome back!");
      if (res?.user?.role === "ADMIN") {
        navigate("/admin/overview");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError(t("auth.invalid") || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-12 w-12 grid place-items-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("auth.signin.title")}</CardTitle>
          <CardDescription>{t("auth.signin.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("auth.signin.btn")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <button className="text-primary hover:underline" onClick={() => navigate("/signup")}>
              {t("nav.signup")}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// SIGN UP
// ────────────────────────────────────────────
function SignUpView() {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [univs, setUnivs] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", universityId: "", facultyId: "", degreeLevelId: "", majorId: "", academicYearId: "" });
  const [faculties, setFaculties] = useState<any[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/public/universities").then((r: any) => setUnivs(r.universities || []));
  }, []);

  useEffect(() => {
    if (!form.universityId) { setFaculties([]); setDegrees([]); return; }
    api(`/api/public/faculties?universityId=${form.universityId}`).then((r: any) => setFaculties(r.faculties || []));
    setForm((f) => ({ ...f, facultyId: "", degreeLevelId: "", majorId: "", academicYearId: "" }));
  }, [form.universityId]);
  useEffect(() => {
    if (!form.universityId || !form.facultyId) { setDegrees([]); return; }
    api(`/api/public/degrees?universityId=${form.universityId}&facultyId=${form.facultyId}`).then((r: any) => setDegrees(r.degrees || []));
    setForm((f) => ({ ...f, degreeLevelId: "", majorId: "", academicYearId: "" }));
  }, [form.universityId, form.facultyId]);
  useEffect(() => {
    if (!form.universityId || !form.facultyId || !form.degreeLevelId) { setMajors([]); return; }
    api(`/api/public/majors?universityId=${form.universityId}&degreeLevelId=${form.degreeLevelId}&facultyId=${form.facultyId}`).then((r: any) => setMajors(r.majors || []));
    setForm((f) => ({ ...f, majorId: "", academicYearId: "" }));
  }, [form.degreeLevelId, form.universityId, form.facultyId]);
  useEffect(() => {
    if (!form.majorId || !form.degreeLevelId) { setYears([]); return; }
    api(`/api/public/years?majorId=${form.majorId}&degreeLevelId=${form.degreeLevelId}`).then((r: any) => setYears(r.years || []));
    setForm((f) => ({ ...f, academicYearId: "" }));
  }, [form.majorId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (form.password !== form.confirmPassword) {
      setError(t("auth.passwordMismatch"));
      setLoading(false);
      return;
    }
    if (form.password.length < 8) {
      setError(t("auth.passwordShort"));
      setLoading(false);
      return;
    }
    try {
      const regRes: any = await api("/api/auth/register", { method: "POST", body: form });
      if (regRes?.token) {
        localStorage.setItem("elearning_token", regRes.token);
        window.dispatchEvent(new Event("auth-changed"));
      }
      toast.success(t("auth.accountCreated") || "Account created successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message === "exists" ? t("auth.exists") : (err.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-12 w-12 grid place-items-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("auth.signup.title")}</CardTitle>
          <CardDescription>{t("auth.signup.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.name")}</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
                <Input id="confirm" type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="univ">{t("auth.university")}</Label>
              <select id="univ" className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.universityId} onChange={(e) => setForm({ ...form, universityId: e.target.value })} required>
                <option value="">{t("auth.selectUniversity")}</option>
                {univs.map((u) => <option key={u.id} value={u.id}>{localizeField(u, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac">{t("nav.step.faculty")}</Label>
              <select id="fac" className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} required disabled={!faculties.length}>
                <option value="">{t("nav.step.faculty")}</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{localizeField(f, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deg">{t("auth.degree")}</Label>
              <select id="deg" className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.degreeLevelId} onChange={(e) => setForm({ ...form, degreeLevelId: e.target.value })} required disabled={!degrees.length}>
                <option value="">{t("auth.selectDegree")}</option>
                {degrees.map((d) => <option key={d.id} value={d.id}>{localizeField(d, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maj">{t("auth.major")}</Label>
              <select id="maj" className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.majorId} onChange={(e) => setForm({ ...form, majorId: e.target.value })} required disabled={!majors.length}>
                <option value="">{t("auth.selectMajor")}</option>
                {majors.map((m) => <option key={m.id} value={m.id}>{localizeField(m, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">{t("auth.year")}</Label>
              <select id="year" className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })} required disabled={!years.length}>
                <option value="">{t("auth.selectYear")}</option>
                {years.map((y) => <option key={y.id} value={y.id}>{localizeField(y, "name", lang)}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("auth.signup.btn")}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <button className="text-primary hover:underline" onClick={() => navigate("/signin")}>
              {t("nav.signin")}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────
function DashboardView({ user }: { user: any }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [recent, setRecent] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    api("/api/public/recently-viewed").then((r: any) => setRecent(r.recentlyViewed || [])).catch(() => {});
    api("/api/public/favorite").then((r: any) => setFavorites(r.favorites || [])).catch(() => {});
    // Try to load subjects from user's profile
    if (user?.academicYearId) {
      // subjects are nested under semester of the year; let's load semesters first
      api(`/api/public/semesters?academicYearId=${user.academicYearId}`).then(async (r: any) => {
        const all: any[] = [];
        for (const s of (r.semesters || [])) {
          const sr: any = await api(`/api/public/subjects?semesterId=${s.id}`);
          all.push(...(sr.subjects || []).map((x: any) => ({ ...x, semesterName: localizeField(s, "name", lang) })));
        }
        setSubjects(all);
      });
    }
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/30 p-6">
        <h1 className="text-3xl font-bold">{t("dash.welcome")} {user?.name}</h1>
        <p className="text-muted-foreground mt-1">{t("dash.subtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {user?.university && <span className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1.5"><Building2 className="h-3.5 w-3.5" />{localizeField(user.university, "name", lang)}</span>}
          {user?.degreeLevel && <span className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1.5"><GraduationCap className="h-3.5 w-3.5" />{localizeField(user.degreeLevel, "name", lang)}</span>}
          {user?.major && <span className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1.5"><Library className="h-3.5 w-3.5" />{localizeField(user.major, "name", lang)}</span>}
          {user?.academicYear && <span className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1.5"><Calendar className="h-3.5 w-3.5" />{localizeField(user.academicYear, "name", lang)}</span>}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/universities")}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5"><Building2 className="h-5 w-5 text-blue-500" /></div>
            <div><p className="text-sm font-medium">{t("nav.universities")}</p><p className="text-xs text-muted-foreground">{t("nav.browse")}</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/profile")}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5"><User className="h-5 w-5 text-emerald-500" /></div>
            <div><p className="text-sm font-medium">{t("profile.title")}</p><p className="text-xs text-muted-foreground">{t("profile.academicProfile")}</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/notifications")}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2.5"><Bell className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-sm font-medium">{t("dash.notifications")}</p><p className="text-xs text-muted-foreground">{t("notif.title")}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recently viewed */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="h-4 w-4" /> {t("dash.recentlyViewed")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 ? <EmptyState message={t("dash.noRecent")} small /> : recent.slice(0, 6).map((r: any) => (
              <button key={r.id} onClick={() => navigate(`/lesson/${r.lesson.id}`)} className="w-full text-start p-2 rounded-lg hover:bg-accent transition flex items-center gap-3">
                <div className="rounded bg-muted p-2"><BookOpen className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{localizeField(r.lesson, "title", lang)}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.lesson.subject?.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(r.viewedAt, lang)}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Heart className="h-4 w-4" /> {t("dash.favorites")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {favorites.length === 0 ? <EmptyState message={t("dash.noFavorites")} small /> : favorites.slice(0, 6).map((f: any) => (
              <button key={f.id} onClick={() => navigate(`/lesson/${f.lesson.id}`)} className="w-full text-start p-2 rounded-lg hover:bg-accent transition flex items-center gap-3">
                <div className="rounded bg-muted p-2"><Bookmark className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{localizeField(f.lesson, "title", lang)}</p>
                  <p className="text-xs text-muted-foreground truncate">{f.lesson.subject?.name}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Subjects */}
      {user?.academicYearId && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FolderTree className="h-4 w-4" /> {t("dash.subjects")}</CardTitle></CardHeader>
          <CardContent>
            {subjects.length === 0 ? <EmptyState message={t("dash.empty.subjects")} small /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((s) => (
                  <button key={s.id} onClick={() => navigate(`/u/${user.universityId}/d/${user.degreeLevelId}/m/${user.majorId}/y/${user.academicYearId}`)} className="text-start p-4 rounded-lg border hover:bg-accent transition">
                    <FolderTree className="h-5 w-5 text-emerald-500 mb-2" />
                    <p className="font-medium text-sm line-clamp-2">{localizeField(s, "name", lang)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.semesterName} · {s._count?.lessons ?? 0} lessons</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────────
function ProfileView({ user: initialUser }: { user: any }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [user, setUser] = useState(initialUser);
  const [univs, setUnivs] = useState<any[]>([]);
  // We don't persist facultyId on the User table, but we display it for context
  // (the major's faculty is automatically implied by the chosen major).
  const [form, setForm] = useState({ name: initialUser?.name || "", universityId: initialUser?.universityId || "", facultyId: initialUser?.major?.facultyId || "", degreeLevelId: initialUser?.degreeLevelId || "", majorId: initialUser?.majorId || "", academicYearId: initialUser?.academicYearId || "" });
  const [faculties, setFaculties] = useState<any[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    api("/api/public/universities").then((r: any) => setUnivs(r.universities || []));
  }, []);
  useEffect(() => {
    if (!form.universityId) { setFaculties([]); return; }
    api(`/api/public/faculties?universityId=${form.universityId}`).then((r: any) => setFaculties(r.faculties || []));
  }, [form.universityId]);
  useEffect(() => {
    if (!form.universityId || !form.facultyId) { setDegrees([]); return; }
    api(`/api/public/degrees?universityId=${form.universityId}&facultyId=${form.facultyId}`).then((r: any) => setDegrees(r.degrees || []));
  }, [form.universityId, form.facultyId]);
  useEffect(() => {
    if (!form.universityId || !form.facultyId || !form.degreeLevelId) { setMajors([]); return; }
    api(`/api/public/majors?universityId=${form.universityId}&degreeLevelId=${form.degreeLevelId}&facultyId=${form.facultyId}`).then((r: any) => setMajors(r.majors || []));
  }, [form.universityId, form.facultyId, form.degreeLevelId]);
  useEffect(() => {
    if (!form.majorId || !form.degreeLevelId) { setYears([]); return; }
    api(`/api/public/years?majorId=${form.majorId}&degreeLevelId=${form.degreeLevelId}`).then((r: any) => setYears(r.years || []));
  }, [form.majorId, form.degreeLevelId]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const r: any = await api("/api/my-profile", { method: "PATCH", body: form });
      setUser(r.user);
      toast.success(t("profile.saved"));
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await api("/api/auth/password", { method: "POST", body: pwd });
      toast.success(t("profile.saved"));
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSavingPwd(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
      <Card>
        <CardHeader><CardTitle>{t("profile.editInfo")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("auth.university")}</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.universityId} onChange={(e) => setForm({ ...form, universityId: e.target.value, facultyId: "", degreeLevelId: "", majorId: "", academicYearId: "" })}>
                <option value="">{t("auth.selectUniversity")}</option>
                {univs.map((u) => <option key={u.id} value={u.id}>{localizeField(u, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("nav.step.faculty")}</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value, degreeLevelId: "", majorId: "", academicYearId: "" })} disabled={!faculties.length}>
                <option value="">{t("nav.step.faculty")}</option>
                {faculties.map((f) => <option key={f.id} value={f.id}>{localizeField(f, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.degree")}</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.degreeLevelId} onChange={(e) => setForm({ ...form, degreeLevelId: e.target.value, majorId: "", academicYearId: "" })} disabled={!degrees.length}>
                <option value="">{t("auth.selectDegree")}</option>
                {degrees.map((d) => <option key={d.id} value={d.id}>{localizeField(d, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.major")}</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.majorId} onChange={(e) => setForm({ ...form, majorId: e.target.value, academicYearId: "" })} disabled={!majors.length}>
                <option value="">{t("auth.selectMajor")}</option>
                {majors.map((m) => <option key={m.id} value={m.id}>{localizeField(m, "name", lang)}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("auth.year")}</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })} disabled={!years.length}>
                <option value="">{t("auth.selectYear")}</option>
                {years.map((y) => <option key={y.id} value={y.id}>{localizeField(y, "name", lang)}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("profile.updateProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("profile.changePassword")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("profile.currentPassword")}</Label>
              <Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.newPassword")}</Label>
              <Input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required minLength={8} />
            </div>
            <Button type="submit" disabled={savingPwd}>
              {savingPwd && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// NOTIFICATIONS CENTER
// ────────────────────────────────────────────
function NotificationsCenterView() {
  const { t, lang } = useI18n();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  useEffect(() => {
    api("/api/public/notifications").then((r: any) => setNotifs(r.notifications || [])).catch(() => {});
  }, []);
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">{t("notif.title")}</h1>
      {notifs.length === 0 ? <EmptyState message={t("notif.empty")} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notifs.map((n) => (
            <Card key={n.id} className="cursor-pointer hover:shadow-md transition-all overflow-hidden" onClick={() => setSelected(n)}>
              {n.imageUrl && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={n.imageUrl} alt={n.title} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-2">{n.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.createdAt, lang)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {selected && (
        <Dialog open onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
            {selected.imageUrl && (
              <img src={selected.imageUrl} alt={selected.title} className="w-full h-auto block max-h-80 object-cover" />
            )}
            <div className="p-5 space-y-3">
              <h2 className="text-xl font-bold">{selected.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{selected.content}</p>
              <p className="text-xs text-muted-foreground">{formatDate(selected.createdAt, lang)}</p>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>{t("notif.close")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// SEARCH RESULTS
// ────────────────────────────────────────────
function SearchView({ q }: { q: string }) {
  const { navigate } = useRouter();
  const { t, lang } = useI18n();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(`/api/public/search?q=${encodeURIComponent(q)}`).then((r: any) => setResults(r.results)).finally(() => setLoading(false));
  }, [q]);

  const r = results || {};
  const total = (r.universities?.length || 0) + (r.majors?.length || 0) + (r.subjects?.length || 0) + (r.lessons?.length || 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Breadcrumb items={[{ label: t("nav.home"), href: "/" }, { label: t("search.results") + `: "${q}"` }]} />
      {loading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" /> :
        total === 0 ? <EmptyState message={t("search.noResults")} /> : (
          <div className="space-y-8">
            {r.universities?.length > 0 && (
              <Section title={t("nav.universities")}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.universities.map((u: any) => (
                    <Card key={u.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/u/${u.id}`)}>
                      <CardContent className="p-4"><Building2 className="h-5 w-5 text-blue-500 mb-2" /><h3 className="font-medium line-clamp-1">{localizeField(u, "name", lang)}</h3><p className="text-xs text-muted-foreground">{u.city}</p></CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            )}
            {r.majors?.length > 0 && (
              <Section title={t("nav.step.major")}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.majors.map((m: any) => (
                    <Card key={m.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/u/${m.universityId}/d/${m.degreeLevelId}/m/${m.id}`)}>
                      <CardContent className="p-4"><Library className="h-5 w-5 text-emerald-500 mb-2" /><h3 className="font-medium line-clamp-1">{localizeField(m, "name", lang)}</h3></CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            )}
            {r.subjects?.length > 0 && (
              <Section title={t("nav.step.subject")}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.subjects.map((s: any) => (
                    <Card key={s.id} className="cursor-pointer hover:shadow-md" onClick={() => {
                      // need full chain; for simplicity go to subjects listing by getting semester's academic year's major
                      // (would require extra fetch; fall back to subjects search)
                      toast.info(`Subject id: ${s.id}`);
                    }}>
                      <CardContent className="p-4"><FolderTree className="h-5 w-5 text-purple-500 mb-2" /><h3 className="font-medium line-clamp-1">{localizeField(s, "name", lang)}</h3></CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            )}
            {r.lessons?.length > 0 && (
              <Section title={t("nav.step.lessons")}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {r.lessons.map((l: any) => (
                    <Card key={l.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/lesson/${l.id}`)}>
                      <CardContent className="p-4"><BookOpen className="h-5 w-5 text-amber-500 mb-2" /><h3 className="font-medium line-clamp-2">{localizeField(l, "title", lang)}</h3>{l.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{localizeField(l, "description", lang)}</p>}</CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function NotFoundView() {
  const { navigate } = useRouter();
  const { t } = useI18n();
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">{t("common.error")}</p>
      <Button onClick={() => navigate("/")}>{t("nav.home")}</Button>
    </div>
  );
}

// ────────────────────────────────────────────
// SHARED SMALL COMPONENTS
// ────────────────────────────────────────────
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  const { navigate } = useRouter();
  const { isRTL } = useI18n();
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {it.href ? (
            <button className="text-muted-foreground hover:text-foreground" onClick={() => navigate(it.href!)}>
              {it.label}
            </button>
          ) : (
            <span className="font-medium truncate max-w-48">{it.label}</span>
          )}
          {i < items.length - 1 && (isRTL ? <ChevronRight className="h-3 w-3 text-muted-foreground" /> : <ChevronLeft className="h-3 w-3 text-muted-foreground" />)}
        </span>
      ))}
    </nav>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-video bg-muted animate-pulse" />
          <CardContent className="p-4 space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div className="h-3 bg-muted animate-pulse rounded w-full" />
            <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ message, small }: { message: string; small?: boolean }) {
  return (
    <div className={small ? "py-8 text-center" : "py-16 text-center"}>
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
        <FileQuestion className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
