const selectProduct = document.getElementById('selectProduct');
const selectUkuran = document.getElementById('selectUkuran');
const boxUkuranSelect = document.getElementById('boxUkuranSelect');
const inputJumlah = document.getElementById('inputJumlah');

// scan-helper.js attaches setupCameraScan to window


function setSelectedProductByBarcode(raw) {
  if (!selectProduct) return false;

  // Recommended universal scan payload (same as barang masuk):
  // NAMA_BARANG|qty|harga_modal|harga_jual|harga_member|kategori
  // Example: T-SHIRT L|10|50000|90000|85000|Apparel

  const text = String(raw || '').trim();
  if (!text) return false;

  // Parse qty if present
  let payloadNama = text;
  let parsedQty = null;

  if (text.includes('|')) {
    const parts = text.split('|').map(s => String(s).trim());
    payloadNama = parts[0] || '';
    if (parts.length >= 2) {
      const q = Number(parts[1]);
      parsedQty = Number.isFinite(q) ? q : null;
    }
  }

  // Support additional formats (legacy):
  // - rawValue = product.id
  // - rawValue = nama_barang (case-insensitive)
  // - rawValue = "id:123" or "kode:XYZ"
  const cleaned = payloadNama.trim();
  const lower = cleaned.toLowerCase();

  let match = null;
  const options = Array.from(selectProduct.options || []);

  // Try by id first (only if scan wasn't using | format)
  if (/^\d+$/.test(cleaned)) {
    match = options.find(o => o.value === cleaned);
  }
  // Try by 'id:NUM'
  if (!match && /^id:\s*\d+$/i.test(cleaned)) {
    const id = cleaned.split(':')[1].trim();
    match = options.find(o => o.value === id);
  }
  // Try by nama_barang text
  if (!match) {
    match = options.find(o => (o.textContent || '').toLowerCase().includes(lower));
  }

  if (!match) return false;

  selectProduct.value = match.value;
  selectProduct.dispatchEvent(new Event('change', { bubbles: true }));

  // Set qty from QR if available
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

