"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "@/store/ui-store";
import { useI18n, localizeField } from "@/i18n/use-i18n";
import { api, formatDate, formatSize } from "@/lib/utils-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, Search, AlertTriangle, ArrowUp, ArrowDown,
  FileText, Video, Image as ImageIcon, Upload, Download, Eye, X,
} from "lucide-react";
import { UploadDropzone } from "@/components/admin/upload-dropzone";

export function AdminViews() {
  const { path } = useRouter();
  if (path === "/admin") return <AdminOverview />;
  if (path === "/admin/overview" || path === "/admin/") return <AdminOverview />;
  if (path === "/admin/users") return <AdminUsers />;
  if (path === "/admin/universities") return <AdminUniversities />;
  if (path === "/admin/faculties") return <AdminFaculties />;
  if (path === "/admin/degrees") return <AdminDegrees />;
  // alias to prevent unused-var warnings
  if (path === "/admin/majors") return <AdminMajors />;
  if (path === "/admin/years") return <AdminYears />;
  if (path === "/admin/semesters") return <AdminSemesters />;
  if (path === "/admin/professors") return <AdminProfessors />;
  if (path === "/admin/subjects") return <AdminSubjects />;
  if (path === "/admin/lessons") return <AdminLessons />;
  if (path === "/admin/media") return <AdminMedia />;
  if (path === "/admin/notifications") return <AdminNotifications />;
  if (path === "/admin/branding") return <AdminBranding />;
  if (path === "/admin/settings") return <AdminSettings />;
  if (path === "/admin/security") return <AdminSecurity />;
  if (path === "/admin/audit") return <AdminAudit />;
  if (path === "/admin/data") return <AdminData />;
  if (path === "/admin/ads") return <AdminAds />;
  return <AdminOverview />;
}

// ─────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────
function AdminOverview() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api("/api/admin/stats").then((r: any) => setStats(r.stats)).catch(() => {});
  }, []);

  if (!stats) return <Loader />;

  const cards = [
    { label: t("admin.stat.totalUsers"), value: stats.totalUsers, icon: "👥", color: "text-blue-500" },
    { label: t("admin.stat.universities"), value: stats.totalUniversities, icon: "🏛️", color: "text-emerald-500" },
    { label: t("admin.stat.majors"), value: stats.totalMajors, icon: "📚", color: "text-amber-500" },
    { label: t("admin.stat.years"), value: stats.totalYears, icon: "📅", color: "text-purple-500" },
    { label: t("admin.stat.semesters"), value: stats.totalSemesters, icon: "🗂️", color: "text-pink-500" },
    { label: t("admin.stat.subjects"), value: stats.totalSubjects, icon: "📁", color: "text-cyan-500" },
    { label: t("admin.stat.publishedLessons"), value: stats.totalPublishedLessons, icon: "📖", color: "text-rose-500" },
    { label: t("admin.stat.media"), value: stats.totalMedia, icon: "🎬", color: "text-indigo-500" },
    { label: t("admin.stat.notifications"), value: stats.totalActiveNotifications, icon: "🔔", color: "text-orange-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.nav.overview")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-3xl font-bold mt-1">{c.value}</p>
              </div>
              <span className="text-3xl">{c.icon}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("admin.stat.recentRegistrations")}</CardTitle></CardHeader>
          <CardContent>
            {stats.recentRegistrations?.length === 0 ? <Empty /> : (
              <Table>
                <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.email")}</TableHead><TableHead>{t("admin.created")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stats.recentRegistrations.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt, lang)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("admin.stat.recentLessons")}</CardTitle></CardHeader>
          <CardContent>
            {stats.recentLessons?.length === 0 ? <Empty /> : (
              <Table>
                <TableHeader><TableRow><TableHead>{t("admin.lesson.title")}</TableHead><TableHead>{t("nav.step.subject")}</TableHead><TableHead>{t("admin.created")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stats.recentLessons.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{l.subject?.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(l.createdAt, lang)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────
function AdminUsers() {
  const { t, lang } = useI18n();
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [univs, setUnivs] = useState<any[]>([]);

  const load = () => {
    setLoading(true);
    api(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r: any) => setUsers(r.users || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { api("/api/admin/universities").then((r: any) => setUnivs(r.universities || [])); }, []);

  const updateUser = async (id: string, body: any) => {
    try {
      await api("/api/admin/users", { method: "PATCH", body: { id, ...body } });
      toast.success(t("profile.saved"));
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error(e.message === "last_admin" ? "Cannot modify last admin" : e.message);
    }
  };
  const deleteUser = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try {
      await api(`/api/admin/users?id=${id}`, { method: "DELETE" });
      toast.success(t("admin.delete"));
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.nav.users")}</h1>
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="ps-9" />
        </div>
        <Button onClick={load}>{t("common.search")}</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <Loader /> : users.length === 0 ? <Empty /> : (
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.name")}</TableHead>
                    <TableHead>{t("admin.email")}</TableHead>
                    <TableHead>{t("nav.universities")}</TableHead>
                    <TableHead>{t("admin.role")}</TableHead>
                    <TableHead>{t("admin.status")}</TableHead>
                    <TableHead>{t("admin.created")}</TableHead>
                    <TableHead className="text-end">{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.university ? localizeField(u.university, "name", lang) : "—"}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${u.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-muted"}`}>{u.role}</span></TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>{u.status}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt, lang)}</TableCell>
                      <TableCell className="text-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(u)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && <UserEditDialog user={editing} univs={univs} onSave={(b) => updateUser(editing.id, b)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function UserEditDialog({ user, univs, onSave, onClose }: { user: any; univs: any[]; onSave: (b: any) => void; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
    status: user.status,
    universityId: user.universityId || "",
    degreeLevelId: user.degreeLevelId || "",
    majorId: user.majorId || "",
    academicYearId: user.academicYearId || "",
  });
  const [degrees, setDegrees] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  useEffect(() => {
    if (!form.universityId) return;
    api(`/api/public/degrees?universityId=${form.universityId}`).then((r: any) => setDegrees(r.degrees || []));
  }, [form.universityId]);
  useEffect(() => {
    if (!form.universityId || !form.degreeLevelId) return;
    api(`/api/public/majors?universityId=${form.universityId}&degreeLevelId=${form.degreeLevelId}`).then((r: any) => setMajors(r.majors || []));
  }, [form.universityId, form.degreeLevelId]);
  useEffect(() => {
    if (!form.majorId || !form.degreeLevelId) return;
    api(`/api/public/years?majorId=${form.majorId}&degreeLevelId=${form.degreeLevelId}`).then((r: any) => setYears(r.years || []));
  }, [form.majorId, form.degreeLevelId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("admin.edit")} — {user.email}</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          <div><Label>{t("admin.name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("admin.role")}</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="STUDENT">STUDENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div>
              <Label>{t("admin.status")}</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
          <div>
            <Label>{t("auth.university")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.universityId} onChange={(e) => setForm({ ...form, universityId: e.target.value, degreeLevelId: "", majorId: "", academicYearId: "" })}>
              <option value="">—</option>
              {univs.map((u) => <option key={u.id} value={u.id}>{localizeField(u, "name", lang)}</option>)}
            </select>
          </div>
          <div>
            <Label>{t("auth.degree")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.degreeLevelId} onChange={(e) => setForm({ ...form, degreeLevelId: e.target.value, majorId: "", academicYearId: "" })} disabled={!degrees.length}>
              <option value="">—</option>
              {degrees.map((d) => <option key={d.id} value={d.id}>{localizeField(d, "name", lang)}</option>)}
            </select>
          </div>
          <div>
            <Label>{t("auth.major")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.majorId} onChange={(e) => setForm({ ...form, majorId: e.target.value, academicYearId: "" })} disabled={!majors.length}>
              <option value="">—</option>
              {majors.map((m) => <option key={m.id} value={m.id}>{localizeField(m, "name", lang)}</option>)}
            </select>
          </div>
          <div>
            <Label>{t("auth.year")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })} disabled={!years.length}>
              <option value="">—</option>
              {years.map((y) => <option key={y.id} value={y.id}>{localizeField(y, "name", lang)}</option>)}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Universities
// ─────────────────────────────────────────────────────
function AdminUniversities() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const load = () => api("/api/admin/universities").then((r: any) => setItems(r.universities || []));
  useEffect(() => { load(); api("/api/admin/degrees").then((r: any) => setDegrees(r.degrees || [])); }, []);

  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/universities", { method: "PATCH", body: data });
      else await api("/api/admin/universities", { method: "POST", body: data });
      toast.success(t("admin.save"));
      setOpen(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try { await api(`/api/admin/universities?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("admin.nav.universities")}</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{localizeField(u, "name", lang)}</h3>
                  <p className="text-xs text-muted-foreground">{u.city}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(u); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{u._count?.majors ?? 0} {t("admin.nav.majors")}</span>
                <span>{u._count?.lessons ?? 0} {t("admin.nav.lessons")}</span>
                <span className={u.published ? "text-emerald-600" : "text-muted-foreground"}>{u.published ? t("admin.published") : t("admin.lesson.draft")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {open && <UniversityDialog initial={editing} degrees={degrees} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function UniversityDialog({ initial, degrees, onSave, onClose }: { initial: any; degrees: any[]; onSave: (b: any) => void; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    name: initial?.name || "",
    nameAr: initial?.nameAr || "",
    nameFr: initial?.nameFr || "",
    description: initial?.description || "",
    descriptionAr: initial?.descriptionAr || "",
    descriptionFr: initial?.descriptionFr || "",
    city: initial?.city || "",
    logo: initial?.logo || "",
    coverImage: initial?.coverImage || "",
    published: initial?.published ?? true,
    order: initial?.order ?? 0,
    degreeLevelIds: initial?._count ? undefined : degrees.map((d) => d.id),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.universities")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 p-1">
          {[
            ["name", t("admin.name")], ["nameAr", t("admin.nameAr")], ["nameFr", t("admin.nameFr")],
            ["city", t("admin.city")],
          ].map(([k, l]) => (
            <div key={k}><Label>{l}</Label><Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div><Label>{t("admin.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>{t("admin.descriptionAr")}</Label><Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} /></div>
          <div><Label>{t("admin.descriptionFr")}</Label><Textarea value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} /></div>
          <div><Label>{t("admin.logo")}</Label><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="/uploads/..." /></div>
          <div><Label>{t("admin.cover")}</Label><Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="/uploads/..." /></div>
          <div><Label>{t("admin.order")}</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
          <div className="flex items-end gap-2 pb-2">
            <Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} />
            <Label>{t("admin.published")}</Label>
          </div>
          <div className="col-span-2">
            <Label>{t("admin.nav.degrees")}</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {degrees.map((d) => {
                const checked = form.degreeLevelIds?.includes(d.id);
                return (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={!!checked} onCheckedChange={(c) => {
                      setForm((f: any) => ({
                        ...f,
                        degreeLevelIds: c ? [...(f.degreeLevelIds || []), d.id] : (f.degreeLevelIds || []).filter((x: string) => x !== d.id),
                      }));
                    }} />
                    <span className="text-sm">{localizeField(d, "name", lang)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Generic CRUD for degrees/majors/years/semesters/subjects
// ─────────────────────────────────────────────────────

// Faculties & Departments
function AdminFaculties() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [univs, setUnivs] = useState<any[]>([]);
  const [filterUniv, setFilterUniv] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    const qs = filterUniv ? `?universityId=${filterUniv}` : "";
    api(`/api/admin/faculties${qs}`).then((r: any) => setItems(r.faculties || []));
  };
  useEffect(() => { load(); api("/api/admin/universities").then((r: any) => setUnivs(r.universities || [])); }, []);
  useEffect(() => { load(); }, [filterUniv]);

  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/faculties", { method: "PATCH", body: data });
      else await api("/api/admin/faculties", { method: "POST", body: data });
      toast.success(t("admin.save")); setOpen(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try { await api(`/api/admin/faculties?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("admin.nav.faculties")}</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button>
      </div>
      <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterUniv} onChange={(e) => setFilterUniv(e.target.value)}>
        <option value="">{t("nav.universities")}</option>
        {univs.map((u) => <option key={u.id} value={u.id}>{localizeField(u, "name", lang)}</option>)}
      </select>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("nav.universities")}</TableHead><TableHead>{t("admin.published")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.length === 0 ? <TableRow><TableCell colSpan={4}><Empty /></TableCell></TableRow> : items.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{localizeField(f, "name", lang)}</TableCell>
                <TableCell className="text-sm">{f.university ? localizeField(f.university, "name", lang) : "—"}</TableCell>
                <TableCell>{f.published ? <span className="text-emerald-600">✓</span> : "—"}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {open && <FacultyDialog initial={editing} univs={univs} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function FacultyDialog({ initial, univs, onSave, onClose }: any) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    name: initial?.name || "", nameAr: initial?.nameAr || "", nameFr: initial?.nameFr || "",
    universityId: initial?.universityId || "",
    published: initial?.published ?? true,
    order: initial?.order ?? 0,
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.faculties")}</DialogTitle></DialogHeader>
        <div className="space-y-3 p-1">
          {[["name", t("admin.name")], ["nameAr", t("admin.nameAr")], ["nameFr", t("admin.nameFr")]].map(([k, l]) => (
            <div key={k}><Label>{l}</Label><Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div>
            <Label>{t("auth.university")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.universityId} onChange={(e) => setForm({ ...form, universityId: e.target.value })}>
              <option value="">—</option>
              {univs.map((u: any) => <option key={u.id} value={u.id}>{localizeField(u, "name", lang)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} /><Label>{t("admin.published")}</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function AdminDegrees() {
  // Degree Levels management

  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [univs, setUnivs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const load = () => api("/api/admin/degrees").then((r: any) => setItems(r.degrees || []));
  useEffect(() => { load(); api("/api/admin/universities").then((r: any) => setUnivs(r.universities || [])); }, []);
  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/degrees", { method: "PATCH", body: data });
      else await api("/api/admin/degrees", { method: "POST", body: data });
      toast.success(t("admin.save")); setOpen(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try { await api(`/api/admin/degrees?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">{t("admin.nav.degrees")}</h1><Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button></div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("nav.universities")}</TableHead><TableHead>{t("admin.nav.majors")}</TableHead><TableHead>{t("admin.published")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{localizeField(d, "name", lang)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{d._count?.majors ?? 0} majors</TableCell>
                <TableCell>{d._count?.lessons ?? 0}</TableCell>
                <TableCell>{d.published ? <span className="text-emerald-600">✓</span> : "—"}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <SimpleNamedDialog title={t("admin.nav.degrees")} initial={editing} extraField="universityIds" extraOptions={univs} extraLabel={(u:any) => localizeField(u, "name", lang)} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function AdminMajors() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [univs, setUnivs] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [filterUniv, setFilterUniv] = useState("");
  const [filterFac, setFilterFac] = useState("");
  const [filterDeg, setFilterDeg] = useState("");
  const load = () => {
    const qs = new URLSearchParams();
    if (filterUniv) qs.set("universityId", filterUniv);
    if (filterFac) qs.set("facultyId", filterFac);
    if (filterDeg) qs.set("degreeLevelId", filterDeg);
    api(`/api/admin/majors?${qs.toString()}`).then((r: any) => setItems(r.majors || []));
  };
  useEffect(() => { load(); api("/api/admin/universities").then((r: any) => setUnivs(r.universities || [])); api("/api/admin/faculties").then((r: any) => setFaculties(r.faculties || [])); api("/api/admin/degrees").then((r: any) => setDegrees(r.degrees || [])); }, []);
  // re-fetch faculties when filterUniv changes (so dropdown shows only this university's faculties)
  useEffect(() => {
    if (filterUniv) {
      api(`/api/public/faculties?universityId=${filterUniv}`).then((r: any) => setFaculties(r.faculties || []));
    } else {
      api("/api/admin/faculties").then((r: any) => setFaculties(r.faculties || []));
    }
  }, [filterUniv]);
  useEffect(() => { load(); }, [filterUniv, filterFac, filterDeg]);
  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/majors", { method: "PATCH", body: data });
      else await api("/api/admin/majors", { method: "POST", body: data });
      toast.success(t("admin.save")); setOpen(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => { if (!confirm(t("admin.deleteWarning"))) return; try { await api(`/api/admin/majors?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); } };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">{t("admin.nav.majors")}</h1><Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button></div>
      <div className="flex gap-2 flex-wrap">
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterUniv} onChange={(e) => { setFilterUniv(e.target.value); setFilterFac(""); }}>
          <option value="">{t("nav.universities")}</option>
          {univs.map((u) => <option key={u.id} value={u.id}>{localizeField(u, "name", lang)}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterFac} onChange={(e) => setFilterFac(e.target.value)}>
          <option value="">{t("nav.step.faculty")}</option>
          {faculties.map((f) => <option key={f.id} value={f.id}>{localizeField(f, "name", lang)}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterDeg} onChange={(e) => setFilterDeg(e.target.value)}>
          <option value="">{t("admin.nav.degrees")}</option>
          {degrees.map((d) => <option key={d.id} value={d.id}>{localizeField(d, "name", lang)}</option>)}
        </select>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("nav.universities")}</TableHead><TableHead>{t("nav.step.faculty")}</TableHead><TableHead>{t("admin.nav.degrees")}</TableHead><TableHead>{t("admin.nav.years")}</TableHead><TableHead>{t("admin.published")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{localizeField(m, "name", lang)}</TableCell>
                <TableCell className="text-sm">{m.university ? localizeField(m.university, "name", lang) : "—"}</TableCell>
                <TableCell className="text-sm">{m.faculty ? localizeField(m.faculty, "name", lang) : "—"}</TableCell>
                <TableCell className="text-sm">{m.degreeLevel ? localizeField(m.degreeLevel, "name", lang) : "—"}</TableCell>
                <TableCell>{m._count?.academicYears ?? 0}</TableCell>
                <TableCell>{m.published ? <span className="text-emerald-600">✓</span> : "—"}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <MajorDialog initial={editing} univs={univs} faculties={faculties} degrees={degrees} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function MajorDialog({ initial, univs, faculties, degrees, onSave, onClose }: any) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    name: initial?.name || "", nameAr: initial?.nameAr || "", nameFr: initial?.nameFr || "",
    description: initial?.description || "", descriptionAr: initial?.descriptionAr || "", descriptionFr: initial?.descriptionFr || "",
    coverImage: initial?.coverImage || "",
    universityId: initial?.universityId || "", facultyId: initial?.facultyId || "", degreeLevelId: initial?.degreeLevelId || "",
    published: initial?.published ?? true,
    order: initial?.order ?? 0,
  });
  // Local faculties list — re-fetched whenever the selected university changes
  const [localFaculties, setLocalFaculties] = useState<any[]>(faculties || []);
  useEffect(() => {
    if (form.universityId) {
      api(`/api/public/faculties?universityId=${form.universityId}`).then((r: any) => setLocalFaculties(r.faculties || []));
    } else {
      setLocalFaculties([]);
    }
  }, [form.universityId]);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.majors")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 p-1">
          {[["name", t("admin.name")], ["nameAr", t("admin.nameAr")], ["nameFr", t("admin.nameFr")]].map(([k, l]) => (
            <div key={k}><Label>{l}</Label><Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div>
            <Label>{t("auth.university")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.universityId} onChange={(e) => setForm({ ...form, universityId: e.target.value, facultyId: "" })}>
              <option value="">—</option>
              {univs.map((u: any) => <option key={u.id} value={u.id}>{localizeField(u, "name", lang)}</option>)}
            </select>
          </div>
          <div>
            <Label>{t("nav.step.faculty")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} disabled={!localFaculties.length}>
              <option value="">—</option>
              {localFaculties.map((f: any) => <option key={f.id} value={f.id}>{localizeField(f, "name", lang)}</option>)}
            </select>
          </div>
          <div>
            <Label>{t("auth.degree")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.degreeLevelId} onChange={(e) => setForm({ ...form, degreeLevelId: e.target.value })}>
              <option value="">—</option>
              {degrees.map((d: any) => <option key={d.id} value={d.id}>{localizeField(d, "name", lang)}</option>)}
            </select>
          </div>
          <div className="col-span-2"><Label>{t("admin.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="col-span-2"><Label>{t("admin.descriptionAr")}</Label><Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} /></div>
          <div className="col-span-2"><Label>{t("admin.descriptionFr")}</Label><Textarea value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} /></div>
          <div className="col-span-2 flex items-end gap-2">
            <Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} />
            <Label>{t("admin.published")}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminYears() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [filterMajor, setFilterMajor] = useState("");
  const load = () => {
    const qs = filterMajor ? `?majorId=${filterMajor}` : "";
    api(`/api/admin/years${qs}`).then((r: any) => setItems(r.years || []));
  };
  useEffect(() => { load(); api("/api/admin/majors").then((r: any) => setMajors(r.majors || [])); }, []);
  useEffect(() => { load(); }, [filterMajor]);
  const onSave = async (data: any) => {
    try { if (data.id) await api("/api/admin/years", { method: "PATCH", body: data }); else await api("/api/admin/years", { method: "POST", body: data }); toast.success(t("admin.save")); setOpen(false); setEditing(null); load(); } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => { if (!confirm(t("admin.deleteWarning"))) return; try { await api(`/api/admin/years?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">{t("admin.nav.years")}</h1><Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button></div>
      <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterMajor} onChange={(e) => setFilterMajor(e.target.value)}>
        <option value="">{t("admin.nav.majors")}</option>
        {majors.map((m) => <option key={m.id} value={m.id}>{localizeField(m, "name", lang)}</option>)}
      </select>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.nav.majors")}</TableHead><TableHead>{t("admin.nav.degrees")}</TableHead><TableHead>{t("admin.nav.semesters")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((y) => (
              <TableRow key={y.id}>
                <TableCell className="font-medium">{localizeField(y, "name", lang)}</TableCell>
                <TableCell className="text-sm">{y.major ? localizeField(y.major, "name", lang) : "—"}</TableCell>
                <TableCell className="text-sm">{y.major?.degreeLevel ? localizeField(y.major.degreeLevel, "name", lang) : "—"}</TableCell>
                <TableCell>{y._count?.semesters ?? 0}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(y); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(y.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <YearDialog initial={editing} majors={majors} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function YearDialog({ initial, majors, onSave, onClose }: any) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    name: initial?.name || "", nameAr: initial?.nameAr || "", nameFr: initial?.nameFr || "",
    majorId: initial?.majorId || "", degreeLevelId: initial?.degreeLevelId || initial?.major?.degreeLevelId || "",
    published: initial?.published ?? true, order: initial?.order ?? 0,
  });
  // when major changes, auto-fill degreeLevel
  useEffect(() => {
    if (!form.majorId) return;
    const m = majors.find((x: any) => x.id === form.majorId);
    if (m?.degreeLevelId) setForm((f: any) => ({ ...f, degreeLevelId: m.degreeLevelId }));
  }, [form.majorId]);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.years")}</DialogTitle></DialogHeader>
        <div className="space-y-3 p-1">
          {[["name", t("admin.name")], ["nameAr", t("admin.nameAr")], ["nameFr", t("admin.nameFr")]].map(([k, l]) => (
            <div key={k}><Label>{l}</Label><Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div>
            <Label>{t("auth.major")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.majorId} onChange={(e) => setForm({ ...form, majorId: e.target.value })}>
              <option value="">—</option>
              {majors.map((m: any) => <option key={m.id} value={m.id}>{localizeField(m, "name", lang)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} /><Label>{t("admin.published")}</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminSemesters() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [filterYear, setFilterYear] = useState("");
  const load = () => {
    const qs = filterYear ? `?academicYearId=${filterYear}` : "";
    api(`/api/admin/semesters${qs}`).then((r: any) => setItems(r.semesters || []));
  };
  useEffect(() => { load(); api("/api/admin/years").then((r: any) => setYears(r.years || [])); }, []);
  useEffect(() => { load(); }, [filterYear]);
  const onSave = async (data: any) => {
    try { if (data.id) await api("/api/admin/semesters", { method: "PATCH", body: data }); else await api("/api/admin/semesters", { method: "POST", body: data }); toast.success(t("admin.save")); setOpen(false); setEditing(null); load(); } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => { if (!confirm(t("admin.deleteWarning"))) return; try { await api(`/api/admin/semesters?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">{t("admin.nav.semesters")}</h1><Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button></div>
      <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
        <option value="">{t("admin.nav.years")}</option>
        {years.map((y) => <option key={y.id} value={y.id}>{localizeField(y, "name", lang)}</option>)}
      </select>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.nav.years")}</TableHead><TableHead>{t("admin.nav.subjects")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{localizeField(s, "name", lang)}</TableCell>
                <TableCell className="text-sm">{s.academicYear ? localizeField(s.academicYear, "name", lang) : "—"}</TableCell>
                <TableCell>{s._count?.subjects ?? 0}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <SimpleNamedDialog title={t("admin.nav.semesters")} initial={editing} extraField="academicYearId" extraOptions={years} extraLabel={(y:any) => localizeField(y, "name", lang)} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Professors — scoped per semester
// ─────────────────────────────────────────────────────
function AdminProfessors() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const load = () => {
    const qs = filter ? `?semesterId=${filter}` : "";
    api(`/api/admin/professors${qs}`).then((r: any) => setItems(r.professors || []));
  };
  useEffect(() => { load(); api("/api/admin/semesters").then((r: any) => setSemesters(r.semesters || [])); }, []);
  useEffect(() => { load(); }, [filter]);
  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/professors", { method: "PATCH", body: data });
      else await api("/api/admin/professors", { method: "POST", body: data });
      toast.success(t("admin.save")); setOpen(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try { await api(`/api/admin/professors?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("admin.nav.professors")}</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button>
      </div>
      <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">{t("admin.nav.semesters")}</option>
        {semesters.map((s) => <option key={s.id} value={s.id}>{localizeField(s, "name", lang)}</option>)}
      </select>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.nav.semesters")}</TableHead><TableHead>{t("admin.nav.lessons")}</TableHead><TableHead>{t("admin.published")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.length === 0 ? <TableRow><TableCell colSpan={5}><Empty /></TableCell></TableRow> : items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.photo && <img src={p.photo} alt="" className="h-8 w-8 rounded-full object-cover" />}
                    <span>{localizeField(p, "name", lang)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{p.semester ? localizeField(p.semester, "name", lang) : "—"}</TableCell>
                <TableCell>{p._count?.lessons ?? 0}</TableCell>
                <TableCell>{p.published ? <span className="text-emerald-600">✓</span> : "—"}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <ProfessorDialog initial={editing} semesters={semesters} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function ProfessorDialog({ initial, semesters, onSave, onClose }: any) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    name: initial?.name || "", nameAr: initial?.nameAr || "", nameFr: initial?.nameFr || "",
    bio: initial?.bio || "", bioAr: initial?.bioAr || "", bioFr: initial?.bioFr || "",
    photo: initial?.photo || "",
    email: initial?.email || "",
    semesterId: initial?.semesterId || "",
    published: initial?.published ?? true,
    order: initial?.order ?? 0,
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.professors")}</DialogTitle></DialogHeader>
        <div className="space-y-3 p-1">
          {[["name", t("admin.name")], ["nameAr", t("admin.nameAr")], ["nameFr", t("admin.nameFr")]].map(([k, l]) => (
            <div key={k}><Label>{l}</Label><Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div>
            <Label>{t("admin.nav.semesters")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.semesterId} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}>
              <option value="">—</option>
              {semesters.map((s: any) => <option key={s.id} value={s.id}>{localizeField(s, "name", lang)}</option>)}
            </select>
          </div>
          <div><Label>{t("admin.professor.bio")}</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div><Label>{t("admin.professor.bioAr")}</Label><Textarea value={form.bioAr} onChange={(e) => setForm({ ...form, bioAr: e.target.value })} /></div>
          <div><Label>{t("admin.professor.bioFr")}</Label><Textarea value={form.bioFr} onChange={(e) => setForm({ ...form, bioFr: e.target.value })} /></div>
          <div><Label>{t("admin.professor.photo")}</Label><Input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="/uploads/..." /></div>
          <div><Label>{t("admin.professor.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} /><Label>{t("admin.published")}</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name || !form.semesterId}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminSubjects() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const load = () => {
    const qs = filter ? `?semesterId=${filter}` : "";
    api(`/api/admin/subjects${qs}`).then((r: any) => setItems(r.subjects || []));
  };
  useEffect(() => { load(); api("/api/admin/semesters").then((r: any) => setSemesters(r.semesters || [])); }, []);
  useEffect(() => { load(); }, [filter]);
  const onSave = async (data: any) => {
    try { if (data.id) await api("/api/admin/subjects", { method: "PATCH", body: data }); else await api("/api/admin/subjects", { method: "POST", body: data }); toast.success(t("admin.save")); setOpen(false); setEditing(null); load(); } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => { if (!confirm(t("admin.deleteWarning"))) return; try { await api(`/api/admin/subjects?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">{t("admin.nav.subjects")}</h1><Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button></div>
      <select className="h-9 rounded-md border bg-background px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">{t("admin.nav.semesters")}</option>
        {semesters.map((s) => <option key={s.id} value={s.id}>{localizeField(s, "name", lang)}</option>)}
      </select>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.name")}</TableHead><TableHead>{t("admin.nav.semesters")}</TableHead><TableHead>{t("admin.nav.lessons")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{localizeField(s, "name", lang)}</TableCell>
                <TableCell className="text-sm">{s.semester ? localizeField(s.semester, "name", lang) : "—"}</TableCell>
                <TableCell>{s._count?.lessons ?? 0}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <SubjectDialog initial={editing} semesters={semesters} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function SubjectDialog({ initial, semesters, onSave, onClose }: any) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    name: initial?.name || "", nameAr: initial?.nameAr || "", nameFr: initial?.nameFr || "",
    description: initial?.description || "", descriptionAr: initial?.descriptionAr || "", descriptionFr: initial?.descriptionFr || "",
    coverImage: initial?.coverImage || "",
    semesterId: initial?.semesterId || "",
    published: initial?.published ?? true, order: initial?.order ?? 0,
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.subjects")}</DialogTitle></DialogHeader>
        <div className="space-y-3 p-1">
          {[["name", t("admin.name")], ["nameAr", t("admin.nameAr")], ["nameFr", t("admin.nameFr")]].map(([k, l]) => (
            <div key={k}><Label>{l}</Label><Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          <div>
            <Label>{t("admin.nav.semesters")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.semesterId} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}>
              <option value="">—</option>
              {semesters.map((s: any) => <option key={s.id} value={s.id}>{localizeField(s, "name", lang)}</option>)}
            </select>
          </div>
          <div><Label>{t("admin.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>{t("admin.descriptionAr")}</Label><Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} /></div>
          <div><Label>{t("admin.descriptionFr")}</Label><Textarea value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} /><Label>{t("admin.published")}</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple dialog for degrees/semesters
function SimpleNamedDialog({ title, initial, extraField, extraOptions, extraLabel, onSave, onClose }: any) {
  const { t, lang } = useI18n();
  // Defensive fallback — if a caller forgets to pass extraLabel, default to
  // localizing the "name" field. Prevents "extraLabel is not a function" crashes.
  const labelFor = typeof extraLabel === "function" ? extraLabel : (o: any) => localizeField(o, "name", lang);
  const [form, setForm] = useState<any>({
    id: initial?.id,
    name: initial?.name || "",
    nameAr: initial?.nameAr || "",
    nameFr: initial?.nameFr || "",
    [extraField || ""]: initial?.[extraField || ""] || "",
    published: initial?.published ?? true,
    order: initial?.order ?? 0,
    // for degrees — list of university ids
    universityIds: initial ? undefined : (extraField === "universityIds" ? [] : undefined),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {title}</DialogTitle></DialogHeader>
        <div className="space-y-3 p-1">
          {[["name", t("admin.name")], ["nameAr", t("admin.nameAr")], ["nameFr", t("admin.nameFr")]].map(([k, l]) => (
            <div key={k}><Label>{l}</Label><Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></div>
          ))}
          {extraField && extraField !== "universityIds" && (
            <div>
              <Label>{title === t("admin.nav.semesters") ? t("admin.nav.years") : ""}</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={form[extraField]} onChange={(e) => setForm({ ...form, [extraField]: e.target.value })}>
                <option value="">—</option>
                {extraOptions.map((o: any) => <option key={o.id} value={o.id}>{labelFor(o)}</option>)}
              </select>
            </div>
          )}
          {extraField === "universityIds" && (
            <div>
              <Label>{t("nav.universities")}</Label>
              <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto">
                {extraOptions.map((o: any) => {
                  const checked = form.universityIds?.includes(o.id);
                  return (
                    <label key={o.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={!!checked} onCheckedChange={(c) => {
                        setForm((f: any) => ({ ...f, universityIds: c ? [...(f.universityIds || []), o.id] : (f.universityIds || []).filter((x: string) => x !== o.id) }));
                      }} />
                      <span className="text-sm">{labelFor(o)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2"><Switch checked={form.published} onCheckedChange={(c) => setForm({ ...form, published: c })} /><Label>{t("admin.published")}</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Lessons admin (the critical part with content blocks)
// ─────────────────────────────────────────────────────
function AdminLessons() {
  const { t, lang } = useI18n();
  const { navigate } = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [univs, setUnivs] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    const qs = new URLSearchParams(filters).toString();
    api(`/api/admin/lessons?${qs}`).then((r: any) => setItems(r.lessons || []));
  };
  useEffect(() => {
    api("/api/admin/universities").then((r: any) => setUnivs(r.universities || []));
    api("/api/admin/faculties").then((r: any) => setFaculties(r.faculties || []));
    api("/api/admin/degrees").then((r: any) => setDegrees(r.degrees || []));
    api("/api/admin/majors").then((r: any) => setMajors(r.majors || []));
    api("/api/admin/years").then((r: any) => setYears(r.years || []));
    api("/api/admin/semesters").then((r: any) => setSemesters(r.semesters || []));
    api("/api/admin/professors").then((r: any) => setProfessors(r.professors || []));
    api("/api/admin/subjects").then((r: any) => setSubjects(r.subjects || []));
    load();
  }, []);
  // Re-fetch professors when semester filter changes
  useEffect(() => {
    if (filters.semesterId) {
      api(`/api/admin/professors?semesterId=${filters.semesterId}`).then((r: any) => setProfessors(r.professors || []));
    } else {
      api("/api/admin/professors").then((r: any) => setProfessors(r.professors || []));
    }
  }, [filters.semesterId]);
  // Re-fetch faculties when university filter changes
  useEffect(() => {
    if (filters.universityId) {
      api(`/api/public/faculties?universityId=${filters.universityId}`).then((r: any) => setFaculties(r.faculties || []));
    } else {
      api("/api/admin/faculties").then((r: any) => setFaculties(r.faculties || []));
    }
  }, [filters.universityId]);
  useEffect(() => { load(); }, [filters]);

  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/lessons", { method: "PATCH", body: data });
      else await api("/api/admin/lessons", { method: "POST", body: data });
      toast.success(t("admin.save"));
      setOpen(false); setEditing(null); load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const onDelete = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try { await api(`/api/admin/lessons?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("admin.nav.lessons")}</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button>
      </div>

      {/* Filters with dependent dropdowns (Faculty between University and Degree) */}
      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DependentSelect label={t("nav.universities")} value={filters.universityId} options={univs} onChange={(v) => setFilters({ universityId: v, facultyId: "", degreeLevelId: "", majorId: "", academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
          <DependentSelect label={t("nav.step.faculty")} value={filters.facultyId || ""} options={faculties} onChange={(v) => setFilters({ ...filters, facultyId: v, degreeLevelId: "", majorId: "", academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
          <DependentSelect label={t("admin.nav.degrees")} value={filters.degreeLevelId} options={degrees} onChange={(v) => setFilters({ ...filters, degreeLevelId: v, majorId: "", academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
          <DependentSelect label={t("admin.nav.majors")} value={filters.majorId} options={majors.filter((m) => (!filters.universityId || m.universityId === filters.universityId) && (!filters.facultyId || m.facultyId === filters.facultyId) && (!filters.degreeLevelId || m.degreeLevelId === filters.degreeLevelId))} onChange={(v) => setFilters({ ...filters, majorId: v, academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
          <DependentSelect label={t("admin.nav.years")} value={filters.academicYearId} options={years.filter((y) => !filters.majorId || y.majorId === filters.majorId)} onChange={(v) => setFilters({ ...filters, academicYearId: v, semesterId: "", subjectId: "", professorId: "" })} />
          <DependentSelect label={t("admin.nav.semesters")} value={filters.semesterId} options={semesters.filter((s) => !filters.academicYearId || s.academicYearId === filters.academicYearId)} onChange={(v) => setFilters({ ...filters, semesterId: v, subjectId: "", professorId: "" })} />
          <DependentSelect label={t("admin.nav.subjects")} value={filters.subjectId} options={subjects.filter((s) => !filters.semesterId || s.semesterId === filters.semesterId)} onChange={(v) => setFilters({ ...filters, subjectId: v })} />
          <DependentSelect label={t("admin.nav.professors")} value={filters.professorId || ""} options={professors.filter((p) => !filters.semesterId || p.semesterId === filters.semesterId)} onChange={(v) => setFilters({ ...filters, professorId: v })} />
          <DependentSelect label={t("admin.lesson.status")} value={filters.status || ""} options={[{ id: "", name: "" }, { id: "DRAFT", name: "DRAFT" }, { id: "PUBLISHED", name: "PUBLISHED" }, { id: "UNPUBLISHED", name: "UNPUBLISHED" }, { id: "ARCHIVED", name: "ARCHIVED" }]} onChange={(v) => setFilters({ ...filters, status: v })} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? <Empty /> : (
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.lesson.title")}</TableHead>
                    <TableHead>{t("admin.nav.professors")}</TableHead>
                    <TableHead>{t("nav.step.subject")}</TableHead>
                    <TableHead>{t("admin.nav.semesters")}</TableHead>
                    <TableHead>{t("admin.lesson.status")}</TableHead>
                    <TableHead className="text-end">{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{localizeField(l, "title", lang)}</TableCell>
                      <TableCell className="text-sm">{l.professor ? localizeField(l.professor, "name", lang) : "—"}</TableCell>
                      <TableCell className="text-sm">{l.subject ? localizeField(l.subject, "name", lang) : "—"}</TableCell>
                      <TableCell className="text-sm">{l.semester ? localizeField(l.semester, "name", lang) : "—"}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          l.status === "PUBLISHED" ? "bg-emerald-500/15 text-emerald-600" :
                          l.status === "DRAFT" ? "bg-amber-500/15 text-amber-600" :
                          l.status === "ARCHIVED" ? "bg-muted text-muted-foreground" :
                          "bg-destructive/10 text-destructive"
                        }`}>{l.status}</span>
                      </TableCell>
                      <TableCell className="text-end">
                        {l.status === "PUBLISHED" && (
                          <Button size="sm" variant="ghost" title="Preview" onClick={() => navigate(`/lesson/${l.id}`)}><Eye className="h-4 w-4" /></Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(l); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {open && <LessonDialog initial={editing} univs={univs} faculties={faculties} degrees={degrees} majors={majors} years={years} semesters={semesters} professors={professors} subjects={subjects} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function DependentSelect({ label, value, options, onChange }: { label: string; value: string; options: any[]; onChange: (v: string) => void }) {
  const { lang } = useI18n();
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <select
        className="w-full h-9 rounded-md border bg-background px-3 text-sm mt-1"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {options.filter((o) => o.id).map((o) => (
          <option key={o.id} value={o.id}>
            {o.nameAr && lang === "ar" ? o.nameAr : o.nameFr && lang === "fr" ? o.nameFr : o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function LessonDialog({ initial, univs, faculties, degrees, majors, years, semesters, professors, subjects, onSave, onClose }: any) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    title: initial?.title || "", titleAr: initial?.titleAr || "", titleFr: initial?.titleFr || "",
    description: initial?.description || "", descriptionAr: initial?.descriptionAr || "", descriptionFr: initial?.descriptionFr || "",
    thumbnail: initial?.thumbnail || "",
    status: initial?.status || "DRAFT",
    order: initial?.order ?? 0,
    universityId: initial?.universityId || "",
    facultyId: initial?.facultyId || initial?.major?.facultyId || "",
    degreeLevelId: initial?.degreeLevelId || "",
    majorId: initial?.majorId || "",
    academicYearId: initial?.academicYearId || "",
    semesterId: initial?.semesterId || "",
    professorId: initial?.professorId || "",
    subjectId: initial?.subjectId || "",
    contentBlocks: initial?.contentBlocks?.map((b: any) => ({ ...b, mediaPaths: b.mediaPaths ? JSON.parse(b.mediaPaths) : undefined })) || [],
  });
  // Local professors list — fetched fresh whenever semester changes inside the dialog
  const [localProfessors, setLocalProfessors] = useState<any[]>(professors || []);
  useEffect(() => {
    if (form.semesterId) {
      api(`/api/admin/professors?semesterId=${form.semesterId}`).then((r: any) => setLocalProfessors(r.professors || []));
    } else {
      setLocalProfessors(professors || []);
    }
  }, [form.semesterId, professors]);
  // Local faculties list — fetched fresh whenever university changes
  const [localFaculties, setLocalFaculties] = useState<any[]>(faculties || []);
  useEffect(() => {
    if (form.universityId) {
      api(`/api/public/faculties?universityId=${form.universityId}`).then((r: any) => setLocalFaculties(r.faculties || []));
    } else {
      setLocalFaculties([]);
    }
  }, [form.universityId]);

  // Filter dependent options based on selection
  const availableDegrees = degrees; // degrees are global
  const availableMajors = majors.filter((m: any) => m.universityId === form.universityId && m.degreeLevelId === form.degreeLevelId && (!form.facultyId || m.facultyId === form.facultyId));
  const availableYears = years.filter((y: any) => y.majorId === form.majorId && y.degreeLevelId === form.degreeLevelId);
  const availableSemesters = semesters.filter((s: any) => s.academicYearId === form.academicYearId);
  const availableProfessors = localProfessors.filter((p: any) => p.semesterId === form.semesterId);
  const availableSubjects = subjects.filter((s: any) => s.semesterId === form.semesterId);

  const updateBlock = (i: number, patch: any) => {
    setForm((f: any) => {
      const blocks = [...f.contentBlocks];
      blocks[i] = { ...blocks[i], ...patch };
      return { ...f, contentBlocks: blocks };
    });
  };
  const addBlock = (type: string) => setForm((f: any) => ({ ...f, contentBlocks: [...f.contentBlocks, { type, title: "", content: "", mediaPath: "", mediaPaths: [], downloadable: true, order: f.contentBlocks.length }] }));
  const removeBlock = (i: number) => setForm((f: any) => ({ ...f, contentBlocks: f.contentBlocks.filter((_: any, idx: number) => idx !== i) }));
  const moveBlock = (i: number, dir: -1 | 1) => {
    setForm((f: any) => {
      const blocks = [...f.contentBlocks];
      const j = i + dir;
      if (j < 0 || j >= blocks.length) return f;
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      blocks.forEach((b, k) => (b.order = k));
      return { ...f, contentBlocks: blocks };
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.lessons")}</DialogTitle></DialogHeader>
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>{t("admin.lesson.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>{t("admin.lesson.titleAr")}</Label><Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} /></div>
            <div><Label>{t("admin.lesson.titleFr")}</Label><Input value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>{t("admin.lesson.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>{t("admin.lesson.descriptionAr")}</Label><Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} /></div>
            <div><Label>{t("admin.lesson.descriptionFr")}</Label><Textarea value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} /></div>
          </div>

          {/* Academic assignment — dependent dropdowns (Faculty BETWEEN University and Degree) */}
          <div className="rounded-lg border p-3 bg-muted/30 space-y-3">
            <h3 className="font-semibold text-sm">{t("nav.step.university")} → {t("nav.step.faculty")} → {t("nav.step.degree")} → {t("nav.step.subject")} → {t("nav.step.professor")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DependentSelect label={t("nav.step.university")} value={form.universityId} options={univs} onChange={(v) => setForm({ ...form, universityId: v, facultyId: "", degreeLevelId: "", majorId: "", academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
              <DependentSelect label={t("nav.step.faculty")} value={form.facultyId} options={localFaculties} onChange={(v) => setForm({ ...form, facultyId: v, degreeLevelId: "", majorId: "", academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
              <DependentSelect label={t("nav.step.degree")} value={form.degreeLevelId} options={availableDegrees} onChange={(v) => setForm({ ...form, degreeLevelId: v, majorId: "", academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
              <DependentSelect label={t("nav.step.major")} value={form.majorId} options={availableMajors} onChange={(v) => setForm({ ...form, majorId: v, academicYearId: "", semesterId: "", subjectId: "", professorId: "" })} />
              <DependentSelect label={t("nav.step.year")} value={form.academicYearId} options={availableYears} onChange={(v) => setForm({ ...form, academicYearId: v, semesterId: "", subjectId: "", professorId: "" })} />
              <DependentSelect label={t("nav.step.semester")} value={form.semesterId} options={availableSemesters} onChange={(v) => setForm({ ...form, semesterId: v, subjectId: "", professorId: "" })} />
              <DependentSelect label={t("nav.step.subject")} value={form.subjectId} options={availableSubjects} onChange={(v) => setForm({ ...form, subjectId: v, professorId: "" })} />
              <DependentSelect label={t("nav.step.professor")} value={form.professorId} options={availableProfessors} onChange={(v) => setForm({ ...form, professorId: v })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("admin.lesson.status")}</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="DRAFT">{t("admin.lesson.draft")}</option>
                <option value="PUBLISHED">{t("admin.lesson.published")}</option>
                <option value="UNPUBLISHED">{t("admin.lesson.unpublished")}</option>
                <option value="ARCHIVED">{t("admin.lesson.archived")}</option>
              </select>
            </div>
            <div><Label>{t("admin.order")}</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
          </div>

          {/* Content blocks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{t("admin.lesson.contentBlocks")} ({form.contentBlocks.length})</h3>
              <div className="flex flex-wrap gap-1">
                {[
                  { type: "text", label: t("admin.lesson.text") },
                  { type: "notes", label: t("admin.lesson.notes") },
                  { type: "pdf", label: t("lesson.pdf") },
                  { type: "uploaded_video", label: t("lesson.video") },
                  { type: "youtube", label: "YouTube" },
                  { type: "image", label: t("lesson.image") },
                  { type: "gallery", label: t("lesson.gallery") },
                  { type: "file", label: t("lesson.link") },
                  { type: "link", label: t("lesson.link") },
                ].map((b) => (
                  <Button key={b.type} size="sm" variant="outline" onClick={() => addBlock(b.type)}><Plus className="h-3 w-3 me-1" />{b.label}</Button>
                ))}
              </div>
            </div>
            {form.contentBlocks.map((b: any, i: number) => (
              <ContentBlockEditor key={i} block={b} onChange={(p: any) => updateBlock(i, p)} onRemove={() => removeBlock(i)} onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)} />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title || !form.universityId || !form.subjectId}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContentBlockEditor({ block, onChange, onRemove, onMoveUp, onMoveDown }: any) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border p-3 bg-background space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge>{block.type}</Badge>
          <Input placeholder={t("admin.lesson.blockTitle")} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} className="h-8 max-w-xs" />
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onMoveUp}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onMoveDown}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>

      {(block.type === "text" || block.type === "notes") && (
        <Textarea placeholder={t("admin.lesson.blockContent")} value={block.content || ""} onChange={(e) => onChange({ content: e.target.value })} rows={4} />
      )}

      {(block.type === "pdf" || block.type === "uploaded_video" || block.type === "image" || block.type === "file") && (
        <div className="space-y-2">
          {block.mediaPath && (
            <div className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span className="truncate">{block.mediaPath}</span>
              <Button size="sm" variant="ghost" onClick={() => onChange({ mediaPath: "" })}><X className="h-4 w-4" /></Button>
            </div>
          )}
          {!block.mediaPath && <UploadDropzone accept={block.type} onUploaded={(path: string) => onChange({ mediaPath: path })} />}
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={block.downloadable !== false} onCheckedChange={(c) => onChange({ downloadable: !!c })} />
            {t("admin.lesson.downloadable")}
          </label>
        </div>
      )}

      {block.type === "gallery" && (
        <div className="space-y-2">
          <UploadDropzone accept="gallery" onUploaded={(path: string) => onChange({ mediaPaths: [...(block.mediaPaths || []), path] })} />
          {block.mediaPaths?.length > 0 && (
            <div className="grid grid-cols-6 gap-2">
              {block.mediaPaths.map((p: string, i: number) => (
                <div key={i} className="relative aspect-square">
                  <img src={p} alt="" className="h-full w-full object-cover rounded" />
                  <button onClick={() => onChange({ mediaPaths: block.mediaPaths.filter((_: string, idx: number) => idx !== i) })} className="absolute top-0.5 end-0.5 rounded-full bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {block.type === "youtube" && (
        <Input placeholder={t("admin.lesson.youtubeUrl") + " (https://www.youtube.com/watch?v=...)"} value={block.content || ""} onChange={(e) => onChange({ content: e.target.value })} />
      )}

      {block.type === "link" && (
        <Input placeholder="https://..." value={block.content || ""} onChange={(e) => onChange({ content: e.target.value })} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Media Library
// ─────────────────────────────────────────────────────
function AdminMedia() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const load = () => api("/api/admin/media").then((r: any) => setItems(r.media || []));
  useEffect(() => { load(); }, []);
  const filtered = items.filter((m) => !filter || m.type === filter);
  const onDelete = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try { await api(`/api/admin/media?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.nav.media")}</h1>
      <Card><CardContent className="p-4"><UploadDropzone accept="any" onUploaded={() => load()} /></CardContent></Card>
      <div className="flex gap-2 flex-wrap">
        {["", "pdf", "video", "image", "document"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f || t("search.allTypes")}</Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-3">
              <div className="aspect-video rounded bg-muted grid place-items-center overflow-hidden mb-2">
                {m.type === "image" ? <img src={m.path} alt="" className="h-full w-full object-cover" /> :
                  m.type === "video" ? <Video className="h-8 w-8 text-muted-foreground" /> :
                  m.type === "pdf" ? <FileText className="h-8 w-8 text-muted-foreground" /> :
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />}
              </div>
              <p className="text-sm font-medium truncate">{m.originalName}</p>
              <p className="text-xs text-muted-foreground">{formatSize(m.size)} · {m.type}</p>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(m.path).then(() => toast.success("Path copied"))}><FileText className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(m.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────
function AdminNotifications() {
  const { t } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const load = () => api("/api/admin/notifications").then((r: any) => setItems(r.notifications || []));
  useEffect(() => { load(); }, []);
  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/notifications", { method: "PATCH", body: data });
      else await api("/api/admin/notifications", { method: "POST", body: data });
      toast.success(t("admin.save")); setOpen(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => { if (!confirm(t("admin.deleteWarning"))) return; try { await api(`/api/admin/notifications?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); } };
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">{t("admin.nav.notifications")}</h1><Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button></div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>{t("admin.notif.title")}</TableHead><TableHead>{t("admin.notif.audience")}</TableHead><TableHead>{t("admin.lesson.status")}</TableHead><TableHead>{t("admin.created")}</TableHead><TableHead className="text-end">{t("admin.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-medium truncate max-w-48">{n.title}</TableCell>
                <TableCell><span className="text-xs">{n.audienceType}</span></TableCell>
                <TableCell><span className={`rounded-full px-2 py-0.5 text-xs ${n.status === "PUBLISHED" ? "bg-emerald-500/15 text-emerald-600" : "bg-muted"}`}>{n.status}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(n.createdAt, "en")}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(n); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <NotificationDialog initial={editing} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

function NotificationDialog({ initial, onSave, onClose }: any) {
  const { t } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    title: initial?.title || "",
    content: initial?.content || "",
    imageUrl: initial?.imageUrl || "",
    audienceType: initial?.audienceType || "ALL",
    targetIds: initial?.targetIds ? JSON.parse(initial.targetIds) : [],
    showEveryVisit: initial?.showEveryVisit ?? false,
    status: initial?.status || "DRAFT",
    publishAt: initial?.publishAt ? new Date(initial.publishAt).toISOString().slice(0, 16) : "",
    expiresAt: initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 16) : "",
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.notifications")}</DialogTitle></DialogHeader>
        <div className="space-y-3 p-1">
          <div><Label>{t("admin.notif.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>{t("admin.notif.content")}</Label><Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <ImageUrlField
            label={t("admin.ads.imageUrl")}
            value={form.imageUrl}
            onChange={(v) => setForm({ ...form, imageUrl: v })}
            previewMaxH="max-h-40"
          />
          <div>
            <Label>{t("admin.notif.audience")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value, targetIds: [] })}>
              <option value="ALL">{t("admin.notif.audience.all")}</option>
              <option value="UNIVERSITY">{t("admin.notif.audience.university")}</option>
              <option value="DEGREE">{t("admin.notif.audience.degree")}</option>
              <option value="MAJOR">{t("admin.notif.audience.major")}</option>
              <option value="YEAR">{t("admin.notif.audience.year")}</option>
            </select>
          </div>
          <div><Label>{t("admin.lesson.status")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="UNPUBLISHED">UNPUBLISHED</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("admin.notif.publishAt")}</Label><Input type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} /></div>
            <div><Label>{t("admin.notif.expiresAt")}</Label><Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={form.showEveryVisit} onCheckedChange={(c) => setForm({ ...form, showEveryVisit: c })} /><Label>{t("admin.notif.showEveryVisit")}</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title || !form.content}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Branding + Settings
// ─────────────────────────────────────────────────────
function AdminBranding() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/admin/settings").then((r: any) => { setSettings(r.settings); setLoading(false); }); }, []);
  if (loading || !settings) return <Loader />;
  return <SettingsForm settings={settings} onSave={async (s) => { try { await api("/api/admin/settings", { method: "PATCH", body: s }); toast.success(t("profile.saved")); } catch (e: any) { toast.error(e.message); } }} focus="branding" />;
}

function AdminSettings() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api("/api/admin/settings").then((r: any) => { setSettings(r.settings); setLoading(false); }); }, []);
  if (loading || !settings) return <Loader />;
  return <SettingsForm settings={settings} onSave={async (s) => { try { await api("/api/admin/settings", { method: "PATCH", body: s }); toast.success(t("profile.saved")); } catch (e: any) { toast.error(e.message); } }} focus="settings" />;
}

function SettingsForm({ settings, onSave, focus }: { settings: any; onSave: (s: any) => void; focus: string }) {
  const { t } = useI18n();
  const [form, setForm] = useState<any>(settings);
  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{focus === "branding" ? t("admin.nav.branding") : t("admin.nav.settings")}</h1>
      <Card>
        <CardContent className="p-4 space-y-4">
          {focus === "branding" ? (
            <>
              <div><Label>{t("admin.settings.siteName")}</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>{t("admin.settings.logo")}</Label><Input value={form.logo || ""} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="/uploads/..." /></div>
              <div><Label>{t("admin.settings.cover")}</Label><Input value={form.coverImage || ""} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="/uploads/..." /></div>
              <div><Label>{t("admin.description")}</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>{t("admin.settings.footer")}</Label><Input value={form.footerText || ""} onChange={(e) => setForm({ ...form, footerText: e.target.value })} /></div>
              <div><Label>{t("admin.settings.contact")}</Label><Input value={form.contactEmail || ""} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
            </>
          ) : (
            <>
              <div>
                <Label>{t("admin.settings.defaultLang")}</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3" value={form.defaultLanguage || "ar"} onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })}>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <Label>{t("admin.settings.defaultTheme")}</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3" value={form.defaultTheme || "system"} onChange={(e) => setForm({ ...form, defaultTheme: e.target.value })}>
                  <option value="light">{t("theme.light")}</option>
                  <option value="dark">{t("theme.dark")}</option>
                  <option value="system">{t("theme.system")}</option>
                </select>
              </div>
              <div><Label>{t("admin.settings.enabledLangs")}</Label><Input value={form.enabledLanguages || ""} onChange={(e) => setForm({ ...form, enabledLanguages: e.target.value })} placeholder="ar,fr,en" /></div>
              <div className="flex items-center gap-2"><Switch checked={!!form.allowPublicDirectory} onCheckedChange={(c) => setForm({ ...form, allowPublicDirectory: c })} /><Label>{t("admin.settings.allowPublic")}</Label></div>
            </>
          )}
          <Button onClick={() => onSave(form)}>{t("admin.save")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Security & Audit
// ─────────────────────────────────────────────────────
function AdminSecurity() {
  const { t } = useI18n();
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await api("/api/auth/password", { method: "POST", body: pwd }); toast.success(t("profile.saved")); setPwd({ currentPassword: "", newPassword: "" }); } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="p-6 max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.nav.security")}</h1>
      <Card>
        <CardContent className="p-4">
          <form onSubmit={change} className="space-y-3">
            <div><Label>{t("profile.currentPassword")}</Label><Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required /></div>
            <div><Label>{t("profile.newPassword")}</Label><Input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required minLength={8} /></div>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{t("common.save")}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 inline me-1 text-amber-500" />
          The system prevents the last administrator from being deleted or demoted, ensuring you always retain administrative access.
        </CardContent>
      </Card>
    </div>
  );
}

function AdminAudit() {
  const { t, lang } = useI18n();
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { api("/api/admin/audit").then((r: any) => setLogs(r.logs || [])); }, []);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.nav.audit")}</h1>
      <Card><CardContent className="p-0">
        {logs.length === 0 ? <Empty /> : (
          <div className="overflow-auto max-h-[70vh]">
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>User</TableHead><TableHead>{t("admin.created")}</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell><span className="rounded font-mono text-xs px-2 py-0.5 bg-muted">{l.action}</span></TableCell>
                    <TableCell className="text-sm">{l.entity}</TableCell>
                    <TableCell className="text-sm">{l.user?.email || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(l.createdAt, lang)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-48">{l.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Ads — popups + hero banners (with mobile + desktop images)
// ─────────────────────────────────────────────────────
function AdminAds() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const load = () => {
    const qs = filter ? `?type=${filter}` : "";
    api(`/api/admin/ads${qs}`).then((r: any) => setItems(r.ads || []));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [filter]);
  const onSave = async (data: any) => {
    try {
      if (data.id) await api("/api/admin/ads", { method: "PATCH", body: data });
      else await api("/api/admin/ads", { method: "POST", body: data });
      toast.success(t("admin.save")); setOpen(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const onDelete = async (id: string) => {
    if (!confirm(t("admin.deleteWarning"))) return;
    try { await api(`/api/admin/ads?id=${id}`, { method: "DELETE" }); toast.success(t("admin.delete")); load(); } catch (e: any) { toast.error(e.message); }
  };
  const typeLabel = (typ: string) => typ === "POPUP" ? t("admin.ads.type.popup") : t("admin.ads.type.hero");
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("admin.nav.ads")}</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("admin.add")}</Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {["", "POPUP", "HERO_BANNER"].map((f) => (
          <Button key={f || "all"} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f ? typeLabel(f) : t("search.allTypes")}
          </Button>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.ads.title")}</TableHead>
              <TableHead>{t("admin.ads.type")}</TableHead>
              <TableHead>{t("admin.ads.audience")}</TableHead>
              <TableHead>{t("admin.ads.status")}</TableHead>
              <TableHead>{t("admin.created")}</TableHead>
              <TableHead className="text-end">{t("admin.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? <TableRow><TableCell colSpan={6}><Empty /></TableCell></TableRow> : items.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {(ad.type === "POPUP" ? ad.imageUrl : ad.imageDesktop || ad.imageMobile) && (
                      <img src={(ad.type === "POPUP" ? ad.imageUrl : ad.imageDesktop || ad.imageMobile) as string} alt="" className="h-10 w-16 object-cover rounded" />
                    )}
                    <span>{ad.title}</span>
                  </div>
                </TableCell>
                <TableCell><Badge>{typeLabel(ad.type)}</Badge></TableCell>
                <TableCell className="text-xs">{ad.audienceType}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${ad.status === "PUBLISHED" ? "bg-emerald-500/15 text-emerald-600" : "bg-muted"}`}>{ad.status}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(ad.createdAt, lang)}</TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(ad); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(ad.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {open && <AdDialog initial={editing} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
    </div>
  );
}

// URL-based image field — paste any image link (https://…/*.png) and a live
// preview is shown as you type. Replaces the older upload-based dropzones.
function ImageUrlField({
  label,
  hint,
  value,
  onChange,
  previewMaxH = "max-h-32",
  previewMaxW = "",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  previewMaxH?: string;
  previewMaxW?: string;
}) {
  const { t } = useI18n();
  const [broken, setBroken] = useState(false);
  // Reset the broken flag whenever the URL changes
  useEffect(() => { setBroken(false); }, [value]);
  // Accept absolute URLs (https://…) or root-relative paths (/uploads/…)
  const looksOk = value && (/^https?:\/\/.+/i.test(value) || /^\//.test(value)) && !broken;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.png  or  /uploads/2026-10/abc.png"
        className="font-mono text-sm"
      />
      {value && looksOk ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt=""
            className={`${previewMaxH} ${previewMaxW} rounded border border-border object-contain bg-muted`}
            onError={() => setBroken(true)}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 end-1 rounded-full bg-background/80 hover:bg-background p-1"
            aria-label={t("admin.delete")}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : value && broken ? (
        <p className="text-xs text-destructive">{t("upload.failed")} — {t("upload.invalidType")}</p>
      ) : null}
    </div>
  );
}

function AdDialog({ initial, onSave, onClose }: any) {
  const { t } = useI18n();
  const [form, setForm] = useState<any>({
    id: initial?.id,
    title: initial?.title || "",
    content: initial?.content || "",
    type: initial?.type || "POPUP",
    imageUrl: initial?.imageUrl || "",
    imageMobile: initial?.imageMobile || "",
    imageDesktop: initial?.imageDesktop || "",
    linkUrl: initial?.linkUrl || "",
    linkTarget: initial?.linkTarget || "_blank",
    audienceType: initial?.audienceType || "ALL",
    targetIds: initial?.targetIds ? JSON.parse(initial.targetIds) : [],
    dismissible: initial?.dismissible ?? true,
    showEveryLogin: initial?.showEveryLogin ?? false,
    status: initial?.status || "PUBLISHED",
    publishAt: initial?.publishAt ? new Date(initial.publishAt).toISOString().slice(0, 16) : "",
    expiresAt: initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 16) : "",
    order: initial?.order ?? 0,
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? t("admin.edit") : t("admin.add")} — {t("admin.nav.ads")}</DialogTitle></DialogHeader>
        <div className="space-y-3 p-1">
          <div><Label>{t("admin.ads.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>{t("admin.ads.content")}</Label><Textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div>
            <Label>{t("admin.ads.type")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="POPUP">{t("admin.ads.type.popup")}</option>
              <option value="HERO_BANNER">{t("admin.ads.type.hero")}</option>
            </select>
          </div>

          {form.type === "POPUP" ? (
            <ImageUrlField
              label={t("admin.ads.imageUrl")}
              value={form.imageUrl}
              onChange={(v) => setForm({ ...form, imageUrl: v })}
              previewMaxH="max-h-40"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <ImageUrlField
                label={t("admin.ads.imageMobile")}
                hint={t("admin.ads.imageMobileHint")}
                value={form.imageMobile}
                onChange={(v) => setForm({ ...form, imageMobile: v })}
                previewMaxH="max-h-32"
                previewMaxW="max-w-[140px]"
              />
              <ImageUrlField
                label={t("admin.ads.imageDesktop")}
                hint={t("admin.ads.imageDesktopHint")}
                value={form.imageDesktop}
                onChange={(v) => setForm({ ...form, imageDesktop: v })}
                previewMaxH="max-h-32"
                previewMaxW="max-w-[200px]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("admin.ads.linkUrl")}</Label><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." /></div>
            <div>
              <Label>{t("admin.ads.linkTarget")}</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={form.linkTarget} onChange={(e) => setForm({ ...form, linkTarget: e.target.value })}>
                <option value="_blank">{t("admin.ads.linkTarget.blank")}</option>
                <option value="_self">{t("admin.ads.linkTarget.self")}</option>
              </select>
            </div>
          </div>

          <div>
            <Label>{t("admin.ads.audience")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.audienceType} onChange={(e) => setForm({ ...form, audienceType: e.target.value, targetIds: [] })}>
              <option value="ALL">{t("admin.notif.audience.all")}</option>
              <option value="UNIVERSITY">{t("admin.notif.audience.university")}</option>
              <option value="DEGREE">{t("admin.notif.audience.degree")}</option>
              <option value="MAJOR">{t("admin.notif.audience.major")}</option>
              <option value="YEAR">{t("admin.notif.audience.year")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("admin.ads.publishAt")}</Label><Input type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} /></div>
            <div><Label>{t("admin.ads.expiresAt")}</Label><Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
          </div>

          {form.type === "POPUP" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Switch checked={form.dismissible} onCheckedChange={(c) => setForm({ ...form, dismissible: c })} /><Label>{t("admin.ads.dismissible")}</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.showEveryLogin} onCheckedChange={(c) => setForm({ ...form, showEveryLogin: c })} /><Label>{t("admin.ads.showEveryLogin")}</Label></div>
            </div>
          )}

          <div>
            <Label>{t("admin.ads.status")}</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">{t("admin.lesson.draft")}</option>
              <option value="PUBLISHED">{t("admin.lesson.published")}</option>
              <option value="UNPUBLISHED">{t("admin.lesson.unpublished")}</option>
              <option value="ARCHIVED">{t("admin.lesson.archived")}</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("admin.cancel")}</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title}>{t("admin.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────
// Data — backup & restore (download/upload everything)
// ─────────────────────────────────────────────────────
function AdminData() {
  const { t } = useI18n();
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadBackup = async () => {
    try {
      const res = await fetch("/api/admin/backup", { credentials: "include" });
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="(.+)"/);
      a.download = match ? match[1] : `e-learning-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("admin.data.backupDownloaded"));
    } catch (e: any) {
      toast.error(e.message || "Backup failed");
    }
  };

  const onRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(t("admin.data.restoreWarning"))) return;
    setRestoring(true);
    setRestoreResult(null);
    setRestoreError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.message || "Restore failed");
      }
      setRestoreResult(data);
      toast.success(t("admin.data.restoreSuccess"));
    } catch (e: any) {
      setRestoreError(e.message || "Restore failed");
      toast.error(e.message || "Restore failed");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.nav.data")}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Download */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{t("admin.data.downloadTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("admin.data.downloadDesc")}</p>
              </div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {t("admin.data.includesUsers")}</li>
              <li>• {t("admin.data.includesAcademic")}</li>
              <li>• {t("admin.data.includesLessons")}</li>
              <li>• {t("admin.data.includesMedia")}</li>
              <li>• {t("admin.data.includesAds")}</li>
              <li>• {t("admin.data.includesNotifications")}</li>
            </ul>
            <Button onClick={downloadBackup} className="gap-2 w-full">
              <Download className="h-4 w-4" />
              {t("admin.data.downloadBtn")}
            </Button>
          </CardContent>
        </Card>

        {/* Restore */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{t("admin.data.restoreTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("admin.data.restoreDesc")}</p>
              </div>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onRestoreFile} className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={restoring} className="gap-2">
                <Upload className="h-4 w-4" />
                {restoring ? t("common.loading") : t("admin.data.restoreBtn")}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">{t("admin.data.restoreHint")}</p>
            </div>
            {restoreError && <p className="text-sm text-destructive">{restoreError}</p>}
            {restoreResult && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-sm font-medium">{t("admin.data.restoreSuccess")}</p>
                <div className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(restoreResult.restored || {}).map(([table, count]: [string, any]) => (
                    <div key={table} className="flex justify-between">
                      <span>{table}</span>
                      <span className="font-mono">{count} rows</span>
                    </div>
                  ))}
                </div>
                {restoreResult.errors?.length > 0 && (
                  <p className="text-xs text-destructive">{restoreResult.errors.length} errors</p>
                )}
                <p className="text-xs text-muted-foreground">{t("admin.data.mediaFilesWritten")}: {restoreResult.mediaFilesWritten ?? 0}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{t("admin.data.note")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
function Loader() {
  return <div className="p-8 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
}
function Empty() {
  return <div className="p-8 text-center text-sm text-muted-foreground">No data</div>;
}
function Badge({ children }: any) {
  return <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{children}</span>;
}
