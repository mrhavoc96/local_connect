// src/modules/seller-profile/seller-profile.service.js
// =============================================================================
// Seller Profile Service — business logic for viewing and updating
// the seller's own shop profile.
// =============================================================================

import prisma from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";

// -----------------------------------------------------------------------------
// getSellerProfile
// Returns the seller's current profile + is_profile_complete flag.
// -----------------------------------------------------------------------------
const getSellerProfile = async (sellerId) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_seller_profile($1::int)`,
    Number(sellerId)
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Seller profile not found.");
  }

  const profile = rows[0];

  return {
    seller_id:           Number(profile.seller_id),
    user_id:             Number(profile.user_id),
    shop_name:           profile.shop_name,
    latitude:            profile.latitude  ? parseFloat(profile.latitude)  : null,
    longitude:           profile.longitude ? parseFloat(profile.longitude) : null,
    city:                profile.city,
    pincode:             profile.pincode,
    is_verified:         profile.is_verified,
    google_place_id:     profile.google_place_id ?? null,
    average_rating:      profile.average_rating ? parseFloat(profile.average_rating) : 0,
    review_count:        profile.review_count   ? Number(profile.review_count)        : 0,
    is_profile_complete: profile.is_profile_complete,
  };
};

// -----------------------------------------------------------------------------
// updateSellerProfile
// Updates any combination of profile fields.
// Latitude and longitude must both be provided together — not one without other.
// -----------------------------------------------------------------------------
const updateSellerProfile = async (sellerId, updates) => {
  const { shop_name, latitude, longitude, city, pincode } = updates;

  // If either coordinate is provided, both must be provided
  const hasLat = latitude  !== undefined && latitude  !== null;
  const hasLng = longitude !== undefined && longitude !== null;

  if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
    throw new ApiError(
      400,
      "Latitude and longitude must both be provided together."
    );
  }

  // Validate coordinate ranges if provided
  if (hasLat && hasLng) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError(400, "Invalid coordinate values.");
    }
    if (lat < -90 || lat > 90) {
      throw new ApiError(400, "Latitude must be between -90 and 90.");
    }
    if (lng < -180 || lng > 180) {
      throw new ApiError(400, "Longitude must be between -180 and 180.");
    }
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM update_seller_profile($1::int, $2, $3::numeric, $4::numeric, $5, $6)`,
    Number(sellerId),
    shop_name  || null,
    hasLat ? parseFloat(latitude)  : null,
    hasLng ? parseFloat(longitude) : null,
    city    || null,
    pincode || null
  );

  if (rows.length === 0) {
    throw new ApiError(404, "Seller profile not found.");
  }

  const profile = rows[0];

  return {
    seller_id:           Number(profile.seller_id),
    shop_name:           profile.shop_name,
    latitude:            profile.latitude  ? parseFloat(profile.latitude)  : null,
    longitude:           profile.longitude ? parseFloat(profile.longitude) : null,
    city:                profile.city,
    pincode:             profile.pincode,
    is_profile_complete: profile.is_profile_complete,
  };
};

export { getSellerProfile, updateSellerProfile };