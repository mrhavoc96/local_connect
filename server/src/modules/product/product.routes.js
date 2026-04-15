// src/modules/product/product.routes.js
// =============================================================================
// Product Routes — maps HTTP verbs + paths to controller functions.
// Public endpoint — no auth required.
// Anyone can view a product detail page whether logged in or not.
// =============================================================================

import { Router } from "express";
import { productDetail } from "./product.controller.js";

const router = Router();

// GET /api/products/:seller_product_id
router.get("/:seller_product_id", productDetail);

export default router;