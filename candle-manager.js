// candle-manager.js
// Sinkronisasi animasi candel untuk mutasi stok (produk masuk/keluar) dan pembayaran.

(function () {
  function safeNumber(n, fallback = 0) {
    const x = typeof n === 'number' ? n : Number(n);
    return Number.isFinite(x) ? x : fallback;
  }

  // Baseline progres (stabil dan sederhana)
  const STOCK_TARGET = 120;

  function getStockTotalFromDOMFallback() {
    // Di halaman dashboard ada #totalStock.
    const el = document.getElementById('totalStock');
    if (!el) return 0;

    const digits = String(el.textContent || '').replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  function updateStockCandleByTotal(totalStock) {
    const fill = document.getElementById('stockProgressFill');
    const capacityText = document.getElementById('stockCapacityText');
    const capacityLabel = document.getElementById('stockCapacityLabel');
    const statusNote = document.getElementById('stockStatusNote');

    const t = Math.max(0, safeNumber(totalStock, 0));
    const percent = t ? Math.min(100, Math.round((Math.min(t, STOCK_TARGET) / STOCK_TARGET) * 100)) : 0;

    if (fill) fill.style.width = percent + '%';
    if (capacityText) capacityText.textContent = `${percent}% Warehouse Utilization`;
    if (capacityLabel) capacityLabel.textContent = 'INVENTORY_STATUS';
    if (statusNote) {
      statusNote.textContent = t
        ? `Total stock: ${t} units. Warehouse capacity increasing.`
        : 'Warehouse empty. No inventory activity.';
    }
  }

  function pulseElement(el, { times = 2, duration = 220 } = {}) {
    if (!el) return;

    const baseTransform = el.style.transform || '';
    el.style.willChange = 'transform, box-shadow, filter, opacity';

    let i = 0;
    const timer = setInterval(() => {
      i++;
      el.style.transform = 'scale(1.02)';
      el.style.filter = 'brightness(1.15)';
      el.style.boxShadow = '0 0 26px rgba(251, 113, 133, 0.35)';

      setTimeout(() => {
        el.style.transform = baseTransform;
        el.style.filter = 'brightness(1)';
        el.style.boxShadow = '';
      }, duration);

      if (i >= times) clearInterval(timer);
    }, duration);
  }

  function flashInventory(delta, { scope = 'stock' } = {}) {
    const direction = delta >= 0 ? 'in' : 'out';

    if (scope === 'stock') {
      const indicator = document.querySelector('.ghost-panel .inventory-indicator') || document.querySelector('.inventory-indicator');
      pulseElement(indicator, { times: 2, duration: 160 });

      // Animasi halus di progress fill (jangan ubah layout)
      const fill = document.getElementById('stockProgressFill');
      if (fill) {
        fill.style.transition = 'width 280ms ease, box-shadow 280ms ease, filter 280ms ease';
        fill.style.filter = direction === 'in'
          ? 'hue-rotate(-10deg) saturate(1.2)'
          : 'hue-rotate(10deg) saturate(1.2)';

        fill.style.boxShadow = direction === 'in'
          ? '0 0 22px rgba(249, 115, 22, 0.55)'
          : '0 0 22px rgba(220, 38, 38, 0.55)';

        setTimeout(() => {
          fill.style.boxShadow = '';
          fill.style.filter = '';
          fill.style.transition = '';
        }, 420);
      }

      // Partikel super ringan (tidak mengubah layout)
      if (indicator) {
        const r = document.createElement('span');
        r.textContent = direction === 'in' ? '➕' : '➖';
        r.style.position = 'absolute';
        r.style.left = '50%';
        r.style.top = '0%';
        r.style.transform = 'translate(-50%, -10px)';
        r.style.fontSize = '12px';
        r.style.color = direction === 'in' ? '#facc15' : '#fca5a5';
        r.style.textShadow = '0 0 18px rgba(251, 191, 36, 0.35)';
        r.style.opacity = '0.95';
        r.style.pointerEvents = 'none';
        r.style.zIndex = '5';
        indicator.style.position = 'relative';
        indicator.appendChild(r);

        const drift = direction === 'in' ? -14 : -10;
        r.animate(
          [
            { transform: 'translate(-50%, 0px) scale(1)', opacity: 0.95 },
            { transform: `translate(-50%, ${drift}px) scale(1.06)`, opacity: 0.3 }
          ],
          { duration: 420, easing: 'ease-out' }
        );
        setTimeout(() => r.remove(), 520);
      }

      return;
    }

    // scope payment
    if (scope === 'payment') {
      const fillCandidates = [
        document.getElementById('dashboardProgressFill'),
        document.getElementById('kasirProgressFill'),
        document.getElementById('ledgerProgressFill')
      ].filter(Boolean);

      const indicator = document.querySelector('.inventory-progress .inventory-indicator') || document.querySelector('.inventory-indicator');
      pulseElement(indicator, { times: 1, duration: 220 });

      fillCandidates.forEach(fill => {
        fill.style.boxShadow = '0 0 26px rgba(16, 185, 129, 0.25)';
        fill.animate(
          [
            { filter: 'brightness(1)', transform: 'scaleX(1)' },
            { filter: 'brightness(1.2)', transform: 'scaleX(1.01)' },
            { filter: 'brightness(1)', transform: 'scaleX(1)' }
          ],
          { duration: 420, easing: 'ease-out' }
        );
        setTimeout(() => {
          fill.style.boxShadow = '';
        }, 480);
      });
    }
  }

  function animateProductInventoryImpact({ delta, namaProduk }) {
    // saat ini dashboard belum punya UI inventory per-produk, jadi kita tampilkan efek overlay partikel.
    // nanti kalau kamu mau benar-benar inventory per produk, kita akan tambah markup di dashboard.

    // Dashboard ingin inventory per-produk: buat minimal "bars" di #soldContainer atau #productContainer kalau ada.
    // Namun dataset yang ada di dashboard belum punya UI inventory per produk, jadi kita siapkan placeholder:
    // - tidak akan error jika elemen tidak ada

    const productContainer = document.getElementById('productContainer');
    if (!productContainer) return;

    // cari container inventory-area yang mungkin ada
    let layer = productContainer.querySelector('[data-inventory-layer="products"]');
    if (!layer) {
      layer = document.createElement('div');
      layer.setAttribute('data-inventory-layer', 'products');
      // overlay ringan, tidak mengubah layout
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.pointerEvents = 'none';
      productContainer.style.position = productContainer.style.position || 'relative';
      productContainer.appendChild(layer);
    }

    // efek partikel kecil per mutasi (kaya trading ticker)
    const sign = delta >= 0 ? 1 : -1;
    const count = Math.max(1, Math.min(6, Math.round(Math.abs(delta) / 2)));

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.textContent = sign >= 0 ? '⬆' : '⬇';
      dot.style.position = 'absolute';
      dot.style.left = (30 + Math.random() * 40) + '%';
      dot.style.top = (10 + Math.random() * 80) + '%';
      dot.style.fontSize = '12px';
      dot.style.fontWeight = '900';
      dot.style.opacity = '0.95';
      dot.style.color = sign >= 0 ? '#facc15' : '#fca5a5';
      dot.style.textShadow = '0 0 18px rgba(251,191,36,0.3)';
      dot.style.pointerEvents = 'none';
      layer.appendChild(dot);

      const dx = (sign >= 0 ? 1 : -1) * (10 + Math.random() * 12);
      const dy = (sign >= 0 ? -1 : 1) * (6 + Math.random() * 10);
      dot.animate(
        [
          { transform: 'translate(0px,0px) scale(1)', opacity: 0.95 },
          { transform: `translate(${dx}px,${dy}px) scale(1.12)`, opacity: 0.35 }
        ],
        { duration: 520, easing: 'ease-out' }
      );

      setTimeout(() => dot.remove(), 560);
    }
  }

  window.CandleManager = {
    // deltaStok: masuk(+)/keluar(-)
    applyStockDelta: function (deltaStok, meta = {}) {
      const delta = safeNumber(deltaStok, 0);
      if (!delta) return;

      // Visual trading-like: shake + glide + inventory pulse
      flashInventory(delta, { scope: 'stock' });
      try {
        // trigger a light "trade" sweep without layout shift
        const track = document.getElementById('stockProgressFill');
        if (track) {
          const dir = delta >= 0 ? 1 : -1;
          track.animate(
            [
              { transform: `translateX(0px) scaleX(1)`, filter: 'brightness(1)' },
              { transform: `translateX(${dir * 6}px) scaleX(1.02)`, filter: 'brightness(1.2)' },
              { transform: 'translateX(0px) scaleX(1)', filter: 'brightness(1)' }
            ],
            { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }
          );
        }
      } catch (e) {}

      // Update progress berdasarkan estimasi total dari DOM
      const currentTotal = getStockTotalFromDOMFallback();
      const nextTotal = Math.max(0, currentTotal + delta);
      updateStockProgressByTotal(nextTotal);

      // Broadcast ke tab lain agar ikut animasi
      try {
        localStorage.setItem('inventory_stock_delta', JSON.stringify({ delta, t: Date.now() }));
      } catch (e) {}
    },


    // deltaPayment hanya efek visual
    applyPaymentDelta: function () {
      flashInventory(1, { scope: 'payment' });
      try {
        localStorage.setItem('inventory_payment_delta', JSON.stringify({ t: Date.now() }));
      } catch (e) {}
    },

    // saat halaman baru dibuka
    refreshStockProgressFromProductsTotal: function () {
      updateStockProgressByTotal(getStockTotalFromDOMFallback());
    }
  };
})();

