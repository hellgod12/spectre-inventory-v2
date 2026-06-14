// Marketplace Orders Page Logic
// Connects to marketplace-repository.js and marketplace-service.js

let allOrders = [];
let filteredOrders = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadMarketplaceAccounts();
    await loadOrders();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('importOrderForm').addEventListener('submit', handleImportOrder);
}

// Load marketplace accounts for dropdown
async function loadMarketplaceAccounts() {
    try {
        const accounts = await getActiveMarketplaceAccounts();
        const select = document.getElementById('importAccount');
        select.innerHTML = '<option value="">Select Account</option>';
        
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.platform} - ${account.shop_name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading marketplace accounts:', error);
    }
}

// Load orders
async function loadOrders() {
    try {
        const filters = buildFilters();
        allOrders = await getOnlineOrders(filters);
        filteredOrders = [...allOrders];
        
        updateKPIs();
        renderOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        showEmptyState();
    }
}

// Build filters from UI
function buildFilters() {
    const platform = document.getElementById('filterPlatform').value;
    const orderStatus = document.getElementById('filterStatus').value;
    const settlementStatus = document.getElementById('filterSettlement').value;
    const dateRange = document.getElementById('filterDateRange').value;
    
    const filters = {};
    
    if (platform) filters.marketplace_account_id = platform;
    if (orderStatus) filters.order_status = orderStatus;
    if (settlementStatus) filters.settlement_status = settlementStatus;
    
    if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        filters.start_date = startDate.toISOString();
        filters.end_date = endDate.toISOString();
    }
    
    return filters;
}

// Apply filters
function applyFilters() {
    const filters = buildFilters();
    
    filteredOrders = allOrders.filter(order => {
        if (filters.marketplace_account_id && order.marketplace_account_id !== filters.marketplace_account_id) return false;
        if (filters.order_status && order.order_status !== filters.order_status) return false;
        if (filters.settlement_status && order.settlement_status !== filters.settlement_status) return false;
        
        if (filters.start_date && filters.end_date) {
            const orderDate = new Date(order.order_date);
            const startDate = new Date(filters.start_date);
            const endDate = new Date(filters.end_date);
            if (orderDate < startDate || orderDate > endDate) return false;
        }
        
        return true;
    });
    
    renderOrders();
}

// Update KPI cards
function updateKPIs() {
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.order_status === 'PENDING').length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.gross_sales || 0), 0);
    const unsettledRevenue = allOrders
        .filter(o => o.settlement_status === 'UNSETTLED')
        .reduce((sum, o) => sum + parseFloat(o.net_revenue || 0), 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('unsettledRevenue').textContent = formatCurrency(unsettledRevenue);
}

// Render orders table
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = filteredOrders.map(order => `
        <tr>
            <td>
                <div class="font-semibold">${order.order_number}</div>
                <div class="text-xs text-gray-400">${order.platform_order_id || '-'}</div>
            </td>
            <td>
                <span class="platform-badge platform-${order.marketplace_accounts?.platform?.toLowerCase()}">
                    ${getPlatformIcon(order.marketplace_accounts?.platform)}
                    ${order.marketplace_accounts?.platform || 'Unknown'}
                </span>
            </td>
            <td>${order.customer_name || '-'}</td>
            <td>${formatDate(order.order_date, 'short')}</td>
            <td>
                <span class="status-badge status-${order.order_status?.toLowerCase()}">
                    ${formatOrderStatus(order.order_status)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${order.settlement_status?.toLowerCase().replace('_', '-') || 'pending'}">
                    ${formatSettlementStatus(order.settlement_status)}
                </span>
            </td>
            <td class="font-semibold">${formatCurrency(order.gross_sales)}</td>
            <td>
                <button onclick="viewOrder('${order.id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;">View</button>
            </td>
        </tr>
    `).join('');
}

// Show empty state
function showEmptyState() {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
}

// View order details
async function viewOrder(orderId) {
    try {
        const order = await getOnlineOrderById(orderId);
        showOrderModal(order);
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Failed to load order details');
    }
}

// Show order modal
function showOrderModal(order) {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderModalContent');
    
    content.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Order Number</span>
            <span class="detail-value">${order.order_number}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Platform</span>
            <span class="detail-value">
                <span class="platform-badge platform-${order.marketplace_accounts?.platform?.toLowerCase()}">
                    ${getPlatformIcon(order.marketplace_accounts?.platform)}
                    ${order.marketplace_accounts?.platform || 'Unknown'}
                </span>
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-value">${order.customer_name || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">${order.customer_phone || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Order Date</span>
            <span class="detail-value">${formatDate(order.order_date, 'full')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Order Status</span>
            <span class="detail-value">
                <span class="status-badge status-${order.order_status?.toLowerCase()}">
                    ${formatOrderStatus(order.order_status)}
                </span>
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Settlement Status</span>
            <span class="detail-value">
                <span class="status-badge status-${order.settlement_status?.toLowerCase().replace('_', '-') || 'pending'}">
                    ${formatSettlementStatus(order.settlement_status)}
                </span>
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Gross Sales</span>
            <span class="detail-value">${formatCurrency(order.gross_sales)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Voucher Discount</span>
            <span class="detail-value">${formatCurrency(order.voucher_discount)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Platform Fee</span>
            <span class="detail-value">${formatCurrency(order.platform_fee)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Shipping Fee</span>
            <span class="detail-value">${formatCurrency(order.shipping_fee)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Net Revenue</span>
            <span class="detail-value">${formatCurrency(order.net_revenue)}</span>
        </div>
        
        <h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 16px; font-weight: 600;">Order Items</h3>
        <div class="order-items-list">
            ${order.items.map(item => `
                <div class="order-item">
                    <div class="order-item-name">${item.product_name}</div>
                    <div class="order-item-details">
                        <span>SKU: ${item.sku || '-'}</span>
                        <span>Qty: ${item.quantity}</span>
                        <span>Price: ${formatCurrency(item.unit_price)}</span>
                        <span>Total: ${formatCurrency(item.quantity * item.unit_price)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${order.fees && order.fees.length > 0 ? `
            <h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 16px; font-weight: 600;">Fees Breakdown</h3>
            <div class="order-items-list">
                ${order.fees.map(fee => `
                    <div class="order-item">
                        <div class="order-item-name">${fee.fee_name || fee.fee_type}</div>
                        <div class="order-item-details">
                            <span>Type: ${fee.fee_type}</span>
                            <span>${fee.fee_percentage ? fee.fee_percentage + '%' : ''}</span>
                            <span>Amount: ${formatCurrency(fee.fee_amount)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div style="margin-top: 24px; display: flex; gap: 12px;">
            <button onclick="updateOrderStatusAction('${order.id}', 'PROCESSING')" class="btn btn-secondary" style="flex: 1;">Mark Processing</button>
            <button onclick="updateOrderStatusAction('${order.id}', 'SHIPPED')" class="btn btn-secondary" style="flex: 1;">Mark Shipped</button>
            <button onclick="updateOrderStatusAction('${order.id}', 'DELIVERED')" class="btn btn-primary" style="flex: 1;">Mark Delivered</button>
        </div>
    `;
    
    modal.classList.add('active');
}

// Close order modal
function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Open import modal
function openImportModal() {
    document.getElementById('importModal').classList.add('active');
}

// Close import modal
function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
    document.getElementById('importOrderForm').reset();
}

// Handle import order
async function handleImportOrder(e) {
    e.preventDefault();
    
    try {
        const accountId = document.getElementById('importAccount').value;
        const orderNumber = document.getElementById('importOrderNumber').value;
        const customerName = document.getElementById('importCustomerName').value;
        const customerPhone = document.getElementById('importCustomerPhone').value;
        const shippingAddress = document.getElementById('importShippingAddress').value;
        const orderStatus = document.getElementById('importOrderStatus').value;
        const productName = document.getElementById('importProductName').value;
        const sku = document.getElementById('importSKU').value;
        const quantity = parseInt(document.getElementById('importQuantity').value);
        const unitPrice = parseFloat(document.getElementById('importUnitPrice').value);
        const platformFee = parseFloat(document.getElementById('importPlatformFee').value) || 0;
        const shippingFee = parseFloat(document.getElementById('importShippingFee').value) || 0;
        
        const grossSales = quantity * unitPrice;
        
        const orderData = {
            marketplace_account_id: accountId,
            order_number: orderNumber,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            shipping_address: shippingAddress || null,
            order_status: orderStatus,
            gross_sales: grossSales,
            platform_fee: platformFee,
            shipping_fee: shippingFee,
            items: [{
                product_name: productName,
                sku: sku || null,
                quantity: quantity,
                unit_price: unitPrice
            }]
        };
        
        const result = await processOrderImport(orderData, accountId);
        
        if (result.success) {
            alert('Order imported successfully!');
            closeImportModal();
            await loadOrders();
        } else {
            alert('Failed to import order: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error importing order:', error);
        alert('Failed to import order: ' + error.message);
    }
}

// Update order status action
async function updateOrderStatusAction(orderId, status) {
    try {
        await updateOrderStatus(orderId, status);
        alert(`Order marked as ${status}`);
        closeOrderModal();
        await loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
    }
}

// Format currency
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

// Format date
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

// Format order status
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

// Format settlement status
function formatSettlementStatus(status) {
    const statusNames = {
        UNSETTLED: 'Unsettled',
        PARTIALLY_SETTLED: 'Partially Settled',
        SETTLED: 'Settled'
    };

    return statusNames[status] || status;
}

// Get platform icon
function getPlatformIcon(platform) {
    const platformIcons = {
        SHOPEE: '🛒',
        TIKTOK: '🎵',
        TOKOPEDIA: '🏪',
        LAZADA: '📦'
    };

    return platformIcons[platform] || '🏪';
}
