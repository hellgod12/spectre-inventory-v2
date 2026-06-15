-- Migration: Marketplace Formula Improvements
-- Update existing marketplace tables with improved formulas
-- SPECTRE Inventory System
-- Version: 2.1
-- Date: 2026-06-15

-- ============================================
-- ADD DISCOUNT AND TAX COLUMNS TO ORDER_ITEMS
-- ============================================

-- Add discount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'discount'
    ) THEN
        ALTER TABLE order_items ADD COLUMN discount NUMERIC DEFAULT 0 CHECK (discount >= 0);
    END IF;
END $$;

-- Add tax column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'tax'
    ) THEN
        ALTER TABLE order_items ADD COLUMN tax NUMERIC DEFAULT 0 CHECK (tax >= 0);
    END IF;
END $$;

-- ============================================
-- UPDATE TOTAL_PRICE FORMULA
-- ============================================

-- Drop the old generated column and recreate with new formula
ALTER TABLE order_items DROP COLUMN IF EXISTS total_price;

-- Add total_price with improved formula: (quantity * unit_price) - discount + tax
ALTER TABLE order_items ADD COLUMN total_price NUMERIC GENERATED ALWAYS AS ((quantity * unit_price) - COALESCE(discount, 0) + COALESCE(tax, 0)) STORED;

-- ============================================
-- UPDATE NET_REVENUE CALCULATION
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS calculate_online_order_net_revenue ON online_orders;
DROP FUNCTION IF EXISTS calculate_order_net_revenue();

-- Recreate function with shipping_fee included
CREATE OR REPLACE FUNCTION calculate_order_net_revenue()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_revenue = COALESCE(NEW.gross_sales, 0) - 
                     COALESCE(NEW.platform_fee, 0) - 
                     COALESCE(NEW.shipping_fee, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER calculate_online_order_net_revenue
    BEFORE INSERT OR UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_net_revenue();

-- ============================================
-- ADD AUTO-CALCULATE GROSS_SALES TRIGGER
-- ============================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_gross_sales_on_item_change ON order_items;
DROP FUNCTION IF EXISTS calculate_gross_sales_from_items();

-- Create function to auto-calculate gross_sales from order_items
CREATE OR REPLACE FUNCTION calculate_gross_sales_from_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent order's gross_sales when order_items change
    UPDATE online_orders
    SET gross_sales = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM order_items
        WHERE online_order_id = NEW.online_order_id
    )
    WHERE id = NEW.online_order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_gross_sales_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_gross_sales_from_items();

-- ============================================
-- UPDATE STOCK SYNC TRIGGER FOR RESTOCK LOGIC
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS sync_stock_on_online_order ON online_orders;
DROP FUNCTION IF EXISTS sync_online_order_stock();

-- Recreate function with restock logic for CANCELLED/RETURNED
CREATE OR REPLACE FUNCTION sync_online_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    product_record RECORD;
    new_stock INTEGER;
BEGIN
    -- Reduce stock when order is COMPLETED or DELIVERED
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
    
    -- Restore stock when order is CANCELLED or RETURNED
    ELSIF NEW.order_status IN ('CANCELLED', 'RETURNED') AND 
           (OLD.order_status IS NULL OR OLD.order_status NOT IN ('CANCELLED', 'RETURNED')) THEN
        
        -- Loop through order items
        FOR item_record IN 
            SELECT * FROM order_items WHERE online_order_id = NEW.id
        LOOP
            -- Get product info
            SELECT * INTO product_record 
            FROM products 
            WHERE id = item_record.product_id;
            
            -- Restore stock if product exists
            IF FOUND THEN
                new_stock := product_record.stok + item_record.quantity;
                
                UPDATE products 
                SET stok = new_stock 
                WHERE id = product_record.id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER sync_stock_on_online_order
    AFTER UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_online_order_stock();

-- ============================================
-- ADD PROFIT CALCULATION FUNCTION AND VIEW
-- ============================================

-- Drop existing function and view if they exist
DROP FUNCTION IF EXISTS calculate_online_order_profit(UUID);
DROP VIEW IF EXISTS online_order_profit_view;

-- Create function to calculate profit for an online order
CREATE OR REPLACE FUNCTION calculate_online_order_profit(order_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_profit NUMERIC DEFAULT 0;
    item_record RECORD;
    product_record RECORD;
BEGIN
    -- Loop through order items to calculate profit
    FOR item_record IN 
        SELECT * FROM order_items WHERE online_order_id = order_id
    LOOP
        -- Get product modal cost
        SELECT harga_modal INTO product_record.harga_modal
        FROM products
        WHERE id = item_record.product_id;
        
        -- Calculate profit for this item: (unit_price - modal_cost) * quantity
        IF product_record.harga_modal IS NOT NULL THEN
            total_profit := total_profit + ((item_record.unit_price - product_record.harga_modal) * item_record.quantity);
        END IF;
    END LOOP;
    
    RETURN total_profit;
END;
$$ LANGUAGE plpgsql;

-- Create view for online order profit calculation
CREATE OR REPLACE VIEW online_order_profit_view AS
SELECT 
    o.id,
    o.order_number,
    o.order_date,
    o.order_status,
    o.gross_sales,
    o.platform_fee,
    o.shipping_fee,
    o.net_revenue,
    calculate_online_order_profit(o.id) AS profit,
    o.created_at
FROM online_orders o;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verification queries (run these to verify migration success)
-- SELECT COUNT(*) FROM order_items WHERE discount > 0 OR tax > 0;
-- SELECT calculate_online_order_profit('order-id-here') AS profit;
-- SELECT * FROM online_order_profit_view LIMIT 5;
