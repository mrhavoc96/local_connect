// src/modules/seller-auth/seller-auth.controller.js
// =============================================================================
// Seller Auth Controller — thin req/res layer.
// Extracts data from req, calls service, sends response.
// Zero business logic here.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import {
  registerSeller,
  loginSeller,
  refreshSellerAccessToken,
} from "./seller-auth.service.js";

// Shared cookie options — identical to customer auth
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

// -----------------------------------------------------------------------------
// POST /api/seller/auth/register
// -----------------------------------------------------------------------------
const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    shop_name,
    latitude,
    longitude,
    city,
    pincode,
  } = req.body;

  const seller = await registerSeller({
    name,
    email,
    phone,
    password,
    shop_name,
    latitude,
    longitude,
    city,
    pincode,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        seller,
        "Seller account created successfully. You can now log in."
      )
    );
});

// -----------------------------------------------------------------------------
// POST /api/seller/auth/login
// -----------------------------------------------------------------------------
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginSeller({
    email,
    password,
  });

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .json(
      new ApiResponse(
        200,
        { user, accessToken },
        "Logged in successfully."
      )
    );
});

// -----------------------------------------------------------------------------
// POST /api/seller/auth/refresh-token
// -----------------------------------------------------------------------------
const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  const { accessToken } = await refreshSellerAccessToken(incomingRefreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed."));
});

// -----------------------------------------------------------------------------
// POST /api/seller/auth/logout
// -----------------------------------------------------------------------------
const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json(new ApiResponse(200, null, "Logged out successfully."));
});

export { register, login, refreshToken, logout };