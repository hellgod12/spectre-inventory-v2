-- Check for duplicate phone numbers in members table
SELECT telepon, COUNT(*) as count 
FROM members 
GROUP BY telepon 
HAVING COUNT(*) > 1;

-- View all members with duplicate phone numbers
SELECT * FROM members 
WHERE telepon IN (
  SELECT telepon FROM members GROUP BY telepon HAVING COUNT(*) > 1
)
ORDER BY telepon;

-- Disable trigger temporarily to avoid updated_at error
ALTER TABLE members DISABLE TRIGGER ALL;

-- Fix duplicate phone number for Ilham and Avril
-- Both have phone number 081221398412
-- Update Avril's phone number to avoid conflict
UPDATE members 
SET telepon = '081221398413' 
WHERE nama = 'avril' AND telepon = '081221398412';

-- Re-enable trigger
ALTER TABLE members ENABLE TRIGGER ALL;

-- Verify the fix
SELECT nama, telepon FROM members WHERE nama IN ('ILHAM', 'avril');

-- ============================================================
-- FIX UPDATED_AT TRIGGER ERROR
-- ============================================================
-- Add updated_at column to members table to fix trigger error
ALTER TABLE members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set updated_at to NOW() for existing records
UPDATE members SET updated_at = NOW() WHERE updated_at IS NULL;

-- Verify the changes
SELECT nama, telepon, diskon_persen, updated_at FROM members;
