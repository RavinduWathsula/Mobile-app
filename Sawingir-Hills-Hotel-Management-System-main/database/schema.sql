-- ============================================================================
-- Sawingir Hills Hotel Management System
-- Database Schema (MySQL 8.0+)
-- ============================================================================
-- Run this file to create the database and all tables.
-- Usage: mysql -u root -p < database/schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS sawingir_hills_hms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sawingir_hills_hms;

-- ============================================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE roles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL UNIQUE,
  description   TEXT,
  permissions   JSON,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(200)  NOT NULL,
  email         VARCHAR(200)  NOT NULL UNIQUE,
  username      VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  phone         VARCHAR(30),
  department    ENUM('Front Office','Restaurant POS','Housekeeping','Back Office','Manager','Admin') NOT NULL DEFAULT 'Front Office',
  role_id       INT           NOT NULL,
  avatar_url    VARCHAR(500),
  status        ENUM('active','inactive','pending') NOT NULL DEFAULT 'pending',
  last_login    TIMESTAMP     NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. ROOM MANAGEMENT
-- ============================================================================

CREATE TABLE room_types (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL UNIQUE,
  description     TEXT,
  base_price      DECIMAL(12,2) NOT NULL,
  max_occupancy   INT           NOT NULL DEFAULT 2,
  total_rooms     INT           NOT NULL DEFAULT 0,
  amenities       JSON,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE rooms (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  room_number     VARCHAR(20)   NOT NULL UNIQUE,
  room_type_id    INT           NOT NULL,
  floor           INT           NOT NULL DEFAULT 1,
  status          ENUM('available','occupied','dirty','maintenance','out_of_order') NOT NULL DEFAULT 'available',
  features        JSON,
  notes           TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
) ENGINE=InnoDB;

CREATE TABLE rate_plans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT,
  room_type_id    INT           NOT NULL,
  meal_plan       ENUM('room-only','bnb','half-board','full-board') NOT NULL DEFAULT 'room-only',
  rate            DECIMAL(12,2) NOT NULL,
  season          VARCHAR(50)   NOT NULL DEFAULT 'All Year',
  valid_from      DATE,
  valid_to        DATE,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. MEAL PLANS & MENUS
-- ============================================================================

CREATE TABLE meal_plans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  meal_type       ENUM('breakfast','lunch','dinner','dessert','event-package') NOT NULL,
  price           DECIMAL(12,2) NOT NULL,
  description     TEXT,
  menu_items      JSON,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 4. GUESTS
-- ============================================================================

CREATE TABLE guests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  first_name      VARCHAR(100)  NOT NULL,
  last_name       VARCHAR(100)  NOT NULL,
  email           VARCHAR(200),
  phone           VARCHAR(30),
  nationality     VARCHAR(5),
  id_type         ENUM('nic','passport','driving_license') DEFAULT 'nic',
  id_number       VARCHAR(50),
  address         TEXT,
  notes           TEXT,
  total_stays     INT           NOT NULL DEFAULT 0,
  total_spent     DECIMAL(14,2) NOT NULL DEFAULT 0,
  vip_status      BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guest_name (last_name, first_name),
  INDEX idx_guest_email (email)
) ENGINE=InnoDB;

-- ============================================================================
-- 5. BOOKINGS / RESERVATIONS
-- ============================================================================

CREATE TABLE bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref     VARCHAR(20)   NOT NULL UNIQUE,
  guest_id        INT           NOT NULL,
  room_id         INT,
  room_type_id    INT           NOT NULL,
  check_in        DATE          NOT NULL,
  check_out       DATE          NOT NULL,
  nights          INT           NOT NULL,
  adults          INT           NOT NULL DEFAULT 1,
  children        INT           NOT NULL DEFAULT 0,
  meal_plan       ENUM('room-only','bnb','half-board','full-board') NOT NULL DEFAULT 'room-only',
  room_rate       DECIMAL(12,2) NOT NULL,
  meal_surcharge  DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  service_charge  DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0,
  advance_paid    DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance_due     DECIMAL(14,2) NOT NULL DEFAULT 0,
  status          ENUM('confirmed','checked_in','checked_out','cancelled','no_show') NOT NULL DEFAULT 'confirmed',
  source          ENUM('direct','ota','walk_in','corporate','phone','website') NOT NULL DEFAULT 'direct',
  special_requests TEXT,
  notes           TEXT,
  created_by      INT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id)     REFERENCES guests(id),
  FOREIGN KEY (room_id)      REFERENCES rooms(id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (created_by)   REFERENCES users(id),
  INDEX idx_booking_dates (check_in, check_out),
  INDEX idx_booking_status (status),
  INDEX idx_booking_ref (booking_ref)
) ENGINE=InnoDB;

CREATE TABLE booking_meals (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_id      INT           NOT NULL,
  meal_plan_id    INT           NOT NULL,
  quantity        INT           NOT NULL DEFAULT 1,
  unit_price      DECIMAL(12,2) NOT NULL,
  total_price     DECIMAL(12,2) NOT NULL,
  meal_date       DATE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)   REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id)
) ENGINE=InnoDB;

-- ============================================================================
-- 6. HOUSEKEEPING
-- ============================================================================

CREATE TABLE housekeeping_tasks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  room_id         INT           NOT NULL,
  task_type       ENUM('cleaning','deep_clean','turndown','inspection','maintenance','laundry') NOT NULL DEFAULT 'cleaning',
  priority        ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  status          ENUM('pending','in_progress','completed','skipped') NOT NULL DEFAULT 'pending',
  assigned_to     INT,
  notes           TEXT,
  scheduled_date  DATE          NOT NULL,
  started_at      TIMESTAMP     NULL,
  completed_at    TIMESTAMP     NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id)     REFERENCES rooms(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  INDEX idx_hk_date (scheduled_date),
  INDEX idx_hk_status (status)
) ENGINE=InnoDB;

-- ============================================================================
-- 7. RESTAURANT POS
-- ============================================================================

CREATE TABLE menu_categories (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  description     TEXT,
  sort_order      INT           NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE menu_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  category_id     INT           NOT NULL,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT,
  price           DECIMAL(12,2) NOT NULL,
  image_url       VARCHAR(500),
  preparation_time INT          DEFAULT 15,
  is_vegetarian   BOOLEAN       NOT NULL DEFAULT FALSE,
  is_spicy        BOOLEAN       NOT NULL DEFAULT FALSE,
  is_available    BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order      INT           NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id)
) ENGINE=InnoDB;

CREATE TABLE restaurant_orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_number    VARCHAR(20)   NOT NULL UNIQUE,
  order_type      ENUM('dine_in','takeaway','room_service') NOT NULL DEFAULT 'dine_in',
  table_number    VARCHAR(10),
  room_id         INT,
  guest_id        INT,
  booking_id      INT,
  status          ENUM('pending','preparing','ready','served','completed','cancelled') NOT NULL DEFAULT 'pending',
  subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  service_charge  DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount        DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0,
  payment_method  ENUM('cash','card','room_charge','online') DEFAULT NULL,
  payment_status  ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
  notes           TEXT,
  created_by      INT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id)    REFERENCES rooms(id),
  FOREIGN KEY (guest_id)   REFERENCES guests(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_order_status (status),
  INDEX idx_order_date (created_at)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT           NOT NULL,
  menu_item_id    INT           NOT NULL,
  quantity        INT           NOT NULL DEFAULT 1,
  unit_price      DECIMAL(12,2) NOT NULL,
  total_price     DECIMAL(12,2) NOT NULL,
  special_instructions TEXT,
  status          ENUM('pending','preparing','ready','served','cancelled') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)     REFERENCES restaurant_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB;

-- ============================================================================
-- 8. EVENTS & WEDDINGS
-- ============================================================================

CREATE TABLE event_venues (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT,
  capacity        INT           NOT NULL DEFAULT 100,
  price_per_day   DECIMAL(12,2) NOT NULL DEFAULT 0,
  amenities       JSON,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE event_packages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT,
  category        ENUM('wedding','corporate','birthday','conference','daytrip','custom') NOT NULL,
  price_per_person DECIMAL(12,2) NOT NULL,
  min_guests      INT           NOT NULL DEFAULT 20,
  max_guests      INT           NOT NULL DEFAULT 500,
  features        JSON,
  food_options     JSON,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE event_reservations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  reservation_ref VARCHAR(20)   NOT NULL UNIQUE,
  event_type      ENUM('wedding','corporate','birthday','conference','daytrip','custom') NOT NULL,
  client_name     VARCHAR(200)  NOT NULL,
  client_email    VARCHAR(200),
  client_phone    VARCHAR(30),
  venue_id        INT,
  package_id      INT,
  event_date      DATE          NOT NULL,
  event_time      TIME,
  end_time        TIME,
  guest_count     INT           NOT NULL DEFAULT 50,
  setup_style     VARCHAR(100),
  food_options    JSON,
  decoration_notes TEXT,
  subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0,
  advance_paid    DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance_due     DECIMAL(14,2) NOT NULL DEFAULT 0,
  status          ENUM('inquiry','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'inquiry',
  notes           TEXT,
  created_by      INT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id)    REFERENCES event_venues(id),
  FOREIGN KEY (package_id)  REFERENCES event_packages(id),
  FOREIGN KEY (created_by)  REFERENCES users(id),
  INDEX idx_event_date (event_date),
  INDEX idx_event_status (status)
) ENGINE=InnoDB;

-- ============================================================================
-- 9. DAY OUT PLANS
-- ============================================================================

CREATE TABLE day_out_plans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT,
  category        ENUM('adventure','nature','cultural','wellness','family','romantic') NOT NULL,
  price_per_person DECIMAL(12,2) NOT NULL,
  duration_hours  DECIMAL(4,1)  NOT NULL DEFAULT 8,
  max_participants INT           NOT NULL DEFAULT 20,
  inclusions      JSON,
  itinerary       JSON,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE day_out_bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_ref     VARCHAR(20)   NOT NULL UNIQUE,
  plan_id         INT           NOT NULL,
  guest_id        INT,
  client_name     VARCHAR(200)  NOT NULL,
  client_phone    VARCHAR(30),
  trip_date       DATE          NOT NULL,
  participants    INT           NOT NULL DEFAULT 1,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0,
  status          ENUM('confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'confirmed',
  notes           TEXT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id)  REFERENCES day_out_plans(id),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
) ENGINE=InnoDB;

-- ============================================================================
-- 10. BILLING & PAYMENTS
-- ============================================================================

CREATE TABLE invoices (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number  VARCHAR(20)   NOT NULL UNIQUE,
  booking_id      INT,
  order_id        INT,
  event_id        INT,
  guest_id        INT,
  subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  service_charge  DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount        DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0,
  paid_amount     DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance_due     DECIMAL(14,2) NOT NULL DEFAULT 0,
  status          ENUM('draft','issued','paid','partial','overdue','cancelled') NOT NULL DEFAULT 'draft',
  due_date        DATE,
  notes           TEXT,
  created_by      INT,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (order_id)   REFERENCES restaurant_orders(id),
  FOREIGN KEY (event_id)   REFERENCES event_reservations(id),
  FOREIGN KEY (guest_id)   REFERENCES guests(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id      INT           NOT NULL,
  amount          DECIMAL(14,2) NOT NULL,
  payment_method  ENUM('cash','card','bank_transfer','online','room_charge') NOT NULL,
  reference_no    VARCHAR(100),
  notes           TEXT,
  received_by     INT,
  payment_date    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id)  REFERENCES invoices(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================================
-- 11. AUDIT LOG
-- ============================================================================

CREATE TABLE audit_log (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT,
  action          VARCHAR(50)   NOT NULL,
  entity_type     VARCHAR(50)   NOT NULL,
  entity_id       INT,
  old_values      JSON,
  new_values      JSON,
  ip_address      VARCHAR(45),
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_date (created_at)
) ENGINE=InnoDB;

-- ============================================================================
-- 12. SEED DATA
-- ============================================================================

-- Default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('Administrator', 'Full system access', '{"all": true}'),
  ('Manager', 'Manage all operations', '{"dashboard": true, "bookings": true, "rooms": true, "restaurant": true, "events": true, "reports": true, "users": true}'),
  ('Front Office', 'Check-in, check-out, reservations', '{"dashboard": true, "bookings": true, "rooms": {"view": true}, "guest_history": true}'),
  ('Housekeeping', 'Room cleaning and maintenance', '{"housekeeping": true, "rooms": {"view": true}}'),
  ('Restaurant Staff', 'POS and kitchen operations', '{"restaurant": true, "kitchen": true}'),
  ('Accountant', 'Billing and reports', '{"reports": true, "invoices": true, "payments": true}');

-- Default admin user (password: admin123 — bcrypt hash)
INSERT INTO users (full_name, email, username, password_hash, department, role_id, status) VALUES
  ('Admin User', 'admin@sawingir.com', 'admin', '$2b$10$ZHfUuX5u3f6zRQnZxfIiQeK0e7x7WQfKVBY.K5X5O5O5O5O5O5O5O', 'Admin', 1, 'active');

-- Room types
INSERT INTO room_types (name, description, base_price, max_occupancy, total_rooms) VALUES
  ('Single Room', 'Comfortable single occupancy room with mountain views', 12000.00, 1, 15),
  ('Double Room', 'Standard double occupancy room with balcony', 12000.00, 2, 25),
  ('Triple Room', 'Spacious room for three guests with living area', 15000.00, 3, 10),
  ('Honeymoon Suite', 'Romantic suite for couples with premium amenities, full board included', 27000.00, 2, 5),
  ('Family Room', 'Large room perfect for families with kitchenette', 17000.00, 5, 8);

-- Rate plans
INSERT INTO rate_plans (name, description, room_type_id, meal_plan, rate) VALUES
  ('Single - Room Only', 'Single room, accommodation only', 1, 'room-only', 12000.00),
  ('Single - B&B', 'Single room with breakfast', 1, 'bnb', 14000.00),
  ('Single - Half Board', 'Single room with breakfast & dinner', 1, 'half-board', 16000.00),
  ('Single - Full Board', 'Single room with all meals', 1, 'full-board', 18000.00),
  ('Double - Room Only', 'Double room, accommodation only', 2, 'room-only', 12000.00),
  ('Double - B&B', 'Double room with breakfast', 2, 'bnb', 16000.00),
  ('Double - Half Board', 'Double room with breakfast & dinner', 2, 'half-board', 20000.00),
  ('Double - Full Board', 'Double room with all meals', 2, 'full-board', 24000.00),
  ('Triple - Room Only', 'Triple room, accommodation only', 3, 'room-only', 15000.00),
  ('Triple - B&B', 'Triple room with breakfast', 3, 'bnb', 21000.00),
  ('Triple - Half Board', 'Triple room with breakfast & dinner', 3, 'half-board', 27000.00),
  ('Triple - Full Board', 'Triple room with all meals', 3, 'full-board', 33000.00),
  ('Honeymoon - Full Board', 'Honeymoon suite with all meals included', 4, 'full-board', 27000.00),
  ('Family - Room Only', 'Family room, accommodation only', 5, 'room-only', 17000.00);

-- Sample rooms
INSERT INTO rooms (room_number, room_type_id, floor, status, features) VALUES
  ('101', 1, 1, 'available', '["AC", "TV", "WiFi", "Mountain View"]'),
  ('102', 1, 1, 'available', '["AC", "TV", "WiFi"]'),
  ('103', 1, 1, 'occupied', '["AC", "TV", "WiFi", "Mountain View"]'),
  ('104', 2, 1, 'available', '["AC", "TV", "WiFi", "Balcony"]'),
  ('105', 2, 1, 'available', '["AC", "TV", "WiFi", "Balcony"]'),
  ('106', 2, 1, 'occupied', '["AC", "TV", "WiFi", "Balcony", "Mountain View"]'),
  ('201', 2, 2, 'available', '["AC", "TV", "WiFi", "Balcony"]'),
  ('202', 2, 2, 'dirty', '["AC", "TV", "WiFi", "Balcony"]'),
  ('203', 3, 2, 'available', '["AC", "TV", "WiFi", "Balcony", "Living Area"]'),
  ('204', 3, 2, 'occupied', '["AC", "TV", "WiFi", "Balcony", "Living Area"]'),
  ('205', 5, 2, 'available', '["AC", "TV", "WiFi", "Kitchenette", "Living Area"]'),
  ('301', 4, 3, 'available', '["AC", "TV", "WiFi", "Jacuzzi", "Balcony", "Mountain View"]'),
  ('302', 4, 3, 'occupied', '["AC", "TV", "WiFi", "Jacuzzi", "Balcony", "Mountain View"]'),
  ('303', 5, 3, 'available', '["AC", "TV", "WiFi", "Kitchenette", "Living Area"]'),
  ('304', 3, 3, 'maintenance', '["AC", "TV", "WiFi", "Balcony"]');

-- Meal plans
INSERT INTO meal_plans (name, meal_type, price, description, menu_items) VALUES
  ('Sri Lankan Southern Style', 'breakfast', 1900.00, 'Traditional Sri Lankan breakfast', '["Fresh Fruit juice", "Ceylon black tea and Drinking Chocolate", "Fresh fruit salad", "Hoppers with coconut sambol, lunu miris & seeni sambol", "String hoppers with dhal curry", "Tea, Coffee"]'),
  ('English Breakfast', 'breakfast', 1900.00, 'Classic English breakfast', '["Fresh Fruit juice", "Fresh fruit salad", "Eggs (any style), Sausage, Bacon, grilled tomatoes & mushroom", "Toast or croissant with butter and preserves", "Tea, Coffee"]'),
  ('Sri Lankan Rice & Curry', 'lunch', 1800.00, 'Authentic Sri Lankan rice and curry spread', '["Fresh Fruit juice", "Welcome drink Tel Pani", "Pol Sambol, Lunu Miris", "Main Rice varieties", "Vegetable Curry (3 types)", "Fish Curry", "Chicken", "Main Meat", "Dessert", "Tea or coffee"]'),
  ('Chinese & Western - Lunch', 'lunch', 1800.00, 'Fusion of Chinese and Western cuisines', '["Fresh Fruit juice", "Chinese & Western Soups", "Fried Rice", "Noodles or pasta", "Steamed/Fried Chicken or Duck", "Main Meat Dish", "Seafood", "Stir fried Vegetables", "Dessert", "Tea or coffee"]'),
  ('Flame & Feast', 'dinner', 2400.00, 'BBQ station with grilled specialties', '["Soup of the day", "Mixed salad", "Fried Rice", "Fried noodles or Pasta", "BBQ Station", "Stir fried Vegetables", "Dessert", "Tea or coffee"]'),
  ('Chinese & Western - Dinner', 'dinner', 2400.00, 'Evening fusion menu', '["Soup of the day", "Mixed salad", "Fried Rice", "Fried noodles", "Steamed/Fried Chicken or Duck", "Main Meat Dish", "Seafood", "Vegetables", "Dessert", "Tea or coffee"]'),
  ('Asian Fusion', 'dinner', 2400.00, 'Contemporary Asian fusion', '["Soup of the day", "Asian style salad", "Fried Rice", "Asian noodles", "Pan-seared Duck or Chicken", "Asian meat dish", "Wok-fried Seafood", "Vegetables", "Asian desserts", "Tea or coffee"]'),
  ('Dessert Platter', 'dessert', 1000.00, 'Selection of traditional desserts', '["Watalappan", "Caramel Pudding", "Fruit Salad", "Curd & Honey", "Ice Cream"]'),
  ('Bronze Menu', 'event-package', 4600.00, 'Minimum 100 guests', '["Welcome Drink: Mixed Fresh Fruit Juice", "Salads: Mexican Salad; Chicken Salad with Pineapple; Green Salad with Condiments", "Main Courses: Wok Fried Rice; Steamed Rice; Thai Noodles or Spaghetti Carbonara", "Meat Dishes: Chilli Chicken; Fish Stew; Cuttlefish Red Curry", "Vegetarian Specials: Hot Butter Mushroom; Vegetable Au Gratin or Stir-Fried Seasonal Vegetables", "Accompaniments: Mango Chutney; Papadam; Chilli Paste", "Desserts: Ice Cream (3 Varieties); Bread & Butter Pudding; Fresh Cut Fruits"]'),
  ('Silver Menu', 'event-package', 4700.00, 'Minimum 100 guests', '["Welcome Drink: Mixed Fresh Fruit Juice", "Soups & Starters: Cream of Chicken or Mushroom Soup with Bread & Butter", "Salads: Sawingir-style Tuna Salad; Coleslaw with Sultana Salad", "Main Dishes: Mix Fried Rice; Steamed Rice; Wok-Fried Vegetable Noodles", "Meat Dishes: Fried Chicken Curry / Chilli Chicken / Devilled Chicken; Fish Stew / Thai Style Fish Green Curry; Hot Butter Garlic Cuttlefish", "Vegetarian Specials: Devilled Mushroom; Stir-Fried Seasonal Vegetables; Brinjal Moju", "Accompaniments: Mango Chutney; Papadam; Chilli Paste", "Desserts: Ice Cream (3 Varieties); Passion Fruit Mousse; Fresh Cut Fruits"]'),
  ('Gold Menu', 'event-package', 5200.00, 'Minimum 100 guests', '["Welcome Drink: Mixed Fresh Fruit Juice", "Soups & Starters: Sweet Corn & Egg Drop Soup with Bread & Butter", "Salads: Mixed Vegetable Salad; Oriental Egg Salad", "Main Courses: Mongolian-Style Fried Rice; Steamed Rice; Wok Fried Noodles", "Meat Dishes: Coriander-Flavoured Chicken Curry; Devilled Seafood; Grilled Pork", "Vegetarian Specials: Slow Tempered Mushroom; Thai-Style Vegetable Green Curry; Potato Croquettes; Brinjal Moju", "Accompaniments: Prawn Crackers; Papadam; Chilli Paste", "Desserts: Ice Cream (3 Varieties); Chocolate Chip Mousse; Fresh Cut Fruits"]'),
  ('Mongolian Menu', 'event-package', 4500.00, 'Minimum 50 guests, maximum 100 guests', '["Welcome Drink: Mixed Fresh Fruit Juice", "Salads (Select Any 3): Coleslaw Salad; Green Salad; Tossed Salad; Mixed Vegetable Salad; Tomato, Onion & Cucumber Salad", "Main Dishes (Select Any 4): Steamed Rice; Noodles; Spaghetti; Fettuccine; Macaroni", "Meat Dishes (Select Any 3): Chicken; Fish; Prawns; Cuttlefish; Pork; Beef; Sausages", "Vegetarian Specials (Select Any 4): Carrots; Leeks; Cabbage; Spring Onion; Kankun; Chinese Cabbage; Onion Rings", "Desserts (Select Any 3): Ice Cream (3 Varieties); Watalappan; Fresh Fruit Cut; Cream Caramel; Bread & Butter Pudding (Hot)"]');

-- Event packages
INSERT INTO event_packages (name, description, category, price_per_person, min_guests, max_guests, features) VALUES
  ('Standard Wedding', 'Perfect for intimate wedding celebrations', 'wedding', 2500.00, 50, 200, '["Basic menu with 3 courses", "Standard decorations", "Sound system", "Basic lighting"]'),
  ('Premium Wedding', 'Enhanced package for memorable celebrations', 'wedding', 3500.00, 50, 300, '["Premium menu with 5 courses", "Enhanced decorations", "Professional sound", "Stage lighting", "Bridal room setup"]'),
  ('Luxury Wedding', 'Luxury experience for your special day', 'wedding', 4500.00, 50, 400, '["Luxury menu with 7 courses", "Premium themed decorations", "Advanced sound & lighting", "Photography assistance", "Luxury bridal suite", "Welcome drinks"]'),
  ('Royal Wedding', 'Ultimate royal wedding experience', 'wedding', 6000.00, 100, 500, '["Royal premium menu", "Luxury themed decorations", "Premium AV equipment", "Red carpet entrance", "Royal bridal suite", "Welcome drinks & cocktails", "Live music coordination"]'),
  ('Corporate Day', 'Professional corporate event setup', 'corporate', 1500.00, 20, 200, '["Conference room setup", "Projector & screen", "Stationery packs", "Coffee breaks", "Business lunch"]'),
  ('Birthday Celebration', 'Fun birthday party package', 'birthday', 1200.00, 15, 100, '["Themed decorations", "Birthday cake arrangement", "Sound system", "Party games setup", "Buffet dinner"]');

-- Event venues
INSERT INTO event_venues (name, description, capacity, price_per_day, amenities) VALUES
  ('Grand Ballroom', 'Spacious ballroom with mountain views, perfect for weddings and large events', 500, 150000.00, '["Stage", "Dance Floor", "Sound System", "Lighting", "AC", "Projection"]'),
  ('Hilltop Pavilion', 'Open-air pavilion surrounded by gardens and hills', 200, 80000.00, '["Natural Setting", "Garden View", "Basic Sound", "Covered Area"]'),
  ('Conference Hall', 'Modern conference hall with full AV equipment', 100, 50000.00, '["Projector", "Screen", "Microphones", "WiFi", "AC", "Whiteboard"]'),
  ('Pool Deck', 'Poolside event area for casual celebrations', 80, 40000.00, '["Pool Access", "BBQ Area", "Bar Counter", "Ambient Lighting"]');

-- Menu categories for restaurant
INSERT INTO menu_categories (name, description, sort_order) VALUES
  ('Appetizers', 'Starters and small bites', 1),
  ('Soups', 'Hot and cold soups', 2),
  ('Main Course', 'Main dishes and entrées', 3),
  ('Rice & Noodles', 'Fried rice, noodle dishes', 4),
  ('Seafood', 'Fresh seafood specialties', 5),
  ('Desserts', 'Sweet treats and desserts', 6),
  ('Beverages', 'Drinks and refreshments', 7),
  ('Cocktails', 'Signature cocktails and spirits', 8);

-- Sample menu items
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_vegetarian) VALUES
  (1, 'Chicken Wings', 'Crispy fried chicken wings with dipping sauce', 950.00, 15, FALSE),
  (1, 'Spring Rolls', 'Vegetable spring rolls with sweet chili sauce', 650.00, 10, TRUE),
  (1, 'Fish Cutlet', 'Sri Lankan style fish cutlets', 750.00, 15, FALSE),
  (2, 'Tom Yum Soup', 'Thai-style hot and sour soup', 850.00, 10, FALSE),
  (2, 'Cream of Mushroom', 'Classic cream of mushroom soup', 700.00, 10, TRUE),
  (3, 'Grilled Chicken Sizzler', 'Chicken sizzler with vegetables and sauce', 1800.00, 25, FALSE),
  (3, 'Cashew Nut Chicken', 'Stir-fried chicken with cashew nuts', 1650.00, 20, FALSE),
  (3, 'Fish & Chips', 'Beer-battered fish with fries', 1500.00, 20, FALSE),
  (3, 'Mixed Vegetable Stir Fry', 'Seasonal vegetables stir-fried in Asian sauce', 1200.00, 15, TRUE),
  (4, 'Thai Fried Rice', 'Authentic Thai-style fried rice', 1100.00, 15, FALSE),
  (4, 'Chicken Fried Rice', 'Classic chicken fried rice', 1000.00, 15, FALSE),
  (4, 'Stir Fried Noodles', 'Wok-fried noodles with vegetables', 950.00, 15, TRUE),
  (5, 'Garlic Prawns', 'Prawns sautéed in garlic butter', 2200.00, 20, FALSE),
  (5, 'Sweet & Sour Fish', 'Deep fried fish in sweet and sour sauce', 1800.00, 20, FALSE),
  (6, 'Watalappan', 'Traditional Sri Lankan coconut custard', 600.00, 5, TRUE),
  (6, 'Chocolate Pudding', 'Rich chocolate pudding with cream', 700.00, 5, TRUE),
  (6, 'Ice Cream Sundae', 'Three scoops with toppings', 800.00, 5, TRUE),
  (7, 'Fresh Fruit Juice', 'Seasonal fresh fruit juice', 450.00, 5, TRUE),
  (7, 'Ceylon Tea', 'Organic Ceylon black tea', 250.00, 5, TRUE),
  (7, 'Fresh Lime Soda', 'Fresh lime with soda water', 350.00, 5, TRUE),
  (8, 'Mojito', 'Classic mojito with fresh mint', 1200.00, 5, TRUE),
  (8, 'Piña Colada', 'Coconut cream and pineapple cocktail', 1400.00, 5, TRUE);

-- Sample guests
INSERT INTO guests (first_name, last_name, email, phone, nationality, id_number, total_stays) VALUES
  ('John', 'Smith', 'john.smith@email.com', '+94 77 123 4567', 'lk', '123456789V', 3),
  ('Sarah', 'Johnson', 'sarah.j@email.com', '+94 71 234 5678', 'us', 'P1234567', 1),
  ('Michael', 'Brown', 'm.brown@email.com', '+94 76 345 6789', 'uk', 'GB987654321', 2),
  ('Emma', 'Davis', 'emma.davis@email.com', '+94 77 987 6543', 'au', 'AU456789123', 1),
  ('David', 'Wilson', 'd.wilson@email.com', '+94 70 111 2233', 'lk', '987654321V', 5);

-- Sample bookings
INSERT INTO bookings (booking_ref, guest_id, room_id, room_type_id, check_in, check_out, nights, adults, children, meal_plan, room_rate, subtotal, tax_amount, service_charge, total_amount, status, source) VALUES
  ('BK-2026-001', 1, 3, 1, '2026-04-15', '2026-04-20', 5, 1, 0, 'bnb', 14000.00, 70000.00, 8400.00, 7000.00, 85400.00, 'checked_in', 'direct'),
  ('BK-2026-002', 2, 6, 2, '2026-04-16', '2026-04-19', 3, 2, 0, 'half-board', 20000.00, 60000.00, 7200.00, 6000.00, 73200.00, 'confirmed', 'ota'),
  ('BK-2026-003', 3, 10, 3, '2026-04-14', '2026-04-22', 8, 3, 1, 'full-board', 33000.00, 264000.00, 31680.00, 26400.00, 322080.00, 'checked_in', 'direct'),
  ('BK-2026-004', 5, 13, 4, '2026-04-13', '2026-04-18', 5, 2, 0, 'full-board', 27000.00, 135000.00, 16200.00, 13500.00, 164700.00, 'checked_in', 'phone');

-- Day out plans
INSERT INTO day_out_plans (name, description, category, price_per_person, duration_hours, max_participants, inclusions) VALUES
  ('Ella Rock Trail', 'Guided trek through Ella Rock with stunning panoramic views', 'adventure', 3500.00, 6, 15, '["Guide", "Breakfast pack", "Refreshments", "Transport", "First Aid"]'),
  ('Tea Plantation Tour', 'Visit to historic tea plantations with tea tasting', 'cultural', 2500.00, 4, 20, '["Transport", "Tea tasting", "Factory tour", "Light refreshments", "Souvenir tea pack"]'),
  ('Waterfall & Nature Walk', 'Explore hidden waterfalls and natural pools', 'nature', 3000.00, 5, 12, '["Guide", "Lunch pack", "Refreshments", "Swimming access", "Transport"]'),
  ('Ayurveda Wellness Day', 'Full day Ayurvedic spa and wellness treatments', 'wellness', 8000.00, 8, 8, '["Herbal bath", "Full body massage", "Facial treatment", "Herbal meals", "Meditation session"]'),
  ('Family Adventure Park', 'Fun-filled day with activities for all ages', 'family', 4500.00, 7, 25, '["All rides access", "Lunch", "Refreshments", "Photo session", "Souvenir"]');
