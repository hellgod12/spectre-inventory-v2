const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    const soldContainer = document.getElementById('soldContainer');
    
    // Tarik data produk aktif
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    // Tarik data member
    const { data: members } = await supabaseClient.from('members').select('id');
    document.getElementById('totalMembers').innerText = (members ? members.length : 0) + " Jiwa";

    // Tarik data RIWAYAT PENJUALAN ASLI
    const { data: salesHistory, error: salesError } = await supabaseClient
        .from('sales_history')
        .select('*')
        .order('created_at', { ascending: false });

    if (prodError || salesError) {
        container.innerHTML = `<div class="p-8 text-center text-red-600 text-xs uppercase">>> KESALAHAN SERVER DATA</div>`;
        return;
    }

    // --- HITUNG MATRIKS FINANSIAL ASLI ---
    let totalStock = 0;
    let omsetAsli = 0;
    let profitAsli = 0;
    let totalTerjualCount = 0;

    // Hitung sisa stok di gudang saat ini
    if (products) {
        products.forEach(item => { totalStock += parseInt(item.stok || 0); });
        document.getElementById('totalItems').innerText = products.length;
    }

    // Hitung total penjualan dari tabel riwayat
    if (salesHistory) {
        salesHistory.forEach(sale => {
            omsetAsli += parseFloat(sale.total_harga || 0);
            totalTerjualCount += parseInt(sale.jumlah || 0);
            
            // Cari kecocokan modal untuk hitung profit bersih asli
            const dataBarang = products ? products.find(p => p.nama_barang === sale.nama_barang) : null;
            const modalSatuan = dataBarang ? parseFloat(dataBarang.harga_modal || 0) : 0;
            const totalModal = modalSatuan * parseInt(sale.jumlah || 0);
            profitAsli += (parseFloat(sale.total_harga || 0) - totalModal);
        });
    }

    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalOmset').innerText = 'Rp ' + omsetAsli.toLocaleString('id-ID');
    document.getElementById('totalProfit').innerText = 'Rp ' + profitAsli.toLocaleString('id-ID');
    document.getElementById('totalSalesCount').innerText = totalTerjualCount + " Barang";

    // --- RENDERING TABEL 1: STOK GUDANG ---
    if (!products || products.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-red-900/60 text-xs uppercase">>> GUDANG_KOSONG</div>`;
    } else {
        let tableHtml = `
            <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                    <tr class="bg-stone-950 text-red-500/70 border-b border-red-950 uppercase tracking-wider text-[10px]">
                        <th class="p-4 font-bold">NAMA_BARANG</th>
                        <th class="p-4 font-bold">SEKTOR_KATEGORI</th>
                        <th class="p-4 font-bold">UKURAN</th>
                        <th class="p-4 font-bold text-center">TINGKAT_STOK</th>
                        <th class="p-4 font-bold">HARGA_MODAL</th>
                        <th class="p-4 font-bold">HARGA_UMUM</th>
                        <th class="p-4 font-bold">HARGA_MEMBER</th>
                        <th class="p-4 font-bold text-center">HANCURKAN</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-red-950/30 bg-black/40">
        `;

        products.forEach(item => {
            let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 font-bold text-[9px] uppercase">${item.kategori || 'Apparel'}</span>`;
            if (item.kategori === 'Skateboard') katBadge = `<span class="bg-red-950/60 text-red-500 px-2 py-0.5 border border-red-800/50 font-bold text-[9px] uppercase">🛹 PAPAN_SKATE</span>`;
            if (item.kategori === 'Perlengkapan') katBadge = `<span class="bg-zinc-900 text-zinc-400 px-2 py-0.5 border border-zinc-700 font-bold text-[9px] uppercase">🛠️ HARDWARE</span>`;
            
            const ukuranBadge = item.ukuran 
                ? `<span class="bg-stone-900 text-yellow-500 border border-yellow-900/50 px-2 py-0.5 font-bold text-[10px] uppercase">${item.ukuran}</span>`
                : `<span class="text-slate-700 text-[9px]">—</span>`;

            const currentStock = parseInt(item.stok || 0);
            const stokBadge = currentStock <= 5 
                ? `<span class="bg-red-950 text-red-500 border border-red-600 px-2 py-0.5 font-bold text-[10px] animate-pulse">☠️ KRITIS_${currentStock}</span>`
                : `<span class="bg-stone-900 text-slate-300 border border-stone-800 px-2 py-0.5 font-bold text-[10px]">${currentStock} UNIT</span>`;

            tableHtml += `
                <tr class="hover:bg-red-950/10 transition-colors">
                    <td class="p-4 font-bold text-white uppercase tracking-wide">${item.nama_barang}</td>
                    <td class="p-4">${katBadge}</td>
                    <td class="p-4">${ukuranBadge}</td>
                    <td class="p-4 text-center">${stokBadge}</td>
                    <td class="p-4 text-slate-500">Rp ${Number(item.harga_modal).toLocaleString('id-ID')}</td>
                    <td class="p-4 text-red-400 font-bold">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
                    <td class="p-4 text-rose-400 font-bold">Rp ${Number(item.harga_member).toLocaleString('id-ID')}</td>
                    <td class="p-4 text-center">
                        <button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="bg-transparent hover:bg-red-600 hover:text-white text-red-600 border border-red-900 px-2.5 py-1 text-[9px] font-bold uppercase transition-all">HAPUS</button>
                    </td>
                </tr>
            `;
        });
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
    }

    // --- RENDERING TABEL 2: RIWAYAT PENJUALAN NYATA + TANGGAL & DATA ORANG ---
    if (!salesHistory || salesHistory.length === 0) {
        soldContainer.innerHTML = `<div class="p-8 text-center text-stone-700 text-xs uppercase">>> BELUM ADA TRANSAKSI MASUK KASIR</div>`;
    } else {
        let soldHtml = `
            <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                    <tr class="bg-stone-950 text-rose-500/70 border-b border-red-950 uppercase tracking-wider text-[10px]">
                        <th class="p-4 font-bold">WAKTU_MUTASI (TANGGAL/JAM)</th>
                        <th class="p-4 font-bold">ITEM_TERJUAL</th>
                        <th class="p-4 font-bold">STRUKTUR_ORANG</th>
                        <th class="p-4 font-bold text-center">KUANTITAS</th>
                        <th class="p-4 font-bold">TOTAL_DANA_MASUK</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-red-950/20 bg-black/60">
        `;

        salesHistory.forEach(sale => {
            // Memformat data mentah tanggal waktu dari Supabase agar enak dibaca manusia
            const dateObj = new Date(sale.created_at);
            const opsiFormat = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
            const tanggalLokalan = dateObj.toLocaleDateString('id-ID', opsiFormat).replace(',', ' //');

            const orangBadge = sale.tipe_pembeli === 'Member'
                ? `<span class="bg-purple-950 text-purple-400 border border-purple-800 text-[10px] px-2 py-0.5 font-bold">👤 SOUL_MEMBER</span>`
                : `<span class="bg-zinc-900 text-zinc-400 border border-zinc-700 text-[10px] px-2 py-0.5 font-bold">👤 TARGET_UMUM</span>`;

            soldHtml += `
                <tr class="hover:bg-rose-950/10 transition-colors">
                    <td class="p-4 text-red-500 font-bold tracking-tight">${tanggalLokalan} WIB</td>
                    <td class="p-4 font-bold text-white uppercase">${sale.nama_barang}</td>
                    <td class="p-4">${orangBadge}</td>
                    <td class="p-4 text-center text-rose-400 font-bold">${sale.jumlah} PCS</td>
                    <td class="p-4 text-emerald-400 font-bold">Rp ${Number(sale.total_harga).toLocaleString('id-ID')}</td>
                </tr>
            `;
        });
        soldHtml += `</tbody></table>`;
        soldContainer.innerHTML = soldHtml;
    }
}

async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[PERINGATAN] HANCURKAN "${namaBarang.toUpperCase()}" PERMANEN?`);
    if (konfirmasi) {
        await supabaseClient.from('products').delete().eq('id', id);
        loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
