- [ ] Tambah UI input override harga di `penjualan.html` (dua input: Umum dan Member, optional).
- [ ] Update `penjualan.js`:
  - [ ] baca override harga jika terisi
  - [ ] `hargaSatuan` pakai override (kalau ada) daripada `selectedProduct.harga_*`
  - [ ] simpan ke `sales_history` supaya dashboard profit mengikuti (minimal lewat `total_harga` sudah otomatis)
  - [ ] update `previewHargaSatuan` dan `previewTotal`
- [ ] Dashboard (`script.js`): pastikan profit logic sudah pakai `total_harga` dari `sales_history` (sudah, karena pakai `sale.total_harga`), jadi harusnya ikut.

