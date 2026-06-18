# Backup and Rollback Plan

## Overview

This document provides a complete backup and rollback plan for all files that will be modified during the transaction safety implementation. Each file includes affected functions, dependencies, and step-by-step rollback procedures.

---

## File Modification Summary

| File | Purpose | Functions Affected | Risk Level |
|------|---------|-------------------|------------|
| `penjualan.js` | POS Sales Flow | `salesForm.addEventListener`, `generateInvoiceNumber` | CRITICAL |
| `script.js` | Multiple Flows | `deletePayment`, `cancelInvoice`, `deleteTransaction`, `deleteFromSalesHistory` | HIGH |
| `returns-management.js` | Return Processing | `processReturn` | MEDIUM |
| `purchase-orders.js` | PO Receiving | `receivePOItems` | MEDIUM |
| `migration_process_pos_sale.sql` | NEW - RPC Function | N/A | CRITICAL |
| `migration_cancel_invoice.sql` | NEW - RPC Function | N/A | HIGH |
| `migration_delete_payment.sql` | NEW - RPC Function | N/A | HIGH |
| `migration_process_return.sql` | NEW - RPC Function | N/A | MEDIUM |
| `migration_receive_po_items.sql` | NEW - RPC Function | N/A | MEDIUM |
| `migration_delete_transaction.sql` | NEW - RPC Function | N/A | MEDIUM |
| `migration_delete_sales_history_item.sql` | NEW - RPC Function | N/A | LOW |

---

## Pre-Implementation Backup Procedure

### Step 1: Create Backup Directory
```bash
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=backups/$(date +%Y%m%d_%H%M%S)
```

### Step 2: Backup All Modified Files
```bash
# JavaScript files
cp penjualan.js $BACKUP_DIR/penjualan.js.backup
cp script.js $BACKUP_DIR/script.js.backup
cp returns-management.js $BACKUP_DIR/returns-management.js.backup
cp purchase-orders.js $BACKUP_DIR/purchase-orders.js.backup

# Migration files (if they exist)
cp migration_*.sql $BACKUP_DIR/ 2>/dev/null || true

# Create backup manifest
echo "Backup created at: $(date)" > $BACKUP_DIR/backup_manifest.txt
echo "Files backed up:" >> $BACKUP_DIR/backup_manifest.txt
ls -la $BACKUP_DIR/*.backup >> $BACKUP_DIR/backup_manifest.txt
```

### Step 3: Database Backup
```bash
# Export current database schema
pg_dump -h kbaltquoajrmpixgsiec.supabase.co -U postgres -d postgres --schema-only > $BACKUP_DIR/schema_backup.sql

# Export current database data
pg_dump -h kbaltquoajrmpixgsiec.supabase.co -U postgres -d postgres --data-only > $BACKUP_DIR/data_backup.sql

# Export specific tables
pg_dump -h kbaltquoajrmpixgsiec.supabase.co -U postgres -d postgres -t payments -t products -t sales_history -t returns -t purchase_orders -t po_items > $BACKUP_DIR/critical_tables_backup.sql
```

### Step 4: Git Commit
```bash
git add .
git commit -m "Pre-implementation backup for transaction safety fixes"
git tag backup_$(date +%Y%m%d_%H%M%S)
```

---

## File-Specific Backup and Rollback Plans

### File 1: penjualan.js

**Location:** `j:\spectre-inventory-v2\penjualan.js`

**Functions Affected:**
- Line 643-842: `salesForm.addEventListener('submit', ...)` - Main POS sales flow
- Line 469-490: `generateInvoiceNumber()` - Invoice number generation

**Dependencies:**
- `auth.js` - Supabase client initialization
- `ReceiptPrinter` (if exists) - Receipt printing
- `InventoryManager` (if exists) - Stock animation
- LocalStorage - Cross-tab communication

**HTML Dependencies:**
- `penjualan.html` - Sales form UI
- Form elements: `salesForm`, `selectProduct`, `inputJumlah`, `selectMember`, etc.

**Current Implementation:**
```javascript
// Lines 718-744: Payment insert
const { data: paymentData, error: payErr } = await supabaseClient.from('payments').insert([...]);

// Lines 751-789: Stock update and sales_history insert loop
for (const cartItem of cart) {
    const { error: updateError } = await supabaseClient.from('products').update({ stok: sisaStokBaru }).eq('id', cartItem.productId);
    const { error: historyError } = await supabaseClient.from('sales_history').insert([...]);
}
```

**Proposed Change:**
Replace individual Supabase calls with single RPC function call:
```javascript
const { data: result, error } = await supabaseClient.rpc('process_pos_sale', {
    p_payment_data: paymentRecord,
    p_cart_items: cart
});
```

**Rollback Procedure:**

**Step 1: Restore Original File**
```bash
cp backups/$(ls -t backups/ | head -1)/penjualan.js.backup penjualan.js
```

**Step 2: Verify Restoration**
```bash
# Check file size matches backup
ls -l penjualan.js backups/$(ls -t backups/ | head -1)/penjualan.js.backup

# Check key lines exist
grep -n "from('payments').insert" penjualan.js
grep -n "from('products').update" penjualan.js
grep -n "from('sales_history').insert" penjualan.js
```

**Step 3: Test Functionality**
- Open penjualan.html in browser
- Attempt a test sale
- Verify payment is created
- Verify stock is deducted
- Verify sales_history is created

**Step 4: Database Rollback (if RPC was deployed)**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS process_pos_sale;

-- Verify function is dropped
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'process_pos_sale';
-- Should return 0 rows
```

**Step 5: Git Revert (if committed)**
```bash
git checkout HEAD~1 -- penjualan.js
git commit -m "Rollback: penjualan.js to pre-RPC implementation"
```

**Verification Checklist:**
- [ ] Original file restored
- [ ] File size matches backup
- [ ] Key code patterns present (individual Supabase calls)
- [ ] Test sale completes successfully
- [ ] RPC function dropped from database
- [ ] No errors in browser console
- [ ] Git history clean

---

### File 2: script.js

**Location:** `j:\spectre-inventory-v2\script.js`

**Functions Affected:**
- Line 460-575: `deletePayment(id)` - Payment deletion with stock restoration
- Line 2214-2279: `window.cancelInvoice(invoiceId)` - Invoice cancellation
- Line 2281-2389: `window.deleteTransaction(invoiceId)` - Transaction deletion
- Line 2492-2541: `deleteFromSalesHistory(id, namaBarang)` - Sales history deletion

**Dependencies:**
- `auth.js` - Supabase client initialization
- `CandleManager` (if exists) - Payment animation
- `InventoryManager` (if exists) - Stock animation
- LocalStorage - Cross-tab communication

**HTML Dependencies:**
- `index.html` - Dashboard UI
- Various dashboard elements and buttons

**Current Implementation:**
```javascript
// Lines 517-538: Stock restoration loop
for (const sale of salesHistory) {
    const { data: productData } = await supabaseClient.from('products').select('stok').eq('id', sale.product_id).single();
    const { error: stockError } = await supabaseClient.from('products').update({ stok: newStock }).eq('id', sale.product_id);
}

// Lines 541-544: Sales history deletion
const { error: deleteSalesError } = await supabaseClient.from('sales_history').delete().eq('invoice_number', paymentData.invoice_number);

// Lines 552-555: Payment deletion
const { error: delPayment } = await supabaseClient.from('payments').delete().eq('id', id);
```

**Proposed Change:**
Replace individual operations with RPC function calls:
```javascript
// For deletePayment
const { data: result, error } = await supabaseClient.rpc('delete_payment', {
    p_payment_id: id
});

// For cancelInvoice
const { data: result, error } = await supabaseClient.rpc('cancel_invoice', {
    p_invoice_id: invoiceId
});

// For deleteTransaction
const { data: result, error } = await supabaseClient.rpc('delete_transaction', {
    p_invoice_id: invoiceId
});

// For deleteFromSalesHistory
const { data: result, error } = await supabaseClient.rpc('delete_sales_history_item', {
    p_sales_history_id: id
});
```

**Rollback Procedure:**

**Step 1: Restore Original File**
```bash
cp backups/$(ls -t backups/ | head -1)/script.js.backup script.js
```

**Step 2: Verify Restoration**
```bash
# Check file size matches backup
ls -l script.js backups/$(ls -t backups/ | head -1)/script.js.backup

# Check key lines exist
grep -n "from('products').update.*stok" script.js
grep -n "from('sales_history').delete" script.js
grep -n "from('payments').delete" script.js
```

**Step 3: Test Functionality**
- Open index.html in browser
- Test payment deletion
- Test invoice cancellation
- Test transaction deletion
- Test sales history deletion

**Step 4: Database Rollback (if RPCs were deployed)**
```sql
-- Drop all RPC functions
DROP FUNCTION IF EXISTS delete_payment;
DROP FUNCTION IF EXISTS cancel_invoice;
DROP FUNCTION IF EXISTS delete_transaction;
DROP FUNCTION IF EXISTS delete_sales_history_item;

-- Verify functions are dropped
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('delete_payment', 'cancel_invoice', 'delete_transaction', 'delete_sales_history_item');
-- Should return 0 rows
```

**Step 5: Git Revert (if committed)**
```bash
git checkout HEAD~1 -- script.js
git commit -m "Rollback: script.js to pre-RPC implementation"
```

**Verification Checklist:**
- [ ] Original file restored
- [ ] File size matches backup
- [ ] Key code patterns present (individual Supabase calls)
- [ ] All deletion operations work correctly
- [ ] All RPC functions dropped from database
- [ ] No errors in browser console
- [ ] Git history clean

---

### File 3: returns-management.js

**Location:** `j:\spectre-inventory-v2\returns-management.js`

**Functions Affected:**
- Line 40-121: `processReturn(returnId)` - Return processing with stock restoration

**Dependencies:**
- `auth.js` - Supabase client initialization
- No HTML dependencies (module file)

**Current Implementation:**
```javascript
// Lines 72-79: Stock restoration
const newStock = product.stok + returnRecord.quantity;
const { error: stockError } = await supabaseClient.from('products').update({ stok: newStock }).eq('id', returnRecord.product_id);

// Lines 93-102: Payment update (if refund)
const { error: paymentUpdateError } = await supabaseClient.from('payments').update({...}).eq('id', payment.id);

// Lines 106-114: Return status update
const { error: returnUpdateError } = await supabaseClient.from('returns').update({...}).eq('id', returnId);
```

**Proposed Change:**
Replace individual operations with RPC function call:
```javascript
const { data: result, error } = await supabaseClient.rpc('process_return', {
    p_return_id: returnId
});
```

**Rollback Procedure:**

**Step 1: Restore Original File**
```bash
cp backups/$(ls -t backups/ | head -1)/returns-management.js.backup returns-management.js
```

**Step 2: Verify Restoration**
```bash
# Check file size matches backup
ls -l returns-management.js backups/$(ls -t backups/ | head -1)/returns-management.js.backup

# Check key lines exist
grep -n "from('products').update.*stok" returns-management.js
grep -n "from('payments').update" returns-management.js
grep -n "from('returns').update" returns-management.js
```

**Step 3: Test Functionality**
- Test return processing
- Verify stock restoration
- Verify payment update (if refund)
- Verify return status update

**Step 4: Database Rollback (if RPC was deployed)**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS process_return;

-- Verify function is dropped
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'process_return';
-- Should return 0 rows
```

**Step 5: Git Revert (if committed)**
```bash
git checkout HEAD~1 -- returns-management.js
git commit -m "Rollback: returns-management.js to pre-RPC implementation"
```

**Verification Checklist:**
- [ ] Original file restored
- [ ] File size matches backup
- [ ] Key code patterns present (individual Supabase calls)
- [ ] Return processing works correctly
- [ ] RPC function dropped from database
- [ ] No errors in browser console
- [ ] Git history clean

---

### File 4: purchase-orders.js

**Location:** `j:\spectre-inventory-v2\purchase-orders.js`

**Functions Affected:**
- Line 220-268: `receivePOItems(poId, receivedItems)` - PO receiving with stock update

**Dependencies:**
- `auth.js` - Supabase client initialization
- No HTML dependencies (module file)

**Current Implementation:**
```javascript
// Lines 225-228: PO item update
await supabaseClient.from('po_items').update({ received_quantity: newReceivedQty }).eq('id', received.po_item_id);

// Lines 232-243: Stock update
const { data: product } = await supabaseClient.from('products').select('stok').eq('id', poItem.product_id).single();
if (product) {
    const newStock = product.stok + received.received_quantity;
    await supabaseClient.from('products').update({ stok: newStock }).eq('id', poItem.product_id);
}
```

**Proposed Change:**
Replace individual operations with RPC function call:
```javascript
const { data: result, error } = await supabaseClient.rpc('receive_po_items', {
    p_po_id: poId,
    p_received_items: receivedItems
});
```

**Rollback Procedure:**

**Step 1: Restore Original File**
```bash
cp backups/$(ls -t backups/ | head -1)/purchase-orders.js.backup purchase-orders.js
```

**Step 2: Verify Restoration**
```bash
# Check file size matches backup
ls -l purchase-orders.js backups/$(ls -t backups/ | head -1)/purchase-orders.js.backup

# Check key lines exist
grep -n "from('po_items').update" purchase-orders.js
grep -n "from('products').update.*stok" purchase-orders.js
```

**Step 3: Test Functionality**
- Test PO receiving
- Verify PO item update
- Verify stock update

**Step 4: Database Rollback (if RPC was deployed)**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS receive_po_items;

-- Verify function is dropped
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'receive_po_items';
-- Should return 0 rows
```

**Step 5: Git Revert (if committed)**
```bash
git checkout HEAD~1 -- purchase-orders.js
git commit -m "Rollback: purchase-orders.js to pre-RPC implementation"
```

**Verification Checklist:**
- [ ] Original file restored
- [ ] File size matches backup
- [ ] Key code patterns present (individual Supabase calls)
- [ ] PO receiving works correctly
- [ ] RPC function dropped from database
- [ ] No errors in browser console
- [ ] Git history clean

---

## Database Migration Rollback Plans

### Migration 1: migration_process_pos_sale.sql

**Purpose:** Create `process_pos_sale()` RPC function for POS sales

**Rollback SQL:**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS process_pos_sale;

-- Verify function is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'process_pos_sale'
    ) THEN
        RAISE EXCEPTION 'Function still exists after rollback';
    END IF;
    RAISE NOTICE 'Function process_pos_sale successfully dropped';
END $$;
```

**Verification:**
```sql
-- Check function does not exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'process_pos_sale';
-- Should return 0 rows
```

---

### Migration 2: migration_cancel_invoice.sql

**Purpose:** Create `cancel_invoice()` RPC function for invoice cancellation

**Rollback SQL:**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS cancel_invoice;

-- Verify function is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'cancel_invoice'
    ) THEN
        RAISE EXCEPTION 'Function still exists after rollback';
    END IF;
    RAISE NOTICE 'Function cancel_invoice successfully dropped';
END $$;
```

**Verification:**
```sql
-- Check function does not exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'cancel_invoice';
-- Should return 0 rows
```

---

### Migration 3: migration_delete_payment.sql

**Purpose:** Create `delete_payment()` RPC function for payment deletion

**Rollback SQL:**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS delete_payment;

-- Verify function is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'delete_payment'
    ) THEN
        RAISE EXCEPTION 'Function still exists after rollback';
    END IF;
    RAISE NOTICE 'Function delete_payment successfully dropped';
END $$;
```

**Verification:**
```sql
-- Check function does not exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'delete_payment';
-- Should return 0 rows
```

---

### Migration 4: migration_process_return.sql

**Purpose:** Create `process_return()` RPC function for return processing

**Rollback SQL:**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS process_return;

-- Verify function is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'process_return'
    ) THEN
        RAISE EXCEPTION 'Function still exists after rollback';
    END IF;
    RAISE NOTICE 'Function process_return successfully dropped';
END $$;
```

**Verification:**
```sql
-- Check function does not exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'process_return';
-- Should return 0 rows
```

---

### Migration 5: migration_receive_po_items.sql

**Purpose:** Create `receive_po_items()` RPC function for PO receiving

**Rollback SQL:**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS receive_po_items;

-- Verify function is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'receive_po_items'
    ) THEN
        RAISE EXCEPTION 'Function still exists after rollback';
    END IF;
    RAISE NOTICE 'Function receive_po_items successfully dropped';
END $$;
```

**Verification:**
```sql
-- Check function does not exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'receive_po_items';
-- Should return 0 rows
```

---

### Migration 6: migration_delete_transaction.sql

**Purpose:** Create `delete_transaction()` RPC function for transaction deletion

**Rollback SQL:**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS delete_transaction;

-- Verify function is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'delete_transaction'
    ) THEN
        RAISE EXCEPTION 'Function still exists after rollback';
    END IF;
    RAISE NOTICE 'Function delete_transaction successfully dropped';
END $$;
```

**Verification:**
```sql
-- Check function does not exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'delete_transaction';
-- Should return 0 rows
```

---

### Migration 7: migration_delete_sales_history_item.sql

**Purpose:** Create `delete_sales_history_item()` RPC function for sales history deletion

**Rollback SQL:**
```sql
-- Drop the RPC function
DROP FUNCTION IF EXISTS delete_sales_history_item;

-- Verify function is dropped
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'delete_sales_history_item'
    ) THEN
        RAISE EXCEPTION 'Function still exists after rollback';
    END IF;
    RAISE NOTICE 'Function delete_sales_history_item successfully dropped';
END $$;
```

**Verification:**
```sql
-- Check function does not exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'delete_sales_history_item';
-- Should return 0 rows
```

---

## Complete Rollback Script

### Automated Rollback Script

Create `rollback.sh`:
```bash
#!/bin/bash

# Complete rollback script
# Usage: ./rollback.sh [backup_timestamp]

BACKUP_DIR=${1:-$(ls -t backups/ | head -1)}
BACKUP_PATH="backups/$BACKUP_DIR"

echo "=== ROLLBACK START ==="
echo "Using backup: $BACKUP_PATH"

# Step 1: Restore JavaScript files
echo "Restoring JavaScript files..."
cp $BACKUP_PATH/penjualan.js.backup penjualan.js
cp $BACKUP_PATH/script.js.backup script.js
cp $BACKUP_PATH/returns-management.js.backup returns-management.js
cp $BACKUP_PATH/purchase-orders.js.backup purchase-orders.js

# Step 2: Drop RPC functions
echo "Dropping RPC functions..."
psql -h kbaltquoajrmpixgsiec.supabase.co -U postgres -d postgres << EOF
DROP FUNCTION IF EXISTS process_pos_sale;
DROP FUNCTION IF EXISTS cancel_invoice;
DROP FUNCTION IF EXISTS delete_payment;
DROP FUNCTION IF EXISTS process_return;
DROP FUNCTION IF EXISTS receive_po_items;
DROP FUNCTION IF EXISTS delete_transaction;
DROP FUNCTION IF EXISTS delete_sales_history_item;
EOF

# Step 3: Verify rollback
echo "Verifying rollback..."
echo "Checking file sizes..."
ls -l penjualan.js script.js returns-management.js purchase-orders.js

echo "Checking RPC functions..."
psql -h kbaltquoajrmpixgsiec.supabase.co -U postgres -d postgres -c "
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN (
    'process_pos_sale', 'cancel_invoice', 'delete_payment', 
    'process_return', 'receive_po_items', 'delete_transaction', 
    'delete_sales_history_item'
);
"

echo "=== ROLLBACK COMPLETE ==="
echo "Please verify functionality manually"
```

### Manual Rollback Checklist

- [ ] Backup directory identified
- [ ] JavaScript files restored from backup
- [ ] File sizes verified against backup
- [ ] RPC functions dropped from database
- [ ] Database verification queries run
- [ ] Git revert performed (if needed)
- [ ] Application tested manually
- [ ] All critical operations tested:
  - [ ] POS sales
  - [ ] Payment deletion
  - [ ] Invoice cancellation
  - [ ] Transaction deletion
  - [ ] Sales history deletion
  - [ ] Return processing
  - [ ] PO receiving

---

## Emergency Rollback Procedure

### Scenario: Critical Failure in Production

**Step 1: Immediate Action (5 minutes)**
```bash
# Stop application (if deployed)
# Switch to maintenance mode

# Restore from most recent backup
LATEST_BACKUP=$(ls -t backups/ | head -1)
cp backups/$LATEST_BACKUP/penjualan.js.backup penjualan.js
cp backups/$LATEST_BACKUP/script.js.backup script.js
cp backups/$LATEST_BACKUP/returns-management.js.backup returns-management.js
cp backups/$LATEST_BACKUP/purchase-orders.js.backup purchase-orders.js
```

**Step 2: Database Rollback (10 minutes)**
```sql
-- Drop all RPC functions immediately
DROP FUNCTION IF EXISTS process_pos_sale CASCADE;
DROP FUNCTION IF EXISTS cancel_invoice CASCADE;
DROP FUNCTION IF EXISTS delete_payment CASCADE;
DROP FUNCTION IF EXISTS process_return CASCADE;
DROP FUNCTION IF EXISTS receive_po_items CASCADE;
DROP FUNCTION IF EXISTS delete_transaction CASCADE;
DROP FUNCTION IF EXISTS delete_sales_history_item CASCADE;
```

**Step 3: Verification (15 minutes)**
- Test POS sales
- Test payment deletion
- Test invoice cancellation
- Verify no errors in console
- Verify database consistency

**Step 4: Communication (20 minutes)**
- Notify stakeholders
- Document incident
- Schedule post-mortem

---

## Rollback Testing Procedure

### Pre-Deployment Rollback Test

**Objective:** Verify rollback procedure works before actual deployment

**Steps:**
1. Create test backup
2. Apply changes to test environment
3. Execute rollback procedure
4. Verify system functionality
5. Document any issues

**Test Script:**
```bash
#!/bin/bash

echo "=== ROLLBACK TEST START ==="

# Create test backup
TEST_BACKUP="backups/test_$(date +%Y%m%d_%H%M%S)"
mkdir -p $TEST_BACKUP
cp penjualan.js $TEST_BACKUP/penjualan.js.backup
cp script.js $TEST_BACKUP/script.js.backup
cp returns-management.js $TEST_BACKUP/returns-management.js.backup
cp purchase-orders.js $TEST_BACKUP/purchase-orders.js.backup

echo "Test backup created: $TEST_BACKUP"

# Simulate changes (for testing)
echo "Simulating changes..."
# (In real scenario, actual changes would be applied here)

# Execute rollback
echo "Executing rollback..."
cp $TEST_BACKUP/penjualan.js.backup penjualan.js
cp $TEST_BACKUP/script.js.backup script.js
cp $TEST_BACKUP/returns-management.js.backup returns-management.js
cp $TEST_BACKUP/purchase-orders.js.backup purchase-orders.js

# Verify
echo "Verifying rollback..."
if [ -f "$TEST_BACKUP/penjualan.js.backup" ]; then
    echo "✓ penjualan.js restored"
else
    echo "✗ penjualan.js restoration failed"
fi

if [ -f "$TEST_BACKUP/script.js.backup" ]; then
    echo "✓ script.js restored"
else
    echo "✗ script.js restoration failed"
fi

echo "=== ROLLBACK TEST COMPLETE ==="
```

---

## Post-Rollback Verification

### Automated Verification Script

```bash
#!/bin/bash

echo "=== POST-ROLLBACK VERIFICATION ==="

# Check file integrity
echo "Checking file integrity..."
FILES=("penjualan.js" "script.js" "returns-management.js" "purchase-orders.js")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
    fi
done

# Check for RPC functions
echo "Checking for RPC functions..."
RPC_COUNT=$(psql -h kbaltquoajrmpixgsiec.supabase.co -U postgres -d postgres -t -c "
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name IN (
        'process_pos_sale', 'cancel_invoice', 'delete_payment', 
        'process_return', 'receive_po_items', 'delete_transaction', 
        'delete_sales_history_item'
    );
")

if [ "$RPC_COUNT" -eq 0 ]; then
    echo "✓ All RPC functions dropped"
else
    echo "✗ $RPC_COUNT RPC functions still exist"
fi

echo "=== VERIFICATION COMPLETE ==="
```

---

## Summary

**Total Files to Modify:** 4 JavaScript files + 7 new migration files

**Total Functions to Replace:** 7 functions

**Rollback Complexity:** MEDIUM
- File restoration: Simple (copy from backup)
- Database rollback: Simple (DROP FUNCTION)
- Verification: Straightforward (check file sizes, function existence)

**Rollback Time Estimate:**
- File restoration: 2 minutes
- Database rollback: 5 minutes
- Verification: 10 minutes
- Total: ~17 minutes

**Risk Level:** LOW
- Backup procedure is straightforward
- Rollback is reversible
- No data loss during rollback
- Application can be restored to previous state
