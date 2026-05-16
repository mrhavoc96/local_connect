// src/modules/seller-profile/seller-profile.routes.js
// =============================================================================
// Seller Profile Routes
// All routes protected — verifyJWT + requireRole("seller")
// Mounted at /api/seller/profile in app.js
// =============================================================================

import { Router } from "express";
import { verifyJWT }   from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { getProfile, updateProfile } from "./seller-profile.controller.js";

const router = Router();

// Apply auth middleware to all routes in this file
router.use(verifyJWT, requireRole("seller"));

// GET  /api/seller/profile
router.get("/", getProfile);

// PUT  /api/seller/profile/complete
router.put("/complete", updateProfile);

export default router;