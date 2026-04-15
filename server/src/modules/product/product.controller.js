// src/modules/product/product.controller.js
// =============================================================================
// Product Controller — thin req/res layer for product detail endpoint.
// Extracts the seller_product_id from URL params, calls service, responds.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { getProductDetail } from "./product.service.js";

// -----------------------------------------------------------------------------
// GET /api/products/:seller_product_id
// -----------------------------------------------------------------------------
const productDetail = asyncHandler(async (req, res) => {
  const { seller_product_id } = req.params;

  const data = await getProductDetail(seller_product_id);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Product detail fetched successfully."));
});

export { productDetail };