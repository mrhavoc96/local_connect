// src/modules/product/product.controller.js
// =============================================================================
// Product Controller — product detail page and view tracking.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { getProductDetail, recordProductView } from "./product.service.js";

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

// -----------------------------------------------------------------------------
// POST /api/products/:seller_product_id/view
// Called by frontend on "Contact Seller" click or map embed click.
// Public — no auth required.
// Body: { product_id: number }
// -----------------------------------------------------------------------------
const recordView = asyncHandler(async (req, res) => {
  const { seller_product_id } = req.params;
  const { product_id } = req.body;

  await recordProductView(seller_product_id, product_id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "View recorded."));
});

export { productDetail, recordView };