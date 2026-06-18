# Sales Terminal UI Redesign Plan

**Date:** 2025-01-XX  
**File:** penjualan.html, penjualan.css (new)  
**Status:** PLANNING

---

## Current Problems

- Too much empty space
- Cart is too small (max-height: 300px)
- Price Information is disconnected from cart
- Radio buttons look outdated
- Layout feels cluttered
- Important information is hard to see

---

## Redesign Requirements

### 1. Two-Column Layout (Desktop)

**Left Column:**
- Product search/select
- Quantity input
- Shopping cart (expanded)
- Price override input

**Right Column:**
- Checkout Summary (premium card)
- Customer type (segmented buttons)
- Member selection
- Payment status (segmented buttons)
- Payment method (segmented buttons)
- Process Sale button (large, prominent)

### 2. Checkout Summary Component

Replace "Price Information" with "Checkout Summary"

**Display:**
- Regular Price
- Member Price
- Active Unit Price
- Quantity
- Total (largest element)

**Style:** Premium summary card with glass morphism

### 3. Total Emphasis

Make Total the largest element on screen:
- Font size: 48px or larger
- Bold weight
- Prominent color (emerald/green)
- Centered or right-aligned in summary

### 4. Segmented Buttons

Convert radio buttons to modern segmented buttons:

**Customer Type:**
```
[ Regular ] [ Member ]
```

**Payment Status:**
```
[ Paid Full ] [ Partial ] [ Pay Later ]
```

**Payment Method:**
```
[ Cash ] [ Transfer ]
```

**Style:**
- Pill-shaped buttons
- Active state: filled background
- Inactive state: outlined
- Smooth transitions
- Hover effects

### 5. Cart Enhancement

- Increase max-height to 500px or use flex-grow
- Larger font sizes
- Better spacing
- More prominent item display
- Clear remove buttons

### 6. Reduce Empty Space

- Tighter padding
- Remove unnecessary margins
- Compact KPI cards
- Optimize spacing between sections

### 7. Mobile Responsive

- Stack columns on mobile
- Touch-friendly buttons
- Readable text sizes
- Proper viewport handling

### 8. Spectre Dark Luxury Aesthetic

- Dark background (#050505)
- Glass morphism effects
- Subtle borders
- Emerald accents
- Premium typography (Space Grotesk)
- Smooth animations

### 9. Preserve Functionality

- All existing IDs must remain
- All event listeners must work
- JavaScript logic unchanged
- Form submission unchanged

---

## Implementation Plan

### Phase 1: HTML Structure Reorganization

1. Create new two-column layout structure
2. Move cart to left column
3. Create Checkout Summary in right column
4. Move customer/payment options to right column
5. Convert radio buttons to segmented button structure

### Phase 2: CSS Implementation

1. Create penjualan.css file
2. Implement two-column grid layout
3. Style Checkout Summary card
4. Style segmented buttons
5. Enhance cart display
6. Make Total prominent
7. Implement mobile responsive design

### Phase 3: JavaScript Verification

1. Verify all IDs still exist
2. Verify event listeners still work
3. Test all functionality
4. Debug any issues

### Phase 4: Testing & Deployment

1. Manual testing in browser
2. Screenshot capture
3. Push to GitHub
4. Deploy to Vercel

---

## New HTML Structure

```html
<section class="sales-terminal-layout">
    <!-- Left Column -->
    <div class="sales-terminal-left">
        <!-- Product Selection -->
        <div class="product-selection-card">
            <div class="card-header">
                <h3>Product Selection</h3>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label class="form-label">Select Product</label>
                    <select id="selectProduct" class="form-input">...</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Quantity</label>
                    <input type="number" id="inputJumlah" class="form-input" min="1" value="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Price Override</label>
                    <input type="number" id="harga_override" class="form-input" min="0" step="1">
                </div>
                <div class="form-actions">
                    <button type="button" id="btnAddToCart" class="spectre-btn spectre-btn--primary">Add to Cart</button>
                </div>
            </div>
        </div>

        <!-- Shopping Cart -->
        <div class="cart-card">
            <div class="card-header">
                <h3>Shopping Cart</h3>
                <span id="cartCount" class="cart-count">0 items</span>
            </div>
            <div class="card-body">
                <div id="cartItems" class="cart-items">...</div>
                <div class="cart-summary">
                    <div class="cart-summary__row">
                        <span class="cart-summary__label">Subtotal:</span>
                        <span id="cartSubtotal" class="cart-summary__value">Rp 0</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Right Column -->
    <div class="sales-terminal-right">
        <!-- Checkout Summary -->
        <div class="checkout-summary-card">
            <div class="card-header">
                <h3>Checkout Summary</h3>
            </div>
            <div class="card-body">
                <div class="summary-row">
                    <span class="summary-label">Regular Price</span>
                    <span id="hargaUmumDefault" class="summary-value">Rp 0</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Member Price</span>
                    <span id="hargaMemberDefault" class="summary-value">Rp 0</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Active Unit Price</span>
                    <span id="previewHargaSatuan" class="summary-value">Rp 0</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Quantity</span>
                    <span id="summaryQuantity" class="summary-value">0</span>
                </div>
                <div class="summary-total">
                    <span class="summary-total-label">Total</span>
                    <span id="previewTotal" class="summary-total-value">Rp 0</span>
                </div>
            </div>
        </div>

        <!-- Customer Type -->
        <div class="customer-type-card">
            <div class="card-header">
                <h3>Customer Type</h3>
            </div>
            <div class="card-body">
                <div class="segmented-control">
                    <label class="segmented-button">
                        <input type="radio" name="tipe_pembeli" value="Umum" checked id="typeUmum">
                        <span>Regular</span>
                    </label>
                    <label class="segmented-button">
                        <input type="radio" name="tipe_pembeli" value="Member" id="typeMember">
                        <span>Member</span>
                    </label>
                </div>
                <div id="boxMemberSelect" class="form-group hidden">
                    <label class="form-label">Select Member</label>
                    <select id="selectMember" class="form-input">...</select>
                </div>
            </div>
        </div>

        <!-- Payment Options -->
        <div class="payment-options-card">
            <div class="card-header">
                <h3>Payment</h3>
            </div>
            <div class="card-body">
                <div class="segmented-control">
                    <label class="segmented-button">
                        <input type="radio" name="payment_status" value="paid_full" checked id="payFull">
                        <span>Paid Full</span>
                    </label>
                    <label class="segmented-button">
                        <input type="radio" name="payment_status" value="partial" id="payPartial">
                        <span>Partial</span>
                    </label>
                    <label class="segmented-button">
                        <input type="radio" name="payment_status" value="pay_later" id="payLater">
                        <span>Pay Later</span>
                    </label>
                </div>
                <div class="segmented-control">
                    <label class="segmented-button">
                        <input type="radio" name="metode_pembayaran" value="Cash" checked id="payCash">
                        <span>Cash</span>
                    </label>
                    <label class="segmented-button">
                        <input type="radio" name="metode_pembayaran" value="Transfer" id="payTransfer">
                        <span>Transfer</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Process Sale Button -->
        <button type="submit" id="btnProses" class="process-sale-btn">Process Sale</button>
    </div>
</section>
```

---

## CSS Implementation

### Two-Column Layout

```css
.sales-terminal-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 24px;
    margin-top: 24px;
}

@media (max-width: 1024px) {
    .sales-terminal-layout {
        grid-template-columns: 1fr;
    }
}
```

### Checkout Summary Card

```css
.checkout-summary-card {
    background: var(--glass);
    border: 1px solid var(--stroke);
    border-radius: var(--radius-lg);
    padding: 24px;
    backdrop-filter: blur(20px);
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--stroke);
}

.summary-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 0 0;
    margin-top: 16px;
    border-top: 2px solid var(--stroke-accent);
}

.summary-total-value {
    font-size: 48px;
    font-weight: 700;
    color: var(--success);
    font-family: var(--font-display);
}
```

### Segmented Buttons

```css
.segmented-control {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.segmented-button {
    flex: 1;
    position: relative;
}

.segmented-button input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
}

.segmented-button span {
    display: block;
    padding: 12px 16px;
    text-align: center;
    background: var(--surface);
    border: 1px solid var(--stroke);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
}

.segmented-button input:checked + span {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
}

.segmented-button:hover span {
    border-color: var(--stroke-accent);
}
```

### Cart Enhancement

```css
.cart-items {
    max-height: 500px;
    overflow-y: auto;
}

.cart-item {
    padding: 16px;
    font-size: 14px;
}

.cart-item-name {
    font-size: 14px;
}
```

---

## Status

**Phase:** PLANNING  
**Next Step:** Implement HTML structure changes

---

**Report Generated:** 2025-01-XX
