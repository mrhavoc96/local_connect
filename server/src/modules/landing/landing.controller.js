// src/modules/landing/landing.controller.js
// =============================================================================
// Landing Controller — thin req/res layer for landing page endpoints.
// No business logic here — only extracts request data, calls the service,
// and sends the response.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { getLandingPageSuggestions } from "./landing.service.js";

const getLandingSuggestions = asyncHandler(async (req, res) => {
  const data = await getLandingPageSuggestions();

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Landing page suggestions fetched successfully."));
});

export { getLandingSuggestions };