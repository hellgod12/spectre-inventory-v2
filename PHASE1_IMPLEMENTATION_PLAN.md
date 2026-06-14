# Phase 1 Implementation Plan
## Marketplace Accounting - Database + Repository Layer

---

## Overview
Phase 1 focuses on database schema creation and repository layer implementation without any UI changes. This ensures data integrity and business logic foundation before adding user interface components.

---

## File-by-File Implementation Plan

### 1. NEW FILES TO CREATE

#### 1.1 Database Migration
- **File**: `migration_marketplace_system.sql`
- **Status**: ✅ COMPLETED
- **Purpose**: Create all marketplace tables, indexes, RLS policies, and helper functions
- **Tables Created**:
  - `marketplace_accounts`
  - `online_orders`
  - `order_items`
  - `marketplace_fees`
  - `settlements`

#### 1.2 Repository Layer - Marketplace Data Access
- **File**: `marketplace-repository.js`
- **Purpose**: Centralized data access layer for marketplace operations
- **Functions**:
  - Marketplace account CRUD operations
  - Online order CRUD operations
  - Order item management
  - Fee tracking
  - Settlement management
  - Stock synchronization
  - Business logic calculations

#### 1.3 Business Logic Layer
- **File**: `marketplace-service.js`
- **Purpose**: Business logic for marketplace operations
- **Functions**:
  - Order import validation
  - Fee calculation logic
  - Revenue calculations
  - Settlement reconciliation
  - Stock reservation logic

#### 1.4 Utility Functions
- **File**: `marketplace-utils.js`
- **Purpose**: Helper functions for marketplace operations
- **Functions**:
  - CSV parsing for order import
  - Platform-specific fee calculators
  - Data validation utilities
  - Error handling helpers

---

### 2. EXISTING FILES TO MODIFY

#### 2.1 NO EXISTING FILES NEED MODIFICATION FOR PHASE 1
- **Reason**: Phase 1 is database + repository layer only
- **Impact**: Zero risk to existing functionality
- **Backward Compatibility**: 100% maintained

#### 2.2 Files That WILL Need Modification in Future Phases
- `index.html` - Add marketplace KPIs (Phase 3)
- `script.js` - Add marketplace calculations (Phase 3)
- `style.css` - Add marketplace-specific styles (Phase 3)
- `auth.js` - No changes needed
- `penjualan.js` - No changes needed
- `barang.js` - No changes needed
- `pengeluaran.js` - No changes needed

---

## Phase 1 Task Breakdown

### Task 1: Database Migration ✅ COMPLETED
**Status**: Done
**File**: `migration_marketplace_system.sql`
**Steps**:
- [x] Create marketplace_accounts table
- [x] Create online_orders table
- [x] Create order_items table
- [x] Create marketplace_fees table
- [x] Create settlements table
- [x] Add performance indexes
- [x] Configure RLS policies
- [x] Create helper functions
- [x] Create triggers for automated calculations
- [x] Add stock sync trigger

**Verification Steps**:
```sql
-- Run these in Supabase SQL Editor to verify
SELECT COUNT(*) FROM marketplace_accounts;
SELECT COUNT(*) FROM online_orders;
SELECT COUNT(*) FROM order_items;
SELECT COUNT(*) FROM marketplace_fees;
SELECT COUNT(*) FROM settlements;
```

### Task 2: Repository Layer Implementation
**Status**: PENDING
**File**: `marketplace-repository.js`
**Priority**: HIGH

**Required Functions**:

```javascript
// Marketplace Accounts
async function getMarketplaceAccounts()
async function getMarketplaceAccountById(id)
async function createMarketplaceAccount(accountData)
async function updateMarketplaceAccount(id, accountData)
async function deleteMarketplaceAccount(id)
async function toggleMarketplaceAccountStatus(id, isActive)

// Online Orders
async function getOnlineOrders(filters = {})
async function getOnlineOrderById(id)
async function getOnlineOrderByOrderNumber(orderNumber, marketplaceAccountId)
async function createOnlineOrder(orderData)
async function updateOnlineOrder(id, orderData)
async function deleteOnlineOrder(id)
async function updateOrderStatus(id, status)

// Order Items
async function getOrderItemsByOrderId(onlineOrderId)
async function createOrderItem(itemData)
async function createOrderItemsBatch(itemsData)
async function updateOrderItem(id, itemData)
async function deleteOrderItem(id)
async function deleteOrderItemsByOrderId(onlineOrderId)

// Marketplace Fees
async function getFeesByOrderId(onlineOrderId)
async function createFee(feeData)
async function createFeesBatch(feesData)
async function deleteFee(id)
async function deleteFeesByOrderId(onlineOrderId)

// Settlements
async function getSettlements(filters = {})
async function getSettlementById(id)
async function createSettlement(settlementData)
async function updateSettlement(id, settlementData)
async function deleteSettlement(id)

// Reporting & Analytics
async function getMarketplaceRevenueSummary(startDate, endDate)
async function getPlatformFeeSummary(startDate, endDate)
async function getOrderStatistics(marketplaceAccountId, startDate, endDate)
async function getSettlementReconciliation(settlementId)
```

### Task 3: Business Logic Layer
**Status**: PENDING
**File**: `marketplace-service.js`
**Priority**: HIGH

**Required Functions**:

```javascript
// Order Processing
async function processOrderImport(orderData, marketplaceAccountId)
async function validateOrderData(orderData)
async function calculateOrderTotals(orderItems, fees)
async function syncOrderStock(onlineOrderId)

// Fee Calculations
async function calculatePlatformFees(platform, grossSales, orderData)
async function getShopeeFeeStructure(grossSales)
async function getTikTokFeeStructure(grossSales)
async function getTokopediaFeeStructure(grossSales)
async function getLazadaFeeStructure(grossSales)

// Revenue Calculations
async function calculateNetRevenue(grossSales, voucherDiscount, platformFees)
async function calculateProfitMargin(netRevenue, productCosts)
async function calculateChannelProfitability(marketplaceAccountId, period)

// Settlement Logic
async function reconcileSettlement(settlementData)
async function matchOrdersToSettlement(settlementId, orderIds)
async function calculateSettlementDiscrepancies(settlementId)

// Stock Management
async function reserveStockForOrder(orderItems)
async function releaseStockForOrder(orderItems)
async function checkStockAvailability(orderItems)
```

### Task 4: Utility Functions
**Status**: PENDING
**File**: `marketplace-utils.js`
**Priority**: MEDIUM

**Required Functions**:

```javascript
// CSV Import
async function parseOrderCSV(csvData, platform)
async function validateCSVHeaders(headers, platform)
async function mapCSVToOrderData(csvRow, platform)

// Data Validation
function validateSKU(sku)
function validateEmail(email)
function validatePhoneNumber(phone)
function validateCurrencyAmount(amount)

// Error Handling
function handleDatabaseError(error)
function handleValidationError(error)
function createErrorResponse(message, code)

// Formatting
function formatCurrency(amount)
function formatDate(date)
function formatPlatformName(platform)

// Platform Helpers
function getPlatformDisplayName(platform)
function getPlatformColor(platform)
function getPlatformIcon(platform)
```

---

## Backward Compatibility Check

### ✅ FULL BACKWARD COMPATIBILITY MAINTAINED

#### Database Layer
- **New Tables**: 5 new tables created
- **Existing Tables**: 0 tables modified
- **Existing Columns**: 0 columns added/modified
- **Existing Relationships**: 0 relationships changed
- **Risk Level**: ZERO

#### Application Layer
- **Existing Files**: 0 files modified
- **Existing Functions**: 0 functions changed
- **Existing UI**: 0 UI components changed
- **Existing Workflows**: 0 workflows disrupted
- **Risk Level**: ZERO

#### Data Integrity
- **Existing Data**: 0 data migrations required
- **Data Loss Risk**: ZERO (new tables only)
- **Performance Impact**: Minimal (new indexes only)
- **Storage Impact**: Minimal (empty tables initially)

#### Security
- **Existing RLS**: 0 policies modified
- **New RLS**: 5 new policies added (marketplace tables only)
- **Auth System**: 0 changes to auth
- **Access Control**: Enhanced (new granular controls)

---

## Testing Strategy for Phase 1

### Unit Tests (Repository Layer)
```javascript
// Test marketplace account CRUD
test('create marketplace account')
test('get marketplace accounts')
test('update marketplace account')
test('delete marketplace account')

// Test online order CRUD
test('create online order')
test('get online orders with filters')
test('update order status')
test('delete online order')

// Test order items
test('create order item')
test('create order items batch')
test('calculate total price automatically')

// Test fees
test('create marketplace fee')
test('calculate fee totals')

// Test settlements
test('create settlement')
test('get settlement by ID')
```

### Integration Tests
```javascript
// Test stock sync trigger
test('stock deduction on order processing')
test('stock restoration on order cancellation')

// Test net revenue calculation
test('automatic net revenue calculation')
test('fee deduction accuracy')

// Test RLS policies
test('admin can access marketplace tables')
test('cashier can read but not write')
test('unauthenticated access blocked')
```

### Database Tests
```sql
-- Test constraints
INSERT INTO marketplace_accounts (platform, shop_name) 
VALUES ('INVALID', 'Test'); -- Should fail

-- Test triggers
INSERT INTO online_orders (marketplace_account_id, order_number, order_date, gross_sales)
VALUES (test_uuid, 'TEST001', NOW(), 100000); -- Should auto-calculate net_revenue

-- Test cascades
DELETE FROM marketplace_accounts WHERE id = test_uuid; -- Should cascade to settlements
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Backup current database
- [ ] Review migration SQL in staging
- [ ] Test migration on copy of production data
- [ ] Verify RLS policies work correctly
- [ ] Document rollback procedure

### Deployment Steps
1. Run `migration_marketplace_system.sql` in Supabase SQL Editor
2. Verify all tables created successfully
3. Verify indexes created
4. Verify RLS policies active
5. Test triggers with sample data
6. Verify stock sync functionality

### Post-Deployment
- [ ] Run verification queries
- [ ] Test repository functions
- [ ] Monitor database performance
- [ ] Check for any errors in logs
- [ ] Document any issues

### Rollback Procedure
```sql
-- If rollback needed
DROP TRIGGER IF EXISTS sync_stock_on_online_order ON online_orders;
DROP TRIGGER IF EXISTS calculate_online_order_net_revenue ON online_orders;
DROP TRIGGER IF EXISTS update_settlements_updated_at ON settlements;
DROP TRIGGER IF EXISTS update_online_orders_updated_at ON online_orders;
DROP TRIGGER IF EXISTS update_marketplace_accounts_updated_at ON marketplace_accounts;

DROP FUNCTION IF EXISTS sync_online_order_stock();
DROP FUNCTION IF EXISTS calculate_order_net_revenue();
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS marketplace_fees;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS online_orders;
DROP TABLE IF EXISTS marketplace_accounts;
```

---

## Success Criteria

### Database Migration
- [ ] All 5 tables created successfully
- [ ] All indexes created and working
- [ ] All RLS policies active and correct
- [ ] All triggers functioning properly
- [ ] No existing data affected

### Repository Layer
- [ ] All CRUD functions implemented
- [ ] All functions handle errors properly
- [ ] All functions validate inputs
- [ ] All functions use proper RLS
- [ ] Code follows existing patterns

### Business Logic
- [ ] Fee calculations accurate
- [ ] Stock sync working correctly
- [ ] Revenue calculations correct
- [ ] Settlement reconciliation functional
- [ ] Edge cases handled

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Database tests pass
- [ ] Performance acceptable
- [ ] No security vulnerabilities

---

## Estimated Timeline

### Task 1: Database Migration
- **Status**: ✅ COMPLETED
- **Time**: 2 hours
- **Effort**: Low

### Task 2: Repository Layer
- **Status**: PENDING
- **Time**: 8-12 hours
- **Effort**: Medium
- **Dependencies**: Task 1 complete

### Task 3: Business Logic
- **Status**: PENDING
- **Time**: 6-8 hours
- **Effort**: Medium
- **Dependencies**: Task 2 complete

### Task 4: Utility Functions
- **Status**: PENDING
- **Time**: 4-6 hours
- **Effort**: Low
- **Dependencies**: None

### Testing & Validation
- **Status**: PENDING
- **Time**: 4-6 hours
- **Effort**: Medium
- **Dependencies**: Tasks 2,3,4 complete

**Total Phase 1 Estimate**: 24-34 hours (3-4 working days)

---

## Next Steps After Phase 1

### Phase 2: Backend API Layer (Optional)
- Create API endpoints for marketplace operations
- Implement webhook handlers for marketplace platforms
- Add authentication middleware
- Create rate limiting

### Phase 3: UI Development
- Create marketplace.html
- Create online-orders.html
- Create settlements.html
- Update dashboard with marketplace KPIs

### Phase 4: Integration & Testing
- Manual CSV import functionality
- End-to-end testing
- Performance optimization
- User acceptance testing

---

## Notes & Considerations

### Security
- API keys stored in marketplace_accounts table should be encrypted
- Consider using Supabase Vault for sensitive credentials
- RLS policies ensure proper data isolation

### Performance
- Indexes added on frequently queried columns
- Consider materialized views for complex reporting queries
- Monitor query performance after deployment

### Scalability
- Current schema supports multiple marketplaces
- Can easily add new platforms by extending CHECK constraints
- Settlement system handles high volume transactions

### Data Consistency
- Triggers ensure automatic calculations
- Stock sync prevents overselling
- Settlement reconciliation catches discrepancies

---

*Phase 1 Implementation Plan*
*Database + Repository Layer Only*
*No UI Changes*
*Full Backward Compatibility*
