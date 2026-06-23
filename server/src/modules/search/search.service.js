// src/modules/search/search.service.js
// =============================================================================
// Search Service — business logic for both search endpoints.
//
// Two exported functions:
//   getAutocompleteSuggestions — lightweight, catalogue-wide, no location
//   searchProducts             — full proximity search with Haversine distance
// =============================================================================

import prisma from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

// Minimum query length before we bother hitting the DB
const MIN_QUERY_LENGTH = 2;

// Default and maximum radius values in km
const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 50;

// -----------------------------------------------------------------------------
// getAutocompleteSuggestions
// Called by the suggest endpoint as the user types.
// Returns up to 8 matching products from the catalogue.
// No location data needed or used here.
// -----------------------------------------------------------------------------
const getAutocompleteSuggestions = async (query) => {
  if (!query || query.trim().length < MIN_QUERY_LENGTH) {
    // Return empty array silently — not an error, just nothing to suggest yet
    return [];
  }

  const normalizedQuery = `%${query.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const rows = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT brand, model_name, category
     FROM products
     WHERE brand ILIKE $1 OR model_name ILIKE $1 OR category ILIKE $1 OR description ILIKE $1
     ORDER BY model_name ASC
     LIMIT 8`,
    normalizedQuery
  );

  return rows.map((row) => ({
    brand: row.brand,
    model_name: row.model_name,
    category: row.category,
  }));
};

// -----------------------------------------------------------------------------
// searchProducts
// Full search — validates inputs, calls the stored procedure, interprets
// the status field returned, and shapes the response for the controller.
// -----------------------------------------------------------------------------
const searchProducts = async ({ query, lat, lng, radius }) => {
  // --- Input validation ---

  if (!query || query.trim().length === 0) {
    throw new ApiError(400, "Search query is required.");
  }

  // Location is mandatory — Option A decision
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    throw new ApiError(
      400,
      "Your location is required to search for nearby products. Please enable location access and try again."
    );
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    throw new ApiError(400, "Invalid location coordinates provided.");
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    throw new ApiError(400, "Location coordinates are out of valid range.");
  }

  // Radius — use default if not provided, cap at maximum
  let parsedRadius = radius ? parseFloat(radius) : DEFAULT_RADIUS_KM;

  if (isNaN(parsedRadius) || parsedRadius <= 0) {
    parsedRadius = DEFAULT_RADIUS_KM;
  }

  // We enforce MAX_RADIUS_KM in the stored procedure too, but also here
  // so the service layer is self-contained and testable independently
  parsedRadius = Math.min(parsedRadius, MAX_RADIUS_KM);

  // --- Search products directly using available tables ---
  const normalizedQuery = `%${query.trim().replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const productMatches = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) AS count FROM products
     WHERE brand ILIKE $1 OR model_name ILIKE $1 OR category ILIKE $1 OR description ILIKE $1`,
    normalizedQuery
  );

  const catalogueCount = Number(productMatches[0]?.count ?? 0);

  const rows = await prisma.$queryRawUnsafe(
    `SELECT
       sp.seller_product_id,
       sp.product_id,
       p.brand,
       p.model_name,
       p.category,
       p.description,
       sp.price AS seller_price,
       sp.warranty_months,
       sp.seller_id,
       s.shop_name,
       s.latitude,
       s.longitude,
       6371 * acos(
         cos(radians($2::numeric)) * cos(radians(s.latitude::numeric)) * cos(radians(s.longitude::numeric) - radians($3::numeric)) +
         sin(radians($2::numeric)) * sin(radians(s.latitude::numeric))
       ) AS distance_km
     FROM seller_products sp
     JOIN products p ON p.product_id = sp.product_id
     JOIN seller_profiles s ON s.seller_id = sp.seller_id
     WHERE sp.is_available = true
       AND (p.brand ILIKE $1 OR p.model_name ILIKE $1 OR p.category ILIKE $1 OR p.description ILIKE $1)
       AND s.latitude IS NOT NULL
       AND s.longitude IS NOT NULL
       AND 6371 * acos(
         cos(radians($2::numeric)) * cos(radians(s.latitude::numeric)) * cos(radians(s.longitude::numeric) - radians($3::numeric)) +
         sin(radians($2::numeric)) * sin(radians(s.latitude::numeric))
       ) <= $4
     ORDER BY distance_km ASC
     LIMIT 50`,
    normalizedQuery,
    parsedLat,
    parsedLng,
    parsedRadius
  );

  if (rows.length > 0) {
    const results = rows.map((row) => ({
      seller_product_id:   Number(row.seller_product_id),
      product_id:          Number(row.product_id),
      brand:               row.brand,
      model_name:          row.model_name,
      category:            row.category,
      description:         row.description,
      seller_price:        row.seller_price ? parseFloat(row.seller_price) : null,
      warranty_months:     row.warranty_months ? Number(row.warranty_months) : 0,
      seller_id:           Number(row.seller_id),
      shop_name:           row.shop_name,
      distance_km:         row.distance_km ? parseFloat(row.distance_km) : null,
      image_url:           row.image_url ?? null,
    }));

    return {
      status: 'found',
      can_expand: false,
      results,
    };
  }

  if (catalogueCount > 0) {
    return {
      status: 'no_sellers_in_radius',
      can_expand: true,
      message: `No sellers found within ${parsedRadius}km of your location. Try expanding your search radius.`,
      results: [],
    };
  }

  return {
    status: 'not_in_catalogue',
    can_expand: false,
    message: 'This product is not available on LocalMart yet.',
    results: [],
  };
};

export { getAutocompleteSuggestions, searchProducts };