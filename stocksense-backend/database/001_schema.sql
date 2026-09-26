-- StockSense schema for PostgreSQL 18. Run this file before 002_seed.sql.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE operation_status AS ENUM ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('INITIAL_STOCK', 'RECEIPT', 'DELIVERY', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'OPERATIONS_STAFF');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE unit_of_measure AS ENUM ('UNIT', 'KG', 'METER', 'LITER', 'PAIR', 'PACK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role user_role NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id),
  otp_code VARCHAR(20) NOT NULL, expires_at TIMESTAMPTZ NOT NULL, is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(200) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE, category_id UUID NOT NULL REFERENCES categories(id),
  unit_of_measure unit_of_measure NOT NULL, unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  reorder_level NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  reorder_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reorder_quantity >= 0),
  barcode VARCHAR(100) UNIQUE, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(150) NOT NULL, code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  name VARCHAR(150) NOT NULL, code VARCHAR(80) NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (warehouse_id, code)
);
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id),
  location_id UUID NOT NULL REFERENCES locations(id), on_hand NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, location_id)
);
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reference VARCHAR(50) NOT NULL UNIQUE,
  supplier_name VARCHAR(200) NOT NULL, destination_location_id UUID NOT NULL REFERENCES locations(id),
  scheduled_date TIMESTAMPTZ, status operation_status NOT NULL DEFAULT 'DRAFT', created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id), quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (receipt_id, product_id)
);
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reference VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(200) NOT NULL, source_location_id UUID NOT NULL REFERENCES locations(id),
  scheduled_date TIMESTAMPTZ, status operation_status NOT NULL DEFAULT 'DRAFT', created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id), quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (delivery_id, product_id)
);
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reference VARCHAR(50) NOT NULL UNIQUE,
  source_location_id UUID NOT NULL REFERENCES locations(id), destination_location_id UUID NOT NULL REFERENCES locations(id),
  scheduled_date TIMESTAMPTZ, status operation_status NOT NULL DEFAULT 'DRAFT', created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (source_location_id <> destination_location_id)
);
CREATE TABLE IF NOT EXISTS transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id), quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (transfer_id, product_id)
);
CREATE TABLE IF NOT EXISTS adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reference VARCHAR(50) NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id), location_id UUID NOT NULL REFERENCES locations(id),
  system_quantity NUMERIC(14,3) NOT NULL CHECK (system_quantity >= 0),
  physical_quantity NUMERIC(14,3) NOT NULL CHECK (physical_quantity >= 0), difference NUMERIC(14,3) NOT NULL,
  reason TEXT NOT NULL, status operation_status NOT NULL DEFAULT 'DRAFT', created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (difference = physical_quantity - system_quantity)
);
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id),
  source_location_id UUID REFERENCES locations(id), destination_location_id UUID REFERENCES locations(id),
  movement_type movement_type NOT NULL, quantity NUMERIC(14,3) NOT NULL, reference_type VARCHAR(50) NOT NULL,
  reference_id UUID, created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (movement_type IN ('INITIAL_STOCK', 'RECEIPT', 'TRANSFER_IN') AND source_location_id IS NULL AND destination_location_id IS NOT NULL AND quantity > 0)
    OR (movement_type IN ('DELIVERY', 'TRANSFER_OUT') AND source_location_id IS NOT NULL AND destination_location_id IS NULL AND quantity < 0)
    OR (movement_type = 'ADJUSTMENT' AND ((source_location_id IS NOT NULL AND destination_location_id IS NULL AND quantity < 0) OR (source_location_id IS NULL AND destination_location_id IS NOT NULL AND quantity > 0)))
  )
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_user_expires ON otp_codes(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_scheduled_date ON receipts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_date ON deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_scheduled_date ON transfers(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_adjustments_status ON adjustments(status);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at ON stock_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_movement_type ON stock_ledger(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_reference_id ON stock_ledger(reference_id);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
DROP TRIGGER IF EXISTS trg_warehouses_updated_at ON warehouses;
DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
DROP TRIGGER IF EXISTS trg_receipts_updated_at ON receipts;
DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON deliveries;
DROP TRIGGER IF EXISTS trg_transfers_updated_at ON transfers;
DROP TRIGGER IF EXISTS trg_adjustments_updated_at ON adjustments;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_receipts_updated_at BEFORE UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_adjustments_updated_at BEFORE UPDATE ON adjustments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
COMMIT;
