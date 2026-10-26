// Seed script — creates the initial admin account and demo academic data
// Run with: bun run /home/z/my-project/scripts/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // 1. Admin account — the administrator logs in with this real email address.
  //    Re-running this seed is idempotent: it will move/rename the admin account to
  //    the configured email and reset the password to the default.
  const adminEmail = "adarmouchfikri@gmail.com";
  const adminPass = "fikri@31048410@";
  // Find any pre-existing admin (by old alias email or new email) and migrate it.
  const oldAdmin = await db.user.findUnique({ where: { email: "fikriad@dalil.local" } });
  if (oldAdmin) {
    // rename the legacy alias to the real email
    await db.user.update({ where: { id: oldAdmin.id }, data: { email: adminEmail } });
  }
  const existing = await db.user.findUnique({ where: { email: adminEmail } });
  const passwordHash = await bcrypt.hash(adminPass, 10);
  if (!existing) {
    await db.user.create({
      data: {
        email: adminEmail,
        name: "adarmouchfikri (Admin)",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log("✓ Admin user created:", adminEmail);
  } else {
    await db.user.update({ where: { email: adminEmail }, data: { passwordHash, role: "ADMIN", status: "ACTIVE", name: "adarmouchfikri (Admin)" } });
    console.log("✓ Admin user already exists, password reset to default:", adminEmail);
  }

  // 2. Website settings — name enforced as "e-learning" on every run
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
    console.log("✓ Website settings seeded");
  } else {
    // Re-enforce the site name on every seed run (so renaming takes effect even if record exists)
    settings = await db.websiteSettings.update({
      where: { id: settings.id },
      data: { name: "e-learning" },
    });
    console.log("✓ Website settings name updated to 'e-learning'");
  }

  // 3. Demo academic structure (only if no university exists yet)
  const hasUniv = await db.university.findFirst();
  if (hasUniv) {
    console.log("✓ Demo data already exists, skipping");
    return;
  }

  // Degree levels
  const licence = await db.degreeLevel.create({ data: { name: "Licence", nameAr: "الإجازة", nameFr: "Licence", order: 1 } });
  const master = await db.degreeLevel.create({ data: { name: "Master", nameAr: "الماستر", nameFr: "Master", order: 2 } });

  // University: Cadi Ayyad
  const uca = await db.university.create({
    data: {
      name: "Cadi Ayyad University",
      nameAr: "جامعة القاضي عياض",
      nameFr: "Université Cadi Ayyad",
      description: "A leading Moroccan university in Marrakech.",
      descriptionAr: "إحدى أبرز الجامعات المغربية في مراكش.",
      descriptionFr: "L'une des plus grandes universités marocaines à Marrakech.",
      city: "Marrakech",
      published: true,
      order: 1,
    },
  });
  await db.degreeUniversity.create({ data: { degreeLevelId: licence.id, universityId: uca.id } });
  await db.degreeUniversity.create({ data: { degreeLevelId: master.id, universityId: uca.id } });

  // Faculty
  await db.faculty.create({
    data: {
      name: "Faculty of Letters and Human Sciences",
      nameAr: "كلية الآداب والعلوم الإنسانية",
      nameFr: "Faculté des Lettres et des Sciences Humaines",
      universityId: uca.id,
      published: true,
      order: 1,
    },
  });

  // Major: English Studies (Licence @ UCA)
  const eng = await db.major.create({
    data: {
      name: "English Studies",
      nameAr: "الدراسات الإنجليزية",
      nameFr: "Études Anglaises",
      description: "Literature, linguistics, and language skills.",
      universityId: uca.id,
      degreeLevelId: licence.id,
      published: true,
      order: 1,
    },
  });

  // Academic Years for English Studies Licence
  const y1 = await db.academicYear.create({
    data: { name: "First Year", nameAr: "السنة الأولى", nameFr: "Première année", majorId: eng.id, degreeLevelId: licence.id, published: true, order: 1 },
  });
  const y2 = await db.academicYear.create({
    data: { name: "Second Year", nameAr: "السنة الثانية", nameFr: "Deuxième année", majorId: eng.id, degreeLevelId: licence.id, published: true, order: 2 },
  });
  const y3 = await db.academicYear.create({
    data: { name: "Third Year", nameAr: "السنة الثالثة", nameFr: "Troisième année", majorId: eng.id, degreeLevelId: licence.id, published: true, order: 3 },
  });

  // Semesters for First Year
  const s1 = await db.semester.create({ data: { name: "Semester 1", nameAr: "السمستر الأول", nameFr: "Semestre 1", academicYearId: y1.id, published: true, order: 1 } });
  const s2 = await db.semester.create({ data: { name: "Semester 2", nameAr: "السمستر الثاني", nameFr: "Semestre 2", academicYearId: y1.id, published: true, order: 2 } });
  await db.semester.create({ data: { name: "Semester 3", nameAr: "السمستر الثالث", nameFr: "Semestre 3", academicYearId: y2.id, published: true, order: 3 } });
  await db.semester.create({ data: { name: "Semester 4", nameAr: "السمستر الرابع", nameFr: "Semestre 4", academicYearId: y2.id, published: true, order: 4 } });
  await db.semester.create({ data: { name: "Semester 5", nameAr: "السمستر الخامس", nameFr: "Semestre 5", academicYearId: y3.id, published: true, order: 5 } });
  await db.semester.create({ data: { name: "Semester 6", nameAr: "السمستر السادس", nameFr: "Semestre 6", academicYearId: y3.id, published: true, order: 6 } });

  // Subject: Introduction to Literature (Semester 1 of English Studies, First Year)
  const lit = await db.subject.create({
    data: {
      name: "Introduction to Literature",
      nameAr: "مدخل إلى الأدب",
      nameFr: "Introduction à la littérature",
      description: "Foundational concepts in literary studies.",
      semesterId: s1.id,
      published: true,
      order: 1,
    },
  });
  const ling = await db.subject.create({
    data: {
      name: "Introduction to Linguistics",
      nameAr: "مدخل إلى اللسانيات",
      nameFr: "Introduction à la linguistique",
      description: "Basic concepts in linguistics.",
      semesterId: s1.id,
      published: true,
      order: 2,
    },
  });
  await db.subject.create({
    data: {
      name: "Academic Writing",
      nameAr: "الكتابة الأكاديمية",
      nameFr: "Rédaction académique",
      description: "Skills for academic English writing.",
      semesterId: s2.id,
      published: true,
      order: 1,
    },
  });

  // Professor: scoped to Semester 1
  const prof1 = await db.professor.create({
    data: {
      name: "Dr. Sara El Amrani",
      nameAr: "د. سارة العمراني",
      nameFr: "Dr. Sara El Amrani",
      bio: "Senior lecturer in English Literature and Linguistics.",
      bioAr: "أستاذة محاضرة في الأدب الإنجليزي واللسانيات.",
      bioFr: "Maître de conférences en littérature anglaise et linguistique.",
      email: "s.elamrani@example.ma",
      semesterId: s1.id,
      published: true,
      order: 1,
    },
  });

  // Lessons for Introduction to Literature
  const l1 = await db.lesson.create({
    data: {
      title: "Introduction to Poetry",
      titleAr: "مدخل إلى الشعر",
      titleFr: "Introduction à la poésie",
      description: "An overview of poetic forms, meter, and rhyme.",
      descriptionAr: "نظرة عامة على الأشكال الشعرية والإيقام والقوافي.",
      descriptionFr: "Vue d'ensemble des formes poétiques, du mètre et de la rime.",
      status: "PUBLISHED",
      order: 1,
      universityId: uca.id,
      degreeLevelId: licence.id,
      majorId: eng.id,
      academicYearId: y1.id,
      semesterId: s1.id,
      subjectId: lit.id,
      professorId: prof1.id,
    },
  });
  // Content blocks for lesson 1
  await db.lessonContentBlock.create({
    data: {
      lessonId: l1.id,
      order: 1,
      type: "text",
      title: "Lesson introduction",
      content: "In this lesson, we will explore the fundamental elements of poetry: form, meter, rhyme, and imagery. By the end, you will be able to recognize the main poetic forms and analyze a short poem.",
    },
  });
  await db.lessonContentBlock.create({
    data: {
      lessonId: l1.id,
      order: 2,
      type: "notes",
      title: "Key terms",
      content: "Meter • Foot • Iamb • Trochee • Sonnet • Haiku • Free verse • Rhyme scheme",
    },
  });
  await db.lessonContentBlock.create({
    data: {
      lessonId: l1.id,
      order: 3,
      type: "youtube",
      title: "Video lecture: What is poetry?",
      content: "https://www.youtube.com/watch?v=Q5A0fB_Vy2Y",
    },
  });

  const l2 = await db.lesson.create({
    data: {
      title: "Introduction to Drama",
      titleAr: "مدخل إلى المسرح",
      titleFr: "Introduction au théâtre",
      description: "Tragedy, comedy, and dramatic structure.",
      status: "PUBLISHED",
      order: 2,
      universityId: uca.id,
      degreeLevelId: licence.id,
      majorId: eng.id,
      academicYearId: y1.id,
      semesterId: s1.id,
      subjectId: lit.id,
      professorId: prof1.id,
    },
  });
  await db.lessonContentBlock.create({
    data: {
      lessonId: l2.id,
      order: 1,
      type: "text",
      title: "Lesson introduction",
      content: "Drama is a form of literature intended for performance. In this lesson, we trace the roots of Western drama from Ancient Greece to the modern stage.",
    },
  });

  const l3 = await db.lesson.create({
    data: {
      title: "The Short Story",
      titleAr: "القصة القصيرة",
      titleFr: "La nouvelle",
      description: "Structure, plot, and characterization in the short story.",
      status: "PUBLISHED",
      order: 3,
      universityId: uca.id,
      degreeLevelId: licence.id,
      majorId: eng.id,
      academicYearId: y1.id,
      semesterId: s1.id,
      subjectId: lit.id,
      professorId: prof1.id,
    },
  });
  await db.lessonContentBlock.create({
    data: {
      lessonId: l3.id,
      order: 1,
      type: "text",
      title: "Lesson introduction",
      content: "The short story is a brief but complete narrative form. This lesson covers its key structural elements: plot, character, setting, point of view, and theme.",
    },
  });

  const l4 = await db.lesson.create({
    data: {
      title: "Introduction to Phonetics",
      titleAr: "مدخل إلى علم الأصوات",
      titleFr: "Introduction à la phonétique",
      description: "Speech sounds and the IPA chart.",
      status: "PUBLISHED",
      order: 1,
      universityId: uca.id,
      degreeLevelId: licence.id,
      majorId: eng.id,
      academicYearId: y1.id,
      semesterId: s1.id,
      subjectId: ling.id,
      professorId: prof1.id,
    },
  });
  await db.lessonContentBlock.create({
    data: {
      lessonId: l4.id,
      order: 1,
      type: "text",
      title: "Lesson introduction",
      content: "Phonetics studies the physical properties of human speech sounds. This lesson introduces the International Phonetic Alphabet (IPA) and the distinction between consonants and vowels.",
    },
  });

  // Sample notification
  await db.notification.create({
    data: {
      title: "Welcome to e-learning",
      content: "Welcome! Browse universities, choose your major and year, and start studying today. If you have any questions, contact the administration.",
      audienceType: "ALL",
      status: "PUBLISHED",
      showEveryVisit: false,
    },
  });

  console.log("✓ Demo academic data seeded");
  console.log("");
  console.log("──── Login credentials ────");
  console.log("Admin:    " + adminEmail + "  /  " + adminPass);
  console.log("Student: register at /signup");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
