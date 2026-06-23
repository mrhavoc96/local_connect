// src/modules/auth/auth.controller.js
// =============================================================================
// Auth Controller — thin layer between routes and the service.
// Responsibilities here are ONLY:
//   1. Extract data from req (body, query, cookies)
//   2. Call the appropriate service function
//   3. Set cookies if needed
//   4. Send the response
// Zero business logic lives here.
// =============================================================================

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/api-response.js";
import {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
} from "./auth.service.js";

// Cookie options for the refresh token.
// httpOnly: JS in the browser cannot read this cookie — XSS safe.
// secure: only sent over HTTPS — set to true in production.
// sameSite: "strict" prevents CSRF attacks.
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// -----------------------------------------------------------------------------
// POST /api/auth/register
// -----------------------------------------------------------------------------
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, latitude, longitude } = req.body;

  const user = await registerUser({ name, email, phone, password, latitude, longitude });

  return res.status(201).json(
    new ApiResponse(
      201,
      user,
      "Registration successful. Please check your email to verify your account."
    )
  );
});

// -----------------------------------------------------------------------------
// GET /api/auth/verify-email?token=rawToken
// -----------------------------------------------------------------------------
const verifyEmailHandler = asyncHandler(async (req, res) => {
  const { token } = req.query;

  const result = await verifyEmail(token);

  return res.status(200).json(new ApiResponse(200, null, result.message));
});

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginUser({ email, password });

  // Refresh token goes into a secure httpOnly cookie
  // Access token goes in the response body — the client stores it in memory
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
// POST /api/auth/refresh-token
// Reads the refresh token from the httpOnly cookie, issues a new access token.
// -----------------------------------------------------------------------------
const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  const { accessToken } = await refreshAccessToken(incomingRefreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed."));
});

// -----------------------------------------------------------------------------
// POST /api/auth/logout
// Clears the refresh token cookie. Client is responsible for discarding
// the access token on their end.
// -----------------------------------------------------------------------------
const logout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json(new ApiResponse(200, null, "Logged out successfully."));
});

export { register, verifyEmailHandler, login, refreshToken, logout };
