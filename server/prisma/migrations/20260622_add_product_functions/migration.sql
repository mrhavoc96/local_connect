-- Core product listing information (seller_product + product with avg ratings)
CREATE OR REPLACE FUNCTION get_product_core(p_seller_product_id INT)
RETURNS TABLE (
  seller_product_id INT,
  product_id INT,
  seller_id INT,
  brand VARCHAR,
  model_name VARCHAR,
  category VARCHAR,
  description TEXT,
  seller_price NUMERIC,
  base_price NUMERIC,
  stock_quantity INT,
  is_available BOOLEAN,
  warranty_months INT,
  product_avg_rating NUMERIC,
  product_review_count INT
) AS $$
  SELECT
    sp.seller_product_id,
    p.product_id,
    sp.seller_id,
    p.brand,
    p.model_name,
    p.category,
    p.description,
    sp.price AS seller_price,
    p.base_price,
    sp.stock_quantity,
    sp.is_available,
    0 AS warranty_months,
    COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0)::NUMERIC AS product_avg_rating,
    COUNT(r.review_id)::INT AS product_review_count
  FROM seller_products sp
  LEFT JOIN products p ON sp.product_id = p.product_id
  LEFT JOIN reviews r ON p.product_id = r.review_id
  WHERE sp.seller_product_id = p_seller_product_id
  GROUP BY sp.seller_product_id, p.product_id, sp.seller_id, p.brand, p.model_name,
           p.category, p.description, sp.price, p.base_price, sp.stock_quantity, sp.is_available;
$$ LANGUAGE SQL;

-- Product images
CREATE OR REPLACE FUNCTION get_product_images(p_product_id INT)
RETURNS TABLE (
  image_id INT,
  image_url VARCHAR
) AS $$
  SELECT
    image_id,
    image_url
  FROM product_images
  WHERE product_id = p_product_id
  ORDER BY image_id ASC;
$$ LANGUAGE SQL;

-- Product specifications
CREATE OR REPLACE FUNCTION get_product_specs(p_product_id INT)
RETURNS TABLE (
  spec_id INT,
  spec_key VARCHAR,
  spec_value VARCHAR
) AS $$
  SELECT
    spec_id,
    spec_key,
    spec_value
  FROM product_specifications
  WHERE product_id = p_product_id
  ORDER BY spec_id ASC;
$$ LANGUAGE SQL;

-- Seller information with ratings
CREATE OR REPLACE FUNCTION get_seller_info(p_seller_id INT)
RETURNS TABLE (
  seller_id INT,
  shop_name VARCHAR,
  city VARCHAR,
  pincode VARCHAR,
  latitude NUMERIC,
  longitude NUMERIC,
  is_verified BOOLEAN,
  google_place_id VARCHAR,
  seller_avg_rating NUMERIC,
  seller_review_count INT,
  seller_images TEXT
) AS $$
  SELECT
    sp.seller_id,
    sp.shop_name,
    sp.city,
    sp.pincode,
    COALESCE(sp.latitude::NUMERIC, 0)::NUMERIC,
    COALESCE(sp.longitude::NUMERIC, 0)::NUMERIC,
    COALESCE(sp.is_verified, FALSE),
    NULL::VARCHAR,
    COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0)::NUMERIC AS seller_avg_rating,
    COUNT(r.review_id)::INT AS seller_review_count,
    COALESCE(json_agg(
      json_build_object('image_id', si.image_id, 'image_url', si.image_url)
    ) FILTER (WHERE si.image_id IS NOT NULL), '[]'::JSON)::TEXT AS seller_images
  FROM seller_profiles sp
  LEFT JOIN reviews r ON sp.seller_id = r.user_id
  LEFT JOIN seller_images si ON sp.seller_id = si.seller_id
  WHERE sp.seller_id = p_seller_id
  GROUP BY sp.seller_id, sp.shop_name, sp.city, sp.pincode, sp.latitude, sp.longitude, sp.is_verified;
$$ LANGUAGE SQL;

-- Active offers with final price calculation
CREATE OR REPLACE FUNCTION get_active_offers(p_seller_product_id INT)
RETURNS TABLE (
  offer_id INT,
  discount_type VARCHAR,
  discount_value NUMERIC,
  final_price NUMERIC,
  start_date DATE,
  end_date DATE
) AS $$
  SELECT
    spo.offer_id,
    spo.discount_type,
    COALESCE(spo.discount_value, 0)::NUMERIC AS discount_value,
    CASE
      WHEN spo.discount_type = 'flat' THEN (sp.price - COALESCE(spo.discount_value, 0))::NUMERIC
      WHEN spo.discount_type = 'percentage' THEN (sp.price * (1 - COALESCE(spo.discount_value, 0) / 100.0))::NUMERIC
      ELSE sp.price
    END::NUMERIC AS final_price,
    spo.start_date,
    spo.end_date
  FROM seller_product_offers spo
  LEFT JOIN seller_products sp ON spo.seller_product_id = sp.seller_product_id
  WHERE spo.seller_product_id = p_seller_product_id
    AND CURRENT_DATE >= spo.start_date
    AND CURRENT_DATE <= spo.end_date
  ORDER BY spo.offer_id ASC;
$$ LANGUAGE SQL;

-- Price history for the last 365 days
CREATE OR REPLACE FUNCTION get_price_history(p_seller_product_id INT)
RETURNS TABLE (
  history_id INT,
  price NUMERIC,
  recorded_at TIMESTAMP
) AS $$
  SELECT
    history_id,
    COALESCE(price, 0)::NUMERIC AS price,
    recorded_at
  FROM product_price_history
  WHERE seller_product_id = p_seller_product_id
    AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '365 days'
  ORDER BY recorded_at ASC;
$$ LANGUAGE SQL;

-- External market prices for the same product
CREATE OR REPLACE FUNCTION get_external_prices(p_product_id INT)
RETURNS TABLE (
  external_price_id INT,
  platform_name VARCHAR,
  price NUMERIC,
  last_updated TIMESTAMP
) AS $$
  SELECT
    external_price_id,
    platform_name,
    COALESCE(price, 0)::NUMERIC AS price,
    last_updated
  FROM external_market_prices
  WHERE product_id = p_product_id
  ORDER BY external_price_id ASC;
$$ LANGUAGE SQL;
