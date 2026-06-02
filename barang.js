// Konfigurasi Supabase Anda (Berdasarkan gambar_1.png)
const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
// GANTI DENGAN ANON KEY ANDA SENDIRI
const SUPABASE_ANON_KEY = 'MASUKKAN_ANON_KEY_SUPABASE_ANDA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productForm = document.getElementById('productForm');
const btnSimpan = document.getElementById('btnSimpan');

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Mengubah tampilan tombol menjadi Loading status
    btnSimpan.innerText = 'Menyimpan ke Supabase...';
    btnSimpan.disabled = true;
    btnSimpan.style.background = '#475569';

    // Mengambil value dari Form Input
    const nama_barang = document.getElementById('nama_barang').value;
    const stok = parseInt(document.getElementById('stok').value);
    const harga_modal = parseFloat(document.getElementById('harga_modal').value);
    const harga_jual = parseFloat(document.getElementById('harga_jual').value);
    const harga_member = parseFloat(document.getElementById('harga_member').value);

    // Kirim data ke tabel 'products' di Supabase
    const { data, error } = await supabaseClient
        .from('products')
        .insert([
            {
                nama_barang,
                stok,
                harga_modal,
                harga_jual,
                harga_member
            }
        ]);

    if (error) {
        alert('❌ Gagal menyimpan data: ' + error.message);
        console.error(error);
    } else {
        alert('🎉 Sukses! Produk "' + nama_barang + '" berhasil ditambahkan.');
        productForm.reset(); // Kosongkan kolom input kembali
    }

    // Mengembalikan tombol ke keadaan semula
    btnSimpan.innerText = 'Simpan ke Database';
    btnSimpan.disabled = false;
    btnSimpan.style.background = '#10b981';
});
