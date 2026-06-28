# Seller Auth Module — Documentation

## Overview
The seller auth module handles authentication for the seller portal.
It is intentionally separate from the customer auth module because
seller registration creates both a user account and a shop profile
in a single transaction, and the login flow includes a role guard
that prevents customer accounts from accessing the seller portal.

No email verification is required for sellers — accounts are active immediately.

---

## Endpoints

| Method | Path                              | Auth | Description                        |
|--------|-----------------------------------|------|------------------------------------|
| POST   | /api/seller/auth/register         | No   | Register new seller + shop profile |
| POST   | /api/seller/auth/login            | No   | Login with seller role guard       |
| POST   | /api/seller/auth/refresh-token    | No   | Refresh access token via cookie    |
| POST   | /api/seller/auth/logout           | No   | Clear refresh token cookie         |

---

## Endpoint Details

---

### POST /api/seller/auth/register

**Description:**
Creates a user account, assigns the `seller` role, and creates a
`seller_profiles` row — all in a single atomic database transaction.
The seller is active immediately with no email verification step.

**Request Body:**

| Field      | Type   | Required | Description                              |
|------------|--------|----------|------------------------------------------|
| name       | string | Yes      | Seller's full name                       |
| email      | string | Yes      | Must be a real email (format + MX check) |
| password   | string | Yes      | Minimum 8 characters                     |
| shop_name  | string | Yes      | Display name of the shop                 |
| phone      | string | No       | Contact phone number                     |
| city       | string | No       | City where shop is located               |
| pincode    | string | No       | Shop pincode                             |
| latitude   | number | No       | Shop latitude (for map)                  |
| longitude  | number | No       | Shop longitude (for map)                 |

`latitude` and `longitude` are optional at registration — a seller
may not know their exact coordinates immediately. These can be updated
later via the seller profile module.

**Example Request:**
```json
{
    "name": "Shop Owner",
    "email": "owner@gmail.com",
    "phone": "9876543210",  
    "password": "password123",
    "shop_name": "TechZone Electronics",
    "city": "Pune",
    "pincode": "411001",
    "latitude": 18.5204,
    "longitude": 73.8567
}
```

**Success Response (201):**
```json
{
    "statusCode": 201,
    "success": true,
    "message": "Seller account created successfully. You can now log in.",
    "data": {
        "user_id": 24,
        "name": "Shop Owner",
        "email": "owner@gmail.com",
        "seller_id": 2,
        "shop_name": "TechZone Electronics",
        "city": "Pune",
        "pincode": "411001",
        "is_verified": false
    }
}
```

**Note on `is_verified`:**
`is_verified` on `seller_profiles` refers to LocalMart's internal
verification of the shop (e.g. physical visit, document check) — not
email verification. It defaults to `false` and will be set to `true`
by an admin action in a future module. Sellers can log in regardless
of `is_verified` status but the portal may restrict certain features
until they are verified.

---

### POST /api/seller/auth/login

**Description:**
Authenticates a seller. Includes a role guard — a customer account
cannot be used to log into the seller portal even with correct
credentials.

On success:
- `accessToken` returned in response body (store in memory on frontend)
- `refreshToken` set as httpOnly cookie (handled automatically by browser)

**Request Body:**

| Field    | Type   | Required | Description    |
|----------|--------|----------|----------------|
| email    | string | Yes      | Seller's email |
| password | string | Yes      | Password       |

**Example Request:**
```json
{
    "email": "owner@gmail.com",
    "password": "password123"
}
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Logged in successfully.",
    "data": {
        "user": {
            "user_id": 24,
            "name": "Shop Owner",
            "email": "owner@gmail.com",
            "roles": ["seller"],
            "seller_id": 2,
            "shop_name": "TechZone Electronics",
            "is_verified": false
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Note on JWT payload:**
The access token payload contains `user_id`, `roles`, and `seller_id`.
This means seller-protected routes can read `req.user.seller_id`
directly from the token without an extra database call.

---

### POST /api/seller/auth/refresh-token

**Description:**
Issues a new access token using the refresh token stored in the
httpOnly cookie. Also confirms the user still has the seller role.

**Request:** No body. Refresh token read automatically from cookie.

**Success Response (200):**
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Access token refreshed.",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

---

### POST /api/seller/auth/logout

**Description:**
Clears the refresh token cookie. The frontend is responsible for
discarding the access token on its end.

**Request:** No body.

**Success Response (200):**
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Logged out successfully.",
    "data": null
}
```

---

## Error Responses

| Status | Scenario                                                    |
|--------|-------------------------------------------------------------|
| 400    | Missing required fields                                     |
| 400    | Invalid email format                                        |
| 400    | Email domain has no MX records (fake domain)                |
| 400    | Password less than 8 characters                             |
| 401    | Wrong email or password (generic — doesn't confirm email)   |
| 401    | Expired or invalid refresh token                            |
| 403    | Account exists but does not have seller role                |
| 409    | Email already registered                                    |

---

## Postman Testing

### Recommended Test Sequence

**1. Register a seller:**
```
POST http://localhost:3000/api/seller/auth/register
Body: { name, email, phone, password, shop_name, city, pincode, latitude, longitude }
Expected: 201
```

**2. Login immediately (no verification needed):**
```
POST http://localhost:3000/api/seller/auth/login
Body: { email, password }
Expected: 200 with accessToken in body + refreshToken cookie set
```

**3. Refresh token:**
```
POST http://localhost:3000/api/seller/auth/refresh-token
No body — cookie sent automatically
Expected: 200 with new accessToken
```

**4. Logout:**
```
POST http://localhost:3000/api/seller/auth/logout
No body
Expected: 200 + refreshToken cookie cleared
```

### Edge Case Tests

**Role guard — customer trying to use seller login:**
```
POST http://localhost:3000/api/seller/auth/login
Body: { email: "johndoe@gmail.com", password: "password123" }
(use a customer account email)
Expected: 403 "This account does not have seller access."
```

**Duplicate email:**
```
POST http://localhost:3000/api/seller/auth/register
Body: { same email as already registered seller }
Expected: 409 "An account with this email already exists."
```

**Missing shop_name:**
```
POST http://localhost:3000/api/seller/auth/register
Body: { name, email, password } — no shop_name
Expected: 400 "Name, email, password, and shop name are required."
```

---

## How This Differs from Customer Auth

| Aspect               | Customer Auth                    | Seller Auth                          |
|----------------------|----------------------------------|--------------------------------------|
| Registration         | Creates user only                | Creates user + seller_profiles       |
| Email verification   | Required (token + email link)    | Not required — active immediately    |
| Role assigned        | customer                         | seller                               |
| Login role guard     | None                             | Rejects non-seller accounts          |
| JWT payload          | user_id, roles                   | user_id, roles, seller_id            |
| Endpoint prefix      | /api/auth/                       | /api/seller/auth/                    |

---

## Protecting Future Seller Routes

All future seller portal routes use this two-middleware pattern:

```javascript
import { verifyJWT }    from "../../middleware/auth.middleware.js";
import { requireRole }  from "../../middleware/role.middleware.js";

// Authentication (who are you?) + Authorization (are you a seller?)
router.get("/dashboard", verifyJWT, requireRole("seller"), controller);
```

`verifyJWT` — verifies the access token, attaches `req.user`
`requireRole("seller")` — confirms `req.user.roles` includes "seller"

`req.user` shape after both middleware run:
```json
{
    "user_id": 24,
    "name": "Shop Owner",
    "email": "owner@gmail.com",
    "roles": ["seller"],
    "seller_id": 2
}
```

---

## Stored Procedures

### register_seller
```
register_seller(
    p_name, p_email, p_phone, p_password_hash,
    p_shop_name, p_latitude, p_longitude, p_city, p_pincode
)
RETURNS TABLE (user_id, name, email, phone, is_active,
               seller_id, shop_name, city, pincode, is_verified)
```
Inserts into `users`, assigns seller role in `user_roles`, and
creates `seller_profiles` row — all in a single transaction.
If any step fails, the entire operation is rolled back.

### get_seller_by_email
```
get_seller_by_email(p_email)
RETURNS TABLE (user_id, name, email, phone, password_hash,
               is_active, created_at, roles, seller_id,
               shop_name, is_verified)
```
Fetches user + aggregated roles + seller profile data in one query.
The service layer checks the returned `roles` field for "seller"
as part of the login role guard.