# POS Pricing Refactor Plan

**Date:** 2025-01-XX  
**File:** penjualan.js, penjualan.html  
**Status:** PLANNING

---

## Current Implementation Analysis

### Database Schema
Products table has:
- `harga_jual` (regular price)
- `harga_member` (member price)
- `harga_modal` (cost)

### Current Cart Item Structure
```javascript
{
    id: Date.now(),
    productId: selectedProduct.id,
    nama_barang: selectedProduct.nama_barang,
    ukuran: selectedProduct.ukuran || null,
    kategori: selectedProduct.kategori,
    jumlah: jumlahJual,
    hargaSatuan: hargaSatuan,
    totalHarga: totalHarga,
    hargaModal: selectedProduct.harga_modal
}
```

### Current Pricing Logic (addToCart)
1. Reads customer type from radio button
2. If Member: calculates member price based on discount percentage
3. If price_override is filled: uses override
4. Otherwise uses hargaDefault
5. totalHarga = hargaSatuan * jumlahJual

### Issues Identified
1. **Unit Price shows Rp 0** - updatePricePreview shows Rp 0 when no product selected
2. **Total shows Rp 0** - same issue
3. **Cart items don't show regular_price and member_price** - only shows total
4. **Customer type change doesn't update cart** - only affects new items
5. **Price override not reactive** - only checked when adding to cart

---

## Refactor Requirements

### 1. Cart Item Structure Enhancement
Add to cart item:
- `regular_price` (harga_jual from database)
- `member_price` (harga_member from database)
- `price_override` (if used)
- `final_unit_price` (calculated based on customer type)

### 2. Reactive Pricing Logic
- When customer type changes: recalculate all cart item prices
- When price override changes: recalculate preview (not cart items)
- When quantity changes: recalculate total

### 3. Pricing Priority
1. price_override (highest priority)
2. member_price (if customer_type = member)
3. regular_price (default)

### 4. UI Improvements
- Show regular_price and member_price in cart item card
- Show unit_price and total in cart item
- Fix preview to show correct values
- Customer type change should immediately update displayed prices

---

## Implementation Plan

### Phase 1: Update Cart Item Structure
Modify `addToCart()` to store:
```javascript
const cartItem = {
    id: Date.now(),
    productId: selectedProduct.id,
    nama_barang: selectedProduct.nama_barang,
    ukuran: selectedProduct.ukuran || null,
    kategori: selectedProduct.kategori,
    jumlah: jumlahJual,
    regular_price: selectedProduct.harga_jual,
    member_price: selectedProduct.harga_member,
    price_override: hargaOverride,
    final_unit_price: hargaSatuan,
    totalHarga: totalHarga,
    hargaModal: selectedProduct.harga_modal
};
```

### Phase 2: Implement Reactive Pricing
Create `recalculateCartPrices()` function:
```javascript
function recalculateCartPrices() {
    const tipePembeliEl = document.querySelector('input[name="tipe_pembeli"]:checked');
    const tipePembeli = tipePembeliEl ? tipePembeliEl.value : 'Umum';
    
    cart.forEach(item => {
        let hargaDefault = item.regular_price;
        if (tipePembeli === 'Member') {
            hargaDefault = item.member_price;
        }
        
        const hargaSatuan = (item.price_override != null ? item.price_override : hargaDefault);
        item.final_unit_price = hargaSatuan;
        item.totalHarga = hargaSatuan * item.jumlah;
    });
    
    updateCartDisplay();
}
```

### Phase 3: Update Customer Type Handler
Modify `handleTypeChange()` to call `recalculateCartPrices()`:
```javascript
function handleTypeChange() {
    const tipePembeli = document.querySelector('input[name="tipe_pembeli"]:checked').value;
    if (tipePembeli === 'Member') {
        if (boxMemberSelect) boxMemberSelect.classList.remove('hidden');
        if (selectMember) selectMember.setAttribute('required', 'true');
    } else {
        if (boxMemberSelect) boxMemberSelect.classList.add('hidden');
        if (selectMember) {
            selectMember.removeAttribute('required');
            selectMember.value = "";
        }
    }
    updatePricePreview();
    recalculateCartPrices(); // NEW: Recalculate cart prices
}
```

### Phase 4: Update Cart Display
Modify `updateCartDisplay()` to show pricing info:
```javascript
cart.forEach(item => {
    subtotal += item.totalHarga;
    const sizeInfo = item.ukuran ? `<span>Size: ${item.ukuran}</span>` : '';
    
    // Show pricing information
    const priceInfo = `
        <div class="cart-item-pricing">
            <div class="cart-item-price-label">Regular: Rp ${item.regular_price.toLocaleString('id-ID')}</div>
            <div class="cart-item-price-label">Member: Rp ${item.member_price.toLocaleString('id-ID')}</div>
            ${item.price_override ? `<div class="cart-item-price-override">Override: Rp ${item.price_override.toLocaleString('id-ID')}</div>` : ''}
        </div>
    `;
    
    html += `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nama_barang.toUpperCase()}</div>
                <div class="cart-item-details">
                    <span>Qty: ${item.jumlah}</span>
                    <span>Unit: Rp ${item.final_unit_price.toLocaleString('id-ID')}</span>
                    ${sizeInfo}
                </div>
                ${priceInfo}
            </div>
            <div class="cart-item-price">Rp ${item.totalHarga.toLocaleString('id-ID')}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
    `;
});
```

### Phase 5: Fix Price Preview
Ensure `updatePricePreview()` shows correct values when product is selected.

---

## CSS Updates Needed

Add styles for cart item pricing:
```css
.cart-item-pricing {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--stroke);
}
.cart-item-price-label {
    font-size: 10px;
    color: var(--text-secondary);
    margin-bottom: 2px;
}
.cart-item-price-override {
    font-size: 10px;
    color: var(--warning);
    font-weight: 600;
}
```

---

## Testing Checklist

- [ ] Unit Price shows correct value when product selected
- [ ] Total shows correct value when product selected
- [ ] Cart items show regular_price and member_price
- [ ] Customer type change updates cart item prices instantly
- [ ] Price override works correctly
- [ ] Quantity change updates total instantly
- [ ] No console errors
- [ ] Visual behavior unchanged (scale, brightness, etc.)

---

**Status:** Ready for implementation
