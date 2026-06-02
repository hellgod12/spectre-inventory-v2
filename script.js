// Konfigurasi Supabase Anda (Berdasarkan gambar_1.png)
const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
// GANTI DENGAN ANON KEY ANDA SENDIRI
const SUPABASE_ANON_KEY = 'MASUKKAN_ANON_KEY_SUPABASE_ANDA';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    
    // Ambil data produk
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<p style="color: #ef4444;">Error: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<p style="color: #94a3b8; text-align: center; padding: 20px;">Belum ada produk terdaftar. Silakan tambah produk baru.</p>`;
        return;
    }

    // Variabel untuk menghitung statistik widget dashboard
    let totalStock = 0;
    let totalAsset = 0;

    // Buat element Table dengan CSS styling modern langsung di JS agar rapi
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
                <tr style="border-bottom: 2px solid #334155; color: #94a3b8;">
                    <th style="padding: 16px 12px;">Nama Barang</th>
                    <th style="padding: 16px 12px; text-align: center;">Stok</th>
                    <th style="padding: 16px 12px;">Harga Modal</th>
                    <th style="padding: 16px 12px;">Harga Jual</th>
                    <th style="padding: 16px 12px;">Harga Member</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        // Tambahkan ke kalkulasi widget
        totalStock += parseInt(item.stok || 0);
        totalAsset += parseFloat(item.harga_modal || 0) * parseInt(item.stok || 0);

        tableHtml += `
            <tr style="border-bottom: 1px solid #334155; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#334155'" onmouseout="this.style.backgroundColor='transparent'">
                <td style="padding: 16px 12px; font-weight: 600; color: #f8fafc;">${item.nama_barang}</td>
                <td style="padding: 16px 12px; text-align: center;"><span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 10px; border-radius: 20px; font-weight: 600;">${item.stok}</span></td>
                <td style="padding: 16px 12px; color: #cbd5e1;">Rp ${Number(item.harga_modal).toLocaleString('id-ID')}</td>
                <td style="padding: 16px 12px; color: #38bdf8; font-weight: 600;">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
                <td style="padding: 16px 12px; color: #a78bfa;">Rp ${Number(item.harga_member).toLocaleString('id-ID')}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

    // Masukkan data hasil perhitungan ke widget dashboard luar
    document.getElementById('totalItems').innerText = data.length;
    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalAsset').innerText = 'Rp ' + totalAsset.toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', loadDashboard);
