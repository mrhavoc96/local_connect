// prisma/seed.js
// This file seeds the roles table with the two base roles the application needs.
// Run with: npx prisma db seed
// Prisma calls this file automatically if configured in package.json under "prisma.seed"

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function ensureRole(role_name) {
  return prisma.roles.upsert({
    where: { role_name },
    update: {},
    create: { role_name },
  });
}

async function ensureUser(email, name) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.users.findUnique({ where: { email: normalizedEmail } });
  if (existing) return existing;

  return prisma.users.create({
    data: {
      name,
      email: normalizedEmail,
      password_hash: "demo123",
      is_active: true,
    },
  });
}

async function ensureSellerProfile(userId) {
  const existing = await prisma.seller_profiles.findUnique({ where: { user_id: userId } });
  if (existing) return existing;

  return prisma.seller_profiles.create({
    data: {
      user_id: userId,
      shop_name: "LocalMart Demo Shop",
      latitude: 18.52043,
      longitude: 73.85674,
      city: "Pune",
      pincode: "411001",
      is_verified: true,
    },
  });
}

async function ensureProduct() {
  const existing = await prisma.products.findFirst({
    where: {
      brand: "Dell",
      model_name: "Inspiron 15",
      category: "laptop",
    },
  });
  if (existing) return existing;

  return prisma.products.create({
    data: {
      brand: "Dell",
      model_name: "Inspiron 15",
      category: "laptop",
      description: "Budget-friendly all-purpose laptop for students and office work.",
      base_price: 44999,
      average_rating: 4.2,
      review_count: 12,
    },
  });
}

async function ensureSellerProduct(productId, sellerId) {
  const existing = await prisma.seller_products.findFirst({
    where: {
      product_id: productId,
      seller_id: sellerId,
    },
  });
  if (existing) return existing;

  return prisma.seller_products.create({
    data: {
      product_id: productId,
      seller_id: sellerId,
      price: 42999,
      stock_quantity: 25,
      is_available: true,
      warranty_months: 12,
    },
  });
}

async function main() {
  console.log("Seeding demo data...");

  const customerRole = await ensureRole("customer");
  const sellerRole = await ensureRole("seller");

  const sellerUser = await ensureUser("seller@localmart.test", "LocalMart Seller");
  await ensureSellerProfile(sellerUser.user_id);

  const product = await ensureProduct();
  await ensureSellerProduct(product.product_id, sellerUser.user_id);

  console.log(`Seeded roles: [${customerRole.role_name}] [${sellerRole.role_name}]`);
  console.log(`Seeded seller: ${sellerUser.email}`);
  console.log(`Seeded product: ${product.brand} ${product.model_name}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
