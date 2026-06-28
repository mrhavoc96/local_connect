// src/middleware/auth.middleware.js
// =============================================================================
// Auth Middleware — protects routes that require a logged-in user.
//
// How it works:
//   1. Reads the Bearer token from the Authorization header
//   2. Verifies the JWT signature and expiry
//   3. Fetches the user from DB to confirm they still exist and are active
//   4. Attaches the user object to req.user for downstream use
//
// Usage in any route file:
//   import { verifyJWT } from "../../middleware/auth.middleware.js";
//   router.get("/protected", verifyJWT, controller);
// =============================================================================

import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import env from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  // Extract token — supports "Bearer <token>" format
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    throw new ApiError(401, "Access token is required.");
  }

  // Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, env.accessTokenSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  // Confirm user still exists and is active in the DB
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_user_by_id($1::int)`,
    Number(decoded.user_id)
  );

  if (rows.length === 0) {
    throw new ApiError(401, "User no longer exists.");
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated.");
  }

  // Attach user to request for use in controllers
  req.user = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    roles: user.roles ? user.roles.split(",") : [],
    // Preserve seller_id from the JWT payload if present
    // get_user_by_id doesn't return seller profile data so we
    // carry it forward from the decoded token instead
    seller_id: decoded.seller_id ?? null,
  };

  next();
});

export { verifyJWT };
