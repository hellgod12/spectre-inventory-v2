-- Migration: Manual Marketplace Entry System (No API)
-- Simplified marketplace system for manual entry only
-- SPECTRE Inventory System
-- Version: 2.0
-- Date: 2026-06-15

-- ============================================
-- DROP OLD TABLES AND POLICIES (Clean Slate)
-- ============================================

-- Drop old marketplace tables if they exist from previous migration
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS online_orders CASCADE;
DROP TABLE IF EXISTS marketplace_fees CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS marketplace_accounts CASCADE;

-- ============================================
-- MARKETPLACE ACCOUNTS TABLE (Simplified)
-- ============================================
CREATE TABLE marketplace_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('SHOPEE', 'TIKTOK', 'TOKOPEDIA', 'LAZADA', 'OTHER')),
    shop_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view marketplace accounts"
    ON marketplace_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can insert marketplace accounts"
    ON marketplace_accounts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update marketplace accounts"
    ON marketplace_accounts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete marketplace accounts"
    ON marketplace_accounts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- ONLINE ORDERS TABLE (Simplified for Manual Entry)
-- ============================================
CREATE TABLE IF NOT EXISTS online_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_account_id UUID REFERENCES marketplace_accounts(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    order_date DATE NOT NULL,
    order_status TEXT DEFAULT 'COMPLETED' CHECK (order_status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'COMPLETED')),
    gross_sales NUMERIC DEFAULT 0,
    shipping_fee NUMERIC DEFAULT 0,
    platform_fee NUMERIC DEFAULT 0,
    net_revenue NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_number, marketplace_account_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_online_orders_marketplace_account ON online_orders(marketplace_account_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_order_date ON online_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_online_orders_order_status ON online_orders(order_status);

-- Enable RLS
ALTER TABLE online_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all online orders"
    ON online_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view online orders"
    ON online_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert online orders"
    ON online_orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update online orders"
    ON online_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete online orders"
    ON online_orders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- ORDER ITEMS TABLE (Simplified)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    online_order_id UUID NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_online_order ON order_items(online_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items(sku);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert order items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update order items"
    ON order_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete order items"
    ON order_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_marketplace_accounts_updated_at
    BEFORE UPDATE ON marketplace_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_orders_updated_at
    BEFORE UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order net revenue
CREATE OR REPLACE FUNCTION calculate_order_net_revenue()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_revenue = COALESCE(NEW.gross_sales, 0) - 
                     COALESCE(NEW.platform_fee, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_online_order_net_revenue
    BEFORE INSERT OR UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_net_revenue();

-- Function to sync stock when online order is completed
CREATE OR REPLACE FUNCTION sync_online_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    product_record RECORD;
    new_stock INTEGER;
BEGIN
    -- Only sync if order status is COMPLETED or DELIVERED
    IF NEW.order_status IN ('COMPLETED', 'DELIVERED') AND 
       (OLD.order_status IS NULL OR OLD.order_status NOT IN ('COMPLETED', 'DELIVERED')) THEN
        
        -- Loop through order items
        FOR item_record IN 
            SELECT * FROM order_items WHERE online_order_id = NEW.id
        LOOP
            -- Get product info
            SELECT * INTO product_record 
            FROM products 
            WHERE id = item_record.product_id;
            
            -- Update stock if product exists
            IF FOUND THEN
                new_stock := product_record.stok - item_record.quantity;
                
                IF new_stock < 0 THEN
                    RAISE EXCEPTION 'Insufficient stock for product %', product_record.nama_barang;
                END IF;
                
                UPDATE products 
                SET stok = new_stock 
                WHERE id = product_record.id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_stock_on_online_order
    AFTER UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_online_order_stock();

-- ============================================
-- SAMPLE DATA (OPTIONAL - COMMENT OUT FOR PRODUCTION)
-- ============================================

-- Insert sample marketplace account
INSERT INTO marketplace_accounts (platform, shop_name, is_active)
VALUES 
    ('SHOPEE', 'Spectre Skate Shop', true),
    ('TOKOPEDIA', 'Spectre Official', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verification queries (run these to verify migration success)
-- SELECT COUNT(*) FROM marketplace_accounts;
-- SELECT COUNT(*) FROM online_orders;
-- SELECT COUNT(*) FROM order_items;
