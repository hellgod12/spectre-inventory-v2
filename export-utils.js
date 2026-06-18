// Export Utilities for SPECTRE Inventory System
// Handles Excel (.xlsx) and PDF exports with authentication and performance optimization
// NOTE: Libraries loaded via CDN in HTML files as global variables:
// - XLSX (from xlsx CDN)
// - jsPDF (from jspdf CDN as window.jspdf.jsPDF)
// - autoTable (from jspdf-autotable CDN as window.jspdf.autoTable)

// Authentication check
function isAuthenticated() {
    return typeof currentUserRole !== 'undefined' && currentUserRole !== null;
}

// Show loading indicator
function showLoading(message = 'Exporting data...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'export-loading';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-size: 18px;
        font-family: Arial, sans-serif;
    `;
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 20px;">${message}</div>
            <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingDiv);
}

// Hide loading indicator
function hideLoading() {
    const loadingDiv = document.getElementById('export-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Format date for export
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Format currency for export
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '';
    return parseFloat(amount).toLocaleString('id-ID');
}

// Generate filename with date
function generateFilename(prefix, extension) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return `${prefix}-${dateStr}.${extension}`;
}

// ============================================
// EXCEL EXPORT FUNCTIONS
// ============================================

// Generic Excel export function
async function exportToExcel(data, headers, filename, sheetName = 'Sheet1') {
    if (!isAuthenticated()) {
        alert('You must be logged in to export data');
        return;
    }

    try {
        showLoading('Generating Excel file...');

        // Create worksheet with headers
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Generate filename
        const fullFilename = generateFilename(filename, 'xlsx');

        // Write file
        XLSX.writeFile(wb, fullFilename);

        hideLoading();
        alert(`Excel file exported successfully: ${fullFilename}`);
    } catch (error) {
        hideLoading();
        console.error('Excel export error:', error);
        alert('Failed to export Excel file: ' + error.message);
    }
}

// Export Products to Excel
async function exportProductsToExcel(products) {
    if (!products || products.length === 0) {
        alert('No products to export');
        return;
    }

    const headers = ['ID', 'Name', 'Category', 'Size', 'Stock', 'Cost Price', 'Selling Price', 'Member Price', 'SKU', 'Created At'];
    
    const data = products.map(p => [
        p.id,
        p.nama_barang,
        p.kategori,
        p.ukuran || '',
        p.stok,
        formatCurrency(p.harga_modal),
        formatCurrency(p.harga_jual),
        formatCurrency(p.harga_member),
        p.sku || '',
        formatDate(p.created_at)
    ]);

    await exportToExcel(data, headers, 'products-report', 'Products');
}

// Export Sales History to Excel
async function exportSalesHistoryToExcel(salesHistory) {
    if (!salesHistory || salesHistory.length === 0) {
        alert('No sales history to export');
        return;
    }

    const headers = ['ID', 'Payment ID', 'Product ID', 'Product Name', 'Category', 'Size', 'Quantity', 'Total Price', 'Cost Price', 'Profit', 'Buyer Type', 'Created At'];
    
    const data = salesHistory.map(s => [
        s.id,
        s.payment_id,
        s.product_id,
        s.nama_barang,
        s.kategori || '',
        s.ukuran || '',
        s.jumlah,
        formatCurrency(s.total_harga),
        formatCurrency(s.harga_modal),
        formatCurrency(s.profit),
        s.tipe_pembeli,
        formatDate(s.created_at)
    ]);

    await exportToExcel(data, headers, 'sales-report', 'Sales History');
}

// Export Payments to Excel
async function exportPaymentsToExcel(payments) {
    if (!payments || payments.length === 0) {
        alert('No payments to export');
        return;
    }

    const headers = ['Invoice Number', 'Buyer', 'Product', 'Quantity', 'Total Price', 'Paid Amount', 'Remaining Amount', 'Method', 'Status', 'Confirmed At', 'Created At'];
    
    const data = payments.map(p => [
        p.invoice_number,
        p.buyer,
        p.product,
        p.jumlah,
        formatCurrency(p.total_harga),
        formatCurrency(p.paid_amount),
        formatCurrency(p.remaining_amount),
        p.method,
        p.status,
        formatDate(p.confirmed_at),
        formatDate(p.created_at)
    ]);

    await exportToExcel(data, headers, 'payments-report', 'Payments');
}

// Export Members to Excel
async function exportMembersToExcel(members) {
    if (!members || members.length === 0) {
        alert('No members to export');
        return;
    }

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Points', 'Created At'];
    
    const data = members.map(m => [
        m.id,
        m.nama,
        m.nomor_telepon,
        m.email || '',
        m.alamat || '',
        m.poin,
        formatDate(m.created_at)
    ]);

    await exportToExcel(data, headers, 'members-report', 'Members');
}

// Export Marketplace Orders to Excel
async function exportMarketplaceOrdersToExcel(orders) {
    if (!orders || orders.length === 0) {
        alert('No marketplace orders to export');
        return;
    }

    const headers = ['ID', 'Order Number', 'Customer Name', 'Customer Phone', 'Order Date', 'Status', 'Gross Sales', 'Shipping Fee', 'Platform Fee', 'Net Revenue', 'Notes'];
    
    const data = orders.map(o => [
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        formatDate(o.order_date),
        o.order_status,
        formatCurrency(o.gross_sales),
        formatCurrency(o.shipping_fee),
        formatCurrency(o.platform_fee),
        formatCurrency(o.net_revenue),
        o.notes || ''
    ]);

    await exportToExcel(data, headers, 'marketplace-orders-report', 'Marketplace Orders');
}

// Export Inventory Logs to Excel
async function exportInventoryLogsToExcel(logs) {
    if (!logs || logs.length === 0) {
        alert('No inventory logs to export');
        return;
    }

    const headers = ['ID', 'Product Name', 'Action', 'Quantity', 'Previous Stock', 'New Stock', 'User', 'Timestamp'];
    
    const data = logs.map(l => [
        l.id,
        l.product_name,
        l.action,
        l.quantity,
        l.previous_stock,
        l.new_stock,
        l.user,
        formatDate(l.timestamp)
    ]);

    await exportToExcel(data, headers, 'inventory-logs-report', 'Inventory Logs');
}

// ============================================
// PDF EXPORT FUNCTIONS
// ============================================

// Generic PDF export function
async function exportToPDF(title, data, headers, filename, options = {}) {
    if (!isAuthenticated()) {
        alert('You must be logged in to export data');
        return;
    }

    try {
        showLoading('Generating PDF file...');

        // Create PDF document
        const doc = new window.jspdf.jsPDF(options.orientation || 'portrait', 'mm', options.format || 'a4');

        // Add title
        doc.setFontSize(18);
        doc.text(title, 14, 20);

        // Add company name
        doc.setFontSize(12);
        doc.text('SPECTRE Inventory System', 14, 30);

        // Add generated date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 14, 38);

        // Add table
        window.jspdf.autoTable(doc, {
            startY: 45,
            head: headers,
            body: data,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 45, right: 10, bottom: 10, left: 10 }
        });

        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        }

        // Generate filename
        const fullFilename = generateFilename(filename, 'pdf');

        // Save file
        doc.save(fullFilename);

        hideLoading();
        alert(`PDF file exported successfully: ${fullFilename}`);
    } catch (error) {
        hideLoading();
        console.error('PDF export error:', error);
        alert('Failed to export PDF file: ' + error.message);
    }
}

// Export Invoice to PDF
async function exportInvoiceToPDF(payment, salesHistory) {
    if (!payment) {
        alert('No payment data to export');
        return;
    }

    try {
        showLoading('Generating invoice PDF...');

        const doc = new window.jspdf.jsPDF('portrait', 'mm', 'a4');

        // Add header
        doc.setFontSize(20);
        doc.text('INVOICE', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text('SPECTRE Inventory System', 105, 30, { align: 'center' });

        // Add invoice details
        doc.setFontSize(10);
        doc.text(`Invoice Number: ${payment.invoice_number}`, 14, 45);
        doc.text(`Date: ${formatDate(payment.created_at)}`, 14, 52);
        doc.text(`Buyer: ${payment.buyer}`, 14, 59);
        doc.text(`Payment Method: ${payment.method}`, 14, 66);
        doc.text(`Status: ${payment.status.toUpperCase()}`, 14, 73);

        // Add line
        doc.setDrawColor(200);
        doc.line(14, 78, 196, 78);

        // Add sales history table
        if (salesHistory && salesHistory.length > 0) {
            const headers = [['Product', 'Category', 'Size', 'Qty', 'Unit Price', 'Total']];
            const data = salesHistory.map(s => [
                s.nama_barang,
                s.kategori || '',
                s.ukuran || '',
                s.jumlah,
                formatCurrency(s.total_harga / s.jumlah),
                formatCurrency(s.total_harga)
            ]);

            window.jspdf.autoTable(doc, {
                startY: 85,
                head: headers,
                body: data,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [66, 139, 202] },
                margin: { left: 14, right: 14 }
            });
        }

        // Add totals
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text(`Total Amount: ${formatCurrency(payment.total_harga)}`, 14, finalY);
        doc.text(`Paid Amount: ${formatCurrency(payment.paid_amount)}`, 14, finalY + 7);
        doc.text(`Remaining: ${formatCurrency(payment.remaining_amount)}`, 14, finalY + 14);

        // Add footer
        doc.setFontSize(8);
        doc.text('Thank you for your business!', 105, 280, { align: 'center' });

        // Save
        const filename = `invoice-${payment.invoice_number}.pdf`;
        doc.save(filename);

        hideLoading();
        alert(`Invoice exported successfully: ${filename}`);
    } catch (error) {
        hideLoading();
        console.error('Invoice export error:', error);
        alert('Failed to export invoice: ' + error.message);
    }
}

// Export Sales Report to PDF
async function exportSalesReportToPDF(salesData, summary) {
    if (!salesData || salesData.length === 0) {
        alert('No sales data to export');
        return;
    }

    const headers = [['Date', 'Product', 'Category', 'Buyer Type', 'Quantity', 'Total Price', 'Profit']];
    const data = salesData.map(s => [
        formatDate(s.created_at),
        s.nama_barang,
        s.kategori || '',
        s.tipe_pembeli,
        s.jumlah,
        formatCurrency(s.total_harga),
        formatCurrency(s.profit || 0)
    ]);

    await exportToPDF('Sales Report', data, headers, 'sales-report-pdf');
}

// Export Member Report to PDF
async function exportMemberReportToPDF(members, summary) {
    if (!members || members.length === 0) {
        alert('No member data to export');
        return;
    }

    const headers = [['Name', 'Phone', 'Email', 'Points', 'Total Purchases', 'Total Spent']];
    const data = members.map(m => [
        m.nama,
        m.nomor_telepon,
        m.email || '',
        m.poin,
        m.total_purchases || 0,
        formatCurrency(m.total_spent || 0)
    ]);

    await exportToPDF('Member Report', data, headers, 'members-report-pdf');
}

// Export Inventory Report to PDF
async function exportInventoryReportToPDF(products, summary) {
    if (!products || products.length === 0) {
        alert('No inventory data to export');
        return;
    }

    const headers = [['Product', 'Category', 'Size', 'Stock', 'Cost Price', 'Selling Price', 'Value']];
    const data = products.map(p => [
        p.nama_barang,
        p.kategori,
        p.ukuran || '',
        p.stok,
        formatCurrency(p.harga_modal),
        formatCurrency(p.harga_jual),
        formatCurrency(p.stok * p.harga_jual)
    ]);

    await exportToPDF('Inventory Report', data, headers, 'inventory-report-pdf');
}
