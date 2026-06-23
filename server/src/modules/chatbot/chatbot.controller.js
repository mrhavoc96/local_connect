// src/modules/chatbot/chatbot.controller.js
// -----------------------------------------------------------------------------
// Simple adapter controller to expose a chatbot-friendly search endpoint.
// Accepts POST { query?, message?, lat, lng, radius? } and returns the
// existing `searchProducts` service output wrapped in ApiResponse.
// -----------------------------------------------------------------------------

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { searchProducts } from "../search/search.service.js";

const proxySearch = asyncHandler(async (req, res) => {
  const { query, message, lat, lng, radius } = req.body || {};

  // Prefer explicit `query`, fall back to raw `message` text
  const q = (query && String(query).trim()) || (message && String(message).trim());

  console.log('[CHATBOT ADAPTER] request body:', {
    query: q,
    rawQuery: query,
    message,
    lat,
    lng,
    radius,
  });

  const result = await searchProducts({ query: q, lat, lng, radius });

  console.log('[CHATBOT ADAPTER] search result:', {
    status: result.status,
    resultCount: Array.isArray(result.results) ? result.results.length : 0,
    canExpand: result.can_expand,
  });

  // Return the same shape the frontend/service expects — the ApiResponse
  // wrapper keeps responses consistent with other endpoints.
  return res.status(200).json(new ApiResponse(200, result, "Chatbot proxy search completed."));
});

export { proxySearch };
