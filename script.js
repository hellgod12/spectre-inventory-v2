const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatCurrency(value) {
    return 'Rp ' + Number(value).toLocaleString('id-ID');
}

function loadLocalPayments() {
    try {
        return JSON.parse(localStorage.getItem('payments') || '[]');
    } catch (error) {
        return [];
    }
}

function normalizePayments(payments) {
    return (payments || []).map(p => ({
        ...p,
        created_at: p.created_at || p.createdAt || new Date().toISOString()
    }));
}

function updateDashboardProgress(payments = []) {
    const fill = document.getElementById('dashboardProgressFill');
    const progressText = document.getElementById('dashboardProgressText');
    const progressSub = document.getElementById('dashboardProgressSub');
    if (!fill || !progressText || !progressSub) return;

    const total = payments.length;
    const paid = payments.filter(p => p.status === 'Sudah Bayar').length;
    const unpaid = total - paid;
    const percent = total === 0 ? 0 : Math.round((paid / total) * 100);

    fill.style.width = `${percent}%`;
    progressText.innerText = `${percent}% dikonfirmasi — neraka rekening semakin mendekat`;
    progressSub.innerText = total === 0
        ? 'Belum ada data pembayaran'
        : `${paid} Lunas • ${unpaid} Belum Bayar • ${total} total order`;
}

async function loadPayments() {
    const paymentsContainer = document.getElementById('paymentsContainer');
    if (!paymentsContainer) return;

    let payments = [];
    let supabaseError = null;

    try {
        const { data, error } = await supabaseClient
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) supabaseError = error;
        else payments = normalizePayments(data);
    } catch (error) {
        supabaseError = error;
    }

    const localPayments = normalizePayments(loadLocalPayments());
    if (localPayments.length > 0) {
        const merged = new Map();
        [...localPayments, ...payments].forEach(payment => {
            if (payment && payment.id) merged.set(payment.id, payment);
        });
        payments = Array.from(merged.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if ((!payments || payments.length === 0) && supabaseError) {
        updateDashboardProgress([]);
        paymentsContainer.innerHTML = `<div class="p-8 text-center text-red-500 text-xs uppercase">>> Gagal memuat pembayaran</div>`;
        return;
    }

    if (!payments || payments.length === 0) {
        updateDashboardProgress([]);
        paymentsContainer.innerHTML = `<div class="p-8 text-center text-slate-500 text-xs uppercase">>> Belum ada pembayaran</div>`;
        return;
    }

    let html = `
        <table class="w-full text-left border-collapse text-xs">
            <thead>
                <tr class="bg-stone-950 text-red-500/70 uppercase text-[10px]">
                    <th class="p-3 font-bold">PEMBELI</th>
                    <th class="p-3 font-bold">PRODUK</th>
                    <th class="p-3 font-bold text-center">JUMLAH</th>
                    <th class="p-3 font-bold">TOTAL</th>
                    <th class="p-3 font-bold">METODE</th>
                    <th class="p-3 font-bold">STATUS</th>
                    <th class="p-3 font-bold">AKSI</th>
                </tr>
            </thead>
            <tbody class="bg-black/60 divide-y divide-red-950/20">
    `;

    payments.forEach(payment => {
        const statusClass = payment.status === 'Belum Bayar' ? 'status-belumbayar' : 'status-sudahbayar';
        html += `
            <tr class="hover:bg-red-950/10 transition-colors">
                <td class="p-3 font-bold">${payment.buyer}</td>
                <td class="p-3">${payment.product}</td>
                <td class="p-3 text-center">${payment.jumlah}</td>
                <td class="p-3">${formatCurrency(payment.total_harga)}</td>
                <td class="p-3">${payment.method}</td>
                <td class="p-3"><span class="badge ${statusClass}">${payment.status}</span></td>
                <td class="p-3 text-center">
                    ${payment.status === 'Belum Bayar' ? `<button onclick="confirmPayment('${payment.id}')" class="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded text-[10px] font-bold uppercase">Konfirmasi</button>` : `-`}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    paymentsContainer.innerHTML = html;
    updateDashboardProgress(payments);
}

async function confirmPayment(id) {
    const { error } = await supabaseClient
        .from('payments')
        .update({ status: 'Sudah Bayar', confirmed_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        const localPayments = loadLocalPayments();
        const index = localPayments.findIndex(p => p.id === id);
        if (index !== -1) {
            localPayments[index].status = 'Sudah Bayar';
            localPayments[index].confirmed_at = new Date().toISOString();
            localStorage.setItem('payments', JSON.stringify(localPayments));
            await loadPayments();
            return;
        }

        alert('Gagal konfirmasi pembayaran: ' + error.message);
        return;
    }

    await loadPayments();
}

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

    // Tarik data pengeluaran
    const { data: expenses } = await supabaseClient.from('expenses').select('*');
    let totalExpenses = 0;
    if (expenses) {
        totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.nominal || 0)), 0);
    }
    const profitBersih = profitAsli - totalExpenses;

    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalOmset').innerText = 'Rp ' + omsetAsli.toLocaleString('id-ID');
    document.getElementById('totalProfit').innerText = 'Rp ' + profitAsli.toLocaleString('id-ID');
    document.getElementById('totalExpenses').innerText = 'Rp ' + totalExpenses.toLocaleString('id-ID');
    document.getElementById('netProfit').innerText = 'Rp ' + profitBersih.toLocaleString('id-ID');
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

    await loadPayments();
    await loadExpenses();
}

async function loadExpenses() {
    const expenseContainer = document.getElementById('expenseContainer');
    if (!expenseContainer) return;

    const { data: expenses } = await supabaseClient
        .from('expenses')
        .select('*')
        .order('tanggal', { ascending: false })
        .limit(10);

    if (!expenses || expenses.length === 0) {
        expenseContainer.innerHTML = `<div class="p-8 text-center text-slate-500 text-xs uppercase">>> Belum ada pengeluaran tercatat</div>`;
        return;
    }

    let html = `
        <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
                <tr class="bg-stone-950 text-red-500/70 border-b border-red-950 uppercase tracking-wider text-[10px]">
                    <th class="p-4 font-bold">TANGGAL</th>
                    <th class="p-4 font-bold">KETERANGAN</th>
                    <th class="p-4 font-bold">KATEGORI</th>
                    <th class="p-4 font-bold text-right">NOMINAL</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-red-950/20 bg-black/40">
    `;

    expenses.forEach(expense => {
        const tanggalObj = new Date(expense.tanggal);
        const tanggalFormat = tanggalObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });

        let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 text-[9px] uppercase">${expense.kategori}</span>`;
        if (expense.kategori === 'Pembelian Stok') katBadge = `<span class="bg-blue-950/60 text-blue-400 px-2 py-0.5 border border-blue-800/50 text-[9px]">📦 STOK</span>`;
        if (expense.kategori === 'Operasional') katBadge = `<span class="bg-purple-950/60 text-purple-400 px-2 py-0.5 border border-purple-800/50 text-[9px]">💼 OP</span>`;
        if (expense.kategori === 'Gaji') katBadge = `<span class="bg-green-950/60 text-green-400 px-2 py-0.5 border border-green-800/50 text-[9px]">👥 GAJI</span>`;
        if (expense.kategori === 'Listrik') katBadge = `<span class="bg-yellow-950/60 text-yellow-400 px-2 py-0.5 border border-yellow-800/50 text-[9px]">⚡ LISTRIK</span>`;

        html += `
            <tr class="hover:bg-red-950/10 transition-colors">
                <td class="p-4 text-red-500 font-bold">${tanggalFormat}</td>
                <td class="p-4 font-bold text-white uppercase">${expense.keterangan}</td>
                <td class="p-4">${katBadge}</td>
                <td class="p-4 text-right text-red-400 font-bold">Rp ${Number(expense.nominal).toLocaleString('id-ID')}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    expenseContainer.innerHTML = html;
}

async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[PERINGATAN] HANCURKAN "${namaBarang.toUpperCase()}" PERMANEN?`);
    if (konfirmasi) {
        await supabaseClient.from('products').delete().eq('id', id);
        loadDashboard();
    }
}

document.getElementById('refreshPaymentsBtn')?.addEventListener('click', loadPayments);
window.confirmPayment = confirmPayment;
document.addEventListener('DOMContentLoaded', loadDashboard);
