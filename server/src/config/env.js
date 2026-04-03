// src/config/env.js
// =============================================================================
// Centralised environment configuration.
// All environment variables are read ONCE here and exported as a plain object.
// Every other file in the project imports from here — never from process.env
// directly. This gives us one place to validate, document, and rename vars.
// =============================================================================

import "dotenv/config";

// Helper: throws a clear error at startup if a required variable is missing.
// Failing fast here is intentional — a misconfigured server should not start.
function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable "${key}" is required but not set.`);
  }
  return value;
}

const env = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: required("DATABASE_URL"),

  // JWT
  accessTokenSecret: required("ACCESS_TOKEN_SECRET"),
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  refreshTokenSecret: required("REFRESH_TOKEN_SECRET"),
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "7d",

  // Mailtrap / SMTP
  mailtrap: {
    host: required("MAILTRAP_HOST"),
    port: parseInt(process.env.MAILTRAP_PORT || "2525", 10),
    user: required("MAILTRAP_USER"),
    pass: required("MAILTRAP_PASS"),
    from: process.env.MAIL_FROM || "noreply@localmart.com",
  },

  // App
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
};

export default env;
