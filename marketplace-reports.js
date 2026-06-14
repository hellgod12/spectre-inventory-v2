// Marketplace Reports Page Logic
// Connects to marketplace-reporting.js for combined POS + Marketplace analytics

let currentReportData = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    initializeDateInputs();
    await loadReports();
});

// Initialize date inputs
function initializeDateInputs() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

// Load reports
async function loadReports() {
    try {
        const startDate = getStartDate();
        const endDate = getEndDate();
        
        // Load combined revenue report
        const revenueReport = await getCombinedRevenueReport(startDate, endDate);
        
        // Load combined profit report
        const profitReport = await getCombinedProfitReport(startDate, endDate);
        
        // Load combined order statistics
        const orderStats = await getCombinedOrderStatistics(startDate, endDate);
        
        // Load channel performance comparison
        const channelComparison = await getChannelPerformanceComparison(startDate, endDate);
        
        currentReportData = {
            revenue: revenueReport,
            profit: profitReport,
            orders: orderStats,
            channels: channelComparison
        };
        
        updateRevenueKPIs(revenueReport);
        updateProfitKPIs(profitReport);
        updateOrderKPIs(orderStats);
        renderChannelComparison(channelComparison);
        renderPlatformBreakdown(revenueReport);
        
    } catch (error) {
        console.error('Error loading reports:', error);
        alert('Failed to load reports');
    }
}

// Get start date from inputs
function getStartDate() {
    const startDateInput = document.getElementById('startDate').value;
    const periodSelect = document.getElementById('reportPeriod').value;
    
    if (startDateInput) {
        return new Date(startDateInput);
    }
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - parseInt(periodSelect));
    return startDate;
}

// Get end date from inputs
function getEndDate() {
    const endDateInput = document.getElementById('endDate').value;
    
    if (endDateInput) {
        return new Date(endDateInput);
    }
    
    return new Date();
}

// Update revenue KPIs
function updateRevenueKPIs(report) {
    const totalRevenue = report.combined.total_gross_sales;
    const posRevenue = report.pos.gross_sales;
    const marketplaceRevenue = report.marketplace.gross_sales;
    
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('posRevenue').textContent = formatCurrency(posRevenue);
    document.getElementById('marketplaceRevenue').textContent = formatCurrency(marketplaceRevenue);
    
    const posPercent = totalRevenue > 0 ? (posRevenue / totalRevenue * 100).toFixed(1) : 0;
    const marketplacePercent = totalRevenue > 0 ? (marketplaceRevenue / totalRevenue * 100).toFixed(1) : 0;
    
    document.getElementById('posRevenuePercent').textContent = `${posPercent}% of total`;
    document.getElementById('marketplaceRevenuePercent').textContent = `${marketplacePercent}% of total`;
}

// Update profit KPIs
function updateProfitKPIs(report) {
    const totalProfit = report.combined.total_profit;
    const totalMargin = report.combined.total_margin;
    
    document.getElementById('totalProfit').textContent = formatCurrency(totalProfit);
    document.getElementById('profitMargin').textContent = `${totalMargin.toFixed(1)}%`;
}

// Update order KPIs
function updateOrderKPIs(stats) {
    const totalOrders = stats.combined.total_orders;
    const posOrders = stats.pos.total_orders;
    const marketplaceOrders = stats.marketplace.total_orders;
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('posOrders').textContent = posOrders;
    document.getElementById('marketplaceOrders').textContent = marketplaceOrders;
    
    const posPercent = totalOrders > 0 ? (posOrders / totalOrders * 100).toFixed(1) : 0;
    const marketplacePercent = totalOrders > 0 ? (marketplaceOrders / totalOrders * 100).toFixed(1) : 0;
    
    document.getElementById('posOrdersPercent').textContent = `${posPercent}% of total`;
    document.getElementById('marketplaceOrdersPercent').textContent = `${marketplacePercent}% of total`;
}

// Render channel comparison
function renderChannelComparison(comparison) {
    const container = document.getElementById('channelComparison');
    
    container.innerHTML = comparison.channels.map(channel => `
        <div class="channel-row">
            <div class="channel-name">
                <span class="platform-badge platform-${channel.name.toLowerCase().replace(/\s/g, '-')}">
                    ${getChannelIcon(channel.name)}
                    ${channel.name}
                </span>
            </div>
            <div class="channel-metrics">
                <div class="channel-metric">
                    <span class="channel-metric-label">Revenue</span>
                    <span class="channel-metric-value">${formatCurrency(channel.revenue)}</span>
                </div>
                <div class="channel-metric">
                    <span class="channel-metric-label">Profit</span>
                    <span class="channel-metric-value">${formatCurrency(channel.profit)}</span>
                </div>
                <div class="channel-metric">
                    <span class="channel-metric-label">Margin</span>
                    <span class="channel-metric-value">${channel.margin.toFixed(1)}%</span>
                </div>
                <div class="channel-metric">
                    <span class="channel-metric-label">Orders</span>
                    <span class="channel-metric-value">${channel.orders}</span>
                </div>
                <div class="channel-metric">
                    <span class="channel-metric-label">Revenue %</span>
                    <span class="channel-metric-value">${channel.revenue_percentage.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Render platform breakdown
function renderPlatformBreakdown(revenueReport) {
    const container = document.getElementById('platformBreakdown');
    const platforms = revenueReport.marketplace.by_platform;
    
    const platformNames = {
        SHOPEE: 'Shopee',
        TIKTOK: 'TikTok Shop',
        TOKOPEDIA: 'Tokopedia',
        LAZADA: 'Lazada'
    };
    
    const platformIcons = {
        SHOPEE: '🛒',
        TIKTOK: '🎵',
        TOKOPEDIA: '🏪',
        LAZADA: '📦'
    };
    
    const platformClasses = {
        SHOPEE: 'platform-shopee',
        TIKTOK: 'platform-tiktok',
        TOKOPEDIA: 'platform-tokopedia',
        LAZADA: 'platform-lazada'
    };
    
    if (Object.keys(platforms).length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No marketplace data</div><div class="empty-state-sub">Import orders to see platform breakdown</div></div>';
        return;
    }
    
    container.innerHTML = Object.entries(platforms).map(([platform, data]) => `
        <div class="channel-row">
            <div class="channel-name">
                <span class="platform-badge ${platformClasses[platform]}">
                    ${platformIcons[platform]}
                    ${platformNames[platform]}
                </span>
            </div>
            <div class="channel-metrics">
                <div class="channel-metric">
                    <span class="channel-metric-label">Gross Sales</span>
                    <span class="channel-metric-value">${formatCurrency(data.gross_sales)}</span>
                </div>
                <div class="channel-metric">
                    <span class="channel-metric-label">Net Revenue</span>
                    <span class="channel-metric-value">${formatCurrency(data.net_revenue)}</span>
                </div>
                <div class="channel-metric">
                    <span class="channel-metric-label">Orders</span>
                    <span class="channel-metric-value">${data.order_count}</span>
                </div>
                <div class="channel-metric">
                    <span class="channel-metric-label">Platform Fee</span>
                    <span class="channel-metric-value">${formatCurrency(data.platform_fee)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Get channel icon
function getChannelIcon(channelName) {
    const icons = {
        'POS (In-Store)': '🏪',
        'Shopee': '🛒',
        'TikTok Shop': '🎵',
        'Tokopedia': '🏪',
        'Lazada': '📦'
    };
    
    return icons[channelName] || '🏪';
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
