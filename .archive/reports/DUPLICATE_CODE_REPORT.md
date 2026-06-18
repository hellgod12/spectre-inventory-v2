# Spectre Inventory & POS System - Duplicate Code Report

**Generated:** 2025-01-XX  
**Purpose:** Identify duplicate code patterns for refactoring and cleanup

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| Total JavaScript Files Analyzed | 30 |
| Total HTML Files Analyzed | 11 |
| Duplicate Code Patterns Found | 15 |
| High Priority Duplications | 5 |
| Medium Priority Duplications | 7 |
| Low Priority Duplications | 3 |
| Estimated Lines of Code to Save | ~400-600 lines |

---

## 2. High Priority Duplications

### 2.1 Currency Formatting

**Duplication Level:** HIGH  
**Impact:** 5 files  
**Estimated Savings:** ~30 lines

**Locations:**
1. `marketplace.js` (lines 462-473)
```javascript
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
```

2. `receipt-printer.js` (lines 191-193)
```javascript
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}
```

3. `marketplace-utils.js` (lines 400-408)
```javascript
function formatCurrency(amount) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'Rp 0';
    return 'Rp ' + num.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}
```

4. `script.js` (inline in multiple places)
5. `penjualan.js` (inline calculations)

**Recommendation:** Create single `formatCurrency()` utility in a shared module (e.g., `format-utils.js`)

---

### 2.2 Date Formatting

**Duplication Level:** HIGH  
**Impact:** 4 files  
**Estimated Savings:** ~40 lines

**Locations:**
1. `marketplace.js` (lines 476-491)
```javascript
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
```

2. `marketplace-utils.js` (lines 410-425)
```javascript
function formatDate(date, format = 'full') {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    const options = {
        full: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        short: { year: 'numeric', month: '2-digit', day: '2-digit' },
        time: { hour: '2-digit', minute: '2-digit' },
        date: { year: 'numeric', month: 'long', day: 'numeric' }
    };
    return dateObj.toLocaleDateString('id-ID', options[format] || options.full);
}
```

3. `pengeluaran.js` (lines 56-57 - inline)
4. `sales-reports.js` (inline date calculations)

**Recommendation:** Consolidate into shared `formatDate()` utility

---

### 2.3 Supabase Query Patterns

**Duplication Level:** HIGH  
**Impact:** 15+ files  
**Estimated Savings:** ~200 lines

**Pattern 1: Simple SELECT with Error Handling**
```javascript
// Found in: barang.js, penjualan.js, pengeluaran.js, member-payments.js, etc.
const { data, error } = await supabaseClient
    .from('table_name')
    .select('*')
    .order('column', { ascending: false });

if (error) {
    console.error('Error:', error);
    // handle error
}
```

**Pattern 2: INSERT with Error Handling**
```javascript
// Found in: barang.js, penjualan.js, pengeluaran.js, etc.
const { data, error } = await supabaseClient
    .from('table_name')
    .insert([record]);

if (error) {
    alert('Error: ' + error.message);
    return;
}
```

**Pattern 3: UPDATE with Error Handling**
```javascript
// Found in: barang.js, penjualan.js, script.js, etc.
const { error } = await supabaseClient
    .from('table_name')
    .update(updates)
    .eq('id', id);

if (error) {
    alert('Error: ' + error.message);
    return;
}
```

**Recommendation:** Create repository layer with standard CRUD methods (similar to `marketplace-repository.js`)

---

### 2.4 Toast/Notification Patterns

**Duplication Level:** HIGH  
**Impact:** 6 files  
**Estimated Savings:** ~50 lines

**Locations:**
1. `penjualan.js` (lines 130-140)
```javascript
function showSaleSuccess(message) {
    if (salesPanel) {
        salesPanel.classList.add('sale-flash');
        setTimeout(() => salesPanel.classList.remove('sale-flash'), 900);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}
```

2. `pengeluaran.js` (lines 12-18)
```javascript
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}
```

3. `barang.js` (similar pattern)
4. `script.js` (similar pattern)
5. `marketplace.js` (alert-based, different pattern)
6. `member-payments.js` (alert-based, different pattern)

**Recommendation:** Create shared `showToast()` and `showAlert()` utilities

---

### 2.5 KPI Card Rendering

**Duplication Level:** HIGH  
**Impact:** 8 HTML files  
**Estimated Savings:** ~100 lines (HTML)

**Pattern:**
```html
<!-- Found in: index.html, barang.html, member.html, penjualan.html, etc. -->
<div class="spectre-kpi-card">
    <div class="spectre-kpi-label">LABEL</div>
    <div class="spectre-kpi-value">VALUE</div>
    <div class="spectre-kpi-subtitle">SUBTITLE</div>
</div>
```

**Variations:**
- Different classes for trend indicators
- Different icon placements
- Different grid layouts

**Recommendation:** Create reusable KPI card component or JavaScript function

---

## 3. Medium Priority Duplications

### 3.1 Status Badge Rendering

**Duplication Level:** MEDIUM  
**Impact:** 6 HTML files  
**Estimated Savings:** ~60 lines (HTML)

**Locations:**
1. `penjualan.html` - Payment status badges
2. `marketplace.html` - Order status badges
3. `returns.html` - Return status badges
4. `member-payments.html` - Payment status badges
5. `marketplace-reports.html` - Status badges
6. `reports.html` - Status badges

**Pattern:**
```html
<span class="status-badge status-{status}">
    {STATUS_NAME}
</span>
```

**Status Mapping (duplicated):**
```javascript
// Found in: marketplace.js, marketplace-utils.js
const statusNames = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    RETURNED: 'Returned'
};
```

**Recommendation:** Create shared `renderStatusBadge()` function

---

### 3.2 Platform Icon Mapping

**Duplication Level:** MEDIUM  
**Impact:** 2 files  
**Estimated Savings:** ~15 lines

**Locations:**
1. `marketplace.js` (lines 509-518)
```javascript
function getPlatformIcon(platform) {
    const platformIcons = {
        SHOPEE: '🛒',
        TIKTOK: '🎵',
        TOKOPEDIA: '🏪',
        LAZADA: '📦'
    };
    return platformIcons[platform] || '🏪';
}
```

2. `marketplace-utils.js` (lines 350-359)
```javascript
function getPlatformIcon(platform) {
    const icons = {
        SHOPEE: '🛒',
        TIKTOK: '🎵',
        TOKOPEDIA: '🏪',
        LAZADA: '📦'
    };
    return icons[platform] || '🏪';
}
```

**Recommendation:** Remove duplicate, use `marketplace-utils.js` version

---

### 3.3 Table Rendering Patterns

**Duplication Level:** MEDIUM  
**Impact:** 8 files  
**Estimated Savings:** ~80 lines

**Pattern:**
```javascript
// Found in: pengeluaran.js, script.js, member-payments.js, etc.
let html = `
    <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
        <thead>
            <tr class="bg-black/60 border-b border-red-950 text-red-500/80 uppercase text-[10px]">
                <th class="p-3 font-bold tracking-wider">HEADER</th>
                ...
            </tr>
        </thead>
        <tbody class="bg-black/45 divide-y divide-red-950/25">
`;

data.forEach(item => {
    html += `
        <tr class="hover:bg-red-950/15 transition-colors">
            <td class="p-3">${item.value}</td>
            ...
        </tr>
    `;
});

html += '</tbody></table>';
container.innerHTML = html;
```

**Recommendation:** Create `renderTable()` utility function

---

### 3.4 Modal Handling

**Duplication Level:** MEDIUM  
**Impact:** 5 HTML files  
**Estimated Savings:** ~40 lines (HTML + JS)

**Pattern:**
```javascript
// Found in: marketplace.js, barang.js, returns.html (inline)
function openModal() {
    document.getElementById('modalId').classList.add('active');
}

function closeModal() {
    document.getElementById('modalId').classList.remove('active');
}
```

**Recommendation:** Create shared modal utility

---

### 3.5 Form Validation Patterns

**Duplication Level:** MEDIUM  
**Impact:** 6 files  
**Estimated Savings:** ~50 lines

**Pattern:**
```javascript
// Found in: penjualan.js, barang.js, pengeluaran.js, etc.
if (!value) {
    alert('Field is required');
    return;
}

const num = parseFloat(value);
if (isNaN(num) || num <= 0) {
    alert('Invalid value');
    return;
}
```

**Recommendation:** Create validation utility library

---

### 3.6 Invoice Number Generation

**Duplication Level:** MEDIUM  
**Impact:** 2 files  
**Estimated Savings:** ~25 lines

**Locations:**
1. `penjualan.js` (lines 469-490)
```javascript
async function generateInvoiceNumber() {
    try {
        const { data: existingPayments } = await supabaseClient
            .from('payments')
            .select('invoice_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNum = 1;
        if (existingPayments && existingPayments.length > 0) {
            const lastInvoice = existingPayments[0].invoice_number;
            const lastNum = parseInt(lastInvoice.replace('INV-', ''));
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        return 'INV-' + String(nextNum).padStart(4, '0');
    } catch (err) {
        console.warn('Failed to generate invoice number, using timestamp:', err);
        return 'INV-' + Date.now().toString().slice(-4);
    }
}
```

2. `purchase-orders.js` (lines 67-88) - Similar pattern for PO numbers

**Recommendation:** Create shared `generateSequenceNumber()` utility

---

### 3.7 Empty State Rendering

**Duplication Level:** MEDIUM  
**Impact:** 7 files  
**Estimated Savings:** ~35 lines

**Pattern:**
```javascript
// Found in: pengeluaran.js, member-payments.js, marketplace.js, etc.
if (!data || data.length === 0) {
    container.innerHTML = '<div class="p-8 text-center text-muted text-xs">No data found</div>';
    return;
}
```

**Recommendation:** Create `renderEmptyState()` utility

---

## 4. Low Priority Duplications

### 4.1 Category Badge Styling

**Duplication Level:** LOW  
**Impact:** 1 file  
**Estimated Savings:** ~15 lines

**Location:** `pengeluaran.js` (lines 59-64)
```javascript
let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 text-[9px] uppercase">${expense.kategori}</span>`;
if (expense.kategori === 'Pembelian Stok') katBadge = `<span class="bg-blue-950/60 text-blue-400 px-2 py-0.5 border border-blue-800/50 text-[9px] uppercase">📦 STOK</span>`;
if (expense.kategori === 'Operasional') katBadge = `<span class="bg-purple-950/60 text-purple-400 px-2 py-0.5 border border-purple-800/50 text-[9px] uppercase">💼 OPERASIONAL</span>`;
// ... more conditions
```

**Recommendation:** Create category badge mapping object

---

### 4.2 Loading State Indicators

**Duplication Level:** LOW  
**Impact:** 4 files  
**Estimated Savings:** ~20 lines

**Pattern:**
```javascript
// Found in: penjualan.js, barang.js, etc.
btn.innerText = 'MEMPROSES...';
btn.disabled = true;
// ... operation
btn.innerText = 'ORIGINAL_TEXT';
btn.disabled = false;
```

**Recommendation:** Create `setLoadingState()` utility

---

### 4.3 Console Logging Patterns

**Duplication Level:** LOW  
**Impact:** All files  
**Estimated Savings:** ~30 lines

**Pattern:**
```javascript
console.error('Error:', error);
console.log('Data loaded:', data);
console.warn('Warning:', message);
```

**Recommendation:** Create shared logging utility with environment-based filtering

---

## 5. Near-Duplicate Patterns

### 5.1 Similar CRUD Operations

**Files:** `barang.js`, `supplier-management.js`, `discount-system.js`

**Pattern:** All implement similar create/read/update/delete operations with slight variations

**Example:**
```javascript
// barang.js - create product
const { data, error } = await supabaseClient.from('products').insert([...]);

// supplier-management.js - create supplier
const { data, error } = await supabaseClient.from('suppliers').insert([...]);

// discount-system.js - create discount
const { data, error } = await supabaseClient.from('discounts').insert([...]);
```

**Recommendation:** Generic CRUD factory function

---

### 5.2 Similar Report Generation

**Files:** `sales-reports.js`, `inventory-reports.js`, `marketplace-reporting.js`

**Pattern:** All implement date range filtering, aggregation, and CSV export

**Recommendation:** Create base report class or factory

---

### 5.3 Similar Stock Update Logic

**Files:** `penjualan.js`, `member-payments.js`, `returns-management.js`

**Pattern:** All implement stock restoration with similar logic:
```javascript
const { data: product } = await supabaseClient.from('products').select('stok').eq('id', productId).single();
if (product) {
    const newStock = product.stok + quantity;
    await supabaseClient.from('products').update({ stok: newStock }).eq('id', productId);
}
```

**Recommendation:** Create `adjustStock()` utility function

---

## 6. Dead Code / Unused Code

### 6.1 Unused Functions

| File | Function | Status |
|------|----------|--------|
| `scan-masuk.js` | All functions | **UNUSED** - Not loaded by any HTML |
| `purchase-orders.js` | All functions | **UNUSED** - No UI references |
| `marketplace-reports.js` | `getMarketplaceRevenueSummary` | **MISSING** - Called but not defined in file |

### 6.2 Commented-Out Code

| File | Lines | Description |
|------|-------|-------------|
| `penjualan.js` | Various | Debug console.log statements |
| `barang.js` | Various | Debug console.log statements |
| `script.js` | Various | Debug console.log statements |

**Recommendation:** Remove or consolidate into debug mode

---

## 7. Code Similarity Analysis

### 7.1 Function Similarity

| Function Pair | Similarity | Location |
|---------------|------------|----------|
| `formatCurrency()` (marketplace.js) vs `formatCurrency()` (receipt-printer.js) | 85% | Different implementations |
| `formatDate()` (marketplace.js) vs `formatDate()` (marketplace-utils.js) | 95% | Nearly identical |
| `generateInvoiceNumber()` (penjualan.js) vs `generatePONumber()` (purchase-orders.js) | 90% | Same pattern, different prefix |
| `showToast()` (pengeluaran.js) vs `showSaleSuccess()` (penjualan.js) | 80% | Similar with extra animation |
| Stock update logic (penjualan.js) vs (member-payments.js) vs (returns-management.js) | 95% | Nearly identical |

### 7.2 File Similarity

| File Pair | Similarity | Notes |
|-----------|------------|-------|
| `marketplace.js` vs `marketplace-utils.js` | 30% | Shared utility functions |
| `penjualan.js` vs `member-payments.js` | 25% | Similar payment handling |
| `barang.js` vs `supplier-management.js` | 20% | Similar CRUD patterns |

---

## 8. Refactoring Recommendations

### 8.1 Immediate Actions (High Priority)

1. **Create Shared Utility Library**
   - File: `utils/format-utils.js`
   - Functions: `formatCurrency()`, `formatDate()`, `formatNumber()`
   - Impact: Eliminate 5 duplications, ~70 lines saved

2. **Create UI Component Library**
   - File: `utils/ui-components.js`
   - Functions: `showToast()`, `showAlert()`, `renderStatusBadge()`, `renderEmptyState()`
   - Impact: Eliminate 6 duplications, ~150 lines saved

3. **Create Repository Layer**
   - File: `repository/base-repository.js`
   - Pattern: Generic CRUD with error handling
   - Impact: Standardize 15+ files, ~200 lines saved

### 8.2 Short-Term Actions (Medium Priority)

1. **Create Validation Library**
   - File: `utils/validation.js`
   - Functions: `validateRequired()`, `validateNumber()`, `validateEmail()`
   - Impact: Standardize form validation

2. **Create Modal Utility**
   - File: `utils/modal.js`
   - Functions: `openModal()`, `closeModal()`, `setupModal()`
   - Impact: Consistent modal behavior

3. **Create Table Rendering Utility**
   - File: `utils/table.js`
   - Functions: `renderTable()`, `renderTableRow()`
   - Impact: Consistent table rendering

### 8.3 Long-Term Actions (Low Priority)

1. **Remove Unused Code**
   - Delete `scan-masuk.js` (not used)
   - Remove or integrate `purchase-orders.js` (no UI)
   - Clean up debug console.log statements

2. **Create Logging Utility**
   - File: `utils/logger.js`
   - Functions: `log()`, `error()`, `warn()`, `debug()`
   - Impact: Consistent logging with environment filtering

3. **Create Component System**
   - Consider framework (Vue/React) or vanilla component system
   - Impact: Eliminate HTML duplication

---

## 9. Estimated Refactoring Effort

| Priority | Tasks | Estimated Effort | Lines Saved |
|----------|-------|------------------|-------------|
| High | 3 tasks | 8-12 hours | ~320 lines |
| Medium | 3 tasks | 12-16 hours | ~180 lines |
| Low | 3 tasks | 6-8 hours | ~65 lines |
| **Total** | **9 tasks** | **26-36 hours** | **~565 lines** |

---

## 10. Risk Assessment

### 10.1 Refactoring Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing functionality | Medium | High | Comprehensive testing, gradual rollout |
| Introducing new bugs | Medium | Medium | Code review, unit tests |
| Performance regression | Low | Low | Benchmark before/after |
| Team adoption resistance | Low | Medium | Documentation, training |

### 10.2 Safe Refactoring Approach

1. **Phase 1:** Create new utility files alongside existing code
2. **Phase 2:** Migrate one module at a time
3. **Phase 3:** Test thoroughly after each migration
4. **Phase 4:** Remove old code after verification
5. **Phase 5:** Update documentation

---

## Appendix A: Duplicate Code Summary Matrix

| Pattern | Files | Lines | Priority | Effort |
|---------|-------|-------|----------|--------|
| Currency formatting | 5 | 30 | High | 2h |
| Date formatting | 4 | 40 | High | 2h |
| Supabase queries | 15+ | 200 | High | 6h |
| Toast notifications | 6 | 50 | High | 2h |
| KPI card rendering | 8 | 100 | High | 4h |
| Status badges | 6 | 60 | Medium | 3h |
| Platform icons | 2 | 15 | Medium | 1h |
| Table rendering | 8 | 80 | Medium | 4h |
| Modal handling | 5 | 40 | Medium | 2h |
| Form validation | 6 | 50 | Medium | 3h |
| Invoice/PO generation | 2 | 25 | Medium | 2h |
| Empty state rendering | 7 | 35 | Medium | 2h |
| Category badges | 1 | 15 | Low | 1h |
| Loading states | 4 | 20 | Low | 1h |
| Console logging | All | 30 | Low | 2h |

---

**End of Duplicate Code Report**
