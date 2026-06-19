# HARGA_MEMBER Deprecation Report

**Project:** SPECTRE Inventory System  
**Date:** June 19, 2026  
**Severity:** P2 - Medium Priority  
**Status:** ✅ **PHASE 1 & 2 COMPLETE, PHASE 3 & 4 PENDING**

---

## Executive Summary

**Objective:** Deprecate `harga_member` (Member Price) field as it is a dead feature that exists in the UI and database but is not used in the application's core business logic.

**Progress:**
- ✅ **Phase 1 Complete:** Code cleanup - removed all harga_member references from UI, validation, exports, and POS
- ✅ **Phase 2 Complete:** Verification - confirmed POS uses only harga_jual and diskon_persen
- ⏸️ **Phase 3 Pending:** Regression testing - requires manual testing by user
- ⏸️ **Phase 4 Pending:** Database migration - requires successful testing first

**Important:** Database column `products.harga_member` has NOT been dropped yet. Migration script will be provided after successful regression testing.

---

## Phase 1: Code Cleanup - COMPLETED

### Changes Made

#### 1. Product UI (barang.html)
**File:** `j:\spectre-inventory-v2\barang.html`  
**Line:** 274-277  
**Change:** Removed Member Price input field

**Before:**
```html
<div class="form-group">
    <label class="form-label">Member Price</label>
    <input type="number" id="harga_member" class="form-input" placeholder="Rp" required>
</div>
```

**After:**
```html
<!-- REMOVED -->
```

**Status:** ✅ **COMPLETE**

---

#### 2. Product Form Logic (barang.js)
**File:** `j:\spectre-inventory-v2\barang.js`  
**Lines:** 298, 335-343, 356  
**Changes:** 
- Removed harga_member variable declaration
- Removed harga_member validation logic
- Removed harga_member from product save operation

**Before (Line 298):**
```javascript
const harga_member = parseFloat(document.getElementById('harga_member').value);
```

**After:**
```javascript
// REMOVED
```

**Before (Lines 335-343):**
```javascript
if (harga_member < harga_modal) {
    alert(`Member price (Rp ${harga_member.toLocaleString('id-ID')}) cannot be less than cost price (Rp ${harga_modal.toLocaleString('id-ID')}).`);
    return;
}

if (harga_member > harga_jual) {
    alert(`Member price (Rp ${harga_member.toLocaleString('id-ID')}) cannot be greater than selling price (Rp ${harga_jual.toLocaleString('id-ID')}).`);
    return;
}
```

**After:**
```javascript
// REMOVED
```

**Before (Line 356):**
```javascript
harga_member,
```

**After:**
```javascript
// REMOVED
```

**Status:** ✅ **COMPLETE**

---

#### 3. Export Functions (export-utils.js)
**File:** `j:\spectre-inventory-v2\export-utils.js`  
**Lines:** 118-130  
**Change:** Removed harga_member from export headers and data mapping

**Before:**
```javascript
const headers = ['ID', 'Name', 'Category', 'Size', 'Stock', 'Cost Price', 'Selling Price', 'Member Price', 'SKU', 'Created At'];

const data = products.map(p => [
    p.id,
    p.nama_barang,
    p.kategori,
    p.ukuran || '',
    p.stok,
    formatCurrency(p.harga_modal),
    formatCurrency(p.harga_jual),
    formatCurrency(p.harga_member),
    p.sku || '',
    formatDate(p.created_at)
]);
```

**After:**
```javascript
const headers = ['ID', 'Name', 'Category', 'Size', 'Stock', 'Cost Price', 'Selling Price', 'SKU', 'Created At'];

const data = products.map(p => [
    p.id,
    p.nama_barang,
    p.kategori,
    p.ukuran || '',
    p.stok,
    formatCurrency(p.harga_modal),
    formatCurrency(p.harga_jual),
    p.sku || '',
    formatDate(p.created_at)
]);
```

**Status:** ✅ **COMPLETE**

---

#### 4. Scan UI (barang-scan-ui.js)
**File:** `j:\spectre-inventory-v2\barang-scan-ui.js`  
**Lines:** 14, 24-40, 46-47, 54, 63  
**Changes:** 
- Removed harga_member input reference
- Updated scan payload format documentation
- Removed harga_member from payload parsing
- Updated payload format comment

**Before (Line 14):**
```javascript
const hargaMemberInput = document.getElementById('harga_member');
```

**After:**
```javascript
// REMOVED
```

**Before (Lines 24-40):**
```javascript
// Supported format (recommended):
// NAMA_BARANG|qty|harga_modal|harga_jual|harga_member|kategori
// Examples:
// T-SHIRT L|10|50000|90000|85000|Apparel
// SPECTRE DECK|3|120000|200000|190000|Skateboard

// Optional simpler formats (fallback):
// - NAMA_BARANG|qty|harga_modal|harga_jual|harga_member
// - NAMA_BARANG (no qty/price)

// Format target: NAMA_BARANG|qty|harga_modal|harga_jual|harga_member|kategori
```

**After:**
```javascript
// Supported format (recommended):
// NAMA_BARANG|qty|harga_modal|harga_jual|kategori
// Examples:
// T-SHIRT L|10|50000|90000|Apparel
// SPECTRE DECK|3|120000|200000|Skateboard

// Optional simpler formats (fallback):
// - NAMA_BARANG|qty|harga_modal|harga_jual
// - NAMA_BARANG (no qty/price)

// Format target: NAMA_BARANG|qty|harga_modal|harga_jual|kategori
```

**Before (Lines 46-47, 54):**
```javascript
const hargaMember = parts[4] != null ? Number(parts[4]) : null;
const kategori = parts[5] != null ? parts[5] : null;
// ...
hargaMember: Number.isFinite(hargaMember) ? hargaMember : null,
```

**After:**
```javascript
const kategori = parts[4] != null ? parts[4] : null;
// ...
// REMOVED hargaMember from return object
```

**Status:** ✅ **COMPLETE**

---

#### 5. Scan Module (scan-masuk.js)
**File:** `j:\spectre-inventory-v2\scan-masuk.js`  
**Line:** 15  
**Change:** Removed harga_member input reference

**Before:**
```javascript
const hargaMemberEl = document.getElementById('harga_member');
```

**After:**
```javascript
// REMOVED
```

**Status:** ✅ **COMPLETE**

---

#### 6. POS Query (pos-new.js)
**File:** `j:\spectre-inventory-v2\pos-new.js`  
**Lines:** 98, 112, 269  
**Changes:** 
- Removed harga_member from SELECT query
- Removed harga_member from logging statements

**Before (Line 98):**
```javascript
.select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,harga_member,kategori')
```

**After:**
```javascript
.select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,kategori')
```

**Before (Line 112):**
```javascript
console.log('First product harga_member:', POS.products[0].harga_member);
```

**After:**
```javascript
// REMOVED
```

**Before (Line 269):**
```javascript
console.log('addToCart - variant.harga_member:', variant?.harga_member);
```

**After:**
```javascript
// REMOVED
```

**Status:** ✅ **COMPLETE**

---

## Phase 2: Verification - COMPLETED

### POS Pricing Logic Verification

**File:** `j:\spectre-inventory-v2\pos-new.js`  
**Function:** `addToCart()` (Lines 288-296)  
**Verification:** ✅ **CONFIRMED**

**Current Logic:**
```javascript
// Calculate price based on customer type
let unitPrice = variant.harga_jual;  // Uses harga_jual
console.log('addToCart - initial unitPrice (harga_jual):', unitPrice);

if (POS.customerType === 'Member' && POS.selectedMember) {
    const discount = POS.selectedMember.diskon_persen || 0;  // Uses diskon_persen
    unitPrice = variant.harga_jual * (1 - discount / 100);  // Calculates from harga_jual
    console.log('addToCart - unitPrice after member discount:', unitPrice);
}
```

**Verification Result:** ✅ **CORRECT**
- POS uses `variant.harga_jual` for regular customers
- POS uses `variant.harga_jual * (1 - discount / 100)` for members
- POS uses `POS.selectedMember.diskon_persen` for discount percentage
- POS does NOT use `harga_member` anywhere

---

### Cart Recalculation Verification

**File:** `j:\spectre-inventory-v2\pos-new.js`  
**Function:** `recalculateCartPrices()` (Lines 460-476)  
**Verification:** ✅ **CONFIRMED**

**Current Logic:**
```javascript
function recalculateCartPrices() {
    POS.cart.forEach(item => {
        const product = POS.products.find(p => p.id == item.productId);
        if (!product) return;
        
        let unitPrice = product.harga_jual;  // Uses harga_jual
        if (POS.customerType === 'Member' && POS.selectedMember) {
            const discount = POS.selectedMember.diskon_persen || 0;  // Uses diskon_persen
            unitPrice = product.harga_jual * (1 - discount / 100);  // Calculates from harga_jual
        }
        
        item.unitPrice = unitPrice;
        item.totalPrice = unitPrice * item.jumlah;
    });
    
    updateCartDisplay();
}
```

**Verification Result:** ✅ **CORRECT**
- Cart recalculation uses `product.harga_jual`
- Cart recalculation uses `POS.selectedMember.diskon_persen`
- Cart recalculation does NOT use `harga_member`

---

## Phase 3: Regression Testing - PENDING

### Testing Plan

Please perform the following regression tests to ensure the application still works correctly after removing harga_member:

#### Test 1: Product Creation
**Steps:**
1. Navigate to `barang.html` (Products page)
2. Click "Add Product" button
3. Fill in product details:
   - Product Name: TEST PRODUCT
   - Category: Test
   - Variants: L, M
   - Stock: 10, 20
   - Base Cost (harga_modal): 50000
   - Public Price (harga_jual): 100000
   - **Verify:** Member Price field is NOT visible
4. Click "Save"
5. **Expected Result:** Product saved successfully without errors
6. **Console Check:** No errors related to harga_member

**Status:** ⏸️ **PENDING USER TESTING**

---

#### Test 2: Product Editing
**Steps:**
1. Navigate to `barang.html` (Products page)
2. Click "Edit" on an existing product
3. **Verify:** Member Price field is NOT visible
4. Modify product details (e.g., change price)
5. Click "Save"
6. **Expected Result:** Product updated successfully without errors
7. **Console Check:** No errors related to harga_member

**Status:** ⏸️ **PENDING USER TESTING**

---

#### Test 3: Member Sales
**Steps:**
1. Navigate to `penjualan.html` (POS page)
2. Select a product
3. Set customer type to "Member"
4. Select a member with diskon_persen (e.g., 33%)
5. Add product to cart
6. **Verify:** Unit price is calculated as `harga_jual * (1 - diskon_persen/100)`
7. **Expected Result:** Correct discounted price shown in cart
8. **Console Check:** No errors related to harga_member

**Status:** ⏸️ **PENDING USER TESTING**

---

#### Test 4: Non-Member Sales
**Steps:**
1. Navigate to `penjualan.html` (POS page)
2. Select a product
3. Set customer type to "Umum" (Regular)
4. Add product to cart
5. **Verify:** Unit price is `harga_jual` (full price)
6. **Expected Result:** Correct full price shown in cart
7. **Console Check:** No errors related to harga_member

**Status:** ⏸️ **PENDING USER TESTING**

---

#### Test 5: Reports
**Steps:**
1. Navigate to `reports.html` (Reports page)
2. Generate a sales report
3. **Verify:** Report loads without errors
4. **Expected Result:** Report displays correctly
5. **Console Check:** No errors related to harga_member

**Status:** ⏸️ **PENDING USER TESTING**

---

#### Test 6: Export
**Steps:**
1. Navigate to `barang.html` (Products page)
2. Click "Export Excel" button
3. **Verify:** Excel file downloads successfully
4. Open the Excel file
5. **Verify:** Excel file does NOT have "Member Price" column
6. **Expected Result:** Excel export works correctly without harga_member column
7. **Console Check:** No errors related to harga_member

**Status:** ⏸️ **PENDING USER TESTING**

---

## Phase 4: Database Migration - PENDING

### Migration Plan

**IMPORTANT:** Do NOT execute this migration until all regression tests in Phase 3 pass successfully.

### Migration Script

**File:** `j:\spectre-inventory-v2\migration_remove_harga_member.sql` (to be created)

```sql
-- Migration: Remove harga_member column from products table
-- This migration removes the deprecated harga_member column
-- Execute ONLY after successful regression testing

-- ============================================
-- REMOVE HARGA_MEMBER COLUMN
-- ============================================

-- Drop the harga_member column from products table
ALTER TABLE products 
DROP COLUMN IF EXISTS harga_member;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify column has been removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'harga_member';

-- Expected result: 0 rows (column does not exist)

-- Verify products table still has correct columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Expected columns: id, nama_barang, kategori, ukuran, harga_jual, harga_modal, stok, sku, created_at, updated_at, is_active, deleted_at, low_stock_threshold, image_url

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Test query to ensure products can still be queried
SELECT COUNT(*) as product_count 
FROM products;

-- Expected result: Number of products in database
```

### Rollback Plan (If Needed)

**File:** `j:\spectre-inventory-v2\migration_rollback_harga_member.sql` (to be created)

```sql
-- Rollback: Re-add harga_member column if migration needs to be reverted
-- Execute ONLY if migration causes issues

-- ============================================
-- ROLLBACK: RE-ADD HARGA_MEMBER COLUMN
-- ============================================

-- Re-add the harga_member column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS harga_member NUMERIC CHECK (harga_member >= 0);

-- Set default value for existing records (NULL)
-- Note: Existing records will have NULL harga_member
-- This is acceptable since the feature was not being used

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify column has been re-added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'harga_member';

-- Expected result: 1 row (column exists)
```

### Migration Execution Steps

**Step 1:** Complete all regression tests in Phase 3  
**Step 2:** Verify all tests pass successfully  
**Step 3:** Create migration file `migration_remove_harga_member.sql`  
**Step 4:** Run migration in Supabase SQL Editor  
**Step 5:** Verify migration success using verification queries  
**Step 6:** Perform final regression test  
**Step 7:** If issues occur, use rollback script

**Status:** ⏸️ **PENDING SUCCESSFUL REGRESSION TESTING**

---

## Summary of Changes

### Files Modified (6 files)

1. **barang.html** - Removed Member Price input field
2. **barang.js** - Removed harga_member variable, validation, and save logic
3. **export-utils.js** - Removed harga_member from export headers and data
4. **barang-scan-ui.js** - Removed harga_member from scan payload parsing
5. **scan-masuk.js** - Removed harga_member input reference
6. **pos-new.js** - Removed harga_member from query and logging

### Database Changes (0 files)

**Status:** No database changes yet. Migration script will be provided after successful regression testing.

### Impact Assessment

**Positive Impact:**
- ✅ Eliminates user confusion about unused Member Price field
- ✅ Removes dead code from application
- ✅ Simplifies product form (fewer fields)
- ✅ Reduces database bloat (after migration)
- ✅ Simplifies maintenance

**Negative Impact:**
- ⚠️ Requires regression testing
- ⚠️ Requires database migration (after testing)
- ⚠️ Historical data in harga_member column will be lost (after migration)

**Mitigation:**
- Comprehensive regression testing plan provided
- Rollback script available if migration causes issues
- Migration only executed after successful testing

---

## Next Steps

### Immediate Actions

1. **Perform Regression Testing:**
   - Execute all 6 test cases in Phase 3
   - Document results for each test
   - Report any issues found

2. **Review Test Results:**
   - If all tests pass: Proceed to migration
   - If any test fails: Fix issues and re-test

3. **Execute Migration (After Successful Testing):**
   - Create migration file
   - Run migration in Supabase
   - Verify migration success
   - Perform final regression test

### Post-Migration Actions

4. **Update Documentation:**
   - Update user documentation to reflect removal of Member Price
   - Update API documentation if applicable
   - Archive this deprecation report

5. **Monitor Application:**
   - Monitor for any issues related to harga_member removal
   - Gather user feedback
   - Address any issues promptly

---

## Conclusion

**Phase 1 & 2 Status:** ✅ **COMPLETE**  
**Phase 3 Status:** ⏸️ **PENDING USER TESTING**  
**Phase 4 Status:** ⏸️ **PENDING SUCCESSFUL TESTING**

**Recommendation:** Proceed with Phase 3 regression testing before executing database migration in Phase 4.

**Risk Assessment:** **LOW** - Changes are limited to UI and code cleanup. Database column still exists until migration is executed. Rollback plan available if needed.

---

**Report Generated By:** Cascade AI Assistant  
**Report Version:** 1.0  
**Date:** June 19, 2026
