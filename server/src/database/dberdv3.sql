CREATE TABLE users (
    user_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    role_id INT PRIMARY KEY,
    role_name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE user_addresses (
    address_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    address_text TEXT NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    city VARCHAR(50),
    pincode VARCHAR(10),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE products (
    product_id INT PRIMARY KEY,
    brand VARCHAR(50),
    model_name VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    base_price DECIMAL(10,2)
);

CREATE TABLE product_specifications (
    spec_id INT PRIMARY KEY,
    product_id INT,
    spec_key VARCHAR(50),
    spec_value VARCHAR(100),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE product_images (
    image_id INT PRIMARY KEY,
    product_id INT,
    image_url TEXT,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE seller_profiles (
    seller_id INT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    shop_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    city VARCHAR(50),
    pincode VARCHAR(10),
    is_verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE seller_images (
    image_id INT PRIMARY KEY,
    seller_id INT,
    image_url TEXT NOT NULL,
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(seller_id)
);

CREATE TABLE seller_products (
    seller_product_id INT PRIMARY KEY,
    seller_id INT,
    product_id INT,
    price DECIMAL(10,2),
    stock_quantity INT,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(seller_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE seller_product_offers (
    offer_id INT PRIMARY KEY,
    seller_product_id INT,
    discount_type VARCHAR(10),
    discount_value DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (seller_product_id) REFERENCES seller_products(seller_product_id)
);

CREATE TABLE wishlist_items (
    user_id INT,
    product_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE reviews (
    review_id INT PRIMARY KEY,
    user_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE review_targets (
    review_id INT,
    target_type VARCHAR(10), -- PRODUCT / SELLER
    target_id INT,
    FOREIGN KEY (review_id) REFERENCES reviews(review_id)
);

CREATE TABLE review_media (
    media_id INT PRIMARY KEY,
    review_id INT,
    media_url TEXT,
    media_type VARCHAR(10),
    FOREIGN KEY (review_id) REFERENCES reviews(review_id)
);

CREATE TABLE notifications (
    notification_id INT PRIMARY KEY,
    recipient_user_id INT,
    title VARCHAR(100),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_user_id) REFERENCES users(user_id)
);

CREATE TABLE product_price_history (
    history_id INT PRIMARY KEY,
    seller_product_id INT,
    price DECIMAL(10,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_product_id) REFERENCES seller_products(seller_product_id)
);

CREATE TABLE product_demand (
    product_id INT,
    city VARCHAR(50),
    views_count INT DEFAULT 0,
    wishlist_count INT DEFAULT 0,
    PRIMARY KEY (product_id, city),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE external_market_prices (
    external_price_id INT PRIMARY KEY,
    product_id INT,
    platform_name VARCHAR(50),
    price DECIMAL(10,2),
    last_updated TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);