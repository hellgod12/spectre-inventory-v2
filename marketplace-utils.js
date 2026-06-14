// Marketplace Utility Functions
// Helper functions for marketplace operations

// ============================================
// CSV IMPORT
// ============================================

/**
 * Parse order CSV data
 * @param {string} csvData - CSV string data
 * @param {string} platform - Platform name (SHOPEE, TIKTOK, TOKOPEDIA, LAZADA)
 * @returns {Promise<Object>} Parsed order data
 */
async function parseOrderCSV(csvData, platform) {
    try {
        const lines = csvData.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV data must have at least a header row and one data row');
        }

        const headers = parseCSVLine(lines[0]);
        const validation = validateCSVHeaders(headers, platform);
        
        if (!validation.isValid) {
            throw new Error(`Invalid CSV headers: ${validation.error}`);
        }

        const orders = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const orderData = mapCSVToOrderData(headers, values, platform);
            
            if (orderData) {
                orders.push(orderData);
            }
        }

        return {
            success: true,
            platform,
            total_orders: orders.length,
            orders
        };
    } catch (error) {
        console.error('Error parsing order CSV:', error);
        throw error;
    }
}

/**
 * Parse CSV line into array of values
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    values.push(currentValue.trim());
    return values;
}

/**
 * Validate CSV headers for platform
 * @param {Array} headers - CSV headers
 * @param {string} platform - Platform name
 * @returns {Object} Validation result
 */
function validateCSVHeaders(headers, platform) {
    const requiredHeaders = {
        SHOPEE: ['order_number', 'product_name', 'quantity', 'unit_price'],
        TIKTOK: ['order_number', 'product_name', 'quantity', 'unit_price'],
        TOKOPEDIA: ['order_number', 'product_name', 'quantity', 'unit_price'],
        LAZADA: ['order_number', 'product_name', 'quantity', 'unit_price']
    };

    const required = requiredHeaders[platform] || requiredHeaders.SHOPEE;
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    const normalizedRequired = required.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));

    const missing = normalizedRequired.filter(h => !normalizedHeaders.includes(h));

    return {
        isValid: missing.length === 0,
        error: missing.length > 0 ? `Missing required headers: ${missing.join(', ')}` : null
    };
}

/**
 * Map CSV row to order data object
 * @param {Array} headers - CSV headers
 * @param {Array} values - CSV values
 * @param {string} platform - Platform name
 * @returns {Object|null} Order data object
 */
function mapCSVToOrderData(headers, values, platform) {
    try {
        const data = {};
        
        headers.forEach((header, index) => {
            const key = header.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            data[key] = values[index] || null;
        });

        // Extract order-level data
        const orderData = {
            order_number: data.order_number || data.order_id,
            platform_order_id: data.platform_order_id,
            customer_name: data.customer_name || data.buyer_name,
            customer_phone: data.customer_phone || data.buyer_phone,
            shipping_address: data.shipping_address,
            order_date: data.order_date ? new Date(data.order_date).toISOString() : new Date().toISOString(),
            order_status: data.order_status || 'PENDING',
            gross_sales: parseFloat(data.gross_sales || data.total_amount || 0),
            voucher_discount: parseFloat(data.voucher_discount || 0),
            shipping_fee: parseFloat(data.shipping_fee || 0),
            items: [],
            fees: []
        };

        // Extract item data (simplified - assumes one item per row for basic CSV)
        orderData.items.push({
            product_name: data.product_name || data.item_name,
            sku: data.sku || data.product_sku,
            quantity: parseInt(data.quantity || data.qty || 1),
            unit_price: parseFloat(data.unit_price || data.price || 0)
        });

        // Extract fee data if available
        if (data.fee_amount || data.commission) {
            orderData.fees.push({
                fee_type: data.fee_type || 'COMMISSION',
                fee_name: data.fee_name || 'Platform Fee',
                fee_amount: parseFloat(data.fee_amount || data.commission || 0),
                fee_percentage: parseFloat(data.fee_percentage || 0)
            });
        }

        return orderData;
    } catch (error) {
        console.error('Error mapping CSV to order data:', error);
        return null;
    }
}

// ============================================
// DATA VALIDATION
// ============================================

/**
 * Validate SKU format
 * @param {string} sku - SKU to validate
 * @returns {Object} Validation result
 */
function validateSKU(sku) {
    if (!sku || typeof sku !== 'string') {
        return { isValid: false, error: 'SKU is required and must be a string' };
    }

    const trimmedSKU = sku.trim().toUpperCase();
    
    if (trimmedSKU.length === 0) {
        return { isValid: false, error: 'SKU cannot be empty' };
    }

    if (trimmedSKU.length > 50) {
        return { isValid: false, error: 'SKU cannot exceed 50 characters' };
    }

    const validPattern = /^[A-Z0-9\-_]+$/;
    if (!validPattern.test(trimmedSKU)) {
        return { isValid: false, error: 'SKU can only contain letters, numbers, hyphens, and underscores' };
    }

    return { isValid: true, normalized: trimmedSKU };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required and must be a string' };
    }

    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0) {
        return { isValid: false, error: 'Email cannot be empty' };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true, normalized: trimmedEmail.toLowerCase() };
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
function validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, error: 'Phone number is required and must be a string' };
    }

    const trimmedPhone = phone.trim();
    
    if (trimmedPhone.length === 0) {
        return { isValid: false, error: 'Phone number cannot be empty' };
    }

    // Remove common prefixes and separators
    const cleanedPhone = trimmedPhone.replace(/^(\+62|0)/, '').replace(/[\s\-]/g, '');
    
    if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
        return { isValid: false, error: 'Phone number must be between 8 and 15 digits' };
    }

    const phonePattern = /^[0-9]+$/;
    if (!phonePattern.test(cleanedPhone)) {
        return { isValid: false, error: 'Phone number can only contain digits' };
    }

    return { isValid: true, normalized: cleanedPhone };
}

/**
 * Validate currency amount
 * @param {number|string} amount - Amount to validate
 * @returns {Object} Validation result
 */
function validateCurrencyAmount(amount) {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) {
        return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (numericAmount < 0) {
        return { isValid: false, error: 'Amount cannot be negative' };
    }

    if (numericAmount > 999999999999) {
        return { isValid: false, error: 'Amount is too large' };
    }

    return { isValid: true, normalized: numericAmount };
}

/**
 * Validate date format
 * @param {string|Date} date - Date to validate
 * @returns {Object} Validation result
 */
function validateDate(date) {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            return { isValid: false, error: 'Invalid date format' };
        }

        // Check if date is reasonable (not too far in past or future)
        const now = new Date();
        const minDate = new Date(now.getFullYear() - 10, 0, 1);
        const maxDate = new Date(now.getFullYear() + 2, 11, 31);

        if (dateObj < minDate || dateObj > maxDate) {
            return { isValid: false, error: 'Date is outside acceptable range' };
        }

        return { isValid: true, normalized: dateObj };
    } catch (error) {
        return { isValid: false, error: 'Invalid date format' };
    }
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Handle database error
 * @param {Error} error - Database error
 * @returns {Object} Formatted error response
 */
function handleDatabaseError(error) {
    console.error('Database error:', error);

    const errorMap = {
        '23505': { code: 'DUPLICATE_ENTRY', message: 'Record already exists' },
        '23503': { code: 'FOREIGN_KEY_VIOLATION', message: 'Referenced record does not exist' },
        '23502': { code: 'NOT_NULL_VIOLATION', message: 'Required field is missing' },
        '23514': { code: 'CHECK_VIOLATION', message: 'Data violates constraint' },
        '42501': { code: 'INSUFFICIENT_PRIVILEGE', message: 'Insufficient permissions' }
    };

    const pgError = errorMap[error.code] || { code: 'DATABASE_ERROR', message: error.message };

    return {
        success: false,
        error: pgError.code,
        message: pgError.message,
        details: error.details || null
    };
}

/**
 * Handle validation error
 * @param {Error} error - Validation error
 * @returns {Object} Formatted error response
 */
function handleValidationError(error) {
    console.error('Validation error:', error);

    return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message || 'Validation failed',
        details: error.details || null
    };
}

/**
 * Create error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Error response object
 */
function createErrorResponse(message, code = 'ERROR', details = null) {
    return {
        success: false,
        error: code,
        message,
        details,
        timestamp: new Date().toISOString()
    };
}

// ============================================
// FORMATTING
// ============================================

/**
 * Format currency as Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
        return 'Rp 0';
    }

    return 'Rp ' + numericAmount.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * Format date as Indonesian locale
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('full', 'short', 'time')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'full') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    const options = {
        full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        short: { year: 'numeric', month: '2-digit', day: '2-digit' },
        time: { hour: '2-digit', minute: '2-digit' },
        date: { year: 'numeric', month: 'long', day: 'numeric' }
    };

    return dateObj.toLocaleDateString('id-ID', options[format] || options.full);
}

/**
 * Format platform name for display
 * @param {string} platform - Platform code
 * @returns {string} Formatted platform name
 */
function formatPlatformName(platform) {
    const platformNames = {
        SHOPEE: 'Shopee',
        TIKTOK: 'TikTok Shop',
        TOKOPEDIA: 'Tokopedia',
        LAZADA: 'Lazada'
    };

    return platformNames[platform] || platform;
}

/**
 * Format order status for display
 * @param {string} status - Order status code
 * @returns {string} Formatted status name
 */
function formatOrderStatus(status) {
    const statusNames = {
        PENDING: 'Pending',
        PROCESSING: 'Processing',
        SHIPPED: 'Shipped',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
        RETURNED: 'Returned'
    };

    return statusNames[status] || status;
}

/**
 * Format settlement status for display
 * @param {string} status - Settlement status code
 * @returns {string} Formatted status name
 */
function formatSettlementStatus(status) {
    const statusNames = {
        PENDING: 'Pending',
        PROCESSING: 'Processing',
        COMPLETED: 'Completed',
        FAILED: 'Failed'
    };

    return statusNames[status] || status;
}

// ============================================
// PLATFORM HELPERS
// ============================================

/**
 * Get platform display name
 * @param {string} platform - Platform code
 * @returns {string} Display name
 */
function getPlatformDisplayName(platform) {
    return formatPlatformName(platform);
}

/**
 * Get platform color for UI
 * @param {string} platform - Platform code
 * @returns {string} CSS color code
 */
function getPlatformColor(platform) {
    const platformColors = {
        SHOPEE: '#EE4D2D',
        TIKTOK: '#000000',
        TOKOPEDIA: '#42B549',
        LAZADA: '#0F146D'
    };

    return platformColors[platform] || '#6B7280';
}

/**
 * Get platform icon (emoji or SVG reference)
 * @param {string} platform - Platform code
 * @returns {string} Platform icon
 */
function getPlatformIcon(platform) {
    const platformIcons = {
        SHOPEE: '🛒',
        TIKTOK: '🎵',
        TOKOPEDIA: '🏪',
        LAZADA: '📦'
    };

    return platformIcons[platform] || '🏪';
}

/**
 * Get platform fee structure information
 * @param {string} platform - Platform code
 * @returns {Object} Platform fee structure
 */
function getPlatformFeeStructure(platform) {
    const feeStructures = {
        SHOPEE: {
            commission_rate: 0.05,
            transaction_rate: 0.01,
            service_rate: 0.02,
            description: '5% platform fee + 1% transaction fee + 2% service fee'
        },
        TIKTOK: {
            commission_rate: 0.05,
            payment_rate: 0.01,
            description: '5% commission fee + 1% payment fee'
        },
        TOKOPEDIA: {
            commission_rate: 0.05,
            transaction_rate: 0.01,
            description: '5% commission fee + 1% transaction fee'
        },
        LAZADA: {
            commission_rate: 0.05,
            payment_rate: 0.015,
            description: '5% commission fee + 1.5% payment fee'
        }
    };

    return feeStructures[platform] || null;
}

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Transform order data for API response
 * @param {Object} order - Order object from database
 * @returns {Object} Transformed order data
 */
function transformOrderForAPI(order) {
    return {
        id: order.id,
        order_number: order.order_number,
        platform_order_id: order.platform_order_id,
        platform: order.marketplace_accounts?.platform || null,
        shop_name: order.marketplace_accounts?.shop_name || null,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        shipping_address: order.shipping_address,
        order_date: order.order_date,
        order_status: order.order_status,
        gross_sales: parseFloat(order.gross_sales || 0),
        voucher_discount: parseFloat(order.voucher_discount || 0),
        platform_fee: parseFloat(order.platform_fee || 0),
        shipping_fee: parseFloat(order.shipping_fee || 0),
        net_revenue: parseFloat(order.net_revenue || 0),
        settlement_status: order.settlement_status,
        settlement_date: order.settlement_date,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at
    };
}

/**
 * Transform settlement data for API response
 * @param {Object} settlement - Settlement object from database
 * @returns {Object} Transformed settlement data
 */
function transformSettlementForAPI(settlement) {
    return {
        id: settlement.id,
        settlement_id: settlement.settlement_id,
        platform: settlement.marketplace_accounts?.platform || null,
        shop_name: settlement.marketplace_accounts?.shop_name || null,
        settlement_date: settlement.settlement_date,
        period_start: settlement.period_start,
        period_end: settlement.period_end,
        total_amount: parseFloat(settlement.total_amount || 0),
        order_count: settlement.order_count || 0,
        status: settlement.status,
        notes: settlement.notes,
        created_at: settlement.created_at,
        updated_at: settlement.updated_at
    };
}

/**
 * Transform marketplace account for API response
 * @param {Object} account - Account object from database
 * @returns {Object} Transformed account data
 */
function transformAccountForAPI(account) {
    return {
        id: account.id,
        platform: account.platform,
        shop_name: account.shop_name,
        shop_id: account.shop_id,
        is_active: account.is_active,
        created_at: account.created_at,
        updated_at: account.updated_at
    };
}

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @returns {number} Percentage
 */
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
}

/**
 * Calculate growth rate
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Growth rate percentage
 */
function calculateGrowthRate(current, previous) {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Round to decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded value
 */
function roundToDecimals(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Safe divide to avoid division by zero
 * @param {number} numerator - Numerator
 * @param {number} denominator - Denominator
 * @param {number} defaultValue - Default value if division fails
 * @returns {number} Result of division or default value
 */
function safeDivide(numerator, denominator, defaultValue = 0) {
    if (denominator === 0 || isNaN(denominator)) return defaultValue;
    return numerator / denominator;
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
function generateUniqueId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength = 50, suffix = '...') {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Convert string to slug
 * @param {string} str - String to convert
 * @returns {string} Slug string
 */
function toSlug(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // CSV Import
        parseOrderCSV,
        parseCSVLine,
        validateCSVHeaders,
        mapCSVToOrderData,
        // Data Validation
        validateSKU,
        validateEmail,
        validatePhoneNumber,
        validateCurrencyAmount,
        validateDate,
        // Error Handling
        handleDatabaseError,
        handleValidationError,
        createErrorResponse,
        // Formatting
        formatCurrency,
        formatDate,
        formatPlatformName,
        formatOrderStatus,
        formatSettlementStatus,
        // Platform Helpers
        getPlatformDisplayName,
        getPlatformColor,
        getPlatformIcon,
        getPlatformFeeStructure,
        // Data Transformation
        transformOrderForAPI,
        transformSettlementForAPI,
        transformAccountForAPI,
        // Calculation Helpers
        calculatePercentage,
        calculateGrowthRate,
        roundToDecimals,
        safeDivide,
        // String Utilities
        generateUniqueId,
        truncateString,
        toSlug
    };
}
