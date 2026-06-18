// Receipt Printing Module for SPECTRE POS
// Supports thermal printers (58mm/80mm)

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[receipt-printer.js] supabaseClient not initialized. Ensure auth.js is loaded before receipt-printer.js');
}

/**
 * Generate receipt HTML for printing
 * @param {Object} paymentData - Payment record from database
 * @param {Object} productData - Product information
 * @param {Object} companyInfo - Company/store information
 * @returns {string} HTML receipt
 */
function generateReceiptHTML(paymentData, productData, companyInfo = {}) {
    const defaultCompany = {
        name: 'SPECTRE SKATEBOARD',
        address: 'Jakarta, Indonesia',
        phone: '+62 812-3456-7890',
        footer: 'Terima kasih atas kunjungan Anda!'
    };

    const company = { ...defaultCompany, ...companyInfo };
    const date = new Date(paymentData.created_at || new Date()).toLocaleString('id-ID');
    const total = parseFloat(paymentData.total_harga || 0);
    const paid = parseFloat(paymentData.paid_amount || 0);
    const remaining = parseFloat(paymentData.remaining_amount || 0);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt - ${paymentData.invoice_number}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    width: 58mm;
                    padding: 5mm;
                    background: white;
                    color: black;
                }
                .receipt {
                    text-align: center;
                }
                .header {
                    margin-bottom: 10px;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 5px;
                }
                .company-name {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                .company-info {
                    font-size: 10px;
                    margin-bottom: 2px;
                }
                .invoice-info {
                    text-align: left;
                    margin: 10px 0;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 5px;
                }
                .invoice-info div {
                    margin: 2px 0;
                }
                .items {
                    text-align: left;
                    margin: 10px 0;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 5px;
                }
                .item {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                }
                .item-name {
                    flex: 1;
                }
                .item-qty {
                    text-align: center;
                    width: 30px;
                }
                .item-price {
                    text-align: right;
                    width: 70px;
                }
                .totals {
                    text-align: right;
                    margin: 10px 0;
                    border-top: 1px dashed #000;
                    padding-top: 5px;
                }
                .totals div {
                    margin: 3px 0;
                }
                .total {
                    font-weight: bold;
                    font-size: 14px;
                    border-top: 1px solid #000;
                    padding-top: 5px;
                    margin-top: 5px;
                }
                .payment-info {
                    text-align: left;
                    margin: 10px 0;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 5px;
                }
                .footer {
                    margin-top: 15px;
                    font-size: 10px;
                    text-align: center;
                }
                .barcode {
                    margin: 10px 0;
                    text-align: center;
                }
                @media print {
                    body {
                        width: 58mm;
                        margin: 0;
                        padding: 2mm;
                    }
                    @page {
                        margin: 0;
                        size: 58mm auto;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="header">
                    <div class="company-name">${company.name}</div>
                    <div class="company-info">${company.address}</div>
                    <div class="company-info">${company.phone}</div>
                </div>

                <div class="invoice-info">
                    <div><strong>No:</strong> ${paymentData.invoice_number}</div>
                    <div><strong>Tgl:</strong> ${date}</div>
                    <div><strong>Kasir:</strong> ${paymentData.buyer || 'Umum'}</div>
                </div>

                <div class="items">
                    <div class="item">
                        <span class="item-name">ITEM</span>
                        <span class="item-qty">QTY</span>
                        <span class="item-price">HARGA</span>
                    </div>
                    <div class="item">
                        <span class="item-name">${paymentData.product || '-'}</span>
                        <span class="item-qty">${paymentData.jumlah || 1}</span>
                        <span class="item-price">${formatCurrency(total / (paymentData.jumlah || 1))}</span>
                    </div>
                </div>

                <div class="totals">
                    <div><strong>Subtotal:</strong> ${formatCurrency(total)}</div>
                    ${remaining > 0 ? `<div><strong>Dibayar:</strong> ${formatCurrency(paid)}</div>` : ''}
                    ${remaining > 0 ? `<div><strong>Sisa:</strong> ${formatCurrency(remaining)}</div>` : ''}
                    <div class="total"><strong>TOTAL:</strong> ${formatCurrency(total)}</div>
                </div>

                <div class="payment-info">
                    <div><strong>Metode:</strong> ${paymentData.method || 'Cash'}</div>
                    <div><strong>Status:</strong> ${paymentData.status === 'paid' ? 'LUNAS' : paymentData.status.toUpperCase()}</div>
                </div>

                <div class="footer">
                    <div>${company.footer}</div>
                    <div style="margin-top: 5px;">Simpan struk sebagai bukti pembayaran yang sah</div>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Format currency to Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

/**
 * Print receipt for payment
 * @param {Object} paymentData - Payment record
 * @param {Object} productData - Product information
 * @param {Object} companyInfo - Company information (optional)
 */
async function printReceipt(paymentData, productData, companyInfo) {
    try {
        const receiptHTML = generateReceiptHTML(paymentData, productData, companyInfo);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = function() {
            printWindow.print();
            // Close window after printing (optional)
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
    } catch (error) {
        console.error('Error printing receipt:', error);
        alert('Gagal mencetak struk: ' + error.message);
    }
}

/**
 * Show print confirmation dialog
 * @param {Object} paymentData - Payment record
 * @param {Object} productData - Product information
 * @param {Object} companyInfo - Company information (optional)
 */
function showPrintDialog(paymentData, productData, companyInfo) {
    const total = formatCurrency(paymentData.total_harga || 0);
    const message = `Cetak struk untuk transaksi:\n\nNo: ${paymentData.invoice_number}\nItem: ${paymentData.product}\nTotal: ${total}\n\nCetak sekarang?`;
    
    if (confirm(message)) {
        printReceipt(paymentData, productData, companyInfo);
    }
}

// Export functions for global access
window.ReceiptPrinter = {
    generateReceiptHTML,
    formatCurrency,
    printReceipt,
    showPrintDialog
};
