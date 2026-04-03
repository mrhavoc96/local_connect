// prisma/seed.js
// This file seeds the roles table with the two base roles the application needs.
// Run with: npx prisma db seed
// Prisma calls this file automatically if configured in package.json under "prisma.seed"

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding roles table...");

  // upsert ensures re-running the seed never creates duplicates
  const customer = await prisma.roles.upsert({
    where: { role_name: "customer" },
    update: {},
    create: { role_name: "customer" },
  });

  const seller = await prisma.roles.upsert({
    where: { role_name: "seller" },
    update: {},
    create: { role_name: "seller" },
  });

  console.log(`Seeded roles: [${customer.role_name}] [${seller.role_name}]`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
