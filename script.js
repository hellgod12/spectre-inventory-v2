const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    const soldContainer = document.getElementById('soldContainer');
    
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    const { data: members, error: memError } = await supabaseClient
        .from('members')
        .select('id');

    if (prodError) {
        container.innerHTML = `<div class="p-8 text-center text-red-600 text-xs uppercase">>> KESALAHAN_KRITIS: KONEKSI SERVER DITOLAK</div>`;
        return;
    }

    const jumlahMember = members ? members.length : 0;
    document.getElementById('totalMembers').innerText = jumlahMember + " Jiwa";

    if (!products || products.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-red-900/60 text-xs uppercase">>> DATABASE_KOSONG_BELUM_ADA_AMUNISI</div>`;
        soldContainer.innerHTML = `<div class="p-8 text-center text-stone-700 text-xs uppercase">>> MENUNGGU_DATA_TERJUAL</div>`;
        return;
    }

    let totalStock = 0;
    let omsetSimulasi = 0;
    let profitSimulasi = 0;
    let totalTerjualCount = 0;

    // --- HTML UNTUK TABEL STOK GUDANG ---
    let tableHtml = `
        <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
                <tr class="bg-stone-950 text-red-500/70 border-b border-red-950 uppercase tracking-wider text-[10px]">
                    <th class="p-4 font-bold">NAMA_BARANG</th>
                    <th class="p-4 font-bold">SEKTOR_KATEGORI</th>
                    <th class="p-4 font-bold text-center">TINGKAT_STOK</th>
                    <th class="p-4 font-bold">HARGA_MODAL</th>
                    <th class="p-4 font-bold">HARGA_UMUM</th>
                    <th class="p-4 font-bold">HARGA_MEMBER</th>
                    <th class="p-4 font-bold text-center">HANCURKAN_DATA</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-red-950/30 bg-black/40">
    `;

    // --- HTML UNTUK TABEL LOG BARANG TERJUAL ---
    let soldHtml = `
        <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
                <tr class="bg-stone-950 text-rose-500/70 border-b border-red-950 uppercase tracking-wider text-[10px]">
                    <th class="p-4 font-bold">WAKTU_MUTASI</th>
                    <th class="p-4 font-bold">ITEM_TERJUAL</th>
                    <th class="p-4 font-bold">KATEGORI_TARGET</th>
                    <th class="p-4 font-bold text-center">KUANTITAS</th>
                    <th class="p-4 font-bold">TOTAL_DANA_MASUK</th>
                    <th class="p-4 font-bold">STATUS_KASIR</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-red-950/20 bg-black/60">
    `;

    products.forEach((item, index) => {
        const currentStock = parseInt(item.stok || 0);
        totalStock += currentStock;

        // Simulasi hitungan terjual demi memunculkan grafik omset & log terjual di bawah
        const simulasiTerjual = 2; 
        totalTerjualCount += simulasiTerjual;
        
        const totalDanaMasuk = parseFloat(item.harga_jual || 0) * simulasiTerjual;
        omsetSimulasi += totalDanaMasuk;
        profitSimulasi += ((parseFloat(item.harga_jual || 0) - parseFloat(item.harga_modal || 0)) * simulasiTerjual);

        // Pengaturan Badge Kategori Berbahasa Indonesia
        let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 font-bold text-[9px] uppercase">Aksesoris</span>`;
        if (item.kategori === 'Skateboard') {
            katBadge = `<span class="bg-red-950/60 text-red-500 px-2 py-0.5 border border-red-800/50 font-bold text-[9px] uppercase">🛹 PAPAN_SKATE</span>`;
        } else if (item.kategori === 'Perlengkapan') {
            katBadge = `<span class="bg-orange-950/60 text-orange-400 px-2 py-0.5 border border-orange-800/40 font-bold text-[9px] uppercase">🛠️ SPAREPART</span>`;
        } else if (item.kategori === 'Apparel') {
            katBadge = `<span class="bg-zinc-900 text-zinc-400 px-2 py-0.5 border border-zinc-700 font-bold text-[9px] uppercase">👕 APPAREL_BAJU</span>`;
        }

        // Tampilan tingkat kritis stok
        const stokBadge = currentStock <= 5 
            ? `<span class="bg-red-950 text-red-500 border border-red-600 px-2 py-0.5 font-bold text-[10px] animate-pulse">☠️ KRITIS_${currentStock}</span>`
            : `<span class="bg-stone-900 text-slate-300 border border-stone-800 px-2 py-0.5 font-bold text-[10px]">${currentStock} UNIT</span>`;

        // Baris Tabel 1 (Stok)
        tableHtml += `
            <tr class="hover:bg-red-950/10 transition-colors">
                <td class="p-4 font-bold text-white uppercase tracking-wide">${item.nama_barang}</td>
                <td class="p-4">${katBadge}</td>
                <td class="p-4 text-center">${stokBadge}</td>
                <td class="p-4 text-slate-500">Rp ${Number(item.harga_modal).toLocaleString('id-ID')}</td>
                <td class="p-4 text-red-400 font-bold">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
                <td class="p-4 text-rose-400 font-bold">Rp ${Number(item.harga_member).toLocaleString('id-ID')}</td>
                <td class="p-4 text-center">
                    <button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="bg-transparent hover:bg-red-600 hover:text-white text-red-600 border border-red-900 px-2.5 py-1 text-[9px] font-bold uppercase transition-all">
                        HAPUS
                    </button>
                </td>
            </tr>
        `;

        // Baris Tabel 2 (Log Mutasi Terjual)
        soldHtml += `
            <tr class="hover:bg-rose-950/10 transition-colors">
                <td class="p-4 text-slate-600 text-[10px] tracking-tight">BARU_SAJA (LOG_${100 + index})</td>
                <td class="p-4 font-bold text-slate-300 uppercase">${item.nama_barang}</td>
                <td class="p-4">${katBadge}</td>
                <td class="p-4 text-center text-rose-400 font-bold">${simulasiTerjual} PCS</td>
                <td class="p-4 text-emerald-400 font-bold">Rp ${totalDanaMasuk.toLocaleString('id-ID')}</td>
                <td class="p-4"><span class="text-emerald-500 bg-emerald-950/30 border border-emerald-900 text-[9px] px-1.5 py-0.5 font-bold">✓ AMAN_TERPOTONG</span></td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    soldHtml += `</tbody></table>`;
    
    container.innerHTML = tableHtml;
    soldContainer.innerHTML = soldHtml;

    document.getElementById('totalItems').innerText = products.length;
    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalOmset').innerText = 'Rp ' + omsetSimulasi.toLocaleString('id-ID');
    document.getElementById('totalProfit').innerText = 'Rp ' + profitSimulasi.toLocaleString('id-ID');
    document.getElementById('totalSalesCount').innerText = totalTerjualCount + " Barang";
}

async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[PERINGATAN_SISTEM] HANCURKAN "${namaBarang.toUpperCase()}" DARI SERVER SECARA PERMANEN?`);
    if (konfirmasi) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) alert('Gagal: ' + error.message);
        else loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
