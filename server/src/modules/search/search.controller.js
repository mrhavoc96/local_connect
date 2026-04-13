// src/modules/search/search.controller.js
// =============================================================================
// Search Controller — thin req/res layer.
// Extracts query parameters, calls service, sends response.
// Zero business logic here.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { getAutocompleteSuggestions, searchProducts } from "./search.service.js";

// -----------------------------------------------------------------------------
// GET /api/search/suggest?q=iph
// Autocomplete — called as user types, returns lightweight suggestions.
// Public endpoint — no auth required.
// -----------------------------------------------------------------------------
const suggest = asyncHandler(async (req, res) => {
  const { q } = req.query;

  const suggestions = await getAutocompleteSuggestions(q);

  return res
    .status(200)
    .json(new ApiResponse(200, suggestions, "Autocomplete suggestions fetched."));
});

// -----------------------------------------------------------------------------
// GET /api/search?q=iphone&lat=18.52&lng=73.85&radius=5
// Full proximity search — requires location coordinates.
// Public endpoint — no auth required.
// -----------------------------------------------------------------------------
const search = asyncHandler(async (req, res) => {
  const { q, lat, lng, radius } = req.query;

  const result = await searchProducts({
    query: q,
    lat,
    lng,
    radius,
  });

  // Pick the HTTP status and message based on what came back
  // All cases return 200 — the `status` field in data tells the frontend
  // what actually happened. 4xx is only for truly invalid requests.
  return res
    .status(200)
    .json(new ApiResponse(200, result, getMessageForStatus(result.status)));
});

// -----------------------------------------------------------------------------
// Internal helper — maps status strings to human-readable response messages.
// Kept here rather than in the service so the service stays pure logic.
// -----------------------------------------------------------------------------
function getMessageForStatus(status) {
  switch (status) {
    case "found":
      return "Search results fetched successfully.";
    case "not_in_catalogue":
      return "Product not found in catalogue.";
    case "no_sellers_in_radius":
      return "No sellers found within the specified radius.";
    case "no_sellers_in_range":
      return "No sellers found within 50km.";
    default:
      return "Search completed.";
  }
}

export { suggest, search };