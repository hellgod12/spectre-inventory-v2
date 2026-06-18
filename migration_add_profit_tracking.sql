-- Migration: Add profit tracking to sales_history
-- This migration adds harga_modal column to track cost per transaction
-- This is necessary because harga_modal can change over time
-- and we need to store the cost at the time of sale for accurate profit calculation

-- Add harga_modal column to sales_history
ALTER TABLE sales_history 
ADD COLUMN IF NOT EXISTS harga_modal NUMERIC CHECK (harga_modal >= 0);

-- Add profit column (calculated as total_harga - (harga_modal * jumlah))
ALTER TABLE sales_history 
ADD COLUMN IF NOT EXISTS profit NUMERIC;

-- Update existing records with harga_modal from products table
-- This is a one-time migration for historical data
UPDATE sales_history sh
SET harga_modal = p.harga_modal,
    profit = sh.total_harga - (p.harga_modal * sh.jumlah)
FROM products p
WHERE sh.product_id = p.id
AND sh.harga_modal IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN sales_history.harga_modal IS 'Cost price at time of sale (stored for historical accuracy)';
COMMENT ON COLUMN sales_history.profit IS 'Profit calculated as total_harga - (harga_modal * jumlah)';
