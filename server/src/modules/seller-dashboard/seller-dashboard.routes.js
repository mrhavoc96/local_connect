// src/modules/seller-dashboard/seller-dashboard.routes.js
// =============================================================================
// Seller Dashboard Routes
// All routes protected — verifyJWT + requireRole("seller")
// Mounted at /api/seller/dashboard in app.js
// =============================================================================

import { Router } from "express";
import { verifyJWT }   from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import {
  catalogueSearch,
  createListingHandler,
  getListingsHandler,
  getListingDetailHandler,
  updateListingHandler,
  deleteListingHandler,
} from "./seller-dashboard.controller.js";

const router = Router();

// Apply auth to all routes in this file
router.use(verifyJWT, requireRole("seller"));

// Catalogue search — seller finds products to list
// GET /api/seller/dashboard/catalogue/search?q=samsung
router.get("/catalogue/search", catalogueSearch);

// Listings CRUD
// GET    /api/seller/dashboard/listings
// POST   /api/seller/dashboard/listings
router.get("/listings",  getListingsHandler);
router.post("/listings", createListingHandler);

// Single listing operations
// GET    /api/seller/dashboard/listings/:seller_product_id
// PATCH  /api/seller/dashboard/listings/:seller_product_id
// DELETE /api/seller/dashboard/listings/:seller_product_id
router.get("/listings/:seller_product_id",    getListingDetailHandler);
router.patch("/listings/:seller_product_id",  updateListingHandler);
router.delete("/listings/:seller_product_id", deleteListingHandler);

export default router;