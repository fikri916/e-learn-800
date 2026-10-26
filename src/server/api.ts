import { Router, Request, Response, NextFunction } from "express";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { mkdir, writeFile, stat, readFile } from "fs/promises";
import { randomBytes } from "crypto";
import { validateChain, isAudienceMatch } from "@/lib/academic-chain";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "elearning-secret-31048410";
const MAX_EMBED_BYTES = 50 * 1024 * 1024; // 50 MB
const UPLOADS_DIR = path.resolve(process.cwd(), "public/uploads");

// Allowed upload mime types and limits
const ALLOWED_MIME: Record<string, { ext: string; maxSize: number; kind: string }> = {
  "application/pdf": { ext: "pdf", maxSize: 200 * 1024 * 1024, kind: "pdf" },
  "video/mp4": { ext: "mp4", maxSize: 500 * 1024 * 1024, kind: "video" },
  "video/webm": { ext: "webm", maxSize: 500 * 1024 * 1024, kind: "video" },
  "video/quicktime": { ext: "mov", maxSize: 500 * 1024 * 1024, kind: "video" },
  "image/jpeg": { ext: "jpg", maxSize: 25 * 1024 * 1024, kind: "image" },
  "image/jpg": { ext: "jpg", maxSize: 25 * 1024 * 1024, kind: "image" },
  "image/png": { ext: "png", maxSize: 25 * 1024 * 1024, kind: "image" },
  "image/webp": { ext: "webp", maxSize: 25 * 1024 * 1024, kind: "image" },
  "image/gif": { ext: "gif", maxSize: 25 * 1024 * 1024, kind: "image" },
  "application/msword": { ext: "doc", maxSize: 50 * 1024 * 1024, kind: "document" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    maxSize: 50 * 1024 * 1024,
    kind: "document",
  },
  "application/vnd.ms-excel": { ext: "xls", maxSize: 50 * 1024 * 1024, kind: "document" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    ext: "xlsx",
    maxSize: 50 * 1024 * 1024,
    kind: "document",
  },
  "application/zip": { ext: "zip", maxSize: 100 * 1024 * 1024, kind: "document" },
  "text/plain": { ext: "txt", maxSize: 5 * 1024 * 1024, kind: "document" },
};

// Multer storage engine
const uploadStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const ym = new Date().toISOString().slice(0, 7); // e.g. 2026-10
    const dir = path.join(UPLOADS_DIR, ym);
    await mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const hex = randomBytes(16).toString("hex");
    const allowed = ALLOWED_MIME[file.mimetype];
    const ext = allowed ? allowed.ext : path.extname(file.originalname).slice(1) || "bin";
    cb(null, `${hex}.${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

export async function getSession(req: Request) {
  const token =
    (req as any).cookies?.["next-auth.session-token"] ||
    (req as any).cookies?.["app_session"] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded?.id) return null;
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        universityId: true,
        degreeLevelId: true,
        majorId: true,
        academicYearId: true,
      },
    });

    if (!user || user.status === "SUSPENDED") return null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "STUDENT" | "ADMIN",
        universityId: user.universityId,
        degreeLevelId: user.degreeLevelId,
        majorId: user.majorId,
        academicYearId: user.academicYearId,
      },
      expires: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = await getSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ error: "unauthorized" });
  }
  (req as any).session = session;
  next();
}

async function audit(
  userId: string | undefined,
  action: string,
  entity: string,
  entityId: string | null = null,
  details: string | null = null
) {
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId,
        details,
      },
    });
  } catch (err) {
    console.error("[audit] failed:", err);
  }
}

export function createApiRouter(): Router {
  const router = Router();

  // ────────────────────────────────────────────────────────────
  //  Auth routes
  // ────────────────────────────────────────────────────────────
  const handleSignIn = async (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailNorm = email.toLowerCase().trim();
    // Support "fikriad" alias for admin
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: emailNorm },
          ...(emailNorm === "fikriad" || emailNorm === "fikriad@dalil.local"
            ? [{ email: "adarmouchfikri@gmail.com" }]
            : []),
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status === "SUSPENDED") {
      return res.status(403).json({ error: "ACCOUNT_SUSPENDED" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
    res.cookie("next-auth.session-token", token, {
      httpOnly: true,
      sameSite: isHttps ? "none" : "lax",
      secure: isHttps,
      maxAge: 30 * 24 * 3600 * 1000,
      path: "/",
    });
    res.cookie("app_session", token, {
      httpOnly: false,
      sameSite: isHttps ? "none" : "lax",
      secure: isHttps,
      maxAge: 30 * 24 * 3600 * 1000,
      path: "/",
    });

    await audit(user.id, "LOGIN", "User", user.id, `User signed in: ${user.email}`);

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  };

  router.post("/auth/signin", handleSignIn);
  router.post("/auth/callback/credentials", handleSignIn);

  router.post("/auth/signout", async (req: Request, res: Response) => {
    res.clearCookie("next-auth.session-token", { path: "/" });
    res.clearCookie("app_session", { path: "/" });
    return res.json({ ok: true });
  });

  router.get("/auth/session", async (req: Request, res: Response) => {
    const session = await getSession(req);
    return res.json(session || {});
  });

  router.get("/auth/csrf", (req: Request, res: Response) => {
    return res.json({ csrfToken: "csrf-token-placeholder" });
  });

  router.get("/auth/providers", (req: Request, res: Response) => {
    return res.json({
      credentials: {
        id: "credentials",
        name: "credentials",
        type: "credentials",
      },
    });
  });

  router.post("/auth/register", async (req: Request, res: Response) => {
    const {
      name,
      email,
      password,
      universityId,
      degreeLevelId,
      majorId,
      academicYearId,
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const emailNorm = email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name,
        email: emailNorm,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        universityId: universityId || null,
        degreeLevelId: degreeLevelId || null,
        majorId: majorId || null,
        academicYearId: academicYearId || null,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";
    res.cookie("next-auth.session-token", token, {
      httpOnly: true,
      sameSite: isHttps ? "none" : "lax",
      secure: isHttps,
      maxAge: 30 * 24 * 3600 * 1000,
      path: "/",
    });
    res.cookie("app_session", token, {
      httpOnly: false,
      sameSite: isHttps ? "none" : "lax",
      secure: isHttps,
      maxAge: 30 * 24 * 3600 * 1000,
      path: "/",
    });

    await audit(user.id, "REGISTER", "User", user.id, `New student registered: ${user.email}`);

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  router.post("/auth/password", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "unauthorized" });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords required" });
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Current password incorrect" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await audit(user.id, "PASSWORD_CHANGE", "User", user.id, "User changed own password");
    return res.json({ ok: true });
  });

  // ────────────────────────────────────────────────────────────
  //  User Profile & My Profile
  // ────────────────────────────────────────────────────────────
  router.get("/public/me", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session) return res.json({ user: null });

    const u = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        university: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        degreeLevel: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        major: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        academicYear: { select: { id: true, name: true, nameAr: true, nameFr: true } },
      },
    });

    if (!u) return res.json({ user: null });
    const { passwordHash, ...clean } = u as any;
    return res.json({ user: clean });
  });

  router.patch("/my-profile", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: "unauthorized" });

    const { name, universityId, degreeLevelId, majorId, academicYearId } = req.body || {};
    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name ? { name } : {}),
        universityId: universityId || null,
        degreeLevelId: degreeLevelId || null,
        majorId: majorId || null,
        academicYearId: academicYearId || null,
      },
      include: {
        university: true,
        degreeLevel: true,
        major: true,
        academicYear: true,
      },
    });

    await audit(session.user.id, "PROFILE_UPDATE", "User", session.user.id, "Updated profile");
    const { passwordHash, ...clean } = updated as any;
    return res.json({ ok: true, user: clean });
  });

  // ────────────────────────────────────────────────────────────
  //  Public Academic Navigation
  // ────────────────────────────────────────────────────────────
  router.get("/public/website", async (req: Request, res: Response) => {
    let settings = await db.websiteSettings.findFirst();
    if (!settings) {
      settings = await db.websiteSettings.create({
        data: {
          name: "e-learning",
          description: "A complete university platform for educational materials.",
          defaultLanguage: "ar",
          defaultTheme: "system",
          enabledLanguages: "ar,fr,en",
          allowPublicDirectory: true,
        },
      });
    }
    return res.json({ settings });
  });

  router.get("/public/stats", async (req: Request, res: Response) => {
    try {
      const [universitiesCount, subjectsCount, lessonsCount] = await Promise.all([
        db.university.count({ where: { published: true } }),
        db.subject.count({ where: { published: true } }),
        db.lesson.count({ where: { status: "PUBLISHED" } }),
      ]);
      return res.json({
        universitiesCount,
        subjectsCount,
        lessonsCount,
      });
    } catch {
      return res.json({ universitiesCount: 0, subjectsCount: 0, lessonsCount: 0 });
    }
  });

  router.get("/public/universities", async (req: Request, res: Response) => {
    const universities = await db.university.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { majors: true, lessons: { where: { status: "PUBLISHED" } } } },
      },
    });
    return res.json({ universities });
  });

  router.get("/public/faculties", async (req: Request, res: Response) => {
    const { universityId } = req.query as { universityId?: string };
    if (!universityId) return res.json({ faculties: [] });

    const faculties = await db.faculty.findMany({
      where: { universityId, published: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { majors: { where: { published: true } } } },
      },
    });
    return res.json({ faculties });
  });

  router.get("/public/degrees", async (req: Request, res: Response) => {
    const { universityId, facultyId } = req.query as {
      universityId?: string;
      facultyId?: string;
    };

    if (facultyId) {
      const majors = await db.major.findMany({
        where: { facultyId, published: true },
        select: { degreeLevelId: true },
      });
      const degreeIds = Array.from(new Set(majors.map((m) => m.degreeLevelId)));
      const degrees = await db.degreeLevel.findMany({
        where: { id: { in: degreeIds }, published: true },
        orderBy: { order: "asc" },
      });
      return res.json({ degrees });
    }

    if (universityId) {
      const joins = await db.degreeUniversity.findMany({
        where: { universityId },
        select: { degreeLevelId: true },
      });
      const degreeIds = joins.map((j) => j.degreeLevelId);
      const degrees = await db.degreeLevel.findMany({
        where: { id: { in: degreeIds }, published: true },
        orderBy: { order: "asc" },
      });
      return res.json({ degrees });
    }

    const degrees = await db.degreeLevel.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
    return res.json({ degrees });
  });

  router.get("/public/majors", async (req: Request, res: Response) => {
    const { universityId, degreeLevelId, facultyId } = req.query as Record<string, string>;
    const where: any = { published: true };
    if (universityId) where.universityId = universityId;
    if (degreeLevelId) where.degreeLevelId = degreeLevelId;
    if (facultyId) where.facultyId = facultyId;

    const majors = await db.major.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        faculty: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        degreeLevel: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        _count: { select: { academicYears: true } },
      },
    });
    return res.json({ majors });
  });

  router.get("/public/years", async (req: Request, res: Response) => {
    const { majorId, degreeLevelId } = req.query as Record<string, string>;
    const where: any = { published: true };
    if (majorId) where.majorId = majorId;
    if (degreeLevelId) where.degreeLevelId = degreeLevelId;

    const years = await db.academicYear.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        _count: { select: { semesters: true } },
      },
    });
    return res.json({ years });
  });

  router.get("/public/semesters", async (req: Request, res: Response) => {
    const { academicYearId } = req.query as Record<string, string>;
    const where: any = { published: true };
    if (academicYearId) where.academicYearId = academicYearId;

    const semesters = await db.semester.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        _count: { select: { subjects: true } },
      },
    });
    return res.json({ semesters });
  });

  router.get("/public/subjects", async (req: Request, res: Response) => {
    const { semesterId } = req.query as Record<string, string>;
    const where: any = { published: true };
    if (semesterId) where.semesterId = semesterId;

    const subjects = await db.subject.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        _count: { select: { lessons: { where: { status: "PUBLISHED" } } } },
      },
    });
    return res.json({ subjects });
  });

  router.get("/public/professors", async (req: Request, res: Response) => {
    const { semesterId, subjectId } = req.query as Record<string, string>;
    if (!semesterId) return res.json({ professors: [] });

    let where: any = { semesterId, published: true };
    if (subjectId) {
      // Return professors with >= 1 published lesson in that subject+semester
      const lessons = await db.lesson.findMany({
        where: { subjectId, semesterId, status: "PUBLISHED", professorId: { not: null } },
        select: { professorId: true },
      });
      const profIds = Array.from(
        new Set(lessons.map((l) => l.professorId).filter(Boolean))
      ) as string[];
      where.id = { in: profIds };
    }

    const professors = await db.professor.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            lessons: {
              where: {
                status: "PUBLISHED",
                ...(subjectId ? { subjectId } : {}),
                semesterId,
              },
            },
          },
        },
      },
    });
    return res.json({ professors });
  });

  router.get("/public/lessons", async (req: Request, res: Response) => {
    const { subjectId, professorId } = req.query as Record<string, string>;
    const where: any = { status: "PUBLISHED" };
    if (subjectId) where.subjectId = subjectId;
    if (professorId) where.professorId = professorId;

    const lessons = await db.lesson.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        professor: { select: { id: true, name: true, nameAr: true, nameFr: true, photo: true } },
        _count: { select: { contentBlocks: true } },
      },
    });
    return res.json({ lessons });
  });

  router.get("/public/lesson", async (req: Request, res: Response) => {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).json({ error: "id required" });

    const session = await getSession(req);

    const lesson = await db.lesson.findUnique({
      where: { id },
      include: {
        university: true,
        degreeLevel: true,
        major: true,
        academicYear: true,
        semester: true,
        subject: true,
        professor: true,
        contentBlocks: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    // Mark recently viewed if student logged in
    if (session?.user?.id) {
      try {
        await db.recentlyViewed.deleteMany({
          where: { userId: session.user.id, lessonId: lesson.id },
        });
        await db.recentlyViewed.create({
          data: { userId: session.user.id, lessonId: lesson.id },
        });
      } catch (err) {
        console.error("recentlyViewed failed:", err);
      }
    }

    // Prev / Next / Related lessons in same subject
    const [prev, next, related] = await Promise.all([
      db.lesson.findFirst({
        where: {
          subjectId: lesson.subjectId,
          status: "PUBLISHED",
          order: { lt: lesson.order },
        },
        orderBy: { order: "desc" },
        select: { id: true, title: true, titleAr: true, titleFr: true },
      }),
      db.lesson.findFirst({
        where: {
          subjectId: lesson.subjectId,
          status: "PUBLISHED",
          order: { gt: lesson.order },
        },
        orderBy: { order: "asc" },
        select: { id: true, title: true, titleAr: true, titleFr: true },
      }),
      db.lesson.findMany({
        where: {
          subjectId: lesson.subjectId,
          status: "PUBLISHED",
          id: { not: lesson.id },
        },
        take: 4,
        select: {
          id: true,
          title: true,
          titleAr: true,
          titleFr: true,
          thumbnail: true,
          professor: { select: { name: true, nameAr: true, nameFr: true } },
        },
      }),
    ]);

    return res.json({ lesson, prev, next, related });
  });

  router.get("/public/search", async (req: Request, res: Response) => {
    const raw = ((req.query.q as string) || "").trim();
    if (!raw) {
      return res.json({ universities: [], faculties: [], majors: [], subjects: [], lessons: [] });
    }

    // Generate query term variants for Arabic text flexibility
    const terms = Array.from(
      new Set([
        raw,
        raw.replace(/[أإآ]/g, "ا"),
        raw.replace(/ا/g, "أ"),
        raw.replace(/ا/g, "آ"),
        raw.replace(/ى/g, "ي"),
        raw.replace(/ي/g, "ى"),
        raw.replace(/ة/g, "ه"),
        raw.replace(/ه/g, "ة"),
      ])
    ).filter((t) => t.length > 0);

    const makeOr = (fields: string[]) => {
      const orList: any[] = [];
      for (const t of terms) {
        for (const f of fields) {
          orList.push({ [f]: { contains: t } });
        }
      }
      return orList;
    };

    const [universities, faculties, majors, subjects, lessons] = await Promise.all([
      db.university.findMany({
        where: {
          published: true,
          OR: makeOr(["name", "nameAr", "nameFr", "city"]),
        },
        take: 5,
      }),
      db.faculty.findMany({
        where: {
          published: true,
          OR: makeOr(["name", "nameAr", "nameFr"]),
        },
        include: {
          university: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        },
        take: 5,
      }),
      db.major.findMany({
        where: {
          published: true,
          OR: makeOr(["name", "nameAr", "nameFr"]),
        },
        include: {
          university: { select: { id: true, name: true, nameAr: true, nameFr: true } },
          faculty: { select: { id: true, name: true, nameAr: true, nameFr: true } },
          degreeLevel: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        },
        take: 5,
      }),
      db.subject.findMany({
        where: {
          published: true,
          OR: makeOr(["name", "nameAr", "nameFr"]),
        },
        include: {
          semester: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              nameFr: true,
              academicYear: {
                select: {
                  id: true,
                  name: true,
                  major: {
                    select: {
                      id: true,
                      universityId: true,
                      facultyId: true,
                      degreeLevelId: true,
                    },
                  },
                },
              },
            },
          },
          _count: { select: { lessons: { where: { status: "PUBLISHED" } } } },
        },
        take: 5,
      }),
      db.lesson.findMany({
        where: {
          status: "PUBLISHED",
          OR: makeOr(["title", "titleAr", "titleFr", "description"]),
        },
        include: {
          subject: { select: { id: true, name: true, nameAr: true, nameFr: true } },
          professor: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        },
        take: 8,
      }),
    ]);

    return res.json({ universities, faculties, majors, subjects, lessons });
  });

  router.get("/public/favorite", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session?.user?.id) return res.json({ favorites: [] });

    const favs = await db.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        lesson: {
          include: {
            subject: { select: { id: true, name: true, nameAr: true, nameFr: true } },
            professor: { select: { id: true, name: true, nameAr: true, nameFr: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ favorites: favs });
  });

  router.post("/public/favorite", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: "unauthorized" });

    const { lessonId } = req.body || {};
    if (!lessonId) return res.status(400).json({ error: "lessonId required" });

    const existing = await db.favorite.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
    });

    if (existing) {
      await db.favorite.delete({
        where: { userId_lessonId: { userId: session.user.id, lessonId } },
      });
      return res.json({ ok: true, favorited: false });
    } else {
      await db.favorite.create({
        data: { userId: session.user.id, lessonId },
      });
      return res.json({ ok: true, favorited: true });
    }
  });

  router.get("/public/recently-viewed", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session?.user?.id) return res.json({ recent: [] });

    const recent = await db.recentlyViewed.findMany({
      where: { userId: session.user.id },
      include: {
        lesson: {
          include: {
            subject: { select: { id: true, name: true, nameAr: true, nameFr: true } },
            professor: { select: { id: true, name: true, nameAr: true, nameFr: true } },
          },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 10,
    });
    return res.json({ recent });
  });

  router.get("/public/notifications", async (req: Request, res: Response) => {
    const session = await getSession(req);
    const now = new Date();

    const notifs = await db.notification.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ publishAt: null }, { publishAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      orderBy: { createdAt: "desc" },
    });

    let dismissedIds: string[] = [];
    if (session?.user?.id) {
      const dismissals = await db.notificationDismissal.findMany({
        where: { userId: session.user.id },
        select: { notificationId: true },
      });
      dismissedIds = dismissals.map((d) => d.notificationId);
    }

    const filtered = notifs.filter((n) => {
      if (dismissedIds.includes(n.id) && !n.showEveryVisit) return false;
      return isAudienceMatch(n.audienceType, n.targetIds, session?.user || null);
    });

    return res.json({ notifications: filtered });
  });

  router.post("/public/dismiss-notif", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: "unauthorized" });

    const { notificationId } = req.body || {};
    if (!notificationId) return res.status(400).json({ error: "notificationId required" });

    try {
      await db.notificationDismissal.create({
        data: { userId: session.user.id, notificationId },
      });
    } catch {}
    return res.json({ ok: true });
  });

  router.get("/public/ads", async (req: Request, res: Response) => {
    const session = await getSession(req);
    const { type } = req.query as { type?: string };
    const now = new Date();

    const where: any = {
      status: "PUBLISHED",
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    };
    if (type) where.type = type;

    const ads = await db.ad.findMany({
      where,
      orderBy: { order: "asc" },
    });

    let dismissedIds: string[] = [];
    if (session?.user?.id) {
      const dismissals = await db.adDismissal.findMany({
        where: { userId: session.user.id },
        select: { adId: true },
      });
      dismissedIds = dismissals.map((d) => d.adId);
    }

    const filtered = ads.filter((ad) => {
      if (dismissedIds.includes(ad.id) && !ad.showEveryLogin) return false;
      return isAudienceMatch(ad.audienceType, ad.targetIds, session?.user || null);
    });

    return res.json({ ads: filtered });
  });

  router.post("/public/dismiss-ad", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: "unauthorized" });

    const { adId } = req.body || {};
    if (!adId) return res.status(400).json({ error: "adId required" });

    try {
      await db.adDismissal.create({
        data: { userId: session.user.id, adId },
      });
    } catch {}
    return res.json({ ok: true });
  });

  // ────────────────────────────────────────────────────────────
  //  File Upload
  // ────────────────────────────────────────────────────────────
  router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const allowed = ALLOWED_MIME[file.mimetype];
    const kind = allowed ? allowed.kind : "document";

    const relPath = path.relative(path.resolve(process.cwd(), "public"), file.path).replace(/\\/g, "/");
    const webPath = `/${relPath}`;

    const media = await db.mediaFile.create({
      data: {
        filename: path.basename(file.path),
        originalName: file.originalname,
        path: webPath,
        mimeType: file.mimetype,
        size: file.size,
        type: kind,
      },
    });

    await audit(session.user.id, "FILE_UPLOAD", "MediaFile", media.id, file.originalname);

    return res.json({ ok: true, file: media });
  });

  router.get("/upload", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const files = await db.mediaFile.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ files });
  });

  router.delete("/upload", async (req: Request, res: Response) => {
    const session = await getSession(req);
    if (!session || session.user.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });

    const media = await db.mediaFile.findUnique({ where: { id } });
    if (media) {
      try {
        const abs = path.join(process.cwd(), "public", media.path);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      } catch {}
      await db.mediaFile.delete({ where: { id } });
      await audit(session.user.id, "FILE_DELETE", "MediaFile", id, media.filename);
    }
    return res.json({ ok: true });
  });

  // ────────────────────────────────────────────────────────────
  //  Admin API routes (guarded by requireAdmin)
  // ────────────────────────────────────────────────────────────
  router.use("/admin", requireAdmin);

  // Overview stats
  router.get("/admin/stats", async (req: Request, res: Response) => {
    const [
      users,
      universities,
      majors,
      years,
      semesters,
      subjects,
      publishedLessons,
      files,
      notifications,
      recentUsers,
      recentLessons,
    ] = await Promise.all([
      db.user.count(),
      db.university.count(),
      db.major.count(),
      db.academicYear.count(),
      db.semester.count(),
      db.subject.count(),
      db.lesson.count({ where: { status: "PUBLISHED" } }),
      db.mediaFile.count(),
      db.notification.count(),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      }),
      db.lesson.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          subject: { select: { name: true, nameAr: true, nameFr: true } },
          professor: { select: { name: true, nameAr: true, nameFr: true } },
        },
      }),
    ]);

    return res.json({
      stats: {
        users,
        universities,
        majors,
        years,
        semesters,
        subjects,
        publishedLessons,
        files,
        notifications,
        totalUsers: users,
        totalStudents: await db.user.count({ where: { role: "STUDENT" } }),
        totalUniversities: universities,
        totalMajors: majors,
        totalYears: years,
        totalSemesters: semesters,
        totalSubjects: subjects,
        totalPublishedLessons: publishedLessons,
        totalLessons: await db.lesson.count(),
        totalMedia: files,
        totalActiveNotifications: notifications,
        recentRegistrations: recentUsers,
        recentLessons: recentLessons,
      },
      recentUsers,
      recentLessons,
    });
  });

  // Users management
  router.get("/admin/users", async (req: Request, res: Response) => {
    const { q, role, status, universityId } = req.query as Record<string, string>;
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (universityId) where.universityId = universityId;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        university: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        degreeLevel: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        major: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        academicYear: { select: { id: true, name: true, nameAr: true, nameFr: true } },
      },
    });

    const clean = users.map(({ passwordHash, ...rest }) => rest);
    return res.json({ users: clean });
  });

  router.patch("/admin/users", async (req: Request, res: Response) => {
    const { id, role, status, universityId, degreeLevelId, majorId, academicYearId } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    // Last-admin protection
    if (role && role !== "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      const current = await db.user.findUnique({ where: { id } });
      if (current?.role === "ADMIN" && adminCount <= 1) {
        return res.status(400).json({ error: "Cannot demote the only remaining admin" });
      }
    }

    const data: any = {};
    if (role) data.role = role;
    if (status) data.status = status;
    if ("universityId" in req.body) data.universityId = universityId || null;
    if ("degreeLevelId" in req.body) data.degreeLevelId = degreeLevelId || null;
    if ("majorId" in req.body) data.majorId = majorId || null;
    if ("academicYearId" in req.body) data.academicYearId = academicYearId || null;

    const user = await db.user.update({ where: { id }, data });
    await audit((req as any).session.user.id, "USER_UPDATE", "User", id, JSON.stringify(data));
    return res.json({ ok: true, user });
  });

  router.delete("/admin/users", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });

    // Last-admin protection
    const current = await db.user.findUnique({ where: { id } });
    if (current?.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the only remaining admin" });
      }
    }

    await db.user.delete({ where: { id } });
    await audit((req as any).session.user.id, "USER_DELETE", "User", id, current?.email || null);
    return res.json({ ok: true });
  });

  // Universities CRUD
  router.get("/admin/universities", async (req: Request, res: Response) => {
    const universities = await db.university.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        degreeUniversities: { select: { degreeLevelId: true } },
        _count: { select: { faculties: true, majors: true, lessons: true } },
      },
    });
    const mapped = universities.map((u: any) => ({
      ...u,
      degrees: u.degreeUniversities || [],
      degreeIds: (u.degreeUniversities || []).map((d: any) => d.degreeLevelId),
    }));
    return res.json({ universities: mapped });
  });

  router.post("/admin/universities", async (req: Request, res: Response) => {
    const b = req.body;
    const u = await db.university.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        description: b.description || null,
        descriptionAr: b.descriptionAr || null,
        descriptionFr: b.descriptionFr || null,
        city: b.city || null,
        logo: b.logo || null,
        coverImage: b.coverImage || null,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    if (Array.isArray(b.degreeIds) && b.degreeIds.length > 0) {
      await db.degreeUniversity.createMany({
        data: b.degreeIds.map((degreeLevelId: string) => ({ universityId: u.id, degreeLevelId })),
      });
    }
    await audit((req as any).session.user.id, "CREATE", "University", u.id, u.name);
    return res.json({ ok: true, university: u });
  });

  router.patch("/admin/universities", async (req: Request, res: Response) => {
    const { id, degreeIds, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr", "description", "descriptionAr", "descriptionFr", "city", "logo", "coverImage"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    if (Array.isArray(degreeIds)) {
      await db.degreeUniversity.deleteMany({ where: { universityId: id } });
      if (degreeIds.length) {
        await db.degreeUniversity.createMany({
          data: degreeIds.map((degreeLevelId: string) => ({ universityId: id, degreeLevelId })),
        });
      }
    }

    const u = await db.university.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "University", id, u.name);
    return res.json({ ok: true, university: u });
  });

  router.delete("/admin/universities", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.university.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "University", id);
    return res.json({ ok: true });
  });

  // Faculties CRUD
  router.get("/admin/faculties", async (req: Request, res: Response) => {
    const { universityId } = req.query as { universityId?: string };
    const where: any = {};
    if (universityId) where.universityId = universityId;

    const faculties = await db.faculty.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        university: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        _count: { select: { majors: true } },
      },
    });
    return res.json({ faculties });
  });

  router.post("/admin/faculties", async (req: Request, res: Response) => {
    const b = req.body;
    const f = await db.faculty.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        universityId: b.universityId,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    await audit((req as any).session.user.id, "CREATE", "Faculty", f.id, f.name);
    return res.json({ ok: true, faculty: f });
  });

  router.patch("/admin/faculties", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr", "universityId"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    const f = await db.faculty.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "Faculty", id, f.name);
    return res.json({ ok: true, faculty: f });
  });

  router.delete("/admin/faculties", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.faculty.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "Faculty", id);
    return res.json({ ok: true });
  });

  // Degree Levels CRUD
  router.get("/admin/degrees", async (req: Request, res: Response) => {
    const degrees = await db.degreeLevel.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        degreeUniversities: { select: { universityId: true } },
        _count: { select: { majors: true } },
      },
    });
    const mapped = degrees.map((d: any) => ({
      ...d,
      universities: d.degreeUniversities || [],
      universityIds: (d.degreeUniversities || []).map((u: any) => u.universityId),
    }));
    return res.json({ degrees: mapped });
  });

  router.post("/admin/degrees", async (req: Request, res: Response) => {
    const b = req.body;
    const d = await db.degreeLevel.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    if (Array.isArray(b.universityIds) && b.universityIds.length > 0) {
      await db.degreeUniversity.createMany({
        data: b.universityIds.map((universityId: string) => ({ degreeLevelId: d.id, universityId })),
      });
    }
    await audit((req as any).session.user.id, "CREATE", "DegreeLevel", d.id, d.name);
    return res.json({ ok: true, degree: d });
  });

  router.patch("/admin/degrees", async (req: Request, res: Response) => {
    const { id, universityIds, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    if (Array.isArray(universityIds)) {
      await db.degreeUniversity.deleteMany({ where: { degreeLevelId: id } });
      if (universityIds.length) {
        await db.degreeUniversity.createMany({
          data: universityIds.map((universityId: string) => ({ degreeLevelId: id, universityId })),
        });
      }
    }

    const d = await db.degreeLevel.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "DegreeLevel", id, d.name);
    return res.json({ ok: true, degree: d });
  });

  router.delete("/admin/degrees", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.degreeLevel.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "DegreeLevel", id);
    return res.json({ ok: true });
  });

  // Majors CRUD
  router.get("/admin/majors", async (req: Request, res: Response) => {
    const { universityId, degreeLevelId, facultyId } = req.query as Record<string, string>;
    const where: any = {};
    if (universityId) where.universityId = universityId;
    if (degreeLevelId) where.degreeLevelId = degreeLevelId;
    if (facultyId) where.facultyId = facultyId;

    const majors = await db.major.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        university: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        degreeLevel: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        faculty: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        _count: { select: { academicYears: true, lessons: true } },
      },
    });
    return res.json({ majors });
  });

  router.post("/admin/majors", async (req: Request, res: Response) => {
    const b = req.body;
    const m = await db.major.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        description: b.description || null,
        descriptionAr: b.descriptionAr || null,
        descriptionFr: b.descriptionFr || null,
        coverImage: b.coverImage || null,
        universityId: b.universityId,
        degreeLevelId: b.degreeLevelId,
        facultyId: b.facultyId || null,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    await audit((req as any).session.user.id, "CREATE", "Major", m.id, m.name);
    return res.json({ ok: true, major: m });
  });

  router.patch("/admin/majors", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr", "description", "descriptionAr", "descriptionFr", "coverImage", "universityId", "degreeLevelId", "facultyId"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    const m = await db.major.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "Major", id, m.name);
    return res.json({ ok: true, major: m });
  });

  router.delete("/admin/majors", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.major.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "Major", id);
    return res.json({ ok: true });
  });

  // Academic Years CRUD
  router.get("/admin/years", async (req: Request, res: Response) => {
    const { majorId } = req.query as { majorId?: string };
    const where: any = {};
    if (majorId) where.majorId = majorId;

    const years = await db.academicYear.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        major: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        degreeLevel: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        _count: { select: { semesters: true, lessons: true } },
      },
    });
    return res.json({ years });
  });

  router.post("/admin/years", async (req: Request, res: Response) => {
    const b = req.body;
    const y = await db.academicYear.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        majorId: b.majorId,
        degreeLevelId: b.degreeLevelId,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    await audit((req as any).session.user.id, "CREATE", "AcademicYear", y.id, y.name);
    return res.json({ ok: true, year: y });
  });

  router.patch("/admin/years", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr", "majorId", "degreeLevelId"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    const y = await db.academicYear.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "AcademicYear", id, y.name);
    return res.json({ ok: true, year: y });
  });

  router.delete("/admin/years", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.academicYear.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "AcademicYear", id);
    return res.json({ ok: true });
  });

  // Semesters CRUD
  router.get("/admin/semesters", async (req: Request, res: Response) => {
    const { academicYearId } = req.query as { academicYearId?: string };
    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;

    const semesters = await db.semester.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        academicYear: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        _count: { select: { subjects: true, lessons: true, professors: true } },
      },
    });
    return res.json({ semesters });
  });

  router.post("/admin/semesters", async (req: Request, res: Response) => {
    const b = req.body;
    const s = await db.semester.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        academicYearId: b.academicYearId,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    await audit((req as any).session.user.id, "CREATE", "Semester", s.id, s.name);
    return res.json({ ok: true, semester: s });
  });

  router.patch("/admin/semesters", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr", "academicYearId"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    const s = await db.semester.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "Semester", id, s.name);
    return res.json({ ok: true, semester: s });
  });

  router.delete("/admin/semesters", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.semester.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "Semester", id);
    return res.json({ ok: true });
  });

  // Professors CRUD
  router.get("/admin/professors", async (req: Request, res: Response) => {
    const { semesterId } = req.query as { semesterId?: string };
    const where: any = {};
    if (semesterId) where.semesterId = semesterId;

    const professors = await db.professor.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        semester: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        _count: { select: { lessons: true } },
      },
    });
    return res.json({ professors });
  });

  router.post("/admin/professors", async (req: Request, res: Response) => {
    const b = req.body;
    const p = await db.professor.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        bio: b.bio || null,
        bioAr: b.bioAr || null,
        bioFr: b.bioFr || null,
        photo: b.photo || null,
        email: b.email || null,
        semesterId: b.semesterId,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    await audit((req as any).session.user.id, "CREATE", "Professor", p.id, p.name);
    return res.json({ ok: true, professor: p });
  });

  router.patch("/admin/professors", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr", "bio", "bioAr", "bioFr", "photo", "email", "semesterId"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    const p = await db.professor.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "Professor", id, p.name);
    return res.json({ ok: true, professor: p });
  });

  router.delete("/admin/professors", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.professor.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "Professor", id);
    return res.json({ ok: true });
  });

  // Subjects CRUD
  router.get("/admin/subjects", async (req: Request, res: Response) => {
    const { semesterId } = req.query as { semesterId?: string };
    const where: any = {};
    if (semesterId) where.semesterId = semesterId;

    const subjects = await db.subject.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        semester: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        _count: { select: { lessons: true } },
      },
    });
    return res.json({ subjects });
  });

  router.post("/admin/subjects", async (req: Request, res: Response) => {
    const b = req.body;
    const s = await db.subject.create({
      data: {
        name: b.name,
        nameAr: b.nameAr || null,
        nameFr: b.nameFr || null,
        description: b.description || null,
        descriptionAr: b.descriptionAr || null,
        descriptionFr: b.descriptionFr || null,
        coverImage: b.coverImage || null,
        semesterId: b.semesterId,
        published: b.published ?? true,
        order: Number(b.order ?? 0),
      },
    });
    await audit((req as any).session.user.id, "CREATE", "Subject", s.id, s.name);
    return res.json({ ok: true, subject: s });
  });

  router.patch("/admin/subjects", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["name", "nameAr", "nameFr", "description", "descriptionAr", "descriptionFr", "coverImage", "semesterId"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("published" in b) data.published = b.published;
    if ("order" in b) data.order = Number(b.order);

    const s = await db.subject.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "Subject", id, s.name);
    return res.json({ ok: true, subject: s });
  });

  router.delete("/admin/subjects", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.subject.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "Subject", id);
    return res.json({ ok: true });
  });

  // Lessons CRUD with chain validation & content blocks
  router.get("/admin/lessons", async (req: Request, res: Response) => {
    const {
      universityId,
      degreeLevelId,
      majorId,
      academicYearId,
      semesterId,
      subjectId,
      status,
      q,
    } = req.query as Record<string, string>;

    const where: any = {};
    if (universityId) where.universityId = universityId;
    if (degreeLevelId) where.degreeLevelId = degreeLevelId;
    if (majorId) where.majorId = majorId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (semesterId) where.semesterId = semesterId;
    if (subjectId) where.subjectId = subjectId;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { titleAr: { contains: q } },
        { titleFr: { contains: q } },
      ];
    }

    const lessons = await db.lesson.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        university: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        degreeLevel: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        major: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        academicYear: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        semester: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        subject: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        professor: { select: { id: true, name: true, nameAr: true, nameFr: true } },
        contentBlocks: { orderBy: { order: "asc" } },
        _count: { select: { contentBlocks: true } },
      },
    });

    return res.json({ lessons });
  });

  router.post("/admin/lessons", async (req: Request, res: Response) => {
    const body = req.body;
    const valid = await validateChain(body);
    if (!valid.ok) {
      return res.status(400).json({ error: valid.error });
    }

    const lesson = await db.lesson.create({
      data: {
        title: body.title,
        titleAr: body.titleAr || null,
        titleFr: body.titleFr || null,
        description: body.description || null,
        descriptionAr: body.descriptionAr || null,
        descriptionFr: body.descriptionFr || null,
        thumbnail: body.thumbnail || null,
        status: body.status || "DRAFT",
        order: Number(body.order ?? 0),
        universityId: body.universityId,
        degreeLevelId: body.degreeLevelId,
        majorId: body.majorId,
        academicYearId: body.academicYearId,
        semesterId: body.semesterId,
        subjectId: body.subjectId,
        professorId: body.professorId || null,
        contentBlocks: body.contentBlocks?.length
          ? {
              create: body.contentBlocks.map((b: any, i: number) => ({
                order: b.order ?? i,
                type: b.type,
                title: b.title || null,
                content: b.content || null,
                mediaPath: b.mediaPath || null,
                mediaPaths: b.mediaPaths ? JSON.stringify(b.mediaPaths) : null,
                downloadable: b.downloadable ?? true,
              })),
            }
          : undefined,
      },
      include: { contentBlocks: true },
    });

    await audit((req as any).session.user.id, "LESSON_CREATE", "Lesson", lesson.id, lesson.title);
    return res.json({ ok: true, lesson });
  });

  router.patch("/admin/lessons", async (req: Request, res: Response) => {
    const { id, contentBlocks, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    if (
      rest.subjectId ||
      rest.semesterId ||
      rest.academicYearId ||
      rest.majorId ||
      rest.degreeLevelId ||
      rest.universityId
    ) {
      const merged = { ...rest, id };
      const valid = await validateChain(merged);
      if (!valid.ok) return res.status(400).json({ error: valid.error });
    }

    const data: any = {};
    for (const k of [
      "title",
      "titleAr",
      "titleFr",
      "description",
      "descriptionAr",
      "descriptionFr",
      "thumbnail",
      "universityId",
      "degreeLevelId",
      "majorId",
      "academicYearId",
      "semesterId",
      "subjectId",
      "professorId",
    ]) {
      if (k in rest) data[k] = rest[k] === "" ? null : rest[k];
    }
    if ("status" in rest) data.status = rest.status;
    if ("order" in rest) data.order = Number(rest.order);

    const lesson = await db.lesson.update({ where: { id }, data, include: { contentBlocks: true } });

    if (Array.isArray(contentBlocks)) {
      await db.lessonContentBlock.deleteMany({ where: { lessonId: id } });
      if (contentBlocks.length) {
        await db.lessonContentBlock.createMany({
          data: contentBlocks.map((b: any, i: number) => ({
            lessonId: id,
            order: b.order ?? i,
            type: b.type,
            title: b.title || null,
            content: b.content || null,
            mediaPath: b.mediaPath || null,
            mediaPaths: b.mediaPaths ? JSON.stringify(b.mediaPaths) : null,
            downloadable: b.downloadable ?? true,
          })),
        });
      }
      lesson.contentBlocks = await db.lessonContentBlock.findMany({
        where: { lessonId: id },
        orderBy: { order: "asc" },
      });
    }

    await audit(
      (req as any).session.user.id,
      "LESSON_UPDATE",
      "Lesson",
      id,
      JSON.stringify({ title: data.title, status: data.status })
    );
    return res.json({ ok: true, lesson });
  });

  router.delete("/admin/lessons", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.lesson.delete({ where: { id } });
    await audit((req as any).session.user.id, "LESSON_DELETE", "Lesson", id);
    return res.json({ ok: true });
  });

  // Media Library
  router.get("/admin/media", async (req: Request, res: Response) => {
    const media = await db.mediaFile.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ media });
  });

  router.delete("/admin/media", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });

    const m = await db.mediaFile.findUnique({ where: { id } });
    if (m) {
      try {
        const abs = path.join(process.cwd(), "public", m.path);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      } catch {}
      await db.mediaFile.delete({ where: { id } });
      await audit((req as any).session.user.id, "MEDIA_DELETE", "MediaFile", id, m.filename);
    }
    return res.json({ ok: true });
  });

  // Notifications CRUD
  router.get("/admin/notifications", async (req: Request, res: Response) => {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ notifications });
  });

  router.post("/admin/notifications", async (req: Request, res: Response) => {
    const b = req.body;
    const n = await db.notification.create({
      data: {
        title: b.title,
        content: b.content,
        imageUrl: b.imageUrl || null,
        audienceType: b.audienceType || "ALL",
        targetIds: b.targetIds || null,
        showEveryVisit: b.showEveryVisit ?? false,
        status: b.status || "PUBLISHED",
        publishAt: b.publishAt ? new Date(b.publishAt) : null,
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
      },
    });
    await audit((req as any).session.user.id, "CREATE", "Notification", n.id, n.title);
    return res.json({ ok: true, notification: n });
  });

  router.patch("/admin/notifications", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of ["title", "content", "imageUrl", "audienceType", "targetIds", "status"]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("showEveryVisit" in b) data.showEveryVisit = b.showEveryVisit;
    if ("publishAt" in b) data.publishAt = b.publishAt ? new Date(b.publishAt) : null;
    if ("expiresAt" in b) data.expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;

    const n = await db.notification.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "Notification", id, n.title);
    return res.json({ ok: true, notification: n });
  });

  router.delete("/admin/notifications", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.notification.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "Notification", id);
    return res.json({ ok: true });
  });

  // Ads CRUD
  router.get("/admin/ads", async (req: Request, res: Response) => {
    const { type } = req.query as { type?: string };
    const where: any = {};
    if (type) where.type = type;

    const ads = await db.ad.findMany({
      where,
      orderBy: { order: "asc" },
    });
    return res.json({ ads });
  });

  router.post("/admin/ads", async (req: Request, res: Response) => {
    const b = req.body;
    const ad = await db.ad.create({
      data: {
        title: b.title,
        content: b.content,
        type: b.type || "POPUP",
        imageUrl: b.imageUrl || null,
        imageMobile: b.imageMobile || null,
        imageDesktop: b.imageDesktop || null,
        linkUrl: b.linkUrl || null,
        linkTarget: b.linkTarget || "_blank",
        audienceType: b.audienceType || "ALL",
        targetIds: b.targetIds || null,
        dismissible: b.dismissible ?? true,
        showEveryLogin: b.showEveryLogin ?? false,
        status: b.status || "PUBLISHED",
        publishAt: b.publishAt ? new Date(b.publishAt) : null,
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
        order: Number(b.order ?? 0),
      },
    });
    await audit((req as any).session.user.id, "CREATE", "Ad", ad.id, ad.title);
    return res.json({ ok: true, ad });
  });

  router.patch("/admin/ads", async (req: Request, res: Response) => {
    const { id, ...b } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });

    const data: any = {};
    for (const k of [
      "title",
      "content",
      "type",
      "imageUrl",
      "imageMobile",
      "imageDesktop",
      "linkUrl",
      "linkTarget",
      "audienceType",
      "targetIds",
      "status",
    ]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("dismissible" in b) data.dismissible = b.dismissible;
    if ("showEveryLogin" in b) data.showEveryLogin = b.showEveryLogin;
    if ("publishAt" in b) data.publishAt = b.publishAt ? new Date(b.publishAt) : null;
    if ("expiresAt" in b) data.expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;
    if ("order" in b) data.order = Number(b.order);

    const ad = await db.ad.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "Ad", id, ad.title);
    return res.json({ ok: true, ad });
  });

  router.delete("/admin/ads", async (req: Request, res: Response) => {
    const id = (req.query.id as string) || req.body.id;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.ad.delete({ where: { id } });
    await audit((req as any).session.user.id, "DELETE", "Ad", id);
    return res.json({ ok: true });
  });

  // Settings & Branding
  router.get("/admin/settings", async (req: Request, res: Response) => {
    let settings = await db.websiteSettings.findFirst();
    if (!settings) {
      settings = await db.websiteSettings.create({
        data: {
          name: "e-learning",
          description: "A complete university platform for educational materials.",
          defaultLanguage: "ar",
          defaultTheme: "system",
          enabledLanguages: "ar,fr,en",
          allowPublicDirectory: true,
        },
      });
    }
    return res.json({ settings });
  });

  router.patch("/admin/settings", async (req: Request, res: Response) => {
    let settings = await db.websiteSettings.findFirst();
    const id = settings?.id;
    if (!id) return res.status(404).json({ error: "Settings not found" });

    const b = req.body;
    const data: any = {};
    for (const k of [
      "name",
      "logo",
      "coverImage",
      "description",
      "footerText",
      "contactEmail",
      "defaultLanguage",
      "defaultTheme",
      "enabledLanguages",
    ]) {
      if (k in b) data[k] = b[k] === "" ? null : b[k];
    }
    if ("allowPublicDirectory" in b) data.allowPublicDirectory = b.allowPublicDirectory;

    settings = await db.websiteSettings.update({ where: { id }, data });
    await audit((req as any).session.user.id, "UPDATE", "WebsiteSettings", id, "Settings updated");
    return res.json({ ok: true, settings });
  });

  // Security (own password)
  router.post("/admin/security", async (req: Request, res: Response) => {
    const session = (req as any).session;
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both passwords required" });
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) return res.status(404).json({ error: "Admin user not found" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Current password incorrect" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await audit(user.id, "PASSWORD_CHANGE", "User", user.id, "Admin changed password");
    return res.json({ ok: true });
  });

  // Audit logs
  router.get("/admin/audit", async (req: Request, res: Response) => {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json({ logs });
  });

  // Data backup
  router.get("/admin/backup", async (req: Request, res: Response) => {
    const [
      users,
      universities,
      faculties,
      degreeLevels,
      degreeUniversities,
      majors,
      academicYears,
      semesters,
      subjects,
      professors,
      lessons,
      lessonContentBlocks,
      mediaFiles,
      notifications,
      notificationDismissals,
      favorites,
      recentlyViewed,
      websiteSettings,
      auditLogs,
      ads,
      adDismissals,
    ] = await Promise.all([
      db.user.findMany(),
      db.university.findMany(),
      db.faculty.findMany(),
      db.degreeLevel.findMany(),
      db.degreeUniversity.findMany(),
      db.major.findMany(),
      db.academicYear.findMany(),
      db.semester.findMany(),
      db.subject.findMany(),
      db.professor.findMany(),
      db.lesson.findMany(),
      db.lessonContentBlock.findMany(),
      db.mediaFile.findMany(),
      db.notification.findMany(),
      db.notificationDismissal.findMany(),
      db.favorite.findMany(),
      db.recentlyViewed.findMany(),
      db.websiteSettings.findMany(),
      db.auditLog.findMany(),
      db.ad.findMany(),
      db.adDismissal.findMany(),
    ]);

    const mediaBlobs: Record<string, string> = {};
    const skippedFiles: { path: string; size: number; reason: string }[] = [];

    await Promise.all(
      mediaFiles.map(async (m) => {
        if (!m.path || !m.path.startsWith("/uploads/")) return;
        try {
          const abs = path.join(process.cwd(), "public", m.path);
          const info = await stat(abs);
          if (info.size > MAX_EMBED_BYTES) {
            skippedFiles.push({ path: m.path, size: info.size, reason: "too_large" });
          } else {
            const buf = await readFile(abs);
            mediaBlobs[m.path] = buf.toString("base64");
          }
        } catch {
          skippedFiles.push({ path: m.path, size: 0, reason: "missing_on_disk" });
        }
      })
    );

    const payload = {
      version: 2,
      platform: "e-learning",
      exportedAt: new Date().toISOString(),
      counts: {
        users: users.length,
        universities: universities.length,
        faculties: faculties.length,
        degreeLevels: degreeLevels.length,
        degreeUniversities: degreeUniversities.length,
        majors: majors.length,
        academicYears: academicYears.length,
        semesters: semesters.length,
        subjects: subjects.length,
        professors: professors.length,
        lessons: lessons.length,
        lessonContentBlocks: lessonContentBlocks.length,
        mediaFiles: mediaFiles.length,
        favorites: favorites.length,
        recentlyViewed: recentlyViewed.length,
        notifications: notifications.length,
        notificationDismissals: notificationDismissals.length,
        ads: ads.length,
        adDismissals: adDismissals.length,
        websiteSettings: websiteSettings.length,
        auditLogs: auditLogs.length,
      },
      tables: {
        users,
        universities,
        faculties,
        degreeLevels,
        degreeUniversities,
        majors,
        academicYears,
        semesters,
        subjects,
        professors,
        lessons,
        lessonContentBlocks,
        mediaFiles,
        favorites,
        recentlyViewed,
        notifications,
        notificationDismissals,
        ads,
        adDismissals,
        websiteSettings,
        auditLogs,
      },
      mediaBlobs,
      skippedFiles,
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="e-learning-backup-${dateStr}.json"`
    );
    return res.send(JSON.stringify(payload, null, 2));
  });

  // Data restore
  router.post("/admin/backup/restore", memoryUpload.single("file"), async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    let backup: any;
    try {
      backup = JSON.parse(file.buffer.toString("utf-8"));
    } catch {
      return res.status(400).json({ error: "Invalid backup file (not valid JSON)" });
    }

    if (!backup?.tables) {
      return res.status(400).json({ error: "Invalid backup file (missing 'tables' field)" });
    }

    const TABLE_ORDER: Array<{ name: string; model: any }> = [
      { name: "users", model: db.user },
      { name: "universities", model: db.university },
      { name: "faculties", model: db.faculty },
      { name: "degreeLevels", model: db.degreeLevel },
      { name: "degreeUniversities", model: db.degreeUniversity },
      { name: "majors", model: db.major },
      { name: "academicYears", model: db.academicYear },
      { name: "semesters", model: db.semester },
      { name: "subjects", model: db.subject },
      { name: "professors", model: db.professor },
      { name: "lessons", model: db.lesson },
      { name: "lessonContentBlocks", model: db.lessonContentBlock },
      { name: "mediaFiles", model: db.mediaFile },
      { name: "favorites", model: db.favorite },
      { name: "recentlyViewed", model: db.recentlyViewed },
      { name: "notifications", model: db.notification },
      { name: "notificationDismissals", model: db.notificationDismissal },
      { name: "ads", model: db.ad },
      { name: "adDismissals", model: db.adDismissal },
      { name: "websiteSettings", model: db.websiteSettings },
      { name: "auditLogs", model: db.auditLog },
    ];

    const DELETE_ORDER = [...TABLE_ORDER].reverse();

    // 1. Restore media blobs
    let mediaFilesWritten = 0;
    if (backup.mediaBlobs && typeof backup.mediaBlobs === "object") {
      for (const [relPath, b64] of Object.entries(backup.mediaBlobs)) {
        if (!relPath.startsWith("/uploads/") || typeof b64 !== "string") continue;
        try {
          const abs = path.join(process.cwd(), "public", relPath);
          await mkdir(path.dirname(abs), { recursive: true });
          await writeFile(abs, Buffer.from(b64, "base64"));
          mediaFilesWritten++;
        } catch (e) {
          console.error("[restore] failed to write media blob:", relPath, e);
        }
      }
    }

    // 2. Wipe existing data in reverse order
    for (const { name, model } of DELETE_ORDER) {
      try {
        await model.deleteMany({});
      } catch (err) {
        console.error(`[restore] failed to wipe ${name}:`, err);
      }
    }

    // 3. Insert backup data in forward order
    const resultCounts: Record<string, number> = {};
    for (const { name, model } of TABLE_ORDER) {
      const rows = backup.tables[name];
      if (!Array.isArray(rows) || rows.length === 0) {
        resultCounts[name] = 0;
        continue;
      }

      // Convert date strings to Date objects
      const sanitized = rows.map((r: any) => {
        const copy: any = { ...r };
        for (const [k, v] of Object.entries(copy)) {
          if (
            typeof v === "string" &&
            (k.endsWith("At") || k === "expires" || k.endsWith("Date"))
          ) {
            copy[k] = new Date(v);
          }
        }
        return copy;
      });

      // Insert in chunks
      let inserted = 0;
      const CHUNK = 50;
      for (let i = 0; i < sanitized.length; i += CHUNK) {
        const chunk = sanitized.slice(i, i + CHUNK);
        try {
          await model.createMany({ data: chunk });
          inserted += chunk.length;
        } catch {
          // Fallback to per-row upsert
          for (const row of chunk) {
            try {
              if (name === "degreeUniversities") {
                await model.create({ data: row });
              } else if (name === "favorites") {
                await model.create({ data: row });
              } else if (name === "notificationDismissals" || name === "adDismissals") {
                await model.create({ data: row });
              } else if (row.id) {
                await model.upsert({
                  where: { id: row.id },
                  create: row,
                  update: row,
                });
              } else {
                await model.create({ data: row });
              }
              inserted++;
            } catch (singleErr) {
              console.error(`[restore] failed single row in ${name}:`, singleErr);
            }
          }
        }
      }
      resultCounts[name] = inserted;
    }

    await audit(
      (req as any).session.user.id,
      "DATA_RESTORE",
      "System",
      null,
      `Restored backup with ${mediaFilesWritten} media files written`
    );

    return res.json({
      ok: true,
      message: "Backup restored successfully",
      mediaFilesWritten,
      counts: resultCounts,
    });
  });

  return router;
}
