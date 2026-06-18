// utils/format-utils.js - Shared formatting utility functions

/**
 * Format currency as Indonesian Rupiah
 * @param {number|string} amount - Amount to format
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
 * @param {string} format - Format type ('full', 'short', 'time', 'date')
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

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate
    };
}
