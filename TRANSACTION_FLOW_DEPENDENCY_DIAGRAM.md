# Transaction Flow Dependency Diagram

## Overview

This document maps all database operations involving `payments`, `products` (stock), and `sales_history` tables to identify potential data inconsistency paths.

---

## Operation Locations

### Payment INSERT
- **penjualan.js:719** - POS sales form submission

### Stock UPDATE (products.update)
- **penjualan.js:765** - POS sales (deduct stock)
- **penjualan.js:582** - Invoice cancellation (restore stock)
- **script.js:530** - Payment deletion (restore stock)
- **script.js:2258** - Invoice cancellation (restore stock)
- **script.js:2333** - Transaction deletion (restore stock)
- **script.js:2520** - Sales history deletion (restore stock)
- **returns-management.js:76** - Return processing (restore stock)
- **purchase-orders.js:242** - PO receiving (add stock)
- **marketplace-service.js:185** - Marketplace order stock sync
- **marketplace-service.js:644** - Marketplace order stock sync

### Sales_history INSERT
- **penjualan.js:773** - POS sales flow

### Sales_history DELETE
- **script.js:542** - Payment deletion
- **script.js:2346** - Transaction deletion
- **script.js:2527** - Sales history deletion

### Payment DELETE
- **script.js:554** - Payment deletion
- **script.js:2361** - Transaction deletion

### Payment UPDATE
- **script.js:580** - Confirm payment
- **script.js:2158** - Add partial payment
- **script.js:2194** - Mark as paid
- **script.js:2266** - Cancel invoice
- **returns-management.js:94** - Return processing

---

## Flow Diagrams

### Flow 1: POS Sales (penjualan.js:643-842)

```
START: User submits sales form
  │
  ├─► Generate invoice number (line 669)
  │
  ├─► INSERT payment (line 719)
  │   │
  │   ├─► SUCCESS → Continue
  │   │
  │   └─► FAILURE → Alert, return (line 738)
  │       [Payment NOT inserted, stock NOT deducted]
  │       [Result: Consistent]
  │
  ├─► FOR each cart item (line 751):
  │   │
  │   ├─► Check product exists (line 753)
  │   │   └─► NOT FOUND → Add error, continue (line 756)
  │       [Payment exists, stock NOT deducted, no sales_history]
  │       [Result: INCONSISTENT - payment without stock deduction]
  │
  │   ├─► Check stock sufficient (line 759)
  │   │   └─► INSUFFICIENT → Add error, continue (line 761)
  │       [Payment exists, stock NOT deducted, no sales_history]
  │       [Result: INCONSISTENT - payment without stock deduction]
  │
  │   ├─► UPDATE products.stok (line 765)
  │   │   │
  │   │   ├─► SUCCESS → Continue to sales_history insert
  │   │   │
  │   │   └─► FAILURE → Add error, continue (line 768)
  │   │       [Payment exists, stock NOT deducted, no sales_history]
  │   │       [Result: INCONSISTENT - payment without stock deduction]
  │   │
  │   └─► INSERT sales_history (line 773)
  │       │
  │       ├─► SUCCESS → Add to totalItemsSold (line 787)
  │       │   [Payment exists, stock deducted, sales_history exists]
  │       │   [Result: Consistent]
  │       │
  │       └─► FAILURE → Add error, continue (line 785)
  │           [Payment exists, stock deducted, no sales_history]
  │           [Result: INCONSISTENT - stock deducted without sales_history record]
  │
  ├─► Check for errors (line 792)
  │   │
  │   ├─► ERRORS EXIST → Alert "TRANSAKSI SEBAGIAN BERHASIL" (line 795)
  │   │   [Payment remains in database]
  │   │   [Some stock may be deducted]
  │   │   [Some sales_history may exist]
  │   │   [Result: INCONSISTENT - partial transaction]
  │   │
  │   └─► NO ERRORS → Success alert (line 819)
  │       [Payment exists, stock deducted, sales_history exists]
  │       [Result: Consistent]
  │
  └─► Reset form and cart (line 834)
      [Regardless of errors]
```

**Failure Paths:**
1. **Payment insert fails** → No payment, no stock deduction, no sales_history → **CONSISTENT**
2. **Product not found** → Payment exists, no stock deduction, no sales_history → **INCONSISTENT**
3. **Stock insufficient** → Payment exists, no stock deduction, no sales_history → **INCONSISTENT**
4. **Stock update fails** → Payment exists, no stock deduction, no sales_history → **INCONSISTENT**
5. **Sales_history insert fails** → Payment exists, stock deducted, no sales_history → **INCONSISTENT**
6. **Multiple items, some fail** → Payment exists, partial stock deduction, partial sales_history → **INCONSISTENT**

---

### Flow 2: Payment Deletion (script.js:460-575)

```
START: User deletes payment
  │
  ├─► Check if online order or in-store (line 467)
  │
  ├─► IF online order:
  │   └─► DELETE online_orders (line 482)
  │       [No stock restoration for marketplace orders in this flow]
  │       [Result: Marketplace stock handled by trigger]
  │
  └─► IF in-store payment:
      │
      ├─► SELECT payment (line 496)
      │   └─► NOT FOUND → Alert, return (line 475)
      │
      ├─► SELECT sales_history by invoice_number (line 508)
      │
      ├─► FOR each sales_history record (line 519):
      │   │
      │   ├─► SELECT product.stok (line 521)
      │   │   └─► NOT FOUND → Log error, continue (line 535)
      │       [Payment deleted, stock NOT restored]
      │       [Result: INCONSISTENT - payment deleted without stock restoration]
      │   │
      │   └─► UPDATE products.stok (line 530)
      │       │
      │       ├─► SUCCESS → Continue
      │       │
      │       └─► FAILURE → Log error, continue (line 535)
      │           [Payment deleted, stock NOT restored]
      │           [Result: INCONSISTENT - payment deleted without stock restoration]
      │
      ├─► DELETE sales_history (line 542)
      │   │
      │   ├─► SUCCESS → Continue
      │   │
      │   └─► FAILURE → Log error, continue (line 547)
      │       [Payment deleted, stock restored, sales_history exists]
      │       [Result: INCONSISTENT - sales_history without payment]
      │
      └─► DELETE payment (line 553)
          │
          ├─► SUCCESS → Alert success (line 567)
          │
          └─► FAILURE → Alert error (line 559)
              [Payment NOT deleted, stock restored, sales_history deleted]
              [Result: INCONSISTENT - stock restored without payment deletion]
```

**Failure Paths:**
1. **Product not found during restoration** → Payment deleted, stock not restored → **INCONSISTENT**
2. **Stock update fails during restoration** → Payment deleted, stock not restored → **INCONSISTENT**
3. **Sales_history delete fails** → Payment deleted, stock restored, sales_history exists → **INCONSISTENT**
4. **Payment delete fails** → Payment exists, stock restored, sales_history deleted → **INCONSISTENT**

---

### Flow 3: Invoice Cancellation (script.js:2214-2279)

```
START: User cancels invoice
  │
  ├─► SELECT payment (line 2232)
  │   └─► NOT FOUND → Alert, return (line 2230)
  │
  ├─► Check if already cancelled (line 2234)
  │   └─► YES → Alert, return (line 2236)
  │
  ├─► SELECT sales_history by payment_id (line 2240)
  │
  ├─► FOR each sales_history record (line 2247):
  │   │
  │   ├─► SELECT product.stok (line 2249)
  │   │   └─► NOT FOUND → Continue (no error handling)
  │       [Payment cancelled, stock NOT restored]
  │       [Result: INCONSISTENT]
  │   │
  │   └─► UPDATE products.stok (line 2258)
  │       │
  │       └─► FAILURE → No error handling, continues
  │           [Payment cancelled, stock NOT restored]
  │           [Result: INCONSISTENT]
  │
  ├─► UPDATE payment status to 'cancelled' (line 2266)
  │   │
  │   ├─► SUCCESS → Alert success (line 2273)
  │   │
  │   └─► FAILURE → Alert error (line 2271)
  │       [Payment NOT cancelled, stock restored]
  │       [Result: INCONSISTENT - stock restored without payment cancellation]
  │
  └─► Location reload (line 2274)
```

**Failure Paths:**
1. **Product not found** → Payment cancelled, stock not restored → **INCONSISTENT**
2. **Stock update fails** → Payment cancelled, stock not restored → **INCONSISTENT**
3. **Payment update fails** → Payment not cancelled, stock restored → **INCONSISTENT**

---

### Flow 4: Transaction Deletion (script.js:2281-2389)

```
START: User deletes transaction (admin only)
  │
  ├─► SELECT payment (line 2294)
  │   └─► NOT FOUND → Alert, return (line 2301)
  │
  ├─► SELECT sales_history by payment_id (line 2308)
  │
  ├─► FOR each sales_history record (line 2317):
  │   │
  │   ├─► SELECT product.stok (line 2321)
  │   │   └─► NOT FOUND → Log error, continue (line 2338)
  │       [Payment deleted, stock NOT restored]
  │       [Result: INCONSISTENT]
  │   │
  │   └─► UPDATE products.stok (line 2333)
  │       │
  │       └─► FAILURE → No error handling, continues
  │           [Payment deleted, stock NOT restored]
  │           [Result: INCONSISTENT]
  │
  ├─► DELETE sales_history (line 2345)
  │   │
  │   ├─► SUCCESS → Continue
  │   │
  │   └─► FAILURE → Alert error, return (line 2352)
  │       [Payment NOT deleted, stock restored, sales_history deleted]
  │       [Result: INCONSISTENT]
  │
  ├─► DELETE payment (line 2360)
  │   │
  │   ├─► SUCCESS → Alert success (line 2373)
  │   │
  │   └─► FAILURE → Alert error, return (line 2366)
  │       [Payment NOT deleted, stock restored, sales_history deleted]
  │       [Result: INCONSISTENT]
  │
  └─► Refresh products (line 2377)
```

**Failure Paths:**
1. **Product not found** → Payment deleted, stock not restored → **INCONSISTENT**
2. **Stock update fails** → Payment deleted, stock not restored → **INCONSISTENT**
3. **Sales_history delete fails** → Payment not deleted, stock restored, sales_history deleted → **INCONSISTENT**
4. **Payment delete fails** → Payment not deleted, stock restored, sales_history deleted → **INCONSISTENT**

---

### Flow 5: Sales History Deletion (script.js:2492-2541)

```
START: User deletes single sales history record
  │
  ├─► SELECT sales_history (line 2498)
  │   └─► NOT FOUND → Alert, return (line 2505)
  │
  ├─► SELECT product.stok (line 2511)
  │   └─► NOT FOUND → No error handling
  │       [Sales_history deleted, stock NOT restored]
  │       [Result: INCONSISTENT]
  │
  ├─► UPDATE products.stok (line 2520)
  │   │
  │   └─► FAILURE → No error handling, continues
  │       [Sales_history deleted, stock NOT restored]
  │       [Result: INCONSISTENT]
  │
  ├─► DELETE sales_history (line 2526)
  │   │
  │   ├─► SUCCESS → Alert success (line 2535)
  │   │
  │   └─► FAILURE → Alert error, return (line 2531)
  │       [Sales_history NOT deleted, stock restored]
  │       [Result: INCONSISTENT]
  │
  └─► Load dashboard (line 2536)
```

**Failure Paths:**
1. **Product not found** → Sales_history deleted, stock not restored → **INCONSISTENT**
2. **Stock update fails** → Sales_history deleted, stock not restored → **INCONSISTENT**
3. **Sales_history delete fails** → Sales_history not deleted, stock restored → **INCONSISTENT**

---

### Flow 6: Return Processing (returns-management.js:40-121)

```
START: User processes return
  │
  ├─► SELECT return record (line 42)
  │   └─► NOT FOUND → Throw error
  │
  ├─► SELECT payment (line 53)
  │   └─► NOT FOUND → Throw error
  │
  ├─► SELECT product.stok (line 63)
  │   └─► NOT FOUND → Throw error
  │
  ├─► UPDATE products.stok (line 76)
  │   └─► FAILURE → Throw error
  │       [Return not processed, stock NOT restored]
  │       [Result: Consistent - transaction rolled back]
  │
  ├─► IF refund type:
  │   │
  │   └─► UPDATE payment (line 94)
  │       └─► FAILURE → Throw error
  │           [Return not processed, stock restored, payment NOT updated]
  │           [Result: INCONSISTENT - stock restored without payment update]
  │
  ├─► UPDATE return status (line 107)
  │   └─► FAILURE → Throw error
  │       [Return not processed, stock restored, payment updated]
  │       [Result: INCONSISTENT - stock/payment updated without return status]
  │
  └─► Return true
```

**Failure Paths:**
1. **Payment update fails** → Stock restored, payment not updated → **INCONSISTENT**
2. **Return status update fails** → Stock restored, payment updated, return status not updated → **INCONSISTENT**

---

### Flow 7: PO Receiving (purchase-orders.js:220-268)

```
START: User receives PO items
  │
  ├─► FOR each received item:
  │   │
  │   ├─► UPDATE po_items.received_quantity (line 226)
  │   │
  │   └─► IF product_id exists:
  │       │
  │       ├─► SELECT product.stok (line 233)
  │       │   └─► NOT FOUND → Continue (no error handling)
  │       │       [PO item received, stock NOT added]
  │       │       [Result: INCONSISTENT]
  │       │
  │       └─► UPDATE products.stok (line 242)
  │           │
  │           └─► FAILURE → No error handling
  │               [PO item received, stock NOT added]
  │               [Result: INCONSISTENT]
  │
  ├─► Check if all items received (line 250)
  │
  └─► UPDATE PO status (line 258)
```

**Failure Paths:**
1. **Product not found** → PO item received, stock not added → **INCONSISTENT**
2. **Stock update fails** → PO item received, stock not added → **INCONSISTENT**

---

### Flow 8: Invoice Cancellation (penjualan.js:545-607)

```
START: User cancels invoice
  │
  ├─► SELECT payment (line 548)
  │   └─► NOT FOUND → Alert, return (line 552)
  │
  ├─► Check if already cancelled (line 556)
  │   └─► YES → Alert, return (line 558)
  │
  ├─► SELECT sales_history by payment_id (line 564)
  │
  ├─► FOR each sales_history record (line 571):
  │   │
  │   ├─► SELECT product.stok (line 573)
  │   │   └─► NOT FOUND → Continue (no error handling)
  │       [Payment cancelled, stock NOT restored]
  │       [Result: INCONSISTENT]
  │   │
  │   └─► UPDATE products.stok (line 582)
  │       │
  │       └─► FAILURE → No error handling
  │           [Payment cancelled, stock NOT restored]
  │           [Result: INCONSISTENT]
  │
  ├─► UPDATE payment status to 'cancelled' (line 590)
  │   │
  │   ├─► SUCCESS → Alert success (line 604)
  │   │
  │   └─► FAILURE → Alert error (line 593)
  │       [Payment NOT cancelled, stock restored]
  │       [Result: INCONSISTENT]
  │
  └─► Reload page (line 606)
```

**Failure Paths:**
1. **Product not found** → Payment cancelled, stock not restored → **INCONSISTENT**
2. **Stock update fails** → Payment cancelled, stock not restored → **INCONSISTENT**
3. **Payment update fails** → Payment not cancelled, stock restored → **INCONSISTENT**

---

## Summary of Inconsistency Points

### Critical Inconsistency Points

1. **POS Sales (penjualan.js:719-789)**
   - Payment inserted FIRST
   - Stock updates happen AFTER in a loop
   - If ANY stock update fails, payment remains
   - If ANY sales_history insert fails, stock is deducted but no record
   - **NO ROLLBACK MECHANISM**
   - **NO DATABASE TRANSACTION**

2. **Payment Deletion (script.js:517-555)**
   - Stock restoration happens BEFORE payment deletion
   - If payment deletion fails, stock is already restored
   - If sales_history deletion fails, stock is restored but record exists
   - **NO TRANSACTION WRAPPING**

3. **Invoice Cancellation (script.js:2245-2275)**
   - Stock restoration happens BEFORE payment update
   - If payment update fails, stock is already restored
   - No error handling for stock restoration failures
   - **NO TRANSACTION WRAPPING**

4. **Transaction Deletion (script.js:2315-2368)**
   - Stock restoration happens BEFORE record deletion
   - If payment deletion fails, stock is already restored
   - If sales_history deletion fails, stock is restored but record deleted
   - **NO TRANSACTION WRAPPING**

5. **Sales History Deletion (script.js:2509-2533)**
   - Stock restoration happens BEFORE record deletion
   - If record deletion fails, stock is already restored
   - No error handling for stock restoration failures
   - **NO TRANSACTION WRAPPING**

### Common Patterns

1. **No Database Transactions**: All operations use individual Supabase calls without wrapping in a transaction
2. **Sequential Operations**: Stock updates happen before/after record operations without atomicity
3. **Insufficient Error Handling**: Many operations continue on error or have no error handling
4. **No Rollback**: When operations fail mid-sequence, there's no rollback mechanism
5. **Race Conditions**: Stock is read, calculated, then updated without locking

### Database Constraints

- **Foreign Key**: `sales_history.payment_id` has `ON DELETE CASCADE`
- **Foreign Key**: `sales_history.product_id` has `ON DELETE CASCADE`
- **No CHECK constraints** for stock >= 0 (only app-level validation)
- **No triggers** for automatic stock management on POS operations
- **Marketplace has triggers** but POS does not

---

## Recommendations

1. **Wrap all multi-step operations in Supabase RPC functions with PostgreSQL transactions**
2. **Implement optimistic locking with version numbers for stock updates**
3. **Add database-level CHECK constraints for stock >= 0**
4. **Create database triggers for automatic stock management on payment changes**
5. **Implement proper error handling with rollback logic**
6. **Add compensation transactions for failed operations**
