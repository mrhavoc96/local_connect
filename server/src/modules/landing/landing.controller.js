// src/modules/landing/landing.controller.js
// =============================================================================
// Landing Controller — thin req/res layer for landing page endpoints.
// No business logic here — only extracts request data, calls the service,
// and sends the response.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { getLandingPageSuggestions, getCategories, getProductsByCategory } from "./landing.service.js";
import { ApiError } from "../../utils/api-error.js";

const getLandingSuggestions = asyncHandler(async (req, res) => {
  const data = await getLandingPageSuggestions();

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Landing page suggestions fetched successfully."));
});

const getCategoriesHandler = asyncHandler(async (req, res) => {
  const categories = await getCategories();

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully."));
});

const getProductsByCategoryHandler = asyncHandler(async (req, res) => {
  const { category } = req.params;

  if (!category || category.trim().length === 0) {
    throw new ApiError(400, "Category is required.");
  }

  const products = await getProductsByCategory(category);

  return res
    .status(200)
    .json(new ApiResponse(200, products, `Products in category '${category}' fetched successfully.`));
});

export { getLandingSuggestions, getCategoriesHandler, getProductsByCategoryHandler };