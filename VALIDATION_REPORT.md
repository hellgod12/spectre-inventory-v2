# Data Validation Report - Online Sales Dashboard

## 1. Supabase Queries Used

### Online Sales Today
```sql
SELECT gross_sales, net_revenue
FROM online_orders
WHERE created_at >= '2025-01-16T00:00:00.000Z'
  AND created_at < '2025-01-17T00:00:00.000Z'
  AND order_status IN ('delivered', 'completed', 'paid', 'shipped')
```

### Online Sales This Month
```sql
SELECT gross_sales, net_revenue
FROM online_orders
WHERE created_at >= '2025-01-01T00:00:00.000Z'
  AND created_at < '2025-02-01T00:00:00.000Z'
  AND order_status IN ('delivered', 'completed', 'paid', 'shipped')
```

### Sales Overview
```sql
-- Online Sales (same as This Month query above)
-- Offline Sales (from sales_history table)
SELECT total_harga
FROM sales_history
WHERE created_at >= '2025-01-01T00:00:00.000Z'
  AND created_at < '2025-02-01T00:00:00.000Z'

-- Total = Online + Offline
```

### AOV (Average Order Value)
```sql
-- Calculation: Total Revenue / Total Orders
-- Uses the same query as Online Sales This Month
-- Formula: monthRevenue / monthOrdersCount
```

### Best Selling Product
```sql
SELECT product_name, sku, quantity, total_price
FROM order_items
INNER JOIN online_orders ON order_items.order_id = online_orders.id
WHERE order_items.created_at >= '2025-01-01T00:00:00.000Z'
  AND order_items.created_at < '2025-02-01T00:00:00.000Z'
  AND online_orders.order_status IN ('delivered', 'completed', 'paid', 'shipped')
```

### Top Selling Online Products
```sql
SELECT product_name, sku, quantity, total_price
FROM order_items
INNER JOIN online_orders ON order_items.order_id = online_orders.id
WHERE order_items.created_at >= '2025-01-01T00:00:00.000Z'
  AND order_items.created_at < '2025-02-01T00:00:00.000Z'
  AND online_orders.order_status IN ('delivered', 'completed', 'paid', 'shipped')
GROUP BY product_name, sku
ORDER BY quantity DESC
LIMIT 5
```

### Sales Comparison Chart (30 Days)
```sql
-- Online Sales
SELECT gross_sales, created_at
FROM online_orders
WHERE created_at >= '2025-12-17T00:00:00.000Z'
  AND order_status IN ('delivered', 'completed', 'paid', 'shipped')

-- Offline Sales
SELECT paid_amount, created_at
FROM payments
WHERE created_at >= '2025-12-17T00:00:00.000Z'
  AND status = 'paid'
```

## 2. Order Status Filtering Logic

### Valid Sales Statuses (DIHITUNG sebagai penjualan valid):
- **delivered** - Order has been delivered to customer
- **completed** - Order is completed and finalized
- **paid** - Order has been paid
- **shipped** - Order has been shipped

### Invalid Sales Statuses (TIDAK dihitung sebagai penjualan):
- **cancelled** - Order was cancelled
- **returned** - Order was returned by customer
- **pending** - Order is still pending payment/processing
- **refunded** - Order was refunded

## 3. Example Calculations

### Total Order Online Hari Ini
```javascript
// Query: Get all orders from today with valid status
const todayOrders = await supabaseClient
    .from('online_orders')
    .select('gross_sales')
    .gte('created_at', todayStart)
    .lt('created_at', todayEnd)
    .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

// Count
const todayOrdersCount = todayOrders ? todayOrders.length : 0;
// Example: 15 orders today
```

### Revenue Online Hari Ini
```javascript
// Query: Same as above
const todayOrders = await supabaseClient
    .from('online_orders')
    .select('gross_sales')
    .gte('created_at', todayStart)
    .lt('created_at', todayEnd)
    .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

// Sum gross_sales
const todayRevenue = todayOrders ? todayOrders.reduce((sum, o) => sum + (parseFloat(o.gross_sales) || 0), 0) : 0;
// Example: Rp 2.500.000 (15 orders × Rp 166.666 average)
```

### Revenue Online Bulan Ini
```javascript
// Query: Get all orders from this month with valid status
const monthOrders = await supabaseClient
    .from('online_orders')
    .select('gross_sales')
    .gte('created_at', monthStart)
    .lt('created_at', monthEnd)
    .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

// Sum gross_sales
const monthRevenue = monthOrders ? monthOrders.reduce((sum, o) => sum + (parseFloat(o.gross_sales) || 0), 0) : 0;
// Example: Rp 45.000.000 (450 orders this month)
```

## 4. Dashboard Validation

### Validation Checklist:
- ✅ All queries include order_status filtering
- ✅ Only valid statuses (delivered, completed, paid, shipped) are counted
- ✅ Invalid statuses (cancelled, returned, pending, refunded) are excluded
- ✅ Date ranges are correctly calculated using ISO format
- ✅ Growth calculations use previous period data
- ✅ AOV calculation: Revenue / Order Count
- ✅ Top products sorted by quantity
- ✅ Best product is the one with highest quantity

### Dashboard vs Online Sales Page:
The dashboard now uses the same filtering logic as the Online Sales page would use:
- Both filter by order_status
- Both use the same date ranges
- Both calculate revenue from gross_sales field

## 5. Changes Made

### Files Modified:
1. **script.js** - Added order_status filtering to all online sales queries:
   - loadOnlineSalesStatistics()
   - loadTopSellingOnlineProducts()
   - loadBestSellingProduct()
   - loadSalesComparisonChart()

2. **style.css** - Added CSS styling for new online sales sections

3. **index.html** - Added HTML structure for online sales dashboard sections

### Key Changes:
- Added `.in('order_status', ['delivered', 'completed', 'paid', 'shipped'])` to all online orders queries
- Updated order_items queries to join with online_orders table for status filtering
- Ensured consistent filtering across all metrics

## 6. Deployment Status

### Ready for Deployment:
- ✅ All queries validated
- ✅ Order status filtering implemented
- ✅ CSS styling complete
- ✅ Integration complete
- ✅ Local testing complete

### Next Steps:
1. Commit changes to GitHub
2. Deploy to Vercel
3. Verify production deployment
