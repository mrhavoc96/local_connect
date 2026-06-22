-- Fix function return types to match actual table schema
DROP FUNCTION IF EXISTS get_user_by_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS register_user(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS save_verification_token(INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS verify_email_token(TEXT) CASCADE;

-- CreateFunction: get_user_by_email
CREATE OR REPLACE FUNCTION get_user_by_email(p_email TEXT)
RETURNS TABLE (
  user_id INTEGER,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  password_hash TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP(6),
  roles TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.user_id::INTEGER,
    u.name::VARCHAR(100),
    u.email::VARCHAR(100),
    COALESCE(u.phone, '')::VARCHAR(20),
    u.password_hash::TEXT,
    COALESCE(u.is_active, false)::BOOLEAN,
    u.created_at::TIMESTAMP(6),
    STRING_AGG(r.role_name, ',')::TEXT AS roles
  FROM users u
  LEFT JOIN user_roles ur ON u.user_id = ur.user_id
  LEFT JOIN roles r ON ur.role_id = r.role_id
  WHERE u.email = p_email
  GROUP BY u.user_id, u.name, u.email, u.phone, u.password_hash, u.is_active, u.created_at;
END;
$$ LANGUAGE plpgsql;

-- CreateFunction: register_user
CREATE OR REPLACE FUNCTION register_user(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (
  user_id INTEGER,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN,
  created_at TIMESTAMP(6)
) AS $$
DECLARE
  v_user_id INTEGER;
  v_customer_role_id INTEGER;
BEGIN
  -- Insert user
  INSERT INTO users (name, email, phone, password_hash, is_active)
  VALUES (p_name, p_email, p_phone, p_password_hash, FALSE)
  RETURNING users.user_id INTO v_user_id;

  -- Get customer role ID
  SELECT role_id INTO v_customer_role_id FROM roles WHERE role_name = 'customer' LIMIT 1;

  -- Assign customer role
  INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_customer_role_id);

  -- Return the created user
  RETURN QUERY
  SELECT
    users.user_id::INTEGER,
    users.name::VARCHAR(100),
    users.email::VARCHAR(100),
    COALESCE(users.phone, '')::VARCHAR(20),
    COALESCE(users.is_active, false)::BOOLEAN,
    users.created_at::TIMESTAMP(6)
  FROM users
  WHERE users.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql;

-- CreateFunction: save_verification_token
CREATE OR REPLACE FUNCTION save_verification_token(
  p_user_id INTEGER,
  p_token_hash TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO email_verifications (user_id, token_hash, expires_at)
  VALUES (p_user_id, p_token_hash, p_expires_at)
  ON CONFLICT (user_id) DO UPDATE
  SET token_hash = p_token_hash, expires_at = p_expires_at;
END;
$$ LANGUAGE plpgsql;

-- CreateFunction: verify_email_token
CREATE OR REPLACE FUNCTION verify_email_token(p_token_hash TEXT)
RETURNS TEXT AS $$
DECLARE
  v_user_id INTEGER;
  v_status TEXT;
BEGIN
  -- Check if token exists and is valid
  SELECT ev.user_id INTO v_user_id
  FROM email_verifications ev
  WHERE ev.token_hash = p_token_hash
  AND ev.expires_at > NOW();

  IF v_user_id IS NULL THEN
    -- Check if it's an expired token
    SELECT COUNT(*) > 0 INTO v_status
    FROM email_verifications
    WHERE token_hash = p_token_hash;

    IF v_status THEN
      RETURN 'expired';
    ELSE
      RETURN 'invalid_token';
    END IF;
  END IF;

  -- Mark user as active
  UPDATE users SET is_active = TRUE WHERE user_id = v_user_id;

  -- Delete the token
  DELETE FROM email_verifications WHERE user_id = v_user_id;

  RETURN 'verified';
END;
$$ LANGUAGE plpgsql;
