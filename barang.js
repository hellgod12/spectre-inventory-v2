<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPECTRE - Tambah Barang</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        input {
            width: 100%; padding: 12px; background: #334155; border: 1px solid #475569; 
            border-radius: 8px; color: white; font-family: inherit; box-sizing: border-box; transition: 0.3s;
        }
        input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #cbd5e1; }
        .form-group { margin-bottom: 20px; }
    </style>
</head>
<body style="font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px;">

    <div style="max-width: 600px; margin: 0 auto;">
        <a href="index.html" style="text-decoration: none; color: #94a3b8; font-size: 14px; display: inline-flex; align-items: center; margin-bottom: 24px; transition: 0.2s;" onmouseover="this.style.color='#f8fafc'" onmouseout="this.style.color='#94a3b8'">
            ← Kembali ke Dashboard
        </a>

        <div style="background: #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);">
            <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 22px; font-weight: 700;">Tambah Produk Baru</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 32px;">Data yang diinput akan langsung tersimpan ke tabel Supabase.</p>

            <form id="productForm">
                <div class="form-group">
                    <label for="nama_barang">Nama Produk / Barang</label>
                    <input type="text" id="nama_barang" placeholder="Contoh: Sepatu Spectre v1" required>
                </div>

                <div class="form-group">
                    <label for="stok">Jumlah Stok Awal</label>
                    <input type="number" id="stok" placeholder="0" required>
                </div>

                <div class="form-group">
                    <label for="harga_modal">Harga Modal (IDR)</label>
                    <input type="number" id="harga_modal" placeholder="Rp 0" required>
                </div>

                <div class="form-group">
                    <label for="harga_jual">Harga Jual Umum (IDR)</label>
                    <input type="number" id="harga_jual" placeholder="Rp 0" required>
                </div>

                <div class="form-group">
                    <label for="harga_member">Harga Khusus Member (IDR)</label>
                    <input type="number" id="harga_member" placeholder="Rp 0" required>
                </div>

                <button type="submit" id="btnSimpan" style="width: 100%; background: #10b981; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 600; font-size: 15px; cursor: pointer; transition: 0.3s; margin-top: 10px;">
                    Simpan ke Database
                </button>
            </form>
        </div>
    </div>

    <script src="barang.js"></script>
</body>
</html>
