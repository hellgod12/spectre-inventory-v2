const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const selectProduct = document.getElementById('selectProduct');
const inputJumlah = document.getElementById('inputJumlah');
const previewHargaSatuan = document.getElementById('previewHargaSatuan');
const previewTotal = document.getElementById('previewTotal');
const productDetail = document.getElementById('productDetail');
const salesForm = document.getElementById('salesForm');

let allProducts = [];
let selectedProduct = null;

async function fetchProductsForSales() {
    const { data, error } = await supabaseClient.from('products').select('*').order('nama_barang');
    if (error) return console.error(error);
    
    allProducts = data;
    selectProduct.innerHTML = '<option value="">-- KUNCI ID PRODUK --</option>';
    data.forEach(p => {
        selectProduct.innerHTML += `<option value="${p.id}">${p.nama_barang.toUpperCase()} [SISA_STOK: ${p.stok}]</option>`;
    });
}

function updatePricePreview() {
    const prodId = selectProduct.value;
    selectedProduct = allProducts.find(p => p.id == prodId);

    if (!selectedProduct) {
        previewHargaSatuan.innerText = 'Rp 0';
        previewTotal.innerText = 'Rp 0';
        productDetail.innerHTML = '<p class="text-red-900/60 text-[10px] uppercase">>> MENUNGGU PILIHAN PRODUK...</p>';
        return;
    }

    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    const hargaSatuan = tipePembeli === 'Member' ? selectedProduct.harga_member : selectedProduct.harga_jual;
    const jumlah = parseInt(inputJumlah.value) || 0;
    const total = hargaSatuan * jumlah;

    previewHargaSatuan.innerText = 'Rp ' + Number(hargaSatuan).toLocaleString('id-ID');
    previewTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');

    // Mengganti Label Sektor Kategori ke Bahasa Indonesia
    let sectorLabel = `<span class="text-zinc-400 font-bold">[AKSESORIS]</span>`;
    if (selectedProduct.kategori === 'Skateboard') {
        sectorLabel = `<span class="text-red-500 font-bold">[PAPAN_SKATE] 🛹</span>`;
    } else if (selectedProduct.kategori === 'Perlengkapan') {
        sectorLabel = `<span class="text-orange-400 font-bold">[SPAREPART_GEAR] 🛠️</span>`;
    } else if (selectedProduct.kategori === 'Apparel') {
        sectorLabel = `<span class="text-zinc-400 font-bold">[APPAREL_BAJU] 👕</span>`;
    }

    productDetail.innerHTML = `
        <div class="space-y-3 border border-red-950 p-4 bg-black/90 text-[11px]">
            <div>
                <span class="text-red-700 block text-[9px] uppercase">// KODE_BARANG</span> 
                <b class="text-white tracking-wide text-xs uppercase">${selectedProduct.nama_barang}</b>
            </div>
            <div>
                <span class="text-red-700 block text-[9px] uppercase">// SEKTOR_SISTEM</span> 
                ${sectorLabel}
            </div>
            <div>
                <span class="text-red-700 block text-[9px] uppercase">// CADANGAN_AMUNISI</span> 
                <b class="${selectedProduct.stok <= 5 ? 'text-red-600 animate-pulse font-extrabold' : 'text-slate-300'}">${selectedProduct.stok} UNIT TERSISA</b>
            </div>
        </div>
    `;
}

selectProduct.addEventListener('change', updatePricePreview);
inputJumlah.addEventListener('input', updatePricePreview);
document.getElementById('typeUmum').addEventListener('change', updatePricePreview);
document.getElementById('typeMember').addEventListener('change', updatePricePreview);

salesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedProduct) return alert('[ALARM_SISTEM] GAGAL PROSES: PRODUK BELUM DIKUNCI.');
    const jumlahJual = parseInt(inputJumlah.value);

    if (selectedProduct.stok < jumlahJual) {
        alert(`[GAGAL_KRITIS] STOK GUDANG KURANG! Sisa stok hanya: ${selectedProduct.stok}`);
        return;
    }

    const sisaStokBaru = selectedProduct.stok - jumlahJual;

    const { error: updateError } = await supabaseClient
        .from('products')
        .update({ stok: sisaStokBaru })
        .eq('id', selectedProduct.id);

    if (updateError) {
        alert('[ERROR_SERVER] Pemotongan stok dibatalkan: ' + updateError.message);
    } else {
        alert('🎉 EKSEKUSI BERHASIL // Transaksi sukses dicatat, stok database otomatis terpotong!');
        salesForm.reset();
        fetchProductsForSales();
        updatePricePreview();
    }
});

document.addEventListener('DOMContentLoaded', fetchProductsForSales);
