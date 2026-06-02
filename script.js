const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    
    // 1. Ambil data produk (Stok & Nilai Aset)
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    // 2. Ambil data member (Membaca jumlah baris dari tabel members Anda di Supabase)
    const { data: members, error: memError } = await supabaseClient
        .from('members')
        .select('id');

    if (prodError) {
        container.innerHTML = `<div class="p-8 text-center text-red-500 mono text-xs uppercase">>> SERVER_ERROR: GAGAL AMBIL DATA</div>`;
        return;
    }

    // Set jumlah member secara dinamis dari database Supabase Anda
    const jumlahMember = members ? members.length : 0;
    document.getElementById('totalMembers').innerText = jumlahMember + " User";

    if (!products || products.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-600 mono text-xs uppercase">>> DATA_GUDANG_KOSONG</div>`;
        return;
    }

    let totalStock = 0;
    let omsetSimulasi = 0;
    let profitSimulasi = 0;
    let totalTerjualCount = 0;

    let tableHtml = `
        <table class="w-full text-left border-collapse text-xs mono whitespace-nowrap">
            <thead>
                <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    <th class="p-4 font-bold">Nama Item</th>
                    <th class="p-4 font-bold text-center">Stok Gudang</th>
                    <th class="p-4 font-bold">Harga Modal</th>
                    <th class="p-4 font-bold">Harga Jual</th>
                    <th class="p-4 font-bold">Harga Member</th>
                    <th class="p-4 font-bold text-center">Otoritas</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/60">
    `;

    products.forEach(item => {
        const currentStock = parseInt(item.stok || 0);
        totalStock += currentStock;

        // Simulasi Logika Finansial Dashboard (Berdasarkan perputaran barang)
        // Jika Anda ingin pencatatan nota real-time 100%, Anda bisa membuat tabel 'sales_logs' terpisah di masa depan.
        // Untuk sekarang, kita hitung performa kapital barang terdaftar:
        const simulasiTerjual = 3; // Contoh hitungan perputaran barang sampel dummy pasar
        totalTerjualCount += simulasiTerjual;
        omsetSimulasi += (parseFloat(item.harga_jual || 0) * simulasiTerjual);
        profitSimulasi += ((parseFloat(item.harga_jual || 0) - parseFloat(item.harga_modal || 0)) * simulasiTerjual);

        const stokBadge = currentStock <= 5 
            ? `<span class="bg-red-950/80 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold text-[10px]">⚠️ RESTOCK_${currentStock}</span>`
            : `<span class="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-bold text-[10px]">${currentStock} UNIT</span>`;

        tableHtml += `
            <tr class="hover:bg-slate-900/40 transition-colors">
                <td class="p-4 font-bold text-white uppercase tracking-wide">${item.nama_barang}</td>
                <td class="p-4 text-center">${stokBadge}</td>
                <td class="p-4 text-slate-400">Rp ${Number(item.harga_modal).toLocaleString('id-ID')}</td>
                <td class="p-4 text-cyan-400 font-bold">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
                <td class="p-4 text-purple-400 font-bold">Rp ${Number(item.harga_member).toLocaleString('id-ID')}</td>
                <td class="p-4 text-center">
                    <button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

    // Distribusi nilai matematika finansial ke widget grid atas
    document.getElementById('totalItems').innerText = products.length;
    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalOmset').innerText = 'Rp ' + omsetSimulasi.toLocaleString('id-ID');
    document.getElementById('totalProfit').innerText = 'Rp ' + profitSimulasi.toLocaleString('id-ID');
    document.getElementById('totalSalesCount').innerText = totalTerjualCount + " Transaksi";
}

async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[SYSTEM WARNING] Hapus "${namaBarang.toUpperCase()}" dari cloud database secara permanen?`);
    if (konfirmasi) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) alert('Gagal: ' + error.message);
        else loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
