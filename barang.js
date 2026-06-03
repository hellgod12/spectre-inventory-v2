const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productForm = document.getElementById('productForm');
const btnSimpan = document.getElementById('btnSimpan');
const stockProgressFill = document.getElementById('stockProgressFill');
const stockCapacityText = document.getElementById('stockCapacityText');
const stockCapacityLabel = document.getElementById('stockCapacityLabel');
const stockStatusNote = document.getElementById('stockStatusNote');
const stockEntryStatus = document.getElementById('stockEntryStatus');

async function refreshStockProgress() {
    let totalStock = 0;
    try {
        const { data: products } = await supabaseClient.from('products').select('stok');
        if (products) {
            totalStock = products.reduce((sum, item) => sum + (parseInt(item.stok || 0)), 0);
        }
    } catch (error) {
        console.warn('Tidak bisa memuat stok untuk progres candel:', error?.message || error);
    }

    const target = 120;
    const percent = totalStock ? Math.min(100, Math.round((Math.min(totalStock, target) / target) * 100)) : 0;
    if (stockProgressFill) stockProgressFill.style.width = percent + '%';
    if (stockCapacityText) stockCapacityText.innerText = `${percent}% terserap oleh candel`;
    if (stockCapacityLabel) stockCapacityLabel.innerText = 'STOK_GELAP';
    if (stockStatusNote) stockStatusNote.innerText = totalStock
        ? `Total stok: ${totalStock} unit. Gudang berjalan makin pekat.`
        : 'Gudang masih kosong, candel tidur.';
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnSimpan.innerText = 'MEMPROSES_DATA...';
    btnSimpan.disabled = true;

    const nama_barang = document.getElementById('nama_barang').value;
    const sku = document.getElementById('sku').value;
    const kategori = document.getElementById('kategori').value;
    const ukuran = document.getElementById('ukuran').value || null;
    const stok = parseInt(document.getElementById('stok').value);
    const harga_modal = parseFloat(document.getElementById('harga_modal').value);
    const harga_jual = parseFloat(document.getElementById('harga_jual').value);
    const harga_member = parseFloat(document.getElementById('harga_member').value);

    // Mengirimkan semua data termasuk variabel 'kategori' ke tabel Supabase
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ nama_barang, sku, kategori, ukuran, stok, harga_modal, harga_jual, harga_member }]);


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
        await refreshStockProgress();

        // Animasi candel stok: masuk (+stok)
        try {
            window.CandleManager?.applyStockDelta?.(stok);
        } catch (e) {}

        // Broadcast agar halaman lain juga animasi
        try {
            localStorage.setItem('candle_stock_delta', JSON.stringify({ delta: stok, t: Date.now() }));
        } catch (e) {}

    }

    btnSimpan.innerText = 'KIRIM DATA KE GUDANG';
    btnSimpan.disabled = false;
});

document.addEventListener('DOMContentLoaded', () => {
    refreshStockProgress();
    try {
        window.CandleManager?.refreshStockCandleFromProductsTotal?.();
    } catch (e) {}
});

