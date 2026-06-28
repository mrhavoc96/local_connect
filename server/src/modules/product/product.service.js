// src/modules/product/product.service.js
// =============================================================================
// Product Service — business logic for the product detail page and view tracking.
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

  const coreRows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_product_core($1::int)`,
    id
  );

  if (coreRows.length === 0) {
    throw new ApiError(404, "Product listing not found.");
  }

  const core      = coreRows[0];
  const productId = Number(core.product_id);
  const sellerId  = Number(core.seller_id);

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

  return {
    listing: {
      seller_product_id: Number(core.seller_product_id),
      seller_price:      core.seller_price      ? parseFloat(core.seller_price)  : null,
      stock_quantity:    core.stock_quantity     ? Number(core.stock_quantity)    : 0,
      is_available:      core.is_available,
      warranty_months:   core.warranty_months    ? Number(core.warranty_months)   : 0,
    },

    product: {
      product_id:     productId,
      brand:          core.brand,
      model_name:     core.model_name,
      category:       core.category,
      description:    core.description,
      base_price:     core.base_price ? parseFloat(core.base_price) : null,
      average_rating: core.product_avg_rating
        ? parseFloat(core.product_avg_rating) : 0,
      review_count: core.product_review_count
        ? Number(core.product_review_count) : 0,
      images: imageRows.map((img) => ({
        image_id:  Number(img.image_id),
        image_url: img.image_url,
      })),
      specifications: specRows.map((spec) => ({
        spec_id:    Number(spec.spec_id),
        spec_key:   spec.spec_key,
        spec_value: spec.spec_value,
      })),
    },

    seller: seller ? {
      seller_id:       sellerId,
      shop_name:       seller.shop_name,
      city:            seller.city,
      pincode:         seller.pincode,
      latitude:        seller.latitude  ? parseFloat(seller.latitude)  : null,
      longitude:       seller.longitude ? parseFloat(seller.longitude) : null,
      is_verified:     seller.is_verified,
      google_place_id: seller.google_place_id ?? null,
      average_rating:  seller.seller_avg_rating
        ? parseFloat(seller.seller_avg_rating) : 0,
      review_count: seller.seller_review_count
        ? Number(seller.seller_review_count) : 0,
      images:
        typeof seller.seller_images === "string"
          ? JSON.parse(seller.seller_images)
          : seller.seller_images ?? [],
    } : null,

    offers: offerRows.map((offer) => ({
      offer_id:       Number(offer.offer_id),
      discount_type:  offer.discount_type,
      discount_value: offer.discount_value ? parseFloat(offer.discount_value) : 0,
      final_price:    offer.final_price    ? parseFloat(offer.final_price)    : null,
      start_date:     offer.start_date,
      end_date:       offer.end_date,
    })),

    price_history: priceHistoryRows.map((ph) => ({
      history_id:  Number(ph.history_id),
      price:       ph.price ? parseFloat(ph.price) : null,
      recorded_at: ph.recorded_at,
    })),

    external_prices: externalPriceRows.map((ep) => ({
      external_price_id: Number(ep.external_price_id),
      platform_name:     ep.platform_name,
      price:             ep.price ? parseFloat(ep.price) : null,
      last_updated:      ep.last_updated,
    })),
  };
};

// -----------------------------------------------------------------------------
// recordProductView
// Called when a user clicks "Contact Seller" or the map embed.
// Validates that both seller_product_id and product_id are provided,
// then calls the stored procedure which:
//   - inserts into seller_product_views
//   - increments product_demand.views_count for the seller's city
// -----------------------------------------------------------------------------
const recordProductView = async (sellerProductId, productId) => {
  const spId = Number(sellerProductId);
  const pId  = Number(productId);

  if (!spId || isNaN(spId) || spId <= 0) {
    throw new ApiError(400, "Invalid seller product ID.");
  }

  if (!pId || isNaN(pId) || pId <= 0) {
    throw new ApiError(400, "Invalid product ID.");
  }

  // Confirm the listing exists before recording the view
  const check = await prisma.$queryRawUnsafe(
    `SELECT seller_product_id FROM seller_products WHERE seller_product_id = $1::int`,
    spId
  );

  if (check.length === 0) {
    throw new ApiError(404, "Product listing not found.");
  }

  // record_product_view returns VOID — use executeRawUnsafe
  await prisma.$executeRawUnsafe(
    `SELECT record_product_view($1::int, $2::int)`,
    spId,
    pId
  );

  return { recorded: true };
};

export { getProductDetail, recordProductView };