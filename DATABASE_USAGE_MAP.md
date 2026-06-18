# Spectre Inventory & POS System - Database Usage Map

**Generated:** 2025-01-XX  
**Purpose:** Map database table usage across all files for refactor and stabilization audit

---

## 1. Executive Summary

| Metric | Count |
|--------|-------|
| Total Database Tables | 15 |
| Total JavaScript Files Analyzed | 30 |
| Files with Database Access | 22 |
| Files without Database Access | 8 |
| Total Read Operations | 45 |
| Total Write Operations | 18 |
| Total Update Operations | 15 |
| Total Delete Operations | 8 |

---

## 2. Database Schema Overview

### 2.1 Core Tables

| Table | Purpose | Primary Key | Foreign Keys |
|-------|---------|-------------|--------------|
| `products` | Product catalog | id | - |
| `members` | Customer CRM | id | - |
| `payments` | Sales transactions | id | - |
| `sales_history` | Sales line items | id | payment_id, product_id |
| `expenses` | Expense tracking | id | - |
| `profiles` | User profiles | id | - |

### 2.2 Marketplace Tables

| Table | Purpose | Primary Key | Foreign Keys |
|-------|---------|-------------|--------------|
| `marketplace_accounts` | Platform accounts | id | - |
| `online_orders` | Marketplace orders | id | marketplace_account_id |
| `order_items` | Order line items | id | online_order_id, product_id |
| `marketplace_fees` | Platform fees | id | online_order_id |
| `settlements` | Settlement records | id | marketplace_account_id |

### 2.3 Support Tables

| Table | Purpose | Primary Key | Foreign Keys |
|-------|---------|-------------|--------------|
| `returns` | Returns & refunds | id | payment_id, product_id |
| `discounts` | Discount promotions | id | - |
| `stock_adjustments` | Stock changes | id | product_id |
| `settings` | App settings | id | - |

---

## 3. Table Usage by File

### 3.1 products Table

**Purpose:** Product inventory management

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `barang.js` | READ, WRITE, UPDATE, DELETE | id, nama_barang, sku, kategori, ukuran, stok, harga_modal, harga_jual, is_active, deleted_at | High |
| `penjualan.js` | READ, UPDATE | id, nama_barang, kategori, ukuran, stok, harga_jual, harga_modal | High |
| `script.js` | READ, UPDATE | id, nama_barang, stok | Medium |
| `scan-terjual.js` | READ | id, nama_barang, sku, ukuran | Low |
| `sales-reports.js` | READ | id, nama_barang, harga_modal | Medium |
| `inventory-reports.js` | READ | id, nama_barang, stok, kategori, harga_modal, harga_jual | Medium |
| `marketplace.js` | READ | id, nama_barang, sku, harga_jual | Medium |
| `marketplace-repository.js` | READ | id, nama_barang, sku | Low |
| `marketplace-reporting.js` | READ | id, stok, harga_modal | Medium |
| `purchase-orders.js` | READ, UPDATE | id, stok | Low |
| `supplier-management.js` | READ | id, nama_barang, harga_modal | Low |
| `member-payments.js` | UPDATE | stok | Low |
| `returns-management.js` | UPDATE | stok | Low |

**Total Files:** 13  
**Operations:** READ (11), WRITE (1), UPDATE (5), DELETE (1)

**Critical Columns:**
- `id` - Primary key, used in all joins
- `stok` - Stock level, frequently updated
- `is_active` - Soft delete flag, used for cashier filtering
- `harga_jual` - Selling price, used in calculations
- `harga_modal` - Cost price, used in profit calculations

---

### 3.2 payments Table

**Purpose:** Sales transaction records

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `script.js` | READ, WRITE, UPDATE, DELETE | id, buyer, product, total_harga, paid_amount, remaining_amount, status, method, invoice_number, created_at | High |
| `penjualan.js` | WRITE | id, buyer, product, ukuran, jumlah, total_harga, paid_amount, remaining_amount, method, status, invoice_number, confirmed_at, created_at | High |
| `member-payments.js` | READ, UPDATE | id, buyer, product, total_harga, paid_amount, remaining_amount, status | Medium |
| `sales-reports.js` | READ | total_harga, paid_amount, created_at, status | Medium |
| `marketplace-reporting.js` | READ | total_harga, paid_amount, created_at, status | Medium |
| `tax-config.js` | READ | total_harga, created_at | Low |
| `returns-management.js` | READ | id, status, total_harga | Low |

**Total Files:** 7  
**Operations:** READ (6), WRITE (1), UPDATE (2), DELETE (1)

**Critical Columns:**
- `id` - Primary key
- `status` - Payment status (paid, pending, partial, cancelled)
- `total_harga` - Total amount
- `paid_amount` - Amount paid
- `remaining_amount` - Outstanding balance
- `invoice_number` - Invoice identifier

---

### 3.3 sales_history Table

**Purpose:** Sales line item history

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `script.js` | READ, WRITE | payment_id, product_id, nama_barang, jumlah, total_harga, tipe_pembeli, created_at | Medium |
| `penjualan.js` | WRITE | payment_id, product_id, nama_barang, kategori, ukuran, jumlah, total_harga, tipe_pembeli | High |
| `sales-reports.js` | READ | jumlah, total_harga, created_at | Medium |
| `inventory-reports.js` | READ | jumlah, created_at | Medium |
| `marketplace-reporting.js` | READ | jumlah, total_harga, created_at | Medium |
| `supplier-management.js` | READ | jumlah, total_harga | Low |
| `member-payments.js` | READ | payment_id, product_id, jumlah | Low |
| `returns-management.js` | READ | payment_id, product_id, jumlah | Low |

**Total Files:** 8  
**Operations:** READ (7), WRITE (2)

**Critical Columns:**
- `id` - Primary key
- `payment_id` - Foreign key to payments
- `product_id` - Foreign key to products
- `jumlah` - Quantity sold
- `total_harga` - Line item total

---

### 3.4 members Table

**Purpose:** Customer CRM

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `penjualan.js` | READ | telepon, nama, diskon_persen | High |
| `member.html` | [MISSING JS] | - | - |

**Total Files:** 1  
**Operations:** READ (1)

**Critical Columns:**
- `telepon` - Phone number (unique identifier)
- `nama` - Member name
- `diskon_persen` - Discount percentage

**Issue:** No JavaScript file loaded for member.html - CRUD operations likely missing

---

### 3.5 expenses Table

**Purpose:** Expense tracking

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `pengeluaran.js` | READ, WRITE | id, keterangan, kategori, nominal, tanggal, catatan | High |
| `script.js` | READ | nominal, tanggal | Medium |

**Total Files:** 2  
**Operations:** READ (2), WRITE (1)

**Critical Columns:**
- `id` - Primary key
- `kategori` - Expense category
- `nominal` - Amount
- `tanggal` - Date

---

### 3.6 profiles Table

**Purpose:** User authentication and roles

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `auth.js` | READ | id, role | High (on every page load) |

**Total Files:** 1  
**Operations:** READ (1)

**Critical Columns:**
- `id` - User UUID (matches Supabase auth user.id)
- `role` - User role (ADMIN/CASHIER)

---

### 3.7 online_orders Table

**Purpose:** Marketplace order records

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `marketplace.js` | READ, WRITE, UPDATE | id, marketplace_account_id, order_number, customer_name, customer_phone, order_date, order_status, gross_sales, shipping_fee, platform_fee, net_revenue, notes | High |
| `marketplace-repository.js` | READ, WRITE, UPDATE, DELETE | All columns | High |
| `marketplace-service.js` | READ (via repository) | All columns | High |
| `marketplace-reporting.js` | READ | order_date, order_status, gross_sales, net_revenue, settlement_status | Medium |
| `script.js` | READ | order_date, gross_sales, net_revenue | Low |

**Total Files:** 5  
**Operations:** READ (4), WRITE (1), UPDATE (2), DELETE (1)

**Critical Columns:**
- `id` - Primary key
- `marketplace_account_id` - Foreign key to marketplace_accounts
- `order_number` - Order identifier
- `order_status` - Order status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED)
- `gross_sales` - Total sales amount
- `net_revenue` - Revenue after fees

---

### 3.8 order_items Table

**Purpose:** Marketplace order line items

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `marketplace.js` | READ, WRITE | id, online_order_id, product_id, product_name, sku, quantity, unit_price, discount, tax, total_price | High |
| `marketplace-repository.js` | READ, WRITE, UPDATE, DELETE | All columns | High |
| `marketplace-service.js` | READ (via repository) | All columns | High |
| `marketplace-reporting.js` | READ | quantity, unit_price, created_at | Medium |

**Total Files:** 4  
**Operations:** READ (3), WRITE (1), UPDATE (1), DELETE (1)

**Critical Columns:**
- `id` - Primary key
- `online_order_id` - Foreign key to online_orders
- `product_id` - Foreign key to products
- `quantity` - Item quantity
- `unit_price` - Unit price

---

### 3.9 marketplace_accounts Table

**Purpose:** Marketplace platform accounts

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `marketplace.js` | READ, WRITE | id, platform, shop_name | Medium |
| `marketplace-repository.js` | READ, WRITE, UPDATE, DELETE | All columns | High |
| `marketplace-service.js` | READ (via repository) | All columns | High |
| `marketplace-reporting.js` | READ | platform, shop_name | Medium |

**Total Files:** 4  
**Operations:** READ (3), WRITE (1), UPDATE (1), DELETE (1)

**Critical Columns:**
- `id` - Primary key
- `platform` - Platform name (SHOPEE, TIKTOK, TOKOPEDIA, LAZADA)
- `shop_name` - Shop identifier
- `is_active` - Active status

---

### 3.10 marketplace_fees Table

**Purpose:** Marketplace platform fees

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `marketplace-repository.js` | READ, WRITE, DELETE | All columns | Medium |

**Total Files:** 1  
**Operations:** READ (1), WRITE (1), DELETE (1)

**Critical Columns:**
- `id` - Primary key
- `online_order_id` - Foreign key to online_orders
- `fee_type` - Fee type (commission, shipping, service)
- `fee_amount` - Fee amount

---

### 3.11 settlements Table

**Purpose:** Marketplace settlement records

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `marketplace-repository.js` | READ, WRITE, UPDATE, DELETE | All columns | Medium |

**Total Files:** 1  
**Operations:** READ (1), WRITE (1), UPDATE (1), DELETE (1)

**Critical Columns:**
- `id` - Primary key
- `marketplace_account_id` - Foreign key to marketplace_accounts
- `period_start`, `period_end` - Settlement period
- `total_amount` - Settlement amount

---

### 3.12 returns Table

**Purpose:** Returns and refunds

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `returns-management.js` | READ, WRITE | All columns | High |

**Total Files:** 1  
**Operations:** READ (1), WRITE (1)

**Critical Columns:**
- `id` - Primary key
- `invoice_number` - Reference to payment
- `product_id` - Foreign key to products
- `quantity` - Return quantity
- `refund_amount` - Refund amount
- `status` - Return status (pending, processed, cancelled)

---

### 3.13 discounts Table

**Purpose:** Discount promotions

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `discount-system.js` | READ, WRITE, UPDATE | All columns | High |

**Total Files:** 1  
**Operations:** READ (1), WRITE (1), UPDATE (1)

**Critical Columns:**
- `id` - Primary key
- `name` - Discount name
- `type` - Discount type (percentage, fixed, buy_x_get_y)
- `value` - Discount value
- `promo_code` - Promo code
- `is_active` - Active status

---

### 3.14 suppliers Table

**Purpose:** Supplier management

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `supplier-management.js` | READ, WRITE, UPDATE, DELETE | All columns | High |
| `purchase-orders.js` | READ | name, contact_person, phone | Low |

**Total Files:** 2  
**Operations:** READ (2), WRITE (1), UPDATE (1), DELETE (1)

**Critical Columns:**
- `id` - Primary key
- `name` - Supplier name
- `contact_person` - Contact person
- `phone` - Phone number

---

### 3.15 settings Table

**Purpose:** Application settings

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `tax-config.js` | READ, WRITE | key, value | Low |

**Total Files:** 1  
**Operations:** READ (1), WRITE (1)

**Critical Columns:**
- `key` - Setting key (e.g., 'tax_config')
- `value` - Setting value (JSON)

---

### 3.16 purchase_orders Table

**Purpose:** Purchase order management

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `purchase-orders.js` | READ, WRITE, UPDATE | All columns | Medium |

**Total Files:** 1  
**Operations:** READ (1), WRITE (1), UPDATE (1)

**Critical Columns:**
- `id` - Primary key
- `po_number` - PO number
- `supplier_id` - Foreign key to suppliers
- `status` - PO status (pending, ordered, partial, received, cancelled)

---

### 3.17 po_items Table

**Purpose:** Purchase order line items

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| `purchase-orders.js` | READ, WRITE, UPDATE | All columns | Medium |

**Total Files:** 1  
**Operations:** READ (1), WRITE (1), UPDATE (1)

**Critical Columns:**
- `id` - Primary key
- `po_id` - Foreign key to purchase_orders
- `product_id` - Foreign key to products
- `quantity` - Order quantity
- `received_quantity` - Quantity received

---

### 3.18 stock_adjustments Table

**Purpose:** Stock adjustment records

| File | Operation | Columns Used | Frequency |
|------|-----------|--------------|----------|
| **NONE** | - | - | - |

**Total Files:** 0  
**Status:** **UNUSED** - Table defined in schema but not accessed by any code

---

## 4. Operation Frequency Analysis

### 4.1 Read Operations by Table

| Table | Read Count | Percentage |
|-------|------------|------------|
| `products` | 11 | 24% |
| `sales_history` | 7 | 16% |
| `payments` | 6 | 13% |
| `online_orders` | 4 | 9% |
| `order_items` | 3 | 7% |
| `marketplace_accounts` | 3 | 7% |
| `expenses` | 2 | 4% |
| `inventory-reports.js` (products) | 1 | 2% |
| `marketplace-repository.js` (multiple) | 1 | 2% |
| Other tables | 7 | 16% |

**Total Read Operations:** 45

### 4.2 Write Operations by Table

| Table | Write Count | Percentage |
|-------|-------------|------------|
| `payments` | 2 | 11% |
| `sales_history` | 2 | 11% |
| `products` | 1 | 6% |
| `expenses` | 1 | 6% |
| `online_orders` | 1 | 6% |
| `order_items` | 1 | 6% |
| `returns` | 1 | 6% |
| `discounts` | 1 | 6% |
| `marketplace_accounts` | 1 | 6% |
| `marketplace_fees` | 1 | 6% |
| `settlements` | 1 | 6% |
| `suppliers` | 1 | 6% |
| `settings` | 1 | 6% |
| `purchase_orders` | 1 | 6% |
| `po_items` | 1 | 6% |

**Total Write Operations:** 18

### 4.3 Update Operations by Table

| Table | Update Count | Percentage |
|-------|--------------|------------|
| `products` | 5 | 33% |
| `payments` | 2 | 13% |
| `online_orders` | 2 | 13% |
| `marketplace_accounts` | 1 | 7% |
| `order_items` | 1 | 7% |
| `discounts` | 1 | 7% |
| `suppliers` | 1 | 7% |
| `settlements` | 1 | 7% |
| `purchase_orders` | 1 | 7% |

**Total Update Operations:** 15

### 4.4 Delete Operations by Table

| Table | Delete Count | Percentage |
|-------|--------------|------------|
| `payments` | 1 | 13% |
| `products` | 1 | 13% |
| `online_orders` | 1 | 13% |
| `order_items` | 1 | 13% |
| `marketplace_accounts` | 1 | 13% |
| `marketplace_fees` | 1 | 13% |
| `settlements` | 1 | 13% |
| `suppliers` | 1 | 13% |

**Total Delete Operations:** 8

---

## 5. Query Pattern Analysis

### 5.1 Common Query Patterns

**Pattern 1: Simple SELECT with ORDER BY**
```javascript
// Found in: barang.js, pengeluaran.js, marketplace.js, etc.
await supabaseClient
    .from('table_name')
    .select('*')
    .order('column', { ascending: false });
```

**Usage Count:** 15+ occurrences

**Pattern 2: SELECT with FILTER**
```javascript
// Found in: barang.js, penjualan.js, etc.
await supabaseClient
    .from('table_name')
    .select('*')
    .eq('column', value);
```

**Usage Count:** 20+ occurrences

**Pattern 3: SELECT with JOIN**
```javascript
// Found in: marketplace-repository.js, marketplace-reporting.js
await supabaseClient
    .from('table_name')
    .select(`
        *,
        related_table (column)
    `);
```

**Usage Count:** 8 occurrences

**Pattern 4: INSERT**
```javascript
// Found in: barang.js, penjualan.js, pengeluaran.js, etc.
await supabaseClient
    .from('table_name')
    .insert([record]);
```

**Usage Count:** 18 occurrences

**Pattern 5: UPDATE**
```javascript
// Found in: barang.js, penjualan.js, script.js, etc.
await supabaseClient
    .from('table_name')
    .update(updates)
    .eq('id', id);
```

**Usage Count:** 15 occurrences

**Pattern 6: DELETE**
```javascript
// Found in: script.js, marketplace-repository.js, etc.
await supabaseClient
    .from('table_name')
    .delete()
    .eq('id', id);
```

**Usage Count:** 8 occurrences

---

## 6. Data Flow Analysis

### 6.1 Sales Transaction Flow

```
penjualan.js
    ↓ INSERT
payments (new record)
    ↓ INSERT (for each cart item)
sales_history (new records)
    ↓ UPDATE
products (stok deduction)
```

**Tables Involved:** payments, sales_history, products

### 6.2 Marketplace Order Flow

```
marketplace.js
    ↓ INSERT/GET
marketplace_accounts
    ↓ INSERT
online_orders (new record)
    ↓ INSERT
order_items (new records)
```

**Tables Involved:** marketplace_accounts, online_orders, order_items

### 6.3 Return Processing Flow

```
returns-management.js
    ↓ INSERT
returns (new record)
    ↓ UPDATE
payments (status change)
    ↓ UPDATE
products (stock restoration)
    ↓ READ
sales_history (for validation)
```

**Tables Involved:** returns, payments, products, sales_history

### 6.4 Dashboard Data Flow

```
script.js
    ↓ READ
payments (POS transactions)
    ↓ READ
online_orders (marketplace transactions)
    ↓ READ
products (stock counts)
    ↓ READ
expenses (expense totals)
```

**Tables Involved:** payments, online_orders, products, expenses

---

## 7. Index and Performance Analysis

### 7.1 Indexes Defined in Schema

From `migration_initial_schema.sql`:
- `products`: Index on `sku`, `kategori`, `is_active`
- `payments`: Index on `invoice_number`, `created_at`, `status`
- `sales_history`: Index on `payment_id`, `product_id`, `created_at`
- `online_orders`: Index on `order_number`, `order_date`, `order_status`
- `order_items`: Index on `online_order_id`, `product_id`
- `marketplace_accounts`: Index on `platform`, `is_active`

### 7.2 Potential Missing Indexes

| Table | Query Pattern | Recommended Index |
|-------|---------------|-------------------|
| `payments` | Filter by `buyer` containing "Member" | Index on `buyer` |
| `sales_history` | Filter by `tipe_pembeli` | Index on `tipe_pembeli` |
| `expenses` | Filter by `kategori`, `tanggal` | Composite index on `(kategori, tanggal)` |
| `returns` | Filter by `invoice_number` | Index on `invoice_number` |
| `discounts` | Filter by `is_active`, `promo_code` | Composite index on `(is_active, promo_code)` |

---

## 8. Data Integrity Issues

### 8.1 Foreign Key Constraints

**Status:** NOT ENFORCED in schema (Supabase RLS used instead)

**Potential Issues:**
- Orphaned records possible if application logic fails
- No cascading deletes
- Manual cleanup required

### 8.2 Data Validation

**Client-Side Validation:**
- Basic validation in forms
- No comprehensive validation rules

**Server-Side Validation:**
- Supabase RLS policies
- No CHECK constraints in schema

**Recommendation:** Add CHECK constraints for:
- `products.stok` >= 0
- `payments.total_harga` >= 0
- `payments.paid_amount` >= 0
- `expenses.nominal` >= 0

---

## 9. Security Analysis

### 9.1 Row Level Security (RLS)

**Policies Defined:**
- `products`: Cashier can only read active products
- `payments`: Role-based access
- `sales_history`: Role-based access
- `expenses`: Role-based access

**Coverage:** Partial - Not all tables have RLS policies

### 9.2 SQL Injection Risk

**Status:** LOW - Supabase client uses parameterized queries

**No raw SQL queries found in codebase**

---

## 10. Unused Tables

### 10.1 Completely Unused

| Table | Status | Recommendation |
|-------|--------|----------------|
| `stock_adjustments` | **UNUSED** | Remove or implement stock adjustment feature |

### 10.2 Partially Used

| Table | Usage | Recommendation |
|-------|-------|----------------|
| `purchase_orders` | Only via `purchase-orders.js` (no UI) | Implement UI or remove |
| `po_items` | Only via `purchase-orders.js` (no UI) | Implement UI or remove |

---

## 11. Recommendations

### 11.1 Immediate Actions

1. **Implement member.js**
   - Create CRUD operations for members table
   - Add phone number validation
   - Add duplicate phone check

2. **Add Missing Indexes**
   - Add index on `payments.buyer`
   - Add index on `sales_history.tipe_pembeli`
   - Add composite index on `expenses(kategori, tanggal)`

3. **Remove Unused Tables**
   - Remove `stock_adjustments` if not needed
   - Remove `purchase_orders` and `po_items` if no UI planned

### 11.2 Short-Term Actions

1. **Add CHECK Constraints**
   - Prevent negative values in numeric columns
   - Validate date ranges
   - Validate enum values

2. **Implement Repository Pattern**
   - Extend marketplace repository pattern to POS modules
   - Centralize all database queries
   - Improve query optimization

3. **Add Query Optimization**
   - Implement pagination for large result sets
   - Add query result caching
   - Optimize JOIN queries

### 11.3 Long-Term Actions

1. **Add Database Triggers**
   - Auto-update `updated_at` timestamps
   - Enforce business rules at database level
   - Implement audit logging

2. **Add Data Archiving**
   - Archive old sales_history records
   - Archive old payments records
   - Improve query performance

3. **Add Database Views**
   - Create views for common queries
   - Simplify complex joins
   - Improve maintainability

---

## Appendix A: Table Access Matrix

| Table | auth.js | script.js | barang.js | penjualan.js | pengeluaran.js | member-payments.js | marketplace.js | discount-system.js | returns-management.js | sales-reports.js | inventory-reports.js | marketplace-repository.js | marketplace-service.js | marketplace-reporting.js | purchase-orders.js | supplier-management.js | tax-config.js |
|-------|---------|-----------|-----------|--------------|----------------|-------------------|----------------|-------------------|----------------------|-----------------|---------------------|---------------------------|------------------------|------------------------|-------------------|----------------------|---------------|
| products | - | R/W/U/D | R/W/U/D | R/U | - | U | R | - | U | R | R | R | - | R | R/U | R | - |
| members | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - |
| payments | - | R/W/U/D | - | W | - | R/U | - | - | R | R | - | - | - | R | - | - | R |
| sales_history | - | R/W | - | W | - | R | - | - | R | R | R | - | - | R | - | R | - |
| expenses | - | R | - | - | R/W | - | - | - | - | - | - | - | - | - | - | - | - |
| profiles | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| online_orders | - | R | - | - | - | - | R/W/U | - | - | - | - | R/W/U/D | - | R | - | - | - |
| order_items | - | - | - | - | - | - | R/W | - | - | - | - | R/W/U/D | - | R | - | - | - |
| marketplace_accounts | - | - | - | - | - | - | R/W | - | - | - | - | R/W/U/D | - | R | - | - | - |
| marketplace_fees | - | - | - | - | - | - | - | - | - | - | - | R/W/D | - | - | - | - | - |
| settlements | - | - | - | - | - | - | - | - | - | - | - | R/W/U/D | - | - | - | - | - |
| returns | - | - | - | - | - | - | - | - | R/W | - | - | - | - | - | - | - | - |
| discounts | - | - | - | - | - | - | - | R/W/U | - | - | - | - | - | - | - | - | - |
| suppliers | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R/W/U/D | - |
| settings | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R/W |
| purchase_orders | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R/W/U | R | - |
| po_items | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R/W/U | - | - |
| stock_adjustments | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |

**Legend:**
- R = Read
- W = Write (INSERT)
- U = Update
- D = Delete
- - = No access

---

## Appendix B: Query Statistics

### B.1 Total Queries by Type

| Query Type | Count | Percentage |
|------------|-------|------------|
| SELECT | 45 | 51% |
| INSERT | 18 | 20% |
| UPDATE | 15 | 17% |
| DELETE | 8 | 9% |
| JOIN | 8 | 9% |

**Total Queries:** 94

### B.2 Most Queried Tables

| Rank | Table | Query Count | Percentage |
|------|-------|-------------|------------|
| 1 | products | 17 | 18% |
| 2 | payments | 10 | 11% |
| 3 | sales_history | 9 | 10% |
| 4 | online_orders | 7 | 7% |
| 5 | order_items | 6 | 6% |
| 6 | marketplace_accounts | 5 | 5% |
| 7 | expenses | 3 | 3% |
| 8-15 | Other tables | 37 | 39% |

---

**End of Database Usage Map**
