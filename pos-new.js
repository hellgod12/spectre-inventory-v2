// SPECTRE POS - Clean Architecture
// Simple, dependency-free POS system

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[pos-new.js] supabaseClient not initialized. Ensure auth.js is loaded before pos-new.js');
}

// State
const POS = {
    products: [],
    cart: [],
    customerType: 'Umum',
    selectedMember: null,
    paymentStatus: 'paid_full',
    paymentMethod: 'Cash',
    amountPaid: 0
};

// DOM Elements
const DOM = {
    // Product Selection
    selectProduct: null,
    selectUkuran: null,
    inputJumlah: null,
    hargaOverride: null,
    btnAddToCart: null,
    btnScanTerjual: null,
    boxUkuranSelect: null,
    
    // Shopping Cart
    cartItems: null,
    cartCount: null,
    cartTotal: null,
    
    // Customer Type
    typeUmum: null,
    typeMember: null,
    boxMemberSelect: null,
    selectMember: null,
    
    // Payment
    payFull: null,
    payPartial: null,
    payLater: null,
    partialPaymentSection: null,
    amountPaidCheckout: null,
    payCash: null,
    payTransfer: null,
    
    // Process Sale
    btnProses: null,
    salesForm: null
};

// Initialize DOM references
function initDOM() {
    DOM.selectProduct = document.getElementById('selectProduct');
    DOM.selectUkuran = document.getElementById('selectUkuran');
    DOM.inputJumlah = document.getElementById('inputJumlah');
    DOM.hargaOverride = document.getElementById('harga_override');
    DOM.btnAddToCart = document.getElementById('btnAddToCart');
    DOM.btnScanTerjual = document.getElementById('btnScanTerjual');
    DOM.boxUkuranSelect = document.getElementById('boxUkuranSelect');
    
    DOM.cartItems = document.getElementById('cartItems');
    DOM.cartCount = document.getElementById('cartCount');
    DOM.cartTotal = document.getElementById('cartTotal');
    
    DOM.typeUmum = document.getElementById('typeUmum');
    DOM.typeMember = document.getElementById('typeMember');
    DOM.boxMemberSelect = document.getElementById('boxMemberSelect');
    DOM.selectMember = document.getElementById('selectMember');
    
    DOM.payFull = document.getElementById('payFull');
    DOM.payPartial = document.getElementById('payPartial');
    DOM.payLater = document.getElementById('payLater');
    DOM.partialPaymentSection = document.getElementById('partialPaymentSectionCheckout');
    DOM.amountPaidCheckout = document.getElementById('amountPaidCheckout');
    DOM.payCash = document.getElementById('payCash');
    DOM.payTransfer = document.getElementById('payTransfer');
    
    DOM.btnProses = document.getElementById('btnProses');
    DOM.salesForm = document.getElementById('salesForm');
}

// Load products from Supabase
async function loadProducts() {
    console.log('supabaseClient object:', supabaseClient);
    console.log('typeof supabaseClient:', typeof supabaseClient);
    console.log('supabaseClient.from:', supabaseClient?.from);
    
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,harga_member,kategori')
            .eq('is_active', true)
            .order('nama_barang', { ascending: true });
        
        if (error) throw error;
        
        POS.products = data || [];
        populateProductDropdown();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products');
    }
}

// Populate product dropdown
function populateProductDropdown() {
    if (!DOM.selectProduct) return;
    
    DOM.selectProduct.innerHTML = '<option value="">-- Select --</option>';
    
    POS.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.nama_barang} - ${product.kategori}`;
        DOM.selectProduct.appendChild(option);
    });
}

// Load members from Supabase
async function loadMembers() {
    try {
        const { data, error } = await supabaseClient
            .from('members')
            .select('*')
            .order('nama', { ascending: true });
        
        if (error) throw error;
        
        if (!DOM.selectMember) return;
        
        DOM.selectMember.innerHTML = '<option value="">-- Select Member --</option>';
        
        data.forEach(member => {
            const option = document.createElement('option');
            option.value = member.telepon;
            option.textContent = `${member.telepon} [${(member.nama || '').toUpperCase()}] - ${member.diskon_persen || 0}% OFF`;
            option.dataset.diskon = member.diskon_persen || 0;
            DOM.selectMember.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Add to Cart
function addToCart() {
    const productId = DOM.selectProduct?.value;
    if (!productId) {
        alert('Please select a product');
        return;
    }
    
    const product = POS.products.find(p => p.id == productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const qty = parseInt(DOM.inputJumlah?.value) || 1;
    if (qty <= 0) {
        alert('Quantity must be greater than 0');
        return;
    }
    
    if (product.stok < qty) {
        alert(`Insufficient stock. Available: ${product.stok}`);
        return;
    }
    
    // Calculate price based on customer type
    let unitPrice = product.harga_jual;
    if (POS.customerType === 'Member' && POS.selectedMember) {
        const discount = POS.selectedMember.diskon_persen || 0;
        unitPrice = product.harga_jual * (1 - discount / 100);
    }
    
    // Apply override if provided
    const overridePrice = DOM.hargaOverride?.value ? parseFloat(DOM.hargaOverride.value) : null;
    if (overridePrice !== null && overridePrice >= 0) {
        unitPrice = overridePrice;
    }
    
    const cartItem = {
        id: Date.now(),
        productId: product.id,
        nama_barang: product.nama_barang,
        ukuran: product.ukuran || null,
        kategori: product.kategori,
        jumlah: qty,
        unitPrice: unitPrice,
        totalPrice: unitPrice * qty,
        hargaModal: product.harga_modal
    };
    
    POS.cart.push(cartItem);
    updateCartDisplay();
    clearForm();
}

// Remove from Cart
function removeFromCart(cartItemId) {
    POS.cart = POS.cart.filter(item => item.id !== cartItemId);
    updateCartDisplay();
}

// Update Cart Display
function updateCartDisplay() {
    if (!DOM.cartItems || !DOM.cartCount || !DOM.cartTotal) return;
    
    if (POS.cart.length === 0) {
        DOM.cartItems.innerHTML = '<p class="cart-placeholder">No items in cart</p>';
        DOM.cartCount.textContent = '0 items';
        DOM.cartTotal.textContent = 'Rp 0';
        return;
    }
    
    let html = '';
    POS.cart.forEach(item => {
        const sizeInfo = item.ukuran ? `<span>Size: ${item.ukuran}</span>` : '';
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nama_barang.toUpperCase()}</div>
                    <div class="cart-item-details">
                        <span>Qty: ${item.jumlah}</span>
                        ${sizeInfo}
                        <span>Unit: Rp ${item.unitPrice.toLocaleString('id-ID')}</span>
                    </div>
                </div>
                <div class="cart-item-price">Rp ${item.totalPrice.toLocaleString('id-ID')}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
    });
    
    DOM.cartItems.innerHTML = html;
    DOM.cartCount.textContent = `${POS.cart.length} item${POS.cart.length > 1 ? 's' : ''}`;
    
    const total = calculateTotal();
    DOM.cartTotal.textContent = 'Rp ' + total.toLocaleString('id-ID');
}

// Calculate Total
function calculateTotal() {
    return POS.cart.reduce((sum, item) => sum + item.totalPrice, 0);
}

// Clear Form
function clearForm() {
    if (DOM.selectProduct) DOM.selectProduct.value = '';
    if (DOM.inputJumlah) DOM.inputJumlah.value = '1';
    if (DOM.hargaOverride) DOM.hargaOverride.value = '';
    if (DOM.boxUkuranSelect) DOM.boxUkuranSelect.classList.add('hidden');
}

// Handle Customer Type Change
function handleCustomerTypeChange(type) {
    POS.customerType = type;
    
    if (type === 'Member') {
        DOM.boxMemberSelect?.classList.remove('hidden');
    } else {
        DOM.boxMemberSelect?.classList.add('hidden');
        POS.selectedMember = null;
    }
    
    // Recalculate cart prices
    recalculateCartPrices();
}

// Handle Member Selection
function handleMemberSelection() {
    const memberPhone = DOM.selectMember?.value;
    if (!memberPhone) {
        POS.selectedMember = null;
        return;
    }
    
    // Find member data
    const option = DOM.selectMember.querySelector(`option[value="${memberPhone}"]`);
    if (option) {
        POS.selectedMember = {
            telepon: memberPhone,
            diskon_persen: parseInt(option.dataset.diskon) || 0
        };
    }
    
    recalculateCartPrices();
}

// Recalculate Cart Prices
function recalculateCartPrices() {
    POS.cart.forEach(item => {
        const product = POS.products.find(p => p.id == item.productId);
        if (!product) return;
        
        let unitPrice = product.harga_jual;
        if (POS.customerType === 'Member' && POS.selectedMember) {
            const discount = POS.selectedMember.diskon_persen || 0;
            unitPrice = product.harga_jual * (1 - discount / 100);
        }
        
        item.unitPrice = unitPrice;
        item.totalPrice = unitPrice * item.jumlah;
    });
    
    updateCartDisplay();
}

// Handle Payment Status Change
function handlePaymentStatusChange(status) {
    POS.paymentStatus = status;
    
    if (status === 'partial') {
        DOM.partialPaymentSection?.classList.remove('hidden');
    } else {
        DOM.partialPaymentSection?.classList.add('hidden');
        POS.amountPaid = 0;
    }
}

// Handle Payment Method Change
function handlePaymentMethodChange(method) {
    POS.paymentMethod = method;
}

// Process Sale
async function processSale(e) {
    e.preventDefault();
    
    if (POS.cart.length === 0) {
        alert('Cart is empty');
        return;
    }
    
    const total = calculateTotal();
    
    // Calculate payment amounts
    let paidAmount = 0;
    let remainingAmount = total;
    let invoiceStatus = 'paid';
    
    if (POS.paymentStatus === 'paid_full') {
        paidAmount = total;
        remainingAmount = 0;
        invoiceStatus = 'paid';
    } else if (POS.paymentStatus === 'partial') {
        paidAmount = parseFloat(DOM.amountPaidCheckout?.value) || 0;
        remainingAmount = total - paidAmount;
        invoiceStatus = 'partial';
    } else if (POS.paymentStatus === 'pay_later') {
        paidAmount = 0;
        remainingAmount = total;
        invoiceStatus = 'pending';
    }
    
    // Generate invoice number
    const invoiceNumber = 'INV-' + Date.now();
    
    // Build buyer identity
    const buyerIdentity = POS.customerType === 'Member' && POS.selectedMember 
        ? POS.selectedMember.telepon 
        : POS.customerType;
    
    // Build product summary for payments table
    const productSummary = POS.cart.map(item => {
        const sizeInfo = item.ukuran ? ` (${item.ukuran})` : '';
        return `${item.nama_barang}${sizeInfo} x${item.jumlah}`;
    }).join(', ');
    
    // Create payment record (matching old POS structure)
    const paymentRecord = {
        id: 'pay_' + Date.now(),
        buyer: buyerIdentity,
        product: productSummary,
        ukuran: null,
        jumlah: POS.cart.reduce((sum, item) => sum + item.jumlah, 0),
        total_harga: total,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        method: POS.paymentMethod,
        status: invoiceStatus,
        invoice_number: invoiceNumber,
        confirmed_at: invoiceStatus === 'paid' ? new Date().toISOString() : null,
        created_at: new Date().toISOString()
    };
    
    try {
        // Insert payment record (matching old POS)
        const { data: paymentData, error: payErr } = await supabaseClient
            .from('payments')
            .insert([{
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
            }])
            .select();
        
        if (payErr) throw payErr;
        
        // Process each cart item: cut stock and save to sales_history
        let stockUpdateErrors = [];
        let historyErrors = [];
        
        for (const item of POS.cart) {
            // 1. Update stock
            const product = POS.products.find(p => p.id == item.productId);
            if (!product) {
                stockUpdateErrors.push(`Product not found: ${item.nama_barang}`);
                continue;
            }
            
            const newStock = product.stok - item.jumlah;
            const { error: updateError } = await supabaseClient
                .from('products')
                .update({ stok: newStock })
                .eq('id', product.id);
            
            if (updateError) {
                stockUpdateErrors.push(`Failed to update stock for ${item.nama_barang}: ${updateError.message}`);
                continue;
            }
            
            // 2. Save to sales_history (matching old POS structure)
            const { error: historyError } = await supabaseClient
                .from('sales_history')
                .insert([{
                    payment_id: paymentRecord.id,
                    product_id: item.productId,
                    nama_barang: item.nama_barang,
                    kategori: item.kategori,
                    ukuran: item.ukuran || null,
                    jumlah: item.jumlah,
                    total_harga: item.totalPrice,
                    tipe_pembeli: buyerIdentity
                }]);
            
            if (historyError) {
                historyErrors.push(`Failed to save history for ${item.nama_barang}: ${historyError.message}`);
            }
        }
        
        // Check for errors
        if (stockUpdateErrors.length > 0 || historyErrors.length > 0) {
            const errorMsg = [...stockUpdateErrors, ...historyErrors].join('\n');
            alert('Sale completed with errors:\n' + errorMsg);
        }
        
        // Clear cart
        POS.cart = [];
        updateCartDisplay();
        
        alert('Sale processed successfully!');
        
        // Reload products to get updated stock
        await loadProducts();
        
    } catch (error) {
        console.error('Error processing sale:', error);
        alert('Failed to process sale: ' + error.message);
    }
}

// Initialize Event Listeners
function initEventListeners() {
    // Add to Cart
    DOM.btnAddToCart?.addEventListener('click', addToCart);
    
    // Customer Type
    DOM.typeUmum?.addEventListener('change', () => handleCustomerTypeChange('Umum'));
    DOM.typeMember?.addEventListener('change', () => handleCustomerTypeChange('Member'));
    
    // Member Selection
    DOM.selectMember?.addEventListener('change', handleMemberSelection);
    
    // Payment Status
    DOM.payFull?.addEventListener('change', () => handlePaymentStatusChange('paid_full'));
    DOM.payPartial?.addEventListener('change', () => handlePaymentStatusChange('partial'));
    DOM.payLater?.addEventListener('change', () => handlePaymentStatusChange('pay_later'));
    
    // Payment Method
    DOM.payCash?.addEventListener('change', () => handlePaymentMethodChange('Cash'));
    DOM.payTransfer?.addEventListener('change', () => handlePaymentMethodChange('Transfer'));
    
    // Process Sale
    DOM.salesForm?.addEventListener('submit', processSale);
    
    // Product Selection
    DOM.selectProduct?.addEventListener('change', handleProductSelection);
}

// Handle Product Selection
function handleProductSelection() {
    const productId = DOM.selectProduct?.value;
    if (!productId) {
        DOM.boxUkuranSelect?.classList.add('hidden');
        return;
    }
    
    const product = POS.products.find(p => p.id == productId);
    if (product && product.ukuran) {
        DOM.boxUkuranSelect?.classList.remove('hidden');
    } else {
        DOM.boxUkuranSelect?.classList.add('hidden');
    }
}

// Initialize
async function init() {
    initDOM();
    await loadProducts();
    await loadMembers();
    initEventListeners();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
