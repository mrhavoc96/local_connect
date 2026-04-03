// src/index.js
// =============================================================================
// Server entry point.
// Imports the configured Express app and starts listening on the defined port.
// Database connection is validated at startup — if Prisma can't reach the DB,
// the server exits immediately with a clear error rather than starting broken.
// =============================================================================

import "dotenv/config";
import app from "./app.js";
import prisma from "./config/prisma.js";
import env from "./config/env.js";

const startServer = async () => {
  try {
    // Validate DB connection before accepting any traffic
    await prisma.$connect();
    console.log("✅ Database connected successfully.");

    app.listen(env.port, () => {
      console.log(`✅ Server running on http://localhost:${env.port}`);
      console.log(`   Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
