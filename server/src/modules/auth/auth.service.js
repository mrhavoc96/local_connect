// src/modules/auth/auth.service.js
// =============================================================================
// Auth Service — all business logic lives here.
// The controller calls these functions and only deals with req/res.
// This layer handles: validation, DB calls via stored procedures, token
// generation, email sending, and error throwing.
// =============================================================================

import crypto from "crypto";
import dns from "dns/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../../config/prisma.js";
import env from "../../config/env.js";
import { sendVerificationEmail } from "../../config/mailer.js";
import { ApiError } from "../../utils/api-error.js";

// =============================================================================
// INTERNAL HELPERS
// These functions are not exported — used only within this service file.
// =============================================================================

// -----------------------------------------------------------------------------
// validateEmailFormat
// Level 1 validation: checks the email matches a standard email regex.
// -----------------------------------------------------------------------------
function validateEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// -----------------------------------------------------------------------------
// validateEmailDomain
// Level 2 validation: checks the email's domain has valid MX (mail) records.
// This confirms the domain can actually receive email — catches fakes like
// "user@notarealdomain123.com" without sending anything.
// -----------------------------------------------------------------------------
async function validateEmailDomain(email) {
  const domain = email.split("@")[1];
  try {
    const mxRecords = await dns.resolveMx(domain);
    // resolveMx returns an array — if it's empty, no mail servers exist
    return mxRecords && mxRecords.length > 0;
  } catch {
    // DNS lookup failed — domain doesn't exist or has no MX records
    return false;
  }
}

// -----------------------------------------------------------------------------
// generateTokens
// Creates a short-lived access token and a long-lived refresh token.
// Both are signed JWTs. The payload carries user_id and roles.
// -----------------------------------------------------------------------------
function generateTokens(userId, roles) {
  const payload = { user_id: userId, roles };

  const accessToken = jwt.sign(payload, env.accessTokenSecret, {
    expiresIn: env.accessTokenExpiry,
  });

  const refreshToken = jwt.sign(payload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenExpiry,
  });

  return { accessToken, refreshToken };
}

// -----------------------------------------------------------------------------
// generateVerificationToken
// Creates a cryptographically random token for email verification.
// Returns both the raw token (goes in the email URL) and its SHA-256 hash
// (stored in the DB — we never store raw tokens).
// -----------------------------------------------------------------------------
function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, tokenHash };
}

// =============================================================================
// EXPORTED SERVICE FUNCTIONS
// =============================================================================

// -----------------------------------------------------------------------------
// registerUser
// Full registration flow:
//   1. Format validation
//   2. MX record validation
//   3. Duplicate email check
//   4. Password hashing
//   5. DB insert via stored procedure
//   6. Verification token generation + storage
//   7. Verification email dispatch
// -----------------------------------------------------------------------------
const registerUser = async ({ name, email, phone, password }) => {
  // --- Step 1: Presence checks ---
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  // --- Step 2: Email format (Level 1) ---
  if (!validateEmailFormat(email)) {
    throw new ApiError(400, "Please provide a valid email address.");
  }

  // --- Step 3: MX record check (Level 2) ---
  const domainIsValid = await validateEmailDomain(email);
  if (!domainIsValid) {
    throw new ApiError(400, "Email domain does not appear to be valid. Please use a real email address.");
  }

  // --- Step 4: Password length ---
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }

  // --- Step 5: Check for existing email ---
  // We call the stored procedure directly — if a user with this email exists
  // it will return a row; we reject before attempting insertion.
  const existing = await prisma.$queryRaw`
    SELECT * FROM get_user_by_email(${email})
  `;
  if (existing.length > 0) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  // --- Step 6: Hash the password ---
  const passwordHash = await bcrypt.hash(password, 12);

  // --- Step 7: Insert user via stored procedure ---
  // register_user() inserts the user AND assigns the 'customer' role atomically.
  const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM register_user($1, $2, $3, $4)`,
      name, email, phone || null, passwordHash
  );

  const newUser = rows[0];

  const { rawToken, tokenHash } = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.$executeRawUnsafe(
    `SELECT save_verification_token($1::int, $2::text, $3::timestamptz)`,
    Number(newUser.user_id), tokenHash, expiresAt
  );

  const verifyUrl = `${env.apiBaseUrl}/api/auth/verify-email?token=${rawToken}`;
  await sendVerificationEmail(email, verifyUrl);

  return {
      user_id: newUser.user_id,
      name: newUser.name,
      email: newUser.email,
      is_active: newUser.is_active,
  };
};

// -----------------------------------------------------------------------------
// verifyEmail
// Handles the link-click from the verification email:
//   1. Hash the incoming raw token
//   2. Call the stored procedure which validates, activates user, and cleans up
//   3. Return based on the procedure's status string
// -----------------------------------------------------------------------------
const verifyEmail = async (rawToken) => {
  if (!rawToken) {
    throw new ApiError(400, "Verification token is missing.");
  }

  // Hash the raw token to match what we stored
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // The stored procedure handles all DB logic and returns a status string
  const rows = await prisma.$queryRaw`
    SELECT verify_email_token(${tokenHash}) AS status
  `;
  const status = rows[0]?.status;

  if (status === "invalid_token") {
    throw new ApiError(400, "Invalid verification link.");
  }

  if (status === "expired") {
    throw new ApiError(410, "This verification link has expired. Please register again or request a new link.");
  }

  // status === 'verified'
  return { message: "Email verified successfully. You can now log in." };
};

// -----------------------------------------------------------------------------
// loginUser
// Login flow:
//   1. Fetch user by email via stored procedure
//   2. Check account exists
//   3. Check email is verified (is_active)
//   4. Compare passwords
//   5. Issue access + refresh tokens
// -----------------------------------------------------------------------------
const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  // Fetch user + roles in one stored procedure call
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_user_by_email($1)`,
    email
  );

  // Use a generic message to avoid confirming whether an email is registered
  if (rows.length === 0) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const user = rows[0];

  // Check if email has been verified
  if (!user.is_active) {
    throw new ApiError(403, "Please verify your email address before logging in.");
  }

  // Compare the provided password against the stored hash
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  // Parse the comma-separated roles string into an array
  const roles = user.roles ? user.roles.split(",") : [];

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.user_id, roles);

  // Return safe user data + tokens
  return {
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      roles,
    },
    accessToken,
    refreshToken,
  };
};

// -----------------------------------------------------------------------------
// refreshAccessToken
// Validates the refresh token from the httpOnly cookie and issues a new
// access token. The refresh token itself is NOT rotated (stateless approach).
// -----------------------------------------------------------------------------
const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found.");
  }

  // Verify the refresh token signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, env.refreshTokenSecret);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
  }

  // Confirm the user still exists and is active
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_user_by_id($1)`,
    decoded.user_id
  );

  if (rows.length === 0) {
    throw new ApiError(401, "User no longer exists.");
  }

  const user = rows[0];

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated.");
  }

  const roles = user.roles ? user.roles.split(",") : [];

  // Issue a fresh access token only
  const accessToken = jwt.sign(
    { user_id: user.user_id, roles },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenExpiry }
  );

  return { accessToken };
};

export { registerUser, verifyEmail, loginUser, refreshAccessToken };
