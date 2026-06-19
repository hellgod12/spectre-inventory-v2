# HARGA_MEMBER Functional Audit Report

**Project:** SPECTRE Inventory System  
**Date:** June 19, 2026  
**Severity:** P2 - Medium Priority (Business Logic Issue)  
**Status:** ✅ **AUDIT COMPLETE**

---

## Executive Summary

**Classification:** **C. UI Only / Dead Feature**

`harga_member` (Member Price) is stored in the database and loaded by the application, but **NOT USED** in actual price calculations. The system uses `diskon_persen` (percentage discount) from the members table instead, completely ignoring the `harga_member` field from the products table.

**Critical Finding:** There is a **business logic mismatch** where:
- Database has `harga_member` column in products table
- UI allows setting `harga_member` per product
- POS loads `harga_member` but ignores it
- POS calculates member price using `harga_jual * (1 - diskon_persen/100)`

---

## Complete Data Flow Trace

### 1. Product Form → Database Save

**File:** `barang.html` (Line 276)
```html
<input type="number" id="harga_member" class="form-input" placeholder="Rp" required>
```
**Status:** ✅ **ACTIVE** - UI input field exists

**File:** `barang.js` (Lines 295-359)
```javascript
// Line 298: Read from form
const harga_member = parseFloat(document.getElementById('harga_member').value);

// Lines 335-343: Validation
if (harga_member < harga_modal) {
    alert(`Member price (Rp ${harga_member.toLocaleString('id-ID')}) cannot be less than cost price (Rp ${harga_modal.toLocaleString('id-ID')}).`);
    return;
}

if (harga_member > harga_jual) {
    alert(`Member price (Rp ${harga_member.toLocaleString('id-ID')}) cannot be greater than selling price (Rp ${harga_jual.toLocaleString('id-ID')}).`);
    return;
}

// Line 356: Save to database
harga_member,
```
**Status:** ✅ **ACTIVE** - Form reads, validates, and saves to database

**Database:** `products` table (migration_initial_schema.sql Line 18)
```sql
harga_member NUMERIC CHECK (harga_member >= 0)
```
**Status:** ✅ **ACTIVE** - Column exists in database

---

### 2. Product Load

**File:** `pos-new.js` (Line 98)
```javascript
.select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,harga_member,kategori')
```
**Status:** ✅ **ACTIVE** - harga_member is loaded from database

**File:** `pos-new.js` (Lines 109-114)
```javascript
if (POS.products.length > 0) {
    console.log('First product data:', POS.products[0]);
    console.log('First product harga_jual:', POS.products[0].harga_jual);
    console.log('First product harga_member:', POS.products[0].harga_member);  // Logged but NOT used
    console.log('First product harga_modal:', POS.products[0].harga_modal);
}
```
**Status:** ⚠️ **DEBUG ONLY** - Logged for debugging but NOT used in calculations

---

### 3. POS Add To Cart

**File:** `pos-new.js` (Lines 267-270)
```javascript
console.log('addToCart - variant data:', variant);
console.log('addToCart - variant.harga_jual:', variant?.harga_jual);
console.log('addToCart - variant.harga_member:', variant?.harga_member);  // Logged but NOT used
console.log('addToCart - variant.harga_modal:', variant?.harga_modal);
```
**Status:** ⚠️ **DEBUG ONLY** - Logged for debugging but NOT used in calculations

**File:** `pos-new.js` (Lines 290-298) - **CRITICAL ISSUE**
```javascript
// Calculate price based on customer type
let unitPrice = variant.harga_jual;  // ❌ Uses harga_jual, NOT harga_member
console.log('addToCart - initial unitPrice (harga_jual):', unitPrice);

if (POS.customerType === 'Member' && POS.selectedMember) {
    const discount = POS.selectedMember.diskon_persen || 0;  // ❌ Uses diskon_persen, NOT harga_member
    unitPrice = variant.harga_jual * (1 - discount / 100);  // ❌ Calculates from harga_jual
    console.log('addToCart - unitPrice after member discount:', unitPrice);
}
```
**Status:** ❌ **NOT USED** - harga_member is completely ignored in price calculation

**Expected Logic:**
```javascript
// SHOULD BE:
let unitPrice = variant.harga_jual;
if (POS.customerType === 'Member') {
    unitPrice = variant.harga_member || variant.harga_jual;  // Use harga_member if exists
}
```

**Actual Logic:**
```javascript
// ACTUALLY IS:
let unitPrice = variant.harga_jual;
if (POS.customerType === 'Member' && POS.selectedMember) {
    const discount = POS.selectedMember.diskon_persen || 0;
    unitPrice = variant.harga_jual * (1 - discount / 100);  // Ignores harga_member
}
```

---

### 4. Price Calculation

**File:** `pos-new.js` (Lines 466-471) - Cart Recalculation
```javascript
let unitPrice = product.harga_jual;  // ❌ Uses harga_jual
if (POS.customerType === 'Member' && POS.selectedMember) {
    const discount = POS.selectedMember.diskon_persen || 0;  // ❌ Uses diskon_persen
    unitPrice = product.harga_jual * (1 - discount / 100);  // ❌ Ignores harga_member
}
```
**Status:** ❌ **NOT USED** - harga_member is completely ignored

---

### 5. Payment Creation

**File:** `pos-new.js` (Lines 311-321)
```javascript
const cartItem = {
    id: Date.now(),
    productId: variant.id,
    nama_barang: variant.nama_barang,
    ukuran: variant.ukuran || null,
    kategori: variant.kategori,
    jumlah: qty,
    unitPrice: unitPrice,  // Calculated from harga_jual, NOT harga_member
    totalPrice: unitPrice * qty,
    hargaModal: variant.harga_modal  // Stores harga_modal for profit calculation
};
```
**Status:** ❌ **NOT USED** - unitPrice does not include harga_member

---

### 6. Sales History

**Database:** `sales_history` table (migration_initial_schema.sql Lines 57-68)
```sql
CREATE TABLE IF NOT EXISTS sales_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    nama_barang TEXT NOT NULL,
    kategori TEXT,
    ukuran TEXT,
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    total_harga NUMERIC NOT NULL CHECK (total_harga >= 0),
    tipe_pembeli TEXT NOT NULL,  -- Stores 'Umum' or 'Member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**Status:** ❌ **NOT STORED** - sales_history does NOT have harga_member column

**Note:** sales_history has `harga_modal` column (added in migration_add_profit_tracking.sql) but NOT `harga_member`

---

### 7. Reports

**File:** `sales-reports.js`
**Search Result:** No references to harga_member
**Status:** ❌ **NOT USED** - Reports do not use harga_member

---

### 8. Export

**File:** `export-utils.js` (Lines 125-131)
```javascript
const data = products.map(p => [
    p.id,
    p.nama_barang,
    p.kategori,
    p.ukuran || '',
    p.stok,
    formatCurrency(p.harga_modal),
    formatCurrency(p.harga_jual),
    formatCurrency(p.harga_member),  // ✅ Exported to Excel
    p.sku || '',
    formatDate(p.created_at)
]);
```
**Status:** ✅ **ACTIVE** - harga_member is exported in Excel export

---

## Dependency Report

### Files Referencing harga_member

| File | Line(s) | Usage | Status |
|------|---------|-------|--------|
| **barang.html** | 276 | UI Input Field | ✅ ACTIVE |
| **barang.js** | 298, 335-343, 356 | Form Read, Validate, Save | ✅ ACTIVE |
| **barang-scan-ui.js** | 14, 25, 31, 41, 64 | Scan Input | ✅ ACTIVE |
| **scan-masuk.js** | 15 | Scan Input | ✅ ACTIVE |
| **pos-new.js** | 98, 112, 269 | Load, Log (Debug) | ⚠️ DEBUG ONLY |
| **export-utils.js** | 128 | Export to Excel | ✅ ACTIVE |
| **check_size_l_price.sql** | 8 | Database Query | ✅ ACTIVE |
| **migration_initial_schema.sql** | 18 | Database Column | ✅ ACTIVE |
| **migration_fix_harga_jual.sql** | 12, 37 | Database Query | ✅ ACTIVE |

### Database Columns Using harga_member

| Table | Column | Status |
|-------|--------|--------|
| **products** | harga_member | ✅ ACTIVE |
| **sales_history** | (NOT PRESENT) | ❌ NOT USED |

### Reports Using harga_member

| Report File | Usage | Status |
|-------------|-------|--------|
| **sales-reports.js** | None | ❌ NOT USED |
| **export-utils.js** | Excel Export | ✅ ACTIVE |

### Export Functions Using harga_member

| Function | File | Status |
|----------|------|--------|
| **exportProductsToExcel** | export-utils.js (Line 128) | ✅ ACTIVE |

---

## Discount System Analysis

### discount-system.js

**Search Result:** No references to harga_member

**Discount Logic:**
- Uses percentage-based discounts from `discounts` table
- Does NOT use harga_member from products table
- Does NOT use diskon_persen from members table

**Status:** ❌ **NOT RELATED** - discount-system.js is a separate discount system

---

## Member Discount System Analysis

### Member System (pos-new.js, member.js)

**Discount Logic:**
```javascript
// pos-new.js Line 295-297
const discount = POS.selectedMember.diskon_persen || 0;
unitPrice = variant.harga_jual * (1 - discount / 100);
```

**Member Table Structure:**
- `diskon_persen` (percentage) - Used for discount calculation
- Does NOT use harga_member from products table

**Status:** ❌ **OVERRIDING** - Member discount system overrides harga_member

---

## Double-Discount Calculation Risk

### Analysis

**Current Flow:**
1. Product has `harga_member` set (e.g., 100,000)
2. Product has `harga_jual` set (e.g., 150,000)
3. Member has `diskon_persen` set (e.g., 33%)
4. POS calculates: `150,000 * (1 - 33/100) = 100,500`
5. **Result:** harga_member (100,000) is IGNORED

**Risk Assessment:**
- **No double-discount risk** because harga_member is not used at all
- **Business logic mismatch** between database schema and actual implementation
- **User expectation mismatch** - Users set harga_member but it's not used

**Conclusion:** There is NO double-discount calculation, but there IS a business logic inconsistency.

---

## Dead Code Analysis

### Dead Code Related to harga_member

**Files with Dead Code:**
1. **pos-new.js** (Lines 98, 112, 269) - Loads and logs harga_member but never uses it
2. **barang.js** (Lines 335-343) - Validates harga_member but it's never used in POS
3. **barang.html** (Line 276) - UI input for harga_member but value is never used
4. **barang-scan-ui.js** (Lines 14, 25, 31, 41, 64) - Scan input for harga_member but never used
5. **scan-masuk.js** (Line 15) - Scan input for harga_member but never used

**Database Column:**
- **products.harga_member** - Column exists but never used in price calculations

**Export:**
- **export-utils.js** (Line 128) - Exports harga_member but it's meaningless since it's not used

---

## Classification

### Final Classification: **C. UI Only / Dead Feature**

**Rationale:**
1. harga_member is stored in database ✅
2. harga_member is loaded by application ✅
3. harga_member is validated in form ✅
4. harga_member is exported to Excel ✅
5. harga_member is **NOT USED** in POS price calculations ❌
6. harga_member is **NOT STORED** in sales_history ❌
7. harga_member is **NOT USED** in reports ❌
8. harga_member is **OVERRIDDEN** by diskon_persen system ❌

**Conclusion:** harga_member is a **dead feature** that exists in the UI and database but is not functionally used in the application's core business logic (POS pricing).

---

## Impact Analysis

### Current Impact

**Business Impact:**
- **User Confusion:** Users set harga_member expecting it to be used, but it's ignored
- **Data Inconsistency:** Database has harga_member values that are never used
- **Wasted Effort:** Time spent setting harga_member in product forms is wasted
- **Export Misleading:** Excel exports show harga_member values that are not used

**Technical Impact:**
- **Dead Code:** harga_member references in pos-new.js are dead code
- **Database Bloat:** harga_member column exists but serves no purpose
- **Maintenance Overhead:** Code must maintain harga_member validation and loading for no reason

**Financial Impact:**
- **Potential Pricing Errors:** If users expect harga_member to be used, they may set incorrect prices
- **Discount Calculation:** Current system uses diskon_persen which may not match business requirements

### Impact of Removing harga_member

**If Removed:**
- ✅ Eliminates user confusion
- ✅ Removes dead code
- ✅ Reduces database bloat
- ✅ Simplifies maintenance
- ⚠️ Requires database migration
- ⚠️ Requires UI changes
- ⚠️ May break existing exports (if users rely on harga_member in exports)

**If Kept:**
- ✅ No migration required
- ✅ No UI changes required
- ❌ Continues user confusion
- ❌ Maintains dead code
- ❌ Database bloat continues

---

## Migration Plan

### Option 1: Deprecate harga_member (Recommended)

**Phase 1: Documentation**
1. Add comments to barang.js indicating harga_member is deprecated
2. Add warning in UI when harga_member is set
3. Update documentation to clarify pricing logic

**Phase 2: Soft Deprecation**
1. Keep harga_member in database
2. Keep harga_member in UI but mark as "Legacy - Not Used"
3. Add console warning when harga_member is loaded
4. Continue exporting harga_member for historical compatibility

**Phase 3: Hard Removal**
1. Remove harga_member from database (migration)
2. Remove harga_member from UI forms
3. Remove harga_member from validation logic
4. Remove harga_member from export functions
5. Update documentation

**Timeline:**
- Phase 1: Immediate
- Phase 2: 1-2 weeks
- Phase 3: After user confirmation

### Option 2: Implement harga_member (Alternative)

**Phase 1: Update POS Logic**
1. Modify pos-new.js to use harga_member when customer is Member
2. Add logic: `unitPrice = variant.harga_member || variant.harga_jual`
3. Remove diskon_persen calculation if harga_member exists

**Phase 2: Update Sales History**
1. Add harga_member column to sales_history table
2. Store harga_member at time of sale for historical accuracy
3. Update reports to show harga_member

**Phase 3: Update Reports**
1. Add harga_member to sales reports
2. Add comparison between harga_jual and harga_member
3. Add profit analysis based on harga_member

**Timeline:**
- Phase 1: 1 week
- Phase 2: 1 week
- Phase 3: 1 week

### Option 3: Hybrid Approach (Best of Both)

**Phase 1: Add Configuration**
1. Add system setting: "Use Product Member Price" (true/false)
2. If true: Use harga_member from products table
3. If false: Use diskon_persen from members table

**Phase 2: Update POS Logic**
1. Modify pos-new.js to check configuration
2. Implement both pricing strategies
3. Allow per-product override

**Phase 3: Update UI**
1. Add toggle in settings
2. Add indicator in product form showing which pricing is active
3. Update documentation

**Timeline:**
- Phase 1: 1 week
- Phase 2: 1 week
- Phase 3: 1 week

---

## Recommendations

### Immediate Actions (No Code Changes)

1. **Document Current Behavior:**
   - Add comment in pos-new.js explaining pricing logic
   - Update user documentation to clarify harga_member is not used
   - Add warning in barang.js when harga_member is set

2. **User Communication:**
   - Notify users that harga_member is not currently used
   - Explain that diskon_persen is used instead
   - Ask for preference: implement harga_member or deprecate it

### Short-Term Actions (1-2 Weeks)

3. **Choose Migration Path:**
   - Get user input on preferred approach
   - Decide between Option 1 (Deprecate), Option 2 (Implement), or Option 3 (Hybrid)

4. **Implement Chosen Option:**
   - Follow migration plan for chosen option
   - Test thoroughly
   - Update documentation

### Long-Term Actions (1+ Month)

5. **Monitor Usage:**
   - Track if users set harga_member values
   - Monitor if exports are used for harga_member
   - Gather feedback on pricing logic

6. **Review Pricing Strategy:**
   - Evaluate if current diskon_persen system meets business needs
   - Consider if product-specific member pricing is needed
   - Review discount-system.js integration

---

## Conclusion

**Summary:**
- `harga_member` is a **dead feature** that exists in UI and database but is not used in POS pricing
- The system uses `diskon_persen` (percentage discount) from members table instead
- There is **no double-discount risk**, but there is a **business logic inconsistency**
- Users are setting harga_member values that are never used, causing confusion

**Recommendation:**
- **Option 3 (Hybrid Approach)** is recommended to provide flexibility
- Allows users to choose between product-specific member pricing or percentage-based discounts
- Provides backward compatibility while enabling future enhancements
- Requires configuration UI and logic updates

**Next Steps:**
1. Get user input on preferred pricing strategy
2. Implement chosen option
3. Update documentation
4. Test thoroughly
5. Deploy with monitoring

---

**Report Generated By:** Cascade AI Assistant  
**Report Version:** 1.0  
**Date:** June 19, 2026
