-- Drop existing seller auth helper functions if they exist
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
    u.user_id::INTEGER AS user_id,
    u.name::VARCHAR(100) AS name,
    u.email::VARCHAR(100) AS email,
    COALESCE(u.phone, '')::VARCHAR(20) AS phone,
    u.password_hash::TEXT AS password_hash,
    COALESCE(u.is_active, false)::BOOLEAN AS is_active,
    u.created_at::TIMESTAMP(6) AS created_at,
    STRING_AGG(r.role_name, ',')::TEXT AS roles,
    sp.seller_id::INTEGER AS seller_id,
    sp.shop_name::VARCHAR(100) AS shop_name,
    sp.latitude::NUMERIC(9,6) AS latitude,
    sp.longitude::NUMERIC(9,6) AS longitude,
    sp.city::VARCHAR(50) AS city,
    sp.pincode::VARCHAR(10) AS pincode,
    COALESCE(sp.is_verified, false)::BOOLEAN AS is_verified
  FROM users u
  LEFT JOIN user_roles ur ON u.user_id = ur.user_id
  LEFT JOIN roles r ON ur.role_id = r.role_id
  LEFT JOIN seller_profiles sp ON u.user_id = sp.user_id
  WHERE u.email = p_email
  GROUP BY
    u.user_id,
    u.name,
    u.email,
    u.phone,
    u.password_hash,
    u.is_active,
    u.created_at,
    sp.seller_id,
    sp.shop_name,
    sp.latitude,
    sp.longitude,
    sp.city,
    sp.pincode,
    sp.is_verified;
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
  RETURNING user_id INTO v_user_id;

  SELECT role_id INTO v_seller_role_id FROM roles WHERE role_name = 'seller' LIMIT 1;
  IF v_seller_role_id IS NULL THEN
    RAISE EXCEPTION 'Seller role is not defined in roles table.';
  END IF;

  INSERT INTO user_roles (user_id, role_id)
  VALUES (v_user_id, v_seller_role_id);

  INSERT INTO seller_profiles (user_id, shop_name, latitude, longitude, city, pincode, is_verified)
  VALUES (v_user_id, p_shop_name, p_latitude, p_longitude, p_city, p_pincode, FALSE)
  RETURNING seller_id INTO v_seller_id;

  RETURN QUERY
  SELECT
    u.user_id::INTEGER AS user_id,
    u.name::VARCHAR(100) AS name,
    u.email::VARCHAR(100) AS email,
    sp.seller_id::INTEGER AS seller_id,
    sp.shop_name::VARCHAR(100) AS shop_name,
    sp.city::VARCHAR(50) AS city,
    sp.pincode::VARCHAR(10) AS pincode,
    COALESCE(sp.is_verified, false)::BOOLEAN AS is_verified
  FROM users u
  JOIN seller_profiles sp ON u.user_id = sp.user_id
  WHERE u.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql;
