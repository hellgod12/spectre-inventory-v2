const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productForm = document.getElementById('productForm');
const btnSimpan = document.getElementById('btnSimpan');

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnSimpan.innerText = 'MEMPROSES_DATA...';
    btnSimpan.disabled = true;

    const nama_barang = document.getElementById('nama_barang').value;
    const kategori = document.getElementById('kategori').value; // Mengambil pilihan kategori dari dropdown
    const stok = parseInt(document.getElementById('stok').value);
    const harga_modal = parseFloat(document.getElementById('harga_modal').value);
    const harga_jual = parseFloat(document.getElementById('harga_jual').value);
    const harga_member = parseFloat(document.getElementById('harga_member').value);

    // Mengirimkan semua data termasuk variabel 'kategori' ke tabel Supabase
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ nama_barang, kategori, stok, harga_modal, harga_jual, harga_member }]);

    if (error) {
        alert('❌ ERROR GAGAL: ' + error.message);
    } else {
        alert(`🎉 BERHASIL: [${kategori}] "${nama_barang.toUpperCase()}" Masuk Server.`);
        productForm.reset();
    }

    btnSimpan.innerText = 'KIRIM DATA KE GUDANG';
    btnSimpan.disabled = false;
});
