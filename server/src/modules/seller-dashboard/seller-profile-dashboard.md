# Seller Profile & Dashboard — Documentation

## Overview
Two modules covered in this document:

1. **Seller Profile** — view and complete shop profile after registration
2. **Seller Dashboard** — manage product listings (create, view, update, delete)

All endpoints are protected. The seller must be logged in with a valid
access token carrying the `seller` role.

**Authorization header required on all requests:**
```
Authorization: Bearer <accessToken>
```

---

## MODULE 1 — Seller Profile

### GET /api/seller/profile

**Description:** Returns the seller's current shop profile including
a computed `is_profile_complete` flag. The frontend uses this flag to
decide whether to show the profile completion form.

**Request:** No body. `seller_id` read from JWT token.

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Seller profile fetched successfully.",
  "data": {
    "seller_id": 2,
    "user_id": 24,
    "shop_name": "TechZone Electronics",
    "latitude": null,
    "longitude": null,
    "city": null,
    "pincode": null,
    "is_verified": false,
    "google_place_id": null,
    "average_rating": 0,
    "review_count": 0,
    "is_profile_complete": false
  }
}
```

`is_profile_complete` is `true` only when both `latitude` and `longitude`
are present. A seller with `is_profile_complete: false` cannot create
product listings.

---

### PUT /api/seller/profile/complete

**Description:** Updates any combination of profile fields. Partial
updates are supported — send only the fields you want to change.
Both `latitude` and `longitude` must be sent together if either is provided.

**Request Body (all fields optional):**

| Field     | Type   | Description                          |
|-----------|--------|--------------------------------------|
| shop_name | string | Display name of the shop             |
| latitude  | number | Shop latitude (-90 to 90)            |
| longitude | number | Shop longitude (-180 to 180)         |
| city      | string | City name                            |
| pincode   | string | Shop pincode                         |

**Example Request — add coordinates to complete profile:**
```json
{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "city": "Pune",
    "pincode": "411001"
}
```

**Example Request — update shop name only:**
```json
{
    "shop_name": "TechZone Electronics & Accessories"
}
```

**Success Response (200) — profile now complete:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Profile updated successfully. Your shop is now visible in search results.",
  "data": {
    "seller_id": 2,
    "shop_name": "TechZone Electronics",
    "latitude": 18.5204,
    "longitude": 73.8567,
    "city": "Pune",
    "pincode": "411001",
    "is_profile_complete": true
  }
}
```

**Success Response (200) — profile still incomplete:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Profile updated. Add your shop coordinates to appear in search results.",
  "data": {
    "seller_id": 2,
    "shop_name": "TechZone Electronics & Accessories",
    "latitude": null,
    "longitude": null,
    "city": null,
    "pincode": null,
    "is_profile_complete": false
  }
}
```

---

## MODULE 2 — Seller Dashboard

---

### GET /api/seller/dashboard/catalogue/search?q=samsung

**Description:** Search the product catalogue to find products to list.
Returns all matching products regardless of whether the seller already
lists them. Minimum 2 characters required.

**Query Parameters:**

| Param | Type   | Required | Description          |
|-------|--------|----------|----------------------|
| q     | string | Yes      | Search query (2+ chars) |

**Example Request:**
```
GET http://localhost:3000/api/seller/dashboard/catalogue/search?q=samsung
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Catalogue search results fetched.",
  "data": [
    {
      "product_id": 1,
      "brand": "Samsung",
      "model_name": "Galaxy S24 Ultra",
      "category": "Smartphone",
      "description": "Flagship Android smartphone with S-Pen support.",
      "base_price": 109999.00,
      "image_url": "https://picsum.photos/seed/prod1/400/300"
    }
  ]
}
```

---

### POST /api/seller/dashboard/listings

**Description:** Creates a new product listing or merges stock into an
existing one.

**Duplicate merge rule:**
If a listing with the same `(seller_id, product_id, warranty_months)`
already exists → stock is added and price is updated. A new listing is
NOT created. The `action` field in the response tells you which happened.

**Profile enforcement:**
If the seller's profile is incomplete (no coordinates), this endpoint
returns `403` directing them to complete their profile first.

**Request Body:**

| Field           | Type    | Required | Description                           |
|-----------------|---------|----------|---------------------------------------|
| product_id      | integer | Yes      | From catalogue search results         |
| price           | number  | Yes      | Seller's listing price (must be > 0)  |
| stock_quantity  | integer | Yes      | Units available (must be > 0)         |
| warranty_months | integer | No       | Months of warranty. Default 0. Immutable after creation. |

**Example Request:**
```json
{
    "product_id": 1,
    "price": 104999.00,
    "stock_quantity": 5,
    "warranty_months": 12
}
```

**Success Response — new listing created (201):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Product listed successfully.",
  "data": {
    "seller_product_id": 3,
    "seller_id": 2,
    "product_id": 1,
    "price": 104999.00,
    "stock_quantity": 5,
    "is_available": true,
    "warranty_months": 12,
    "action": "created"
  }
}
```

**Success Response — stock merged into existing listing (201):**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Stock merged into existing listing successfully.",
  "data": {
    "seller_product_id": 3,
    "seller_id": 2,
    "product_id": 1,
    "price": 104999.00,
    "stock_quantity": 10,
    "is_available": true,
    "warranty_months": 12,
    "action": "merged"
  }
}
```

**Profile incomplete error (403):**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Your shop profile is incomplete. Please add your shop location before listing products."
}
```

---

### GET /api/seller/dashboard/listings

**Description:** Returns all of the seller's listings with summary info
including whether an active offer exists and the current offer price.
Ordered most recently created first.

**Request:** No body.

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Listings fetched successfully.",
  "data": [
    {
      "seller_product_id": 3,
      "product_id": 1,
      "brand": "Samsung",
      "model_name": "Galaxy S24 Ultra",
      "category": "Smartphone",
      "price": 104999.00,
      "stock_quantity": 5,
      "is_available": true,
      "warranty_months": 12,
      "image_url": "https://picsum.photos/seed/prod1/400/300",
      "has_active_offer": true,
      "offer_final_price": 94499.10
    }
  ]
}
```

---

### GET /api/seller/dashboard/listings/:seller_product_id

**Description:** Full detail of a single listing including price history
and active offers. Ownership verified — sellers can only view their
own listings.

**Example Request:**
```
GET http://localhost:3000/api/seller/dashboard/listings/3
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Listing detail fetched successfully.",
  "data": {
    "seller_product_id": 3,
    "product_id": 1,
    "brand": "Samsung",
    "model_name": "Galaxy S24 Ultra",
    "category": "Smartphone",
    "description": "Flagship Android smartphone with S-Pen support.",
    "base_price": 109999.00,
    "price": 94999.00,
    "stock_quantity": 5,
    "is_available": true,
    "warranty_months": 12,
    "price_history": [
      { "history_id": 1, "price": 104999.00, "recorded_at": "2026-04-01T10:00:00Z" },
      { "history_id": 2, "price": 99999.00,  "recorded_at": "2026-04-10T14:00:00Z" },
      { "history_id": 3, "price": 94999.00,  "recorded_at": "2026-04-20T09:00:00Z" }
    ],
    "active_offers": [
      {
        "offer_id": 5,
        "discount_type": "percent",
        "discount_value": 9.52,
        "final_price": 85999.10,
        "start_date": "2026-04-20",
        "end_date": "9999-12-31"
      }
    ]
  }
}
```

---

### PATCH /api/seller/dashboard/listings/:seller_product_id

**Description:** Updates price, stock_quantity, and/or is_available.
At least one field must be provided. Warranty cannot be updated.

**Auto price slash offer logic:**
- If new price < original listing price → a `percent` type offer is
  automatically created showing the % reduction from original price.
- If price is raised back to or above original → auto offer is removed.
- Manual offers (created via future offers module) are never touched.

**Stock auto-deactivation:**
- If `stock_quantity` is set to `0` → `is_available` is automatically
  set to `false` by the backend regardless of what is_available was set to.

**Request Body (at least one required):**

| Field          | Type    | Description                              |
|----------------|---------|------------------------------------------|
| price          | number  | New price (must be > 0 if provided)      |
| stock_quantity | integer | New stock (0 or positive)               |
| is_available   | boolean | Manually toggle availability             |

**Example — price reduction:**
```json
{
    "price": 94999.00
}
```

**Success Response — with auto price slash offer (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Listing updated. A 9.52% off offer has been automatically applied based on the price reduction.",
  "data": {
    "seller_product_id": 3,
    "price": 94999.00,
    "stock_quantity": 5,
    "is_available": true,
    "warranty_months": 12,
    "discount_percent": 9.52
  }
}
```

**Example — mark as unavailable:**
```json
{
    "is_available": false
}
```

**Example — restock:**
```json
{
    "stock_quantity": 10
}
```

---

### DELETE /api/seller/dashboard/listings/:seller_product_id

**Description:** Permanently deletes the listing and all its related
records (offers and price history). This is irreversible.

Sellers delete a listing when they want to re-list with a different
warranty — the only immutable field.

**Request:** No body.

**Success Response (200):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Listing deleted successfully.",
  "data": null
}
```

---

## Postman Testing Guide

### Full Seller Flow — Step by Step

**1. Register seller:**
```
POST /api/seller/auth/register
Body: { name, email, password, shop_name }
(omit latitude/longitude to test incomplete profile flow)
```

**2. Login:**
```
POST /api/seller/auth/login
Body: { email, password }
Save the accessToken from response
```

**3. Check profile — should show is_profile_complete: false:**
```
GET /api/seller/profile
Header: Authorization: Bearer <token>
```

**4. Complete profile:**
```
PUT /api/seller/profile/complete
Header: Authorization: Bearer <token>
Body: { "latitude": 18.5204, "longitude": 73.8567, "city": "Pune", "pincode": "411001" }
```

**5. Try creating a listing BEFORE completing profile — should get 403:**
```
POST /api/seller/dashboard/listings
(do this before step 4 to verify the guard works)
```

**6. Search catalogue:**
```
GET /api/seller/dashboard/catalogue/search?q=samsung
Header: Authorization: Bearer <token>
```

**7. Create listing:**
```
POST /api/seller/dashboard/listings
Header: Authorization: Bearer <token>
Body: { "product_id": 1, "price": 104999, "stock_quantity": 5, "warranty_months": 12 }
```

**8. View all listings:**
```
GET /api/seller/dashboard/listings
```

**9. View single listing detail:**
```
GET /api/seller/dashboard/listings/1         <-- "1" here is seller_product_id & not product_id
```

**10. Reduce price — observe auto offer:**
```
PATCH /api/seller/dashboard/listings/1       <-- "1" here is seller_product_id & not product_id
Body: { "price": 94999 }
Note: discount_percent will appear in response
```

**11. Raise price back — auto offer removed:**
```
PATCH /api/seller/dashboard/listings/1
Body: { "price": 104999 }
Note: discount_percent will be null
```

**12. Set stock to 0 — auto deactivation:**
```
PATCH /api/seller/dashboard/listings/1
Body: { "stock_quantity": 0 }
Note: is_available becomes false automatically
```

**13. Delete listing:**
```
DELETE /api/seller/dashboard/listings/1
```

---

## Business Rules Summary

| Rule | Detail |
|------|--------|
| Profile required | Seller must have coordinates before creating listings |
| Warranty immutable | Cannot be changed after listing creation — delete and re-list |
| Duplicate handling | Same product + same warranty = stock merge, not new listing |
| Stock = 0 | Auto-sets is_available to false |
| Price slash | Auto-generates percent offer if below original price |
| Price restoration | Auto-removes the generated offer |
| Manual offers | Never touched by auto-offer logic (is_auto_generated = false) |
| Ownership | All listing operations verify seller owns the listing |
| Delete cascade | Deleting a listing removes all its offers and price history |