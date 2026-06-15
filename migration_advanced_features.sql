-- Migration: Advanced Features
-- Stock Adjustments, Product Images, Activity Logs
-- SPECTRE Inventory System
-- Version: 1.0
-- Date: 2026-06-15

-- ============================================
-- STOCK ADJUSTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('damage', 'loss', 'expired', 'found', 'correction')),
    quantity INTEGER NOT NULL, -- positive for adding stock, negative for removing stock
    reason TEXT,
    adjusted_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_type ON stock_adjustments(adjustment_type);

-- Enable RLS
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view stock adjustments"
    ON stock_adjustments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view stock adjustments"
    ON stock_adjustments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert stock adjustments"
    ON stock_adjustments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update stock adjustments"
    ON stock_adjustments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete stock adjustments"
    ON stock_adjustments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- ADD COLUMNS TO PRODUCTS TABLE
-- ============================================

-- Add image_url column for product images
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add low_stock_threshold column for custom low stock alerts
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT, -- 'product', 'payment', 'member', 'expense', 'stock_adjustment', etc.
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view activity logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view own activity logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true);

-- ============================================
-- EXTEND USER ROLES TABLE
-- ============================================

-- Add additional roles to profiles table if not exists
-- Note: This assumes profiles table exists from migration_auth_system.sql

-- Update profiles table to support additional roles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ADMIN', 'CASHIER', 'MANAGER', 'VIEWER'));

-- Function to update existing profiles with new role constraint
DO $$
BEGIN
    -- Update any existing profiles that might have invalid roles
    UPDATE profiles 
    SET role = 'CASHIER' 
    WHERE role NOT IN ('ADMIN', 'CASHIER', 'MANAGER', 'VIEWER');
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync stock when adjustment is made
CREATE OR REPLACE FUNCTION sync_stock_on_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
    new_stock INTEGER;
BEGIN
    -- Get product info
    SELECT * INTO product_record 
    FROM products 
    WHERE id = NEW.product_id;
    
    -- Update stock if product exists
    IF FOUND THEN
        new_stock := product_record.stok + NEW.quantity;
        
        IF new_stock < 0 THEN
            RAISE EXCEPTION 'Insufficient stock for product %', product_record.nama_barang;
        END IF;
        
        UPDATE products 
        SET stok = new_stock 
        WHERE id = product_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_stock_on_stock_adjustment
    AFTER INSERT ON stock_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION sync_stock_on_adjustment();

-- ============================================
-- SAMPLE DATA (OPTIONAL - COMMENT OUT FOR PRODUCTION)
-- ============================================

-- Insert sample stock adjustment (commented out for production)
-- INSERT INTO stock_adjustments (product_id, adjustment_type, quantity, reason, adjusted_by)
-- VALUES (
--     (SELECT id FROM products LIMIT 1),
--     'correction',
--     5,
--     'Initial stock correction',
--     'admin'
-- );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verification queries (run these to verify migration success)
-- SELECT COUNT(*) FROM stock_adjustments;
-- SELECT COUNT(*) FROM activity_logs;
-- SELECT COUNT(*) FROM products WHERE image_url IS NOT NULL;
-- SELECT COUNT(*) FROM products WHERE low_stock_threshold IS NOT NULL;
