// Backfill existing lessons with the seed professor
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  // Find or create the sample professor in Semester 1
  const s1 = await db.semester.findFirst({ where: { name: "Semester 1" } });
  if (!s1) { console.log("No Semester 1 found"); return; }
  let prof = await db.professor.findFirst({ where: { semesterId: s1.id } });
  if (!prof) {
    prof = await db.professor.create({
      data: {
        name: "Dr. Sara El Amrani",
        nameAr: "د. سارة العمراني",
        nameFr: "Dr. Sara El Amrani",
        bio: "Senior lecturer in English Literature and Linguistics.",
        semesterId: s1.id,
        published: true,
        order: 1,
      },
    });
    console.log("✓ Created professor", prof.id);
  } else {
    console.log("✓ Existing professor found:", prof.id);
  }
  // Update all lessons with this semester that have no professor
  const updated = await db.lesson.updateMany({
    where: { semesterId: s1.id, professorId: null },
    data: { professorId: prof.id },
  });
  console.log(`✓ Backfilled ${updated.count} lessons with professor ${prof.name}`);
}
main().catch(console.error).finally(() => db.$disconnect());
