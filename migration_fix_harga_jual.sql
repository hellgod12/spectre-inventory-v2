-- Migration to fix harga_jual that are incorrectly set to modal prices
-- This script updates harga_jual for products where harga_jual <= harga_modal
-- Sets harga_jual to harga_modal + 30% margin (you can adjust the margin percentage)

-- First, let's see which products have incorrect harga_jual
SELECT 
    id,
    nama_barang,
    ukuran,
    harga_modal,
    harga_jual,
    harga_member,
    kategori,
    stok,
    CASE 
        WHEN harga_jual <= harga_modal THEN 'NEEDS FIX'
        ELSE 'OK'
    END AS status
FROM products
ORDER BY 
    CASE WHEN harga_jual <= harga_modal THEN 0 ELSE 1 END,
    nama_barang;

-- Update harga_jual for products where harga_jual <= harga_modal
-- Adding 30% margin to harga_modal (adjust percentage as needed)
UPDATE products
SET harga_jual = ROUND(harga_modal * 1.3, 0)
WHERE harga_jual <= harga_modal;

-- Verify the fix
SELECT 
    id,
    nama_barang,
    ukuran,
    harga_modal,
    harga_jual,
    harga_member,
    kategori,
    stok,
    CASE 
        WHEN harga_jual <= harga_modal THEN 'STILL NEEDS FIX'
        ELSE 'FIXED'
    END AS status
FROM products
ORDER BY 
    CASE WHEN harga_jual <= harga_modal THEN 0 ELSE 1 END,
    nama_barang;
