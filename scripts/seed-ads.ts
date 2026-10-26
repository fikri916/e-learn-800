// Seed two sample ads: one popup, one hero banner
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Sample popup ad — appears after login (status PUBLISHED, audience ALL)
  const existingPopup = await db.ad.findFirst({ where: { type: "POPUP" } });
  if (!existingPopup) {
    await db.ad.create({
      data: {
        title: "Welcome to e-learning",
        content: "Check out our new collection of English literature lectures. Sign up today to access all lessons.",
        type: "POPUP",
        audienceType: "ALL",
        status: "PUBLISHED",
        dismissible: true,
        showEveryLogin: false,
      },
    });
    console.log("✓ Sample popup ad created");
  } else {
    console.log("✓ Popup ad already exists");
  }

  // Sample hero banner ad — placed under hero (no images yet — admin uploads them)
  const existingHero = await db.ad.findFirst({ where: { type: "HERO_BANNER" } });
  if (!existingHero) {
    await db.ad.create({
      data: {
        title: "New semester courses available",
        content: "Browse the latest course offerings for the new semester.",
        type: "HERO_BANNER",
        audienceType: "ALL",
        status: "PUBLISHED",
        // No images seeded — admin uploads mobile + desktop via Admin → Ads
      },
    });
    console.log("✓ Sample hero banner ad created (no images — admin uploads them)");
  } else {
    console.log("✓ Hero banner ad already exists");
  }
}
main().catch(console.error).finally(() => db.$disconnect());
