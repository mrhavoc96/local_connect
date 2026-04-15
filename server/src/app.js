// src/app.js
// =============================================================================
// Express application setup.
// This file creates and configures the Express app.
// It does NOT start the server — that's index.js's job.
// Keeping them separate makes the app easier to test.
// =============================================================================

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import landingRoutes from "./modules/landing/landing.routes.js";
import searchRoutes from "./modules/search/search.routes.js"
import productRoutes from "./modules/product/product.routes.js";


const app = express();

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// CORS — configure allowed origins as needed
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, // Required for cookies (refresh token) to work cross-origin
  })
);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Parse cookies — required to read the refreshToken httpOnly cookie
app.use(cookieParser());

// =============================================================================
// ROUTES
// =============================================================================
app.use("/api/auth", authRoutes);
app.use("/api/landing", landingRoutes)
app.use("/api/search",  searchRoutes);
app.use("/api/products", productRoutes);


// Health check — useful for deployment and uptime monitoring
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// =============================================================================
// GLOBAL ERROR HANDLER
// Must be registered AFTER all routes — Express processes middleware in order.
// =============================================================================

app.use(errorHandler);

export default app;
