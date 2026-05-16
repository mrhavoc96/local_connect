// src/modules/seller-profile/seller-profile.controller.js
// =============================================================================
// Seller Profile Controller — thin req/res layer.
// seller_id is always read from req.user (set by verifyJWT) — never from body.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import { getSellerProfile, updateSellerProfile } from "./seller-profile.service.js";

// -----------------------------------------------------------------------------
// GET /api/seller/profile
// -----------------------------------------------------------------------------
const getProfile = asyncHandler(async (req, res) => {
  console.log("req.user:", req.user);  // add this line
  const { seller_id } = req.user;

  const profile = await getSellerProfile(seller_id);

  return res
    .status(200)
    .json(new ApiResponse(200, profile, "Seller profile fetched successfully."));
});

// -----------------------------------------------------------------------------
// PUT /api/seller/profile/complete
// -----------------------------------------------------------------------------
const updateProfile = asyncHandler(async (req, res) => {
  const { seller_id } = req.user;
  const { shop_name, latitude, longitude, city, pincode } = req.body;

  const updated = await updateSellerProfile(seller_id, {
    shop_name,
    latitude,
    longitude,
    city,
    pincode,
  });

  const message = updated.is_profile_complete
    ? "Profile updated successfully. Your shop is now visible in search results."
    : "Profile updated. Add your shop coordinates to appear in search results.";

  return res.status(200).json(new ApiResponse(200, updated, message));
});

export { getProfile, updateProfile };