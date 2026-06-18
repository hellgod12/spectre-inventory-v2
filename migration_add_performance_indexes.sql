-- Migration: Add Performance Indexes
-- This migration adds indexes for frequently queried columns to improve performance

-- Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_buyer ON payments(buyer);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);

-- Sales History Indexes
CREATE INDEX IF NOT EXISTS idx_sales_history_tipe_pembeli ON sales_history(tipe_pembeli);

-- Members Indexes
CREATE INDEX IF NOT EXISTS idx_members_nama ON members(nama);

-- Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_nama_barang ON products(nama_barang);
CREATE INDEX IF NOT EXISTS idx_products_ukuran ON products(ukuran);

-- Comments for documentation
COMMENT ON INDEX idx_payments_buyer IS 'Index for filtering payments by buyer name';
COMMENT ON INDEX idx_payments_method IS 'Index for filtering payments by payment method';
COMMENT ON INDEX idx_sales_history_tipe_pembeli IS 'Index for filtering sales history by buyer type';
COMMENT ON INDEX idx_members_nama IS 'Index for searching members by name';
COMMENT ON INDEX idx_products_nama_barang IS 'Index for searching products by name';
COMMENT ON INDEX idx_products_ukuran IS 'Index for filtering products by size/variant';
