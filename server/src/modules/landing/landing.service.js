// src/modules/landing/landing.service.js
// =============================================================================
// Landing Service — business logic for the landing page.
//
// Responsibilities:
//   - Call the get_landing_page_suggestions stored procedure
//   - Parse the images field from a JSON string into a real JS array
//     (Prisma returns JSON columns as strings, not parsed objects)
//   - Return clean, frontend-ready data
// =============================================================================

import prisma from "../../config/prisma.js";

const getLandingPageSuggestions = async () => {

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM get_landing_page_suggestions()`
  );

  // Prisma returns JSON columns as raw strings.
  // We parse them here so the controller sends a proper JS array to the client,
  // not a stringified one like "[\"url1\",\"url2\"]".
  const products = rows.map((product) => ({
  ...product,
  popularity: Number(product.popularity),
  images: typeof product.images === "string"
    ? JSON.parse(product.images)
    : product.images ?? [],
  }));

  return products;
};

export { getLandingPageSuggestions };