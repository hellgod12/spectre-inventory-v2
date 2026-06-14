-- ============================================
-- MARKETPLACE ACCOUNTING SYSTEM MIGRATION
-- SPECTRE Inventory System
-- Version: 1.1
-- Date: 2026-06-15
-- ============================================

-- ============================================
-- PREFLIGHT VALIDATION
-- ============================================

-- Check if products table exists and verify id column type
DO $$
DECLARE
    products_id_type TEXT;
BEGIN
    -- Check if products table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        -- Get the data type of products.id
        SELECT data_type INTO products_id_type
        FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'id';
        
        -- Verify it's BIGINT (not UUID)
        IF products_id_type != 'bigint' THEN
            RAISE EXCEPTION 'Schema mismatch: products.id is %, expected bigint. Aborting migration.', products_id_type;
        END IF;
        
        RAISE NOTICE 'Preflight check passed: products.id is bigint';
    ELSE
        RAISE EXCEPTION 'products table does not exist. Aborting migration.';
    END IF;
END $$;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MARKETPLACE ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('SHOPEE', 'TIKTOK', 'TOKOPEDIA', 'LAZADA')),
    shop_name TEXT NOT NULL,
    shop_id TEXT,
    api_key TEXT,
    api_secret TEXT,
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
-- ONLINE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS online_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_account_id UUID REFERENCES marketplace_accounts(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    platform_order_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    order_date TIMESTAMPTZ NOT NULL,
    order_status TEXT DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')),
    gross_sales NUMERIC DEFAULT 0,
    voucher_discount NUMERIC DEFAULT 0,
    platform_fee NUMERIC DEFAULT 0,
    shipping_fee NUMERIC DEFAULT 0,
    net_revenue NUMERIC DEFAULT 0,
    settlement_status TEXT DEFAULT 'UNSETTLED' CHECK (settlement_status IN ('UNSETTLED', 'PARTIALLY_SETTLED', 'SETTLED')),
    settlement_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_number, marketplace_account_id)
);

-- Indexes for performance
CREATE INDEX idx_online_orders_marketplace_account ON online_orders(marketplace_account_id);
CREATE INDEX idx_online_orders_order_date ON online_orders(order_date);
CREATE INDEX idx_online_orders_order_status ON online_orders(order_status);
CREATE INDEX idx_online_orders_settlement_status ON online_orders(settlement_status);

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
-- ORDER ITEMS TABLE
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
CREATE INDEX idx_order_items_online_order ON order_items(online_order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(sku);

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
-- MARKETPLACE FEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    online_order_id UUID NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('COMMISSION', 'SERVICE_FEE', 'TRANSACTION_FEE', 'SHIPPING_FEE', 'OTHER')),
    fee_name TEXT,
    fee_amount NUMERIC NOT NULL CHECK (fee_amount >= 0),
    fee_percentage NUMERIC CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_marketplace_fees_online_order ON marketplace_fees(online_order_id);
CREATE INDEX idx_marketplace_fees_fee_type ON marketplace_fees(fee_type);

-- Enable RLS
ALTER TABLE marketplace_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all marketplace fees"
    ON marketplace_fees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view marketplace fees"
    ON marketplace_fees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert marketplace fees"
    ON marketplace_fees FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update marketplace fees"
    ON marketplace_fees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete marketplace fees"
    ON marketplace_fees FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- SETTLEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
    settlement_id TEXT UNIQUE,
    settlement_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    order_count INTEGER DEFAULT 0 CHECK (order_count >= 0),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_settlements_marketplace_account ON settlements(marketplace_account_id);
CREATE INDEX idx_settlements_settlement_date ON settlements(settlement_date);
CREATE INDEX idx_settlements_status ON settlements(status);

-- Enable RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all settlements"
    ON settlements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view settlements"
    ON settlements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert settlements"
    ON settlements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update settlements"
    ON settlements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete settlements"
    ON settlements FOR DELETE
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

CREATE TRIGGER update_settlements_updated_at
    BEFORE UPDATE ON settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order net revenue
CREATE OR REPLACE FUNCTION calculate_order_net_revenue()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_revenue = COALESCE(NEW.gross_sales, 0) - 
                     COALESCE(NEW.voucher_discount, 0) - 
                     COALESCE(NEW.platform_fee, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_online_order_net_revenue
    BEFORE INSERT OR UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_net_revenue();

-- Function to sync stock when online order is processed
CREATE OR REPLACE FUNCTION sync_online_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    product_record RECORD;
    new_stock INTEGER;
BEGIN
    -- Only sync if order status is PROCESSING or higher
    IF NEW.order_status IN ('PROCESSING', 'SHIPPED', 'DELIVERED') AND 
       (OLD.order_status IS NULL OR OLD.order_status NOT IN ('PROCESSING', 'SHIPPED', 'DELIVERED')) THEN
        
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
-- INSERT INTO marketplace_accounts (platform, shop_name, shop_id, is_active)
-- VALUES 
--     ('SHOPEE', 'Spectre Skate Shop', 'SHOPEE12345', true),
--     ('TIKTOK', 'Spectre Official', 'TIKTOK67890', true)
-- ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verification queries (run these to verify migration success)
-- SELECT COUNT(*) FROM marketplace_accounts;
-- SELECT COUNT(*) FROM online_orders;
-- SELECT COUNT(*) FROM order_items;
-- SELECT COUNT(*) FROM marketplace_fees;
-- SELECT COUNT(*) FROM settlements;
