// src/modules/seller-dashboard/seller-dashboard.service.js
// =============================================================================
// Seller Dashboard Service — business logic for product listing management.
//
// Responsibilities:
//   - Catalogue search (for seller to find products to list)
//   - Create listing (with merge logic for duplicates)
//   - View all listings
//   - View single listing detail
//   - Update listing (price, stock, availability + auto-offer logic)
//   - Delete listing
//
// Profile completion is enforced here before any listing creation.
// =============================================================================

import prisma from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

// -----------------------------------------------------------------------------
// searchCatalogue
// Seller searches the product catalogue to find a product to list.
// Minimum 2 characters required — avoids full table scans on empty queries.
// -----------------------------------------------------------------------------
const searchCatalogue = async (query) => {
  if (!query || query.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters.");
  }

  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT
        p.product_id::INTEGER,
        p.brand,
        p.model_name,
        p.category,
        p.description,
        p.base_price,
        pi.image_url
      FROM products p
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.product_id
        LIMIT 1
      ) pi ON true
      WHERE (COALESCE(p.brand, '') || ' ' || COALESCE(p.model_name, '')) ILIKE ('%' || $1 || '%')
      ORDER BY p.brand, p.model_name
      LIMIT 50
    `,
    query.trim()
  );

  return rows.map((row) => ({
    product_id:  Number(row.product_id),
    brand:       row.brand,
    model_name:  row.model_name,
    category:    row.category,
    description: row.description,
    base_price:  row.base_price ? parseFloat(row.base_price) : null,
    image_url:   row.image_url ?? null,
  }));
};

// -----------------------------------------------------------------------------
// createListing
// Creates a new listing or merges stock into an existing one.
//
// Enforces profile completion — seller must have coordinates before listing.
// This ensures their products are visible in proximity searches.
// -----------------------------------------------------------------------------
const createListing = async (sellerId, { product_id, price, stock_quantity, warranty_months }) => {
  // --- Input validation ---
  if (!product_id || !price || !stock_quantity) {
    throw new ApiError(400, "product_id, price, and stock_quantity are required.");
  }

  const parsedPrice    = parseFloat(price);
  const parsedStock    = parseInt(stock_quantity, 10);
  const parsedWarranty = parseInt(warranty_months ?? 0, 10);

  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    throw new ApiError(400, "Price must be a positive number.");
  }
  if (isNaN(parsedStock) || parsedStock <= 0) {
    throw new ApiError(400, "Stock quantity must be a positive integer.");
  }
  if (isNaN(parsedWarranty) || parsedWarranty < 0) {
    throw new ApiError(400, "Warranty months must be zero or a positive integer.");
  }

  // --- Profile completion check ---
  // Seller must have coordinates before they can list products
  const profileRows = await prisma.$queryRawUnsafe(
    `SELECT is_profile_complete FROM get_seller_profile($1::int)`,
    Number(sellerId)
  );

  if (profileRows.length === 0) {
    throw new ApiError(404, "Seller profile not found.");
  }

  if (!profileRows[0].is_profile_complete) {
    throw new ApiError(
      403,
      "Your shop profile is incomplete. Please add your shop location before listing products."
    );
  }

  // --- Confirm product exists in catalogue ---
  const productCheck = await prisma.$queryRawUnsafe(
    `SELECT product_id FROM products WHERE product_id = $1::int`,
    Number(product_id)
  );

  if (productCheck.length === 0) {
    throw new ApiError(404, "Product not found in catalogue.");
  }

  // --- Create or merge listing ---
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM create_or_merge_listing($1::int, $2::int, $3::numeric, $4::int, $5::int)`,
    Number(sellerId),
    Number(product_id),
    parsedPrice,
    parsedStock,
    parsedWarranty
  );

  const listing = rows[0];

  return {
    seller_product_id: Number(listing.seller_product_id),
    seller_id:         Number(listing.seller_id),
    product_id:        Number(listing.product_id),
    price:             parseFloat(listing.price),
    stock_quantity:    Number(listing.stock_quantity),
    is_available:      listing.is_available,
    warranty_months:   Number(listing.warranty_months),
    action:            listing.action, // 'created' or 'merged'
  };
};

// -----------------------------------------------------------------------------
// getListings
// Returns all of the seller's listings with summary info.
// -----------------------------------------------------------------------------
const getListings = async (sellerId) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_seller_listings($1::int)`,
    Number(sellerId)
  );

  return rows.map((row) => ({
    seller_product_id: Number(row.seller_product_id),
    product_id:        Number(row.product_id),
    brand:             row.brand,
    model_name:        row.model_name,
    category:          row.category,
    price:             row.price             ? parseFloat(row.price)             : null,
    stock_quantity:    row.stock_quantity     ? Number(row.stock_quantity)        : 0,
    is_available:      row.is_available,
    warranty_months:   row.warranty_months    ? Number(row.warranty_months)       : 0,
    image_url:         row.image_url          ?? null,
    has_active_offer:  row.has_active_offer,
    offer_final_price: row.offer_final_price  ? parseFloat(row.offer_final_price) : null,
  }));
};

// -----------------------------------------------------------------------------
// getListingDetail
// Returns full detail of a single listing.
// Ownership is verified inside the stored procedure.
// -----------------------------------------------------------------------------
const getListingDetail = async (sellerId, sellerProductId) => {
  const id = Number(sellerProductId);

  if (!id || isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid listing ID.");
  }

  const [coreRows, priceHistoryRows, offerRows] = await Promise.all([
    prisma.$queryRawUnsafe(
      `SELECT * FROM get_seller_listing_detail($1::int, $2::int)`,
      id,
      Number(sellerId)
    ),
    prisma.$queryRawUnsafe(
      `SELECT * FROM get_price_history($1::int)`,
      id
    ),
    prisma.$queryRawUnsafe(
      `SELECT * FROM get_active_offers($1::int)`,
      id
    ),
  ]);

  if (coreRows.length === 0) {
    throw new ApiError(404, "Listing not found or does not belong to your account.");
  }

  const core = coreRows[0];

  return {
    seller_product_id: Number(core.seller_product_id),
    product_id:        Number(core.product_id),
    brand:             core.brand,
    model_name:        core.model_name,
    category:          core.category,
    description:       core.description,
    base_price:        core.base_price ? parseFloat(core.base_price) : null,
    price:             core.price      ? parseFloat(core.price)      : null,
    stock_quantity:    core.stock_quantity ? Number(core.stock_quantity) : 0,
    is_available:      core.is_available,
    warranty_months:   core.warranty_months ? Number(core.warranty_months) : 0,
    price_history: priceHistoryRows.map((ph) => ({
      history_id:  Number(ph.history_id),
      price:       ph.price ? parseFloat(ph.price) : null,
      recorded_at: ph.recorded_at,
    })),
    active_offers: offerRows.map((o) => ({
      offer_id:       Number(o.offer_id),
      discount_type:  o.discount_type,
      discount_value: o.discount_value ? parseFloat(o.discount_value) : 0,
      final_price:    o.final_price    ? parseFloat(o.final_price)    : null,
      start_date:     o.start_date,
      end_date:       o.end_date,
    })),
  };
};

// -----------------------------------------------------------------------------
// updateListing
// Updates price, stock_quantity, and/or is_available.
// Warranty is deliberately excluded — immutable after creation.
// Auto-offer logic is handled entirely inside the stored procedure.
// -----------------------------------------------------------------------------
const updateListing = async (sellerId, sellerProductId, updates) => {
  const id = Number(sellerProductId);

  if (!id || isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid listing ID.");
  }

  const { price, stock_quantity, is_available } = updates;

  // At least one field must be provided
  if (price === undefined && stock_quantity === undefined && is_available === undefined) {
    throw new ApiError(400, "Provide at least one field to update: price, stock_quantity, or is_available.");
  }

  // Validate provided fields
  if (price !== undefined) {
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) {
      throw new ApiError(400, "Price must be a positive number.");
    }
  }

  if (stock_quantity !== undefined) {
    const s = parseInt(stock_quantity, 10);
    if (isNaN(s) || s < 0) {
      throw new ApiError(400, "Stock quantity must be zero or a positive integer.");
    }
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM update_seller_listing($1::int, $2::int, $3::numeric, $4::int, $5::boolean)`,
    id,
    Number(sellerId),
    price          !== undefined ? parseFloat(price)           : null,
    stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null,
    is_available   !== undefined ? is_available                 : null
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Listing not found or does not belong to your account.");
  }

  const updated = rows[0];

  return {
    seller_product_id: Number(updated.seller_product_id),
    price:             updated.price          ? parseFloat(updated.price)          : null,
    stock_quantity:    updated.stock_quantity  ? Number(updated.stock_quantity)     : 0,
    is_available:      updated.is_available,
    warranty_months:   updated.warranty_months ? Number(updated.warranty_months)    : 0,
    // Discount percentage if a price slash auto-offer was generated, null otherwise
    discount_percent:  updated.discount_percent ? parseFloat(updated.discount_percent) : null,
  };
};

// -----------------------------------------------------------------------------
// deleteListing
// Permanently removes the listing and all its related records.
// Ownership verified inside the stored procedure.
// -----------------------------------------------------------------------------
const deleteListing = async (sellerId, sellerProductId) => {
  const id = Number(sellerProductId);

  if (!id || isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid listing ID.");
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT delete_seller_listing($1::int, $2::int) AS status`,
    id,
    Number(sellerId)
  );

  const status = rows[0]?.status;

  if (status === "not_found") {
    throw new ApiError(404, "Listing not found or does not belong to your account.");
  }

  return { deleted: true };
};

export {
  searchCatalogue,
  createListing,
  getListings,
  getListingDetail,
  updateListing,
  deleteListing,
};