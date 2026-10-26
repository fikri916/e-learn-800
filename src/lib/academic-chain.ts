import { db } from "@/lib/db";

export interface ChainValidationInput {
  universityId?: string | null;
  degreeLevelId?: string | null;
  majorId?: string | null;
  academicYearId?: string | null;
  semesterId?: string | null;
  subjectId?: string | null;
  professorId?: string | null;
}

export async function validateChain(
  body: ChainValidationInput
): Promise<{ ok: boolean; error?: string }> {
  if (
    !body.universityId ||
    !body.degreeLevelId ||
    !body.majorId ||
    !body.academicYearId ||
    !body.semesterId ||
    !body.subjectId
  ) {
    return { ok: false, error: "all academic fields are required" };
  }

  // subject -> semester
  const subject = await db.subject.findUnique({
    where: { id: body.subjectId },
    select: { semesterId: true },
  });
  if (!subject) return { ok: false, error: "subject not found" };
  if (subject.semesterId !== body.semesterId)
    return { ok: false, error: "subject does not belong to the selected semester" };

  // semester -> academicYear
  const semester = await db.semester.findUnique({
    where: { id: body.semesterId },
    select: { academicYearId: true },
  });
  if (!semester) return { ok: false, error: "semester not found" };
  if (semester.academicYearId !== body.academicYearId)
    return { ok: false, error: "semester does not belong to the selected year" };

  // academicYear -> major + degreeLevel
  const year = await db.academicYear.findUnique({
    where: { id: body.academicYearId },
    select: { majorId: true, degreeLevelId: true },
  });
  if (!year) return { ok: false, error: "year not found" };
  if (year.majorId !== body.majorId)
    return { ok: false, error: "year does not belong to the selected major" };
  if (year.degreeLevelId !== body.degreeLevelId)
    return { ok: false, error: "year does not belong to the selected degree" };

  // major -> university + degreeLevel
  const major = await db.major.findUnique({
    where: { id: body.majorId },
    select: { universityId: true, degreeLevelId: true },
  });
  if (!major) return { ok: false, error: "major not found" };
  if (major.universityId !== body.universityId)
    return { ok: false, error: "major does not belong to the selected university" };
  if (major.degreeLevelId !== body.degreeLevelId)
    return { ok: false, error: "major does not belong to the selected degree" };

  // professor -> semester (if provided)
  if (body.professorId) {
    const prof = await db.professor.findUnique({
      where: { id: body.professorId },
      select: { semesterId: true },
    });
    if (!prof) return { ok: false, error: "professor not found" };
    if (prof.semesterId !== body.semesterId)
      return { ok: false, error: "professor does not belong to the selected semester" };
  }

  return { ok: true };
}

// Pure targeting evaluator for unit testing
export function isAudienceMatch(
  audienceType: string,
  targetIds: string | null | undefined,
  user: {
    id?: string;
    universityId?: string | null;
    degreeLevelId?: string | null;
    majorId?: string | null;
    academicYearId?: string | null;
  } | null
): boolean {
  if (audienceType === "ALL") return true;
  if (!user) return false;

  const targets = (targetIds || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (targets.length === 0) return true;

  switch (audienceType) {
    case "UNIVERSITY":
      return !!user.universityId && targets.includes(user.universityId);
    case "DEGREE":
      return !!user.degreeLevelId && targets.includes(user.degreeLevelId);
    case "MAJOR":
      return !!user.majorId && targets.includes(user.majorId);
    case "YEAR":
      return !!user.academicYearId && targets.includes(user.academicYearId);
    case "USERS":
      return !!user.id && targets.includes(user.id);
    default:
      return true;
  }
}
