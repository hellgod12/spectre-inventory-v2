// Marketplace Repository Layer
// Data access layer for marketplace accounting system
// Uses global supabaseClient from auth.js

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[marketplace-repository.js] supabaseClient not initialized. Ensure auth.js is loaded before marketplace-repository.js');
}

// ============================================
// MARKETPLACE ACCOUNTS
// ============================================

/**
 * Get all marketplace accounts
 * @returns {Promise<Array>} Array of marketplace accounts
 */
async function getMarketplaceAccounts() {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_accounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching marketplace accounts:', error);
        throw error;
    }
}

/**
 * Get marketplace account by ID
 * @param {string} id - Account UUID
 * @returns {Promise<Object>} Marketplace account object
 */
async function getMarketplaceAccountById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_accounts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching marketplace account:', error);
        throw error;
    }
}

/**
 * Get active marketplace accounts only
 * @returns {Promise<Array>} Array of active marketplace accounts
 */
async function getActiveMarketplaceAccounts() {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_accounts')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching active marketplace accounts:', error);
        throw error;
    }
}

/**
 * Create new marketplace account
 * @param {Object} accountData - Account data
 * @returns {Promise<Object>} Created account
 */
async function createMarketplaceAccount(accountData) {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_accounts')
            .insert([{
                platform: accountData.platform,
                shop_name: accountData.shop_name,
                shop_id: accountData.shop_id || null,
                api_key: accountData.api_key || null,
                api_secret: accountData.api_secret || null,
                is_active: accountData.is_active !== undefined ? accountData.is_active : true
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating marketplace account:', error);
        throw error;
    }
}

/**
 * Update marketplace account
 * @param {string} id - Account UUID
 * @param {Object} accountData - Updated account data
 * @returns {Promise<Object>} Updated account
 */
async function updateMarketplaceAccount(id, accountData) {
    try {
        const updateData = {};
        
        if (accountData.platform !== undefined) updateData.platform = accountData.platform;
        if (accountData.shop_name !== undefined) updateData.shop_name = accountData.shop_name;
        if (accountData.shop_id !== undefined) updateData.shop_id = accountData.shop_id;
        if (accountData.api_key !== undefined) updateData.api_key = accountData.api_key;
        if (accountData.api_secret !== undefined) updateData.api_secret = accountData.api_secret;
        if (accountData.is_active !== undefined) updateData.is_active = accountData.is_active;

        const { data, error } = await supabaseClient
            .from('marketplace_accounts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating marketplace account:', error);
        throw error;
    }
}

/**
 * Delete marketplace account
 * @param {string} id - Account UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteMarketplaceAccount(id) {
    try {
        const { error } = await supabaseClient
            .from('marketplace_accounts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting marketplace account:', error);
        throw error;
    }
}

/**
 * Toggle marketplace account active status
 * @param {string} id - Account UUID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} Updated account
 */
async function toggleMarketplaceAccountStatus(id, isActive) {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_accounts')
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error toggling marketplace account status:', error);
        throw error;
    }
}

// ============================================
// ONLINE ORDERS
// ============================================

/**
 * Get online orders with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of online orders
 */
async function getOnlineOrders(filters = {}) {
    try {
        let query = supabaseClient
            .from('online_orders')
            .select(`
                *,
                marketplace_accounts (
                    id,
                    platform,
                    shop_name
                )
            `);

        if (filters.marketplace_account_id) {
            query = query.eq('marketplace_account_id', filters.marketplace_account_id);
        }

        if (filters.order_status) {
            query = query.eq('order_status', filters.order_status);
        }

        if (filters.settlement_status) {
            query = query.eq('settlement_status', filters.settlement_status);
        }

        if (filters.start_date && filters.end_date) {
            query = query.gte('order_date', filters.start_date).lte('order_date', filters.end_date);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        query = query.order('order_date', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching online orders:', error);
        throw error;
    }
}

/**
 * Get online order by ID
 * @param {string} id - Order UUID
 * @returns {Promise<Object>} Online order object with items and fees
 */
async function getOnlineOrderById(id) {
    try {
        const { data: order, error: orderError } = await supabaseClient
            .from('online_orders')
            .select(`
                *,
                marketplace_accounts (
                    id,
                    platform,
                    shop_name
                )
            `)
            .eq('id', id)
            .single();

        if (orderError) throw orderError;

        // Get order items
        const { data: items, error: itemsError } = await supabaseClient
            .from('order_items')
            .select(`
                *,
                products (
                    id,
                    nama_barang,
                    sku,
                    kategori,
                    ukuran,
                    stok,
                    harga_modal,
                    harga_jual
                )
            `)
            .eq('online_order_id', id);

        if (itemsError) throw itemsError;

        // Get marketplace fees
        const { data: fees, error: feesError } = await supabaseClient
            .from('marketplace_fees')
            .select('*')
            .eq('online_order_id', id);

        if (feesError) throw feesError;

        return {
            ...order,
            items: items || [],
            fees: fees || []
        };
    } catch (error) {
        console.error('Error fetching online order:', error);
        throw error;
    }
}

/**
 * Get online order by order number and marketplace account
 * @param {string} orderNumber - Order number
 * @param {string} marketplaceAccountId - Marketplace account UUID
 * @returns {Promise<Object>} Online order object
 */
async function getOnlineOrderByOrderNumber(orderNumber, marketplaceAccountId) {
    try {
        const { data, error } = await supabaseClient
            .from('online_orders')
            .select('*')
            .eq('order_number', orderNumber)
            .eq('marketplace_account_id', marketplaceAccountId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching online order by number:', error);
        throw error;
    }
}

/**
 * Create new online order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order
 */
async function createOnlineOrder(orderData) {
    try {
        const { data, error } = await supabaseClient
            .from('online_orders')
            .insert([{
                marketplace_account_id: orderData.marketplace_account_id,
                order_number: orderData.order_number,
                platform_order_id: orderData.platform_order_id || null,
                customer_name: orderData.customer_name || null,
                customer_phone: orderData.customer_phone || null,
                shipping_address: orderData.shipping_address || null,
                order_date: orderData.order_date || new Date().toISOString(),
                order_status: orderData.order_status || 'PENDING',
                gross_sales: orderData.gross_sales || 0,
                voucher_discount: orderData.voucher_discount || 0,
                platform_fee: orderData.platform_fee || 0,
                shipping_fee: orderData.shipping_fee || 0,
                notes: orderData.notes || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating online order:', error);
        throw error;
    }
}

/**
 * Update online order
 * @param {string} id - Order UUID
 * @param {Object} orderData - Updated order data
 * @returns {Promise<Object>} Updated order
 */
async function updateOnlineOrder(id, orderData) {
    try {
        const updateData = {};
        
        if (orderData.customer_name !== undefined) updateData.customer_name = orderData.customer_name;
        if (orderData.customer_phone !== undefined) updateData.customer_phone = orderData.customer_phone;
        if (orderData.shipping_address !== undefined) updateData.shipping_address = orderData.shipping_address;
        if (orderData.order_status !== undefined) updateData.order_status = orderData.order_status;
        if (orderData.gross_sales !== undefined) updateData.gross_sales = orderData.gross_sales;
        if (orderData.voucher_discount !== undefined) updateData.voucher_discount = orderData.voucher_discount;
        if (orderData.platform_fee !== undefined) updateData.platform_fee = orderData.platform_fee;
        if (orderData.shipping_fee !== undefined) updateData.shipping_fee = orderData.shipping_fee;
        if (orderData.settlement_status !== undefined) updateData.settlement_status = orderData.settlement_status;
        if (orderData.settlement_date !== undefined) updateData.settlement_date = orderData.settlement_date;
        if (orderData.notes !== undefined) updateData.notes = orderData.notes;

        const { data, error } = await supabaseClient
            .from('online_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating online order:', error);
        throw error;
    }
}

/**
 * Delete online order
 * @param {string} id - Order UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteOnlineOrder(id) {
    try {
        const { error } = await supabaseClient
            .from('online_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting online order:', error);
        throw error;
    }
}

/**
 * Update order status
 * @param {string} id - Order UUID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated order
 */
async function updateOrderStatus(id, status) {
    try {
        const { data, error } = await supabaseClient
            .from('online_orders')
            .update({ order_status: status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

/**
 * Update settlement status
 * @param {string} id - Order UUID
 * @param {string} status - New settlement status
 * @param {string} settlementDate - Settlement date
 * @returns {Promise<Object>} Updated order
 */
async function updateSettlementStatus(id, status, settlementDate = null) {
    try {
        const updateData = { settlement_status: status };
        if (settlementDate) {
            updateData.settlement_date = settlementDate;
        }

        const { data, error } = await supabaseClient
            .from('online_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating settlement status:', error);
        throw error;
    }
}

// ============================================
// ORDER ITEMS
// ============================================

/**
 * Get order items by order ID
 * @param {string} onlineOrderId - Online order UUID
 * @returns {Promise<Array>} Array of order items
 */
async function getOrderItemsByOrderId(onlineOrderId) {
    try {
        const { data, error } = await supabaseClient
            .from('order_items')
            .select(`
                *,
                products (
                    id,
                    nama_barang,
                    sku,
                    kategori,
                    ukuran,
                    stok,
                    harga_modal,
                    harga_jual
                )
            `)
            .eq('online_order_id', onlineOrderId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching order items:', error);
        throw error;
    }
}

/**
 * Create single order item
 * @param {Object} itemData - Order item data
 * @returns {Promise<Object>} Created order item
 */
async function createOrderItem(itemData) {
    try {
        const { data, error } = await supabaseClient
            .from('order_items')
            .insert([{
                online_order_id: itemData.online_order_id,
                product_id: itemData.product_id || null,
                product_name: itemData.product_name,
                sku: itemData.sku || null,
                quantity: itemData.quantity,
                unit_price: itemData.unit_price
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating order item:', error);
        throw error;
    }
}

/**
 * Create multiple order items in batch
 * @param {Array} itemsData - Array of order item data
 * @returns {Promise<Array>} Created order items
 */
async function createOrderItemsBatch(itemsData) {
    try {
        const itemsToInsert = itemsData.map(item => ({
            online_order_id: item.online_order_id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            sku: item.sku || null,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));

        const { data, error } = await supabaseClient
            .from('order_items')
            .insert(itemsToInsert)
            .select();

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error creating order items batch:', error);
        throw error;
    }
}

/**
 * Update order item
 * @param {string} id - Order item UUID
 * @param {Object} itemData - Updated item data
 * @returns {Promise<Object>} Updated order item
 */
async function updateOrderItem(id, itemData) {
    try {
        const updateData = {};
        
        if (itemData.product_id !== undefined) updateData.product_id = itemData.product_id;
        if (itemData.product_name !== undefined) updateData.product_name = itemData.product_name;
        if (itemData.sku !== undefined) updateData.sku = itemData.sku;
        if (itemData.quantity !== undefined) updateData.quantity = itemData.quantity;
        if (itemData.unit_price !== undefined) updateData.unit_price = itemData.unit_price;

        const { data, error } = await supabaseClient
            .from('order_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating order item:', error);
        throw error;
    }
}

/**
 * Delete order item
 * @param {string} id - Order item UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteOrderItem(id) {
    try {
        const { error } = await supabaseClient
            .from('order_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting order item:', error);
        throw error;
    }
}

/**
 * Delete all order items for an order
 * @param {string} onlineOrderId - Online order UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteOrderItemsByOrderId(onlineOrderId) {
    try {
        const { error } = await supabaseClient
            .from('order_items')
            .delete()
            .eq('online_order_id', onlineOrderId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting order items by order ID:', error);
        throw error;
    }
}

// ============================================
// MARKETPLACE FEES
// ============================================

/**
 * Get fees by order ID
 * @param {string} onlineOrderId - Online order UUID
 * @returns {Promise<Array>} Array of marketplace fees
 */
async function getFeesByOrderId(onlineOrderId) {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_fees')
            .select('*')
            .eq('online_order_id', onlineOrderId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching marketplace fees:', error);
        throw error;
    }
}

/**
 * Create single marketplace fee
 * @param {Object} feeData - Fee data
 * @returns {Promise<Object>} Created fee
 */
async function createFee(feeData) {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_fees')
            .insert([{
                online_order_id: feeData.online_order_id,
                fee_type: feeData.fee_type,
                fee_name: feeData.fee_name || null,
                fee_amount: feeData.fee_amount,
                fee_percentage: feeData.fee_percentage || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating marketplace fee:', error);
        throw error;
    }
}

/**
 * Create multiple fees in batch
 * @param {Array} feesData - Array of fee data
 * @returns {Promise<Array>} Created fees
 */
async function createFeesBatch(feesData) {
    try {
        const feesToInsert = feesData.map(fee => ({
            online_order_id: fee.online_order_id,
            fee_type: fee.fee_type,
            fee_name: fee.fee_name || null,
            fee_amount: fee.fee_amount,
            fee_percentage: fee.fee_percentage || null
        }));

        const { data, error } = await supabaseClient
            .from('marketplace_fees')
            .insert(feesToInsert)
            .select();

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error creating fees batch:', error);
        throw error;
    }
}

/**
 * Delete marketplace fee
 * @param {string} id - Fee UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteFee(id) {
    try {
        const { error } = await supabaseClient
            .from('marketplace_fees')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting marketplace fee:', error);
        throw error;
    }
}

/**
 * Delete all fees for an order
 * @param {string} onlineOrderId - Online order UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteFeesByOrderId(onlineOrderId) {
    try {
        const { error } = await supabaseClient
            .from('marketplace_fees')
            .delete()
            .eq('online_order_id', onlineOrderId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting fees by order ID:', error);
        throw error;
    }
}

// ============================================
// SETTLEMENTS
// ============================================

/**
 * Get settlements with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of settlements
 */
async function getSettlements(filters = {}) {
    try {
        let query = supabaseClient
            .from('settlements')
            .select(`
                *,
                marketplace_accounts (
                    id,
                    platform,
                    shop_name
                )
            `);

        if (filters.marketplace_account_id) {
            query = query.eq('marketplace_account_id', filters.marketplace_account_id);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.start_date && filters.end_date) {
            query = query.gte('settlement_date', filters.start_date).lte('settlement_date', filters.end_date);
        }

        query = query.order('settlement_date', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching settlements:', error);
        throw error;
    }
}

/**
 * Get settlement by ID
 * @param {string} id - Settlement UUID
 * @returns {Promise<Object>} Settlement object
 */
async function getSettlementById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('settlements')
            .select(`
                *,
                marketplace_accounts (
                    id,
                    platform,
                    shop_name
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching settlement:', error);
        throw error;
    }
}

/**
 * Create new settlement
 * @param {Object} settlementData - Settlement data
 * @returns {Promise<Object>} Created settlement
 */
async function createSettlement(settlementData) {
    try {
        const { data, error } = await supabaseClient
            .from('settlements')
            .insert([{
                marketplace_account_id: settlementData.marketplace_account_id,
                settlement_id: settlementData.settlement_id || null,
                settlement_date: settlementData.settlement_date,
                period_start: settlementData.period_start || null,
                period_end: settlementData.period_end || null,
                total_amount: settlementData.total_amount,
                order_count: settlementData.order_count || 0,
                status: settlementData.status || 'PENDING',
                notes: settlementData.notes || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating settlement:', error);
        throw error;
    }
}

/**
 * Update settlement
 * @param {string} id - Settlement UUID
 * @param {Object} settlementData - Updated settlement data
 * @returns {Promise<Object>} Updated settlement
 */
async function updateSettlement(id, settlementData) {
    try {
        const updateData = {};
        
        if (settlementData.settlement_id !== undefined) updateData.settlement_id = settlementData.settlement_id;
        if (settlementData.settlement_date !== undefined) updateData.settlement_date = settlementData.settlement_date;
        if (settlementData.period_start !== undefined) updateData.period_start = settlementData.period_start;
        if (settlementData.period_end !== undefined) updateData.period_end = settlementData.period_end;
        if (settlementData.total_amount !== undefined) updateData.total_amount = settlementData.total_amount;
        if (settlementData.order_count !== undefined) updateData.order_count = settlementData.order_count;
        if (settlementData.status !== undefined) updateData.status = settlementData.status;
        if (settlementData.notes !== undefined) updateData.notes = settlementData.notes;

        const { data, error } = await supabaseClient
            .from('settlements')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating settlement:', error);
        throw error;
    }
}

/**
 * Delete settlement
 * @param {string} id - Settlement UUID
 * @returns {Promise<boolean>} Success status
 */
async function deleteSettlement(id) {
    try {
        const { error } = await supabaseClient
            .from('settlements')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting settlement:', error);
        throw error;
    }
}

// ============================================
// REPORTING & ANALYTICS
// ============================================

/**
 * Get marketplace revenue summary for date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Revenue summary
 */
async function getMarketplaceRevenueSummary(startDate, endDate) {
    try {
        const { data, error } = await supabaseClient
            .from('online_orders')
            .select(`
                marketplace_accounts!inner (
                    platform,
                    shop_name
                ),
                gross_sales,
                voucher_discount,
                platform_fee,
                shipping_fee,
                net_revenue
            `)
            .gte('order_date', startDate.toISOString())
            .lte('order_date', endDate.toISOString());

        if (error) throw error;

        const summary = {
            total_gross_sales: 0,
            total_voucher_discount: 0,
            total_platform_fee: 0,
            total_shipping_fee: 0,
            total_net_revenue: 0,
            by_platform: {}
        };

        (data || []).forEach(order => {
            const platform = order.marketplace_accounts.platform;
            
            summary.total_gross_sales += parseFloat(order.gross_sales || 0);
            summary.total_voucher_discount += parseFloat(order.voucher_discount || 0);
            summary.total_platform_fee += parseFloat(order.platform_fee || 0);
            summary.total_shipping_fee += parseFloat(order.shipping_fee || 0);
            summary.total_net_revenue += parseFloat(order.net_revenue || 0);

            if (!summary.by_platform[platform]) {
                summary.by_platform[platform] = {
                    gross_sales: 0,
                    voucher_discount: 0,
                    platform_fee: 0,
                    shipping_fee: 0,
                    net_revenue: 0,
                    order_count: 0
                };
            }

            summary.by_platform[platform].gross_sales += parseFloat(order.gross_sales || 0);
            summary.by_platform[platform].voucher_discount += parseFloat(order.voucher_discount || 0);
            summary.by_platform[platform].platform_fee += parseFloat(order.platform_fee || 0);
            summary.by_platform[platform].shipping_fee += parseFloat(order.shipping_fee || 0);
            summary.by_platform[platform].net_revenue += parseFloat(order.net_revenue || 0);
            summary.by_platform[platform].order_count += 1;
        });

        return summary;
    } catch (error) {
        console.error('Error fetching marketplace revenue summary:', error);
        throw error;
    }
}

/**
 * Get platform fee summary for date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Fee summary
 */
async function getPlatformFeeSummary(startDate, endDate) {
    try {
        const { data, error } = await supabaseClient
            .from('marketplace_fees')
            .select(`
                fee_type,
                fee_name,
                fee_amount,
                fee_percentage,
                online_orders (
                    order_date,
                    marketplace_accounts (
                        platform
                    )
                )
            `)
            .gte('online_orders.order_date', startDate.toISOString())
            .lte('online_orders.order_date', endDate.toISOString());

        if (error) throw error;

        const summary = {
            total_fees: 0,
            by_type: {},
            by_platform: {}
        };

        (data || []).forEach(fee => {
            const platform = fee.online_orders?.marketplace_accounts?.platform || 'UNKNOWN';
            const feeType = fee.fee_type;
            
            summary.total_fees += parseFloat(fee.fee_amount || 0);

            if (!summary.by_type[feeType]) {
                summary.by_type[feeType] = {
                    total_amount: 0,
                    count: 0
                };
            }
            summary.by_type[feeType].total_amount += parseFloat(fee.fee_amount || 0);
            summary.by_type[feeType].count += 1;

            if (!summary.by_platform[platform]) {
                summary.by_platform[platform] = {
                    total_amount: 0,
                    count: 0
                };
            }
            summary.by_platform[platform].total_amount += parseFloat(fee.fee_amount || 0);
            summary.by_platform[platform].count += 1;
        });

        return summary;
    } catch (error) {
        console.error('Error fetching platform fee summary:', error);
        throw error;
    }
}

/**
 * Get order statistics for marketplace
 * @param {string} marketplaceAccountId - Marketplace account UUID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Order statistics
 */
async function getOrderStatistics(marketplaceAccountId, startDate, endDate) {
    try {
        const { data, error } = await supabaseClient
            .from('online_orders')
            .select('*')
            .eq('marketplace_account_id', marketplaceAccountId)
            .gte('order_date', startDate.toISOString())
            .lte('order_date', endDate.toISOString());

        if (error) throw error;

        const stats = {
            total_orders: data?.length || 0,
            by_status: {
                PENDING: 0,
                PROCESSING: 0,
                SHIPPED: 0,
                DELIVERED: 0,
                CANCELLED: 0,
                RETURNED: 0
            },
            by_settlement_status: {
                UNSETTLED: 0,
                PARTIALLY_SETTLED: 0,
                SETTLED: 0
            },
            total_gross_sales: 0,
            total_net_revenue: 0
        };

        (data || []).forEach(order => {
            stats.by_status[order.order_status] = (stats.by_status[order.order_status] || 0) + 1;
            stats.by_settlement_status[order.settlement_status] = (stats.by_settlement_status[order.settlement_status] || 0) + 1;
            stats.total_gross_sales += parseFloat(order.gross_sales || 0);
            stats.total_net_revenue += parseFloat(order.net_revenue || 0);
        });

        return stats;
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        throw error;
    }
}

/**
 * Get settlement reconciliation data
 * @param {string} settlementId - Settlement UUID
 * @returns {Promise<Object>} Reconciliation data
 */
async function getSettlementReconciliation(settlementId) {
    try {
        const { data: settlement, error: settlementError } = await supabaseClient
            .from('settlements')
            .select(`
                *,
                marketplace_accounts (
                    platform,
                    shop_name
                )
            `)
            .eq('id', settlementId)
            .single();

        if (settlementError) throw settlementError;

        const { data: orders, error: ordersError } = await supabaseClient
            .from('online_orders')
            .select('*')
            .eq('marketplace_account_id', settlement.marketplace_account_id)
            .eq('settlement_status', 'SETTLED')
            .gte('settlement_date', settlement.period_start)
            .lte('settlement_date', settlement.period_end);

        if (ordersError) throw ordersError;

        const calculatedTotal = (orders || []).reduce((sum, order) => {
            return sum + parseFloat(order.net_revenue || 0);
        }, 0);

        const discrepancy = settlement.total_amount - calculatedTotal;

        return {
            settlement,
            matched_orders: orders || [],
            calculated_total: calculatedTotal,
            settlement_total: settlement.total_amount,
            discrepancy: discrepancy,
            is_reconciled: Math.abs(discrepancy) < 0.01
        };
    } catch (error) {
        console.error('Error fetching settlement reconciliation:', error);
        throw error;
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Marketplace Accounts
        getMarketplaceAccounts,
        getMarketplaceAccountById,
        getActiveMarketplaceAccounts,
        createMarketplaceAccount,
        updateMarketplaceAccount,
        deleteMarketplaceAccount,
        toggleMarketplaceAccountStatus,
        // Online Orders
        getOnlineOrders,
        getOnlineOrderById,
        getOnlineOrderByOrderNumber,
        createOnlineOrder,
        updateOnlineOrder,
        deleteOnlineOrder,
        updateOrderStatus,
        updateSettlementStatus,
        // Order Items
        getOrderItemsByOrderId,
        createOrderItem,
        createOrderItemsBatch,
        updateOrderItem,
        deleteOrderItem,
        deleteOrderItemsByOrderId,
        // Marketplace Fees
        getFeesByOrderId,
        createFee,
        createFeesBatch,
        deleteFee,
        deleteFeesByOrderId,
        // Settlements
        getSettlements,
        getSettlementById,
        createSettlement,
        updateSettlement,
        deleteSettlement,
        // Reporting & Analytics
        getMarketplaceRevenueSummary,
        getPlatformFeeSummary,
        getOrderStatistics,
        getSettlementReconciliation
    };
}
