// src/modules/product/product.routes.js
// =============================================================================
// Product Routes — product detail page and view tracking.
// Both endpoints are public — no auth required.
// =============================================================================

import { Router } from "express";
import { productDetail, recordView } from "./product.controller.js";

const router = Router();

// GET  /api/products/:seller_product_id
router.get("/:seller_product_id", productDetail);

// POST /api/products/:seller_product_id/view
router.post("/:seller_product_id/view", recordView);

export default router;