CREATE TYPE user_role AS ENUM ('CLIENT', 'RESTAURANT', 'COURIER', 'ADMIN');

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE payment_method_enum AS ENUM ('ONLINE', 'CASH_ON_DELIVERY');

CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

CREATE TYPE payment_method_full_enum AS ENUM ('ONLINE', 'CASH_ON_DELIVERY', 'CARD', 'OTHER');

CREATE TYPE complaint_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TYPE notification_channel_enum AS ENUM ('PUSH', 'EMAIL', 'SMS', 'IN_APP');
CREATE TYPE user_role AS ENUM ('CLIENT', 'RESTAURANT', 'COURIER', 'ADMIN');

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE payment_method_enum AS ENUM ('ONLINE', 'CASH_ON_DELIVERY');

CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

CREATE TYPE payment_method_full_enum AS ENUM ('ONLINE', 'CASH_ON_DELIVERY', 'CARD', 'OTHER');

CREATE TYPE complaint_status_enum AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TYPE notification_channel_enum AS ENUM ('PUSH', 'EMAIL', 'SMS', 'IN_APP');






CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255),

  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_users_phone ON users(phone);
CREATE UNIQUE INDEX uk_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);




CREATE TABLE clients (
  user_id BIGINT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512),

  CONSTRAINT fk_clients_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE restaurants (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL UNIQUE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(512),

  address_street VARCHAR(512) NOT NULL,
  city VARCHAR(128) NOT NULL,
  postal_code VARCHAR(32),
  country VARCHAR(64) DEFAULT 'MA',

  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),

  phone VARCHAR(32),

  is_open BOOLEAN DEFAULT TRUE,
  sponsorship_enabled BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_restaurants_owner
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);




CREATE TABLE couriers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,

  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,

  vehicle_type VARCHAR(64),
  license_plate VARCHAR(32),

  is_validated BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,

  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_couriers_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);





CREATE TABLE addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,

  label VARCHAR(64),
  street VARCHAR(512) NOT NULL,
  city VARCHAR(128) NOT NULL,
  postal_code VARCHAR(32),
  country VARCHAR(64) DEFAULT 'MA',

  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),

  is_default BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_addresses_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE menu_categories (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE TABLE menu_items (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,
  category_id BIGINT,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(512),
  is_available BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
);






CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  public_uuid UUID DEFAULT gen_random_uuid(),

  client_user_id BIGINT NOT NULL,
  restaurant_id BIGINT NOT NULL,
  courier_id BIGINT,
  delivery_address_id BIGINT NOT NULL,

  status order_status DEFAULT 'PENDING',

  payment_method payment_method_enum NOT NULL,
  payment_status payment_status_enum DEFAULT 'PENDING',

  subtotal DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,

  notes TEXT,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  menu_item_id BIGINT,

  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  item_name_snapshot VARCHAR(255) NOT NULL,

  CONSTRAINT fk_order_items_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

  CONSTRAINT fk_order_items_menu
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);





CREATE TABLE order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,

  status VARCHAR(32) NOT NULL,
  previous_status VARCHAR(32),

  changed_by_user_id BIGINT,
  note VARCHAR(512),

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_osh_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

  CONSTRAINT fk_osh_user
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_osh_order ON order_status_history(order_id);







CREATE TYPE payment_full_method AS ENUM ('ONLINE', 'CASH_ON_DELIVERY', 'CARD', 'OTHER');
CREATE TYPE payment_status_enum2 AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,

  amount DECIMAL(10,2) NOT NULL,
  method payment_full_method NOT NULL,
  status payment_status_enum2 DEFAULT 'PENDING',

  external_ref VARCHAR(255),
  paid_at TIMESTAMP(3),

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);





CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  client_user_id BIGINT NOT NULL,

  restaurant_rating SMALLINT,
  restaurant_comment TEXT,

  courier_rating SMALLINT,
  courier_comment TEXT,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_reviews_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,

  CONSTRAINT fk_reviews_client
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE(order_id)
);

CREATE INDEX idx_reviews_client ON reviews(client_user_id);








CREATE TABLE complaints (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  order_id BIGINT,

  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  status complaint_status_enum DEFAULT 'OPEN',

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_complaints_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_complaints_order
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_complaints_user ON complaints(user_id);








CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,

  channel notification_channel_enum DEFAULT 'PUSH',

  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  payload JSONB,

  read_at TIMESTAMP,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);











CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,

  channel notification_channel_enum DEFAULT 'PUSH',

  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  payload JSONB,

  read_at TIMESTAMP,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);








CREATE TABLE system_settings (
  key VARCHAR(128) PRIMARY KEY,
  value TEXT NOT NULL,

  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);








CREATE TABLE favorites (
  user_id BIGINT NOT NULL,
  restaurant_id BIGINT NOT NULL,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, restaurant_id),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);









CREATE TABLE sponsorships (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL,

  priority INT DEFAULT 0,

  start_at TIMESTAMP(3) NOT NULL,
  end_at TIMESTAMP(3) NOT NULL,

  amount_paid DECIMAL(12,2),

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

CREATE INDEX idx_sponsorships_active ON sponsorships(is_active);