-- Add ukuran column to payments table
-- Migration Date: 2026-06-17
-- Purpose: Add size information to payments for display in dashboard

-- Add ukuran column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'ukuran'
    ) THEN
        ALTER TABLE payments ADD COLUMN ukuran TEXT;
    END IF;
END $$;

-- Backfill ukuran from sales_history for existing payments
UPDATE payments p
SET ukuran = s.ukuran
FROM sales_history s
WHERE p.id = s.payment_id
AND p.ukuran IS NULL
AND s.ukuran IS NOT NULL;

-- Verification query
-- SELECT id, product, ukuran FROM payments LIMIT 10;
