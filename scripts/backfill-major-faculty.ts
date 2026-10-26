// Backfill: assign every existing Major without a facultyId to its university's first faculty.
// If the university has no faculty, create a default "General" faculty for it.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const majors = await db.major.findMany({ where: { facultyId: null }, include: { university: { include: { faculties: true } } } });
  console.log(`Found ${majors.length} majors without a faculty`);
  for (const m of majors) {
    let faculty = m.university.faculties?.[0];
    if (!faculty) {
      // Create a default faculty for the university
      faculty = await db.faculty.create({
        data: {
          name: "General Faculty",
          nameAr: "كلية عامة",
          nameFr: "Faculté générale",
          universityId: m.universityId,
          published: true,
          order: 0,
        },
      });
      console.log(`  created default faculty ${faculty.id} for university ${m.university.name}`);
    }
    await db.major.update({ where: { id: m.id }, data: { facultyId: faculty.id } });
    console.log(`  ✓ ${m.name} → faculty ${faculty.id}`);
  }
  console.log("Done");
}
main().catch(console.error).finally(() => db.$disconnect());
