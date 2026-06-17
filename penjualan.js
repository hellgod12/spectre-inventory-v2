// Guard agar script tidak di-load dua kali (hindari redeclaration)
if (window.__PENJUALAN_INIT__) {
    // Script already loaded
} else {
    window.__PENJUALAN_INIT__ = true;
    // Supabase client is initialized in auth.js
    // Use global supabaseClient from auth.js
}


const selectProduct = document.getElementById('selectProduct');
const selectMember = document.getElementById('selectMember');
const selectUkuran = document.getElementById('selectUkuran');
const boxMemberSelect = document.getElementById('boxMemberSelect');
const boxUkuranSelect = document.getElementById('boxUkuranSelect');
const inputJumlah = document.getElementById('inputJumlah');
const hargaOverrideEl = document.getElementById('harga_override');
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
let cart = [];

async function updateLedgerBookkeeping() {
    // Calculate directly from Supabase (no localStorage)
    let allPayments = [];
    let products = [];
    
    try {
        const { data: remotePayments, error } = await supabaseClient.from('payments').select('*');
        if (error) {
            console.error('Failed to load payments from Supabase:', error);
        } else {
            allPayments = remotePayments || [];
        }
    } catch (err) {
        console.error('Error loading payments:', err);
    }

    // Load products for profit calculation
    try {
        const { data: prods } = await supabaseClient.from('products').select('nama_barang, harga_modal');
        if (prods) {
            products = prods;
        }
    } catch (err) {
        console.error('Error loading products for profit calculation:', err);
    }

    // Create product modal map for quick lookup
    const modalMap = new Map();
    products.forEach(p => {
        modalMap.set(String(p.nama_barang || '').toUpperCase(), parseFloat(p.harga_modal || 0));
    });

    // Calculate statistics using new status values
    const confirmedCount = allPayments.filter(p => p.status === 'paid').length;
    const pendingCount = allPayments.filter(p => p.status === 'pending' || p.status === 'partial').length;
    const totalCount = allPayments.length;

    const progress = totalCount ? Math.min(100, Math.round((confirmedCount / totalCount) * 100)) : 0;

    if (ledgerSalesCount) ledgerSalesCount.innerText = confirmedCount;
    if (ledgerPaidCount) ledgerPaidCount.innerText = 'Rp ' + allPayments.reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0).toLocaleString('id-ID');
    if (ledgerUnpaidCount) ledgerUnpaidCount.innerText = pendingCount;
    if (ledgerProgressFill) ledgerProgressFill.style.width = progress + '%';
    if (ledgerProgressText) ledgerProgressText.innerText = progress + '%';
    if (kasirProgressFill) kasirProgressFill.style.width = progress + '%';
    if (kasirProgressText) kasirProgressText.innerText = progress + '% selesai';
    if (kasirProgressLabel) kasirProgressLabel.innerText = totalCount ? 'Progres Transaksi' : 'Status';

    // Update Sales KPI cards for today's data
    const today = new Date().toDateString();
    const todayPayments = allPayments.filter(p => {
        const paymentDate = new Date(p.created_at).toDateString();
        return paymentDate === today;
    });

    const revenueToday = todayPayments.reduce((sum, p) => sum + (parseFloat(p.total_harga) || 0), 0);
    const transactionsToday = todayPayments.length;
    const itemsSoldToday = todayPayments.reduce((sum, p) => sum + (parseInt(p.jumlah) || 0), 0);

    // Payments Received = SUM(paid_amount) from today's paid transactions
    const paymentsReceived = todayPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0);

    // Confirmed Transactions Today = count of today's paid transactions
    const confirmedToday = todayPayments.filter(p => p.status === 'paid').length;

    // Pending Payments Today = count of today's pending/partial transactions
    const pendingToday = todayPayments.filter(p => p.status === 'pending' || p.status === 'partial').length;

    // Calculate profit today based on actual modal cost
    // Profit = (harga_jual - harga_modal) * jumlah for each transaction
    let profitToday = 0;
    todayPayments.forEach(payment => {
        const productName = String(payment.product || '').toUpperCase();
        const modalSatuan = modalMap.get(productName) || 0;
        const qty = parseInt(payment.jumlah || 0);
        const revenue = parseFloat(payment.total_harga || 0);
        const totalModal = modalSatuan * qty;
        profitToday += (revenue - totalModal);
    });

    const salesRevenueTodayEl = document.getElementById('salesRevenueToday');
    const salesTransactionsTodayEl = document.getElementById('salesTransactionsToday');
    const salesItemsTodayEl = document.getElementById('salesItemsToday');
    const salesProfitTodayEl = document.getElementById('salesProfitToday');

    if (salesRevenueTodayEl) salesRevenueTodayEl.innerText = 'Rp ' + revenueToday.toLocaleString('id-ID');
    if (salesTransactionsTodayEl) salesTransactionsTodayEl.innerText = transactionsToday;
    if (salesItemsTodayEl) salesItemsTodayEl.innerText = itemsSoldToday;
    if (salesProfitTodayEl) salesProfitTodayEl.innerText = 'Rp ' + profitToday.toLocaleString('id-ID');
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

// Cart Management Functions
function addToCart() {
    if (!selectedProduct) {
        alert('[ALARM] GAGAL: PRODUK BELUM DIKUNCI.');
        return;
    }

    const jumlahJual = parseInt(inputJumlah.value);
    if (selectedProduct.stok < jumlahJual) {
        alert(`[GAGAL] STOK GUDANG KURANG! Sisa: ${selectedProduct.stok}`);
        return;
    }

    // Read customer type from cart section if available, otherwise from main form
    const tipePembeliEl = document.querySelector('input[name="tipe_pembeli"]:checked');
    const tipePembeli = tipePembeliEl ? tipePembeliEl.value : 'Umum';
    const hargaDefault = tipePembeli === 'Member' ? selectedProduct.harga_member : selectedProduct.harga_jual;

    let hargaOverride = null;
    if (hargaOverrideEl) {
        const raw = String(hargaOverrideEl.value || '').trim();
        const n = raw === '' ? null : Number(raw);
        if (Number.isFinite(n) && n >= 0) hargaOverride = n;
    }

    const hargaSatuan = (hargaOverride != null ? hargaOverride : hargaDefault);
    const totalHarga = hargaSatuan * jumlahJual;

    const cartItem = {
        id: Date.now(),
        productId: selectedProduct.id,
        nama_barang: selectedProduct.nama_barang,
        ukuran: selectedProduct.ukuran || null,
        kategori: selectedProduct.kategori,
        jumlah: jumlahJual,
        hargaSatuan: hargaSatuan,
        totalHarga: totalHarga,
        hargaModal: selectedProduct.harga_modal
    };

    cart.push(cartItem);
    updateCartDisplay();
    // Clear form to make it clear cart is what matters for processing sale
    selectProduct.value = '';
    selectedProduct = null;
    inputJumlah.value = '1';
    if (hargaOverrideEl) hargaOverrideEl.value = '';
    boxUkuranSelect.classList.add('hidden');
    selectUkuran.removeAttribute('required');
    updatePricePreview();
    showSaleSuccess('BARANG DITAMBAHKAN KE KERANJANG');
}

function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.id !== cartItemId);
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartCountEl = document.getElementById('cartCount');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartCustomerOptionsEl = document.getElementById('cartCustomerOptions');
    const cartPaymentOptionsEl = document.getElementById('cartPaymentOptions');

    if (!cartItemsEl || !cartCountEl || !cartSubtotalEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="cart-placeholder">No items in cart</p>';
        cartCountEl.textContent = '0 items';
        cartSubtotalEl.textContent = 'Rp 0';
        if (cartCustomerOptionsEl) cartCustomerOptionsEl.classList.add('hidden');
        if (cartPaymentOptionsEl) cartPaymentOptionsEl.classList.add('hidden');
        return;
    }

    let html = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.totalHarga;
        const sizeInfo = item.ukuran ? `<span>Size: ${item.ukuran}</span>` : '';
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nama_barang.toUpperCase()}</div>
                    <div class="cart-item-details">
                        <span>Qty: ${item.jumlah}</span>
                        ${sizeInfo}
                    </div>
                </div>
                <div class="cart-item-price">Rp ${item.totalHarga.toLocaleString('id-ID')}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
    });

    cartItemsEl.innerHTML = html;
    cartCountEl.textContent = `${cart.length} item${cart.length > 1 ? 's' : ''}`;
    cartSubtotalEl.textContent = 'Rp ' + subtotal.toLocaleString('id-ID');
    
    // Show customer and payment options when cart has items
    if (cartCustomerOptionsEl) cartCustomerOptionsEl.classList.remove('hidden');
    if (cartPaymentOptionsEl) {
        cartPaymentOptionsEl.classList.remove('hidden');
        // Update partial payment summary with cart subtotal
        updatePartialPaymentSummary(subtotal);
    }
}

function updatePartialPaymentSummary(totalHarga) {
    const amountPaidInput = document.getElementById('amountPaid');
    const partialTotalEl = document.getElementById('partialTotal');
    const partialPaidEl = document.getElementById('partialPaid');
    const partialRemainingEl = document.getElementById('partialRemaining');

    if (!amountPaidInput || !partialTotalEl || !partialPaidEl || !partialRemainingEl) return;

    const amountPaid = parseFloat(amountPaidInput.value) || 0;

    partialTotalEl.innerText = 'Rp ' + totalHarga.toLocaleString('id-ID');
    partialPaidEl.innerText = 'Rp ' + amountPaid.toLocaleString('id-ID');
    partialRemainingEl.innerText = 'Rp ' + Math.max(0, totalHarga - amountPaid).toLocaleString('id-ID');
}

// 1. Ambil Produk & Ambil Nomor Telepon Member dari Supabase
async function initTerminalData() {
    console.log('initTerminalData started');
    // Marker untuk memastikan penjualan.js dieksekusi (debug UI)
    if (selectProduct) {
        selectProduct.innerHTML = '<option value="">>> PENJUALAN.JS LOAD OK</option>';
    }

    // Ambil Produk (hanya aktif)
    console.log('loadProducts started');
    try {
        const { data: prods, error: prodErr } = await supabaseClient
            .from('products')
            .select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,harga_member,kategori')
            .eq('is_active', true)
            .order('nama_barang');

        console.log('Products result:', prods);
        console.log('Products error:', prodErr);

        if (prodErr) {
            console.error('Gagal memuat products:', prodErr);
            selectProduct.innerHTML = `<option value="">>> GAGAL MEMUAT PRODUK: ${String(prodErr.message || prodErr).slice(0, 80)}</option>`;
            allProducts = [];
        } else if (prods && prods.length > 0) {
            console.log("Products loaded:", prods);
            console.log("Product count:", prods?.length);
            allProducts = prods;
            selectProduct.innerHTML = '<option value="">-- KUNCI ID PRODUK --</option>';
            prods.forEach(p => {
                const sizeInfo = p.ukuran ? ` [${p.ukuran}]` : '';
                selectProduct.innerHTML += `<option value="${p.id}">${(p.nama_barang || '').toUpperCase()}${sizeInfo} [STOK: ${p.stok}]</option>`;
            });
        } else {
            // sukses tapi kosong
            console.log("Products loaded: empty array");
            allProducts = [];
            selectProduct.innerHTML = '<option value="">>> PRODUK KOSONG</option>';
        }
    } catch (e) {
        console.error('Exception saat memuat products:', e);
        selectProduct.innerHTML = `<option value="">>> GAGAL MEMUAT PRODUK (NETWORK): ${String(e?.message || e).slice(0, 80)}</option>`;
        allProducts = [];
    }

    // Update bookkeeping tetap jalan
    try {
        await updateLedgerBookkeeping();
    } catch (e) {}

    // Ambil No Telepon Member
    try {
        const { data: mems, error: memErr } = await supabaseClient
            .from('members')
            .select('*')
            .order('nama');

        if (memErr) {
            console.error('Gagal memuat members:', memErr);
            selectMember.innerHTML = '<option value="">>> GAGAL MEMUAT MEMBER</option>';
        } else if (mems && mems.length > 0) {
            selectMember.innerHTML = '<option value="">-- PILIH NO TELEPON MEMBER --</option>';
            mems.forEach(m => {
                selectMember.innerHTML += `<option value="${m.telepon}">${m.telepon} [${(m.nama || '').toUpperCase()}]</option>`;
            });
        } else {
            selectMember.innerHTML = '<option value="">>> MEMBER KOSONG</option>';
        }
    } catch (e) {
        console.error('Exception saat memuat members:', e);
        selectMember.innerHTML = `<option value="">>> GAGAL MEMUAT MEMBER (${String(e?.message || e).slice(0, 60)})</option>`;
    }
}



// 2. Tampilkan/Sembunyikan Pilihan No Telepon Tergantung Radio Button yang Dipilih
function handleTypeChange() {
    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    if (tipePembeli === 'Member') {
        if (boxMemberSelect) boxMemberSelect.classList.remove('hidden');
        if (selectMember) selectMember.setAttribute('required', 'true');
    } else {
        if (boxMemberSelect) boxMemberSelect.classList.add('hidden');
        if (selectMember) {
            selectMember.removeAttribute('required');
            selectMember.value = "";
        }
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
    const hargaDefault = tipePembeli === 'Member' ? selectedProduct.harga_member : selectedProduct.harga_jual;

    let hargaOverride = null;
    if (hargaOverrideEl) {
        const raw = String(hargaOverrideEl.value || '').trim();
        const n = raw === '' ? null : Number(raw);
        if (Number.isFinite(n) && n >= 0) hargaOverride = n;
    }

    const hargaSatuan = (hargaOverride != null ? hargaOverride : hargaDefault);
    const jumlah = parseInt(inputJumlah.value) || 0;
    const total = hargaSatuan * jumlah;


    previewHargaSatuan.innerText = 'Rp ' + Number(hargaSatuan).toLocaleString('id-ID');
    previewTotal.innerText = 'Rp ' + total.toLocaleString('id-ID');

    let sectorLabel = `<span class="text-zinc-400 font-bold">[AKSESORIS]</span>`;
    if (selectedProduct.kategori === 'Skateboard') sectorLabel = `<span class="text-red-500 font-bold">[PAPAN_SKATE] 🛹</span>`;
    else if (selectedProduct.kategori === 'Perlengkapan') sectorLabel = `<span class="text-orange-400 font-bold">[SPAREPART_GEAR] 🛠️</span>`;
    else if (selectedProduct.kategori === 'Apparel') sectorLabel = `<span class="text-zinc-400 font-bold">[APPAREL_BAJU] 👕</span>`;

    const hargaOverrideBadge = (hargaOverride != null)
        ? `<div><span class="text-red-700 block text-[9px] uppercase">// HARGA_OVERRIDE</span> <b class="text-yellow-400">Rp ${Number(hargaSatuan).toLocaleString('id-ID')}</b></div>`
        : '';

    productDetail.innerHTML = `
        <div class="space-y-3 border border-red-950 p-4 bg-black/90 text-[11px]">
            <div><span class="text-red-700 block text-[9px] uppercase">// KODE_BARANG</span> <b class="text-white tracking-wide text-xs uppercase">${selectedProduct.nama_barang}</b></div>
            <div><span class="text-red-700 block text-[9px] uppercase">// SEKTOR_SISTEM</span> ${sectorLabel}</div>
            ${selectedProduct.ukuran ? `<div><span class="text-red-700 block text-[9px] uppercase">// UKURAN</span> <b class="text-yellow-400">${selectedProduct.ukuran}</b></div>` : ''}
            ${hargaOverrideBadge}
            <div><span class="text-red-700 block text-[9px] uppercase">// CADANGAN_AMUNISI</span> <b class="${selectedProduct.stok <= 5 ? 'text-red-600 animate-pulse font-extrabold' : 'text-slate-300'}">${selectedProduct.stok} UNIT TERSISA</b></div>
        </div>
    `;
}

// Function to generate invoice number
async function generateInvoiceNumber() {
    try {
        const { data: existingPayments } = await supabaseClient
            .from('payments')
            .select('invoice_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNum = 1;
        if (existingPayments && existingPayments.length > 0) {
            const lastInvoice = existingPayments[0].invoice_number;
            const lastNum = parseInt(lastInvoice.replace('INV-', ''));
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        return 'INV-' + String(nextNum).padStart(4, '0');
    } catch (err) {
        console.warn('Failed to generate invoice number, using timestamp:', err);
        return 'INV-' + Date.now().toString().slice(-4);
    }
}

// Function to add partial payment to invoice
async function addPartialPayment(invoiceId, paymentAmount) {
    try {
        const { data: invoice } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (!invoice) {
            alert('Invoice not found');
            return false;
        }

        if (invoice.status === 'cancelled') {
            alert('Cannot add payment to cancelled invoice');
            return false;
        }

        const newPaidAmount = invoice.paid_amount + paymentAmount;
        const newRemainingAmount = invoice.remaining_amount - paymentAmount;
        let newStatus = invoice.status;

        if (newRemainingAmount <= 0) {
            newStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'partial';
        }

        const { error } = await supabaseClient
            .from('payments')
            .update({
                paid_amount: newPaidAmount,
                remaining_amount: Math.max(0, newRemainingAmount),
                status: newStatus,
                confirmed_at: newStatus === 'paid' ? new Date().toISOString() : null
            })
            .eq('id', invoiceId);

        if (error) {
            alert('Failed to add payment: ' + error.message);
            return false;
        }

        alert('Payment added successfully');
        return true;
    } catch (err) {
        alert('Error adding payment: ' + err.message);
        return false;
    }
}

// Function to cancel invoice and restore stock
async function cancelInvoice(invoiceId) {
    try {
        const { data: invoice } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (!invoice) {
            alert('Invoice not found');
            return false;
        }

        if (invoice.status === 'cancelled') {
            alert('Invoice already cancelled');
            return false;
        }

        // Find related sales_history records
        const { data: salesHistory } = await supabaseClient
            .from('sales_history')
            .select('*')
            .eq('payment_id', invoiceId);

        if (salesHistory && salesHistory.length > 0) {
            // Restore stock for each sales record
            for (const sale of salesHistory) {
                const { data: product } = await supabaseClient
                    .from('products')
                    .select('stok')
                    .eq('id', sale.product_id)
                    .single();

                if (product) {
                    const newStock = product.stok + sale.jumlah;
                    await supabaseClient
                        .from('products')
                        .update({ stok: newStock })
                        .eq('id', sale.product_id);
                }
            }
        }

        // Update invoice status to cancelled
        const { error } = await supabaseClient
            .from('payments')
            .update({ status: 'cancelled' })
            .eq('id', invoiceId);

        if (error) {
            alert('Failed to cancel invoice: ' + error.message);
            return false;
        }

        alert('Invoice cancelled and stock restored');
        return true;
    } catch (err) {
        alert('Error cancelling invoice: ' + err.message);
        return false;
    }
}

selectProduct.addEventListener('change', updatePricePreview);
inputJumlah.addEventListener('input', updatePricePreview);
document.getElementById('typeUmum').addEventListener('change', handleTypeChange);
document.getElementById('typeMember').addEventListener('change', handleTypeChange);
document.getElementById('btnAddToCart').addEventListener('click', addToCart);

// Handle payment status changes
const paymentStatusRadios = document.querySelectorAll('input[name="payment_status"]');
const partialPaymentSection = document.getElementById('partialPaymentSection');
const amountPaidInput = document.getElementById('amountPaid');
const partialTotalEl = document.getElementById('partialTotal');
const partialPaidEl = document.getElementById('partialPaid');
const partialRemainingEl = document.getElementById('partialRemaining');

paymentStatusRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'partial') {
            partialPaymentSection.classList.remove('hidden');
            updatePartialPaymentCalculation();
        } else {
            partialPaymentSection.classList.add('hidden');
        }
    });
});

amountPaidInput.addEventListener('input', updatePartialPaymentCalculation);

function updatePartialPaymentCalculation() {
    const totalHarga = cart.reduce((sum, item) => sum + item.totalHarga, 0);
    const amountPaid = parseFloat(amountPaidInput.value) || 0;

    partialTotalEl.innerText = 'Rp ' + totalHarga.toLocaleString('id-ID');
    partialPaidEl.innerText = 'Rp ' + amountPaid.toLocaleString('id-ID');
    partialRemainingEl.innerText = 'Rp ' + Math.max(0, totalHarga - amountPaid).toLocaleString('id-ID');
}

salesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if cart is empty
    if (cart.length === 0) {
        return alert('[ALARM] GAGAL: KERANJANG KOSONG. Tambahkan barang terlebih dahulu.');
    }

    // Read customer type from cart section
    const tipePembeliEl = document.querySelector('input[name="tipe_pembeli"]:checked');
    const tipePembeli = tipePembeliEl ? tipePembeliEl.value : 'Umum';
    const nomorTelpInfo = selectMember ? selectMember.value : ''; 
    
    // Format struktur orang untuk disimpan ke sales_history (misal: "Member (08123456)")
    const identitasPembeli = tipePembeli === 'Member' ? `Member (${nomorTelpInfo})` : 'Umum';

    // Calculate total from cart
    const totalHarga = cart.reduce((sum, item) => sum + item.totalHarga, 0);

    // Metode Pembayaran (Cash / Transfer = Sudah Bayar) | (Belum Bayar = Unpaid)
    const metodePembayaran = document.querySelector('input[name="metode_pembayaran"]:checked')?.value || 'Cash';

    // Payment Status (Paid Full, Partial Payment, Pay Later)
    const paymentStatus = document.querySelector('input[name="payment_status"]:checked')?.value || 'paid_full';

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate paid_amount and remaining_amount based on payment status
    let paidAmount = 0;
    let remainingAmount = totalHarga;
    let invoiceStatus = 'pending';

    if (paymentStatus === 'paid_full') {
        paidAmount = totalHarga;
        remainingAmount = 0;
        invoiceStatus = 'paid';
    } else if (paymentStatus === 'partial') {
        const amountPaid = parseFloat(document.getElementById('amountPaid').value) || 0;
        paidAmount = Math.min(amountPaid, totalHarga);
        remainingAmount = totalHarga - paidAmount;
        invoiceStatus = paidAmount > 0 ? 'partial' : 'pending';
    } else if (paymentStatus === 'pay_later') {
        paidAmount = 0;
        remainingAmount = totalHarga;
        invoiceStatus = 'pending';
    }

    // Create product summary string for payment record
    const productSummary = cart.map(item => {
        const sizeInfo = item.ukuran ? ` [${item.ukuran}]` : '';
        return `${item.nama_barang}${sizeInfo} x${item.jumlah}`;
    }).join(', ');

    // Create invoice record with calculated payment status
    const paymentRecord = {
        id: 'pay_' + Date.now(),
        buyer: identitasPembeli,
        product: productSummary,
        ukuran: null, // Multiple sizes, stored in sales_history
        jumlah: cart.reduce((sum, item) => sum + item.jumlah, 0),
        total_harga: totalHarga,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        method: metodePembayaran,
        status: invoiceStatus,
        invoice_number: invoiceNumber,
        confirmed_at: invoiceStatus === 'paid' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
    };

    // Save payment to Supabase
    console.log('=== PAYMENT INSERT START ===');
    console.log('Payment record to insert:', paymentRecord);

    try {
        const { data: paymentData, error: payErr } = await supabaseClient.from('payments').insert([{
            id: paymentRecord.id,
            buyer: paymentRecord.buyer,
            product: paymentRecord.product,
            ukuran: paymentRecord.ukuran,
            jumlah: paymentRecord.jumlah,
            total_harga: paymentRecord.total_harga,
            paid_amount: paymentRecord.paid_amount,
            remaining_amount: paymentRecord.remaining_amount,
            method: paymentRecord.method,
            status: paymentRecord.status,
            invoice_number: paymentRecord.invoice_number,
            confirmed_at: paymentRecord.confirmed_at,
            created_at: paymentRecord.created_at
        }]).select();

        if (payErr) {
            console.error('Supabase insert payments failed:', payErr.message);
            alert('Gagal menyimpan pembayaran: ' + payErr.message);
            return;
        }
    } catch (err) {
        console.error('Supabase error:', err);
        alert('Gagal menyimpan pembayaran: ' + err.message);
        return;
    }

    // Process each cart item: cut stock and save to sales_history
    let stockUpdateErrors = [];
    let historyErrors = [];
    let totalItemsSold = 0;

    for (const cartItem of cart) {
        // 1. Potong Stok
        const product = allProducts.find(p => p.id === cartItem.productId);
        if (!product) {
            stockUpdateErrors.push(`Produk tidak ditemukan: ${cartItem.nama_barang}`);
            continue;
        }

        if (product.stok < cartItem.jumlah) {
            stockUpdateErrors.push(`Stok tidak cukup untuk ${cartItem.nama_barang}. Sisa: ${product.stok}, Butuh: ${cartItem.jumlah}`);
            continue;
        }

        const sisaStokBaru = product.stok - cartItem.jumlah;
        const { error: updateError } = await supabaseClient.from('products').update({ stok: sisaStokBaru }).eq('id', cartItem.productId);
        
        if (updateError) {
            stockUpdateErrors.push(`Gagal potong stok ${cartItem.nama_barang}: ${updateError.message}`);
            continue;
        }

        // 2. Simpan Riwayat
        const { error: historyError } = await supabaseClient.from('sales_history').insert([{
            payment_id: paymentRecord.id,
            product_id: cartItem.productId,
            nama_barang: cartItem.nama_barang,
            kategori: cartItem.kategori,
            ukuran: cartItem.ukuran || null,
            jumlah: cartItem.jumlah,
            total_harga: cartItem.totalHarga,
            tipe_pembeli: identitasPembeli
        }]);

        if (historyError) {
            historyErrors.push(`Gagal simpan riwayat ${cartItem.nama_barang}: ${historyError.message}`);
        } else {
            totalItemsSold += cartItem.jumlah;
        }
    }

    // Check for errors
    if (stockUpdateErrors.length > 0 || historyErrors.length > 0) {
        const errorMsg = [...stockUpdateErrors, ...historyErrors].join('\n');
        console.error('Errors during transaction:', errorMsg);
        alert('⚠️ TRANSAKSI SEBAGIAN BERHASIL\n\nError:\n' + errorMsg);
    } else {
        // Animasi inventory stok: keluar (-totalItemsSold)
        try {
            window.InventoryManager?.applyStockDelta?.(-totalItemsSold);
        } catch (e) {}

        // Broadcast agar halaman lain juga animasi
        try {
            localStorage.setItem('inventory_stock_delta', JSON.stringify({ delta: -totalItemsSold, t: Date.now() }));
        } catch (e) {}

        // Animasi inventory pembayaran (visual)
        try {
            if (invoiceStatus === 'paid') {
                window.InventoryManager?.applyPaymentDelta?.();
            }
        } catch (e) {}

        // Broadcast pembayaran juga (dashboard/HP)
        try {
            localStorage.setItem('inventory_payment_delta', JSON.stringify({ t: Date.now() }));
        } catch (e) {}

        alert('🎉 EKSEKUSI BERHASIL // Transaksi tersimpan.');
        
        // Print receipt after successful payment
        if (window.ReceiptPrinter && invoiceStatus === 'paid') {
            const companyInfo = {
                name: 'SPECTRE SKATEBOARD',
                address: 'Jakarta, Indonesia',
                phone: '+62 812-3456-7890',
                footer: 'Terima kasih atas kunjungan Anda!'
            };
            window.ReceiptPrinter.showPrintDialog(paymentRecord, cart, companyInfo);
        }
    }
    
    // Reset form and cart
    salesForm.reset();
    cart = [];
    updateCartDisplay();
    boxMemberSelect.classList.add('hidden');
    await initTerminalData();
    updatePricePreview();
    await updateLedgerBookkeeping();
    showSaleSuccess('TRANSAKSI TERJUAL // Buku kas menjadi lebih hidup.');
});


document.addEventListener('DOMContentLoaded', initTerminalData);


