# Stability Audit Report

**Generated:** 2025-01-XX  
**Purpose:** Identify stability risks that can create future bugs before performing additional cleanup or refactoring

---

## Executive Summary

| Category | Issues Found | Critical | High | Medium | Low |
|----------|--------------|----------|------|--------|-----|
| Missing DOM Selectors | 12 | 0 | 2 | 8 | 2 |
| Undefined Function References | 4 | 0 | 1 | 2 | 1 |
| Event Listener Issues | 3 | 0 | 0 | 2 | 1 |
| Runtime Safety Issues | 8 | 0 | 3 | 4 | 1 |
| Async Issues | 2 | 0 | 1 | 1 | 0 |
| Console Error Risks | 5 | 0 | 2 | 2 | 1 |
| UI Integrity Issues | 2 | 0 | 0 | 1 | 1 |
| Cross-File Dependency Risks | 3 | 0 | 1 | 2 | 0 |
| **Total** | **39** | **0** | **12** | **22** | **7** |

---

## 1. Missing DOM Selectors

### 1.1 script.js - Line 1140

**Severity:** MEDIUM  
**File:** script.js  
**Line:** 1140  
**Element:** `totalItems`  
**Issue:** Direct assignment without null check

```javascript
document.getElementById('totalItems').innerText = products.length;
```

**Evidence:** No null check before assignment  
**Recommended Fix:**
```javascript
const totalItemsEl = document.getElementById('totalItems');
if (totalItemsEl) totalItemsEl.innerText = products.length;
```

---

### 1.2 script.js - Line 1252-1259

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 1252-1259  
**Elements:** `totalStock`, `totalOmset`, `totalProfit`, `totalSalesCount`  
**Issue:** Direct assignments without null checks

```javascript
document.getElementById('totalStock').innerText = totalStock;
document.getElementById('totalStock').dataset.originalValue = totalStock;
document.getElementById('totalOmset').innerText = 'Rp ' + displayRevenue.toLocaleString('id-ID');
document.getElementById('totalOmset').dataset.originalValue = 'Rp ' + displayRevenue.toLocaleString('id-ID');
document.getElementById('totalProfit').innerText = 'Rp ' + displayProfit.toLocaleString('id-ID');
document.getElementById('totalProfit').dataset.originalValue = 'Rp ' + displayProfit.toLocaleString('id-ID');
document.getElementById('totalSalesCount').innerText = displayOrders + " Barang";
document.getElementById('totalSalesCount').dataset.originalValue = displayOrders + " Barang";
```

**Evidence:** No null checks before assignments  
**Recommended Fix:**
```javascript
const totalStockEl = document.getElementById('totalStock');
if (totalStockEl) {
    totalStockEl.innerText = totalStock;
    totalStockEl.dataset.originalValue = totalStock;
}
// Repeat for other elements
```

---

### 1.3 script.js - Line 1292-1293

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 1292-1293  
**Elements:** `totalExpenses`, `netProfit`  
**Issue:** Direct assignments without null checks

```javascript
document.getElementById('totalExpenses').innerText = 'Rp ' + totalExpenses.toLocaleString('id-ID');
document.getElementById('netProfit').innerText = 'Rp ' + displayProfit.toLocaleString('id-ID');
```

**Evidence:** No null checks before assignments  
**Recommended Fix:**
```javascript
const totalExpensesEl = document.getElementById('totalExpenses');
if (totalExpensesEl) totalExpensesEl.innerText = 'Rp ' + totalExpenses.toLocaleString('id-ID');
const netProfitEl = document.getElementById('netProfit');
if (netProfitEl) netProfitEl.innerText = 'Rp ' + displayProfit.toLocaleString('id-ID');
```

---

### 1.4 script.js - Line 1361-1363

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 1361-1363  
**Elements:** `inventoryValue`, `totalModalBarang`, `lowStockItems`  
**Issue:** Direct assignments without null checks

```javascript
document.getElementById('inventoryValue').innerText = 'Rp ' + inventoryValue.toLocaleString('id-ID');
document.getElementById('totalModalBarang').innerText = 'Rp ' + totalModalBarang.toLocaleString('id-ID');
document.getElementById('lowStockItems').innerText = lowStockItems;
```

**Evidence:** No null checks before assignments  
**Recommended Fix:**
```javascript
const inventoryValueEl = document.getElementById('inventoryValue');
if (inventoryValueEl) inventoryValueEl.innerText = 'Rp ' + inventoryValue.toLocaleString('id-ID');
// Repeat for other elements
```

---

### 1.5 script.js - Line 1518-1529

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 1518-1529  
**Elements:** Multiple online sales KPI elements  
**Issue:** Direct assignments without null checks

```javascript
document.getElementById('onlineSalesTodayRevenue').innerText = 'Rp ' + todayRevenue.toLocaleString('id-ID');
document.getElementById('onlineSalesTodayOrders').innerText = todayOrdersCount;
document.getElementById('onlineSalesTodayTrend').innerText = `${todayGrowth >= 0 ? '↑' : '↓'} ${Math.abs(todayGrowth)}%`;
document.getElementById('onlineSalesTodayTrend').className = `spectre-kpi-trend ${todayGrowth >= 0 ? 'spectre-kpi-trend--up' : 'spectre-kpi-trend--down'}`;
document.getElementById('onlineSalesMonthRevenue').innerText = 'Rp ' + monthRevenue.toLocaleString('id-ID');
document.getElementById('onlineSalesMonthOrders').innerText = monthOrdersCount;
document.getElementById('onlineSalesMonthTrend').innerText = `${monthGrowth >= 0 ? '↑' : '↓'} ${Math.abs(monthGrowth)}%`;
document.getElementById('onlineSalesMonthTrend').className = `spectre-kpi-trend ${monthGrowth >= 0 ? 'spectre-kpi-trend--up' : 'spectre-kpi-trend--down'}`;
document.getElementById('totalSalesRevenue').innerText = 'Rp ' + totalRevenue.toLocaleString('id-ID');
document.getElementById('onlineAOV').innerText = 'Rp ' + aov.toLocaleString('id-ID');
```

**Evidence:** No null checks before assignments  
**Recommended Fix:** Add null checks for each element before assignment

---

### 1.6 member-payments.js - Line 11-12

**Severity:** MEDIUM  
**File:** member-payments.js  
**Lines:** 11-12  
**Elements:** `memberDebtList`, `paymentHistory`  
**Issue:** Direct assignments without null checks

```javascript
document.getElementById('memberDebtList').innerHTML = '<div class="p-8 text-center text-muted text-xs">No member debt found</div>';
document.getElementById('paymentHistory').innerHTML = '<div class="p-8 text-center text-muted text-xs">No payment history found</div>';
```

**Evidence:** No null checks before assignments  
**Recommended Fix:**
```javascript
const memberDebtListEl = document.getElementById('memberDebtList');
if (memberDebtListEl) memberDebtListEl.innerHTML = '<div class="p-8 text-center text-muted text-xs">No member debt found</div>';
const paymentHistoryEl = document.getElementById('paymentHistory');
if (paymentHistoryEl) paymentHistoryEl.innerHTML = '<div class="p-8 text-center text-muted text-xs">No payment history found</div>';
```

---

### 1.7 member-payments.js - Line 30

**Severity:** MEDIUM  
**File:** member-payments.js  
**Line:** 30  
**Element:** `totalOutstanding`  
**Issue:** Direct assignment without null check

```javascript
document.getElementById('totalOutstanding').innerText = 'Rp ' + totalOutstanding.toLocaleString('id-ID');
```

**Evidence:** No null check before assignment  
**Recommended Fix:**
```javascript
const totalOutstandingEl = document.getElementById('totalOutstanding');
if (totalOutstandingEl) totalOutstandingEl.innerText = 'Rp ' + totalOutstanding.toLocaleString('id-ID');
```

---

### 1.8 penjualan.js - Line 609-611

**Severity:** HIGH  
**File:** penjualan.js  
**Lines:** 609-611  
**Elements:** `typeUmum`, `typeMember`, `btnAddToCart`  
**Issue:** Event listeners attached without null checks

```javascript
document.getElementById('typeUmum').addEventListener('change', handleTypeChange);
document.getElementById('typeMember').addEventListener('change', handleTypeChange);
document.getElementById('btnAddToCart').addEventListener('click', addToCart);
```

**Evidence:** If elements don't exist, this will throw errors  
**Recommended Fix:**
```javascript
const typeUmumEl = document.getElementById('typeUmum');
if (typeUmumEl) typeUmumEl.addEventListener('change', handleTypeChange);
const typeMemberEl = document.getElementById('typeMember');
if (typeMemberEl) typeMemberEl.addEventListener('change', handleTypeChange);
const btnAddToCartEl = document.getElementById('btnAddToCart');
if (btnAddToCartEl) btnAddToCartEl.addEventListener('click', addToCart);
```

---

### 1.9 penjualan.js - Line 615-619

**Severity:** HIGH  
**File:** penjualan.js  
**Lines:** 615-619  
**Elements:** `partialPaymentSection`, `amountPaid`, `partialTotal`, `partialPaid`, `partialRemaining`  
**Issue:** Direct access without null checks

```javascript
const partialPaymentSection = document.getElementById('partialPaymentSection');
const amountPaidInput = document.getElementById('amountPaid');
const partialTotalEl = document.getElementById('partialTotal');
const partialPaidEl = document.getElementById('partialPaid');
const partialRemainingEl = document.getElementById('partialRemaining');
```

**Evidence:** No null checks before use in updatePartialPaymentCalculation  
**Recommended Fix:** Add null checks before using these elements

---

### 1.10 penjualan.js - Line 638-640

**Severity:** MEDIUM  
**File:** penjualan.js  
**Lines:** 638-640  
**Elements:** `partialTotal`, `partialPaid`, `partialRemaining`  
**Issue:** Direct assignments without null checks

```javascript
partialTotalEl.innerText = 'Rp ' + totalHarga.toLocaleString('id-ID');
partialPaidEl.innerText = 'Rp ' + amountPaid.toLocaleString('id-ID');
partialRemainingEl.innerText = 'Rp ' + Math.max(0, totalHarga - amountPaid).toLocaleString('id-ID');
```

**Evidence:** Elements may be null if not found earlier  
**Recommended Fix:**
```javascript
if (partialTotalEl) partialTotalEl.innerText = 'Rp ' + totalHarga.toLocaleString('id-ID');
if (partialPaidEl) partialPaidEl.innerText = 'Rp ' + amountPaid.toLocaleString('id-ID');
if (partialRemainingEl) partialRemainingEl.innerText = 'Rp ' + Math.max(0, totalHarga - amountPaid).toLocaleString('id-ID');
```

---

### 1.11 script.js - Line 9-10

**Severity:** LOW  
**File:** script.js  
**Lines:** 9-10  
**Element:** `.spectre-sidebar`  
**Issue:** querySelector without null check

```javascript
const sidebar = document.querySelector('.spectre-sidebar');
sidebar.classList.toggle('spectre-sidebar--collapsed');
```

**Evidence:** If sidebar doesn't exist, this will throw  
**Recommended Fix:**
```javascript
const sidebar = document.querySelector('.spectre-sidebar');
if (sidebar) sidebar.classList.toggle('spectre-sidebar--collapsed');
```

---

### 1.12 script.js - Line 776

**Severity:** LOW  
**File:** script.js  
**Line:** 776  
**Element:** `candlestickChart`  
**Issue:** Has null check but could be more defensive

```javascript
const canvas = document.getElementById('candlestickChart');
if (!canvas) return;
```

**Evidence:** Good pattern, but check is minimal  
**Recommended Fix:** Current implementation is adequate

---

## 2. Undefined Function References

### 2.1 script.js - Line 2042-2046

**Severity:** HIGH  
**File:** script.js  
**Lines:** 2042-2046  
**Functions:** `window.addPartialPayment`, `window.markAsPaid`, `window.cancelInvoice`  
**Issue:** onclick handlers reference window functions that may not be defined

```javascript
<button onclick="window.addPartialPayment('${transaction.id}', ${transaction.remaining})" class="flex-1 px-3 py-2 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition">Add Payment</button>
${transaction.status === 'partial' ? `
    <button onclick="window.markAsPaid('${transaction.id}')" class="flex-1 px-3 py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition">Mark Paid</button>
` : ''}
<button onclick="window.cancelInvoice('${transaction.id}')" data-role="admin-only" class="flex-1 px-3 py-2 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition">Cancel</button>
```

**Evidence:** Functions not defined in script.js, may be missing  
**Recommended Fix:** Verify these functions are defined in the global scope or remove onclick handlers if not implemented

---

### 2.2 script.js - Line 2050

**Severity:** MEDIUM  
**File:** script.js  
**Line:** 2050  
**Function:** `window.deleteTransaction`  
**Issue:** onclick handler references window function

```javascript
<button onclick="window.deleteTransaction('${transaction.id}')" data-role="admin-only" class="w-full mt-2 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition">Delete Permanently</button>
```

**Evidence:** Function is defined at line 2281, but may not be loaded when HTML renders  
**Recommended Fix:** Ensure script.js loads before HTML renders or use event delegation

---

### 2.3 returns.html - Line 194

**Severity:** MEDIUM  
**File:** returns.html  
**Line:** 194  
**Function:** `toggleSidebar`  
**Issue:** onclick handler references function from script.js

```javascript
<button class="spectre-sidebar-toggle" onclick="toggleSidebar()" aria-label="Toggle sidebar">
```

**Evidence:** Function defined in script.js, but script.js may not be loaded on returns.html  
**Recommended Fix:** Verify script.js is loaded on returns.html or move toggleSidebar to a shared utility

---

### 2.4 returns.html - Line 226, 242, 366, 412-413

**Severity:** LOW  
**File:** returns.html  
**Lines:** 226, 242, 366, 412-413  
**Functions:** `logout`, `openReturnModal`, `closeReturnModal`, `processReturn`, `cancelReturn`  
**Issue:** onclick handlers reference functions

```javascript
<button class="spectre-logout-btn" onclick="logout()">Logout</button>
<button class="spectre-btn spectre-btn--primary" onclick="openReturnModal()">+ New Return</button>
<button type="button" class="btn btn-secondary" onclick="closeReturnModal()">Cancel</button>
<button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="processReturn('${r.id}')">Process</button>
<button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="cancelReturn('${r.id}')">Cancel</button>
```

**Evidence:** Functions should be defined in returns-management.js  
**Recommended Fix:** Verify returns-management.js is loaded and defines these functions

---

## 3. Event Listener Issues

### 3.1 penjualan.js - Line 607-611

**Severity:** MEDIUM  
**File:** penjualan.js  
**Lines:** 607-611  
**Issue:** Event listeners attached at module level, before DOM ready

```javascript
selectProduct.addEventListener('change', updatePricePreview);
inputJumlah.addEventListener('input', updatePricePreview);
document.getElementById('typeUmum').addEventListener('change', handleTypeChange);
document.getElementById('typeMember').addEventListener('change', handleTypeChange);
document.getElementById('btnAddToCart').addEventListener('click', addToCart);
```

**Evidence:** These lines execute immediately when script loads, before DOM is ready  
**Recommended Fix:** Move event listener attachment inside DOMContentLoaded handler

---

### 3.2 penjualan.js - Line 632

**Severity:** MEDIUM  
**File:** penjualan.js  
**Line:** 632  
**Issue:** Event listener attached to element that may not exist

```javascript
amountPaidInput.addEventListener('input', updatePartialPaymentCalculation);
```

**Evidence:** amountPaidInput is retrieved at line 616 without null check  
**Recommended Fix:** Add null check before attaching listener

---

### 3.3 button-animations.js - Line 29-32

**Severity:** LOW  
**File:** button-animations.js  
**Lines:** 29-32  
**Issue:** Event listeners attached at module level

```javascript
const buttons = document.querySelectorAll('.spectre-btn');
buttons.forEach(button => {
    button.addEventListener('click', createRipple);
});
```

**Evidence:** Executes immediately when script loads  
**Recommended Fix:** Move inside DOMContentLoaded handler or use event delegation

---

## 4. Runtime Safety Issues

### 4.1 script.js - Line 1140

**Severity:** HIGH  
**File:** script.js  
**Line:** 1140  
**Issue:** Accessing property on potentially null element

```javascript
document.getElementById('totalItems').innerText = products.length;
```

**Evidence:** If element doesn't exist, this throws  
**Recommended Fix:** Add null check (see section 1.1)

---

### 4.2 script.js - Line 1252-1259

**Severity:** HIGH  
**File:** script.js  
**Lines:** 1252-1259  
**Issue:** Accessing dataset property on potentially null elements

```javascript
document.getElementById('totalStock').dataset.originalValue = totalStock;
document.getElementById('totalOmset').dataset.originalValue = 'Rp ' + displayRevenue.toLocaleString('id-ID');
```

**Evidence:** If elements don't exist, accessing dataset throws  
**Recommended Fix:** Add null checks (see section 1.2)

---

### 4.3 script.js - Line 1296-1303

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 1296-1303  
**Issue:** Multiple getElementById calls without null checks

```javascript
const revenueTrendEl = document.getElementById('revenueTrend');
const profitTrendEl = document.getElementById('profitTrend');
const expensesTrendEl = document.getElementById('expensesTrend');
const balanceTrendEl = document.getElementById('balanceTrend');
const salesTrendEl = document.getElementById('salesTrend');
const membersTrendEl = document.getElementById('membersTrend');
const productsTrendEl = document.getElementById('productsTrend');
const stockTrendEl = document.getElementById('stockTrend');
```

**Evidence:** Only some have null checks later  
**Recommended Fix:** Add null checks immediately after retrieval

---

### 4.4 script.js - Line 1317-1330

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 1317-1330  
**Issue:** Accessing properties on potentially null elements

```javascript
if (profitTrendEl) profitTrendEl.innerText = '↑ 0%';
if (expensesTrendEl) expensesTrendEl.innerText = '↓ 0%';
if (balanceTrendEl) balanceTrendEl.innerText = '↑ 0%';
if (membersTrendEl) membersTrendEl.innerText = '↑ 0%';
if (productsTrendEl) productsTrendEl.innerText = '↑ 0%';
if (stockTrendEl) stockTrendEl.innerText = '↑ 0%';
```

**Evidence:** Some elements checked, others not  
**Recommended Fix:** Add null checks for all elements

---

### 4.5 script.js - Line 1521, 1526

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 1521, 1526  
**Issue:** Setting className on potentially null elements

```javascript
document.getElementById('onlineSalesTodayTrend').className = `spectre-kpi-trend ${todayGrowth >= 0 ? 'spectre-kpi-trend--up' : 'spectre-kpi-trend--down'}`;
document.getElementById('onlineSalesMonthTrend').className = `spectre-kpi-trend ${monthGrowth >= 0 ? 'spectre-kpi-trend--up' : 'spectre-kpi-trend--down'}`;
```

**Evidence:** No null check before className assignment  
**Recommended Fix:** Add null checks

---

### 4.6 member-payments.js - Line 33

**Severity:** MEDIUM  
**File:** member-payments.js  
**Line:** 33  
**Issue:** Accessing property on potentially null element

```javascript
const memberDebtListEl = document.getElementById('memberDebtList');
if (memberDebt.size === 0) {
    memberDebtListEl.innerHTML = '<div class="p-8 text-center text-muted text-xs">No outstanding balances</div>';
}
```

**Evidence:** memberDebtListEl could be null  
**Recommended Fix:** Add null check before innerHTML assignment

---

### 4.7 penjualan.js - Line 636

**Severity:** MEDIUM  
**File:** penjualan.js  
**Line:** 636  
**Issue:** Accessing value property on potentially null element

```javascript
const amountPaid = parseFloat(amountPaidInput.value) || 0;
```

**Evidence:** amountPaidInput could be null  
**Recommended Fix:** Add null check

---

### 4.8 script.js - Line 2586-2594

**Severity:** LOW  
**File:** script.js  
**Lines:** 2586-2594  
**Issue:** Optional chaining used correctly, but could be more defensive

```javascript
window.InventoryManager?.applyStockDelta?.(payload.delta);
window.InventoryManager?.applyPaymentDelta?.();
```

**Evidence:** Good use of optional chaining  
**Recommended Fix:** Current implementation is adequate

---

## 5. Async Issues

### 5.1 script.js - Line 248-253

**Severity:** HIGH  
**File:** script.js  
**Lines:** 248-253  
**Issue:** Parallel async calls without individual error handling

```javascript
const [paymentsResult, onlineOrdersResult, membersResult, salesHistoryResult] = await Promise.all([
    supabaseClient.from('payments').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('online_orders').select('*').order('order_date', { ascending: false }),
    supabaseClient.from('members').select('*'),
    supabaseClient.from('sales_history').select('*')
]);
```

**Evidence:** If one query fails, all fail with unclear error  
**Recommended Fix:** Wrap each query in try-catch or use Promise.allSettled

---

### 5.2 script.js - Line 466-469

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 466-469  
**Issue:** Parallel async calls without error handling

```javascript
const [paymentCheck, onlineCheck] = await Promise.all([
    supabaseClient.from('payments').select('id').eq('id', id).single(),
    supabaseClient.from('online_orders').select('id').eq('id', id).single()
]);
```

**Evidence:** If one check fails, both fail  
**Recommended Fix:** Use Promise.allSettled or individual try-catch

---

## 6. Console Error Risks

### 6.1 script.js - Line 1140

**Severity:** HIGH  
**File:** script.js  
**Line:** 1140  
**Issue:** Will throw "Cannot set property 'innerText' of null" if element missing

```javascript
document.getElementById('totalItems').innerText = products.length;
```

**Evidence:** Direct assignment without null check  
**Recommended Fix:** Add null check (see section 1.1)

---

### 6.2 penjualan.js - Line 609-611

**Severity:** HIGH  
**File:** penjualan.js  
**Lines:** 609-611  
**Issue:** Will throw "Cannot read property 'addEventListener' of null" if elements missing

```javascript
document.getElementById('typeUmum').addEventListener('change', handleTypeChange);
document.getElementById('typeMember').addEventListener('change', handleTypeChange);
document.getElementById('btnAddToCart').addEventListener('click', addToCart);
```

**Evidence:** Direct addEventListener call without null check  
**Recommended Fix:** Add null checks (see section 1.8)

---

### 6.3 script.js - Line 2042-2046

**Severity:** MEDIUM  
**File:** script.js  
**Lines:** 2042-2046  
**Issue:** Will throw "window.addPartialPayment is not a function" if not defined

```javascript
<button onclick="window.addPartialPayment('${transaction.id}', ${transaction.remaining})" class="...">
```

**Evidence:** Function may not be defined  
**Recommended Fix:** Verify function exists or remove onclick handler

---

### 6.4 script.js - Line 2586

**Severity:** MEDIUM  
**File:** script.js  
**Line:** 2586  
**Issue:** JSON.parse could fail if newValue is invalid

```javascript
const payload = JSON.parse(e.newValue || '{}');
```

**Evidence:** Wrapped in try-catch, but could be more defensive  
**Recommended Fix:** Current implementation is adequate (has try-catch)

---

### 6.5 script.js - Line 8

**Severity:** LOW  
**File:** script.js  
**Line:** 8  
**Issue:** Comment references global supabaseClient but doesn't verify it exists

```javascript
// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
```

**Evidence:** No verification that supabaseClient exists before use  
**Recommended Fix:** Add check at module level: `if (typeof supabaseClient === 'undefined') throw new Error('supabaseClient not initialized');`

---

## 7. UI Integrity Issues

### 7.1 script.js - Line 1393

**Severity:** MEDIUM  
**File:** script.js  
**Line:** 1393  
**Issue:** onclick handler references deleteProduct function

```javascript
<button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-[10px] font-bold uppercase">Hapus</button>
```

**Evidence:** Function is defined and exposed to window at line 2575, but may not be available when HTML renders  
**Recommended Fix:** Ensure script.js loads completely before rendering dynamic HTML

---

### 7.2 script.js - Line 1429

**Severity:** LOW  
**File:** script.js  
**Line:** 1429  
**Issue:** onclick handler references deleteProduct function

```javascript
<button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="bg-transparent hover:bg-red-600 hover:text-white text-red-600 border border-red-900 px-2.5 py-1 text-[9px] font-bold uppercase transition-all">HAPUS</button>
```

**Evidence:** Same as above  
**Recommended Fix:** Same as above

---

## 8. Cross-File Dependency Risks

### 8.1 script.js - Line 2586-2594

**Severity:** HIGH  
**File:** script.js  
**Lines:** 2586-2594  
**Issue:** Depends on window.InventoryManager which may not be loaded

```javascript
window.InventoryManager?.applyStockDelta?.(payload.delta);
window.InventoryManager?.applyPaymentDelta?.();
```

**Evidence:** InventoryManager may not be loaded when script.js runs  
**Recommended Fix:** Verify InventoryManager is loaded or add explicit dependency check

---

### 8.2 auth.js - Line 19-21

**Severity:** MEDIUM  
**File:** auth.js  
**Lines:** 19-21  
**Issue:** onAuthStateChange callback is empty

```javascript
supabaseClient.auth.onAuthStateChange((event, session) => {
    // Auth state changed
});
```

**Evidence:** Callback does nothing but comment says it should  
**Recommended Fix:** Implement proper auth state handling or remove callback

---

### 8.3 All files - Global supabaseClient

**Severity:** MEDIUM  
**Files:** All JavaScript files  
**Issue:** All files depend on global supabaseClient from auth.js without verification

**Evidence:** No verification that supabaseClient exists before use  
**Recommended Fix:** Add initialization check at top of each file or use module pattern

---

## Summary of Critical Issues

### High Priority (Address First)

1. **penjualan.js:609-611** - Event listeners without null checks (HIGH)
2. **script.js:1140** - Direct assignment without null check (HIGH)
3. **script.js:1252-1259** - Direct assignments without null checks (HIGH)
4. **script.js:2042-2046** - Undefined window functions (HIGH)
5. **script.js:248-253** - Parallel async without error handling (HIGH)
6. **script.js:2586-2594** - Cross-file dependency on InventoryManager (HIGH)

### Medium Priority (Address Soon)

1. **script.js:1292-1293** - Direct assignments without null checks (MEDIUM)
2. **script.js:1361-1363** - Direct assignments without null checks (MEDIUM)
3. **script.js:1518-1529** - Direct assignments without null checks (MEDIUM)
4. **member-payments.js:11-12,30** - Direct assignments without null checks (MEDIUM)
5. **penjualan.js:615-619,638-640** - Element access without null checks (MEDIUM)
6. **script.js:466-469** - Parallel async without error handling (MEDIUM)
7. **auth.js:19-21** - Empty auth state callback (MEDIUM)

### Low Priority (Nice to Have)

1. **script.js:9-10** - querySelector without null check (LOW)
2. **button-animations.js:29-32** - Event listeners at module level (LOW)
3. **script.js:2586** - JSON.parse already has try-catch (LOW)
4. **script.js:8** - No supabaseClient verification (LOW)

---

## Recommendations

### Immediate Actions

1. **Add null checks** to all getElementById calls before property access
2. **Wrap event listener attachment** in null checks or move to DOMContentLoaded
3. **Verify window function definitions** before using in onclick handlers
4. **Add error handling** to Promise.all calls or use Promise.allSettled
5. **Verify cross-file dependencies** are loaded before use

### Long-term Improvements

1. **Implement defensive programming** pattern throughout codebase
2. **Use event delegation** instead of direct event listeners
3. **Create shared utility** for safe DOM access
4. **Implement module pattern** to reduce global dependencies
5. **Add initialization checks** for all global dependencies

### Testing Recommendations

1. **Test with missing DOM elements** to verify graceful degradation
2. **Test with slow network** to verify async error handling
3. **Test with different user roles** to verify auth-dependent features
4. **Test with empty data sets** to verify null handling
5. **Test with script loading failures** to verify dependency checks

---

**End of Stability Audit Report**
