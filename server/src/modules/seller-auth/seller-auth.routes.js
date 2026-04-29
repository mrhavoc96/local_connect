// src/modules/seller-auth/seller-auth.routes.js
// =============================================================================
// Seller Auth Routes — maps HTTP verbs + paths to controller functions.
// Mounted at /api/seller/auth in app.js.
// =============================================================================

import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "./seller-auth.controller.js";

const router = Router();

// POST /api/seller/auth/register
router.post("/register", register);

// POST /api/seller/auth/login
router.post("/login", login);

// POST /api/seller/auth/refresh-token
router.post("/refresh-token", refreshToken);

// POST /api/seller/auth/logout
router.post("/logout", logout);

export default router;