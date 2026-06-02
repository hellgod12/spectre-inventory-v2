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
    const kategori = document.getElementById('kategori').value;
    const ukuran = document.getElementById('ukuran').value || null;
    const stok = parseInt(document.getElementById('stok').value);
    const harga_modal = parseFloat(document.getElementById('harga_modal').value);
    const harga_jual = parseFloat(document.getElementById('harga_jual').value);
    const harga_member = parseFloat(document.getElementById('harga_member').value);

    // Mengirimkan semua data termasuk variabel 'kategori' ke tabel Supabase
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ nama_barang, kategori, ukuran, stok, harga_modal, harga_jual, harga_member }]);

    const statusPanel = document.getElementById('stockEntryStatus');
    const progressFill = document.getElementById('stockProgressFill');
    const capacityText = document.getElementById('stockCapacityText');
    const capacityLabel = document.getElementById('stockCapacityLabel');
    const statusNote = document.getElementById('stockStatusNote');

    if (error) {
        alert('❌ ERROR GAGAL: ' + error.message);
        if (statusPanel) {
            statusPanel.innerHTML = `<strong class="block text-red-400 mb-2">ERROR: INJEKSI GAGAL</strong><span>${error.message}</span>`;
        }
    } else {
        alert(`🎉 BERHASIL SERAM: [${kategori}] "${nama_barang.toUpperCase()}" sudah masuk ke gudang.`);
        productForm.reset();
        if (statusPanel) {
            statusPanel.innerHTML = `
                <strong class="block text-emerald-300 mb-2">INJEKSI BERHASIL</strong>
                <span>${stok} unit ${nama_barang.toUpperCase()} berhasil disuntik ke gudang.</span>
            `;
        }
        if (progressFill) {
            const value = Math.min(100, Math.max(12, stok * 3));
            progressFill.style.width = `${value}%`;
        }
        if (capacityText) {
            capacityText.innerText = `${Math.min(100, Math.max(12, stok * 3))}% terserap oleh candel`; 
        }
        if (capacityLabel) {
            capacityLabel.innerText = 'KAPASITAS-RAHASIA';
        }
        if (statusNote) {
            statusNote.innerText = `Sistem mengunci ${stok} barang baru. Gudang semakin pekat.`;
        }
    }

    btnSimpan.innerText = 'KIRIM DATA KE GUDANG';
    btnSimpan.disabled = false;
});
