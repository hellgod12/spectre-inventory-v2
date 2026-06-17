-- Check harga_jual for size L product
SELECT 
    id,
    nama_barang,
    ukuran,
    harga_modal,
    harga_jual,
    harga_member,
    kategori,
    stok
FROM products
WHERE ukuran = 'L' OR nama_barang LIKE '%L%'
ORDER BY nama_barang;
