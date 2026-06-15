// Purchase Orders Module for SPECTRE POS
// Handles PO creation, tracking, and supplier orders

/**
 * Create a new purchase order
 * @param {Object} poData - Purchase order data
 * @returns {Promise<Object>} Created PO record
 */
async function createPurchaseOrder(poData) {
    try {
        const poNumber = await generatePONumber();
        
        const { data, error } = await supabaseClient
            .from('purchase_orders')
            .insert([{
                po_number: poNumber,
                supplier_id: poData.supplier_id,
                order_date: new Date().toISOString(),
                expected_delivery_date: poData.expected_delivery_date,
                status: 'pending',
                total_amount: 0, // Will be calculated from items
                notes: poData.notes,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Add PO items
        if (poData.items && poData.items.length > 0) {
            let totalAmount = 0;
            
            for (const item of poData.items) {
                const itemTotal = item.quantity * item.unit_price;
                totalAmount += itemTotal;
                
                await supabaseClient.from('po_items').insert([{
                    po_id: data.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: itemTotal,
                    received_quantity: 0
                }]);
            }
            
            // Update PO total
            await supabaseClient
                .from('purchase_orders')
                .update({ total_amount: totalAmount })
                .eq('id', data.id);
        }

        return data;
    } catch (error) {
        console.error('Error creating purchase order:', error);
        throw error;
    }
}

/**
 * Generate PO number
 * @returns {Promise<string>} PO number
 */
async function generatePONumber() {
    try {
        const { data: existingPOs } = await supabaseClient
            .from('purchase_orders')
            .select('po_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNum = 1;
        if (existingPOs && existingPOs.length > 0) {
            const lastPO = existingPOs[0].po_number;
            const lastNum = parseInt(lastPO.replace('PO-', ''));
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        return 'PO-' + String(nextNum).padStart(4, '0');
    } catch (err) {
        console.warn('Failed to generate PO number, using timestamp:', err);
        return 'PO-' + Date.now().toString().slice(-4);
    }
}

/**
 * Get all purchase orders
 * @param {Object} filters - Optional filters (status, supplier_id, date range)
 * @returns {Promise<Array>} PO list
 */
async function getPurchaseOrders(filters = {}) {
    try {
        let query = supabaseClient
            .from('purchase_orders')
            .select(`
                *,
                suppliers (
                    name,
                    contact_person,
                    phone
                )
            `);

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.supplier_id) {
            query = query.eq('supplier_id', filters.supplier_id);
        }

        if (filters.startDate) {
            query = query.gte('order_date', filters.startDate.toISOString());
        }

        if (filters.endDate) {
            query = query.lte('order_date', filters.endDate.toISOString());
        }

        query = query.order('order_date', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting purchase orders:', error);
        throw error;
    }
}

/**
 * Get PO by ID with items
 * @param {string} poId - PO ID
 * @returns {Promise<Object>} PO record with items
 */
async function getPurchaseOrderById(poId) {
    try {
        const { data: po, error: poError } = await supabaseClient
            .from('purchase_orders')
            .select(`
                *,
                suppliers (
                    name,
                    contact_person,
                    phone,
                    email,
                    address
                )
            `)
            .eq('id', poId)
            .single();

        if (poError) throw poError;

        // Get PO items
        const { data: items, error: itemsError } = await supabaseClient
            .from('po_items')
            .select('*')
            .eq('po_id', poId);

        if (itemsError) throw itemsError;

        return {
            ...po,
            items: items || []
        };
    } catch (error) {
        console.error('Error getting purchase order:', error);
        throw error;
    }
}

/**
 * Update PO status
 * @param {string} poId - PO ID
 * @param {string} status - New status
 * @returns {Promise<boolean>} Success status
 */
async function updatePOStatus(poId, status) {
    try {
        const updateData = { status };
        
        if (status === 'received') {
            updateData.received_date = new Date().toISOString();
        }

        const { error } = await supabaseClient
            .from('purchase_orders')
            .update(updateData)
            .eq('id', poId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating PO status:', error);
        throw error;
    }
}

/**
 * Receive PO items (partial or full)
 * @param {string} poId - PO ID
 * @param {Array} receivedItems - Array of {po_item_id, received_quantity}
 * @returns {Promise<boolean>} Success status
 */
async function receivePOItems(poId, receivedItems) {
    try {
        const po = await getPurchaseOrderById(poId);
        
        for (const received of receivedItems) {
            // Update PO item received quantity
            const { data: poItem } = await supabaseClient
                .from('po_items')
                .select('*')
                .eq('id', received.po_item_id)
                .single();

            if (poItem) {
                const newReceivedQty = (poItem.received_quantity || 0) + received.received_quantity;
                
                await supabaseClient
                    .from('po_items')
                    .update({ received_quantity: newReceivedQty })
                    .eq('id', received.po_item_id);

                // Add stock to products
                if (poItem.product_id) {
                    const { data: product } = await supabaseClient
                        .from('products')
                        .select('stok')
                        .eq('id', poItem.product_id)
                        .single();

                    if (product) {
                        const newStock = product.stok + received.received_quantity;
                        await supabaseClient
                            .from('products')
                            .update({ stok: newStock })
                            .eq('id', poItem.product_id);
                    }
                }
            }
        }

        // Check if all items are received
        const { data: allItems } = await supabaseClient
            .from('po_items')
            .select('*')
            .eq('po_id', poId);

        const allReceived = allItems.every(item => item.received_quantity >= item.quantity);
        
        if (allReceived) {
            await updatePOStatus(poId, 'received');
        } else {
            await updatePOStatus(poId, 'partial');
        }

        return true;
    } catch (error) {
        console.error('Error receiving PO items:', error);
        throw error;
    }
}

/**
 * Cancel PO
 * @param {string} poId - PO ID
 * @returns {Promise<boolean>} Success status
 */
async function cancelPurchaseOrder(poId) {
    try {
        const { error } = await supabaseClient
            .from('purchase_orders')
            .update({ 
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', poId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error cancelling PO:', error);
        throw error;
    }
}

/**
 * Get PO statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} PO statistics
 */
async function getPOStatistics(startDate, endDate) {
    try {
        const pos = await getPurchaseOrders({ startDate, endDate });

        const totalPOs = pos.length;
        const pendingPOs = pos.filter(p => p.status === 'pending').length;
        const orderedPOs = pos.filter(p => p.status === 'ordered').length;
        const partialPOs = pos.filter(p => p.status === 'partial').length;
        const receivedPOs = pos.filter(p => p.status === 'received').length;
        const cancelledPOs = pos.filter(p => p.status === 'cancelled').length;

        const totalValue = pos.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);

        return {
            totalPOs,
            pendingPOs,
            orderedPOs,
            partialPOs,
            receivedPOs,
            cancelledPOs,
            totalValue
        };
    } catch (error) {
        console.error('Error getting PO statistics:', error);
        throw error;
    }
}

// Export functions for global access
window.PurchaseOrders = {
    createPurchaseOrder,
    generatePONumber,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePOStatus,
    receivePOItems,
    cancelPurchaseOrder,
    getPOStatistics
};
