// Combined POS + Marketplace Reporting
// Integrates existing POS data with new marketplace data
// Uses existing supabaseClient from auth.js

// ============================================
// COMBINED REVENUE REPORTING
// ============================================

/**
 * Get combined revenue from POS and marketplace
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Combined revenue data
 */
async function getCombinedRevenueReport(startDate, endDate) {
    try {
        // Get POS revenue from payments table
        const { data: posPayments, error: posError } = await supabaseClient
            .from('payments')
            .select('total_harga, paid_amount, created_at')
            .eq('status', 'paid')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (posError) throw posError;

        // Get marketplace revenue
        const marketplaceSummary = await getMarketplaceRevenueSummary(startDate, endDate);

        // Calculate POS totals
        const posGrossSales = (posPayments || []).reduce((sum, payment) => {
            return sum + parseFloat(payment.total_harga || 0);
        }, 0);

        const posPaidAmount = (posPayments || []).reduce((sum, payment) => {
            return sum + parseFloat(payment.paid_amount || 0);
        }, 0);

        // Calculate combined totals
        const totalGrossSales = posGrossSales + marketplaceSummary.total_gross_sales;
        const totalNetRevenue = posPaidAmount + marketplaceSummary.total_net_revenue;
        const totalPlatformFees = marketplaceSummary.total_platform_fee;

        // Calculate channel percentages
        const posPercentage = totalGrossSales > 0 ? (posGrossSales / totalGrossSales) * 100 : 0;
        const marketplacePercentage = totalGrossSales > 0 ? (marketplaceSummary.total_gross_sales / totalGrossSales) * 100 : 0;

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            pos: {
                gross_sales: posGrossSales,
                paid_amount: posPaidAmount,
                order_count: posPayments?.length || 0,
                percentage: posPercentage
            },
            marketplace: {
                gross_sales: marketplaceSummary.total_gross_sales,
                voucher_discount: marketplaceSummary.total_voucher_discount,
                platform_fee: marketplaceSummary.total_platform_fee,
                shipping_fee: marketplaceSummary.total_shipping_fee,
                net_revenue: marketplaceSummary.total_net_revenue,
                order_count: Object.values(marketplaceSummary.by_platform).reduce((sum, p) => sum + p.order_count, 0),
                percentage: marketplacePercentage,
                by_platform: marketplaceSummary.by_platform
            },
            combined: {
                total_gross_sales: totalGrossSales,
                total_net_revenue: totalNetRevenue,
                total_platform_fees: totalPlatformFees,
                total_orders: (posPayments?.length || 0) + Object.values(marketplaceSummary.by_platform).reduce((sum, p) => sum + p.order_count, 0)
            }
        };
    } catch (error) {
        console.error('Error generating combined revenue report:', error);
        throw error;
    }
}

/**
 * Get combined profit report
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Combined profit data
 */
async function getCombinedProfitReport(startDate, endDate) {
    try {
        // Get POS sales history for cost calculation
        const { data: posSalesHistory, error: posError } = await supabaseClient
            .from('sales_history')
            .select(`
                jumlah,
                total_harga,
                products (
                    harga_modal
                )
            `)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (posError) throw posError;

        // Calculate POS costs and revenue
        let posRevenue = 0;
        let posCost = 0;

        (posSalesHistory || []).forEach(sale => {
            const revenue = parseFloat(sale.total_harga || 0);
            const cost = parseFloat(sale.products?.harga_modal || 0) * sale.jumlah;
            posRevenue += revenue;
            posCost += cost;
        });

        const posProfit = posRevenue - posCost;
        const posMargin = posRevenue > 0 ? (posProfit / posRevenue) * 100 : 0;

        // Get marketplace data
        const marketplaceRevenue = await getMarketplaceRevenueSummary(startDate, endDate);
        
        // Calculate marketplace costs from order items
        const { data: marketplaceOrderItems, error: itemsError } = await supabaseClient
            .from('order_items')
            .select(`
                quantity,
                unit_price,
                online_orders (
                    order_date,
                    marketplace_accounts (
                        platform
                    )
                ),
                products (
                    harga_modal
                )
            `)
            .gte('online_orders.order_date', startDate.toISOString())
            .lte('online_orders.order_date', endDate.toISOString());

        if (itemsError) throw itemsError;

        let marketplaceCost = 0;
        const marketplaceCostByPlatform = {};

        (marketplaceOrderItems || []).forEach(item => {
            const platform = item.online_orders?.marketplace_accounts?.platform || 'UNKNOWN';
            const cost = parseFloat(item.products?.harga_modal || 0) * item.quantity;
            marketplaceCost += cost;

            if (!marketplaceCostByPlatform[platform]) {
                marketplaceCostByPlatform[platform] = 0;
            }
            marketplaceCostByPlatform[platform] += cost;
        });

        const marketplaceRevenueTotal = marketplaceRevenue.total_net_revenue;
        const marketplaceProfit = marketplaceRevenueTotal - marketplaceCost;
        const marketplaceMargin = marketplaceRevenueTotal > 0 ? (marketplaceProfit / marketplaceRevenueTotal) * 100 : 0;

        // Combined totals
        const totalRevenue = posRevenue + marketplaceRevenueTotal;
        const totalCost = posCost + marketplaceCost;
        const totalProfit = posProfit + marketplaceProfit;
        const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            pos: {
                revenue: posRevenue,
                cost: posCost,
                profit: posProfit,
                margin: posMargin
            },
            marketplace: {
                revenue: marketplaceRevenueTotal,
                cost: marketplaceCost,
                cost_by_platform: marketplaceCostByPlatform,
                profit: marketplaceProfit,
                margin: marketplaceMargin,
                by_platform: marketplaceRevenue.by_platform
            },
            combined: {
                total_revenue: totalRevenue,
                total_cost: totalCost,
                total_profit: totalProfit,
                total_margin: totalMargin
            }
        };
    } catch (error) {
        console.error('Error generating combined profit report:', error);
        throw error;
    }
}

/**
 * Get combined order statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Combined order statistics
 */
async function getCombinedOrderStatistics(startDate, endDate) {
    try {
        // Get POS order count from payments
        const { data: posPayments, error: posError } = await supabaseClient
            .from('payments')
            .select('id, status, created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (posError) throw posError;

        const posTotalOrders = posPayments?.length || 0;
        const posPaidOrders = (posPayments || []).filter(p => p.status === 'paid').length;
        const posPendingOrders = (posPayments || []).filter(p => p.status === 'pending' || p.status === 'partial').length;

        // Get marketplace order statistics
        const { data: marketplaceOrders, error: mpError } = await supabaseClient
            .from('online_orders')
            .select(`
                order_status,
                marketplace_accounts (
                    platform
                )
            `)
            .gte('order_date', startDate.toISOString())
            .lte('order_date', endDate.toISOString());

        if (mpError) throw mpError;

        const marketplaceTotalOrders = marketplaceOrders?.length || 0;
        const marketplaceByStatus = {
            PENDING: 0,
            PROCESSING: 0,
            SHIPPED: 0,
            DELIVERED: 0,
            CANCELLED: 0,
            RETURNED: 0
        };
        const marketplaceByPlatform = {};

        (marketplaceOrders || []).forEach(order => {
            const platform = order.marketplace_accounts?.platform || 'UNKNOWN';
            marketplaceByStatus[order.order_status] = (marketplaceByStatus[order.order_status] || 0) + 1;

            if (!marketplaceByPlatform[platform]) {
                marketplaceByPlatform[platform] = {
                    total: 0,
                    delivered: 0,
                    pending: 0
                };
            }
            marketplaceByPlatform[platform].total += 1;
            if (order.order_status === 'DELIVERED') {
                marketplaceByPlatform[platform].delivered += 1;
            }
            if (order.order_status === 'PENDING') {
                marketplaceByPlatform[platform].pending += 1;
            }
        });

        // Combined totals
        const totalOrders = posTotalOrders + marketplaceTotalOrders;
        const posPercentage = totalOrders > 0 ? (posTotalOrders / totalOrders) * 100 : 0;
        const marketplacePercentage = totalOrders > 0 ? (marketplaceTotalOrders / totalOrders) * 100 : 0;

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            pos: {
                total_orders: posTotalOrders,
                paid_orders: posPaidOrders,
                pending_orders: posPendingOrders,
                percentage: posPercentage
            },
            marketplace: {
                total_orders: marketplaceTotalOrders,
                by_status: marketplaceByStatus,
                by_platform: marketplaceByPlatform,
                percentage: marketplacePercentage
            },
            combined: {
                total_orders: totalOrders
            }
        };
    } catch (error) {
        console.error('Error generating combined order statistics:', error);
        throw error;
    }
}

/**
 * Get combined stock movement report
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Combined stock movement data
 */
async function getCombinedStockMovement(startDate, endDate) {
    try {
        // Get POS stock deductions from sales_history
        const { data: posSalesHistory, error: posError } = await supabaseClient
            .from('sales_history')
            .select('jumlah, created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (posError) throw posError;

        const posStockDeduction = (posSalesHistory || []).reduce((sum, sale) => {
            return sum + sale.jumlah;
        }, 0);

        // Get marketplace stock deductions from order_items
        const { data: marketplaceOrderItems, error: mpError } = await supabaseClient
            .from('order_items')
            .select('quantity, created_at')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (mpError) throw mpError;

        const marketplaceStockDeduction = (marketplaceOrderItems || []).reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);

        // Get total current stock
        const { data: products, error: prodError } = await supabaseClient
            .from('products')
            .select('stok');

        if (prodError) throw prodError;

        const totalCurrentStock = (products || []).reduce((sum, product) => {
            return sum + (product.stok || 0);
        }, 0);

        const totalStockDeduction = posStockDeduction + marketplaceStockDeduction;

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            pos: {
                stock_deduction: posStockDeduction
            },
            marketplace: {
                stock_deduction: marketplaceStockDeduction
            },
            combined: {
                total_stock_deduction: totalStockDeduction,
                current_total_stock: totalCurrentStock
            }
        };
    } catch (error) {
        console.error('Error generating combined stock movement report:', error);
        throw error;
    }
}

/**
 * Get dashboard KPIs combining POS and marketplace
 * @returns {Promise<Object>} Dashboard KPI data
 */
async function getCombinedDashboardKPIs() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        // Get current month revenue
        const monthlyRevenue = await getCombinedRevenueReport(startOfMonth, new Date());

        // Get current week revenue
        const weeklyRevenue = await getCombinedRevenueReport(startOfWeek, new Date());

        // Get current stock
        const { data: products } = await supabaseClient
            .from('products')
            .select('stok');

        const totalStock = (products || []).reduce((sum, p) => sum + (p.stok || 0), 0);

        // Get pending payments (POS)
        const { data: pendingPayments } = await supabaseClient
            .from('payments')
            .select('remaining_amount')
            .in('status', ['pending', 'partial']);

        const totalPendingPayments = (pendingPayments || []).reduce((sum, p) => {
            return sum + parseFloat(p.remaining_amount || 0);
        }, 0);

        // Get unsettled marketplace orders
        const { data: unsettledOrders } = await supabaseClient
            .from('online_orders')
            .select('net_revenue')
            .eq('settlement_status', 'UNSETTLED');

        const totalUnsettledRevenue = (unsettledOrders || []).reduce((sum, o) => {
            return sum + parseFloat(o.net_revenue || 0);
        }, 0);

        return {
            revenue: {
                monthly: {
                    pos: monthlyRevenue.pos.gross_sales,
                    marketplace: monthlyRevenue.marketplace.gross_sales,
                    combined: monthlyRevenue.combined.total_gross_sales
                },
                weekly: {
                    pos: weeklyRevenue.pos.gross_sales,
                    marketplace: weeklyRevenue.marketplace.gross_sales,
                    combined: weeklyRevenue.combined.total_gross_sales
                }
            },
            stock: {
                total: totalStock
            },
            pending: {
                pos_payments: totalPendingPayments,
                marketplace_revenue: totalUnsettledRevenue,
                combined: totalPendingPayments + totalUnsettledRevenue
            },
            orders: {
                pos_count: monthlyRevenue.pos.order_count,
                marketplace_count: monthlyRevenue.marketplace.order_count,
                combined: monthlyRevenue.combined.total_orders
            }
        };
    } catch (error) {
        console.error('Error generating combined dashboard KPIs:', error);
        throw error;
    }
}

/**
 * Get channel performance comparison
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Channel performance data
 */
async function getChannelPerformanceComparison(startDate, endDate) {
    try {
        const revenueReport = await getCombinedRevenueReport(startDate, endDate);
        const profitReport = await getCombinedProfitReport(startDate, endDate);
        const orderStats = await getCombinedOrderStatistics(startDate, endDate);

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            channels: [
                {
                    name: 'POS (In-Store)',
                    revenue: revenueReport.pos.gross_sales,
                    profit: profitReport.pos.profit,
                    margin: profitReport.pos.margin,
                    orders: orderStats.pos.total_orders,
                    revenue_percentage: revenueReport.pos.percentage,
                    order_percentage: orderStats.pos.percentage
                },
                {
                    name: 'Shopee',
                    revenue: revenueReport.marketplace.by_platform.SHOPEE?.gross_sales || 0,
                    profit: profitReport.marketplace.by_platform.SHOPEE ? 
                        (profitReport.marketplace.by_platform.SHOPEE.gross_sales - 
                         (profitReport.marketplace.cost_by_platform.SHOPEE || 0)) : 0,
                    margin: profitReport.marketplace.by_platform.SHOPEE ? 
                        ((profitReport.marketplace.by_platform.SHOPEE.gross_sales - 
                          (profitReport.marketplace.cost_by_platform.SHOPEE || 0)) / 
                         profitReport.marketplace.by_platform.SHOPEE.gross_sales * 100) : 0,
                    orders: revenueReport.marketplace.by_platform.SHOPEE?.order_count || 0,
                    revenue_percentage: revenueReport.marketplace.by_platform.SHOPEE ? 
                        (revenueReport.marketplace.by_platform.SHOPEE.gross_sales / revenueReport.combined.total_gross_sales * 100) : 0
                },
                {
                    name: 'TikTok Shop',
                    revenue: revenueReport.marketplace.by_platform.TIKTOK?.gross_sales || 0,
                    profit: profitReport.marketplace.by_platform.TIKTOK ? 
                        (profitReport.marketplace.by_platform.TIKTOK.gross_sales - 
                         (profitReport.marketplace.cost_by_platform.TIKTOK || 0)) : 0,
                    margin: profitReport.marketplace.by_platform.TIKTOK ? 
                        ((profitReport.marketplace.by_platform.TIKTOK.gross_sales - 
                          (profitReport.marketplace.cost_by_platform.TIKTOK || 0)) / 
                         profitReport.marketplace.by_platform.TIKTOK.gross_sales * 100) : 0,
                    orders: revenueReport.marketplace.by_platform.TIKTOK?.order_count || 0,
                    revenue_percentage: revenueReport.marketplace.by_platform.TIKTOK ? 
                        (revenueReport.marketplace.by_platform.TIKTOK.gross_sales / revenueReport.combined.total_gross_sales * 100) : 0
                },
                {
                    name: 'Tokopedia',
                    revenue: revenueReport.marketplace.by_platform.TOKOPEDIA?.gross_sales || 0,
                    profit: profitReport.marketplace.by_platform.TOKOPEDIA ? 
                        (profitReport.marketplace.by_platform.TOKOPEDIA.gross_sales - 
                         (profitReport.marketplace.cost_by_platform.TOKOPEDIA || 0)) : 0,
                    margin: profitReport.marketplace.by_platform.TOKOPEDIA ? 
                        ((profitReport.marketplace.by_platform.TOKOPEDIA.gross_sales - 
                          (profitReport.marketplace.cost_by_platform.TOKOPEDIA || 0)) / 
                         profitReport.marketplace.by_platform.TOKOPEDIA.gross_sales * 100) : 0,
                    orders: revenueReport.marketplace.by_platform.TOKOPEDIA?.order_count || 0,
                    revenue_percentage: revenueReport.marketplace.by_platform.TOKOPEDIA ? 
                        (revenueReport.marketplace.by_platform.TOKOPEDIA.gross_sales / revenueReport.combined.total_gross_sales * 100) : 0
                },
                {
                    name: 'Lazada',
                    revenue: revenueReport.marketplace.by_platform.LAZADA?.gross_sales || 0,
                    profit: profitReport.marketplace.by_platform.LAZADA ? 
                        (profitReport.marketplace.by_platform.LAZADA.gross_sales - 
                         (profitReport.marketplace.cost_by_platform.LAZADA || 0)) : 0,
                    margin: profitReport.marketplace.by_platform.LAZADA ? 
                        ((profitReport.marketplace.by_platform.LAZADA.gross_sales - 
                          (profitReport.marketplace.cost_by_platform.LAZADA || 0)) / 
                         profitReport.marketplace.by_platform.LAZADA.gross_sales * 100) : 0,
                    orders: revenueReport.marketplace.by_platform.LAZADA?.order_count || 0,
                    revenue_percentage: revenueReport.marketplace.by_platform.LAZADA ? 
                        (revenueReport.marketplace.by_platform.LAZADA.gross_sales / revenueReport.combined.total_gross_sales * 100) : 0
                }
            ]
        };
    } catch (error) {
        console.error('Error generating channel performance comparison:', error);
        throw error;
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCombinedRevenueReport,
        getCombinedProfitReport,
        getCombinedOrderStatistics,
        getCombinedStockMovement,
        getCombinedDashboardKPIs,
        getChannelPerformanceComparison
    };
}
