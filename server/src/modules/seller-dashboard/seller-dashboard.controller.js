// src/modules/seller-dashboard/seller-dashboard.controller.js
// =============================================================================
// Seller Dashboard Controller — thin req/res layer.
// seller_id always comes from req.user — never from request body or params.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import {
  searchCatalogue,
  createListing,
  getListings,
  getListingDetail,
  updateListing,
  deleteListing,
} from "./seller-dashboard.service.js";

// -----------------------------------------------------------------------------
// GET /api/seller/dashboard/catalogue/search?q=samsung
// -----------------------------------------------------------------------------
const catalogueSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;

  const results = await searchCatalogue(q);

  return res
    .status(200)
    .json(new ApiResponse(200, results, "Catalogue search results fetched."));
});

// -----------------------------------------------------------------------------
// POST /api/seller/dashboard/listings
// -----------------------------------------------------------------------------
const createListingHandler = asyncHandler(async (req, res) => {
  const { seller_id } = req.user;
  const { product_id, price, stock_quantity, warranty_months } = req.body;

  const listing = await createListing(seller_id, {
    product_id,
    price,
    stock_quantity,
    warranty_months,
  });

  const message =
    listing.action === "merged"
      ? "Stock merged into existing listing successfully."
      : "Product listed successfully.";

  return res.status(201).json(new ApiResponse(201, listing, message));
});

// -----------------------------------------------------------------------------
// GET /api/seller/dashboard/listings
// -----------------------------------------------------------------------------
const getListingsHandler = asyncHandler(async (req, res) => {
  const { seller_id } = req.user;

  const listings = await getListings(seller_id);

  return res
    .status(200)
    .json(new ApiResponse(200, listings, "Listings fetched successfully."));
});

// -----------------------------------------------------------------------------
// GET /api/seller/dashboard/listings/:seller_product_id
// -----------------------------------------------------------------------------
const getListingDetailHandler = asyncHandler(async (req, res) => {
  const { seller_id } = req.user;
  const { seller_product_id } = req.params;

  const detail = await getListingDetail(seller_id, seller_product_id);

  return res
    .status(200)
    .json(new ApiResponse(200, detail, "Listing detail fetched successfully."));
});

// -----------------------------------------------------------------------------
// PATCH /api/seller/dashboard/listings/:seller_product_id
// -----------------------------------------------------------------------------
const updateListingHandler = asyncHandler(async (req, res) => {
  const { seller_id } = req.user;
  const { seller_product_id } = req.params;
  const { price, stock_quantity, is_available } = req.body;

  const updated = await updateListing(seller_id, seller_product_id, {
    price,
    stock_quantity,
    is_available,
  });

  // Tailor the message based on whether a price slash offer was auto-generated
  const message = updated.discount_percent
    ? `Listing updated. A ${updated.discount_percent}% off offer has been automatically applied based on the price reduction.`
    : "Listing updated successfully.";

  return res.status(200).json(new ApiResponse(200, updated, message));
});

// -----------------------------------------------------------------------------
// DELETE /api/seller/dashboard/listings/:seller_product_id
// -----------------------------------------------------------------------------
const deleteListingHandler = asyncHandler(async (req, res) => {
  const { seller_id } = req.user;
  const { seller_product_id } = req.params;

  await deleteListing(seller_id, seller_product_id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Listing deleted successfully."));
});

export {
  catalogueSearch,
  createListingHandler,
  getListingsHandler,
  getListingDetailHandler,
  updateListingHandler,
  deleteListingHandler,
};