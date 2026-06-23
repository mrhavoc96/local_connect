-- Drop and recreate seller auth functions with fully qualified column names to avoid ambiguity
DROP FUNCTION IF EXISTS get_seller_by_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS register_seller(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT) CASCADE;

-- CreateFunction: get_seller_by_email
CREATE OR REPLACE FUNCTION get_seller_by_email(p_email TEXT)
RETURNS TABLE (
  user_id INTEGER,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  password_hash TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP(6),
  roles TEXT,
  seller_id INTEGER,
  shop_name VARCHAR(100),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  city VARCHAR(50),
  pincode VARCHAR(10),
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    users.user_id::INTEGER AS user_id,
    users.name::VARCHAR(100) AS name,
    users.email::VARCHAR(100) AS email,
    COALESCE(users.phone, '')::VARCHAR(20) AS phone,
    users.password_hash::TEXT AS password_hash,
    COALESCE(users.is_active, false)::BOOLEAN AS is_active,
    users.created_at::TIMESTAMP(6) AS created_at,
    STRING_AGG(roles.role_name, ',')::TEXT AS roles,
    seller_profiles.seller_id::INTEGER AS seller_id,
    seller_profiles.shop_name::VARCHAR(100) AS shop_name,
    seller_profiles.latitude::NUMERIC(9,6) AS latitude,
    seller_profiles.longitude::NUMERIC(9,6) AS longitude,
    seller_profiles.city::VARCHAR(50) AS city,
    seller_profiles.pincode::VARCHAR(10) AS pincode,
    COALESCE(seller_profiles.is_verified, false)::BOOLEAN AS is_verified
  FROM users
  LEFT JOIN user_roles ON users.user_id = user_roles.user_id
  LEFT JOIN roles ON user_roles.role_id = roles.role_id
  LEFT JOIN seller_profiles ON users.user_id = seller_profiles.user_id
  WHERE users.email = p_email
  GROUP BY
    users.user_id,
    users.name,
    users.email,
    users.phone,
    users.password_hash,
    users.is_active,
    users.created_at,
    seller_profiles.seller_id,
    seller_profiles.shop_name,
    seller_profiles.latitude,
    seller_profiles.longitude,
    seller_profiles.city,
    seller_profiles.pincode,
    seller_profiles.is_verified;
END;
$$ LANGUAGE plpgsql;

-- CreateFunction: register_seller
CREATE OR REPLACE FUNCTION register_seller(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_password_hash TEXT,
  p_shop_name TEXT,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_city TEXT,
  p_pincode TEXT
)
RETURNS TABLE (
  user_id INTEGER,
  name VARCHAR(100),
  email VARCHAR(100),
  seller_id INTEGER,
  shop_name VARCHAR(100),
  city VARCHAR(50),
  pincode VARCHAR(10),
  is_verified BOOLEAN
) AS $$
DECLARE
  v_user_id INTEGER;
  v_seller_id INTEGER;
  v_seller_role_id INTEGER;
BEGIN
  INSERT INTO users (name, email, phone, password_hash, is_active)
  VALUES (p_name, p_email, p_phone, p_password_hash, TRUE)
  RETURNING users.user_id INTO v_user_id;

  SELECT role_id INTO v_seller_role_id FROM roles WHERE role_name = 'seller' LIMIT 1;
  IF v_seller_role_id IS NULL THEN
    RAISE EXCEPTION 'Seller role is not defined in roles table.';
  END IF;

  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_user_id, v_seller_role_id);

  INSERT INTO seller_profiles (user_id, shop_name, latitude, longitude, city, pincode, is_verified)
  VALUES (v_user_id, p_shop_name, p_latitude, p_longitude, p_city, p_pincode, FALSE)
  RETURNING seller_profiles.seller_id INTO v_seller_id;

  RETURN QUERY
  SELECT
    users.user_id::INTEGER AS user_id,
    users.name::VARCHAR(100) AS name,
    users.email::VARCHAR(100) AS email,
    seller_profiles.seller_id::INTEGER AS seller_id,
    seller_profiles.shop_name::VARCHAR(100) AS shop_name,
    seller_profiles.city::VARCHAR(50) AS city,
    seller_profiles.pincode::VARCHAR(10) AS pincode,
    COALESCE(seller_profiles.is_verified, false)::BOOLEAN AS is_verified
  FROM users
  JOIN seller_profiles ON users.user_id = seller_profiles.user_id
  WHERE users.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql;
