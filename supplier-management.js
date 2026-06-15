// Supplier Management Module for SPECTRE POS
// Handles supplier information, contacts, and supplier performance

/**
 * Create a new supplier
 * @param {Object} supplierData - Supplier data
 * @returns {Promise<Object>} Created supplier record
 */
async function createSupplier(supplierData) {
    try {
        const { data, error } = await supabaseClient
            .from('suppliers')
            .insert([{
                name: supplierData.name,
                contact_person: supplierData.contact_person,
                phone: supplierData.phone,
                email: supplierData.email,
                address: supplierData.address,
                city: supplierData.city,
                province: supplierData.province,
                postal_code: supplierData.postal_code,
                tax_id: supplierData.tax_id,
                payment_terms: supplierData.payment_terms,
                notes: supplierData.notes,
                active: true,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating supplier:', error);
        throw error;
    }
}

/**
 * Get all suppliers
 * @param {Object} filters - Optional filters (active, city, etc.)
 * @returns {Promise<Array>} Suppliers list
 */
async function getSuppliers(filters = {}) {
    try {
        let query = supabaseClient.from('suppliers').select('*');

        if (filters.active !== undefined) {
            query = query.eq('active', filters.active);
        }

        if (filters.city) {
            query = query.eq('city', filters.city);
        }

        query = query.order('name', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting suppliers:', error);
        throw error;
    }
}

/**
 * Get supplier by ID
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} Supplier record
 */
async function getSupplierById(supplierId) {
    try {
        const { data, error } = await supabaseClient
            .from('suppliers')
            .select('*')
            .eq('id', supplierId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting supplier:', error);
        throw error;
    }
}

/**
 * Update supplier
 * @param {string} supplierId - Supplier ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated supplier record
 */
async function updateSupplier(supplierId, updateData) {
    try {
        const { data, error } = await supabaseClient
            .from('suppliers')
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', supplierId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating supplier:', error);
        throw error;
    }
}

/**
 * Deactivate supplier
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<boolean>} Success status
 */
async function deactivateSupplier(supplierId) {
    try {
        const { error } = await supabaseClient
            .from('suppliers')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', supplierId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deactivating supplier:', error);
        throw error;
    }
}

/**
 * Get supplier products
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Array>} Products from this supplier
 */
async function getSupplierProducts(supplierId) {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('supplier_id', supplierId)
            .order('nama_barang', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting supplier products:', error);
        throw error;
    }
}

/**
 * Get supplier performance metrics
 * @param {string} supplierId - Supplier ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Supplier performance data
 */
async function getSupplierPerformance(supplierId, startDate, endDate) {
    try {
        // Get products from this supplier
        const products = await getSupplierProducts(supplierId);
        
        if (products.length === 0) {
            return {
                supplierId,
                totalProducts: 0,
                totalSales: 0,
                totalQuantity: 0,
                avgMargin: 0
            };
        }

        const productIds = products.map(p => p.id);

        // Get sales history for these products
        const { data: salesHistory, error } = await supabaseClient
            .from('sales_history')
            .select('*')
            .in('product_id', productIds)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) throw error;

        // Calculate metrics
        const totalSales = (salesHistory || []).reduce((sum, sale) => sum + (parseFloat(sale.total_harga) || 0), 0);
        const totalQuantity = (salesHistory || []).reduce((sum, sale) => sum + (parseInt(sale.jumlah) || 0), 0);

        // Calculate average margin
        let totalMargin = 0;
        let marginCount = 0;
        
        for (const sale of salesHistory || []) {
            const product = products.find(p => p.id === sale.product_id);
            if (product) {
                const revenue = parseFloat(sale.total_harga) || 0;
                const cost = (parseFloat(product.harga_modal) || 0) * sale.jumlah;
                const margin = revenue - cost;
                totalMargin += margin;
                marginCount++;
            }
        }

        const avgMargin = marginCount > 0 ? totalMargin / marginCount : 0;

        return {
            supplierId,
            totalProducts: products.length,
            totalSales,
            totalQuantity,
            avgMargin,
            transactionCount: salesHistory ? salesHistory.length : 0
        };
    } catch (error) {
        console.error('Error getting supplier performance:', error);
        throw error;
    }
}

/**
 * Get supplier statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Supplier statistics
 */
async function getSupplierStatistics(startDate, endDate) {
    try {
        const suppliers = await getSuppliers({ active: true });

        const performances = await Promise.all(
            suppliers.map(supplier => getSupplierPerformance(supplier.id, startDate, endDate))
        );

        const totalSuppliers = suppliers.length;
        const activeSuppliers = suppliers.filter(s => s.active).length;
        const totalProducts = performances.reduce((sum, p) => sum + p.totalProducts, 0);
        const totalSales = performances.reduce((sum, p) => sum + p.totalSales, 0);
        const topSupplier = performances.length > 0 
            ? performances.reduce((max, p) => p.totalSales > max.totalSales ? p : max)
            : null;

        return {
            totalSuppliers,
            activeSuppliers,
            totalProducts,
            totalSales,
            topSupplier,
            performances
        };
    } catch (error) {
        console.error('Error getting supplier statistics:', error);
        throw error;
    }
}

// Export functions for global access
window.SupplierManagement = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deactivateSupplier,
    getSupplierProducts,
    getSupplierPerformance,
    getSupplierStatistics
};
