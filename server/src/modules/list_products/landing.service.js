import prisma from "../../config/prisma.js";
/*
1. What does this file do?
=> It returns a list of products to be displayed on landing page based on their popularity (product visits)

*/


export const getLandingPageSuggestions = async () => {

    const products = await prisma.$queryRaw`
        SELECT 
            p.*,
            COALESCE(pd.views_count, 0) + COALESCE(pd.wishlist_count, 0) AS popularity
        FROM products p
        LEFT JOIN product_demand pd ON p.product_id = pd.product_id
        ORDER BY popularity DESC
        LIMIT 10;
    `;

    return products;
};