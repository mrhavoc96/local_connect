// src/modules/landing/landing.routes.js
// =============================================================================
// Landing Routes — maps HTTP verbs + paths to controller functions.
// This endpoint is public — no auth middleware required.
// Any visitor to the site (logged in or not) can see the landing page.
// =============================================================================

import { Router } from "express";
import { getLandingSuggestions } from "./landing.controller.js";

const router = Router();

// GET /api/landing/suggestions
router.get("/suggestions", getLandingSuggestions);

export default router;