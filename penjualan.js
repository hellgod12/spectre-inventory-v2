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
    selectProduct.innerHTML = '<option value="">-- Pilih Produk --</option>';
    data.forEach(p => {
        selectProduct.innerHTML += `<option value="${p.id}">${p.nama_barang} (Stok: ${p.stok})</option>`;
    });
}

function updatePricePreview() {
    const prodId = selectProduct.value;
    selectedProduct = allProducts.find(p => p.id == prodId);

    if (!selectedProduct) {
        previewHargaSatuan.innerText = 'Rp 0';
        previewTotal.innerText = 'Rp 0';
        productDetail.innerHTML = '<p>Silakan pilih produk untuk melihat detail stok tersisa.</p>';
        return;
    }

    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    const hargaSatuan = tipePembeli === 'Member' ? selectedProduct.harga_member : selectedProduct.harga_jual;
    const jumlah = parseInt(inputJumlah.value) || 0;
    const total = hargaSatuan * jumlah;

    previewHargaSatuan.innerText = 'Rp ' + Number(hargaSatuan).toLocaleString('id-ID');
    previewTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');

    productDetail.innerHTML = `
        <div class="space-y-2">
            <div><span class="text-slate-500">Produk:</span> <b class="text-slate-200">${selectedProduct.nama_barang}</b></div>
            <div><span class="text-slate-500">Stok Saat Ini:</span> <b class="${selectedProduct.stok <= 5 ? 'text-red-400' : 'text-emerald-400'}">${selectedProduct.stok} unit</b></div>
            <div><span class="text-slate-500">Harga Modal:</span> <span>Rp ${Number(selectedProduct.harga_modal).toLocaleString('id-ID')}</span></div>
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
        alert(`❌ Stok tidak mencukupi! Sisa stok hanya: ${selectedProduct.stok}`);
        return;
    }

    const sisaStokBaru = selectedProduct.stok - jumlahJual;

    // Kurangi stok di Supabase
    const { error: updateError } = await supabaseClient
        .from('products')
        .update({ stok: sisaStokBaru })
        .eq('id', selectedProduct.id);

    if (updateError) {
        alert('Gagal memotong stok: ' + updateError.message);
    } else {
        alert('🎉 Transaksi Sukses! Stok gudang telah otomatis dikurangi.');
        salesForm.reset();
        fetchProductsForSales();
        updatePricePreview();
    }
});

document.addEventListener('DOMContentLoaded', fetchProductsForSales);
