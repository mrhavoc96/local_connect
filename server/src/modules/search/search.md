# Search Module — Documentation

## Overview
The search module powers product discovery on LocalMart.
It exposes two endpoints — a lightweight autocomplete for the search
dropdown and a full proximity-based search for product listings.

Both endpoints are public — no authentication required.

---

## Endpoints

---

### 1. GET /api/search/suggest

**Purpose:** Autocomplete suggestions as the user types.
Call this on every keystroke after the user has typed 2+ characters.

**Query Parameters:**

| Param | Type   | Required | Description          |
|-------|--------|----------|----------------------|
| q     | string | Yes      | Partial search query |

**Example Request:**
```
GET http://localhost:3000/api/search/suggest?q=iph
```

**Example Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Autocomplete suggestions fetched.",
  "data": [
    {
      "product_id": 1,
      "brand": "Apple",
      "model_name": "iPhone 15 Pro",
      "category": "Smartphone"
    },
    {
      "product_id": 2,
      "brand": "Apple",
      "model_name": "iPhone 14",
      "category": "Smartphone"
    }
  ]
}
```

**Notes:**
- Returns at most 8 results
- Returns empty array `[]` if query is less than 2 characters — not an error
- Results are sorted: exact prefix matches first, then broader matches
- No location data involved — catalogue-wide search

---

### 2. GET /api/search

**Purpose:** Full proximity-based product search.
Returns seller listings for matching products sorted nearest to furthest.

**Query Parameters:**

| Param  | Type   | Required | Default | Description                        |
|--------|--------|----------|---------|------------------------------------|
| q      | string | Yes      | —       | Search query                       |
| lat    | number | Yes      | —       | User's latitude coordinate         |
| lng    | number | Yes      | —       | User's longitude coordinate        |
| radius | number | No       | 5       | Search radius in km (max 50)       |

**Example Requests:**
```
GET http://localhost:3000/api/search?q=samsung&lat=18.5204&lng=73.8567&radius=5
GET http://localhost:3000/api/search?q=samsung&lat=18.5204&lng=73.8567&radius=10
GET http://localhost:3000/api/search?q=samsung&lat=18.5204&lng=73.8567
```

---

## Response Shapes

The `status` field in `data` tells the frontend what happened.
Always read `status` first before rendering.

### status: "found"
Products and nearby sellers were found.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Search results fetched successfully.",
  "data": {
    "status": "found",
    "can_expand": false,
    "results": [
      {
        "seller_product_id": 3,
        "product_id": 1,
        "brand": "Samsung",
        "model_name": "Galaxy S24 Ultra",
        "category": "Smartphone",
        "base_price": "109999.00",
        "seller_price": "104999.00",
        "warranty_months": 12,
        "product_average_rating": 4.5,
        "product_review_count": 128,
        "seller_id": 2,
        "shop_name": "TechZone Electronics",
        "seller_average_rating": 4.2,
        "seller_review_count": 47,
        "distance_km": 1.23,
        "image_url": "https://picsum.photos/seed/prod1/400/300"
      }
    ]
  }
}
```

### status: "not_in_catalogue"
The search term does not match any product in LocalMart's catalogue.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Product not found in catalogue.",
  "data": {
    "status": "not_in_catalogue",
    "can_expand": false,
    "message": "This product is not available on LocalMart yet.",
    "results": []
  }
}
```

**Frontend action:** Show message. No expand button.

### status: "no_sellers_in_radius"
Product exists in catalogue and sellers carry it, but none are within
the requested radius. Sellers do exist within 50km though.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "No sellers found within the specified radius.",
  "data": {
    "status": "no_sellers_in_radius",
    "can_expand": true,
    "message": "No sellers found within 5km of your location. Try expanding your search radius.",
    "results": []
  }
}
```

**Frontend action:** Show message + "Expand Search" button.
On click, re-call the endpoint with a larger radius (e.g. +5km increments).

### status: "no_sellers_in_range"
Product exists in catalogue but no sellers within 50km carry it.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "No sellers found within 50km.",
  "data": {
    "status": "no_sellers_in_range",
    "can_expand": false,
    "message": "No sellers carrying this product were found within 50km of your location.",
    "results": []
  }
}
```

**Frontend action:** Show message. No expand button.

---

## Result Field Reference

| Field                  | Type           | Description                                              |
|------------------------|----------------|----------------------------------------------------------|
| seller_product_id      | integer        | Links to the full product+store page (future module)     |
| product_id             | integer        | Product identifier                                       |
| brand                  | string         | Brand name                                               |
| model_name             | string         | Model name                                               |
| category               | string         | Product category                                         |
| base_price             | float          | Catalogue base price — parse with parseFloat()           |
| seller_price           | float          | This seller's actual price — may differ from base_price  |
| warranty_months        | integer        | Warranty offered by this seller in months (0 = none)     |
| product_average_rating | float          | Product rating 0.00–5.00 (dummy data initially)          |
| product_review_count   | integer        | Number of product reviews                                |
| seller_id              | integer        | Seller identifier                                        |
| shop_name              | string         | Seller's shop name                                       |
| seller_average_rating  | float          | Seller rating 0.00–5.00 (from Google Places eventually)  |
| seller_review_count    | integer        | Number of seller reviews                                 |
| distance_km            | float          | Distance from user to shop in kilometres                 |
| image_url              | string or null | First product image URL. Use placeholder if null.        |

---

## Postman Testing

### Setup
Since sellers need coordinates for proximity search to work, seed
test seller data with real-ish Pune coordinates first (see below).

### Test Sequence

**1. Autocomplete (no location needed):**
```
GET http://localhost:3000/api/search/suggest?q=sam
```
Expected: Samsung products appear

**2. Full search — found:**
```
GET http://localhost:3000/api/search?q=samsung&lat=18.5204&lng=73.8567&radius=10
```
Expected: status "found" with listings if test sellers are seeded

**3. Full search — no location:**
```
GET http://localhost:3000/api/search?q=samsung
```
Expected: 400 error asking for location

**4. Full search — nothing in catalogue:**
```
GET http://localhost:3000/api/search?q=randomgarbage123&lat=18.5204&lng=73.8567
```
Expected: status "not_in_catalogue"

**5. Full search — small radius to force no_sellers_in_radius:**
```
GET http://localhost:3000/api/search?q=samsung&lat=18.5204&lng=73.8567&radius=0.001
```
Expected: status "no_sellers_in_radius" with can_expand: true

---

## Seeding Test Data for Search

To test the proximity search, you need sellers with coordinates
and seller_products linking them to the catalogue products.

```sql
-- Insert a test user to own the seller profile
INSERT INTO users (name, email, password_hash, is_active)
VALUES ('Test Seller', 'seller@test.com', 'hash', true)
RETURNING user_id;
-- Note the user_id returned — use it below

-- Insert seller profile with Pune coordinates
-- Replace <user_id> with the value returned above
INSERT INTO seller_profiles
    (user_id, shop_name, latitude, longitude, city, pincode,
     is_verified, average_rating, review_count)
VALUES
    (<user_id>, 'TechZone Electronics', 18.5204, 73.8567,
     'Pune', '411001', true, 4.20, 47);

-- Note the seller_id from the insert above, then:
INSERT INTO seller_products
    (seller_id, product_id, price, stock_quantity, is_available, warranty_months)
VALUES
    (<seller_id>, 1, 104999.00, 5,  true, 12),
    (<seller_id>, 2, 97999.00,  3,  true, 12),
    (<seller_id>, 3, 27999.00,  10, true, 6);

-- Seed dummy ratings on products
UPDATE products SET average_rating = 4.50, review_count = 128 WHERE product_id = 1;
UPDATE products SET average_rating = 4.70, review_count = 340 WHERE product_id = 2;
UPDATE products SET average_rating = 4.40, review_count = 89  WHERE product_id = 3;
UPDATE products SET average_rating = 4.10, review_count = 52  WHERE product_id = 4;
```

---

## How Proximity Search Works

The Haversine formula calculates the straight-line distance between
two points on the Earth's surface given their lat/lng coordinates:

```
distance = 6371 × acos(
  cos(lat1) × cos(lat2) × cos(lng2 - lng1) +
  sin(lat1) × sin(lat2)
)
```

6371 is Earth's radius in km. The result is in km.

The stored procedure runs this calculation for every seller in the DB
and filters to those within the specified radius. This is accurate
to within ~0.5% for distances under 100km — more than sufficient
for a hyperlocal commerce platform.

---

## Frontend Integration Notes

```js
// Autocomplete — call on input with debounce (300ms recommended)
const suggest = async (query) => {
  if (query.length < 2) return [];
  const res = await fetch(`/api/search/suggest?q=${query}`);
  const { data } = await res.json();
  return data; // array of { product_id, brand, model_name, category }
};

// Full search — call on form submit or Enter keypress
const search = async (query, lat, lng, radius = 5) => {
  const res = await fetch(
    `/api/search?q=${query}&lat=${lat}&lng=${lng}&radius=${radius}`
  );
  const { data } = await res.json();

  switch (data.status) {
    case 'found':
      renderResults(data.results);
      break;
    case 'no_sellers_in_radius':
      showMessage(data.message);
      if (data.can_expand) showExpandButton(radius + 5);
      break;
    case 'not_in_catalogue':
    case 'no_sellers_in_range':
      showMessage(data.message);
      break;
  }
};
```