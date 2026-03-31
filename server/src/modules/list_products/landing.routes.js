import express from "express";
import { getLandingSuggestions } from "./landing.controller.js";

const router = express.Router();

router.get("/suggestions", getLandingSuggestions);

export default router;