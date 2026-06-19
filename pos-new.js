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
    selectVariant: null,
    inputJumlah: null,
    hargaOverride: null,
    btnAddToCart: null,
    btnScanTerjual: null,
    boxVariantSelect: null,
    
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
    DOM.selectVariant = document.getElementById('selectVariant');
    DOM.inputJumlah = document.getElementById('inputJumlah');
    DOM.hargaOverride = document.getElementById('harga_override');
    DOM.btnAddToCart = document.getElementById('btnAddToCart');
    DOM.btnScanTerjual = document.getElementById('btnScanTerjual');
    DOM.boxVariantSelect = document.getElementById('boxVariantSelect');
    
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
        // Remove is_active filter to ensure products load even if column doesn't exist
        const { data, error } = await supabaseClient
            .from('products')
            .select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,harga_member,kategori')
            .order('nama_barang', { ascending: true });
        
        console.log('Products query result:', { data, error });
        console.log('Number of products loaded:', data?.length || 0);
        
        if (error) throw error;
        
        POS.products = data || [];
        
        // Log first product to check price fields
        if (POS.products.length > 0) {
            console.log('First product data:', POS.products[0]);
            console.log('First product harga_jual:', POS.products[0].harga_jual);
            console.log('First product harga_member:', POS.products[0].harga_member);
            console.log('First product harga_modal:', POS.products[0].harga_modal);
        }
        
        // Group products by nama_barang for variant selection
        // Use composite key to avoid collisions with same name but different categories
        POS.groupedProducts = {};
        POS.productDisplayNames = {}; // Maps composite key to display name
        
        POS.products.forEach(product => {
            // Create composite key: nama_barang + kategori
            const compositeKey = `${product.nama_barang}|||${product.kategori || ''}`;
            const displayName = product.nama_barang; // Display only nama_barang to user
            
            if (!POS.groupedProducts[compositeKey]) {
                POS.groupedProducts[compositeKey] = [];
                POS.productDisplayNames[compositeKey] = displayName;
            }
            POS.groupedProducts[compositeKey].push(product);
        });
        
        populateProductDropdown();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products');
    }
}

// Populate product dropdown with unique product names
function populateProductDropdown() {
    if (!DOM.selectProduct) return;
    
    DOM.selectProduct.innerHTML = '<option value="">-- Select --</option>';
    
    // Show unique product names using composite keys
    Object.keys(POS.groupedProducts).forEach(compositeKey => {
        const displayName = POS.productDisplayNames[compositeKey] || compositeKey;
        const option = document.createElement('option');
        option.value = compositeKey; // Store composite key as value
        option.textContent = displayName; // Display only nama_barang to user
        DOM.selectProduct.appendChild(option);
    });
}

// Handle product selection - show variant dropdown
function handleProductSelection() {
    const compositeKey = DOM.selectProduct?.value;
    if (!compositeKey) {
        DOM.boxVariantSelect?.classList.add('hidden');
        POS.selectedVariant = null;
        return;
    }
    
    const variants = POS.groupedProducts[compositeKey] || [];
    
    if (variants.length === 0) {
        // No variants found - this shouldn't happen but handle gracefully
        DOM.boxVariantSelect?.classList.add('hidden');
        POS.selectedVariant = null;
        alert('No variants found for this product');
        return;
    }
    
    if (variants.length > 1) {
        // Multiple variants - show dropdown
        DOM.boxVariantSelect?.classList.remove('hidden');
        DOM.selectVariant.innerHTML = '<option value="">-- Select Variant --</option>';
        
        variants.forEach(variant => {
            const option = document.createElement('option');
            option.value = variant.id;
            // Handle null/empty ukuran display
            const displayUkuran = variant.ukuran || 'Standard';
            option.textContent = `${displayUkuran} (${variant.stok || 0} available)`;
            DOM.selectVariant.appendChild(option);
        });
        
        POS.selectedVariant = null;
    } else if (variants.length === 1) {
        // Single variant - auto-select
        DOM.boxVariantSelect?.classList.add('hidden');
        POS.selectedVariant = variants[0];
    }
}

// Handle variant selection
function handleVariantSelection() {
    const variantId = DOM.selectVariant?.value;
    if (!variantId) {
        POS.selectedVariant = null;
        return;
    }
    
    // Get currently selected composite key for efficient lookup
    const compositeKey = DOM.selectProduct?.value;
    if (!compositeKey) {
        POS.selectedVariant = null;
        return;
    }
    
    // Find variant in the selected product's variants only (more efficient)
    const variants = POS.groupedProducts[compositeKey] || [];
    const variant = variants.find(v => v.id == variantId);
    
    if (variant) {
        POS.selectedVariant = variant;
    } else {
        // Fallback to search all products if not found (shouldn't happen)
        for (const key in POS.groupedProducts) {
            const found = POS.groupedProducts[key].find(v => v.id == variantId);
            if (found) {
                POS.selectedVariant = found;
                break;
            }
        }
    }
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
    const compositeKey = DOM.selectProduct?.value;
    if (!compositeKey) {
        alert('Please select a product');
        return;
    }
    
    const variantId = DOM.selectVariant?.value;
    const variant = POS.selectedVariant;
    
    console.log('addToCart - variant data:', variant);
    console.log('addToCart - variant.harga_jual:', variant?.harga_jual);
    console.log('addToCart - variant.harga_member:', variant?.harga_member);
    console.log('addToCart - variant.harga_modal:', variant?.harga_modal);
    
    if (!variant) {
        alert('Please select a variant');
        return;
    }
    
    const qty = parseInt(DOM.inputJumlah?.value) || 1;
    if (qty <= 0) {
        alert('Quantity must be greater than 0');
        return;
    }
    
    const availableStock = variant.stok || 0;
    if (availableStock < qty) {
        const displayUkuran = variant.ukuran || 'Standard';
        alert(`Insufficient stock for variant ${displayUkuran}. Available: ${availableStock}`);
        return;
    }
    
    // Calculate price based on customer type
    let unitPrice = variant.harga_jual;
    console.log('addToCart - initial unitPrice (harga_jual):', unitPrice);
    
    if (POS.customerType === 'Member' && POS.selectedMember) {
        const discount = POS.selectedMember.diskon_persen || 0;
        unitPrice = variant.harga_jual * (1 - discount / 100);
        console.log('addToCart - unitPrice after member discount:', unitPrice);
    }
    
    // Apply override if provided
    const overridePrice = DOM.hargaOverride?.value ? parseFloat(DOM.hargaOverride.value) : null;
    if (overridePrice !== null && overridePrice >= 0) {
        unitPrice = overridePrice;
        console.log('addToCart - unitPrice after override:', unitPrice);
    }
    
    console.log('addToCart - final unitPrice:', unitPrice);
    console.log('addToCart - quantity:', qty);
    console.log('addToCart - totalPrice:', unitPrice * qty);
    
    const cartItem = {
        id: Date.now(),
        productId: variant.id,
        nama_barang: variant.nama_barang,
        ukuran: variant.ukuran || null,
        kategori: variant.kategori,
        jumlah: qty,
        unitPrice: unitPrice,
        totalPrice: unitPrice * qty,
        hargaModal: variant.harga_modal
    };
    
    console.log('addToCart - cartItem:', cartItem);
    
    POS.cart.push(cartItem);
    updateCartDisplay();
    clearForm();
}

// Remove from Cart
function removeFromCart(cartItemId) {
    POS.cart = POS.cart.filter(item => item.id !== cartItemId);
    updateCartDisplay();
}

// Utility function to escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    
    // Use DOM API instead of innerHTML for security
    DOM.cartItems.innerHTML = '';
    
    POS.cart.forEach(item => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'cart-item-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'cart-item-name';
        nameDiv.textContent = item.nama_barang.toUpperCase();
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'cart-item-details';
        
        const qtySpan = document.createElement('span');
        qtySpan.textContent = 'Qty: ' + item.jumlah;
        detailsDiv.appendChild(qtySpan);
        
        if (item.ukuran) {
            const variantSpan = document.createElement('span');
            variantSpan.textContent = 'Variant: ' + item.ukuran;
            detailsDiv.appendChild(variantSpan);
        }
        
        const unitSpan = document.createElement('span');
        unitSpan.textContent = 'Unit: Rp ' + item.unitPrice.toLocaleString('id-ID');
        detailsDiv.appendChild(unitSpan);
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(detailsDiv);
        
        const priceDiv = document.createElement('div');
        priceDiv.className = 'cart-item-price';
        priceDiv.textContent = 'Rp ' + item.totalPrice.toLocaleString('id-ID');
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'cart-item-remove';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeFromCart(item.id);
        
        cartItemDiv.appendChild(infoDiv);
        cartItemDiv.appendChild(priceDiv);
        cartItemDiv.appendChild(removeBtn);
        
        DOM.cartItems.appendChild(cartItemDiv);
    });
    
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
    if (DOM.selectVariant) DOM.selectVariant.value = '';
    if (DOM.inputJumlah) DOM.inputJumlah.value = '1';
    if (DOM.hargaOverride) DOM.hargaOverride.value = '';
    if (DOM.boxVariantSelect) DOM.boxVariantSelect.classList.add('hidden');
    POS.selectedVariant = null;
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
let isProcessingSale = false; // Flag to prevent double-submit

async function processSale(e) {
    e.preventDefault();
    
    // Prevent double-submit
    if (isProcessingSale) {
        alert('Sale is already being processed. Please wait...');
        return;
    }
    
    if (POS.cart.length === 0) {
        alert('Cart is empty');
        return;
    }
    
    // Set processing flag and disable button
    isProcessingSale = true;
    const btnProses = DOM.btnProses || document.getElementById('btnProses');
    if (btnProses) {
        btnProses.disabled = true;
        btnProses.textContent = 'Processing...';
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
        
        // Validate payment amount
        if (paidAmount < 0) {
            alert('Payment amount cannot be negative');
            isProcessingSale = false;
            const btnProses = DOM.btnProses || document.getElementById('btnProses');
            if (btnProses) {
                btnProses.disabled = false;
                btnProses.textContent = 'Process Sale';
            }
            return;
        }
        
        if (paidAmount > total) {
            alert(`Payment amount (Rp ${paidAmount.toLocaleString('id-ID')}) cannot exceed total (Rp ${total.toLocaleString('id-ID')})`);
            isProcessingSale = false;
            const btnProses = DOM.btnProses || document.getElementById('btnProses');
            if (btnProses) {
                btnProses.disabled = false;
                btnProses.textContent = 'Process Sale';
            }
            return;
        }
        
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
        let processedItems = []; // Track successfully processed items for rollback
        
        try {
            for (const item of POS.cart) {
                // Use atomic stock decrement to prevent race conditions
                // This is a single atomic operation at database level
                const { data: updatedProduct, error: updateError } = await supabaseClient
                    .from('products')
                    .update({ stok: supabaseClient.raw('stok - ?', [item.jumlah]) })
                    .eq('id', item.productId)
                    .gte('stok', item.jumlah)
                    .select('stok')
                    .single();
                
                if (updateError || !updatedProduct) {
                    stockUpdateErrors.push(`Failed to update stock for ${item.nama_barang}: ${updateError?.message || 'Insufficient stock'}`);
                    continue;
                }
                
                // Save to sales_history (matching old POS structure)
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
                        harga_modal: item.hargaModal,
                        profit: item.totalPrice - (item.hargaModal * item.jumlah),
                        tipe_pembeli: buyerIdentity
                    }]);
                
                if (historyError) {
                    historyErrors.push(`Failed to save history for ${item.nama_barang}: ${historyError.message}`);
                    // Rollback stock deduction
                    await supabaseClient
                        .from('products')
                        .update({ stok: supabaseClient.raw('stok + ?', [item.jumlah]) })
                        .eq('id', item.productId);
                    continue;
                }
                
                processedItems.push({ item, newStock: updatedProduct.stok });
            }
            
            // Check for critical errors - rollback entire transaction if any errors occurred
            if (stockUpdateErrors.length > 0 || historyErrors.length > 0) {
                const errorMsg = [...stockUpdateErrors, ...historyErrors].join('\n');
                console.error('Transaction failed with errors, rolling back:', errorMsg);
                
                // Rollback all stock deductions
                for (const processed of processedItems) {
                    try {
                        await supabaseClient
                            .from('products')
                            .update({ stok: supabaseClient.raw('stok + ?', [processed.item.jumlah]) })
                            .eq('id', processed.item.productId);
                    } catch (rollbackError) {
                        console.error('Failed to rollback stock for item:', processed.item.nama_barang, rollbackError);
                    }
                }
                
                // Delete payment record since sale failed
                try {
                    await supabaseClient.from('payments').delete().eq('id', paymentRecord.id);
                } catch (deleteError) {
                    console.error('Failed to delete payment record:', deleteError);
                }
                
                alert('Transaction failed and rolled back:\n' + errorMsg + '\n\nPlease try again.');
                throw new Error('Transaction failed with errors');
            }
            
        } catch (error) {
            // Rollback all stock deductions on critical error
            console.error('Critical error during sale processing, rolling back stock:', error);
            for (const processed of processedItems) {
                try {
                    await supabaseClient
                        .from('products')
                        .update({ stok: processed.originalStock })
                        .eq('id', processed.item.productId);
                } catch (rollbackError) {
                    console.error('Failed to rollback stock for item:', processed.item.nama_barang, rollbackError);
                }
            }
            
            // Delete payment record since sale failed
            try {
                await supabaseClient.from('payments').delete().eq('id', paymentRecord.id);
            } catch (deleteError) {
                console.error('Failed to delete payment record:', deleteError);
            }
            
            throw error; // Re-throw to be caught by outer try-catch
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
    } finally {
        // Reset processing flag and re-enable button
        isProcessingSale = false;
        const btnProses = DOM.btnProses || document.getElementById('btnProses');
        if (btnProses) {
            btnProses.disabled = false;
            btnProses.textContent = 'Process Sale';
        }
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
    
    // Variant Selection
    DOM.selectVariant?.addEventListener('change', handleVariantSelection);
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
