// src/modules/seller-auth/seller-auth.service.js
// =============================================================================
// Seller Auth Service — all business logic for seller authentication.
//
// Key differences from customer auth.service.js:
//   - Registration creates user + seller_profiles row in one transaction
//   - No email verification flow — sellers are active immediately
//   - Login guards against non-seller accounts trying to access seller portal
//   - Login also checks seller_profiles.is_verified (warns but doesn't block —
//     seller can log in but portal can restrict features until verified)
// =============================================================================

import dns from "dns/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../../config/prisma.js";
import env from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

// -----------------------------------------------------------------------------
// validateEmailFormat — Level 1 email validation
// -----------------------------------------------------------------------------
function validateEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// -----------------------------------------------------------------------------
// validateEmailDomain — Level 2 MX record check
// -----------------------------------------------------------------------------
async function validateEmailDomain(email) {
  const domain = email.split("@")[1];
  try {
    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// generateTokens — creates access + refresh JWT pair
// Payload carries user_id, roles, and seller_id for seller-specific use
// -----------------------------------------------------------------------------

// const sellerId = user.seller_id ? Number(user.seller_id) : null;

// Add these three lines
// console.log("user row from DB:", user);
// console.log("sellerId value:", sellerId);
// console.log("roles:", roles);


function generateTokens(userId, roles, sellerId) {
  const payload = { user_id: userId, roles, seller_id: sellerId };

  const accessToken = jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiry,
  });

  const refreshToken = jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiry,
  });

  return { accessToken, refreshToken };
}

// =============================================================================
// EXPORTED SERVICE FUNCTIONS
// =============================================================================

// -----------------------------------------------------------------------------
// registerSeller
// Full seller registration:
//   1. Validate inputs
//   2. Email format + MX record check
//   3. Check for duplicate email
//   4. Hash password
//   5. Call register_seller procedure (user + role + seller_profile in one tx)
// -----------------------------------------------------------------------------
const registerSeller = async ({
  name,
  email,
  phone,
  password,
  shop_name,
  latitude,
  longitude,
  city,
  pincode,
}) => {
  // --- Presence checks ---
  if (!name || !email || !password || !shop_name) {
    throw new ApiError(
      400,
      "Name, email, password, and shop name are required."
    );
  }

  // --- Email format (Level 1) ---
  if (!validateEmailFormat(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  // --- MX record check (Level 2) ---
  const domainIsValid = await validateEmailDomain(email);
  if (!domainIsValid) {
    throw new ApiError(
      400,
      "Email domain does not appear to be valid. Please use a real email address."
    );
  }

  // --- Password length ---
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }

  // --- Check for existing email ---
  const existing = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_seller_by_email($1)`,
    email
  );
  if (existing.length > 0) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  // --- Hash password ---
  const passwordHash = await bcrypt.hash(password, 12);

  // --- Register via stored procedure ---
  // Latitude and longitude are optional — pass null if not provided
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM register_seller($1, $2, $3, $4, $5, $6::numeric, $7::numeric, $8, $9)`,
    name,
    email,
    phone || null,
    passwordHash,
    shop_name,
    latitude  ? parseFloat(latitude)  : null,
    longitude ? parseFloat(longitude) : null,
    city      || null,
    pincode   || null
  );

  const newSeller = rows[0];

  return {
    user_id:     Number(newSeller.user_id),
    name:        newSeller.name,
    email:       newSeller.email,
    seller_id:   Number(newSeller.seller_id),
    shop_name:   newSeller.shop_name,
    city:        newSeller.city,
    pincode:     newSeller.pincode,
    is_verified: newSeller.is_verified,
  };
};

// -----------------------------------------------------------------------------
// loginSeller
// Seller login with role guard:
//   1. Fetch user by email
//   2. Verify user exists
//   3. Guard: confirm account has 'seller' role — prevents customers
//      from logging into the seller portal with their customer credentials
//   4. Verify password
//   5. Issue tokens — payload includes seller_id for seller portal use
// -----------------------------------------------------------------------------
const loginSeller = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  // Fetch user + seller profile data
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_seller_by_email($1)`,
    email
  );

  // Generic message — don't confirm whether email is registered
  if (rows.length === 0) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const user = rows[0];

  // --- Role guard ---
  // Prevents a customer account from being used on the seller portal
  const roles = user.roles ? user.roles.split(",") : [];
  if (!roles.includes("seller")) {
    throw new ApiError(
      403,
      "This account does not have seller access. Please register as a seller."
    );
  }

  // --- Password check ---
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const sellerId = user.seller_id ? Number(user.seller_id) : null;

  // --- Issue tokens ---
  // seller_id is included in the JWT payload so seller-protected routes
  // can access it from req.user without an extra DB call
  const { accessToken, refreshToken } = generateTokens(
    Number(user.user_id),
    roles,
    sellerId
  );

  return {
    user: {
      user_id:     Number(user.user_id),
      name:        user.name,
      email:       user.email,
      roles,
      seller_id:   sellerId,
      shop_name:   user.shop_name,
      is_verified: user.is_verified,
    },
    accessToken,
    refreshToken,
  };
};

// -----------------------------------------------------------------------------
// refreshSellerAccessToken
// Validates the refresh token from the httpOnly cookie.
// Confirms the user still exists and still has the seller role.
// -----------------------------------------------------------------------------
const refreshSellerAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found.");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, env.refreshTokenSecret);
  } catch {
    throw new ApiError(
      401,
      "Invalid or expired refresh token. Please log in again."
    );
  }

  // Confirm user still exists and still has seller role
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_user_by_id($1::int)`,
    Number(decoded.user_id)
  );

  if (rows.length === 0) {
    throw new ApiError(401, "User no longer exists.");
  }

  const user = rows[0];
  const roles = user.roles ? user.roles.split(",") : [];

  if (!roles.includes("seller")) {
    throw new ApiError(403, "This account does not have seller access.");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated.");
  }

  // Issue fresh access token — preserve seller_id from original decoded token
  const accessToken = jwt.sign(
    {
      user_id:   Number(user.user_id),
      roles,
      seller_id: decoded.seller_id ?? null,
    },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenExpiry }
  );

  return { accessToken };
};

export { registerSeller, loginSeller, refreshSellerAccessToken };