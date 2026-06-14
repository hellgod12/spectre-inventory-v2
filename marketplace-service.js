// Marketplace Service Layer
// Business logic for marketplace accounting system
// Uses repository functions from marketplace-repository.js

// ============================================
// ORDER PROCESSING
// ============================================

/**
 * Process order import from marketplace
 * @param {Object} orderData - Order data from marketplace
 * @param {string} marketplaceAccountId - Marketplace account UUID
 * @returns {Promise<Object>} Processed order with items and fees
 */
async function processOrderImport(orderData, marketplaceAccountId) {
    try {
        // Validate order data
        const validation = validateOrderData(orderData);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Check if order already exists
        const existingOrder = await getOnlineOrderByOrderNumber(
            orderData.order_number,
            marketplaceAccountId
        );
        
        if (existingOrder) {
            throw new Error(`Order ${orderData.order_number} already exists`);
        }

        // Calculate order totals
        const calculatedTotals = await calculateOrderTotals(orderData.items, orderData.fees);

        // Create online order
        const order = await createOnlineOrder({
            marketplace_account_id: marketplaceAccountId,
            order_number: orderData.order_number,
            platform_order_id: orderData.platform_order_id || null,
            customer_name: orderData.customer_name || null,
            customer_phone: orderData.customer_phone || null,
            shipping_address: orderData.shipping_address || null,
            order_date: orderData.order_date || new Date().toISOString(),
            order_status: orderData.order_status || 'PENDING',
            gross_sales: calculatedTotals.gross_sales,
            voucher_discount: calculatedTotals.voucher_discount,
            platform_fee: calculatedTotals.platform_fee,
            shipping_fee: calculatedTotals.shipping_fee
        });

        // Create order items
        if (orderData.items && orderData.items.length > 0) {
            const itemsWithOrderId = orderData.items.map(item => ({
                ...item,
                online_order_id: order.id
            }));
            await createOrderItemsBatch(itemsWithOrderId);
        }

        // Create marketplace fees
        if (orderData.fees && orderData.fees.length > 0) {
            const feesWithOrderId = orderData.fees.map(fee => ({
                ...fee,
                online_order_id: order.id
            }));
            await createFeesBatch(feesWithOrderId);
        }

        // Check stock availability
        const stockCheck = await checkStockAvailability(orderData.items);
        if (!stockCheck.available) {
            console.warn('Stock availability warning:', stockCheck.warnings);
        }

        return {
            success: true,
            order: order,
            stock_check: stockCheck
        };
    } catch (error) {
        console.error('Error processing order import:', error);
        throw error;
    }
}

/**
 * Validate order data before import
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result
 */
function validateOrderData(orderData) {
    const errors = [];

    if (!orderData.order_number) {
        errors.push('Order number is required');
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        errors.push('Order must have at least one item');
    }

    if (orderData.items) {
        orderData.items.forEach((item, index) => {
            if (!item.product_name) {
                errors.push(`Item ${index + 1}: Product name is required`);
            }
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
            }
            if (!item.unit_price || item.unit_price < 0) {
                errors.push(`Item ${index + 1}: Unit price must be greater than or equal to 0`);
            }
        });
    }

    if (orderData.fees) {
        orderData.fees.forEach((fee, index) => {
            if (!fee.fee_type) {
                errors.push(`Fee ${index + 1}: Fee type is required`);
            }
            if (!fee.fee_amount || fee.fee_amount < 0) {
                errors.push(`Fee ${index + 1}: Fee amount must be greater than or equal to 0`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        error: errors.length > 0 ? errors.join('; ') : null
    };
}

/**
 * Calculate order totals from items and fees
 * @param {Array} items - Order items
 * @param {Array} fees - Marketplace fees
 * @returns {Object} Calculated totals
 */
async function calculateOrderTotals(items, fees) {
    const gross_sales = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
    }, 0);

    const voucher_discount = 0; // Can be calculated from order data if needed

    const platform_fee = fees.reduce((sum, fee) => {
        return sum + (fee.fee_amount || 0);
    }, 0);

    const shipping_fee = 0; // Can be calculated from order data if needed

    return {
        gross_sales,
        voucher_discount,
        platform_fee,
        shipping_fee
    };
}

/**
 * Sync stock for online order
 * @param {string} onlineOrderId - Online order UUID
 * @returns {Promise<boolean>} Success status
 */
async function syncOrderStock(onlineOrderId) {
    try {
        const order = await getOnlineOrderById(onlineOrderId);
        
        if (!order.items || order.items.length === 0) {
            return true;
        }

        for (const item of order.items) {
            if (item.product_id && item.products) {
                const currentStock = item.products.stok || 0;
                const newStock = currentStock - item.quantity;

                if (newStock < 0) {
                    throw new Error(`Insufficient stock for ${item.products.nama_barang}. Current: ${currentStock}, Required: ${item.quantity}`);
                }

                const { error } = await supabaseClient
                    .from('products')
                    .update({ stok: newStock })
                    .eq('id', item.product_id);

                if (error) throw error;
            }
        }

        return true;
    } catch (error) {
        console.error('Error syncing order stock:', error);
        throw error;
    }
}

// ============================================
// FEE CALCULATIONS
// ============================================

/**
 * Calculate platform fees based on platform rules
 * @param {string} platform - Platform name (SHOPEE, TIKTOK, TOKOPEDIA, LAZADA)
 * @param {number} grossSales - Gross sales amount
 * @param {Object} orderData - Additional order data
 * @returns {Promise<Array>} Array of fee objects
 */
async function calculatePlatformFees(platform, grossSales, orderData = {}) {
    const feeStructures = {
        SHOPEE: getShopeeFeeStructure,
        TIKTOK: getTikTokFeeStructure,
        TOKOPEDIA: getTokopediaFeeStructure,
        LAZADA: getLazadaFeeStructure
    };

    const calculateFunction = feeStructures[platform];
    if (!calculateFunction) {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    return calculateFunction(grossSales, orderData);
}

/**
 * Get Shopee fee structure
 * @param {number} grossSales - Gross sales amount
 * @param {Object} orderData - Additional order data
 * @returns {Array} Array of fee objects
 */
function getShopeeFeeStructure(grossSales, orderData = {}) {
    const fees = [];

    // Platform fee (typically 5-6%)
    const platformFeeRate = 0.05;
    const platformFee = grossSales * platformFeeRate;
    fees.push({
        fee_type: 'COMMISSION',
        fee_name: 'Platform Fee',
        fee_amount: platformFee,
        fee_percentage: platformFeeRate * 100
    });

    // Transaction fee (typically 1-2%)
    const transactionFeeRate = 0.01;
    const transactionFee = grossSales * transactionFeeRate;
    fees.push({
        fee_type: 'TRANSACTION_FEE',
        fee_name: 'Transaction Fee',
        fee_amount: transactionFee,
        fee_percentage: transactionFeeRate * 100
    });

    // Service fee (typically 2%)
    const serviceFeeRate = 0.02;
    const serviceFee = grossSales * serviceFeeRate;
    fees.push({
        fee_type: 'SERVICE_FEE',
        fee_name: 'Service Fee',
        fee_amount: serviceFee,
        fee_percentage: serviceFeeRate * 100
    });

    return fees;
}

/**
 * Get TikTok Shop fee structure
 * @param {number} grossSales - Gross sales amount
 * @param {Object} orderData - Additional order data
 * @returns {Array} Array of fee objects
 */
function getTikTokFeeStructure(grossSales, orderData = {}) {
    const fees = [];

    // Commission fee (typically 5%)
    const commissionRate = 0.05;
    const commission = grossSales * commissionRate;
    fees.push({
        fee_type: 'COMMISSION',
        fee_name: 'Commission Fee',
        fee_amount: commission,
        fee_percentage: commissionRate * 100
    });

    // Payment fee (typically 1%)
    const paymentFeeRate = 0.01;
    const paymentFee = grossSales * paymentFeeRate;
    fees.push({
        fee_type: 'TRANSACTION_FEE',
        fee_name: 'Payment Fee',
        fee_amount: paymentFee,
        fee_percentage: paymentFeeRate * 100
    });

    return fees;
}

/**
 * Get Tokopedia fee structure
 * @param {number} grossSales - Gross sales amount
 * @param {Object} orderData - Additional order data
 * @returns {Array} Array of fee objects
 */
function getTokopediaFeeStructure(grossSales, orderData = {}) {
    const fees = [];

    // Commission fee (typically 5%)
    const commissionRate = 0.05;
    const commission = grossSales * commissionRate;
    fees.push({
        fee_type: 'COMMISSION',
        fee_name: 'Commission Fee',
        fee_amount: commission,
        fee_percentage: commissionRate * 100
    });

    // Transaction fee (typically 1%)
    const transactionFeeRate = 0.01;
    const transactionFee = grossSales * transactionFeeRate;
    fees.push({
        fee_type: 'TRANSACTION_FEE',
        fee_name: 'Transaction Fee',
        fee_amount: transactionFee,
        fee_percentage: transactionFeeRate * 100
    });

    return fees;
}

/**
 * Get Lazada fee structure
 * @param {number} grossSales - Gross sales amount
 * @param {Object} orderData - Additional order data
 * @returns {Array} Array of fee objects
 */
function getLazadaFeeStructure(grossSales, orderData = {}) {
    const fees = [];

    // Commission fee (typically 4-6%)
    const commissionRate = 0.05;
    const commission = grossSales * commissionRate;
    fees.push({
        fee_type: 'COMMISSION',
        fee_name: 'Commission Fee',
        fee_amount: commission,
        fee_percentage: commissionRate * 100
    });

    // Payment fee (typically 1-2%)
    const paymentFeeRate = 0.015;
    const paymentFee = grossSales * paymentFeeRate;
    fees.push({
        fee_type: 'TRANSACTION_FEE',
        fee_name: 'Payment Fee',
        fee_amount: paymentFee,
        fee_percentage: paymentFeeRate * 100
    });

    return fees;
}

// ============================================
// REVENUE CALCULATIONS
// ============================================

/**
 * Calculate net revenue from order data
 * @param {number} grossSales - Gross sales amount
 * @param {number} voucherDiscount - Voucher discount amount
 * @param {number} platformFees - Total platform fees
 * @returns {number} Net revenue
 */
function calculateNetRevenue(grossSales, voucherDiscount, platformFees) {
    return grossSales - voucherDiscount - platformFees;
}

/**
 * Calculate profit margin for order
 * @param {number} netRevenue - Net revenue amount
 * @param {number} productCosts - Total product costs
 * @returns {Object} Profit margin data
 */
function calculateProfitMargin(netRevenue, productCosts) {
    const profit = netRevenue - productCosts;
    const margin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

    return {
        profit,
        margin,
        margin_percentage: margin
    };
}

/**
 * Calculate channel profitability for marketplace
 * @param {string} marketplaceAccountId - Marketplace account UUID
 * @param {Object} period - Period with start and end dates
 * @returns {Promise<Object>} Channel profitability data
 */
async function calculateChannelProfitability(marketplaceAccountId, period) {
    try {
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);

        const orders = await getOnlineOrders({
            marketplace_account_id: marketplaceAccountId,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
        });

        let totalGrossSales = 0;
        let totalNetRevenue = 0;
        let totalProductCosts = 0;
        let totalPlatformFees = 0;

        for (const order of orders) {
            const orderDetails = await getOnlineOrderById(order.id);
            
            totalGrossSales += parseFloat(order.gross_sales || 0);
            totalNetRevenue += parseFloat(order.net_revenue || 0);
            totalPlatformFees += parseFloat(order.platform_fee || 0);

            // Calculate product costs from order items
            for (const item of orderDetails.items) {
                if (item.products) {
                    const productCost = (item.products.harga_modal || 0) * item.quantity;
                    totalProductCosts += productCost;
                }
            }
        }

        const totalProfit = totalNetRevenue - totalProductCosts;
        const profitMargin = totalNetRevenue > 0 ? (totalProfit / totalNetRevenue) * 100 : 0;

        return {
            marketplace_account_id: marketplaceAccountId,
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            summary: {
                total_orders: orders.length,
                total_gross_sales: totalGrossSales,
                total_net_revenue: totalNetRevenue,
                total_product_costs: totalProductCosts,
                total_platform_fees: totalPlatformFees,
                total_profit: totalProfit,
                profit_margin: profitMargin
            }
        };
    } catch (error) {
        console.error('Error calculating channel profitability:', error);
        throw error;
    }
}

// ============================================
// SETTLEMENT LOGIC
// ============================================

/**
 * Reconcile settlement with orders
 * @param {Object} settlementData - Settlement data from marketplace
 * @returns {Promise<Object>} Reconciliation result
 */
async function reconcileSettlement(settlementData) {
    try {
        // Create settlement record
        const settlement = await createSettlement({
            marketplace_account_id: settlementData.marketplace_account_id,
            settlement_id: settlementData.settlement_id,
            settlement_date: settlementData.settlement_date,
            period_start: settlementData.period_start,
            period_end: settlementData.period_end,
            total_amount: settlementData.total_amount,
            order_count: settlementData.order_count || 0,
            status: 'PROCESSING',
            notes: settlementData.notes || null
        });

        // Match orders to settlement
        const matchedOrders = await matchOrdersToSettlement(
            settlement.id,
            settlementData.order_ids || []
        );

        // Calculate discrepancies
        const discrepancies = await calculateSettlementDiscrepancies(settlement.id);

        // Update settlement status based on reconciliation
        const finalStatus = discrepancies.is_reconciled ? 'COMPLETED' : 'FAILED';
        const finalNotes = discrepancies.is_reconciled 
            ? 'Settlement reconciled successfully' 
            : `Discrepancy: ${discrepancies.discrepancy}`;

        await updateSettlement(settlement.id, {
            status: finalStatus,
            notes: finalNotes
        });

        return {
            success: true,
            settlement,
            matched_orders: matchedOrders,
            discrepancies
        };
    } catch (error) {
        console.error('Error reconciling settlement:', error);
        throw error;
    }
}

/**
 * Match orders to settlement
 * @param {string} settlementId - Settlement UUID
 * @param {Array} orderIds - Array of order UUIDs
 * @returns {Promise<Array>} Matched orders
 */
async function matchOrdersToSettlement(settlementId, orderIds) {
    try {
        const settlement = await getSettlementById(settlementId);
        const matchedOrders = [];

        for (const orderId of orderIds) {
            const order = await getOnlineOrderById(orderId);
            
            // Update order settlement status
            await updateSettlementStatus(
                orderId,
                'SETTLED',
                settlement.settlement_date
            );

            matchedOrders.push(order);
        }

        return matchedOrders;
    } catch (error) {
        console.error('Error matching orders to settlement:', error);
        throw error;
    }
}

/**
 * Calculate settlement discrepancies
 * @param {string} settlementId - Settlement UUID
 * @returns {Promise<Object>} Discrepancy data
 */
async function calculateSettlementDiscrepancies(settlementId) {
    try {
        const reconciliation = await getSettlementReconciliation(settlementId);
        
        return {
            settlement_total: reconciliation.settlement_total,
            calculated_total: reconciliation.calculated_total,
            discrepancy: reconciliation.discrepancy,
            is_reconciled: reconciliation.is_reconciled
        };
    } catch (error) {
        console.error('Error calculating settlement discrepancies:', error);
        throw error;
    }
}

// ============================================
// STOCK MANAGEMENT
// ============================================

/**
 * Reserve stock for order
 * @param {Array} orderItems - Array of order items
 * @returns {Promise<Object>} Stock reservation result
 */
async function reserveStockForOrder(orderItems) {
    try {
        const reservations = [];
        const warnings = [];

        for (const item of orderItems) {
            if (item.product_id) {
                const { data: product } = await supabaseClient
                    .from('products')
                    .select('id, nama_barang, stok')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    const currentStock = product.stok || 0;
                    const requiredStock = item.quantity;
                    
                    if (currentStock < requiredStock) {
                        warnings.push({
                            product_id: item.product_id,
                            product_name: product.nama_barang,
                            current_stock: currentStock,
                            required_stock: requiredStock,
                            shortage: requiredStock - currentStock
                        });
                    }

                    reservations.push({
                        product_id: item.product_id,
                        product_name: product.nama_barang,
                        current_stock: currentStock,
                        required_stock: requiredStock,
                        available: currentStock >= requiredStock
                    });
                }
            }
        }

        return {
            success: warnings.length === 0,
            reservations,
            warnings,
            available: warnings.length === 0
        };
    } catch (error) {
        console.error('Error reserving stock for order:', error);
        throw error;
    }
}

/**
 * Release stock for cancelled order
 * @param {Array} orderItems - Array of order items
 * @returns {Promise<boolean>} Success status
 */
async function releaseStockForOrder(orderItems) {
    try {
        for (const item of orderItems) {
            if (item.product_id) {
                const { data: product } = await supabaseClient
                    .from('products')
                    .select('stok')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    const newStock = (product.stok || 0) + item.quantity;
                    
                    const { error } = await supabaseClient
                        .from('products')
                        .update({ stok: newStock })
                        .eq('id', item.product_id);

                    if (error) throw error;
                }
            }
        }

        return true;
    } catch (error) {
        console.error('Error releasing stock for order:', error);
        throw error;
    }
}

/**
 * Check stock availability for order items
 * @param {Array} orderItems - Array of order items
 * @returns {Promise<Object>} Stock availability result
 */
async function checkStockAvailability(orderItems) {
    try {
        const warnings = [];
        let available = true;

        for (const item of orderItems) {
            if (item.product_id) {
                const { data: product } = await supabaseClient
                    .from('products')
                    .select('id, nama_barang, stok')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    const currentStock = product.stok || 0;
                    const requiredStock = item.quantity;
                    
                    if (currentStock < requiredStock) {
                        available = false;
                        warnings.push({
                            product_id: item.product_id,
                            product_name: product.nama_barang,
                            current_stock: currentStock,
                            required_stock: requiredStock,
                            shortage: requiredStock - currentStock
                        });
                    }
                }
            }
        }

        return {
            available,
            warnings
        };
    } catch (error) {
        console.error('Error checking stock availability:', error);
        throw error;
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Order Processing
        processOrderImport,
        validateOrderData,
        calculateOrderTotals,
        syncOrderStock,
        // Fee Calculations
        calculatePlatformFees,
        getShopeeFeeStructure,
        getTikTokFeeStructure,
        getTokopediaFeeStructure,
        getLazadaFeeStructure,
        // Revenue Calculations
        calculateNetRevenue,
        calculateProfitMargin,
        calculateChannelProfitability,
        // Settlement Logic
        reconcileSettlement,
        matchOrdersToSettlement,
        calculateSettlementDiscrepancies,
        // Stock Management
        reserveStockForOrder,
        releaseStockForOrder,
        checkStockAvailability
    };
}
