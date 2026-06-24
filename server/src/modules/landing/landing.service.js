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
    `
      SELECT
        p.product_id::INTEGER,
        p.brand,
        p.model_name,
        p.category,
        p.description,
        p.base_price,
        COALESCE(SUM(pd.views_count + pd.wishlist_count), 0)::INTEGER AS popularity,
        COALESCE(
          JSON_AGG(pi.image_url ORDER BY pi.image_id) FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_demand pd ON p.product_id = pd.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      GROUP BY p.product_id, p.brand, p.model_name, p.category, p.description, p.base_price
      ORDER BY popularity DESC
      LIMIT 10
    `
  );

  const products = rows.map((product) => ({
    ...product,
    popularity: Number(product.popularity),
    images: typeof product.images === "string"
      ? JSON.parse(product.images)
      : product.images ?? [],
  }));

  return products;
};

const getCategories = async () => {
  // Fetch distinct categories from products table
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT DISTINCT category
      FROM products
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category ASC
    `
  );

  // Map to category name format
  return rows.map((row) => ({
    name: row.category,
  }));
};

const getProductsByCategory = async (category) => {
  // Fetch products by category
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT
        p.product_id::INTEGER,
        p.brand,
        p.model_name,
        p.category,
        p.description,
        p.base_price,
        pi.image_url
      FROM products p
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.product_id
        LIMIT 1
      ) pi ON true
      WHERE p.category = $1
      ORDER BY p.brand, p.model_name
      LIMIT 50
    `,
    category
  );

  return rows.map((row) => ({
    product_id:  Number(row.product_id),
    brand:       row.brand,
    model_name:  row.model_name,
    category:    row.category,
    description: row.description,
    base_price:  row.base_price ? parseFloat(row.base_price) : null,
    image_url:   row.image_url ?? null,
  }));
};

export { getLandingPageSuggestions, getCategories, getProductsByCategory };