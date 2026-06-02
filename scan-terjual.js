const selectProduct = document.getElementById('selectProduct');
const selectUkuran = document.getElementById('selectUkuran');
const boxUkuranSelect = document.getElementById('boxUkuranSelect');
const inputJumlah = document.getElementById('inputJumlah');

// scan-helper.js attaches setupCameraScan to window


function setSelectedProductByBarcode(raw) {
  if (!selectProduct) return false;

  const text = String(raw || '').replace(/\u0000/g, '').trim();
  if (!text) return false;

  const options = Array.from(selectProduct.options || []);
  if (!options.length) return false;

  // Parse qty if present
  let parsedQty = null;
  if (text.includes('|')) {
    // payload: NAMA_BARANG|qty|...
    const parts = text.split('|').map(s => String(s).trim());
    if (parts.length >= 2) {
      const q = Number(parts[1]);
      parsedQty = Number.isFinite(q) ? q : null;
    }
  } else {
    // support: qty=10 or QTY:10
    const mQty = text.match(/(?:qty|jumlah)\s*[:=]\s*(\d+)/i);
    if (mQty && mQty[1]) {
      const q = Number(mQty[1]);
      parsedQty = Number.isFinite(q) ? q : null;
    }
  }

  // Normalize for matching
  const cleaned = text.trim();
  const lower = cleaned.toLowerCase();

  // More tolerant normalization (barcode generators often add brackets/spaces)
  const normalized = cleaned
    .replace(/\[|\]|\(|\)|\{|\}|</g, ' ')
    .replace(/\-|_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedLower = normalized.toLowerCase();

  // Extract potential identifiers
  const numericOnly = normalized.match(/^\d+$/) ? normalized : null;
  const idMatch = normalized.match(/^id\s*[:=]\s*(\d+)$/i) || normalized.match(/^productid\s*[:=]\s*(\d+)$/i);
  const id = idMatch?.[1] || null;

  const kodeMatch = normalized.match(/^(?:kode|sku)\s*[:=]\s*([^|]+)$/i);
  const kode = kodeMatch?.[1] ? String(kodeMatch[1]).trim() : null;

  // Extract potential last alphanumeric segment (NOT used as matching id to avoid ngaco)
  // (We only match by id/productid/kode/sku or by name substring.)
  const tokens = normalized.split(/[^a-zA-Z0-9]+/).filter(Boolean);

  // Try to match in priority order
  let match = null;




  // 1) by numeric value => option.value
  if (!match && numericOnly) {
    match = options.find(o => String(o.value) === numericOnly);
  }

  // 2) by id=123 => option.value
  if (!match && id) {
    match = options.find(o => String(o.value) === String(id));
  }

  // 3) by kode/SKU matching option.value (if option.value is kode)
  if (!match && kode) {
    match = options.find(o => String(o.value).toLowerCase() === String(kode).toLowerCase());
    if (!match) {
      // or match within option text
      match = options.find(o => (o.textContent || '').toLowerCase() === String(kode).toLowerCase() || (o.textContent || '').toLowerCase().includes(String(kode).toLowerCase()));
    }
  }

  // 4) fallback: if payload is "NAMA_BARANG|..." use first segment
  if (!match && cleaned.includes('|')) {
    const first = cleaned.split('|')[0]?.trim() || '';
    const firstLower = first.toLowerCase();
    if (firstLower) {
      match = options.find(o => (o.textContent || '').toLowerCase().includes(firstLower));
    }
  }

  // 5) broad fallback: try exact-ish match on option text
  if (!match) {
    match = options.find(o => (o.textContent || '').toLowerCase().includes(lower));
  }

  if (!match) return false;

  selectProduct.value = match.value;
  selectProduct.dispatchEvent(new Event('change', { bubbles: true }));

  // qty from QR
  if (parsedQty != null && inputJumlah) {
    const qInt = parseInt(parsedQty, 10);
    if (Number.isFinite(qInt) && qInt > 0) {
      inputJumlah.value = String(qInt);
      inputJumlah.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  return true;
}


function attachScanUIHandlers() {
  const btnScan = document.getElementById('btnScanTerjual');
  const btnStop = document.getElementById('btnStopTerjual');
  const scanStatus = document.getElementById('scanTerjualStatus');
  const videoEl = document.getElementById('scanTerjualVideo');
  const canvasEl = document.getElementById('scanTerjualCanvas');

  if (!btnScan || !videoEl || !canvasEl) return;

  let scanner = null;

  btnScan.addEventListener('click', async () => {
    if (scanStatus) scanStatus.innerText = 'MENGAKTIFKAN_KAMERA...';
    btnScan.disabled = true;

    try {
      scanner?.stop?.();

      scanner = setupCameraScan({
        videoEl,
        canvasEl,
        onDecoded: async (raw) => {
          if (scanStatus) scanStatus.innerText = `DETEKSI: ${raw}`;
          const ok = setSelectedProductByBarcode(raw);
          if (scanStatus) scanStatus.innerText = ok ? 'TERKUNCI // PRODUK TERDAPAT' : 'TIDAK COCOK // PRODUK TIDAK DITEMUKAN';

          // stop is handled by helper
          btnScan.disabled = false;
        },
        onError: (msg) => {
          if (scanStatus) scanStatus.innerText = 'ERROR: ' + msg;
          btnScan.disabled = false;
        }
      });

      await scanner.start();
    } catch (e) {
      if (scanStatus) scanStatus.innerText = 'ERROR: ' + (e?.message || e);
      btnScan.disabled = false;
    }
  });

  btnStop.addEventListener('click', () => {
    scanner?.stop?.();
    if (scanStatus) scanStatus.innerText = 'SCAN_DIHENTIKAN';
    btnScan.disabled = false;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachScanUIHandlers();
});

