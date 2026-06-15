// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js

const productForm = document.getElementById('productForm');

// Activity Logging Function
async function logActivity(action, entityType, entityId, details = null) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        await supabaseClient.rpc('log_activity', {
            p_user_id: user.id,
            p_action: action,
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_details: details
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error, activity logging should not block main functionality
    }
}
const btnSimpan = document.getElementById('btnSimpan');
const stockProgressFill = document.getElementById('stockProgressFill');
const stockCapacityText = document.getElementById('stockCapacityText');
const stockCapacityLabel = document.getElementById('stockCapacityLabel');
const stockStatusNote = document.getElementById('stockStatusNote');
const stockEntryStatus = document.getElementById('stockEntryStatus');

// Category to SKU prefix mapping
const categorySkuPrefixes = {
    'Apparel': 'CLT',
    'Skateboard': 'DECK',
    'Perlengkapan': 'ACC'
};

// Function to generate next available SKU for a category
async function generateSkuForCategory(category) {
    const prefix = categorySkuPrefixes[category] || 'PRD';
    
    try {
        // Get all products with SKU for this category
        const { data: products } = await supabaseClient
            .from('products')
            .select('sku')
            .like('sku', `${prefix}-%`);
        
        if (!products || products.length === 0) {
            return `${prefix}-001`;
        }
        
        // Extract numbers from existing SKUs and find the highest
        const numbers = products
            .map(p => {
                const match = p.sku?.match(new RegExp(`^${prefix}-(\\d+)$`));
                return match ? parseInt(match[1]) : 0;
            })
            .filter(n => n > 0);
        
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        const nextNumber = maxNumber + 1;
        
        return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating SKU:', error);
        return `${prefix}-001`;
    }
}

// Function to check if SKU already exists
async function skuExists(sku) {
    try {
        const { data: products } = await supabaseClient
            .from('products')
            .select('sku')
            .eq('sku', sku)
            .limit(1);
        
        return products && products.length > 0;
    } catch (error) {
        console.error('Error checking SKU existence:', error);
        return false;
    }
}

// Function to auto-generate SKU when category changes
async function autoGenerateSku() {
    const category = document.getElementById('kategori').value;
    const skuInput = document.getElementById('sku');
    
    if (!category || !skuInput) return;
    
    // Generate SKU based on category
    let sku = await generateSkuForCategory(category);
    
    // Ensure SKU is unique by checking if it exists
    while (await skuExists(sku)) {
        // Extract prefix and increment number
        const prefix = categorySkuPrefixes[category] || 'PRD';
        const match = sku.match(new RegExp(`^${prefix}-(\\d+)$`));
        if (match) {
            const currentNum = parseInt(match[1]);
            const nextNum = currentNum + 1;
            sku = `${prefix}-${String(nextNum).padStart(3, '0')}`;
        } else {
            break;
        }
    }
    
    skuInput.value = sku;
}

async function refreshStockProgress() {
    let totalStock = 0;
    let totalProducts = 0;
    let inventoryValue = 0;
    let lowStockItems = 0;

    try {
        const { data: products } = await supabaseClient.from('products').select('*');
        if (products) {
            totalProducts = products.length;
            totalStock = products.reduce((sum, item) => sum + (parseInt(item.stok || 0)), 0);
            inventoryValue = products.reduce((sum, item) => sum + (parseInt(item.stok || 0) * parseFloat(item.harga_modal || 0)), 0);
            lowStockItems = products.filter(item => parseInt(item.stok || 0) <= (item.low_stock_threshold || 5)).length;
        }
    } catch (error) {
        console.warn('Tidak bisa memuat data inventory:', error?.message || error);
    }

    // Update KPI cards
    const inventoryTotalProductsEl = document.getElementById('inventoryTotalProducts');
    const inventoryTotalStockEl = document.getElementById('inventoryTotalStock');
    const inventoryTotalValueEl = document.getElementById('inventoryTotalValue');
    const inventoryLowStockEl = document.getElementById('inventoryLowStock');

    if (inventoryTotalProductsEl) inventoryTotalProductsEl.innerText = totalProducts;
    if (inventoryTotalStockEl) inventoryTotalStockEl.innerText = totalStock;
    if (inventoryTotalValueEl) inventoryTotalValueEl.innerText = 'Rp ' + inventoryValue.toLocaleString('id-ID');
    if (inventoryLowStockEl) inventoryLowStockEl.innerText = lowStockItems;

    // Legacy progress bar support (if elements still exist)
    const target = 120;
    const percent = totalStock ? Math.min(100, Math.round((Math.min(totalStock, target) / target) * 100)) : 0;
    if (stockProgressFill) stockProgressFill.style.width = percent + '%';
    if (stockCapacityText) stockCapacityText.innerText = `${percent}% Warehouse Utilization`;
    if (stockCapacityLabel) stockCapacityLabel.innerText = 'CAPACITY';
    if (stockStatusNote) stockStatusNote.innerText = totalStock
        ? `Total stock: ${totalStock} units. Warehouse active.`
        : 'Warehouse empty. No inventory activity.';
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
    const low_stock_threshold = parseInt(document.getElementById('low_stock_threshold').value) || 5;
    const image_url = document.getElementById('image_url').value || null;

    // Mengirimkan semua data termasuk variabel 'kategori' ke tabel Supabase
    const { data, error } = await supabaseClient
        .from('products')
        .insert([{ nama_barang, sku, kategori, ukuran, stok, harga_modal, harga_jual, harga_member, low_stock_threshold, image_url }]);


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
        
        // Log activity
        if (data && data[0]) {
            await logActivity('product_created', 'product', data[0].id, {
                nama_barang,
                sku,
                kategori,
                stok,
                harga_jual
            });
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

    // Add event listener to category select for auto SKU generation
    const kategoriSelect = document.getElementById('kategori');
    const sizeContainer = document.getElementById('sizeContainer');
    const ukuranEl = document.getElementById('ukuran');

    // Define size options based on category
    const sizeOptions = {
        'Clothing': ['S', 'M', 'L', 'XL', 'XXL'],
        'Skateboard': ['8.0', '8.125', '8.25', '8.5'],
        'Perlengkapan': ['NO SIZE']
    };

    function updateSizeOptions() {
        const category = kategoriSelect.value;

        if (!category) {
            sizeContainer.classList.add('hidden');
            return;
        }

        // Clear existing options
        ukuranEl.innerHTML = '<option value="">-- Select Size --</option>';

        if (category === 'Perlengkapan') {
            // Auto-fill NO SIZE and disable size input
            ukuranEl.value = 'NO SIZE';
            ukuranEl.disabled = true;
            sizeContainer.classList.remove('hidden');
        } else if (sizeOptions[category]) {
            // Populate size options
            sizeOptions[category].forEach(size => {
                const option = document.createElement('option');
                option.value = size;
                option.textContent = size;
                ukuranEl.appendChild(option);
            });
            ukuranEl.disabled = false;
            sizeContainer.classList.remove('hidden');
        } else {
            sizeContainer.classList.add('hidden');
        }
    }

    if (kategoriSelect) {
        kategoriSelect.addEventListener('change', () => {
            autoGenerateSku();
            updateSizeOptions();
        });
    }

    // Also trigger SKU generation and size options on page load if category is already selected
    if (kategoriSelect && kategoriSelect.value) {
        autoGenerateSku();
        updateSizeOptions();
    }

    // Load products for stock adjustment modal
    loadProductsForStockAdjustment();

    // Setup stock adjustment form
    document.getElementById('stockAdjustmentForm').addEventListener('submit', handleStockAdjustment);
});

// Stock Adjustment Functions
async function loadProductsForStockAdjustment() {
    try {
        const { data: products } = await supabaseClient
            .from('products')
            .select('id, nama_barang, sku, stok')
            .order('nama_barang');
        
        const select = document.getElementById('adjustmentProduct');
        select.innerHTML = '<option value="">Select Product</option>';
        
        if (products) {
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.nama_barang} (${product.sku}) - Stock: ${product.stok}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading products for stock adjustment:', error);
    }
}

function openStockAdjustmentModal() {
    document.getElementById('stockAdjustmentModal').style.display = 'flex';
    loadProductsForStockAdjustment();
}

function closeStockAdjustmentModal() {
    document.getElementById('stockAdjustmentModal').style.display = 'none';
    document.getElementById('stockAdjustmentForm').reset();
}

async function handleStockAdjustment(e) {
    e.preventDefault();
    
    try {
        const productId = parseInt(document.getElementById('adjustmentProduct').value);
        const adjustmentType = document.getElementById('adjustmentType').value;
        const quantity = parseInt(document.getElementById('adjustmentQuantity').value);
        const reason = document.getElementById('adjustmentReason').value;
        
        if (!productId) {
            alert('Please select a product');
            return;
        }
        
        if (!quantity || quantity === 0) {
            alert('Please enter a quantity (use negative for stock reduction)');
            return;
        }
        
        // Create stock adjustment record
        const { error: adjustmentError } = await supabaseClient
            .from('stock_adjustments')
            .insert({
                product_id: productId,
                adjustment_type: adjustmentType,
                quantity: quantity,
                reason: reason,
                adjusted_by: 'admin' // You can get this from auth
            });
        
        if (adjustmentError) throw adjustmentError;
        
        alert('Stock adjustment saved successfully!');
        closeStockAdjustmentModal();
        await refreshStockProgress();
        
        // Log activity
        await logActivity('stock_adjustment', 'product', productId, {
            adjustment_type: adjustmentType,
            quantity,
            reason
        });
        
    } catch (error) {
        console.error('Error handling stock adjustment:', error);
        alert('Failed to save stock adjustment: ' + error.message);
    }
}

