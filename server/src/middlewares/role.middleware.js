// src/middleware/role.middleware.js
// =============================================================================
// Role Middleware — restricts routes to users with specific roles.
//
// Usage:
//   import { requireRole } from "../../middleware/role.middleware.js";
//
//   // Protect a route for sellers only:
//   router.get("/dashboard", verifyJWT, requireRole("seller"), controller);
//
//   // Protect a route for multiple roles:
//   router.get("/admin", verifyJWT, requireRole("seller", "admin"), controller);
//
// Important:
//   Always use AFTER verifyJWT — this middleware reads req.user which is
//   attached by verifyJWT. Using it without verifyJWT will throw an error.
// =============================================================================

import { ApiError } from "../utils/api-error.js";

const requireRole = (...allowedRoles) => {
  return (req, _, next) => {
    // req.user is set by verifyJWT middleware
    if (!req.user || !req.user.roles) {
      throw new ApiError(401, "Authentication required.");
    }

    // Check if the user has at least one of the allowed roles
    const hasRole = req.user.roles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      throw new ApiError(
        403,
        `Access denied. Required role: ${allowedRoles.join(" or ")}.`
      );
    }

    next();
  };
};

export { requireRole };