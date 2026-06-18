// Marketplace Orders Page Logic (Manual Entry System)
// Direct Supabase queries for manual entry

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[marketplace.js] supabaseClient not initialized. Ensure auth.js is loaded before marketplace.js');
}

let allOrders = [];
let filteredOrders = [];
let products = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    await loadOrders();
    setupEventListeners();
    
    // Set default date to today
    document.getElementById('importOrderDate').value = new Date().toISOString().split('T')[0];
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('importOrderForm').addEventListener('submit', handleImportOrder);
}

// Load products for dropdown
async function loadProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id, nama_barang, sku, harga_jual')
            .order('nama_barang');
        
        if (error) throw error;
        products = data || [];
        
        const select = document.getElementById('importProduct');
        select.innerHTML = '<option value="">Select Product</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.dataset.price = product.harga_jual;
            option.dataset.sku = product.sku;
            option.textContent = `${product.nama_barang} (${product.sku})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load orders
async function loadOrders() {
    try {
        const filters = buildFilters();
        
        let query = supabaseClient
            .from('online_orders')
            .select(`
                *,
                marketplace_accounts (
                    platform,
                    shop_name
                ),
                order_items (
                    product_name,
                    sku,
                    quantity,
                    unit_price,
                    discount,
                    tax,
                    total_price
                )
            `);
        
        if (filters.start_date && filters.end_date) {
            query = query.gte('order_date', filters.start_date).lte('order_date', filters.end_date);
        }
        
        if (filters.platform) {
            query = query.eq('marketplace_accounts.platform', filters.platform);
        }
        
        if (filters.order_status) {
            query = query.eq('order_status', filters.order_status);
        }
        
        const { data, error } = await query.order('order_date', { ascending: false });
        
        if (error) throw error;
        
        allOrders = data || [];
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
    const dateRange = document.getElementById('filterDateRange').value;
    
    const filters = {};
    
    if (platform) filters.platform = platform;
    if (orderStatus) filters.order_status = orderStatus;
    
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
        if (filters.platform && order.marketplace_accounts?.platform !== filters.platform) return false;
        if (filters.order_status && order.order_status !== filters.order_status) return false;
        
        if (filters.start_date && filters.end_date) {
            const orderDate = new Date(order.created_at);
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
    const netRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.net_revenue || 0), 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('netRevenue').textContent = formatCurrency(netRevenue);
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
        const { data, error } = await supabaseClient
            .from('online_orders')
            .select(`
                *,
                marketplace_accounts (
                    platform,
                    shop_name
                ),
                order_items (
                    product_name,
                    sku,
                    quantity,
                    unit_price,
                    discount,
                    tax,
                    total_price
                )
            `)
            .eq('id', orderId)
            .single();
        
        if (error) throw error;
        showOrderModal(data);
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
            <span class="detail-label">Gross Sales</span>
            <span class="detail-value">${formatCurrency(order.gross_sales)}</span>
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
            ${order.order_items.map(item => `
                <div class="order-item">
                    <div class="order-item-name">${item.product_name}</div>
                    <div class="order-item-details">
                        <span>SKU: ${item.sku || '-'}</span>
                        <span>Qty: ${item.quantity}</span>
                        <span>Price: ${formatCurrency(item.unit_price)}</span>
                        <span>Discount: ${formatCurrency(item.discount || 0)}</span>
                        <span>Tax: ${formatCurrency(item.tax || 0)}</span>
                        <span>Total: ${formatCurrency(item.total_price)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${order.notes ? `
            <div class="detail-row" style="margin-top: 24px;">
                <span class="detail-label">Notes</span>
                <span class="detail-value">${order.notes}</span>
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
        const platform = document.getElementById('importPlatform').value;
        const orderNumber = document.getElementById('importOrderNumber').value;
        const customerName = document.getElementById('importCustomerName').value;
        const customerPhone = document.getElementById('importCustomerPhone').value;
        const orderDate = document.getElementById('importOrderDate').value;
        const orderStatus = document.getElementById('importOrderStatus').value;
        const productId = document.getElementById('importProduct').value;
        const quantity = parseInt(document.getElementById('importQuantity').value);
        const unitPrice = parseFloat(document.getElementById('importUnitPrice').value);
        const discount = parseFloat(document.getElementById('importDiscount').value) || 0;
        const tax = parseFloat(document.getElementById('importTax').value) || 0;
        const platformFee = parseFloat(document.getElementById('importPlatformFee').value) || 0;
        const shippingFee = parseFloat(document.getElementById('importShippingFee').value) || 0;
        const notes = document.getElementById('importNotes').value;
        
        // Get product details
        const product = products.find(p => p.id === productId);
        if (!product) {
            alert('Please select a product');
            return;
        }
        
        const totalPrice = (quantity * unitPrice) - discount + tax;
        const grossSales = totalPrice;
        const netRevenue = grossSales - platformFee - shippingFee;
        
        // Get or create marketplace account
        let marketplaceAccountId;
        const { data: existingAccounts } = await supabaseClient
            .from('marketplace_accounts')
            .select('id')
            .eq('platform', platform)
            .eq('shop_name', platform)
            .single();
        
        if (existingAccounts) {
            marketplaceAccountId = existingAccounts.id;
        } else {
            const { data: newAccount } = await supabaseClient
                .from('marketplace_accounts')
                .insert({
                    platform: platform,
                    shop_name: platform
                })
                .select()
                .single();
            marketplaceAccountId = newAccount.id;
        }
        
        // Create online order
        const { data: order, error: orderError } = await supabaseClient
            .from('online_orders')
            .insert({
                marketplace_account_id: marketplaceAccountId,
                order_number: orderNumber,
                customer_name: customerName,
                customer_phone: customerPhone,
                order_date: orderDate,
                order_status: orderStatus,
                gross_sales: grossSales,
                shipping_fee: shippingFee,
                platform_fee: platformFee,
                net_revenue: netRevenue,
                notes: notes
            })
            .select()
            .single();
        
        if (orderError) throw orderError;
        
        // Create order item
        await supabaseClient
            .from('order_items')
            .insert({
                online_order_id: order.id,
                product_id: productId,
                product_name: product.nama_barang,
                sku: product.sku,
                quantity: quantity,
                unit_price: unitPrice,
                discount: discount,
                tax: tax
            });
        
        // Deduct stock from products table
        try {
            const { data: currentProduct, error: fetchError } = await supabaseClient
                .from('products')
                .select('stok')
                .eq('id', productId)
                .single();
            
            if (fetchError) {
                console.error('Failed to fetch current stock:', fetchError);
                alert('Order added but stock deduction failed. Manual adjustment required.');
            } else if (currentProduct) {
                const newStock = currentProduct.stok - quantity;
                if (newStock < 0) {
                    console.error('Insufficient stock for marketplace order');
                    alert('Warning: Order added but stock is insufficient. Current stock: ' + currentProduct.stok + ', Requested: ' + quantity);
                } else {
                    const { error: updateError } = await supabaseClient
                        .from('products')
                        .update({ stok: newStock })
                        .eq('id', productId);
                    
                    if (updateError) {
                        console.error('Failed to deduct stock:', updateError);
                        alert('Order added but stock deduction failed. Manual adjustment required.');
                    }
                }
            }
        } catch (stockError) {
            console.error('Stock deduction error:', stockError);
            alert('Order added but stock deduction failed. Manual adjustment required.');
        }
        
        alert('Order added successfully!');
        closeImportModal();
        await loadOrders();
    } catch (error) {
        console.error('Error importing order:', error);
        alert('Failed to add order: ' + error.message);
    }
}

// Update order status action
async function updateOrderStatusAction(orderId, status) {
    try {
        // Get current order status to prevent duplicate stock deduction
        const { data: currentOrder, error: fetchError } = await supabaseClient
            .from('online_orders')
            .select('order_status')
            .eq('id', orderId)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Determine if this is a status change that requires stock deduction
        const previousStatus = currentOrder.order_status;
        const finalStatuses = ['shipped', 'delivered', 'completed'];
        const intermediateStatuses = ['pending', 'processing'];
        
        const isTransitionToFinal = finalStatuses.includes(status.toLowerCase()) && 
                                    intermediateStatuses.includes(previousStatus.toLowerCase());
        
        // Update order status
        const { error } = await supabaseClient
            .from('online_orders')
            .update({ order_status: status })
            .eq('id', orderId);
        
        if (error) throw error;
        
        // Deduct stock if transitioning to final status
        if (isTransitionToFinal) {
            try {
                // Get order items
                const { data: orderItems, error: itemsError } = await supabaseClient
                    .from('order_items')
                    .select('product_id, quantity')
                    .eq('online_order_id', orderId);
                
                if (itemsError) {
                    console.error('Failed to fetch order items for stock deduction:', itemsError);
                    alert(`Order marked as ${status}, but stock deduction failed. Manual adjustment required.`);
                } else if (orderItems && orderItems.length > 0) {
                    // Deduct stock for each item
                    for (const item of orderItems) {
                        try {
                            const { data: currentProduct, error: fetchProductError } = await supabaseClient
                                .from('products')
                                .select('stok')
                                .eq('id', item.product_id)
                                .single();
                            
                            if (fetchProductError) {
                                console.error('Failed to fetch product stock:', fetchProductError);
                            } else if (currentProduct) {
                                const newStock = currentProduct.stok - item.quantity;
                                if (newStock >= 0) {
                                    const { error: updateError } = await supabaseClient
                                        .from('products')
                                        .update({ stok: newStock })
                                        .eq('id', item.product_id);
                                    
                                    if (updateError) {
                                        console.error('Failed to deduct stock for product:', item.product_id, updateError);
                                    }
                                } else {
                                    console.warn('Insufficient stock for product:', item.product_id, 'Current:', currentProduct.stok, 'Requested:', item.quantity);
                                }
                            }
                        } catch (stockError) {
                            console.error('Stock deduction error for item:', item.product_id, stockError);
                        }
                    }
                }
            } catch (stockDeductionError) {
                console.error('Stock deduction process failed:', stockDeductionError);
                alert(`Order marked as ${status}, but stock deduction failed. Manual adjustment required.`);
            }
        }
        
        alert(`Order marked as ${status}`);
        closeOrderModal();
        await loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
    }
}

// Format order status
function formatOrderStatus(status) {
    const statusNames = {
        PENDING: 'Pending',
        PROCESSING: 'Processing',
        SHIPPED: 'Shipped',
        DELIVERED: 'Delivered',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        RETURNED: 'Returned'
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
