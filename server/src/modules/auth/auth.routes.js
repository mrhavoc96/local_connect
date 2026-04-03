// src/modules/auth/auth.routes.js
// =============================================================================
// Auth Routes — maps HTTP verbs + paths to controller functions.
// No logic here whatsoever — just routing.
// =============================================================================

import { Router } from "express";
import {
  register,
  verifyEmailHandler,
  login,
  refreshToken,
  logout,
} from "./auth.controller.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// GET  /api/auth/verify-email?token=xxx
router.get("/verify-email", verifyEmailHandler);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh-token
router.post("/refresh-token", refreshToken);

// POST /api/auth/logout
router.post("/logout", logout);

export default router;
