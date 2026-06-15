// Hook up scan UI for inject-stock page (barang.html)

document.addEventListener('DOMContentLoaded', () => {
  const btnScan = document.getElementById('btnScanMasuk');
  const btnStop = document.getElementById('btnStopMasuk');
  const statusEl = document.getElementById('scanMasukStatus');
  const videoEl = document.getElementById('scanMasukVideo');
  const canvasEl = document.getElementById('scanMasukCanvas');

  const namaBarangInput = document.getElementById('nama_barang');
  const stokInput = document.getElementById('stok');
  const hargaModalInput = document.getElementById('harga_modal');
  const hargaJualInput = document.getElementById('harga_jual');
  const hargaMemberInput = document.getElementById('harga_member');
  const kategoriSelect = document.getElementById('kategori');
  const skuInput = document.getElementById('sku');

  if (!btnScan || !videoEl || !canvasEl || !namaBarangInput || !skuInput) return;


  let scanner = null;

  function parseScanPayload(raw) {
    // Supported format (recommended):
    // NAMA_BARANG|qty|harga_modal|harga_jual|harga_member|kategori
    // Examples:
    // T-SHIRT L|10|50000|90000|85000|Apparel
    // SPECTRE DECK|3|120000|200000|190000|Skateboard

    // Optional simpler formats (fallback):
    // - NAMA_BARANG|qty|harga_modal|harga_jual|harga_member
    // - NAMA_BARANG (no qty/price)

    const text = String(raw || '').trim();
    if (!text) return null;

    const parts = text.split('|').map(s => String(s).trim()).filter(Boolean);
    if (parts.length === 0) return null;

    // Format target: NAMA_BARANG|qty|harga_modal|harga_jual|harga_member|kategori
    // Jadi parts[0] = nama, parts[1] = qty, ...
    const nama = parts[0];
    const qty = parts[1] != null ? Number(parts[1]) : null;

    const hargaModal = parts[2] != null ? Number(parts[2]) : null;
    const hargaJual = parts[3] != null ? Number(parts[3]) : null;
    const hargaMember = parts[4] != null ? Number(parts[4]) : null;
    const kategori = parts[5] != null ? parts[5] : null;

    return {
      nama,
      qty: Number.isFinite(qty) ? qty : null,
      hargaModal: Number.isFinite(hargaModal) ? hargaModal : null,
      hargaJual: Number.isFinite(hargaJual) ? hargaJual : null,
      hargaMember: Number.isFinite(hargaMember) ? hargaMember : null,
      kategori
    };
  }

  const applyRawToForm = (raw) => {
    const payload = parseScanPayload(raw);
    if (!payload) return false;

    // payload untuk scan masuk format: NAMA_BARANG|qty|harga_modal|harga_jual|harga_member|kategori
    const namaUpper = String(payload.nama || '').toUpperCase();
    namaBarangInput.value = namaUpper;

    // SKU tidak di-generate di sini, akan di-generate otomatis saat user memilih kategori
    // di barang.js menggunakan fungsi autoGenerateSku()
    if (skuInput) skuInput.value = '';

    if (payload.qty != null && stokInput) stokInput.value = payload.qty;
    if (payload.hargaModal != null && hargaModalInput) hargaModalInput.value = payload.hargaModal;
    if (payload.hargaJual != null && hargaJualInput) hargaJualInput.value = payload.hargaJual;
    if (payload.hargaMember != null && hargaMemberInput) hargaMemberInput.value = payload.hargaMember;


    // kategori bisa kita set dari payload kalau ada
    // kategori di Supabase/form wajib salah satu: Apparel | Skateboard | Perlengkapan
    if (payload.kategori && kategoriSelect) {
      const val = String(payload.kategori).trim();
      const normalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
      // allow exact match first
      if (Array.from(kategoriSelect.options || []).some(o => o.value === val)) {
        kategoriSelect.value = val;
      } else if (Array.from(kategoriSelect.options || []).some(o => o.value === normalized)) {
        kategoriSelect.value = normalized;
      }
      // trigger change for size options dan auto-generate SKU
      kategoriSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return true;
  };

  btnScan.addEventListener('click', async () => {
    btnScan.disabled = true;
    if (statusEl) statusEl.innerText = 'MENGAKTIFKAN_KAMERA...';

    try {
      scanner?.stop?.();
      scanner = setupCameraScan({
        videoEl,
        canvasEl,
        onDecoded: (raw) => {
          const ok = applyRawToForm(raw);
          if (statusEl) statusEl.innerText = ok ? 'TERISI // SKU & DATA BARANG' : 'TIDAK COCOK';
        },
        onError: (msg) => {
          if (statusEl) statusEl.innerText = 'ERROR: ' + msg;
          btnScan.disabled = false;
        }
      });

      await scanner.start();
      btnScan.disabled = false;
    } catch (e) {
      if (statusEl) statusEl.innerText = 'ERROR: ' + (e?.message || e);
      btnScan.disabled = false;
    }
  });

  btnStop?.addEventListener('click', () => {
    scanner?.stop?.();
    if (statusEl) statusEl.innerText = 'SCAN_DIHENTIKAN';
    btnScan.disabled = false;
  });
});

