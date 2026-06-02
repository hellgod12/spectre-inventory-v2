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
    selectProduct.innerHTML = '<option value="">-- PILIH PRODUK --</option>';
    data.forEach(p => {
        selectProduct.innerHTML += `<option value="${p.id}">${p.nama_barang.toUpperCase()} (STOK: ${p.stok})</option>`;
    });
}

function updatePricePreview() {
    const prodId = selectProduct.value;
    selectedProduct = allProducts.find(p => p.id == prodId);

    if (!selectedProduct) {
        previewHargaSatuan.innerText = 'Rp 0';
        previewTotal.innerText = 'Rp 0';
        productDetail.innerHTML = '<p class="text-slate-600 text-[10px] uppercase">>> Menunggu pilihan...</p>';
        return;
    }

    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    const hargaSatuan = tipePembeli === 'Member' ? selectedProduct.harga_member : selectedProduct.harga_jual;
    const jumlah = parseInt(inputJumlah.value) || 0;
    const total = hargaSatuan * jumlah;

    previewHargaSatuan.innerText = 'Rp ' + Number(hargaSatuan).toLocaleString('id-ID');
    previewTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');

    productDetail.innerHTML = `
        <div class="space-y-2 border border-slate-800 p-3 rounded bg-slate-950/80 text-[11px]">
            <div><span class="text-slate-600 block text-[9px]">// ITEM</span> <b class="text-white">${selectedProduct.nama_barang.toUpperCase()}</b></div>
            <div><span class="text-slate-600 block text-[9px]">// GUDANG</span> <b class="${selectedProduct.stok <= 5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}">${selectedProduct.stok} UNIT</b></div>
            <div><span class="text-slate-600 block text-[9px]">// MODAL</span> <span class="text-slate-300">Rp ${Number(selectedProduct.harga_modal).toLocaleString('id-ID')}</span></div>
        </div>
    `;
}

selectProduct.addEventListener('change', updatePricePreview);
inputJumlah.addEventListener('input', updatePricePreview);
document.getElementById('typeUmum').addEventListener('change', updatePricePreview);
document.getElementById('typeMember').addEventListener('change', updatePricePreview);

salesForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedProduct) return alert('Pilih produk terlebih dahulu!');
    const jumlahJual = parseInt(inputJumlah.value);

    if (selectedProduct.stok < jumlahJual) {
        alert(`❌ TRANSAKSI DITOLAK: Stok kurang! Sisa stok: ${selectedProduct.stok}`);
        return;
    }

    const sisaStokBaru = selectedProduct.stok - jumlahJual;

    const { error: updateError } = await supabaseClient
        .from('products')
        .update({ stok: sisaStokBaru })
        .eq('id', selectedProduct.id);

    if (updateError) {
        alert('CRITICAL ERROR // Gagal memotong stok: ' + updateError.message);
    } else {
        alert('🎉 BERHASIL // Transaksi disetujui, stok terpotong otomatis.');
        salesForm.reset();
        fetchProductsForSales();
        updatePricePreview();
    }
});

document.addEventListener('DOMContentLoaded', fetchProductsForSales);
