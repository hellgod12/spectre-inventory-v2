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
const salesPanel = document.getElementById('salesPanel');
const ledgerSalesCount = document.getElementById('ledgerSalesCount');
const ledgerPaidCount = document.getElementById('ledgerPaidCount');
const ledgerUnpaidCount = document.getElementById('ledgerUnpaidCount');
const ledgerProgressFill = document.getElementById('ledgerProgressFill');
const ledgerProgressText = document.getElementById('ledgerProgressText');
const kasirProgressFill = document.getElementById('kasirProgressFill');
const kasirProgressText = document.getElementById('kasirProgressText');
const kasirProgressLabel = document.getElementById('kasirProgressLabel');

let allProducts = [];
let selectedProduct = null;

// LocalStorage payments helpers
function loadPayments() {
    try { return JSON.parse(localStorage.getItem('payments') || '[]'); } catch (e) { return []; }
}

function savePaymentRecord(record) {
    const payments = loadPayments();
    payments.push(record);
    localStorage.setItem('payments', JSON.stringify(payments));
}

function mergePayments(remotePayments = []) {
    const merged = new Map();
    remotePayments.forEach(p => { if (p && p.id) merged.set(p.id, p); });
    loadPayments().forEach(p => { if (p && p.id) merged.set(p.id, p); });
    return Array.from(merged.values());
}

async function updateLedgerBookkeeping() {
    let allPayments = loadPayments();
    try {
        const { data: remotePayments } = await supabaseClient.from('payments').select('*');
        if (remotePayments) {
            allPayments = mergePayments(remotePayments);
        }
    } catch (err) {
        console.warn('Tidak bisa memuat data pembayaran remote untuk bookkeeping:', err.message || err);
    }

    const confirmedCount = allPayments.filter(p => p.status === 'Sudah Bayar').length;
    const unpaidCount = allPayments.filter(p => p.status === 'Belum Bayar').length;
    const totalAmount = allPayments.reduce((sum, p) => sum + (parseFloat(p.total_harga) || 0), 0);
    const totalCount = confirmedCount + unpaidCount;
    const progress = totalCount ? Math.min(100, Math.round((confirmedCount / totalCount) * 100)) : 0;

    if (ledgerSalesCount) ledgerSalesCount.innerText = confirmedCount;
    if (ledgerPaidCount) ledgerPaidCount.innerText = 'Rp ' + totalAmount.toLocaleString('id-ID');
    if (ledgerUnpaidCount) ledgerUnpaidCount.innerText = unpaidCount;
    if (ledgerProgressFill) ledgerProgressFill.style.width = progress + '%';
    if (ledgerProgressText) ledgerProgressText.innerText = progress + '%';
    if (kasirProgressFill) kasirProgressFill.style.width = progress + '%';
    if (kasirProgressText) kasirProgressText.innerText = progress + '% selesai';
    if (kasirProgressLabel) kasirProgressLabel.innerText = totalCount ? 'Progres Transaksi' : 'Status';
}

function showSaleSuccess(message) {
    if (salesPanel) {
        salesPanel.classList.add('sale-flash');
        setTimeout(() => salesPanel.classList.remove('sale-flash'), 900);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

// 1. Ambil Produk & Ambil Nomor Telepon Member dari Supabase
async function initTerminalData() {
    // Ambil Produk
    try {
        const { data: prods, error: prodErr } = await supabaseClient
            .from('products')
            .select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,harga_member,kategori')
            .order('nama_barang');

        if (prodErr) {
            console.error('Gagal memuat products:', prodErr);
            selectProduct.innerHTML = '<option value="">>> GAGAL MEMUAT PRODUK</option>';
            allProducts = [];
        } else if (prods) {
            // penting: pakai dataset ini untuk dropdown
            allProducts = prods;
            selectProduct.innerHTML = '<option value="">-- KUNCI ID PRODUK --</option>';
            prods.forEach(p => {
                const sizeInfo = p.ukuran ? ` [${p.ukuran}]` : '';
                selectProduct.innerHTML += `<option value="${p.id}">${(p.nama_barang || '').toUpperCase()}${sizeInfo} [STOK: ${p.stok}]</option>`;
            });
        }

    } catch (e) {
        console.error('Exception saat memuat products:', e);
        selectProduct.innerHTML = '<option value="">>> GAGAL MEMUAT PRODUK (NETWORK)</option>';
        allProducts = [];
    }

    await updateLedgerBookkeeping();

    // Ambil No Telepon Member
    try {
        const { data: mems, error: memErr } = await supabaseClient.from('members').select('*').order('nama');
        if (memErr) {
            console.error('Gagal memuat members:', memErr);
            selectMember.innerHTML = '<option value="">>> GAGAL MEMUAT MEMBER</option>';
        } else if (mems) {
            selectMember.innerHTML = '<option value="">-- PILIH NO TELEPON MEMBER --</option>';
            mems.forEach(m => {
                selectMember.innerHTML += `<option value="${m.telepon}">${m.telepon} [${m.nama.toUpperCase()}]</option>`;
            });
        }
    } catch (e) {
        console.error('Exception saat memuat members:', e);
        selectMember.innerHTML = '<option value="">>> GAGAL MEMUAT MEMBER</option>';
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

    // Metode Pembayaran (Cash / Transfer = Sudah Bayar) | (Belum Bayar = Unpaid)
    const metodePembayaran = document.querySelector('input[name="metode_pembayaran"]:checked')?.value || 'Cash';
    const isUnpaidMethod = metodePembayaran === 'Belum Bayar';

    const paymentRecord = {
        id: 'pay_' + Date.now(),
        buyer: identitasPembeli,
        product: selectedProduct.nama_barang,
        jumlah: jumlahJual,
        total_harga: totalHarga,
        method: metodePembayaran,
        status: isUnpaidMethod ? 'Belum Bayar' : 'Sudah Bayar',
        created_at: new Date().toISOString()
    };

    // Try to save to Supabase payments table; fallback to localStorage
    try {
        const { error: payErr } = await supabaseClient.from('payments').insert([{
            id: paymentRecord.id,
            buyer: paymentRecord.buyer,
            product: paymentRecord.product,
            jumlah: paymentRecord.jumlah,
            total_harga: paymentRecord.total_harga,
            method: paymentRecord.method,
            status: paymentRecord.status,
            created_at: paymentRecord.created_at
        }]);
        if (payErr) {
            console.warn('Supabase insert payments failed, saving locally:', payErr.message);
            savePaymentRecord(paymentRecord);
        }
    } catch (err) {
        console.warn('Supabase unavailable, saving payment locally', err);
        savePaymentRecord(paymentRecord);
    }

    // 1. Potong Stok
    const sisaStokBaru = selectedProduct.stok - jumlahJual;
    const { error: updateError } = await supabaseClient.from('products').update({ stok: sisaStokBaru }).eq('id', selectedProduct.id);
    if (updateError) return alert('Gagal potong stok: ' + updateError.message);

    // 2. Simpan Riwayat
    const { error: historyError } = await supabaseClient.from('sales_history').insert([{ 
        payment_id: paymentRecord.id,
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
        // Animasi candel stok: keluar (-jumlahJual)
        try {
            window.CandleManager?.applyStockDelta?.(-jumlahJual);
        } catch (e) {}

        // Broadcast agar halaman lain juga animasi
        try {
            localStorage.setItem('candle_stock_delta', JSON.stringify({ delta: -jumlahJual, t: Date.now() }));
        } catch (e) {}

        // Animasi candel pembayaran (visual)
        // Jika metode cash/transfer => payment langsung Sudah Bayar
        // Jika metode Belum Bayar => pembayaran akan terselesaikan saat user konfirmasi di dashboard.
        try {
            if (!isUnpaidMethod) {
                window.CandleManager?.applyPaymentDelta?.();
            }
        } catch (e) {}


        // Broadcast pembayaran juga (dashboard/HP)
        try {
            localStorage.setItem('candle_payment_delta', JSON.stringify({ t: Date.now() }));
        } catch (e) {}


        alert('🎉 EKSEKUSI BERHASIL // Transaksi terikat nomor telepon member sukses!');
        salesForm.reset();
        boxMemberSelect.classList.add('hidden');
        await initTerminalData();
        updatePricePreview();
        await updateLedgerBookkeeping();
        showSaleSuccess('TRANSAKSI TERJUAL // Buku kas menjadi lebih hidup.');
    }
});


document.addEventListener('DOMContentLoaded', initTerminalData);
