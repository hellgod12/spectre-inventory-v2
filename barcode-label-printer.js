// Barcode Label Printing Module for SPECTRE POS
// Generates and prints barcode labels for products

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[barcode-label-printer.js] supabaseClient not initialized. Ensure auth.js is loaded before barcode-label-printer.js');
}

/**
 * Generate barcode label HTML
 * @param {Object} product - Product data
 * @param {Object} options - Label options (quantity, size, etc.)
 * @returns {string} HTML for label printing
 */
function generateBarcodeLabelHTML(product, options = {}) {
    const defaultOptions = {
        quantity: 1,
        labelSize: '50x30', // Standard thermal label size
        showPrice: true,
        showSKU: true,
        showCategory: false,
        companyName: 'SPECTRE SKATEBOARD'
    };

    const opts = { ...defaultOptions, ...options };
    const price = opts.showPrice ? formatCurrency(product.harga_jual) : '';
    const sku = opts.showSKU ? (product.sku || product.nama_barang.substring(0, 10)) : '';
    const category = opts.showCategory ? product.kategori : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Label - ${product.nama_barang}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 12px;
                    background: white;
                }
                .label {
                    width: 50mm;
                    height: 30mm;
                    padding: 2mm;
                    border: 1px solid #000;
                    page-break-after: always;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .label-header {
                    font-size: 8px;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 2px;
                }
                .product-name {
                    font-size: 10px;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .product-info {
                    font-size: 8px;
                    text-align: center;
                    margin-bottom: 2px;
                }
                .barcode-area {
                    text-align: center;
                    margin: 2px 0;
                }
                .barcode {
                    font-family: 'Libre Barcode 39', cursive;
                    font-size: 24px;
                }
                .price {
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .label {
                        border: none;
                        margin: 0;
                        page-break-after: always;
                    }
                    @page {
                        margin: 0;
                        size: 50mm 30mm;
                    }
                }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        </head>
        <body>
            ${generateLabels(product, opts)}
        </body>
        </html>
    `;
}

/**
 * Generate multiple labels
 * @param {Object} product - Product data
 * @param {Object} options - Label options
 * @returns {string} HTML for multiple labels
 */
function generateLabels(product, options) {
    let labels = '';
    for (let i = 0; i < options.quantity; i++) {
        labels += `
            <div class="label">
                <div class="label-header">${options.companyName}</div>
                <div class="product-name">${product.nama_barang}</div>
                ${options.showSKU ? `<div class="product-info">SKU: ${product.sku || 'N/A'}</div>` : ''}
                ${options.showCategory ? `<div class="product-info">${product.kategori}</div>` : ''}
                ${product.ukuran ? `<div class="product-info">Size: ${product.ukuran}</div>` : ''}
                <div class="barcode-area">
                    <div class="barcode">${product.sku || generateBarcodeNumber(product)}</div>
                </div>
                ${options.showPrice ? `<div class="price">${formatCurrency(product.harga_jual)}</div>` : ''}
            </div>
        `;
    }
    return labels;
}

/**
 * Generate barcode number from product
 * @param {Object} product - Product data
 * @returns {string} Barcode number
 */
function generateBarcodeNumber(product) {
    // Generate a simple barcode from product ID or name
    const base = product.id || product.nama_barang;
    const hash = base.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String(hash).substring(0, 12).padStart(12, '0');
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

/**
 * Print barcode labels
 * @param {Object} product - Product data
 * @param {Object} options - Label options
 */
async function printBarcodeLabels(product, options = {}) {
    try {
        const labelHTML = generateBarcodeLabelHTML(product, options);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(labelHTML);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
    } catch (error) {
        console.error('Error printing barcode labels:', error);
        alert('Gagal mencetak label barcode: ' + error.message);
    }
}

/**
 * Print labels for multiple products
 * @param {Array} products - Array of products
 * @param {Object} options - Label options
 */
async function printMultipleLabels(products, options = {}) {
    try {
        let allLabels = '';
        
        products.forEach(product => {
            const productOptions = { ...options, quantity: options.quantityPerProduct || 1 };
            allLabels += generateLabels(product, productOptions);
        });

        const labelHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Barcode Labels</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 12px;
                        background: white;
                    }
                    .label {
                        width: 50mm;
                        height: 30mm;
                        padding: 2mm;
                        border: 1px solid #000;
                        page-break-after: always;
                        display: inline-block;
                        float: left;
                        margin: 0;
                    }
                    .label-header {
                        font-size: 8px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 2px;
                    }
                    .product-name {
                        font-size: 10px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 2px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .product-info {
                        font-size: 8px;
                        text-align: center;
                        margin-bottom: 2px;
                    }
                    .barcode-area {
                        text-align: center;
                        margin: 2px 0;
                    }
                    .barcode {
                        font-family: 'Libre Barcode 39', cursive;
                        font-size: 24px;
                    }
                    .price {
                        font-size: 14px;
                        font-weight: bold;
                        text-align: center;
                    }
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .label {
                            border: none;
                            margin: 0;
                            page-break-after: always;
                        }
                        @page {
                            margin: 0;
                            size: 50mm 30mm;
                        }
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
            </head>
            <body>
                ${allLabels}
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(labelHTML);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
    } catch (error) {
        console.error('Error printing multiple labels:', error);
        alert('Gagal mencetak label: ' + error.message);
    }
}

/**
 * Show print dialog for barcode labels
 * @param {Object} product - Product data
 * @param {Object} options - Label options
 */
function showBarcodePrintDialog(product, options = {}) {
    const quantity = options.quantity || 1;
    const message = `Cetak ${quantity} label untuk:\n\nProduct: ${product.nama_barang}\nSKU: ${product.sku || 'N/A'}\nPrice: ${formatCurrency(product.harga_jual)}\n\nCetak sekarang?`;
    
    if (confirm(message)) {
        printBarcodeLabels(product, options);
    }
}

// Export functions for global access
window.BarcodeLabelPrinter = {
    generateBarcodeLabelHTML,
    printBarcodeLabels,
    printMultipleLabels,
    showBarcodePrintDialog,
    formatCurrency
};
