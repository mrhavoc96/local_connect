// src/middleware/error.middleware.js
// =============================================================================
// Global Error Handler — the last middleware in the Express chain.
// All errors thrown anywhere in the app (via next(err) or asyncHandler)
// land here. We format them consistently using ApiError.
//
// Express identifies a function as an error handler by its 4-argument signature:
// (err, req, res, next) — all four must be present even if next isn't used.
// =============================================================================

import { ApiError } from "../utils/api-error.js";

const errorHandler = (err, req, res, next) => {
  // If the error is already an ApiError, use it directly.
  // Otherwise wrap it so we always send a consistent shape.
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    // Only include the stack trace in development — never expose it in production
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
