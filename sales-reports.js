// Sales Reports Module for SPECTRE POS
// Provides comprehensive sales analytics and reporting

/**
 * Get sales report for a specific date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Sales report data
 */
async function getSalesReport(startDate, endDate) {
    try {
        // Get payments within date range
        const { data: payments, error } = await supabaseClient
            .from('payments')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get products for modal cost calculation
        const { data: products } = await supabaseClient
            .from('products')
            .select('nama_barang, harga_modal');

        // Create modal map
        const modalMap = new Map();
        (products || []).forEach(p => {
            modalMap.set(String(p.nama_barang || '').toUpperCase(), parseFloat(p.harga_modal || 0));
        });

        // Calculate metrics
        const totalRevenue = (payments || []).reduce((sum, p) => sum + (parseFloat(p.total_harga) || 0), 0);
        const totalPaid = (payments || []).reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0);
        const totalPending = (payments || []).reduce((sum, p) => sum + (parseFloat(p.remaining_amount) || 0), 0);
        
        const paidCount = (payments || []).filter(p => p.status === 'paid').length;
        const pendingCount = (payments || []).filter(p => p.status === 'pending' || p.status === 'partial').length;
        const totalCount = payments ? payments.length : 0;

        // Calculate profit
        let totalProfit = 0;
        (payments || []).forEach(payment => {
            const productName = String(payment.product || '').toUpperCase();
            const modalSatuan = modalMap.get(productName) || 0;
            const qty = parseInt(payment.jumlah || 0);
            const revenue = parseFloat(payment.total_harga || 0);
            const totalModal = modalSatuan * qty;
            totalProfit += (revenue - totalModal);
        });

        // Calculate average transaction value
        const avgTransactionValue = totalCount > 0 ? totalRevenue / totalCount : 0;

        // Group by payment method
        const paymentMethods = {};
        (payments || []).forEach(p => {
            const method = p.method || 'Unknown';
            if (!paymentMethods[method]) {
                paymentMethods[method] = { count: 0, total: 0 };
            }
            paymentMethods[method].count++;
            paymentMethods[method].total += parseFloat(p.total_harga || 0);
        });

        // Top selling products
        const productSales = {};
        (payments || []).forEach(p => {
            const product = p.product || 'Unknown';
            if (!productSales[product]) {
                productSales[product] = { count: 0, revenue: 0 };
            }
            productSales[product].count += parseInt(p.jumlah || 0);
            productSales[product].revenue += parseFloat(p.total_harga || 0);
        });

        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 10)
            .map(([name, data]) => ({ name, ...data }));

        return {
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            summary: {
                totalRevenue,
                totalPaid,
                totalPending,
                totalProfit,
                paidCount,
                pendingCount,
                totalCount,
                avgTransactionValue,
                profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
            },
            paymentMethods,
            topProducts,
            transactions: payments || []
        };
    } catch (error) {
        console.error('Error generating sales report:', error);
        throw error;
    }
}

/**
 * Get daily sales report
 * @param {Date} date - Date to report on
 * @returns {Promise<Object>} Daily sales report
 */
async function getDailySalesReport(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return getSalesReport(startOfDay, endOfDay);
}

/**
 * Get weekly sales report
 * @param {Date} date - Date within the week
 * @returns {Promise<Object>} Weekly sales report
 */
async function getWeeklySalesReport(date = new Date()) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return getSalesReport(startOfWeek, endOfWeek);
}

/**
 * Get monthly sales report
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Promise<Object>} Monthly sales report
 */
async function getMonthlySalesReport(year = new Date().getFullYear(), month = new Date().getMonth()) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return getSalesReport(startOfMonth, endOfMonth);
}

/**
 * Get yearly sales report
 * @param {number} year - Year
 * @returns {Promise<Object>} Yearly sales report
 */
async function getYearlySalesReport(year = new Date().getFullYear()) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    
    return getSalesReport(startOfYear, endOfYear);
}

/**
 * Export sales report to CSV
 * @param {Object} report - Sales report data
 * @returns {string} CSV formatted string
 */
function exportReportToCSV(report) {
    const headers = ['Date', 'Invoice', 'Product', 'Quantity', 'Total', 'Paid', 'Remaining', 'Method', 'Status', 'Buyer'];
    
    const rows = report.transactions.map(t => [
        new Date(t.created_at).toLocaleString('id-ID'),
        t.invoice_number || '',
        t.product || '',
        t.jumlah || 0,
        t.total_harga || 0,
        t.paid_amount || 0,
        t.remaining_amount || 0,
        t.method || '',
        t.status || '',
        t.buyer || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Download CSV file
 * @param {string} content - CSV content
 * @param {string} filename - File name
 */
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export and download sales report
 * @param {Object} report - Sales report data
 * @param {string} filename - File name (optional)
 */
function exportSalesReport(report, filename) {
    const csvContent = exportReportToCSV(report);
    const defaultFilename = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename || defaultFilename);
}

/**
 * Get sales trend data for charts
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Array>} Trend data
 */
async function getSalesTrend(days = 30) {
    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const report = await getDailySalesReport(date);
        
        trendData.push({
            date: date.toISOString().split('T')[0],
            revenue: report.summary.totalRevenue,
            profit: report.summary.totalProfit,
            transactions: report.summary.totalCount
        });
    }
    
    return trendData;
}

// Export functions for global access
window.SalesReports = {
    getSalesReport,
    getDailySalesReport,
    getWeeklySalesReport,
    getMonthlySalesReport,
    getYearlySalesReport,
    exportReportToCSV,
    downloadCSV,
    exportSalesReport,
    getSalesTrend
};
