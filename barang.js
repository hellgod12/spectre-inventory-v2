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
            lowStockItems = products.filter(item => parseInt(item.stok || 0) <= 5).length;
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

    // Add event listener to category select for auto SKU generation
    const kategoriSelect = document.getElementById('kategori');
    if (kategoriSelect) {
        kategoriSelect.addEventListener('change', autoGenerateSku);
    }

    // Also trigger SKU generation on page load if category is already selected
    if (kategoriSelect && kategoriSelect.value) {
        autoGenerateSku();
    }
});

