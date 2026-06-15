// Returns and Refund Management Module for SPECTRE POS
// Handles product returns, refunds, and stock restoration

/**
 * Create a return record
 * @param {Object} returnData - Return data
 * @returns {Promise<Object>} Created return record
 */
async function createReturn(returnData) {
    try {
        const { data, error } = await supabaseClient
            .from('returns')
            .insert([{
                payment_id: returnData.payment_id,
                product_id: returnData.product_id,
                quantity: returnData.quantity,
                reason: returnData.reason,
                refund_amount: returnData.refund_amount,
                return_type: returnData.return_type, // 'refund' or 'exchange'
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating return:', error);
        throw error;
    }
}

/**
 * Process return - restore stock and update payment
 * @param {string} returnId - Return record ID
 * @returns {Promise<boolean>} Success status
 */
async function processReturn(returnId) {
    try {
        // Get return record
        const { data: returnRecord, error: returnError } = await supabaseClient
            .from('returns')
            .select('*')
            .eq('id', returnId)
            .single();

        if (returnError) throw returnError;
        if (!returnRecord) throw new Error('Return record not found');
        if (returnRecord.status === 'processed') throw new Error('Return already processed');

        // Get payment record
        const { data: payment, error: paymentError } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('id', returnRecord.payment_id)
            .single();

        if (paymentError) throw paymentError;
        if (!payment) throw new Error('Payment record not found');

        // Get product record
        const { data: product, error: productError } = await supabaseClient
            .from('products')
            .select('stok')
            .eq('id', returnRecord.product_id)
            .single();

        if (productError) throw productError;
        if (!product) throw new Error('Product not found');

        // Restore stock
        const newStock = product.stok + returnRecord.quantity;
        const { error: stockError } = await supabaseClient
            .from('products')
            .update({ stok: newStock })
            .eq('id', returnRecord.product_id);

        if (stockError) throw stockError;

        // Update payment if refund
        if (returnRecord.return_type === 'refund') {
            const newPaidAmount = Math.max(0, payment.paid_amount - returnRecord.refund_amount);
            const newRemainingAmount = payment.remaining_amount + returnRecord.refund_amount;
            
            let newStatus = payment.status;
            if (newPaidAmount === 0 && newRemainingAmount > 0) {
                newStatus = 'pending';
            } else if (newPaidAmount > 0 && newRemainingAmount > 0) {
                newStatus = 'partial';
            }

            const { error: paymentUpdateError } = await supabaseClient
                .from('payments')
                .update({
                    paid_amount: newPaidAmount,
                    remaining_amount: newRemainingAmount,
                    status: newStatus
                })
                .eq('id', payment.id);

            if (paymentUpdateError) throw paymentUpdateError;
        }

        // Update return status
        const { error: returnUpdateError } = await supabaseClient
            .from('returns')
            .update({
                status: 'processed',
                processed_at: new Date().toISOString()
            })
            .eq('id', returnId);

        if (returnUpdateError) throw returnUpdateError;

        return true;
    } catch (error) {
        console.error('Error processing return:', error);
        throw error;
    }
}

/**
 * Get all returns
 * @param {Object} filters - Optional filters (status, date range)
 * @returns {Promise<Array>} Returns list
 */
async function getReturns(filters = {}) {
    try {
        let query = supabaseClient.from('returns').select(`
            *,
            payments (
                invoice_number,
                total_harga,
                buyer,
                method
            ),
            products (
                nama_barang,
                kategori,
                ukuran
            )
        `);

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate.toISOString());
        }

        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate.toISOString());
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting returns:', error);
        throw error;
    }
}

/**
 * Get return by ID
 * @param {string} returnId - Return record ID
 * @returns {Promise<Object>} Return record
 */
async function getReturnById(returnId) {
    try {
        const { data, error } = await supabaseClient
            .from('returns')
            .select(`
                *,
                payments (
                    invoice_number,
                    total_harga,
                    buyer,
                    method,
                    created_at
                ),
                products (
                    nama_barang,
                    kategori,
                    ukuran,
                    harga_jual
                )
            `)
            .eq('id', returnId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting return:', error);
        throw error;
    }
}

/**
 * Cancel return
 * @param {string} returnId - Return record ID
 * @returns {Promise<boolean>} Success status
 */
async function cancelReturn(returnId) {
    try {
        const { error } = await supabaseClient
            .from('returns')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', returnId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error cancelling return:', error);
        throw error;
    }
}

/**
 * Get return statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Return statistics
 */
async function getReturnStatistics(startDate, endDate) {
    try {
        const returns = await getReturns({ startDate, endDate });

        const totalReturns = returns.length;
        const processedReturns = returns.filter(r => r.status === 'processed').length;
        const pendingReturns = returns.filter(r => r.status === 'pending').length;
        const totalRefundAmount = returns
            .filter(r => r.return_type === 'refund' && r.status === 'processed')
            .reduce((sum, r) => sum + (parseFloat(r.refund_amount) || 0), 0);

        // Returns by reason
        const returnsByReason = {};
        returns.forEach(r => {
            const reason = r.reason || 'Other';
            if (!returnsByReason[reason]) {
                returnsByReason[reason] = 0;
            }
            returnsByReason[reason]++;
        });

        return {
            totalReturns,
            processedReturns,
            pendingReturns,
            totalRefundAmount,
            returnsByReason,
            returnRate: totalReturns > 0 ? (processedReturns / totalReturns) * 100 : 0
        };
    } catch (error) {
        console.error('Error getting return statistics:', error);
        throw error;
    }
}

// Export functions for global access
window.ReturnsManagement = {
    createReturn,
    processReturn,
    getReturns,
    getReturnById,
    cancelReturn,
    getReturnStatistics
};
