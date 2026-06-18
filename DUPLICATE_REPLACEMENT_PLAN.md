# Duplicate Code Replacement Plan

**Generated:** 2025-01-XX  
**Purpose:** Plan for replacing duplicate utility functions with shared utilities

---

## Executive Summary

| Category | Duplicates Found | Files Affected | Total Lines to Save |
|----------|-----------------|----------------|---------------------|
| formatCurrency | 5 | 5 files | ~40 lines |
| formatDate | 2 | 2 files | ~30 lines |
| showToast | 2 | 2 files | ~12 lines |
| Inline date formatting | 5 | 3 files | ~15 lines |
| **Total** | **14** | **7 files** | **~97 lines** |

---

## 1. formatCurrency Duplicates

### 1.1 Implementation Comparison

| File | Lines | Implementation | Status |
|------|-------|----------------|--------|
| utils/format-utils.js | 8-18 | Full version with NaN check, locale options | **SOURCE** (newly created) |
| marketplace-utils.js | 372-383 | Full version with NaN check, locale options | **IDENTICAL** |
| marketplace-reports.js | 241-252 | Full version with NaN check, locale options | **IDENTICAL** |
| script.js | 13-15 | Simple version, no NaN check, uses Number() | **DIFFERENT** |
| receipt-printer.js | 191-193 | Simple version, no NaN check | **DIFFERENT** |
| barcode-label-printer.js | 153-155 | Simple version, no NaN check | **DIFFERENT** |

### 1.2 Replacement Plan

#### Replacement #1: marketplace-utils.js

**Risk Level:** LOW  
**Dependency Analysis:** No dependencies, pure function  
**Files Affected:** marketplace-utils.js, marketplace.html  
**Lines to Remove:** 12 lines (372-383)  
**Lines to Add:** 0 (already loads utils/format-utils.js via marketplace.html)

**Steps:**
1. Remove formatCurrency function from marketplace-utils.js (lines 372-383)
2. Verify marketplace-reports.html loads utils/format-utils.js
3. Test currency formatting in marketplace reports

**Rollback Plan:**
```bash
# Restore function
# Copy function from utils/format-utils.js back to marketplace-utils.js
```

---

#### Replacement #2: marketplace-reports.js

**Risk Level:** LOW  
**Dependency Analysis:** No dependencies, pure function  
**Files Affected:** marketplace-reports.js, marketplace-reports.html  
**Lines to Remove:** 12 lines (241-252)  
**Lines to Add:** 1 line (script tag in HTML)

**Steps:**
1. Add `<script src="utils/format-utils.js"></script>` to marketplace-reports.html
2. Remove formatCurrency function from marketplace-reports.js (lines 241-252)
3. Test currency formatting in marketplace reports

**Rollback Plan:**
```bash
# Restore function
# Copy function from utils/format-utils.js back to marketplace-reports.js
# Remove script tag from marketplace-reports.html
```

---

#### Replacement #3: script.js (SKIP - Different Implementation)

**Risk Level:** MEDIUM  
**Dependency Analysis:** Different implementation (no NaN check, uses Number())  
**Files Affected:** script.js, index.html  
**Recommendation:** **DO NOT REPLACE** - Different behavior

**Reason:** The script.js version lacks NaN checking and uses Number() instead of parseFloat(). Replacing with the full version would change behavior. Keep as-is or create separate simpleFormatCurrency utility.

---

#### Replacement #4: receipt-printer.js (SKIP - Different Implementation)

**Risk Level:** MEDIUM  
**Dependency Analysis:** Different implementation (no NaN check)  
**Files Affected:** receipt-printer.js, penjualan.html  
**Recommendation:** **DO NOT REPLACE** - Different behavior

**Reason:** The receipt-printer.js version lacks NaN checking. Replacing with the full version would change behavior. Keep as-is or create separate simpleFormatCurrency utility.

---

#### Replacement #5: barcode-label-printer.js (SKIP - Different Implementation)

**Risk Level:** MEDIUM  
**Dependency Analysis:** Different implementation (no NaN check)  
**Files Affected:** barcode-label-printer.js  
**Recommendation:** **DO NOT REPLACE** - Different behavior

**Reason:** The barcode-label-printer.js version lacks NaN checking. Replacing with the full version would change behavior. Keep as-is or create separate simpleFormatCurrency utility.

---

## 2. formatDate Duplicates

### 2.1 Implementation Comparison

| File | Lines | Implementation | Status |
|------|-------|----------------|--------|
| utils/format-utils.js | 27-42 | Full version with format options | **SOURCE** (newly created) |
| marketplace-utils.js | 391-406 | Full version with format options | **IDENTICAL** |
| script.js | 1878-1881 | Different function name (formatDateShort), simpler | **DIFFERENT** |

### 2.2 Replacement Plan

#### Replacement #1: marketplace-utils.js

**Risk Level:** LOW  
**Dependency Analysis:** No dependencies, pure function  
**Files Affected:** marketplace-utils.js, marketplace.html  
**Lines to Remove:** 16 lines (391-406)  
**Lines to Add:** 0 (already loads utils/format-utils.js via marketplace.html)

**Steps:**
1. Remove formatDate function from marketplace-utils.js (lines 391-406)
2. Verify marketplace-reports.html loads utils/format-utils.js
3. Test date formatting in marketplace reports

**Rollback Plan:**
```bash
# Restore function
# Copy function from utils/format-utils.js back to marketplace-utils.js
```

---

#### Replacement #2: script.js (SKIP - Different Implementation)

**Risk Level:** MEDIUM  
**Dependency Analysis:** Different function name (formatDateShort), simpler implementation  
**Files Affected:** script.js, index.html  
**Recommendation:** **DO NOT REPLACE** - Different function name and behavior

**Reason:** The script.js version is named formatDateShort and has a simpler implementation. It's used in a specific context (chart labels). Keep as-is.

---

## 3. showToast Duplicates

### 3.1 Implementation Comparison

| File | Lines | Function Name | Implementation | Status |
|------|-------|---------------|----------------|--------|
| pengeluaran.js | 12-18 | showToast | Creates toast, appends to body, removes after 2800ms | **SOURCE** |
| penjualan.js | 130-140 | showSaleSuccess | Same as showToast + sales panel animation | **DIFFERENT** |

### 3.2 Replacement Plan

#### Replacement #1: penjualan.js (SKIP - Different Implementation)

**Risk Level:** MEDIUM  
**Dependency Analysis:** Different function name (showSaleSuccess), includes animation  
**Files Affected:** penjualan.js, penjualan.html  
**Recommendation:** **DO NOT REPLACE** - Different function name and behavior

**Reason:** The penjualan.js version is named showSaleSuccess and includes a sales panel animation. This is specific to the sales flow. Keep as-is.

**Alternative:** Create shared showToast utility and have showSaleSuccess call it after animation.

---

## 4. Inline Date Formatting (toLocaleDateString)

### 4.1 Implementation Comparison

| File | Lines | Pattern | Status |
|------|-------|--------|--------|
| script.js | 78 | `toLocaleDateString('en-US', options)` | **DIFFERENT** (English locale) |
| script.js | 1780 | `toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })` | **SIMILAR** |
| script.js | 2432 | `toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })` | **SIMILAR** |
| pengeluaran.js | 57 | `toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })` | **SIMILAR** |
| member.js | 46 | `toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })` | **SIMILAR** |

### 4.2 Replacement Plan

#### Recommendation: DO NOT REPLACE

**Risk Level:** MEDIUM  
**Reason:** These are inline usages with different format options. Replacing with a shared function would require adding parameters for all format variations, which adds complexity. The inline usage is clear and maintainable.

**Alternative:** If needed, create formatDateShort and formatDateCompact utilities in format-utils.js.

---

## 5. Summary of Recommended Replacements

### 5.1 Safe Replacements (Proceed)

| # | File | Function | Risk | Lines Saved |
|---|------|----------|------|-------------|
| 1 | marketplace-utils.js | formatCurrency | LOW | 12 |
| 2 | marketplace-utils.js | formatDate | LOW | 16 |
| 3 | marketplace-reports.js | formatCurrency | LOW | 12 |

**Total Safe Replacements:** 3 files, 40 lines saved

### 5.2 Skip Replacements (Do Not Touch)

| # | File | Function | Reason |
|---|------|----------|--------|
| 1 | script.js | formatCurrency | Different implementation (no NaN check) |
| 2 | receipt-printer.js | formatCurrency | Different implementation (no NaN check) |
| 3 | barcode-label-printer.js | formatCurrency | Different implementation (no NaN check) |
| 4 | script.js | formatDate | Different function name (formatDateShort) |
| 5 | penjualan.js | showSaleSuccess | Different function name, includes animation |
| 6 | Inline toLocaleDateString | Various | Different format options, inline is clearer |

---

## 6. Implementation Order

### Phase 2A: marketplace-utils.js

1. Backup marketplace-utils.js
2. Remove formatCurrency (lines 372-383)
3. Remove formatDate (lines 391-406)
4. Test marketplace.html
5. Test marketplace-reports.html
6. Commit changes

### Phase 2B: marketplace-reports.js

1. Backup marketplace-reports.js
2. Backup marketplace-reports.html
3. Add script tag to marketplace-reports.html
4. Remove formatCurrency (lines 241-252)
5. Test marketplace-reports.html
6. Commit changes

---

## 7. Risk Assessment

### 7.1 Overall Risk

| Risk Category | Level | Mitigation |
|---------------|-------|------------|
| Breaking Changes | LOW | Only replacing identical implementations |
| Business Logic | NONE | No business logic changes |
| Database | NONE | No database changes |
| UI | NONE | No UI changes |
| Performance | NONE | No performance impact |

### 7.2 Per-File Risk

| File | Risk | Reason |
|------|------|--------|
| marketplace-utils.js | LOW | Pure functions, no dependencies |
| marketplace-reports.js | LOW | Pure functions, no dependencies |
| script.js | HIGH (skip) | Different implementation |
| receipt-printer.js | HIGH (skip) | Different implementation |
| penjualan.js | HIGH (skip) | Different implementation, sales flow |

---

## 8. Rollback Procedures

### 8.1 marketplace-utils.js Rollback

```bash
# Restore from backup
Copy-Item "j:\spectre-inventory-v2\marketplace-utils.js.backup" "j:\spectre-inventory-v2\marketplace-utils.js"
```

### 8.2 marketplace-reports.js Rollback

```bash
# Restore from backup
Copy-Item "j:\spectre-inventory-v2\marketplace-reports.js.backup" "j:\spectre-inventory-v2\marketplace-reports.js"
Copy-Item "j:\spectre-inventory-v2\marketplace-reports.html.backup" "j:\spectre-inventory-v2\marketplace-reports.html"
```

---

## 9. Testing Checklist

### marketplace-utils.js

- [ ] marketplace.html loads without errors
- [ ] Currency values display correctly
- [ ] Date values display correctly
- [ ] Order list renders correctly
- [ ] Order detail modal shows correct formatting
- [ ] Console has no errors

### marketplace-reports.js

- [ ] marketplace-reports.html loads without errors
- [ ] Currency values in KPIs display correctly
- [ ] Date values in reports display correctly
- [ ] Charts render correctly
- [ ] Export functionality works
- [ ] Console has no errors

---

## 10. Success Criteria

- All currency formatting remains identical
- All date formatting remains identical
- No console errors
- No UI regressions
- No business logic changes
- All tests pass

---

**End of Duplicate Replacement Plan**
