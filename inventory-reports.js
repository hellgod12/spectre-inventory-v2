// Inventory Movement Reports Module for SPECTRE POS
// Tracks stock movements, low stock alerts, and inventory valuation

/**
 * Get inventory movement report for date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Inventory movement data
 */
async function getInventoryMovementReport(startDate, endDate) {
    try {
        // Get all sales history within date range
        const { data: salesHistory, error: salesError } = await supabaseClient
            .from('sales_history')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (salesError) throw salesError;

        // Get all returns within date range
        const { data: returns, error: returnsError } = await supabaseClient
            .from('returns')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .eq('status', 'processed');

        if (returnsError) throw returnsError;

        // Get current products
        const { data: products, error: productsError } = await supabaseClient
            .from('products')
            .select('*');

        if (productsError) throw productsError;

        // Calculate stock movements by product
        const movements = {};
        
        // Process sales (stock out)
        (salesHistory || []).forEach(sale => {
            const productId = sale.product_id;
            if (!movements[productId]) {
                movements[productId] = {
                    productId,
                    productName: sale.nama_barang,
                    category: sale.kategori,
                    stockIn: 0,
                    stockOut: 0,
                    netMovement: 0
                };
            }
            movements[productId].stockOut += sale.jumlah;
        });

        // Process returns (stock in)
        (returns || []).forEach(ret => {
            const productId = ret.product_id;
            if (!movements[productId]) {
                movements[productId] = {
                    productId,
                    productName: 'Unknown',
                    category: 'Unknown',
                    stockIn: 0,
                    stockOut: 0,
                    netMovement: 0
                };
            }
            movements[productId].stockIn += ret.quantity;
        });

        // Calculate net movement
        Object.values(movements).forEach(movement => {
            movement.netMovement = movement.stockIn - movement.stockOut;
        });

        // Calculate inventory valuation
        let totalInventoryValue = 0;
        let totalStock = 0;
        
        (products || []).forEach(product => {
            totalInventoryValue += (product.stok * product.harga_modal);
            totalStock += product.stok;
        });

        // Low stock alerts
        const lowStockThreshold = 5;
        const lowStockProducts = (products || []).filter(p => p.stok <= lowStockThreshold);

        // Out of stock products
        const outOfStockProducts = (products || []).filter(p => p.stok === 0);

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            summary: {
                totalProducts: products ? products.length : 0,
                totalStock,
                totalInventoryValue,
                totalStockOut: (salesHistory || []).reduce((sum, s) => sum + s.jumlah, 0),
                totalStockIn: (returns || []).reduce((sum, r) => sum + r.quantity, 0),
                lowStockCount: lowStockProducts.length,
                outOfStockCount: outOfStockProducts.length
            },
            movements: Object.values(movements),
            lowStockProducts,
            outOfStockProducts
        };
    } catch (error) {
        console.error('Error generating inventory movement report:', error);
        throw error;
    }
}

/**
 * Get low stock report
 * @param {number} threshold - Low stock threshold (default: 5)
 * @returns {Promise<Object>} Low stock report
 */
async function getLowStockReport(threshold = 5) {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .lte('stok', threshold)
            .order('stok', { ascending: true });

        if (error) throw error;

        return {
            threshold,
            lowStockCount: products ? products.length : 0,
            products: products || []
        };
    } catch (error) {
        console.error('Error getting low stock report:', error);
        throw error;
    }
}

/**
 * Get inventory valuation report
 * @returns {Promise<Object>} Inventory valuation data
 */
async function getInventoryValuationReport() {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*');

        if (error) throw error;

        let totalValue = 0;
        let totalRetailValue = 0;
        let totalStock = 0;
        
        const categoryValues = {};
        const categoryStock = {};

        (products || []).forEach(product => {
            const stockValue = product.stok * product.harga_modal;
            const retailValue = product.stok * product.harga_jual;
            
            totalValue += stockValue;
            totalRetailValue += retailValue;
            totalStock += product.stok;

            // Category breakdown
            const category = product.kategori || 'Uncategorized';
            if (!categoryValues[category]) {
                categoryValues[category] = 0;
                categoryStock[category] = 0;
            }
            categoryValues[category] += stockValue;
            categoryStock[category] += product.stok;
        });

        const potentialProfit = totalRetailValue - totalValue;

        return {
            summary: {
                totalProducts: products ? products.length : 0,
                totalStock,
                totalValue,
                totalRetailValue,
                potentialProfit,
                profitMargin: totalRetailValue > 0 ? (potentialProfit / totalRetailValue) * 100 : 0
            },
            categoryBreakdown: Object.keys(categoryValues).map(category => ({
                category,
                value: categoryValues[category],
                stock: categoryStock[category],
                percentage: totalValue > 0 ? (categoryValues[category] / totalValue) * 100 : 0
            }))
        };
    } catch (error) {
        console.error('Error getting inventory valuation report:', error);
        throw error;
    }
}

/**
 * Get product performance report
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Product performance data
 */
async function getProductPerformanceReport(startDate, endDate) {
    try {
        // Get sales history
        const { data: salesHistory, error } = await supabaseClient
            .from('sales_history')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) throw error;

        // Get products for modal cost
        const { data: products } = await supabaseClient
            .from('products')
            .select('id, nama_barang, harga_modal');

        // Create modal map
        const modalMap = new Map();
        (products || []).forEach(p => {
            modalMap.set(p.id, parseFloat(p.harga_modal || 0));
        });

        // Group by product
        const productPerformance = {};
        
        (salesHistory || []).forEach(sale => {
            const productId = sale.product_id;
            if (!productPerformance[productId]) {
                productPerformance[productId] = {
                    productId,
                    productName: sale.nama_barang,
                    category: sale.kategori,
                    quantitySold: 0,
                    revenue: 0,
                    cost: 0,
                    profit: 0
                };
            }
            
            const quantity = sale.jumlah;
            const revenue = parseFloat(sale.total_harga) || 0;
            const modalCost = modalMap.get(productId) || 0;
            const cost = modalCost * quantity;
            
            productPerformance[productId].quantitySold += quantity;
            productPerformance[productId].revenue += revenue;
            productPerformance[productId].cost += cost;
            productPerformance[productId].profit += (revenue - cost);
        });

        // Calculate margins and sort
        const performanceArray = Object.values(productPerformance).map(p => ({
            ...p,
            margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
        })).sort((a, b) => b.revenue - a.revenue);

        // Top performers
        const topProducts = performanceArray.slice(0, 10);
        
        // Bottom performers
        const bottomProducts = performanceArray.slice(-10).reverse();

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            summary: {
                totalProducts: performanceArray.length,
                totalRevenue: performanceArray.reduce((sum, p) => sum + p.revenue, 0),
                totalProfit: performanceArray.reduce((sum, p) => sum + p.profit, 0),
                avgMargin: performanceArray.length > 0 
                    ? performanceArray.reduce((sum, p) => sum + p.margin, 0) / performanceArray.length 
                    : 0
            },
            topProducts,
            bottomProducts,
            allProducts: performanceArray
        };
    } catch (error) {
        console.error('Error getting product performance report:', error);
        throw error;
    }
}

/**
 * Export inventory movement report to CSV
 * @param {Object} report - Inventory movement report data
 * @returns {string} CSV formatted string
 */
function exportInventoryMovementToCSV(report) {
    const headers = ['Product', 'Category', 'Stock In', 'Stock Out', 'Net Movement'];
    
    const rows = report.movements.map(m => [
        m.productName,
        m.category,
        m.stockIn,
        m.stockOut,
        m.netMovement
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Export low stock report to CSV
 * @param {Object} report - Low stock report data
 * @returns {string} CSV formatted string
 */
function exportLowStockToCSV(report) {
    const headers = ['Product', 'Category', 'Current Stock', 'SKU', 'Price'];
    
    const rows = report.products.map(p => [
        p.nama_barang,
        p.kategori,
        p.stok,
        p.sku || '-',
        p.harga_jual
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

// Export functions for global access
window.InventoryReports = {
    getInventoryMovementReport,
    getLowStockReport,
    getInventoryValuationReport,
    getProductPerformanceReport,
    exportInventoryMovementToCSV,
    exportLowStockToCSV
};
