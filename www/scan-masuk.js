const productInput = document.getElementById('nama_barang');
const kategoriEl = document.getElementById('kategori');
const stokEl = document.getElementById('stok');
const hargaModalEl = document.getElementById('harga_modal');
const hargaJualEl = document.getElementById('harga_jual');
const hargaMemberEl = document.getElementById('harga_member');
const skuInput = document.getElementById('sku');
const stockEntryStatus = document.getElementById('stockEntryStatus');


function setInputsFromBarcode(raw) {
  const cleaned = String(raw || '').trim();
  if (!cleaned) return false;

  // Target: kalau yang discan adalah ITEM_IDENTIFIER saja,
  // SKU tetap ditampilkan otomatis dengan pola turunan.
  // Pola: ambil huruf/angka dari item_identifier, lalu format jadi:
  //   SKU-<2 huruf pertama dari kata pertama><2 huruf pertama kata terakhir><angka hash 3 digit>
  // Contoh: "SPECTRE SLICK DECK" => SKU-SPDE-123

  let itemIdentifier = cleaned;

  // Jika raw kebetulan formatnya ada delimiter, ambil bagian pertama sebagai item identifier
  // (contoh: "ITEM_IDENTIFIER|sku" atau "ITEM_IDENTIFIER|qty|...")
  itemIdentifier = itemIdentifier.split('|')[0].trim();

  if (productInput) productInput.value = itemIdentifier.toUpperCase();

  if (skuInput) {
    const words = String(itemIdentifier)
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const first = words[0] || '';
    const last = words[words.length - 1] || first;

    const a = (first.match(/[A-Z0-9]/g) || []).slice(0, 2).join('');
    const b = (last.match(/[A-Z0-9]/g) || []).slice(0, 2).join('');

    // hash sederhana agar tetap stabil untuk itemIdentifier
    let hash = 0;
    const str = String(itemIdentifier).toUpperCase();
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 1000;

    const sku = `SKU-${a}${b}-${String(hash).padStart(3, '0')}`;
    skuInput.value = sku;
  }

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

