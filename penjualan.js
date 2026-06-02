const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const selectProduct = document.getElementById('selectProduct');
const selectMember = document.getElementById('selectMember');
const selectUkuran = document.getElementById('selectUkuran');
const boxMemberSelect = document.getElementById('boxMemberSelect');
const boxUkuranSelect = document.getElementById('boxUkuranSelect');
const inputJumlah = document.getElementById('inputJumlah');
const previewHargaSatuan = document.getElementById('previewHargaSatuan');
const previewTotal = document.getElementById('previewTotal');
const productDetail = document.getElementById('productDetail');
const salesForm = document.getElementById('salesForm');

let allProducts = [];
let selectedProduct = null;

// 1. Ambil Produk & Ambil Nomor Telepon Member dari Supabase
async function initTerminalData() {
    // Ambil Produk
    const { data: prods } = await supabaseClient.from('products').select('*').order('nama_barang');
    if (prods) {
        allProducts = prods;
        selectProduct.innerHTML = '<option value="">-- KUNCI ID PRODUK --</option>';
        prods.forEach(p => {
            const sizeInfo = p.ukuran ? ` [${p.ukuran}]` : '';
            selectProduct.innerHTML += `<option value="${p.id}">${p.nama_barang.toUpperCase()}${sizeInfo} [STOK: ${p.stok}]</option>`;
        });
    }

    // Ambil No Telepon Member
    const { data: mems } = await supabaseClient.from('members').select('*').order('nama');
    if (mems) {
        selectMember.innerHTML = '<option value="">-- PILIH NO TELEPON MEMBER --</option>';
        mems.forEach(m => {
            selectMember.innerHTML += `<option value="${m.telepon}">${m.telepon} [${m.nama.toUpperCase()}]</option>`;
        });
    }
}

// 2. Tampilkan/Sembunyikan Pilihan No Telepon Tergantung Radio Button yang Dipilih
function handleTypeChange() {
    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    if (tipePembeli === 'Member') {
        boxMemberSelect.classList.remove('hidden');
        selectMember.setAttribute('required', 'true');
    } else {
        boxMemberSelect.classList.add('hidden');
        selectMember.removeAttribute('required');
        selectMember.value = "";
    }
    updatePricePreview();
}

function updatePricePreview() {
    const prodId = selectProduct.value;
    selectedProduct = allProducts.find(p => p.id == prodId);

    if (!selectedProduct) {
        previewHargaSatuan.innerText = 'Rp 0';
        previewTotal.innerText = 'Rp 0';
        productDetail.innerHTML = '<p class="text-red-900/60 text-[10px] uppercase">>> MENUNGGU PILIHAN PRODUK...</p>';
        boxUkuranSelect.classList.add('hidden');
        selectUkuran.removeAttribute('required');
        return;
    }

    // Tampilkan ukuran kalau ada
    if (selectedProduct.ukuran) {
        selectUkuran.innerHTML = `<option value="${selectedProduct.ukuran}">${selectedProduct.ukuran}</option>`;
        boxUkuranSelect.classList.remove('hidden');
        selectUkuran.setAttribute('required', 'true');
    } else {
        boxUkuranSelect.classList.add('hidden');
        selectUkuran.removeAttribute('required');
        selectUkuran.value = '';
    }

    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    const hargaSatuan = tipePembeli === 'Member' ? selectedProduct.harga_member : selectedProduct.harga_jual;
    const jumlah = parseInt(inputJumlah.value) || 0;
    const total = hargaSatuan * jumlah;

    previewHargaSatuan.innerText = 'Rp ' + Number(hargaSatuan).toLocaleString('id-ID');
    previewTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');

    let sectorLabel = `<span class="text-zinc-400 font-bold">[AKSESORIS]</span>`;
    if (selectedProduct.kategori === 'Skateboard') sectorLabel = `<span class="text-red-500 font-bold">[PAPAN_SKATE] 🛹</span>`;
    else if (selectedProduct.kategori === 'Perlengkapan') sectorLabel = `<span class="text-orange-400 font-bold">[SPAREPART_GEAR] 🛠️</span>`;
    else if (selectedProduct.kategori === 'Apparel') sectorLabel = `<span class="text-zinc-400 font-bold">[APPAREL_BAJU] 👕</span>`;

    productDetail.innerHTML = `
        <div class="space-y-3 border border-red-950 p-4 bg-black/90 text-[11px]">
            <div><span class="text-red-700 block text-[9px] uppercase">// KODE_BARANG</span> <b class="text-white tracking-wide text-xs uppercase">${selectedProduct.nama_barang}</b></div>
            <div><span class="text-red-700 block text-[9px] uppercase">// SEKTOR_SISTEM</span> ${sectorLabel}</div>
            ${selectedProduct.ukuran ? `<div><span class="text-red-700 block text-[9px] uppercase">// UKURAN</span> <b class="text-yellow-400">${selectedProduct.ukuran}</b></div>` : ''}
            <div><span class="text-red-700 block text-[9px] uppercase">// CADANGAN_AMUNISI</span> <b class="${selectedProduct.stok <= 5 ? 'text-red-600 animate-pulse font-extrabold' : 'text-slate-300'}">${selectedProduct.stok} UNIT TERSISA</b></div>
        </div>
    `;
}

selectProduct.addEventListener('change', updatePricePreview);
inputJumlah.addEventListener('input', updatePricePreview);
document.getElementById('typeUmum').addEventListener('change', handleTypeChange);
document.getElementById('typeMember').addEventListener('change', handleTypeChange);

salesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedProduct) return alert('[ALARM] GAGAL: PRODUK BELUM DIKUNCI.');
    const jumlahJual = parseInt(inputJumlah.value);

    if (selectedProduct.stok < jumlahJual) {
        alert(`[GAGAL] STOK GUDANG KURANG! Sisa: ${selectedProduct.stok}`);
        return;
    }

    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    const nomorTelpInfo = selectMember.value; 
    
    // Format struktur orang untuk disimpan ke sales_history (misal: "Member (08123456)")
    const identitasPembeli = tipePembeli === 'Member' ? `Member (${nomorTelpInfo})` : 'Umum';

    const hargaSatuan = tipePembeli === 'Member' ? selectedProduct.harga_member : selectedProduct.harga_jual;
    const totalHarga = hargaSatuan * jumlahJual;

    // 1. Potong Stok
    const sisaStokBaru = selectedProduct.stok - jumlahJual;
    const { error: updateError } = await supabaseClient.from('products').update({ stok: sisaStokBaru }).eq('id', selectedProduct.id);
    if (updateError) return alert('Gagal potong stok: ' + updateError.message);

    // 2. Simpan Riwayat
    const { error: historyError } = await supabaseClient.from('sales_history').insert([{ 
        nama_barang: selectedProduct.nama_barang, 
        kategori: selectedProduct.kategori,
        ukuran: selectedProduct.ukuran || null,
        jumlah: jumlahJual, 
        total_harga: totalHarga, 
        tipe_pembeli: identitasPembeli
    }]);

    if (historyError) {
        alert('Stok terpotong, tapi riwayat gagal dicatat: ' + historyError.message);
    } else {
        alert('🎉 EKSEKUSI BERHASIL // Transaksi terikat nomor telepon member sukses!');
        salesForm.reset();
        boxMemberSelect.classList.add('hidden');
        initTerminalData();
        updatePricePreview();
    }
});

document.addEventListener('DOMContentLoaded', initTerminalData);
