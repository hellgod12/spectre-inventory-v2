-- Migration: Invoice-Based Sales System
-- Add columns to payments table for invoice management

-- Add new columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Add buyer column if not exists (for member tracking)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS buyer TEXT;

-- Add product column if not exists (for product name)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS product TEXT;

-- Add jumlah column if not exists (for quantity)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS jumlah INTEGER DEFAULT 0;

-- Update existing records to maintain compatibility
-- For existing 'Sudah Bayar' records, set paid_amount = total_harga, remaining_amount = 0, status = 'paid'
UPDATE payments 
SET 
    paid_amount = total_harga,
    remaining_amount = 0,
    status = 'paid',
    confirmed_at = created_at
WHERE status = 'Sudah Bayar';

-- For existing 'Belum Bayar' records, set paid_amount = 0, remaining_amount = total_harga, status = 'pending'
UPDATE payments 
SET 
    paid_amount = 0,
    remaining_amount = total_harga,
    status = 'pending'
WHERE status = 'Belum Bayar';

-- Generate invoice numbers for existing records
UPDATE payments 
SET invoice_number = 'INV-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
WHERE invoice_number IS NULL;

-- Set buyer for existing records if null (fallback to tipe_pembeli from sales_history or 'Umum')
UPDATE payments 
SET buyer = COALESCE(buyer, 'Umum')
WHERE buyer IS NULL;

-- Set product for existing records if null (fallback to nama_barang if available)
UPDATE payments 
SET product = COALESCE(product, nama_barang)
WHERE product IS NULL AND nama_barang IS NOT NULL;

-- Set jumlah for existing records if null (fallback to 1)
UPDATE payments 
SET jumlah = COALESCE(jumlah, 1)
WHERE jumlah IS NULL;
