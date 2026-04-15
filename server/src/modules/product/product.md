# Product Detail Module — Documentation

## Overview
The product detail module serves the full detail page for a specific
seller's listing of a product. It is reached by clicking a search result
card which carries a `seller_product_id`.

One endpoint, public, no authentication required.

---

## Endpoint

### GET /api/products/:seller_product_id

**Description:**
Returns all data needed to render the product detail + store page including
product info, seller info, active offers, price history, and external
market price comparisons.

**Authentication:** None — public endpoint.

**URL Parameter:**

| Param              | Type    | Description                                  |
|--------------------|---------|----------------------------------------------|
| seller_product_id  | integer | The unique listing ID from search results    |

**Example Request:**
```
GET http://localhost:3000/api/products/1
```

---

## Architecture Note

This module uses **7 focused stored procedures** called in parallel
rather than one large procedure. The service layer:
1. Fetches `get_product_core` first (needs product_id + seller_id)
2. Fires the remaining 6 procedures simultaneously via `Promise.all()`

This minimises response time and keeps each procedure independently
testable and reusable.

---

## Full Response Shape

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Product detail fetched successfully.",
  "data": {

    "listing": {
      "seller_product_id": 1,
      "seller_price": 104999.00,
      "stock_quantity": 5,
      "is_available": true,
      "warranty_months": 12
    },

    "product": {
      "product_id": 1,
      "brand": "Samsung",
      "model_name": "Galaxy S24 Ultra",
      "category": "Smartphone",
      "description": "Flagship Android smartphone with S-Pen support.",
      "base_price": 109999.00,
      "average_rating": 4.90,
      "review_count": 12,
      "images": [
        { "image_id": 1, "image_url": "https://picsum.photos/seed/prod1/400/300" },
        { "image_id": 2, "image_url": "https://picsum.photos/seed/prod1b/400/300" }
      ],
      "specifications": [
        { "spec_id": 1, "spec_key": "RAM",     "spec_value": "12GB" },
        { "spec_id": 2, "spec_key": "Storage", "spec_value": "256GB" },
        { "spec_id": 3, "spec_key": "Display", "spec_value": "6.8 inch QHD+ AMOLED" }
      ]
    },

    "seller": {
      "seller_id": 1,
      "shop_name": "TechZone Electronics",
      "city": "Pune",
      "pincode": "411001",
      "latitude": 18.5204,
      "longitude": 73.8567,
      "is_verified": true,
      "google_place_id": null,
      "average_rating": 4.20,
      "review_count": 47,
      "images": [
        "https://example.com/shop-front.jpg"
      ]
    },

    "offers": [
      {
        "offer_id": 1,
        "discount_type": "flat",
        "discount_value": 5000.00,
        "final_price": 99999.00,
        "start_date": "2026-04-01",
        "end_date": "2026-04-30"
      }
    ],

    "price_history": [
      { "history_id": 1, "price": 112999.00, "recorded_at": "2025-06-15T10:30:00Z" },
      { "history_id": 2, "price": 109999.00, "recorded_at": "2025-09-01T08:00:00Z" },
      { "history_id": 3, "price": 104999.00, "recorded_at": "2026-01-10T12:00:00Z" }
    ],

    "external_prices": [
      {
        "external_price_id": 1,
        "platform_name": "Amazon",
        "price": 107990.00,
        "last_updated": "2026-04-10T06:00:00Z"
      },
      {
        "external_price_id": 2,
        "platform_name": "Flipkart",
        "price": 106999.00,
        "last_updated": "2026-04-10T06:00:00Z"
      }
    ]

  }
}
```

---

## Field Reference

### listing
| Field              | Type    | Description                                    |
|--------------------|---------|------------------------------------------------|
| seller_product_id  | integer | Unique identifier for this seller's listing    |
| seller_price       | float   | Price set by this seller                       |
| stock_quantity     | integer | Units in stock (0 = out of stock)              |
| is_available       | boolean | Whether the listing is active                  |
| warranty_months    | integer | Seller warranty in months (0 = no warranty)    |

### product
| Field          | Type            | Description                                      |
|----------------|-----------------|--------------------------------------------------|
| product_id     | integer         | Catalogue product identifier                     |
| brand          | string          | Brand name                                       |
| model_name     | string          | Model name                                       |
| category       | string          | Product category                                 |
| description    | string          | Full product description                         |
| base_price     | float           | Catalogue base price (may differ from seller)    |
| average_rating | float 0.00-5.00 | Product rating (dummy data initially)            |
| review_count   | integer         | Number of product reviews                        |
| images         | array           | All product images [{image_id, image_url}]       |
| specifications | array           | Key-value pairs [{spec_id, spec_key, spec_value}]|

### seller
| Field           | Type            | Description                                     |
|-----------------|-----------------|-------------------------------------------------|
| seller_id       | integer         | Seller identifier                               |
| shop_name       | string          | Shop display name                               |
| city            | string          | City where shop is located                      |
| pincode         | string          | Shop pincode                                    |
| latitude        | float           | Shop latitude — pass to Google Maps embed       |
| longitude       | float           | Shop longitude — pass to Google Maps embed      |
| is_verified     | boolean         | Whether seller is verified by LocalMart         |
| google_place_id | string or null  | For future Google Places API integration        |
| average_rating  | float 0.00-5.00 | Seller rating (from Google Places eventually)   |
| review_count    | integer         | Number of seller reviews                        |
| images          | array of strings| All seller shop images (URLs)                   |

### offers (array — may be empty [])
| Field          | Type    | Description                                        |
|----------------|---------|----------------------------------------------------|
| offer_id       | integer | Offer identifier                                   |
| discount_type  | string  | 'flat' or 'percent'                                |
| discount_value | float   | Amount or percentage off                           |
| final_price    | float   | Calculated final price after discount              |
| start_date     | date    | Offer start date                                   |
| end_date       | date    | Offer end date                                     |

### price_history (array — may be empty [])
| Field       | Type      | Description                                         |
|-------------|-----------|-----------------------------------------------------|
| history_id  | integer   | History entry identifier                            |
| price       | float     | Price recorded at this point in time                |
| recorded_at | timestamp | When this price was recorded (oldest → newest)      |

Ordered oldest to newest — suitable for direct use in a chart library
(x-axis = recorded_at, y-axis = price).

### external_prices (array — may be empty [])
| Field             | Type      | Description                               |
|-------------------|-----------|-------------------------------------------|
| external_price_id | integer   | Record identifier                         |
| platform_name     | string    | e.g. "Amazon", "Flipkart"                 |
| price             | float     | Price on that platform                    |
| last_updated      | timestamp | When the price was last fetched           |

Ordered cheapest first for easy comparison.

---

## Postman Testing

**Basic test:**
```
GET http://localhost:3000/api/products/1
```
Expected: 200 with full data object (offers and price_history may be empty arrays
until you seed that data)

**Non-existent listing:**
```
GET http://localhost:3000/api/products/99999
```
Expected: 404 "Product listing not found."

**Invalid ID:**
```
GET http://localhost:3000/api/products/abc
```
Expected: 400 "Invalid seller product ID."

---

## Seeding Test Data

### Seed product specifications
```sql
INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES
  (1, 'Display',   '6.8 inch QHD+ Dynamic AMOLED'),
  (1, 'Processor', 'Snapdragon 8 Gen 3'),
  (1, 'RAM',       '12GB'),
  (1, 'Storage',   '256GB'),
  (1, 'Battery',   '5000mAh'),
  (1, 'Camera',    '200MP Main + 12MP Ultrawide'),
  (2, 'Display',   '13.6 inch Liquid Retina'),
  (2, 'Processor', 'Apple M2'),
  (2, 'RAM',       '8GB Unified Memory'),
  (2, 'Storage',   '256GB SSD'),
  (2, 'Battery',   '18 hours');
```

### Seed an active offer
```sql
-- Flat ₹5000 off on seller_product_id = 1, valid this month
INSERT INTO seller_product_offers
  (seller_product_id, discount_type, discount_value, start_date, end_date)
VALUES
  (1, 'flat', 5000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- 10% off example
INSERT INTO seller_product_offers
  (seller_product_id, discount_type, discount_value, start_date, end_date)
VALUES
  (1, 'percent', 10.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days');
```

### Seed price history (for the chart)
```sql
INSERT INTO product_price_history (seller_product_id, price, recorded_at) VALUES
  (1, 114999.00, NOW() - INTERVAL '300 days'),
  (1, 112999.00, NOW() - INTERVAL '240 days'),
  (1, 110999.00, NOW() - INTERVAL '180 days'),
  (1, 109999.00, NOW() - INTERVAL '120 days'),
  (1, 107999.00, NOW() - INTERVAL '60 days'),
  (1, 104999.00, NOW() - INTERVAL '10 days');
```

### Seed external market prices
```sql
INSERT INTO external_market_prices (product_id, platform_name, price, last_updated) VALUES
  (1, 'Amazon',   107990.00, NOW()),
  (1, 'Flipkart', 106999.00, NOW()),
  (1, 'Croma',    109990.00, NOW());
```

---

## How Offer Price Calculation Works

```
discount_type = 'flat':
  final_price = seller_price - discount_value
  Example: ₹104,999 - ₹5,000 = ₹99,999

discount_type = 'percent':
  final_price = seller_price - (seller_price × discount_value / 100)
  Example: ₹104,999 - (₹104,999 × 10 / 100) = ₹94,499.10

Edge case: final_price is floored at 0 (GREATEST(0, calculated))
to prevent negative prices from bad data.
```

---

## Google Maps Integration (Frontend)

The `seller.latitude` and `seller.longitude` fields are all the frontend
needs to render a map. Example React usage:

```jsx
// Google Maps Embed API — simplest approach, no JS SDK needed
function ShopMap({ latitude, longitude, shopName }) {
  const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
  return (
    <iframe
      src={src}
      width="100%"
      height="400"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      title={`Map for ${shopName}`}
    />
  );
}
```

When `google_place_id` is populated (future module), you can switch to
the Places API for richer map interactions and real reviews.