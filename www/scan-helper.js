function setupCameraScan({ videoEl, canvasEl, onDecoded, onError, facingMode = 'environment', intervalMs = 350 } = {}) {
  if (!videoEl || !canvasEl) throw new Error('setupCameraScan: videoEl dan canvasEl wajib');

  let stream = null;
  let timer = null;

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    try {
      const ctx = canvasEl.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    } catch (_) {}
  }

  async function start() {
    // Prefer BarcodeDetector jika browser mendukung.
    // Kalau tidak ada, user tetap bisa pakai fallback input manual.
    const BarcodeDetectorCtor = window.BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia) {
      onError?.('Browser tidak mendukung akses kamera (getUserMedia tidak tersedia).');
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });

      videoEl.srcObject = stream;
      await videoEl.play();

      const canDetect = typeof BarcodeDetectorCtor === 'function';
      if (!canDetect) {
        onError?.('Browser ini tidak mendukung BarcodeDetector. Gunakan input manual / QR custom yang didukung aplikasi pihak ketiga.');
        return;
      }

      const detector = new BarcodeDetectorCtor({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39'] });

      // Pastikan ukuran canvas mengikuti video.
      const syncCanvasSize = () => {
        const w = videoEl.videoWidth || 640;
        const h = videoEl.videoHeight || 480;
        canvasEl.width = w;
        canvasEl.height = h;
      };

      syncCanvasSize();
      window.addEventListener('resize', syncCanvasSize);

      timer = setInterval(async () => {
        try {
          // Ambil frame
          syncCanvasSize();
          const ctx = canvasEl.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

          const barcodes = await detector.detect(canvasEl);
          if (!barcodes || barcodes.length === 0) return;

          const raw = barcodes[0].rawValue;
          if (!raw) return;

          onDecoded?.(raw);
          // stop setelah sukses
          stop();
        } catch (err) {
          // Non-fatal: deteksi bisa gagal beberapa frame
        }
      }, intervalMs);

    } catch (err) {
      onError?.(err?.message || 'Gagal memulai kamera. Pastikan izin kamera aktif.');
      stop();
    }
  }

  return { start, stop };
}



