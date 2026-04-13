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

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM search_autocomplete($1)`,
    query.trim()
  );

  return rows;
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

  // --- Call stored procedure ---
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM search_products($1, $2, $3, $4)`,
    query.trim(),
    parsedLat,
    parsedLng,
    parsedRadius
  );

  // The procedure always returns at least one row (the status row)
  // Read status from the first row
  const status = rows[0]?.status;

  // --- Interpret status and shape response ---

  if (status === "not_in_catalogue") {
    return {
      status,
      can_expand: false,
      message: "This product is not available on LocalMart yet.",
      results: [],
    };
  }

  if (status === "no_sellers_in_radius") {
    return {
      status,
      can_expand: true,
      message: `No sellers found within ${parsedRadius}km of your location. Try expanding your search radius.`,
      results: [],
    };
  }

  if (status === "no_sellers_in_range") {
    return {
      status,
      can_expand: false,
      message: "No sellers carrying this product were found within 50km of your location.",
      results: [],
    };
  }

  // status === 'found' — map rows into clean result objects
  // Convert any remaining Decimal/BigInt types that Prisma returns as objects
  const results = rows.map((row) => ({
    seller_product_id:      Number(row.seller_product_id),
    product_id:             Number(row.product_id),
    brand:                  row.brand,
    model_name:             row.model_name,
    category:               row.category,
    base_price:             row.base_price      ? parseFloat(row.base_price)      : null,
    seller_price:           row.seller_price    ? parseFloat(row.seller_price)    : null,
    warranty_months:        row.warranty_months ? Number(row.warranty_months)     : 0,
    product_average_rating: row.product_average_rating ? parseFloat(row.product_average_rating) : 0,
    product_review_count:   row.product_review_count   ? Number(row.product_review_count)        : 0,
    seller_id:              Number(row.seller_id),
    shop_name:              row.shop_name,
    seller_average_rating:  row.seller_average_rating  ? parseFloat(row.seller_average_rating)  : 0,
    seller_review_count:    row.seller_review_count     ? Number(row.seller_review_count)         : 0,
    distance_km:            row.distance_km    ? parseFloat(row.distance_km)    : null,
    image_url:              row.image_url      ?? null,
  }));

  return {
    status,
    can_expand: false,
    results,
  };
};

export { getAutocompleteSuggestions, searchProducts };