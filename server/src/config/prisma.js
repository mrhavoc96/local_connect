// src/config/prisma.js
// =============================================================================
// Prisma Client singleton.
// A single PrismaClient instance is created and reused across the entire app.
// Creating multiple instances is wasteful — each one maintains its own
// connection pool. Exporting a singleton from here prevents that.
// =============================================================================

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient({
  // Log queries in development so we can see exactly what hits the DB.
  // In production this is silent.
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

export default prisma;
