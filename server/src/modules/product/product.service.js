// src/modules/product/product.service.js
// =============================================================================
// Product Service — business logic for the product detail page.
//
// Architecture decision:
//   The product detail page requires 7 different data blocks. Rather than one
//   massive stored procedure returning a single denormalised row, we use 7
//   focused procedures called in parallel where possible.
//
//   Benefits:
//     - Each procedure is independently testable and reusable
//     - Parallel calls via Promise.all() reduce total response time
//     - Failure in one block (e.g. no external prices) doesn't break the rest
//     - Easy to add or remove blocks later without touching other procedures
// =============================================================================

import prisma from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

// -----------------------------------------------------------------------------
// getProductDetail
// Orchestrates all 7 data-fetching calls and assembles the final response.
// -----------------------------------------------------------------------------
const getProductDetail = async (sellerProductId) => {
  const id = Number(sellerProductId);

  if (!id || isNaN(id) || id <= 0) {
    throw new ApiError(400, "Invalid seller product ID.");
  }

  // --- Step 1: Fetch core data first ---
  // We need product_id and seller_id from core before we can fetch
  // images, specs, seller info etc. This one must run first.
  const coreRows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_product_core($1::int)`,
    id
  );

  if (coreRows.length === 0) {
    throw new ApiError(404, "Product listing not found.");
  }

  const core = coreRows[0];
  const productId = Number(core.product_id);
  const sellerId  = Number(core.seller_id);

  // --- Step 2: Fetch all remaining blocks in parallel ---
  // These are all independent of each other — run simultaneously
  // to minimise total response time.
  const [
    imageRows,
    specRows,
    sellerRows,
    offerRows,
    priceHistoryRows,
    externalPriceRows,
  ] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT * FROM get_product_images($1::int)`,  productId),
    prisma.$queryRawUnsafe(`SELECT * FROM get_product_specs($1::int)`,   productId),
    prisma.$queryRawUnsafe(`SELECT * FROM get_seller_info($1::int)`,     sellerId),
    prisma.$queryRawUnsafe(`SELECT * FROM get_active_offers($1::int)`,   id),
    prisma.$queryRawUnsafe(`SELECT * FROM get_price_history($1::int)`,   id),
    prisma.$queryRawUnsafe(`SELECT * FROM get_external_prices($1::int)`, productId),
  ]);

  const seller = sellerRows[0] ?? null;

  // --- Step 3: Assemble and return clean response object ---
  return {
    // Core listing info
    listing: {
      seller_product_id: Number(core.seller_product_id),
      seller_price:      core.seller_price      ? parseFloat(core.seller_price)  : null,
      stock_quantity:    core.stock_quantity     ? Number(core.stock_quantity)    : 0,
      is_available:      core.is_available,
      warranty_months:   core.warranty_months    ? Number(core.warranty_months)   : 0,
    },

    // Product information
    product: {
      product_id:     productId,
      brand:          core.brand,
      model_name:     core.model_name,
      category:       core.category,
      description:    core.description,
      base_price:     core.base_price ? parseFloat(core.base_price) : null,
      average_rating: core.product_avg_rating
        ? parseFloat(core.product_avg_rating)
        : 0,
      review_count: core.product_review_count
        ? Number(core.product_review_count)
        : 0,
      // All product images
      images: imageRows.map((img) => ({
        image_id:  Number(img.image_id),
        image_url: img.image_url,
      })),
      // All product specifications as key-value pairs
      specifications: specRows.map((spec) => ({
        spec_id:    Number(spec.spec_id),
        spec_key:   spec.spec_key,
        spec_value: spec.spec_value,
      })),
    },

    // Seller / store information
    seller: seller
      ? {
          seller_id:      sellerId,
          shop_name:      seller.shop_name,
          city:           seller.city,
          pincode:        seller.pincode,
          // Coordinates returned for frontend Google Maps embed
          latitude:  seller.latitude  ? parseFloat(seller.latitude)  : null,
          longitude: seller.longitude ? parseFloat(seller.longitude) : null,
          is_verified:     seller.is_verified,
          google_place_id: seller.google_place_id ?? null,
          average_rating:  seller.seller_avg_rating
            ? parseFloat(seller.seller_avg_rating)
            : 0,
          review_count: seller.seller_review_count
            ? Number(seller.seller_review_count)
            : 0,
          // All seller images — parsed from JSON column
          images:
            typeof seller.seller_images === "string"
              ? JSON.parse(seller.seller_images)
              : seller.seller_images ?? [],
        }
      : null,

    // Active offers with calculated final price
    offers: offerRows.map((offer) => ({
      offer_id:       Number(offer.offer_id),
      discount_type:  offer.discount_type,
      discount_value: offer.discount_value ? parseFloat(offer.discount_value) : 0,
      final_price:    offer.final_price    ? parseFloat(offer.final_price)    : null,
      start_date:     offer.start_date,
      end_date:       offer.end_date,
    })),

    // Price history over last 365 days — ordered oldest to newest for charting
    price_history: priceHistoryRows.map((ph) => ({
      history_id:  Number(ph.history_id),
      price:       ph.price ? parseFloat(ph.price) : null,
      recorded_at: ph.recorded_at,
    })),

    // External market prices for comparison
    external_prices: externalPriceRows.map((ep) => ({
      external_price_id: Number(ep.external_price_id),
      platform_name:     ep.platform_name,
      price:             ep.price ? parseFloat(ep.price) : null,
      last_updated:      ep.last_updated,
    })),
  };
};

export { getProductDetail };