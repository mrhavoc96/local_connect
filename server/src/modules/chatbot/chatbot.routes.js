// src/modules/chatbot/chatbot.routes.js
// -----------------------------------------------------------------------------
// Routes for the chatbot adapter.
// -----------------------------------------------------------------------------

import { Router } from "express";
import { proxySearch } from "./chatbot.controller.js";

const router = Router();

// POST /api/chatbot/search
router.post("/search", proxySearch);

export default router;
