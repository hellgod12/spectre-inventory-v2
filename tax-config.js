// Tax Configuration Module for SPECTRE POS
// Handles tax rates, tax calculations, and tax reporting

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[tax-config.js] supabaseClient not initialized. Ensure auth.js is loaded before tax-config.js');
}

/**
 * Get current tax configuration
 * @returns {Promise<Object>} Tax configuration
 */
async function getTaxConfig() {
    try {
        // Try to get from settings table first
        const { data: settings, error } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('key', 'tax_config')
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (settings) {
            try {
                return JSON.parse(settings.value);
            } catch (err) {
                console.error('[tax-config.js] Failed to parse tax_config JSON:', err);
                // Return default configuration if parsing fails
                return {
                    taxRate: 11,
                    taxEnabled: true,
                    taxIncluded: false,
                    taxName: 'PPN',
                    taxNumber: null,
                    rounding: 'nearest',
                    exemptCategories: []
                };
            }
        }

        // Return default configuration
        return {
            taxRate: 11, // Default Indonesian VAT (PPN) rate
            taxEnabled: true,
            taxIncluded: false, // Tax not included in displayed prices
            taxName: 'PPN',
            taxNumber: null, // Tax ID number
            rounding: 'nearest', // 'up', 'down', 'nearest'
            exemptCategories: [] // Categories exempt from tax
        };
    } catch (error) {
        console.error('Error getting tax config:', error);
        throw error;
    }
}

/**
 * Update tax configuration
 * @param {Object} config - Tax configuration
 * @returns {Promise<boolean>} Success status
 */
async function updateTaxConfig(config) {
    try {
        const { error } = await supabaseClient
            .from('settings')
            .upsert([{
                key: 'tax_config',
                value: JSON.stringify(config),
                updated_at: new Date().toISOString()
            }], {
                onConflict: 'key'
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating tax config:', error);
        throw error;
    }
}

/**
 * Calculate tax amount
 * @param {number} amount - Amount before tax
 * @param {string} category - Product category (optional)
 * @returns {Promise<Object>} Tax calculation result
 */
async function calculateTax(amount, category = null) {
    try {
        const config = await getTaxConfig();

        if (!config.taxEnabled) {
            return {
                taxAmount: 0,
                taxRate: 0,
                totalWithTax: amount,
                taxIncluded: false
            };
        }

        // Check if category is exempt
        if (category && config.exemptCategories && config.exemptCategories.includes(category)) {
            return {
                taxAmount: 0,
                taxRate: 0,
                totalWithTax: amount,
                taxExempt: true,
                exemptReason: 'Category exempt from tax'
            };
        }

        const taxRate = config.taxRate / 100;
        let taxAmount = amount * taxRate;

        // Apply rounding
        if (config.rounding === 'up') {
            taxAmount = Math.ceil(taxAmount);
        } else if (config.rounding === 'down') {
            taxAmount = Math.floor(taxAmount);
        } else {
            taxAmount = Math.round(taxAmount);
        }

        const totalWithTax = config.taxIncluded ? amount : amount + taxAmount;

        return {
            taxAmount,
            taxRate: config.taxRate,
            totalWithTax,
            taxIncluded: config.taxIncluded,
            taxName: config.taxName
        };
    } catch (error) {
        console.error('Error calculating tax:', error);
        throw error;
    }
}

/**
 * Calculate tax for cart items
 * @param {Array} cartItems - Cart items with price and quantity
 * @returns {Promise<Object>} Tax calculation for cart
 */
async function calculateCartTax(cartItems) {
    try {
        const config = await getTaxConfig();

        if (!config.taxEnabled) {
            return {
                subtotal: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                totalTax: 0,
                totalWithTax: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                taxRate: 0,
                taxDetails: []
            };
        }

        let subtotal = 0;
        let totalTax = 0;
        const taxDetails = [];

        for (const item of cartItems) {
            const itemSubtotal = item.price * item.quantity;
            const taxCalc = await calculateTax(itemSubtotal, item.category);
            
            subtotal += itemSubtotal;
            totalTax += taxCalc.taxAmount;

            taxDetails.push({
                productName: item.name,
                subtotal: itemSubtotal,
                taxAmount: taxCalc.taxAmount,
                taxRate: taxCalc.taxRate,
                taxExempt: taxCalc.taxExempt || false
            });
        }

        const totalWithTax = config.taxIncluded ? subtotal : subtotal + totalTax;

        return {
            subtotal,
            totalTax,
            totalWithTax,
            taxRate: config.taxRate,
            taxDetails
        };
    } catch (error) {
        console.error('Error calculating cart tax:', error);
        throw error;
    }
}

/**
 * Get tax report for date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Tax report
 */
async function getTaxReport(startDate, endDate) {
    try {
        const config = await getTaxConfig();

        // Get payments within date range
        const { data: payments, error } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('status', 'paid')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) throw error;

        let totalSales = 0;
        let totalTax = 0;

        (payments || []).forEach(payment => {
            const amount = parseFloat(payment.total_harga || 0);
            const taxCalc = calculateTaxSync(amount, config);
            
            totalSales += amount;
            totalTax += taxCalc.taxAmount;
        });

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            config: {
                taxRate: config.taxRate,
                taxName: config.taxName,
                taxEnabled: config.taxEnabled
            },
            summary: {
                totalSales,
                totalTax,
                taxRate: config.taxRate,
                netSales: totalSales - totalTax
            },
            transactionCount: payments ? payments.length : 0
        };
    } catch (error) {
        console.error('Error getting tax report:', error);
        throw error;
    }
}

/**
 * Synchronous tax calculation (for reports)
 * @param {number} amount - Amount
 * @param {Object} config - Tax configuration
 * @returns {Object} Tax calculation
 */
function calculateTaxSync(amount, config) {
    if (!config.taxEnabled) {
        return {
            taxAmount: 0,
            taxRate: 0,
            totalWithTax: amount
        };
    }

    const taxRate = config.taxRate / 100;
    let taxAmount = amount * taxRate;

    // Apply rounding
    if (config.rounding === 'up') {
        taxAmount = Math.ceil(taxAmount);
    } else if (config.rounding === 'down') {
        taxAmount = Math.floor(taxAmount);
    } else {
        taxAmount = Math.round(taxAmount);
    }

    return {
        taxAmount,
        taxRate: config.taxRate,
        totalWithTax: config.taxIncluded ? amount : amount + taxAmount
    };
}

/**
 * Export tax report to CSV
 * @param {Object} report - Tax report data
 * @returns {string} CSV formatted string
 */
function exportTaxReportToCSV(report) {
    const headers = ['Date', 'Invoice', 'Product', 'Amount', 'Tax Amount', 'Tax Rate', 'Total with Tax'];
    
    // Note: This would need actual transaction data to be complete
    const rows = [
        ['Period', report.period.start, 'to', report.period.end],
        ['Tax Rate', report.config.taxRate + '%'],
        ['Total Sales', report.summary.totalSales],
        ['Total Tax', report.summary.totalTax],
        ['Net Sales', report.summary.netSales],
        ['Transaction Count', report.transactionCount]
    ];

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

// Export functions for global access
window.TaxConfig = {
    getTaxConfig,
    updateTaxConfig,
    calculateTax,
    calculateCartTax,
    getTaxReport,
    calculateTaxSync,
    exportTaxReportToCSV
};
