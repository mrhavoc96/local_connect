// src/modules/search/search.routes.js
// =============================================================================
// Search Routes — maps HTTP verbs + paths to controller functions.
// Both endpoints are public — no auth middleware required.
// The frontend hits these without a token since product discovery is open.
// =============================================================================

import { Router } from "express";
import { suggest, search } from "./search.controller.js";

const router = Router();

// GET /api/search/suggest?q=iph
// Must be defined BEFORE /api/search to avoid route conflicts
router.get("/suggest", suggest);

// GET /api/search?q=iphone&lat=18.52&lng=73.85&radius=5
router.get("/", search);

export default router;