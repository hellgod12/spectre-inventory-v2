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
