# Product Sizes Migration Plan

## Executive Summary

Redesign inventory structure from single-table products with embedded size/stock to two-table structure with separate product_sizes table for multi-size inventory management.

## Current Structure

### products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    nama_barang TEXT,
    ukuran TEXT,              -- Single size per product
    stok INTEGER,            -- Single stock per product
    harga_modal NUMERIC,
    harga_jual NUMERIC,
    harga_member NUMERIC,
    kategori TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Limitations
- One product = one size = one stock level
- Cannot track multiple sizes per product (e.g., S, M, L, XL)
- Size-specific stock tracking impossible
- Redundant product entries for same item in different sizes

## Target Structure

### products Table (Modified)
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    nama_barang TEXT,
    kategori TEXT,
    harga_modal NUMERIC,
    harga_jual NUMERIC,
    harga_member NUMERIC,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### product_sizes Table (New)
```sql
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ukuran TEXT NOT NULL,
    stok INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, ukuran)
);
```

### Example Data Structure

**Product:**
```
id: 123e4567-e89b-12d3-a456-426614174000
nama_barang: Spectre Necro
kategori: Skateboard
harga_modal: 150000
harga_jual: 250000
harga_member: 200000
is_active: true
```

**Product Sizes:**
```
id: 223e4567-e89b-12d3-a456-426614174001 | product_id: 123e4567-e89b-12d3-a456-426614174000 | ukuran: S   | stok: 10
id: 323e4567-e89b-12d3-a456-426614174002 | product_id: 123e4567-e89b-12d3-a456-426614174000 | ukuran: M   | stok: 15
id: 423e4567-e89b-12d3-a456-426614174003 | product_id: 123e4567-e89b-12d3-a456-426614174000 | ukuran: L   | stok: 8
id: 523e4567-e89b-12d3-a456-426614174004 | product_id: 123e4567-e89b-12d3-a456-426614174000 | ukuran: XL  | stok: 5
id: 623e4567-e89b-12d3-a456-426614174005 | product_id: 123e4567-e89b-12d3-a456-426614174000 | ukuran: XXL | stok: 2
```

## Affected Files Audit

### Files Using products.ukuran (39 matches in 9 files)

**High Priority:**
- `script.js` (10 matches) - Dashboard inventory display, size extraction
- `penjualan-old.js` (9 matches) - Old POS size handling
- `pos-new.js` (6 matches) - New POS size handling
- `barcode-label-printer.js` (1 match) - Barcode printing

**Documentation Only:**
- `POS_PRICING_REFACTOR_REPORT.md` (4 matches)
- `POS_PRICING_REFACTOR_PLAN.md` (3 matches)
- `migration_add_ukuran_to_payments.sql` (3 matches)
- `MEMBER_PRICING_VISIBILITY_FIX_REPORT.md` (2 matches)
- `COMPREHENSIVE_AUDIT_REPORT.md` (1 match)

### Files Using products.stok (85 matches in 21 files)

**High Priority:**
- `script.js` (9 matches) - Dashboard stock calculations
- `penjualan-old.js` (8 matches) - Old POS stock validation/deduction
- `pos-new.js` (3 matches) - New POS stock validation/deduction
- `barang.js` (4 matches) - Product management stock updates
- `inventory-reports.js` (9 matches) - Inventory reports
- `marketplace-service.js` (4 matches) - Marketplace stock sync
- `marketplace-reporting.js` (2 matches) - Marketplace reports
- `member-payments.js` (1 match) - Member payments
- `purchase-orders.js` (1 match) - Purchase orders
- `returns-management.js` (1 match) - Returns

**Documentation Only:**
- `TRANSACTION_FLOW_DEPENDENCY_DIAGRAM.md` (15 matches)
- `TRANSACTION_SIMULATION_REPORT.md` (11 matches)
- `DASHBOARD_MARKETPLACE_INTEGRATION_REPORT.md` (5 matches)
- `COMPREHENSIVE_AUDIT_REPORT.md` (3 matches)
- `BACKUP_AND_ROLLBACK_PLAN.md` (2 matches)
- `migration_marketplace_manual.sql` (2 matches)
- `ARCHITECTURE_MAP.md` (1 match)
- `DATABASE_USAGE_MAP.md` (1 match)
- `DUPLICATE_CODE_REPORT.md` (1 match)
- `MARKETPLACE_INTEGRATION_ANALYSIS.md` (1 match)
- `MARKETPLACE_MODULE_SUMMARY.md` (1 match)

## Database Changes Required

### 1. Create product_sizes Table
```sql
CREATE TABLE product_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ukuran TEXT NOT NULL,
    stok INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, ukuran)
);

CREATE INDEX idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX idx_product_sizes_ukuran ON product_sizes(ukuran);
```

### 2. Migrate Existing Products
```sql
-- Step 1: Create product_sizes records from existing products
INSERT INTO product_sizes (product_id, ukuran, stok)
SELECT 
    id as product_id,
    ukuran,
    stok
FROM products
WHERE ukuran IS NOT NULL;

-- Step 2: Handle products without size (create "Default" size)
INSERT INTO product_sizes (product_id, ukuran, stok)
SELECT 
    id as product_id,
    'Default' as ukuran,
    stok
FROM products
WHERE ukuran IS NULL OR ukuran = '';

-- Step 3: Remove ukuran and stok from products table
ALTER TABLE products DROP COLUMN ukuran;
ALTER TABLE products DROP COLUMN stok;
```

### 3. Update sales_history Table
```sql
-- Add product_size_id to sales_history for direct size reference
ALTER TABLE sales_history ADD COLUMN product_size_id UUID REFERENCES product_sizes(id);

-- Migrate existing sales_history records
UPDATE sales_history sh
SET product_size_id = ps.id
FROM product_sizes ps
WHERE sh.product_id = ps.product_id 
  AND sh.ukuran = ps.ukuran;
```

## Migration Strategy

### Phase 1: Database Schema Changes
1. Create product_sizes table
2. Migrate existing products to product_sizes
3. Add product_size_id to sales_history
4. Remove ukuran and stok from products table
5. Create indexes for performance

### Phase 2: Code Updates - Product Management
1. Update barang.js to handle product_sizes
2. Update barang.html to add size management UI
3. Update scan-masuk.js to handle sizes
4. Update barang-scan-ui.js to handle sizes

### Phase 3: Code Updates - POS System
1. Update pos-new.js to load products with sizes
2. Add size selection dropdown to penjualan.html
3. Update addToCart() to include size selection
4. Update processSale() to deduct stock per size
5. Update cart display to show selected size

### Phase 4: Code Updates - Dashboard & Reports
1. Update script.js to aggregate stock by product
2. Update inventory-reports.js to show size breakdown
3. Update marketplace-service.js for size sync
4. Update barcode-label-printer.js for size labels

### Phase 5: Testing & Validation
1. Test product creation with multiple sizes
2. Test POS sale with size selection
3. Test stock deduction per size
4. Test dashboard stock aggregation
5. Test reports with size breakdown
6. Test rollback procedure

## Stock Deduction Per Size

### Current Logic (Single Size)
```javascript
const newStock = product.stok - item.jumlah;
await supabaseClient.from('products').update({ stok: newStock }).eq('id', product.id);
```

### New Logic (Per Size)
```javascript
// Find the specific size record
const { data: sizeRecord } = await supabaseClient
    .from('product_sizes')
    .select('*')
    .eq('product_id', product.id)
    .eq('ukuran', selectedSize)
    .single();

if (!sizeRecord) {
    throw new Error('Size not found');
}

if (sizeRecord.stok < item.jumlah) {
    throw new Error('Insufficient stock for selected size');
}

const newStock = sizeRecord.stok - item.jumlah;
await supabaseClient
    .from('product_sizes')
    .update({ stok: newStock })
    .eq('id', sizeRecord.id);
```

## sales_history Size Storage

### Current Structure
```sql
sales_history (
    payment_id UUID,
    product_id UUID,
    nama_barang TEXT,
    kategori TEXT,
    ukuran TEXT,              -- Stores size as text
    jumlah INTEGER,
    total_harga NUMERIC,
    tipe_pembeli TEXT
)
```

### New Structure
```sql
sales_history (
    payment_id UUID,
    product_id UUID,
    product_size_id UUID,     -- Direct reference to product_sizes
    nama_barang TEXT,
    kategori TEXT,
    ukuran TEXT,              -- Keep for backward compatibility
    jumlah INTEGER,
    total_harga NUMERIC,
    tipe_pembeli TEXT
)
```

### Benefits
- Direct foreign key to product_sizes
- Can join to get current size info
- Maintains historical size data even if sizes are renamed
- Backward compatible with existing reports

## POS Product & Size Loading

### Current Loading
```javascript
const { data } = await supabaseClient
    .from('products')
    .select('id,nama_barang,ukuran,stok,harga_modal,harga_jual,harga_member,kategori')
    .eq('is_active', true)
    .order('nama_barang');
```

### New Loading
```javascript
const { data } = await supabaseClient
    .from('products')
    .select(`
        id,
        nama_barang,
        kategori,
        harga_modal,
        harga_jual,
        harga_member,
        product_sizes (
            id,
            ukuran,
            stok
        )
    `)
    .eq('is_active', true)
    .order('nama_barang');
```

### Product Selection Flow
1. User selects product from dropdown
2. System loads available sizes for that product
3. Size dropdown populated with sizes and stock
4. User selects size
5. System validates stock for selected size
6. Cart item includes product_id, product_size_id, and selected size

## Risks & Compatibility Issues

### High Risk
1. **Data Loss Risk** - Migration failure could lose existing size/stock data
   - **Mitigation**: Full database backup before migration, test migration on staging

2. **POS Downtime** - POS cannot function during migration
   - **Mitigation**: Schedule migration during low-traffic hours, prepare rollback procedure

3. **Stock Calculation Errors** - Dashboard stock aggregation could be incorrect
   - **Mitigation**: Thorough testing of stock aggregation logic, compare old vs new calculations

### Medium Risk
4. **Barcode Compatibility** - Existing barcodes may not encode size information
   - **Mitigation**: Update barcode generation to include size, maintain backward compatibility

5. **Report Changes** - Existing reports may show different stock numbers
   - **Mitigation**: Update all reports to aggregate sizes, provide migration notes

6. **API Breaking Changes** - Marketplace integration may fail
   - **Mitigation**: Update marketplace service to handle new structure, test integration

### Low Risk
7. **UI Complexity** - Size selection adds complexity to POS UI
   - **Mitigation**: Clear UI design, default size selection for single-size products

8. **Performance Impact** - Additional JOIN queries may slow down loading
   - **Mitigation**: Add database indexes, optimize queries, use caching

## Step-by-Step Implementation Plan

### Step 1: Preparation (No Code Changes)
- [ ] Create full database backup
- [ ] Document current inventory state
- [ ] Create staging environment
- [ ] Test migration SQL on staging
- [ ] Prepare rollback procedure

### Step 2: Database Migration
- [ ] Create product_sizes table
- [ ] Add indexes to product_sizes
- [ ] Migrate existing products to product_sizes
- [ ] Add product_size_id to sales_history
- [ ] Migrate sales_history records
- [ ] Remove ukuran and stok from products
- [ ] Verify data integrity
- [ ] Test rollback procedure

### Step 3: Product Management Updates
- [ ] Update barang.js to handle product_sizes
- [ ] Update barang.html size management UI
- [ ] Update scan-masuk.js for sizes
- [ ] Update barang-scan-ui.js for sizes
- [ ] Test product creation with sizes
- [ ] Test product editing with sizes
- [ ] Test stock updates per size

### Step 4: POS System Updates
- [ ] Update pos-new.js product loading
- [ ] Add size dropdown to penjualan.html
- [ ] Update addToCart() for size selection
- [ ] Update processSale() for size stock deduction
- [ ] Update cart display for size
- [ ] Test POS with size selection
- [ ] Test stock deduction per size
- [ ] Test member pricing with sizes

### Step 5: Dashboard & Reports Updates
- [ ] Update script.js stock aggregation
- [ ] Update inventory-reports.js
- [ ] Update marketplace-service.js
- [ ] Update barcode-label-printer.js
- [ ] Test dashboard stock display
- [ ] Test inventory reports
- [ ] Test marketplace sync
- [ ] Test barcode printing

### Step 6: Testing & Validation
- [ ] End-to-end transaction test
- [ ] Stock reconciliation test
- [ ] Report accuracy test
- [ ] Performance test
- [ ] User acceptance test
- [ ] Rollback test

### Step 7: Deployment
- [ ] Schedule deployment window
- [ ] Notify users
- [ ] Execute database migration
- [ ] Deploy code changes
- [ ] Monitor system
- [ ] Verify functionality
- [ ] Document changes

## Rollback Procedure

If migration fails, execute rollback:

```sql
-- Step 1: Add ukuran and stok back to products
ALTER TABLE products ADD COLUMN ukuran TEXT;
ALTER TABLE products ADD COLUMN stok INTEGER;

-- Step 2: Restore data from product_sizes
UPDATE products p
SET 
    ukuran = ps.ukuran,
    stok = ps.stok
FROM product_sizes ps
WHERE p.id = ps.product_id
AND ps.ukuran = 'Default';  -- Use default size for single-size products

-- Step 3: Remove product_size_id from sales_history
ALTER TABLE sales_history DROP COLUMN product_size_id;

-- Step 4: Drop product_sizes table
DROP TABLE product_sizes;
```

## Success Criteria

- [ ] All existing products migrated to new structure
- [ ] POS can create products with multiple sizes
- [ ] POS can select size during sale
- [ ] Stock deduction works per size
- [ ] Dashboard shows correct aggregated stock
- [ ] Reports show accurate size breakdown
- [ ] No data loss during migration
- [ ] Performance acceptable (<2s load time)
- [ ] Rollback procedure tested and working

## Timeline Estimate

- Preparation: 1 day
- Database Migration: 2 hours
- Product Management Updates: 2 days
- POS System Updates: 2 days
- Dashboard & Reports Updates: 2 days
- Testing & Validation: 2 days
- Deployment: 4 hours

**Total: ~8 days**
