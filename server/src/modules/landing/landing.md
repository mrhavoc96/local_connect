# Landing Module — Documentation

## Overview
The landing module serves the public-facing landing page of LocalMart.
It exposes a single endpoint that returns the 10 most popular products
globally, intended to be rendered as product cards on the homepage.

No authentication is required. Any visitor can call this endpoint.

---

## Endpoint

### GET /api/landing/suggestions

**Description**
Returns the top 10 products ranked by global popularity.
Popularity is calculated as the sum of `views_count + wishlist_count`
across all cities in the `product_demand` table.

**Authentication**: None — public endpoint.

**Request**: No body, no query params, no headers required.

---

## Response Shape

```json
{
  "statusCode": 200,
  "message": "Landing page suggestions fetched successfully.",
  "success": true,
  "data": [
    {
      "product_id": 4,
      "brand": "Samsung",
      "model_name": "Galaxy S24 Ultra",
      "category": "Smartphone",
      "description": "Flagship Android smartphone with S-Pen support.",
      "base_price": "109999.00",
      "popularity": 1540,
      "images": [
        "https://example.com/images/s24ultra-front.jpg",
        "https://example.com/images/s24ultra-back.jpg"
      ]
    },
    {
      "product_id": 7,
      "brand": "Sony",
      "model_name": "WH-1000XM5",
      "category": "Headphones",
      "description": "Industry-leading noise cancelling headphones.",
      "base_price": "29999.00",
      "popularity": 980,
      "images": []
    }
    // ...8 more products
  ]
}
```

---

## Field Reference

| Field        | Type             | Description                                                               |
|--------------|------------------|---------------------------------------------------------------------------|
| product_id   | integer          | Unique identifier for the product                                         |
| brand        | string or null   | Brand name e.g. "Samsung", "Apple"                                        |
| model_name   | string or null   | Model name e.g. "Galaxy S24 Ultra"                                        |
| category     | string or null   | Product category e.g. "Smartphone", "Laptop", "Headphones"                |
| description  | string or null   | Full product description                                                  |
| base_price   | string (decimal) | Base price as a decimal string — parse with parseFloat() on the frontend  |
| popularity   | integer          | Total views + wishlist adds across all cities. Higher = more popular.     |
| images       | array of strings | Array of image URLs. Empty array [] if no images exist for this product.  |

---

## Postman Testing

**Method**: GET
**URL**: `http://localhost:3000/api/landing/suggestions`
**Body**: None
**Headers**: None

Expected status: `200 OK`

### Edge Cases to Verify
- Products with no entries in `product_demand` still appear (popularity = 0)
- Products with no entries in `product_images` still appear (images = [])
- Response always contains at most 10 products
- Products are ordered highest popularity first

---

## Seeding Test Data

The `product_demand` table requires at least some data for popularity
ranking to be meaningful. If your DB is empty, all products will return
with `popularity: 0` and ordering will be arbitrary.

To seed some test demand data, run this in pgAdmin/DBeaver:

```sql
-- Add some test demand entries (adjust product_id values to ones that exist in your DB)
INSERT INTO product_demand (product_id, city, views_count, wishlist_count)
VALUES
  (1, 'Mumbai',    320, 45),
  (1, 'Pune',      210, 30),
  (2, 'Mumbai',    150, 20),
  (3, 'Delhi',     500, 80),
  (4, 'Bangalore', 420, 60)
ON CONFLICT (product_id, city) DO UPDATE
  SET views_count    = EXCLUDED.views_count,
      wishlist_count = EXCLUDED.wishlist_count;
```

To seed test images:
```sql
INSERT INTO product_images (product_id, image_url)
VALUES
  (1, 'https://picsum.photos/seed/prod1/400/300'),
  (1, 'https://picsum.photos/seed/prod1b/400/300'),
  (2, 'https://picsum.photos/seed/prod2/400/300'),
  (3, 'https://picsum.photos/seed/prod3/400/300');
```

---

## Frontend Integration Notes

### Rendering a Product Card
Each object in `data` contains everything needed to render a card:

```jsx
// React example
function ProductCard({ product }) {
  return (
    <div className="card">
      <img
        src={product.images[0] ?? "/placeholder.png"}
        alt={product.model_name}
      />
      <h3>{product.brand} {product.model_name}</h3>
      <p>{product.category}</p>
      <p>₹{parseFloat(product.base_price).toLocaleString("en-IN")}</p>
    </div>
  );
}
```

### Key Points
- `base_price` comes as a string — always use `parseFloat()` before
  arithmetic or formatting.
- `images[0]` is the primary display image. Always provide a fallback
  in case `images` is an empty array.
- `popularity` is available if you want to show a "Trending" badge —
  e.g. if `popularity > 500` show a badge.
- Products are pre-sorted server-side — render them in the order received.

---

## How Popularity is Calculated

```
product_demand table has rows per (product_id, city) combination.

Example for product_id = 1:
  Mumbai  → views: 320, wishlist: 45  → subtotal: 365
  Pune    → views: 210, wishlist: 30  → subtotal: 240

  Total popularity for product 1 = 365 + 240 = 605
```

This global sum ensures that a product popular across many cities
ranks higher than one that is popular only in a single city.