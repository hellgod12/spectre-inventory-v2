const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productForm = document.getElementById('productForm');
const btnSimpan = document.getElementById('btnSimpan');

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnSimpan.innerText = 'Menyimpan...';
    btnSimpan.disabled = true;

    const nama_barang = document.getElementById('nama_barang').value;
    const stok = parseInt(document.getElementById('stok').value);
    const harga_modal = parseFloat(document.getElementById('harga_modal').value);
    const harga_jual = parseFloat(document.getElementById('harga_jual').value);
    const harga_member = parseFloat(document.getElementById('harga_member').value);

    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ nama_barang, stok, harga_modal, harga_jual, harga_member }]);

    if (error) {
        alert('❌ Gagal menyimpan data: ' + error.message);
    } else {
        alert(`🎉 Sukses! Produk "${nama_barang}" berhasil ditambahkan.`);
        productForm.reset();
    }

    btnSimpan.innerText = 'Simpan ke Gudang';
    btnSimpan.disabled = false;
});
