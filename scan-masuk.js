const productInput = document.getElementById('nama_barang');
const kategoriEl = document.getElementById('kategori');
const stokEl = document.getElementById('stok');
const hargaModalEl = document.getElementById('harga_modal');
const hargaJualEl = document.getElementById('harga_jual');
const hargaMemberEl = document.getElementById('harga_member');
const stockEntryStatus = document.getElementById('stockEntryStatus');

function setInputsFromBarcode(raw) {
  const cleaned = String(raw || '').trim();
  if (!cleaned) return false;

  // Supported raw formats:
  // - nama_barang text
  // - "id:123" (will set nama_barang only if exact match exists in local dropdown; we don't have it)
  // For masuk page, we only can reliably set nama_barang from QR/barcode.

  if (productInput) productInput.value = cleaned.toUpperCase();
  return true;
}

function attachScanUIHandlers() {
  const btnScan = document.getElementById('btnScanMasuk');
  const btnStop = document.getElementById('btnStopMasuk');
  const scanStatus = document.getElementById('scanMasukStatus');
  const videoEl = document.getElementById('scanMasukVideo');
  const canvasEl = document.getElementById('scanMasukCanvas');

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
          const ok = setInputsFromBarcode(raw);
          if (scanStatus) scanStatus.innerText = ok ? 'TERISI // NAMA BARANG' : 'TIDAK COCOK';
          if (stockEntryStatus) {
            stockEntryStatus.innerHTML = `
              <strong class="block text-emerald-300 mb-2">SCAN BERHASIL</strong>
              <span>${String(raw || '').toUpperCase()} berhasil diisi ke input nama_barang.</span>
            `;
          }
        },
        onError: (msg) => {
          if (scanStatus) scanStatus.innerText = 'ERROR: ' + msg;
          btnScan.disabled = false;
        }
      });

      await scanner.start();
      btnScan.disabled = false;
    } catch (e) {
      if (scanStatus) scanStatus.innerText = 'ERROR: ' + (e?.message || e);
      btnScan.disabled = false;
    }
  });

  btnStop?.addEventListener('click', () => {
    scanner?.stop?.();
    if (scanStatus) scanStatus.innerText = 'SCAN_DIHENTIKAN';
    btnScan.disabled = false;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachScanUIHandlers();
});

