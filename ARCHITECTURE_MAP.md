# Spectre Inventory & POS System - Architecture Map

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive architecture documentation for refactor and stabilization audit

---

## 1. System Overview

### 1.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vanilla JavaScript | Core application logic |
| **UI Framework** | Custom CSS (Tailwind-inspired) | Styling and responsive design |
| **Backend** | Supabase (PostgreSQL) | Database and authentication |
| **Authentication** | Supabase Auth | User session and role management |
| **PWA** | Service Worker | Offline support and caching |
| **Mobile** | Capacitor | Native mobile app wrapper |
| **Deployment** | Vercel | Static hosting |

### 1.2 Architecture Pattern

**Pattern:** Multi-page SPA (Single Page Application) with shared modules

- **Entry Points:** Individual HTML files for each feature
- **Shared Modules:** JavaScript modules loaded via `<script>` tags
- **Data Layer:** Direct Supabase client queries (no API layer)
- **State Management:** Local state + Supabase real-time queries
- **Routing:** Browser navigation between HTML pages

---

## 2. Directory Structure

```
spectre-inventory-v2/
├── assets/logos/              # Application icons and logos
├── .github/workflows/         # CI/CD (deploy.yml)
├── node_modules/              # Dependencies (Capacitor, sharp)
├── HTML Pages (11 files)
│   ├── index.html            # Dashboard
│   ├── barang.html           # Product Inventory
│   ├── member.html           # CRM / Member Management
│   ├── penjualan.html        # Sales Terminal
│   ├── pengeluaran.html      # Expense Management
│   ├── member-payments.html  # Member Debt Tracking
│   ├── login.html            # Authentication
│   ├── marketplace.html       # Marketplace Orders
│   ├── discounts.html        # Discount Management
│   ├── marketplace-reports.html # Marketplace Analytics
│   ├── reports.html          # Sales Reports
│   └── returns.html          # Returns & Refunds
├── JavaScript Modules (30 files)
│   ├── auth.js               # Authentication & Role Management
│   ├── script.js             # Dashboard Logic
│   ├── barang.js             # Product Inventory Logic
│   ├── barang-scan-ui.js     # Barcode Scanning UI (Inventory)
│   ├── member.js             # [NOT FOUND - likely inline in member.html]
│   ├── penjualan.js          # Sales Terminal Logic
│   ├── pengeluaran.js        # Expense Logic
│   ├── member-payments.js    # Member Payment Logic
│   ├── marketplace.js        # Marketplace Orders Logic
│   ├── discount-system.js    # Discount Management
│   ├── returns-management.js # Returns & Refunds Logic
│   ├── supplier-management.js # Supplier Management
│   ├── tax-config.js         # Tax Configuration
│   ├── sales-reports.js      # Sales Reporting
│   ├── inventory-reports.js  # Inventory Reporting
│   ├── marketplace-reports.js # Marketplace Reports UI
│   ├── marketplace-reporting.js # Combined POS + Marketplace Analytics
│   ├── marketplace-repository.js # Marketplace Data Access Layer
│   ├── marketplace-service.js # Marketplace Business Logic
│   ├── marketplace-utils.js  # Marketplace Utilities
│   ├── purchase-orders.js    # Purchase Order Management
│   ├── receipt-printer.js    # Receipt Printing
│   ├── barcode-label-printer.js # Barcode Label Generation
│   ├── scan-helper.js        # Camera Barcode Scanning Helper
│   ├── scan-masuk.js         # Barcode Scanning (Stock Entry)
│   ├── scan-terjual.js       # Barcode Scanning (Sales)
│   ├── button-animations.js  # UI Button Effects
│   ├── candle-manager.js     # Stock/Payment Animation Effects
│   ├── service-worker.js     # PWA Service Worker
│   └── generate-icons.js     # Icon Generation (Node.js)
├── CSS Files (2 files)
│   ├── style.css             # Main Styles (3363 lines)
│   └── status.css            # Status Badge Styles
├── SQL Migration Files (7 files)
│   ├── migration_initial_schema.sql
│   ├── migration_add_ukuran_to_payments.sql
│   ├── migration_fix_harga_jual.sql
│   ├── migration_marketplace_manual.sql
│   ├── migration_soft_delete.sql
│   ├── check_duplicate_phones.sql
│   └── check_size_l_price.sql
├── Configuration Files (4 files)
│   ├── package.json          # Dependencies
│   ├── manifest.json         # PWA Manifest
│   ├── capacitor.config.json # Capacitor Config
│   └── vercel.json           # Vercel Deployment
└── Documentation (various .md files)
```

---

## 3. Database Schema

### 3.1 Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `products` | Product catalog | id, nama_barang, sku, kategori, ukuran, stok, harga_modal, harga_jual, is_active, deleted_at |
| `members` | Customer CRM | id, nama, telepon, diskon_persen |
| `payments` | Sales transactions | id, buyer, product, total_harga, paid_amount, remaining_amount, status, method, invoice_number |
| `sales_history` | Sales line items | id, payment_id, product_id, nama_barang, jumlah, total_harga, tipe_pembeli |
| `expenses` | Expense tracking | id, keterangan, kategori, nominal, tanggal, catatan |
| `profiles` | User profiles | id, role (ADMIN/CASHIER) |

### 3.2 Marketplace Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `marketplace_accounts` | Platform accounts | id, platform, shop_name, is_active |
| `online_orders` | Marketplace orders | id, marketplace_account_id, order_number, order_status, gross_sales, net_revenue |
| `order_items` | Order line items | id, online_order_id, product_id, quantity, unit_price, discount, tax |
| `marketplace_fees` | Platform fees | id, online_order_id, fee_type, fee_amount |
| `settlements` | Settlement records | id, marketplace_account_id, period_start, period_end, total_amount |

### 3.3 Support Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `returns` | Returns & refunds | id, invoice_number, product_id, quantity, type, refund_amount, status |
| `discounts` | Discount promotions | id, name, type, value, promo_code, min_purchase, is_active |
| `stock_adjustments` | Stock changes | id, product_id, adjustment_type, quantity, reason |
| `settings` | App settings | id, key, value |

### 3.4 Row Level Security (RLS)

- **Role-based access:** ADMIN (full access), CASHIER (restricted)
- **Cashier restrictions:** Cannot delete products, limited to active products
- **Soft delete support:** `is_active` and `deleted_at` columns on products

---

## 4. Module Architecture

### 4.1 Authentication Layer

**File:** `auth.js`

**Responsibilities:**
- Supabase client initialization
- Session management
- Role-based access control (ADMIN/CASHIER)
- User profile retrieval from `profiles` table
- UI element hiding based on role

**Global Exports:**
- `supabaseClient` - Supabase client instance
- `initAuth()` - Initialize authentication
- `hasRole(role)` - Role check
- `isAdmin()` - Admin check
- `isCashier()` - Cashier check
- `requireAdmin()` - Admin gate
- `logout()` - Logout function
- `hideElementsForCashier()` - UI role filtering
- `showUserInfo()` - Display user info

**Usage:** Loaded on all pages except `login.html`

---

### 4.2 Data Access Patterns

**Pattern:** Direct Supabase queries in each module (no centralized repository for POS)

**Exceptions:**
- Marketplace modules use `marketplace-repository.js` (repository pattern)
- Most POS modules query Supabase directly

**Example Pattern:**
```javascript
const { data, error } = await supabaseClient
    .from('table_name')
    .select('*')
    .eq('column', value);
```

---

### 4.3 Business Logic Layers

#### 4.3.1 Marketplace Module (3-Tier Architecture)

```
marketplace.html (UI)
    ↓
marketplace.js (Page Logic)
    ↓
marketplace-service.js (Business Logic)
    ↓
marketplace-repository.js (Data Access)
    ↓
Supabase (Database)
```

**Modules:**
- `marketplace-repository.js` - CRUD operations, batch inserts, reporting queries
- `marketplace-service.js` - Validation, fee calculation, stock sync, settlement reconciliation
- `marketplace-utils.js` - CSV parsing, validation, formatting, platform helpers
- `marketplace-reporting.js` - Combined POS + marketplace analytics
- `marketplace.js` - Page-specific UI logic

#### 4.3.2 POS Modules (Direct Access Pattern)

```
HTML Page (UI)
    ↓
Page-specific JS (Logic + Data Access)
    ↓
Supabase (Database)
```

**Examples:**
- `barang.js` - Direct product CRUD
- `penjualan.js` - Direct payment/sales operations
- `pengeluaran.js` - Direct expense operations

---

### 4.4 Shared Utility Modules

| Module | Purpose | Used By |
|--------|---------|---------|
| `button-animations.js` | Button ripple, press, shake effects | All pages with `.spectre-btn` |
| `candle-manager.js` | Stock/payment animations | Dashboard, sales, inventory |
| `receipt-printer.js` | Thermal receipt generation | Sales terminal |
| `barcode-label-printer.js` | Barcode label generation | Inventory page |
| `scan-helper.js` | Camera barcode scanning | `scan-masuk.js`, `scan-terjual.js` |
| `tax-config.js` | Tax calculation and reporting | Reports, settings |
| `discount-system.js` | Discount creation and application | Sales, discounts page |

---

## 5. Page-by-Page Architecture

### 5.1 Dashboard (`index.html`)

**Scripts:**
- `style.css`, `status.css`
- `auth.js`
- `button-animations.js`
- `candle-manager.js`
- `script.js`

**Features:**
- KPI cards (revenue, profit, expenses, online sales, items sold, members, products, stock)
- Candlestick chart visualization
- Sales comparison charts
- Recent activity feed
- Inventory overview
- Payment management (delete, confirm)

**Data Sources:**
- `payments` table (POS + online orders combined)
- `products` table (stock counts)
- `expenses` table (expense totals)

---

### 5.2 Product Inventory (`barang.html`)

**Scripts:**
- `style.css`
- `auth.js`
- `button-animations.js`
- `scan-helper.js`
- `barang-scan-ui.js`
- `candle-manager.js`
- `barang.js`

**Features:**
- Product CRUD (Create, Read, Update, Delete)
- SKU generation (category-based prefixes: CLT, DECK, ACC)
- Stock adjustment modal
- Archive/restore products (soft delete)
- Barcode scanning for stock entry
- Low stock alerts

**Data Sources:**
- `products` table (is_active filter for cashier)

---

### 5.3 Sales Terminal (`penjualan.html`)

**Scripts:**
- `style.css`, `status.css`
- `auth.js`
- `button-animations.js`
- `receipt-printer.js`
- `scan-helper.js`
- `scan-terjual.js`
- `candle-manager.js`
- `penjualan.js`

**Features:**
- Shopping cart system
- Product selection (dropdown + barcode scan)
- Member pricing (discount from `members` table)
- Price override support
- Partial payment support
- Payment methods (Cash, Transfer)
- Payment status tracking (paid, partial, pending)
- Receipt printing
- Stock deduction on sale
- Sales history logging

**Data Sources:**
- `products` table (active products only)
- `members` table (member discounts)
- `payments` table (transaction records)
- `sales_history` table (line items)

---

### 5.4 Member Management (`member.html`)

**Scripts:**
- `style.css`
- `auth.js`
- `button-animations.js`
- `[member.js not found - likely inline]`

**Features:**
- Member registration (name, phone, discount %)
- Member list with status
- Edit/delete members

**Data Sources:**
- `members` table

---

### 5.5 Expense Management (`pengeluaran.html`)

**Scripts:**
- `style.css`
- `auth.js`
- `button-animations.js`
- `pengeluaran.js`

**Features:**
- Expense recording (description, category, amount, date, notes)
- Expense categories (Stock, Operational, Electricity, Transport, Salary)
- Expense history table
- KPI cards (total, monthly, average, largest)

**Data Sources:**
- `expenses` table

---

### 5.6 Member Payments (`member-payments.html`)

**Scripts:**
- `style.css`
- `auth.js`
- `member-payments.js`

**Features:**
- Outstanding balance tracking by member
- Payment history with status filtering
- Add partial payments
- Mark as paid
- Cancel payment (restores stock)

**Data Sources:**
- `payments` table (filtered by buyer containing "Member")
- `sales_history` table (for stock restoration on cancel)
- `products` table (stock updates)

---

### 5.7 Marketplace Orders (`marketplace.html`)

**Scripts:**
- `style.css`, `status.css`
- `auth.js`
- `button-animations.js`
- `marketplace.js`

**Features:**
- Manual order import form
- Order list with filters (platform, status, date range)
- Order detail modal
- Order status updates (Pending → Processing → Shipped → Delivered)
- Platform badges (Shopee, TikTok, Tokopedia, Lazada)

**Data Sources:**
- `online_orders` table
- `order_items` table
- `marketplace_accounts` table
- `products` table

---

### 5.8 Discounts (`discounts.html`)

**Scripts:**
- `style.css`, `status.css`
- `auth.js`
- `button-animations.js`
- `discount-system.js`

**Features:**
- Discount creation (percentage, fixed, buy_x_get_y)
- Promo code support
- Minimum purchase requirement
- Member-only discounts
- Usage tracking
- Deactivation

**Data Sources:**
- `discounts` table

---

### 5.9 Reports Pages

#### Sales Reports (`reports.html`)
**Scripts:** `style.css`, `auth.js`, `button-animations.js`, `sales-reports.js`
**Features:** Daily/weekly/monthly/yearly reports, transaction details, top products, CSV export
**Data Sources:** `payments`, `products`, `sales_history`

#### Marketplace Reports (`marketplace-reports.html`)
**Scripts:** `style.css`, `status.css`, `auth.js`, `button-animations.js`, `marketplace-repository.js`, `marketplace-service.js`, `marketplace-utils.js`, `marketplace-reporting.js`
**Features:** Combined POS + marketplace KPIs, channel performance, platform breakdown
**Data Sources:** `payments`, `online_orders`, `order_items`, `products`, `marketplace_accounts`

#### Inventory Reports (via `inventory-reports.js`)
**Features:** Stock movement, valuation, low stock alerts, product performance
**Data Sources:** `sales_history`, `returns`, `products`

---

### 5.10 Returns (`returns.html`)

**Scripts:**
- `style.css`, `status.css`
- `auth.js`
- `button-animations.js`
- `returns-management.js`

**Features:**
- Return creation (invoice, product, quantity, type, refund amount, reason)
- Return processing (restores stock, updates payment status)
- Return cancellation
- Return history

**Data Sources:**
- `returns` table
- `payments` table
- `products` table

---

### 5.11 Login (`login.html`)

**Scripts:**
- `style.css`
- Supabase CDN (direct, no `auth.js`)

**Features:**
- Email/password login
- Role and email storage in localStorage
- Redirect to dashboard on success

**Data Sources:**
- Supabase Auth
- `profiles` table (role retrieval)

---

## 6. Global State Management

### 6.1 Supabase Client

**Location:** `auth.js`
**Scope:** Global (loaded on all pages except login)
**Initialization:** Singleton pattern with session persistence

### 6.2 User Session

**Storage:** `localStorage`
**Keys:**
- `userRole` - ADMIN or CASHIER
- `userEmail` - User email
- `userId` - User UUID

### 6.3 Cross-Tab Communication

**Mechanism:** `localStorage` events
**Events:**
- `inventory_stock_delta` - Stock change broadcast (for candle animations)
- `inventory_payment_delta` - Payment change broadcast

**Used By:** `candle-manager.js`, `penjualan.js`

---

## 7. PWA Architecture

### 7.1 Service Worker (`service-worker.js`)

**Strategy:** Cache-first for assets, Network-first for HTML

**Cached Assets:**
- HTML pages (index.html, barang.html, member.html, penjualan.html, pengeluaran.html, member-payments.html, login.html)
- Static files (manifest.json, logos)
- Supabase CDN URL

**Features:**
- Offline access
- iOS PWA cache invalidation
- Broadcast messages for reloads

### 7.2 Manifest (`manifest.json`)

**App Info:**
- Name: Spectre Inventory
- Short Name: Spectre
- Display: standalone
- Orientation: portrait
- Theme Colors: Dark theme

**Shortcuts:**
- Dashboard
- Sales
- Reports

---

## 8. Mobile Architecture (Capacitor)

### 8.1 Configuration (`capacitor.config.json`)

**Settings:**
- App ID: `com.spectre.inventory`
- App Name: Spectre Inventory
- Web Dir: `./` (root)
- Icon: `assets/logos/favicon.png`

### 8.2 Dependencies (`package.json`)

**Capacitor:**
- `@capacitor/android`
- `@capacitor/cli`
- `@capacitor/core`
- `@capacitor/assets`

**Utilities:**
- `sharp` - Icon generation

---

## 9. Data Flow Diagrams

### 9.1 Sales Transaction Flow

```
User selects product → penjualan.js
    ↓
Add to cart → cart array
    ↓
Submit form → penjualan.js
    ↓
Generate invoice number
    ↓
Calculate payment status (paid/partial/pending)
    ↓
Insert into payments table
    ↓
For each cart item:
    - Update products.stok (deduct)
    - Insert into sales_history
    ↓
Broadcast stock delta (localStorage)
    ↓
Print receipt (if paid)
    ↓
Reset cart and form
```

### 9.2 Marketplace Order Flow

```
Manual import → marketplace.js
    ↓
Create/get marketplace account
    ↓
Insert into online_orders
    ↓
Insert into order_items
    ↓
Update order status (manual)
    ↓
Stock sync (optional, via marketplace-service.js)
```

### 9.3 Authentication Flow

```
Page load → auth.js
    ↓
Check Supabase session
    ↓
If no session → redirect to login.html
    ↓
Get user role from profiles table
    ↓
Store role/email in localStorage
    ↓
Hide admin elements for cashier
    ↓
Show user info in UI
```

---

## 10. Integration Points

### 10.1 Supabase Integration

**Authentication:** Supabase Auth
**Database:** PostgreSQL via Supabase
**Real-time:** Not currently used (polling/refresh pattern)
**Storage:** Not used (local assets only)

### 10.2 External Services

**None** - All data is self-contained in Supabase

### 10.3 Barcode Scanning

**Technology:** Native `BarcodeDetector` API (if supported)
**Fallback:** Manual entry
**Used By:** Inventory (stock entry), Sales (product selection)

---

## 11. Security Architecture

### 11.1 Authentication

- Supabase Auth with email/password
- Session persistence in localStorage
- Auto-refresh tokens enabled

### 11.2 Authorization

- Role-based access control (RBAC)
- Roles: ADMIN (full access), CASHIER (restricted)
- Row Level Security (RLS) on database
- Cashier cannot delete products
- Cashier sees only active products

### 11.3 Data Validation

- Client-side validation in forms
- Server-side validation via Supabase RLS
- Input sanitization (basic)

---

## 12. Performance Considerations

### 12.1 Caching

- Service Worker cache for static assets
- No application-level caching for data
- Direct Supabase queries on each page load

### 12.2 Bundle Size

- No bundler (Vanilla JS)
- Each page loads required scripts individually
- Supabase CDN loaded separately

### 12.3 Database Queries

- No query optimization (basic selects)
- No pagination (limit 20 on some queries)
- No indexing strategy visible in code

---

## 13. Known Architectural Issues

### 13.1 Tight Coupling

- Direct Supabase queries scattered across modules
- No centralized data access layer (except marketplace)
- Business logic mixed with UI logic

### 13.2 Code Duplication

- Similar CRUD patterns repeated across modules
- Currency formatting duplicated
- Date formatting duplicated
- Status badge rendering duplicated

### 13.3 State Management

- No centralized state management
- Local state in each module
- Cross-tab communication via localStorage (brittle)

### 13.4 Error Handling

- Inconsistent error handling patterns
- Some modules use alerts, others use toasts
- No global error handler

### 13.5 Testing

- No unit tests
- No integration tests
- No E2E tests

---

## 14. Refactor Opportunities

### 14.1 High Priority

1. **Centralize Data Access Layer**
   - Create repository pattern for all modules
   - Consolidate Supabase queries
   - Implement caching layer

2. **Implement State Management**
   - Add centralized state (Redux/Vuex-like)
   - Reduce localStorage usage
   - Improve cross-tab communication

3. **Standardize Error Handling**
   - Create global error handler
   - Standardize user feedback (toasts)
   - Add error logging

### 14.2 Medium Priority

1. **Extract Business Logic**
   - Separate UI from business logic
   - Create service layer for POS modules
   - Improve testability

2. **Reduce Code Duplication**
   - Create utility library for common functions
   - Standardize formatting (currency, date)
   - Consolidate similar CRUD patterns

3. **Add Type Safety**
   - Migrate to TypeScript
   - Add interfaces for database models
   - Improve IDE support

### 14.3 Low Priority

1. **Add Testing**
   - Unit tests for utilities
   - Integration tests for data access
   - E2E tests for critical flows

2. **Performance Optimization**
   - Implement query pagination
   - Add database indexes
   - Optimize bundle size

---

## 15. Deployment Architecture

### 15.1 Vercel Configuration

**File:** `vercel.json`
**Settings:**
- Build command: null (static site)
- Output directory: `./`
- Framework: null
- Clean URLs: enabled
- Trailing slash: disabled

### 15.2 CI/CD

**File:** `.github/workflows/deploy.yml`
**Platform:** GitHub Actions (not reviewed in detail)

---

## Appendix A: File Inventory Summary

| Category | Count |
|----------|-------|
| HTML Pages | 11 |
| JavaScript Modules | 30 |
| CSS Files | 2 |
| SQL Migrations | 7 |
| Configuration Files | 4 |
| Documentation Files | 10+ |
| **Total** | **64+** |

---

## Appendix B: Database Table Summary

| Category | Count |
|----------|-------|
| Core Tables | 6 |
| Marketplace Tables | 5 |
| Support Tables | 4 |
| **Total** | **15** |

---

**End of Architecture Map**
