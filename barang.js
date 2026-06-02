const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productForm = document.getElementById('productForm');
const btnSimpan = document.getElementById('btnSimpan');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Fungsi untuk memicu notifikasi toast meluncur dari samping
function showToast(message) {
    toastMessage.innerText = message;
    toast.style.transform = "translateX(0)";
    
    setTimeout(() => {
        toast.style.transform = "translateX(150%)";
    }, 4000);
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Berikan efek transisi loading pada tombol
    btnSimpan.innerHTML = `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Menyimpan data...`;
    btnSimpan.disabled = true;
    btnSimpan.classList.replace('bg-emerald-600', 'bg-slate-700');

    const nama_barang = document.getElementById('nama_barang').value;
    const stok = parseInt(document.getElementById('stok').value);
    const harga_modal = parseFloat(document.getElementById('harga_modal').value);
    const harga_jual = parseFloat(document.getElementById('harga_jual').value);
    const harga_member = parseFloat(document.getElementById('harga_member').value);

    // Kirim data baru ke Supabase
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ nama_barang, stok, harga_modal, harga_jual, harga_member }]);

    if (error) {
        alert('❌ Error: ' + error.message);
    } else {
        showToast(`Sukses! "${nama_barang}" berhasil disimpan.`);
        productForm.reset();
    }

    // Kembalikan status tombol seperti semula
    btnSimpan.innerHTML = 'Simpan ke Database';
    btnSimpan.disabled = false;
    btnSimpan.classList.replace('bg-slate-700', 'bg-emerald-600');
});
