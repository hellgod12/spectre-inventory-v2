# Spectre Inventory & POS System - Dependency Map

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive file dependency mapping for refactor and stabilization audit

---

## 1. Dependency Overview

### 1.1 Dependency Types

| Type | Description |
|------|-------------|
| **HTML → JS** | HTML pages loading JavaScript modules via `<script>` tags |
| **JS → JS** | JavaScript modules importing or calling other modules |
| **JS → Global** | Modules using global objects (window.*, supabaseClient) |
| **JS → DB** | Modules querying specific Supabase tables |
| **CSS → HTML** | CSS files linked in HTML pages |

### 1.2 External Dependencies

| Dependency | Version | Purpose | Used By |
|------------|---------|---------|---------|
| Supabase JS Client | CDN | Database & Auth | All pages (except login.html uses CDN directly) |
| Sharp | ^0.33.0 | Image processing | `generate-icons.js` (Node.js only) |
| Capacitor | ^6.x | Mobile app wrapper | Build process only |

---

## 2. HTML → JavaScript Dependencies

### 2.1 Page Script Loading Matrix

| HTML Page | Scripts Loaded | Order |
|-----------|----------------|-------|
| **index.html** | style.css, status.css, auth.js, button-animations.js, candle-manager.js, script.js | 1-5 |
| **barang.html** | style.css, auth.js, button-animations.js, scan-helper.js, barang-scan-ui.js, candle-manager.js, barang.js | 1-6 |
| **member.html** | style.css, auth.js, button-animations.js, [member.js - MISSING] | 1-3 |
| **penjualan.html** | style.css, status.css, auth.js, button-animations.js, receipt-printer.js, scan-helper.js, scan-terjual.js, candle-manager.js, penjualan.js | 1-8 |
| **pengeluaran.html** | style.css, auth.js, button-animations.js, pengeluaran.js | 1-4 |
| **member-payments.html** | style.css, auth.js, member-payments.js | 1-3 |
| **login.html** | style.css, [Supabase CDN directly] | 1-2 |
| **marketplace.html** | style.css, status.css, auth.js, button-animations.js, marketplace.js | 1-5 |
| **discounts.html** | style.css, status.css, auth.js, button-animations.js, discount-system.js | 1-5 |
| **marketplace-reports.html** | style.css, status.css, auth.js, button-animations.js, marketplace-repository.js, marketplace-service.js, marketplace-utils.js, marketplace-reporting.js | 1-8 |
| **reports.html** | style.css, auth.js, button-animations.js, sales-reports.js | 1-4 |
| **returns.html** | style.css, status.css, auth.js, button-animations.js, returns-management.js | 1-5 |

### 2.2 CSS Dependencies

| HTML Page | CSS Files |
|-----------|-----------|
| index.html | style.css, status.css |
| barang.html | style.css |
| member.html | style.css |
| penjualan.html | style.css, status.css |
| pengeluaran.html | style.css |
| member-payments.html | style.css |
| login.html | style.css |
| marketplace.html | style.css, status.css |
| discounts.html | style.css, status.css |
| marketplace-reports.html | style.css, status.css |
| reports.html | style.css |
| returns.html | style.css, status.css |

---

## 3. JavaScript Module Dependencies

### 3.1 Core Dependencies (Global)

**Global Object:** `supabaseClient`
- **Defined in:** `auth.js`
- **Used by:** All JavaScript modules except `login.html` (uses CDN directly)
- **Scope:** Global window object

**Global Objects Exposed by Modules:**

| Module | Global Object | Functions/Properties |
|--------|---------------|---------------------|
| `auth.js` | `supabaseClient`, `initAuth()`, `hasRole()`, `isAdmin()`, `isCashier()`, `requireAdmin()`, `logout()`, `hideElementsForCashier()`, `showUserInfo()` | Authentication & role management |
| `discount-system.js` | `window.DiscountSystem` | createDiscount, getDiscounts, applyDiscount, validateDiscount, incrementUsage, deactivateDiscount, getDiscountStatistics |
| `inventory-reports.js` | `window.InventoryReports` | getInventoryMovement, getLowStockReport, getInventoryValuation, getProductPerformance, exportInventoryReport |
| `marketplace-repository.js` | (module.exports) | All repository functions (not window global) |
| `marketplace-service.js` | (module.exports) | All service functions (not window global) |
| `marketplace-utils.js` | (module.exports) | All utility functions (not window global) |
| `marketplace-reporting.js` | (module.exports) | All reporting functions (not window global) |
| `purchase-orders.js` | `window.PurchaseOrders` | createPurchaseOrder, generatePONumber, getPurchaseOrders, getPurchaseOrderById, updatePOStatus, receivePOItems, cancelPurchaseOrder, getPOStatistics |
| `receipt-printer.js` | `window.ReceiptPrinter` | generateReceiptHTML, formatCurrency, printReceipt, showPrintDialog |
| `returns-management.js` | `window.ReturnsManagement` | createReturn, processReturn, getReturns, getReturnById, cancelReturn, getReturnStatistics |
| `sales-reports.js` | `window.SalesReports` | getSalesReport, getSalesTrend, getTopProducts, getPaymentMethods, exportSalesReport |
| `supplier-management.js` | `window.SupplierManagement` | createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier, getSupplierProducts, getSupplierPerformance |
| `tax-config.js` | `window.TaxConfig` | getTaxConfig, updateTaxConfig, calculateTax, calculateCartTax, getTaxReport, exportTaxReport |

### 3.2 Module-to-Module Dependencies

#### 3.2.1 Marketplace Module Chain

```
marketplace-reports.html
    ↓ loads
marketplace-reporting.js
    ↓ calls
marketplace-repository.js
marketplace-service.js
marketplace-utils.js
```

**Dependencies:**
- `marketplace-reporting.js` → `marketplace-repository.js` (getMarketplaceRevenueSummary)
- `marketplace-reporting.js` → `marketplace-utils.js` (formatCurrency, formatDate - if used)
- `marketplace-service.js` → `marketplace-repository.js` (all data access)
- `marketplace-service.js` → `marketplace-utils.js` (validation, formatting)
- `marketplace.js` → `marketplace-utils.js` (formatCurrency, formatDate, formatOrderStatus, getPlatformIcon)

#### 3.2.2 Barcode Scanning Chain

```
barang.html / penjualan.html
    ↓ loads
scan-helper.js
    ↓ used by
barang-scan-ui.js (barang.html)
scan-masuk.js (barang.html - but not loaded in HTML)
scan-terjual.js (penjualan.html)
```

**Dependencies:**
- `barang-scan-ui.js` → `scan-helper.js` (setupCameraScan)
- `scan-masuk.js` → `scan-helper.js` (setupCameraScan)
- `scan-terjual.js` → `scan-helper.js` (setupCameraScan)

#### 3.2.3 Animation Chain

```
index.html / barang.html / penjualan.html
    ↓ loads
candle-manager.js
    ↓ called by
script.js (dashboard)
barang.js (inventory)
penjualan.js (sales)
```

**Dependencies:**
- `script.js` → `candle-manager.js` (applyStockDelta, applyPaymentDelta, refreshStockProgress)
- `barang.js` → `candle-manager.js` (applyStockDelta, refreshStockProgress)
- `penjualan.js` → `candle-manager.js` (applyStockDelta, applyPaymentDelta)

#### 3.2.4 Button Animations

```
All pages with .spectre-btn
    ↓ loads
button-animations.js
    ↓ auto-attaches to
.spectre-btn elements
```

**No explicit function calls - automatic event listener attachment**

#### 3.2.5 Receipt Printing

```
penjualan.html
    ↓ loads
receipt-printer.js
    ↓ called by
penjualan.js (after successful payment)
```

**Dependencies:**
- `penjualan.js` → `window.ReceiptPrinter.showPrintDialog()`

#### 3.2.6 Discount System

```
discounts.html
    ↓ loads
discount-system.js
    ↓ exposes
window.DiscountSystem
```

**No current usage in other modules - standalone**

#### 3.2.7 Reports Modules

```
reports.html
    ↓ loads
sales-reports.js
    ↓ exposes
window.SalesReports

marketplace-reports.html
    ↓ loads
marketplace-reporting.js
    ↓ exposes
(module.exports - not window global)
```

**No cross-dependencies between report modules**

---

## 4. Database Table Dependencies

### 4.1 Table Usage by Module

| Module | Tables Read | Tables Written | Tables Updated | Tables Deleted |
|--------|-------------|----------------|----------------|-----------------|
| **auth.js** | profiles | - | - | - |
| **script.js** | payments, products, sales_history, online_orders, expenses | payments | payments, products, sales_history, online_orders | payments |
| **barang.js** | products | products | products | products (soft delete) |
| **barang-scan-ui.js** | - | - | - | - |
| **penjualan.js** | products, members, payments, sales_history | payments, sales_history | products, payments | - |
| **pengeluaran.js** | expenses | expenses | - | - |
| **member-payments.js** | payments, sales_history, products | - | payments, products | - |
| **marketplace.js** | online_orders, order_items, marketplace_accounts, products | online_orders, order_items, marketplace_accounts | online_orders | - |
| **discount-system.js** | discounts | discounts | discounts | - |
| **returns-management.js** | returns, payments, products, sales_history | returns | payments, products | - |
| **sales-reports.js** | payments, products, sales_history | - | - | - |
| **inventory-reports.js** | sales_history, returns, products | - | - | - |
| **marketplace-repository.js** | marketplace_accounts, online_orders, order_items, marketplace_fees, settlements, products | marketplace_accounts, online_orders, order_items, marketplace_fees, settlements | marketplace_accounts, online_orders, order_items, marketplace_fees, settlements | marketplace_accounts, online_orders, order_items, marketplace_fees, settlements |
| **marketplace-service.js** | (via repository) | (via repository) | (via repository) | (via repository) |
| **marketplace-utils.js** | - | - | - | - |
| **marketplace-reporting.js** | payments, sales_history, online_orders, order_items, marketplace_accounts, products, settlements | - | - | - |
| **purchase-orders.js** | purchase_orders, po_items, suppliers, products | purchase_orders, po_items | purchase_orders, po_items, products | purchase_orders |
| **receipt-printer.js** | - | - | - | - |
| **supplier-management.js** | suppliers, products, sales_history | suppliers | suppliers | suppliers |
| **tax-config.js** | settings, payments | settings | - | - |
| **button-animations.js** | - | - | - | - |
| **candle-manager.js** | - | - | - | - |
| **scan-helper.js** | - | - | - | - |
| **scan-masuk.js** | - | - | - | - |
| **scan-terjual.js** | products | - | - | - |
| **generate-icons.js** | - | - | - | - |
| **service-worker.js** | - | - | - | - |

### 4.2 Table Dependency Graph

```
products
    ↓ read by
barang.js, penjualan.js, script.js, scan-terjual.js, sales-reports.js, inventory-reports.js, marketplace.js, marketplace-repository.js, marketplace-reporting.js, purchase-orders.js, supplier-management.js, member-payments.js, returns-management.js
    ↓ written by
barang.js, penjualan.js, marketplace-repository.js, purchase-orders.js, member-payments.js, returns-management.js

payments
    ↓ read by
script.js, member-payments.js, sales-reports.js, marketplace-reporting.js, tax-config.js
    ↓ written by
penjualan.js, script.js
    ↓ updated by
script.js, member-payments.js, returns-management.js

sales_history
    ↓ read by
script.js, sales-reports.js, inventory-reports.js, marketplace-reporting.js, supplier-management.js, member-payments.js, returns-management.js
    ↓ written by
penjualan.js, script.js

online_orders
    ↓ read by
script.js, marketplace.js, marketplace-repository.js, marketplace-reporting.js
    ↓ written by
marketplace.js
    ↓ updated by
marketplace.js, marketplace-repository.js

order_items
    ↓ read by
marketplace.js, marketplace-repository.js, marketplace-reporting.js
    ↓ written by
marketplace.js
    ↓ updated by
marketplace-repository.js

members
    ↓ read by
penjualan.js
    ↓ written by
(member.html - inline)

expenses
    ↓ read by
script.js, pengeluaran.js
    ↓ written by
pengeluaran.js

discounts
    ↓ read by
discount-system.js
    ↓ written by
discount-system.js

returns
    ↓ read by
returns-management.js
    ↓ written by
returns-management.js

marketplace_accounts
    ↓ read by
marketplace.js, marketplace-repository.js, marketplace-reporting.js
    ↓ written by
marketplace.js
    ↓ updated by
marketplace-repository.js

settlements
    ↓ read by
marketplace-repository.js
    ↓ written by
marketplace-repository.js

marketplace_fees
    ↓ read by
marketplace-repository.js
    ↓ written by
marketplace-repository.js

suppliers
    ↓ read by
supplier-management.js, purchase-orders.js
    ↓ written by
supplier-management.js

purchase_orders
    ↓ read by
purchase-orders.js
    ↓ written by
purchase-orders.js
    ↓ updated by
purchase-orders.js

po_items
    ↓ read by
purchase-orders.js
    ↓ written by
purchase-orders.js
    ↓ updated by
purchase-orders.js

profiles
    ↓ read by
auth.js
    ↓ written by
(auth system)

settings
    ↓ read by
tax-config.js
    ↓ written by
tax-config.js
```

---

## 5. Circular Dependency Analysis

### 5.1 Circular Dependencies Detected

**None detected** - The codebase does not have circular dependencies between JavaScript modules.

### 5.2 Potential Circular Patterns

**Pattern 1: Cross-Tab Communication (Not True Circular)**
- `penjualan.js` writes to `localStorage`
- `candle-manager.js` reads from `localStorage`
- This is event-based, not a direct circular dependency

**Pattern 2: Marketplace Module Chain (Linear, Not Circular)**
- `marketplace-reporting.js` → `marketplace-repository.js`
- `marketplace-service.js` → `marketplace-repository.js`
- No circular references

---

## 6. Missing Dependencies

### 6.1 Missing JavaScript Files

| HTML File | Expected Script | Status |
|-----------|-----------------|--------|
| `member.html` | `member.js` | **MISSING** - Logic likely inline or not implemented |

### 6.2 Unused JavaScript Files

| File | Loaded By | Status |
|------|-----------|--------|
| `scan-masuk.js` | Not loaded in any HTML | **UNUSED** - Referenced but not loaded |
| `purchase-orders.js` | Not loaded in any HTML | **UNUSED** - Exposed globally but no UI |

### 6.3 Potentially Orphaned Modules

| Module | Global Export | Used By | Status |
|--------|---------------|---------|--------|
| `purchase-orders.js` | `window.PurchaseOrders` | None (no HTML loads it) | Orphaned |
| `scan-masuk.js` | None | Not loaded | Orphaned |

---

## 7. Dependency Risk Assessment

### 7.1 High-Risk Dependencies

| Dependency | Risk Level | Reason |
|------------|------------|--------|
| `auth.js` (supabaseClient) | **HIGH** | Global singleton, loaded on all pages, failure breaks entire app |
| `style.css` | **HIGH** | Loaded on all pages, changes affect entire UI |
| Direct Supabase queries | **HIGH** | Scattered across modules, no abstraction layer |

### 7.2 Medium-Risk Dependencies

| Dependency | Risk Level | Reason |
|------------|------------|--------|
| `candle-manager.js` | **MEDIUM** | Cross-tab communication via localStorage (brittle) |
| `marketplace-repository.js` | **MEDIUM** | Central data access for marketplace, single point of failure |
| `button-animations.js` | **MEDIUM** | Auto-attaches to all `.spectre-btn`, potential conflicts |

### 7.3 Low-Risk Dependencies

| Dependency | Risk Level | Reason |
|------------|------------|--------|
| Utility modules (formatting, validation) | **LOW** | Pure functions, no side effects |
| Report modules | **LOW** | Read-only operations, isolated |

---

## 8. Dependency Optimization Opportunities

### 8.1 Consolidation Opportunities

1. **Currency Formatting**
   - Duplicated in: `marketplace.js`, `receipt-printer.js`, `marketplace-utils.js`
   - **Recommendation:** Create single `formatCurrency()` utility

2. **Date Formatting**
   - Duplicated in: `marketplace.js`, `marketplace-utils.js`
   - **Recommendation:** Use single `formatDate()` utility

3. **Status Badge Rendering**
   - Duplicated in multiple HTML files
   - **Recommendation:** Create reusable component or utility function

### 8.2 Abstraction Opportunities

1. **Data Access Layer**
   - Current: Direct Supabase queries in each module
   - **Recommendation:** Create repository pattern for all modules (like marketplace)

2. **Error Handling**
   - Current: Inconsistent (alerts, toasts, console.error)
   - **Recommendation:** Create global error handler

3. **State Management**
   - Current: Local state + localStorage events
   - **Recommendation:** Implement centralized state management

### 8.3 Loading Optimization

1. **Script Loading Order**
   - Current: All scripts loaded synchronously
   - **Recommendation:** Use `defer` or `async` where appropriate

2. **Code Splitting**
   - Current: All scripts loaded on each page
   - **Recommendation:** Load only required scripts per page

3. **Bundle Optimization**
   - Current: No bundling, individual script tags
   - **Recommendation:** Consider bundling for production

---

## 9. Dependency Graph Visualization

### 9.1 HTML → JS Dependency Tree

```
index.html
├── style.css
├── status.css
├── auth.js (global: supabaseClient)
├── button-animations.js
├── candle-manager.js
└── script.js
    └── uses: supabaseClient, candle-manager

barang.html
├── style.css
├── auth.js (global: supabaseClient)
├── button-animations.js
├── scan-helper.js
├── barang-scan-ui.js
│   └── uses: scan-helper
├── candle-manager.js
└── barang.js
    └── uses: supabaseClient, candle-manager

penjualan.html
├── style.css
├── status.css
├── auth.js (global: supabaseClient)
├── button-animations.js
├── receipt-printer.js (global: window.ReceiptPrinter)
├── scan-helper.js
├── scan-terjual.js
│   └── uses: scan-helper
├── candle-manager.js
└── penjualan.js
    └── uses: supabaseClient, candle-manager, window.ReceiptPrinter

marketplace-reports.html
├── style.css
├── status.css
├── auth.js (global: supabaseClient)
├── button-animations.js
├── marketplace-repository.js
├── marketplace-service.js
│   └── uses: marketplace-repository, marketplace-utils
├── marketplace-utils.js
└── marketplace-reporting.js
    └── uses: marketplace-repository, marketplace-service, marketplace-utils
```

### 9.2 Module Dependency Graph (Simplified)

```
auth.js (root)
    ↓
All other modules (supabaseClient dependency)

marketplace-utils.js (utility)
    ↓
marketplace-service.js
    ↓
marketplace-repository.js
    ↓
marketplace-reporting.js

scan-helper.js (utility)
    ↓
barang-scan-ui.js
scan-masuk.js
scan-terjual.js

candle-manager.js (utility)
    ↓
script.js
barang.js
penjualan.js
```

---

## 10. Dependency Metrics

### 10.1 Module Complexity

| Module | Lines of Code | Dependencies | Complexity |
|--------|---------------|--------------|------------|
| `marketplace-repository.js` | 1184 | 1 (supabaseClient) | High |
| `marketplace-service.js` | 735 | 2 (repository, utils) | High |
| `marketplace-utils.js` | 744 | 0 | Medium |
| `marketplace-reporting.js` | 544 | 3 (repository, service, utils) | High |
| `penjualan.js` | 876 | 3 (supabaseClient, candle-manager, ReceiptPrinter) | High |
| `script.js` | 756 | 2 (supabaseClient, candle-manager) | Medium |
| `barang.js` | 507 | 2 (supabaseClient, candle-manager) | Medium |
| `style.css` | 3363 | 0 | High |

### 10.2 Dependency Coupling

| Coupling Type | Count | Percentage |
|---------------|-------|------------|
| No dependencies (pure utilities) | 5 | 17% |
| Low coupling (1-2 dependencies) | 18 | 60% |
| Medium coupling (3-5 dependencies) | 6 | 20% |
| High coupling (5+ dependencies) | 1 | 3% |

### 10.3 Database Access Patterns

| Pattern | Count | Percentage |
|---------|-------|------------|
| Direct Supabase queries | 22 | 73% |
| Repository pattern | 1 | 3% |
| No database access | 7 | 24% |

---

## 11. Recommendations

### 11.1 Immediate Actions

1. **Implement Missing `member.js`**
   - Extract inline logic from `member.html`
   - Follow pattern of other page modules

2. **Remove Orphaned Files**
   - `scan-masuk.js` - Not loaded by any HTML
   - `purchase-orders.js` - No UI, consider if needed

3. **Standardize Global Exports**
   - Decide on pattern: `window.ModuleName` vs `module.exports`
   - Currently inconsistent

### 11.2 Short-Term Improvements

1. **Create Utility Library**
   - Consolidate `formatCurrency()`, `formatDate()`, `formatOrderStatus()`
   - Reduce code duplication

2. **Implement Repository Pattern**
   - Extend marketplace repository pattern to POS modules
   - Centralize Supabase queries

3. **Add Dependency Injection**
   - Pass `supabaseClient` as parameter instead of global
   - Improve testability

### 11.3 Long-Term Improvements

1. **Implement Module Bundler**
   - Use Vite or Webpack
   - Optimize loading
   - Enable tree-shaking

2. **Add Type Definitions**
   - Migrate to TypeScript
   - Define interfaces for all modules
   - Improve IDE support

3. **Implement State Management**
   - Add Pinia or similar
   - Reduce localStorage usage
   - Improve cross-tab communication

---

## Appendix A: Complete Dependency Matrix

### A.1 JavaScript Module Dependency Matrix

| Module | auth.js | button-animations.js | candle-manager.js | discount-system.js | inventory-reports.js | marketplace-repository.js | marketplace-service.js | marketplace-utils.js | marketplace-reporting.js | purchase-orders.js | receipt-printer.js | returns-management.js | sales-reports.js | scan-helper.js | supplier-management.js | tax-config.js |
|--------|---------|---------------------|------------------|-------------------|---------------------|---------------------------|------------------------|---------------------|--------------------------|-------------------|--------------------|----------------------|-----------------|----------------|----------------------|---------------|
| script.js | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - |
| barang.js | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - |
| barang-scan-ui.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | ✓ | - | - |
| penjualan.js | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | ✓ | - | - | ✓ | - | - |
| pengeluaran.js | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| member-payments.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| marketplace.js | ✓ | ✓ | - | - | - | - | - | ✓ | - | - | - | - | - | - | - | - |
| discounts.html (discount-system.js) | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| marketplace-reporting.js | ✓ | ✓ | - | - | - | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | - |
| reports.html (sales-reports.js) | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| returns.html (returns-management.js) | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| marketplace-service.js | - | - | - | - | - | ✓ | - | ✓ | - | - | - | - | - | - | - | - |
| marketplace-repository.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| marketplace-utils.js | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| purchase-orders.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| receipt-printer.js | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| returns-management.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| sales-reports.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| scan-helper.js | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| scan-masuk.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | ✓ | - | - |
| scan-terjual.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | ✓ | - | - |
| supplier-management.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| tax-config.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| inventory-reports.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| discount-system.js | ✓ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |

**Legend:**
- ✓ = Direct dependency (uses/imports)
- - = No dependency

---

**End of Dependency Map**
