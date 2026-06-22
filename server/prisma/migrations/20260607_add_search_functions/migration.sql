-- Add search helper functions: search_autocomplete and search_products

-- Drop if exists
DROP FUNCTION IF EXISTS search_autocomplete(TEXT) CASCADE;
DROP FUNCTION IF EXISTS search_products(TEXT, NUMERIC, NUMERIC, NUMERIC) CASCADE;

-- Lightweight autocomplete for suggestions
CREATE OR REPLACE FUNCTION search_autocomplete(p_query TEXT)
RETURNS TABLE (
  product_id INTEGER,
  brand VARCHAR(100),
  model_name VARCHAR(200),
  category VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.product_id::INTEGER, p.brand::VARCHAR(100), p.model_name::VARCHAR(200), p.category::VARCHAR(100)
  FROM products p
  WHERE (p.brand || ' ' || p.model_name) ILIKE ('%' || p_query || '%')
  ORDER BY p.brand, p.model_name
  LIMIT 8;
END;
$$ LANGUAGE plpgsql;

-- Full proximity product search
CREATE OR REPLACE FUNCTION search_products(p_query TEXT, p_lat NUMERIC, p_lng NUMERIC, p_radius NUMERIC)
RETURNS TABLE (
  status TEXT,
  seller_product_id INTEGER,
  product_id INTEGER,
  brand VARCHAR(100),
  model_name VARCHAR(200),
  category VARCHAR(100),
  base_price NUMERIC,
  seller_price NUMERIC,
  warranty_months INTEGER,
  product_average_rating NUMERIC,
  product_review_count BIGINT,
  seller_id INTEGER,
  shop_name VARCHAR(100),
  seller_average_rating NUMERIC,
  seller_review_count BIGINT,
  distance_km NUMERIC,
  image_url TEXT
) AS $$
DECLARE
  v_product_id INTEGER;
BEGIN
  -- Find a matching product (simple ILIKE match)
  SELECT p.product_id INTO v_product_id
  FROM products p
  WHERE (p.brand || ' ' || p.model_name) ILIKE ('%' || p_query || '%')
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RETURN QUERY SELECT 'not_in_catalogue'::TEXT, NULL::INTEGER, NULL::INTEGER, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::NUMERIC, NULL::NUMERIC, NULL::INTEGER, NULL::NUMERIC, 0::BIGINT, NULL::INTEGER, NULL::VARCHAR, NULL::NUMERIC, 0::BIGINT, NULL::NUMERIC, NULL::TEXT LIMIT 1;
    RETURN;
  END IF;

  -- Core search: sellers with the product within radius
  RETURN QUERY
  SELECT
    'found'::TEXT AS status,
    sp.seller_product_id::INTEGER,
    p.product_id::INTEGER,
    p.brand::VARCHAR(100),
    p.model_name::VARCHAR(200),
    p.category::VARCHAR(100),
    p.base_price::NUMERIC,
    sp.price::NUMERIC AS seller_price,
    COALESCE(sp.stock_quantity,0)::INTEGER * 0 + 0::INTEGER AS warranty_months,
    NULL::NUMERIC AS product_average_rating,
    0::BIGINT AS product_review_count,
    sp.seller_id::INTEGER,
    s.shop_name::VARCHAR(100),
    NULL::NUMERIC AS seller_average_rating,
    0::BIGINT AS seller_review_count,
    (6371 * acos( cos( radians(p_lat::double precision) ) * cos( radians(s.latitude::double precision) ) * cos( radians(s.longitude::double precision) - radians(p_lng::double precision) ) + sin( radians(p_lat::double precision) ) * sin( radians(s.latitude::double precision) ) ) )::NUMERIC(10,4) AS distance_km,
    (SELECT si.image_url FROM seller_images si WHERE si.seller_id = s.seller_id LIMIT 1) AS image_url
  FROM products p
  JOIN seller_products sp ON p.product_id = sp.product_id
  JOIN seller_profiles s ON sp.seller_id = s.seller_id
  WHERE p.product_id = v_product_id
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND (6371 * acos( cos( radians(p_lat::double precision) ) * cos( radians(s.latitude::double precision) ) * cos( radians(s.longitude::double precision) - radians(p_lng::double precision) ) + sin( radians(p_lat::double precision) ) * sin( radians(s.latitude::double precision) ) ) ) <= p_radius
  ORDER BY distance_km ASC;

  -- If no rows returned above, signal no sellers in radius
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'no_sellers_in_radius'::TEXT, NULL::INTEGER, v_product_id::INTEGER, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::NUMERIC, NULL::NUMERIC, NULL::INTEGER, NULL::NUMERIC, 0::BIGINT, NULL::INTEGER, NULL::VARCHAR, NULL::NUMERIC, 0::BIGINT, NULL::NUMERIC, NULL::TEXT LIMIT 1;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;