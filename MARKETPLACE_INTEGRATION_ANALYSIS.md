# Marketplace Accounting Integration Analysis
## SPECTRE Inventory System - Architecture & Implementation Plan

---

## 1. TECH STACK ANALYSIS

### Current Architecture
- **Frontend Framework**: Vanilla HTML/JavaScript (no Next.js/React/Vue)
- **Mobile Deployment**: Capacitor (Android/iOS wrapper)
- **Backend/Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Manual hosting (no Vercel detected)
- **Authentication**: Supabase Auth with role-based access control
- **Styling**: Custom CSS with CSS variables
- **PWA**: Service Worker for offline capability

### Technology Details
```json
{
  "frontend": "Vanilla HTML/JS",
  "mobile": "Capacitor 8.4.0",
  "database": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth",
  "build_tools": "None (manual)",
  "deployment": "Capacitor build for mobile"
}
```

### Deployment Configuration
- **App ID**: `com.spectre.inventory`
- **Web Directory**: `www`
- **No Vercel**: Manual deployment or Capacitor builds only
- **PWA Support**: Yes (service-worker.js, manifest.json)

---

## 2. CURRENT TRANSACTION SYSTEM

### Data Flow Architecture
```
UI (penjualan.html) 
  → penjualan.js (business logic)
  → Supabase Client (auth.js)
  → PostgreSQL Database
```

### Transaction Creation Process
1. **Product Selection**: User selects product from dropdown (populated from `products` table)
2. **Customer Type**: Regular vs Member (affects pricing)
3. **Quantity Input**: Number of items
4. **Price Calculation**: 
   - Regular price: `products.harga_jual`
   - Member price: `products.harga_member`
   - Override: Manual price override option
5. **Payment Status**: Paid Full / Partial Payment / Pay Later
6. **Stock Deduction**: Automatic stock reduction in `products` table
7. **Record Creation**:
   - `payments` table (invoice record)
   - `sales_history` table (transaction log)

### Current Calculations
```javascript
// Subtotal
subtotal = harga_satuan × jumlah

// Discount (member pricing)
discount = harga_jual - harga_member

// Total
total = subtotal - discount

// Profit (estimated)
profit = total - (harga_modal × jumlah)
```

### Key Tables Involved
- **products**: Inventory source
- **payments**: Invoice management (paid_amount, remaining_amount, status)
- **sales_history**: Transaction audit trail
- **members**: Customer pricing tiers

---

## 3. DATABASE ANALYSIS

### Existing Tables & Relationships

#### profiles (Auth & Roles)
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CASHIER')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### payments (Invoice Management)
```sql
-- Current structure
- id: UUID
- buyer: TEXT (customer name)
- product: TEXT (product name)
- jumlah: INTEGER (quantity)
- total_harga: NUMERIC (gross total)
- paid_amount: NUMERIC (amount paid)
- remaining_amount: NUMERIC (outstanding balance)
- method: TEXT (Cash/Transfer)
- status: TEXT (paid/pending/partial/cancelled)
- invoice_number: TEXT (INV-XXXX)
- confirmed_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

#### products (Inventory)
```sql
- id: UUID
- nama_barang: TEXT
- sku: TEXT
- kategori: TEXT (Apparel/Skateboard/Perlengkapan)
- ukuran: TEXT
- stok: INTEGER
- harga_modal: NUMERIC (cost)
- harga_jual: NUMERIC (regular price)
- harga_member: NUMERIC (member price)
- created_at: TIMESTAMPTZ
```

#### sales_history (Transaction Log)
```sql
- id: UUID
- payment_id: UUID (references payments)
- product_id: UUID (references products)
- nama_barang: TEXT
- kategori: TEXT
- ukuran: TEXT
- jumlah: INTEGER
- total_harga: NUMERIC
- tipe_pembeli: TEXT (Umum/Member)
- created_at: TIMESTAMPTZ
```

#### members (Customer Management)
```sql
- id: UUID
- nama: TEXT
- telepon: TEXT (unique identifier)
- created_at: TIMESTAMPTZ
```

#### expenses (Operating Costs)
```sql
- id: UUID
- keterangan: TEXT
- kategori: TEXT (Pembelian Stok/Operasional/Listrik/Transport/Gaji)
- nominal: NUMERIC
- tanggal: DATE
- catatan: TEXT
- created_at: TIMESTAMPTZ
```

### Database Relationships
```
profiles (auth.users)
  ↓
payments ← sales_history → products
  ↓
members (customer references)
  ↓
expenses (standalone)
```

---

## 4. INTEGRATION READINESS

### Current System Limitations
- **POS-Only Design**: Built for in-person transactions
- **No Marketplace Support**: No tables for external platforms
- **Simple Pricing**: No complex fee structures
- **Manual Entry**: All data entered manually

### Integration Entry Points
**Recommended**: Create separate marketplace tables that feed into existing payment system

### Proposed New Tables

#### marketplace_accounts
```sql
CREATE TABLE marketplace_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('SHOPEE', 'TIKTOK', 'TOKOPEDIA', 'LAZADA')),
    shop_name TEXT NOT NULL,
    shop_id TEXT,
    api_key TEXT,
    api_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### online_orders
```sql
CREATE TABLE online_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_account_id UUID REFERENCES marketplace_accounts(id),
    order_number TEXT NOT NULL UNIQUE,
    platform_order_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    order_date TIMESTAMPTZ NOT NULL,
    order_status TEXT DEFAULT 'PENDING',
    gross_sales NUMERIC DEFAULT 0,
    voucher_discount NUMERIC DEFAULT 0,
    platform_fee NUMERIC DEFAULT 0,
    shipping_fee NUMERIC DEFAULT 0,
    net_revenue NUMERIC DEFAULT 0,
    settlement_status TEXT DEFAULT 'UNSETTLED',
    settlement_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### order_items
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    online_order_id UUID REFERENCES online_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT,
    sku TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC,
    total_price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### marketplace_fees
```sql
CREATE TABLE marketplace_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    online_order_id UUID REFERENCES online_orders(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL, -- 'COMMISSION', 'SERVICE_FEE', 'TRANSACTION_FEE'
    fee_name TEXT,
    fee_amount NUMERIC NOT NULL,
    fee_percentage NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### settlements
```sql
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_account_id UUID REFERENCES marketplace_accounts(id),
    settlement_id TEXT UNIQUE,
    settlement_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    total_amount NUMERIC NOT NULL,
    order_count INTEGER,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Integration Strategy
1. **Separate Tables**: Keep marketplace data isolated from POS
2. **Bridge Tables**: Link online orders to existing products via SKU
3. **Unified Reporting**: Combine POS + marketplace data in dashboard
4. **API Integration**: Future-proof for direct marketplace API connections

---

## 5. BUSINESS LOGIC PROPOSAL

### Marketplace Revenue Calculations

```javascript
// Gross Sales
gross_sales = Σ(order_items.total_price)

// Voucher Discounts
voucher_discount = Σ(online_orders.voucher_discount)

// Platform Fees
platform_fee = Σ(marketplace_fees.fee_amount)

// Shipping Fees (collected from customer)
shipping_fee_collected = Σ(online_orders.shipping_fee)

// Actual Shipping Cost (if tracked)
shipping_cost = Σ(actual_shipping_costs)

// Net Revenue
net_revenue = gross_sales - voucher_discount - platform_fee

// Profit Calculation
profit = net_revenue - (product_cost × quantity) - shipping_cost - other_expenses
```

### Fee Structure Examples

#### Shopee Fee Calculation
```
Gross Sales: Rp 100.000
Platform Fee: 5% = Rp 5.000
Transaction Fee: 1% = Rp 1.000
Service Fee: 2% = Rp 2.000
Total Fees: Rp 8.000
Net Revenue: Rp 92.000
```

#### TikTok Shop Fee Calculation
```
Gross Sales: Rp 100.000
Commission: 5% = Rp 5.000
Payment Fee: 1% = Rp 1.000
Shipping Fee (subsidy): Rp 10.000
Total Fees: Rp 6.000
Net Revenue: Rp 94.000 + shipping subsidy
```

### Integration Points
1. **Order Import**: Manual CSV import or API integration
2. **Stock Sync**: Deduct stock when online order received
3. **Fee Tracking**: Automatic fee calculation based on platform rules
4. **Settlement Reconciliation**: Match marketplace payouts with orders

---

## 6. UI PROPOSAL

### New Admin Pages

#### 1. Marketplace Management (`marketplace.html`)
- Add/remove marketplace accounts
- Configure API credentials
- View platform connection status
- Sync settings

#### 2. Online Orders (`online-orders.html`)
- List all online orders
- Filter by platform/status/date
- Order details view
- Manual order entry
- Order status updates

#### 3. Settlement Reports (`settlements.html`)
- View settlement history
- Reconcile payouts
- Export settlement reports
- Fee breakdown analysis

### Dashboard Changes

#### New KPI Cards
```html
<!-- Marketplace Revenue -->
<div class="spectre-kpi-card">
  <div class="spectre-kpi-label">Marketplace Revenue</div>
  <div class="spectre-kpi-value" id="marketplaceRevenue">Rp 0</div>
</div>

<!-- Platform Fees -->
<div class="spectre-kpi-card">
  <div class="spectre-kpi-label">Platform Fees</div>
  <div class="spectre-kpi-value" id="platformFees">Rp 0</div>
</div>

<!-- Online Orders -->
<div class="spectre-kpi-card">
  <div class="spectre-kpi-label">Online Orders</div>
  <div class="spectre-kpi-value" id="onlineOrders">0</div>
</div>

<!-- Net Marketplace Revenue -->
<div class="spectre-kpi-card">
  <div class="spectre-kpi-label">Net Marketplace Revenue</div>
  <div class="spectre-kpi-value" id="netMarketplaceRevenue">Rp 0</div>
</div>
```

#### Navigation Updates
```html
<!-- Add to sidebar -->
<li>
  <a href="marketplace.html" class="spectre-navlink">
    <svg>...</svg> Marketplace
  </a>
</li>
<li>
  <a href="online-orders.html" class="spectre-navlink">
    <svg>...</svg> Online Orders
  </a>
</li>
```

### Reporting Changes

#### Enhanced Revenue Chart
- Combine POS + Marketplace revenue
- Separate lines for each channel
- Platform fee visualization
- Net revenue comparison

#### New Reports Section
- Marketplace performance by platform
- Fee analysis over time
- Settlement reconciliation
- Channel profitability comparison

---

## 7. ARCHITECTURE SUMMARY

### Current Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ index.html   │  │ penjualan.html│  │ barang.html  │     │
│  │ (Dashboard)  │  │ (POS)        │  │ (Products)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │              JavaScript Logic Layer                  │    │
│  │  script.js  │  penjualan.js  │  barang.js  │ auth.js│
│  └──────┬──────────────────┬──────────────────┬───────┘    │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    SUPABASE CLIENT LAYER                      │
│              (auth.js - supabase.createClient)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SUPABASE BACKEND                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │ Auth         │  │ Realtime     │     │
│  │ Database     │  │ System       │  │ Subscriptions│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Architecture with Marketplace
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ index.html   │  │ penjualan.html│  │ marketplace  │     │
│  │ (Dashboard)  │  │ (POS)        │  │ .html       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │              JavaScript Logic Layer                  │    │
│  │  script.js  │  penjualan.js  │  marketplace.js │     │
│  └──────┬──────────────────┬──────────────────┬───────┘    │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                    SUPABASE CLIENT LAYER                      │
│              (auth.js - supabase.createClient)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SUPABASE BACKEND                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │ Auth         │  │ Realtime     │     │
│  │ Database     │  │ System       │  │ Subscriptions│     │
│  │              │  │              │  │              │     │
│  │ NEW TABLES:  │  │              │  │              │     │
│  │ marketplace  │  │              │  │              │     │
│  │ _accounts    │  │              │  │              │     │
│  │ online_orders│  │              │  │              │     │
│  │ order_items  │  │              │  │              │     │
│  │ marketplace  │  │              │  │              │     │
│  │ _fees        │  │              │  │              │     │
│  │ settlements  │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Database ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│   profiles      │
│  (auth users)   │
└────────┬────────┘
         │
         │ 1
         │
         │ *
┌────────▼────────┐     ┌─────────────────┐
│    payments     │────▶│  sales_history  │
│  (invoices)     │     │  (transactions) │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ *                     │ *
         │                       │
┌────────▼────────┐     ┌────────▼────────┐
│    members      │     │    products     │
│  (customers)    │     │   (inventory)   │
└─────────────────┘     └─────────────────┘

┌─────────────────────────────────────────────────────────┐
│              MARKETPLACE MODULE (NEW)                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐                                   │
│  │marketplace_accounts│                                 │
│  └────────┬─────────┘                                   │
│           │ 1                                            │
│           │                                              │
│           │ *                                            │
│  ┌────────▼─────────┐     ┌──────────────────┐         │
│  │  online_orders   │────▶│  order_items     │         │
│  └────────┬─────────┘     └────────┬─────────┘         │
│           │ *                      │                    │
│           │                        │ 1                  │
│           │                        │                    │
│           │ *              ┌───────▼─────────┐          │
│           │               │    products      │          │
│           │               │  (existing)     │          │
│           │               └─────────────────┘          │
│           │                                             │
│           │ *                                           │
│  ┌────────▼─────────┐                                   │
│  │ marketplace_fees  │                                   │
│  └──────────────────┘                                   │
│                                                         │
│  ┌──────────────────┐                                   │
│  │  settlements     │                                   │
│  └──────────────────┘                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Database Schema (Week 1)
- [ ] Create marketplace_accounts table
- [ ] Create online_orders table
- [ ] Create order_items table
- [ ] Create marketplace_fees table
- [ ] Create settlements table
- [ ] Add indexes for performance
- [ ] Set up RLS policies
- [ ] Test schema with sample data

### Phase 2: Backend Logic (Week 2)
- [ ] Create marketplace.js (new file)
- [ ] Implement order import functions
- [ ] Implement fee calculation logic
- [ ] Implement settlement reconciliation
- [ ] Add stock sync for online orders
- [ ] Create API utility functions

### Phase 3: UI Development (Week 3-4)
- [ ] Create marketplace.html (account management)
- [ ] Create online-orders.html (order management)
- [ ] Create settlements.html (settlement reports)
- [ ] Update dashboard with marketplace KPIs
- [ ] Add marketplace navigation to sidebar
- [ ] Implement order entry forms
- [ ] Create order detail views

### Phase 4: Integration & Testing (Week 5)
- [ ] Manual CSV import functionality
- [ ] Test order flow from import to stock deduction
- [ ] Test fee calculations
- [ ] Test settlement reconciliation
- [ ] Performance testing
- [ ] Cross-platform testing (mobile/desktop)

### Phase 5: API Integration (Future)
- [ ] Shopee API integration
- [ ] TikTok Shop API integration
- [ ] Tokopedia API integration
- [ ] Lazada API integration
- [ ] Webhook setup for real-time order sync
- [ ] Automated fee calculation

---

## 9. MIGRATION SQL FOR SUPABASE

```sql
-- ============================================
-- MARKETPLACE ACCOUNTING SYSTEM MIGRATION
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MARKETPLACE ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('SHOPEE', 'TIKTOK', 'TOKOPEDIA', 'LAZADA')),
    shop_name TEXT NOT NULL,
    shop_id TEXT,
    api_key TEXT,
    api_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view marketplace accounts"
    ON marketplace_accounts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can insert marketplace accounts"
    ON marketplace_accounts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update marketplace accounts"
    ON marketplace_accounts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete marketplace accounts"
    ON marketplace_accounts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- ONLINE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS online_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_account_id UUID REFERENCES marketplace_accounts(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    platform_order_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    order_date TIMESTAMPTZ NOT NULL,
    order_status TEXT DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')),
    gross_sales NUMERIC DEFAULT 0,
    voucher_discount NUMERIC DEFAULT 0,
    platform_fee NUMERIC DEFAULT 0,
    shipping_fee NUMERIC DEFAULT 0,
    net_revenue NUMERIC DEFAULT 0,
    settlement_status TEXT DEFAULT 'UNSETTLED' CHECK (settlement_status IN ('UNSETTLED', 'PARTIALLY_SETTLED', 'SETTLED')),
    settlement_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_number, marketplace_account_id)
);

-- Indexes for performance
CREATE INDEX idx_online_orders_marketplace_account ON online_orders(marketplace_account_id);
CREATE INDEX idx_online_orders_order_date ON online_orders(order_date);
CREATE INDEX idx_online_orders_order_status ON online_orders(order_status);
CREATE INDEX idx_online_orders_settlement_status ON online_orders(settlement_status);

-- Enable RLS
ALTER TABLE online_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all online orders"
    ON online_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view online orders"
    ON online_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert online orders"
    ON online_orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update online orders"
    ON online_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete online orders"
    ON online_orders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    online_order_id UUID NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_order_items_online_order ON order_items(online_order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_sku ON order_items(sku);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert order items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update order items"
    ON order_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete order items"
    ON order_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- MARKETPLACE FEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    online_order_id UUID NOT NULL REFERENCES online_orders(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('COMMISSION', 'SERVICE_FEE', 'TRANSACTION_FEE', 'SHIPPING_FEE', 'OTHER')),
    fee_name TEXT,
    fee_amount NUMERIC NOT NULL CHECK (fee_amount >= 0),
    fee_percentage NUMERIC CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_marketplace_fees_online_order ON marketplace_fees(online_order_id);
CREATE INDEX idx_marketplace_fees_fee_type ON marketplace_fees(fee_type);

-- Enable RLS
ALTER TABLE marketplace_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all marketplace fees"
    ON marketplace_fees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view marketplace fees"
    ON marketplace_fees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert marketplace fees"
    ON marketplace_fees FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update marketplace fees"
    ON marketplace_fees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete marketplace fees"
    ON marketplace_fees FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- SETTLEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
    settlement_id TEXT UNIQUE,
    settlement_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    order_count INTEGER DEFAULT 0 CHECK (order_count >= 0),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_settlements_marketplace_account ON settlements(marketplace_account_id);
CREATE INDEX idx_settlements_settlement_date ON settlements(settlement_date);
CREATE INDEX idx_settlements_status ON settlements(status);

-- Enable RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all settlements"
    ON settlements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Cashiers can view settlements"
    ON settlements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'CASHIER'
        )
    );

CREATE POLICY "Admins can insert settlements"
    ON settlements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update settlements"
    ON settlements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can delete settlements"
    ON settlements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_marketplace_accounts_updated_at
    BEFORE UPDATE ON marketplace_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_orders_updated_at
    BEFORE UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at
    BEFORE UPDATE ON settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order net revenue
CREATE OR REPLACE FUNCTION calculate_order_net_revenue()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_revenue = COALESCE(NEW.gross_sales, 0) - 
                     COALESCE(NEW.voucher_discount, 0) - 
                     COALESCE(NEW.platform_fee, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_online_order_net_revenue
    BEFORE INSERT OR UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_net_revenue();

-- Function to sync stock when online order is processed
CREATE OR REPLACE FUNCTION sync_online_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    product_record RECORD;
    new_stock INTEGER;
BEGIN
    -- Only sync if order status is PROCESSING or higher
    IF NEW.order_status IN ('PROCESSING', 'SHIPPED', 'DELIVERED') AND 
       (OLD.order_status IS NULL OR OLD.order_status NOT IN ('PROCESSING', 'SHIPPED', 'DELIVERED')) THEN
        
        -- Loop through order items
        FOR item_record IN 
            SELECT * FROM order_items WHERE online_order_id = NEW.id
        LOOP
            -- Get product info
            SELECT * INTO product_record 
            FROM products 
            WHERE id = item_record.product_id;
            
            -- Update stock if product exists
            IF FOUND THEN
                new_stock := product_record.stok - item_record.quantity;
                
                IF new_stock < 0 THEN
                    RAISE EXCEPTION 'Insufficient stock for product %', product_record.nama_barang;
                END IF;
                
                UPDATE products 
                SET stok = new_stock 
                WHERE id = product_record.id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_stock_on_online_order
    AFTER UPDATE ON online_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_online_order_stock();

-- ============================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================

-- Insert sample marketplace account
INSERT INTO marketplace_accounts (platform, shop_name, shop_id, is_active)
VALUES 
    ('SHOPEE', 'Spectre Skate Shop', 'SHOPEE12345', true),
    ('TIKTOK', 'Spectre Official', 'TIKTOK67890', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
```

---

## 10. ESTIMATED IMPACTED FILES

### New Files to Create
```
marketplace.html              # Marketplace account management
marketplace.js               # Marketplace business logic
online-orders.html           # Online order management
online-orders.js             # Online order business logic
settlements.html             # Settlement reports
settlements.js               # Settlement business logic
migration_marketplace.sql    # Database migration (above)
```

### Files to Modify
```
index.html                   # Add marketplace KPIs, navigation
script.js                    # Add marketplace calculations
style.css                    # Add marketplace-specific styles
auth.js                      # No changes needed
penjualan.js                 # No changes needed
barang.js                    # No changes needed
pengeluaran.js              # No changes needed
```

### Files to Review (Potential Impact)
```
member.html                  # Consider linking online customers
member-payments.html         # Consider marketplace order payments
barang.html                  # Ensure SKU consistency
penjualan.html              # No direct impact
```

---

## 11. RISK ANALYSIS

### Technical Risks

#### High Risk
- **Stock Synchronization Conflicts**
  - Risk: Double deduction of stock (POS + marketplace)
  - Mitigation: Implement stock reservation system, add conflict resolution logic
  - Impact: High - could cause overselling

- **Data Consistency**
  - Risk: Marketplace data not matching local inventory
  - Risk: SKU mismatches between systems
  - Mitigation: SKU validation, product mapping table, regular reconciliation
  - Impact: High - could cause reporting errors

#### Medium Risk
- **Performance Issues**
  - Risk: Large dataset queries slowing down dashboard
  - Mitigation: Proper indexing, pagination, caching
  - Impact: Medium - affects user experience

- **API Rate Limits**
  - Risk: Marketplace API rate limiting during sync
  - Mitigation: Implement rate limiting, batch processing, queue system
  - Impact: Medium - affects data freshness

#### Low Risk
- **UI Complexity**
  - Risk: Too many features overwhelming users
  - Mitigation: Progressive disclosure, user training, clear UX
  - Impact: Low - can be iterated on

### Business Risks

#### High Risk
- **Fee Calculation Errors**
  - Risk: Incorrect fee calculations leading to wrong profit reports
  - Mitigation: Automated fee calculation with manual review, audit trails
  - Impact: High - financial reporting accuracy

- **Settlement Reconciliation**
  - Risk: Marketplace payouts not matching recorded orders
  - Mitigation: Automated reconciliation with manual override, regular audits
  - Impact: High - cash flow management

#### Medium Risk
- **User Adoption**
  - Risk: Staff not using new marketplace features
  - Mitigation: Training, clear documentation, gradual rollout
  - Impact: Medium - ROI on development effort

### Operational Risks

#### Medium Risk
- **Data Migration**
  - Risk: Historical marketplace data not easily imported
  - Mitigation: CSV import templates, manual entry for legacy data
  - Impact: Medium - incomplete historical reporting

- **Backup & Recovery**
  - Risk: New tables not included in backup strategy
  - Mitigation: Update backup procedures, test recovery
  - Impact: Medium - data loss potential

### Security Risks

#### Medium Risk
- **API Credentials**
  - Risk: Marketplace API keys exposed in client-side code
  - Mitigation: Store in Supabase secrets, server-side proxy for API calls
  - Impact: Medium - unauthorized access to marketplace accounts

- **RLS Policies**
  - Risk: Incorrect RLS policies exposing sensitive data
  - Mitigation: Thorough testing, principle of least privilege
  - Impact: Medium - data breach potential

---

## 12. SUCCESS METRICS

### Technical Metrics
- Database migration success rate: 100%
- API integration uptime: >99%
- Page load time: <2 seconds
- Stock sync accuracy: >99.9%

### Business Metrics
- Marketplace order processing time: <5 minutes
- Fee calculation accuracy: 100%
- Settlement reconciliation accuracy: >99%
- User adoption rate: >80% within 3 months

### Financial Metrics
- Reduced manual data entry time: 50%
- Improved fee tracking accuracy: 100%
- Better cash flow visibility: Real-time settlement tracking
- Profitability insights: Channel-by-channel breakdown

---

## 13. RECOMMENDATIONS

### Immediate Actions
1. **Start with Manual Import**: Begin with CSV import functionality before API integration
2. **Focus on Shopee First**: Implement one marketplace first, then expand
3. **Stock Reservation**: Implement stock reservation system to prevent overselling
4. **SKU Standardization**: Ensure SKU consistency across all channels

### Long-term Considerations
1. **API Integration**: Plan for direct marketplace API connections
2. **Multi-channel Inventory**: Consider real-time inventory sync across channels
3. **Automated Reconciliation**: Build automated settlement reconciliation
4. **Advanced Analytics**: Implement channel profitability analysis

### Best Practices
1. **Data Validation**: Strict validation on all marketplace data imports
2. **Audit Trail**: Log all changes to marketplace data
3. **Error Handling**: Graceful error handling for API failures
4. **User Training**: Comprehensive training for staff on new features

---

## 14. CONCLUSION

The SPECTRE Inventory System is well-positioned to add marketplace accounting capabilities. The existing architecture provides a solid foundation with:

- **Strong Database Design**: Supabase PostgreSQL with proper relationships
- **Role-based Access**: Secure authentication and authorization
- **Modular Structure**: Clean separation of concerns
- **Mobile-First**: Capacitor integration for on-the-go management

The proposed marketplace integration maintains backward compatibility while adding comprehensive multi-channel support. The phased implementation approach minimizes risk and allows for iterative improvement.

**Estimated Timeline**: 5 weeks for core functionality, additional time for API integrations

**Resource Requirements**: 1-2 developers, database access, marketplace API documentation

**Success Probability**: High - given the solid existing foundation and clear integration strategy

---

*Document Generated: June 15, 2026*
*Analysis Version: 1.0*
*SPECTRE Inventory System - Marketplace Integration Plan*
