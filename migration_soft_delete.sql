-- Soft Delete System Migration for Products Table
-- SPECTRE POS & Inventory Management
-- Version: 1.1
-- Date: 2026-06-16

-- ============================================
-- ADD SOFT DELETE COLUMNS TO PRODUCTS TABLE
-- ============================================

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Set default value for existing records
UPDATE products SET is_active = true WHERE is_active IS NULL;

-- ============================================
-- UPDATE INDEXES FOR PERFORMANCE
-- ============================================

-- Create index on is_active for filtering active products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Create index on deleted_at for filtering archived products
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Update Admin policy to include is_active filter
DROP POLICY IF EXISTS "Admins can do anything on products" ON products;
CREATE POLICY "Admins can do anything on products" ON products
    FOR ALL USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'));

-- Update Cashier policy to only see active products
DROP POLICY IF EXISTS "Cashiers can read products" ON products;
CREATE POLICY "Cashiers can read products" ON products
    FOR SELECT USING (auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'CASHIER') AND is_active = true);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verification queries (run these to verify migration success)
-- SELECT COUNT(*) FROM products WHERE is_active = true;
-- SELECT COUNT(*) FROM products WHERE is_active = false;
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' 
-- AND column_name IN ('is_active', 'deleted_at');
