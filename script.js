const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatCurrency(value) {
    return 'Rp ' + Number(value).toLocaleString('id-ID');
}

function isMobile() {
    return window.innerWidth < 640; // cocok untuk iPhone/Android (Tailwind sm)
}


function makeSkuFromNamaBarang(nama) {
    const txt = String(nama || '').trim().toUpperCase();
    if (!txt) return '';
    return txt
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
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

    const mobile = isMobile();

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

    let html = ``;

    if (mobile) {
        html += `
            <div class="space-y-2">
        `;
        payments.forEach(payment => {
            const statusClass = payment.status === 'Belum Bayar' ? 'status-belumbayar' : 'status-sudahbayar';
            html += `
                <div class="p-3 border border-red-950/40 bg-black/40">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="text-[10px] text-red-500 font-bold uppercase">${payment.buyer}</div>
                            <div class="mt-1 text-[12px] font-bold text-white uppercase">${payment.product}</div>
                            <div class="mt-1 text-[11px] text-slate-400">Ukuran: ${payment.ukuran || '—'}</div>
                            <div class="mt-1 text-[11px] text-rose-400 font-bold">Jumlah: ${payment.jumlah}</div>
                            <div class="mt-1 text-[12px] text-emerald-400 font-bold">${formatCurrency(payment.total_harga)}</div>
                            <div class="mt-1 text-[11px] text-slate-400">${payment.method}</div>
                            <div class="mt-2"><span class="badge ${statusClass}">${payment.status}</span></div>
                        </div>
                        <div class="text-right">
                            ${payment.status === 'Belum Bayar' ? `<button onclick="confirmPayment('${payment.id}')" class="px-3 py-1 bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-700/60 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 shadow-[0_10px_25px_rgba(16,185,129,.15)] hover:shadow-[0_14px_35px_rgba(16,185,129,.25)] active:scale-[0.98] mb-2">Konfirmasi</button>` : ``}
                            <button onclick="deletePayment('${payment.id}')" class="px-3 py-1 bg-red-900/70 hover:bg-red-800 border border-red-700/60 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 shadow-[0_10px_25px_rgba(239,68,68,.12)] hover:shadow-[0_14px_35px_rgba(239,68,68,.22)] active:scale-[0.98]">Hapus</button>

                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        paymentsContainer.innerHTML = html;
        updateDashboardProgress(payments);
        return;
    }

    html += `
        <table class="w-full text-left border-collapse text-xs">
            <thead>
                <tr class="bg-black/60 border-b border-red-950 text-red-500/80 uppercase text-[10px]">
                    <th class="p-3 font-bold tracking-wider">PEMBELI</th>
                    <th class="p-3 font-bold tracking-wider">PRODUK</th>
                    <th class="p-3 font-bold tracking-wider">UKURAN</th>
                    <th class="p-3 font-bold text-center tracking-wider">JUMLAH</th>
                    <th class="p-3 font-bold tracking-wider">TOTAL</th>

                    <th class="p-3 font-bold tracking-wider">METODE</th>
                    <th class="p-3 font-bold tracking-wider">STATUS</th>
                    <th class="p-3 font-bold tracking-wider">AKSI</th>
                </tr>
            </thead>
            <tbody class="bg-black/45 divide-y divide-red-950/25">

    `;

    payments.forEach(payment => {
        const statusClass = payment.status === 'Belum Bayar' ? 'status-belumbayar' : 'status-sudahbayar';
        html += `
            <tr class="hover:bg-red-950/10 transition-colors">
                <td class="p-3 font-bold">${payment.buyer}</td>
                <td class="p-3">${payment.product}</td>
                <td class="p-3">${payment.ukuran || '—'}</td>
                <td class="p-3 text-center">${payment.jumlah}</td>
                <td class="p-3">${formatCurrency(payment.total_harga)}</td>
                <td class="p-3">${payment.method}</td>
                <td class="p-3"><span class="badge ${statusClass}">${payment.status}</span></td>
                <td class="p-3 text-center">
                    ${payment.status === 'Belum Bayar' ? `<button onclick="confirmPayment('${payment.id}')" class="px-3 py-1 bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-700/60 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 shadow-[0_10px_25px_rgba(16,185,129,.15)] hover:shadow-[0_14px_35px_rgba(16,185,129,.25)] active:scale-[0.98] mr-2">Konfirmasi</button>` : ``}
                    <button onclick="deletePayment('${payment.id}')" class="px-3 py-1 bg-red-900/70 hover:bg-red-800 border border-red-700/60 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 shadow-[0_10px_25px_rgba(239,68,68,.12)] hover:shadow-[0_14px_35px_rgba(239,68,68,.22)] active:scale-[0.98]">Hapus</button>

                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    paymentsContainer.innerHTML = html;
    updateDashboardProgress(payments);
}

async function deletePayment(id) {
    const konfirmasi = confirm('[PERINGATAN] HAPUS RECORD PEMBAYARAN INI? Log penjualan tetap jalan. Tidak bisa dikembalikan.');
    if (!konfirmasi) return;

    try {
        // Hapus payment record saja, sales_history tetap ada
        const { error: delPayment } = await supabaseClient
            .from('payments')
            .delete()
            .eq('id', id);

        if (delPayment) {
            console.error('Gagal hapus payment:', delPayment);
            alert('❌ Gagal menghapus: ' + delPayment.message);
        } else {
            // jika pembayaran dihapus => turunkan animasi pembayaran
            try {
                // untuk kesan "turun" kita panggil applyPaymentDelta juga (candle manager sudah punya pulse)
                // namun kita biarkan sebagai visual umum.
                window.CandleManager?.applyPaymentDelta?.();
                localStorage.setItem('candle_payment_delta', JSON.stringify({ t: Date.now() }));
            } catch (e) {}

            alert('✅ RECORD PEMBAYARAN BERHASIL DIHAPUS');
            await loadPayments();
        }
    } catch (err) {
        console.error('Error deleting payment:', err);
        alert('❌ Error: ' + err.message);
    }
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

            // animasi pembayaran turun/naik saat konfirmasi (di HP)
            try {
                window.CandleManager?.applyPaymentDelta?.();
                localStorage.setItem('candle_payment_delta', JSON.stringify({ t: Date.now() }));
            } catch (e) {}

            await loadPayments();
            return;
        }

        alert('Gagal konfirmasi pembayaran: ' + error.message);
        return;
    }

    // sukses remote => animasi pembayaran (naik)
    try {
        window.CandleManager?.applyPaymentDelta?.();
        localStorage.setItem('candle_payment_delta', JSON.stringify({ t: Date.now() }));
    } catch (e) {}

    await loadPayments();
}


function renderCandlestickChartFromSalesHistory(salesHistory = []) {
    const canvas = document.getElementById('candlestickChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 320;
    const cssH = 220;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = cssW;
    const height = cssH;
    ctx.clearRect(0, 0, width, height);

    // Prepare daily buckets: OHLC simulated from sales_history
    // OHLC definition:
    // open  = first transaction total_harga in day bucket
    // high  = max transaction total_harga in day bucket
    // low   = min transaction total_harga in day bucket
    // close = last transaction total_harga in day bucket

    const parseDate = (v) => {
        try {
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
        } catch (e) {}
        return null;
    };

    const items = (salesHistory || [])
        .map(s => ({
            t: parseDate(s.created_at),
            v: Number(s.total_harga || 0)
        }))
        .filter(x => x.t && Number.isFinite(x.v));

    if (items.length < 2) {
        // empty chart
        ctx.fillStyle = 'rgba(148,163,184,0.35)';
        ctx.font = '12px Share Tech Mono, monospace';
        ctx.fillText('NO_SALES_DATA', 12, 28);
        return;
    }

    // sort by time
    items.sort((a, b) => a.t - b.t);

    // bucket by YYYY-MM-DD
    const fmtDay = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const bucketsMap = new Map();
    for (const it of items) {
        const key = fmtDay(it.t);
        if (!bucketsMap.has(key)) bucketsMap.set(key, []);
        bucketsMap.get(key).push(it);
    }

    const buckets = Array.from(bucketsMap.entries())
        .map(([key, arr]) => {
            const sorted = arr.slice().sort((a, b) => a.t - b.t);
            const open = sorted[0].v;
            const close = sorted[sorted.length - 1].v;
            const high = sorted.reduce((m, x) => Math.max(m, x.v), -Infinity);
            const low = sorted.reduce((m, x) => Math.min(m, x.v), Infinity);
            return { key, open, high, low, close, count: sorted.length };
        })
        .sort((a, b) => a.key.localeCompare(b.key));

    const maxCandles = 24; // keep chart light
    const sliced = buckets.slice(Math.max(0, buckets.length - maxCandles));

    const padL = 10;
    const padR = 10;
    const padT = 14;
    const padB = 24;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const highs = sliced.map(c => c.high);
    const lows = sliced.map(c => c.low);
    const maxY = Math.max(...highs);
    const minY = Math.min(...lows);
    const span = (maxY - minY) || 1;

    const yToPx = (y) => {
        const norm = (y - minY) / span;
        return padT + (1 - norm) * plotH;
    };

    // background grid
    ctx.strokeStyle = 'rgba(248,113,113,0.12)';
    ctx.lineWidth = 1;
    const gridY = 4;
    for (let i = 0; i <= gridY; i++) {
        const yy = padT + (plotH / gridY) * i;
        ctx.beginPath();
        ctx.moveTo(padL, yy);
        ctx.lineTo(padL + plotW, yy);
        ctx.stroke();
    }

    // candle width
    const count = sliced.length;
    const slot = plotW / Math.max(1, count);
    const candleW = Math.max(4, slot * 0.55);

    // draw candles
    for (let i = 0; i < count; i++) {
        const c = sliced[i];
        const xCenter = padL + slot * i + slot / 2;

        const yOpen = yToPx(c.open);
        const yClose = yToPx(c.close);
        const yHigh = yToPx(c.high);
        const yLow = yToPx(c.low);

        const isUp = c.close >= c.open;
        const color = isUp ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)';
        const glow = isUp ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)';

        // wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xCenter, yHigh);
        ctx.lineTo(xCenter, yLow);
        ctx.stroke();

        // body
        const bodyTop = Math.min(yOpen, yClose);
        const bodyBot = Math.max(yOpen, yClose);
        const bodyH = Math.max(2, bodyBot - bodyTop);

        // glow behind
        ctx.fillStyle = glow;
        ctx.fillRect(xCenter - candleW / 2, bodyTop, candleW, bodyH);

        ctx.fillStyle = color;
        ctx.fillRect(xCenter - candleW / 2, bodyTop, candleW, bodyH);
    }

    // x axis labels (minimal)
    ctx.fillStyle = 'rgba(148,163,184,0.55)';
    ctx.font = '10px Share Tech Mono, monospace';
    const labelEvery = Math.max(1, Math.floor(count / 6));
    for (let i = 0; i < count; i += labelEvery) {
        const c = sliced[i];
        const label = c.key.slice(5); // MM-DD
        const xCenter = padL + slot * i + slot / 2;
        ctx.fillText(label, xCenter - 14, height - 8);
    }
}

function updateAnalyticsKPIs({ revenue = 0, orders = 0, productsSold = 0, pendingPayment = 0, stockMovement = 0 } = {}) {
    const elRevenue = document.getElementById('kpiRevenue');
    const elOrders = document.getElementById('kpiOrders');
    const elProductsSold = document.getElementById('kpiProductsSold');
    const elPending = document.getElementById('kpiPendingPayment');
    const elStockMove = document.getElementById('kpiStockMovement');

    if (elRevenue) elRevenue.textContent = 'Rp ' + Number(revenue).toLocaleString('id-ID');
    if (elOrders) elOrders.textContent = String(orders);
    if (elProductsSold) elProductsSold.textContent = String(productsSold);
    if (elPending) elPending.textContent = String(pendingPayment);
    if (elStockMove) elStockMove.textContent = String(stockMovement);
}

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    const soldContainer = document.getElementById('soldContainer');
    
    // Debug: pastikan elemen yang dipakai ada
    if (!container) {
        console.error('loadDashboard(): element #productContainer is null');
        return;
    }

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

    // Profit per produk (modal vs revenue terjual)
    // profitProduk[p.nama_barang] = { nama_barang, kategori, ukuran, profit, revenue, modalTotal, qty }
    const profitProduk = new Map();

    // Hitung sisa stok di gudang saat ini
    if (products) {
        products.forEach(item => { totalStock += parseInt(item.stok || 0); });
        document.getElementById('totalItems').innerText = products.length;
    }

    // Hitung total penjualan dari tabel riwayat
    if (salesHistory) {
        // Pre-map produk modal per nama_barang
        const modalMap = new Map();
        (products || []).forEach(p => {
            modalMap.set(String(p.nama_barang || '').toUpperCase(), parseFloat(p.harga_modal || 0));
        });

        salesHistory.forEach(sale => {
            const nama = String(sale.nama_barang || '').toUpperCase();
            const qty = parseInt(sale.jumlah || 0);
            const revenue = parseFloat(sale.total_harga || 0);
            const modalSatuan = modalMap.get(nama) || 0;
            const totalModal = modalSatuan * qty;

            omsetAsli += revenue;
            totalTerjualCount += qty;
            profitAsli += (revenue - totalModal);

            const prev = profitProduk.get(nama) || {
                nama_barang: sale.nama_barang,
                kategori: (products || []).find(p => String(p.nama_barang||'').toUpperCase() === nama)?.kategori || 'Apparel',
                ukuran: (products || []).find(p => String(p.nama_barang||'').toUpperCase() === nama)?.ukuran || '',
                profit: 0,
                revenue: 0,
                modalTotal: 0,
                qty: 0
            };

            prev.revenue += revenue;
            prev.modalTotal += totalModal;
            prev.profit += (revenue - totalModal);
            prev.qty += qty;

            profitProduk.set(nama, prev);
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
    } else if (isMobile()) {
        let cards = `
            <div class="space-y-2">
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

            cards += `
                <div class="p-3 border border-red-950/40 bg-black/40">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="text-[11px] text-white font-bold uppercase leading-4">${item.nama_barang}</div>
                            <div class="mt-2">${katBadge}</div>
                            <div class="mt-2">${ukuranBadge}</div>
                            <div class="mt-2">${stokBadge}</div>
                            <div class="mt-2 text-[11px] text-slate-500">
                                Modal: Rp ${Number(item.harga_modal).toLocaleString('id-ID')}<br/>
                                Umum: Rp ${Number(item.harga_jual).toLocaleString('id-ID')}<br/>
                                Member: Rp ${Number(item.harga_member).toLocaleString('id-ID')}
                            </div>
                        </div>
                        <div class="text-right">
                            <button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-[10px] font-bold uppercase">Hapus</button>
                        </div>
                    </div>
                </div>
            `;
        });
        cards += `
            </div>
        `;
        container.innerHTML = cards;
    } else {
        let tableHtml = `
            <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                    <tr class="bg-black/60 border-b border-red-950 text-red-500/80 uppercase tracking-wider text-[10px]">
                        <th class="p-4 font-bold tracking-wider">SKU</th>
                        <th class="p-4 font-bold tracking-wider">NAMA_BARANG</th>
                        <th class="p-4 font-bold tracking-wider">SEKTOR_KATEGORI</th>
                        <th class="p-4 font-bold text-center tracking-wider">TINGKAT_STOK</th>
                        <th class="p-4 font-bold tracking-wider">HARGA_UMUM</th>
                        <th class="p-4 font-bold text-center tracking-wider">HANCURKAN</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-red-950/25 bg-black/45">
`;


        products.forEach(item => {
            let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 font-bold text-[9px] uppercase">${item.kategori || 'Apparel'}</span>`;
            if (item.kategori === 'Skateboard') katBadge = `<span class="bg-red-950/60 text-red-500 px-2 py-0.5 border border-red-800/50 font-bold text-[9px] uppercase">🛹 PAPAN_SKATE</span>`;
            if (item.kategori === 'Perlengkapan') katBadge = `<span class="bg-zinc-900 text-zinc-400 px-2 py-0.5 border border-zinc-700 font-bold text-[9px] uppercase">🛠️ HARDWARE</span>`;

            const currentStock = parseInt(item.stok || 0);
            const stokBadge = currentStock <= 5
                ? `<span class="bg-red-950 text-red-500 border border-red-600 px-2 py-0.5 font-bold text-[10px] animate-pulse">☠️ KRITIS_${currentStock}</span>`
                : `<span class="bg-stone-900 text-slate-300 border border-stone-800 px-2 py-0.5 font-bold text-[10px]">${currentStock} UNIT</span>`;

            tableHtml += `
                <tr class="hover:bg-red-950/10 transition-colors">
                    <td class="p-4 font-mono text-yellow-400 text-xs">${item.sku || '—'}</td>
                    <td class="p-4 font-bold text-white uppercase tracking-wide">${item.nama_barang}</td>
                    <td class="p-4">${katBadge}</td>
                    <td class="p-4 text-center">${stokBadge}</td>
                    <td class="p-4 text-red-400 font-bold">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
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
    } else if (isMobile()) {
        let cards = `
            <div class="space-y-2">`;

        salesHistory.forEach(sale => {
            const dateObj = new Date(sale.created_at);
            const opsiFormat = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
            const tanggalLokalan = dateObj.toLocaleDateString('id-ID', opsiFormat).replace(',', ' //');

            const isMember = (sale.tipe_pembeli || '').toLowerCase().startsWith('member');
            const orangBadge = isMember
                ? `<span class="bg-purple-950 text-purple-400 border border-purple-800 text-[10px] px-2 py-0.5 font-bold">👤 MEMBER</span>`
                : `<span class="bg-zinc-900 text-zinc-400 border border-zinc-700 text-[10px] px-2 py-0.5 font-bold">👤 NON-MEMBER</span>`;

            cards += `
                <div class="p-3 border border-red-950/20 bg-black/50">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="text-[10px] text-red-500 font-bold">${tanggalLokalan} WIB</div>
                            <div class="mt-1 text-[12px] font-bold text-white uppercase">${sale.nama_barang}</div>
                            <div class="mt-1">${orangBadge}</div>
                            <div class="mt-1 text-slate-400 text-[11px]">Ukuran: ${sale.ukuran || '—'}</div>
                            <div class="mt-1 text-rose-400 font-bold text-[11px]">${sale.jumlah} PCS</div>
                            <div class="mt-1 text-yellow-400 font-bold text-[11px]">Harga pakai (per PCS): Rp ${sale.jumlah ? Math.round(Number(sale.total_harga)/Number(sale.jumlah)).toLocaleString('id-ID') : 0}</div>
                            <div class="mt-1 text-emerald-400 font-bold text-[12px]">Total: Rp ${Number(sale.total_harga).toLocaleString('id-ID')}</div>

                        </div>
                        <div class="text-right">
                            <button onclick="deleteFromSalesHistory(${sale.id}, '${sale.nama_barang}')" class="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-[10px] font-bold uppercase">Hapus</button>
                        </div>
                    </div>
                </div>
            `;
        });


        cards += `</div>`;
        soldContainer.innerHTML = cards;
    } else {
        let soldHtml = `
            <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
            <tr class="bg-black/60 border-b border-red-950 uppercase tracking-wider text-[10px]">
                        <th class="p-4 font-bold">WAKTU_MUTASI (TANGGAL/JAM)</th>
                        <th class="p-4 font-bold">ITEM_TERJUAL</th>
                        <th class="p-4 font-bold">STRUKTUR_ORANG</th>
                        <th class="p-4 font-bold">UKURAN</th>
                        <th class="p-4 font-bold text-center">KUANTITAS</th>
                        <th class="p-4 font-bold">TOTAL_DANA_MASUK</th>
                        <th class="p-4 font-bold text-center">AKSI</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-red-950/20 bg-black/60">
        `;

        salesHistory.forEach(sale => {
            // Memformat data mentah tanggal waktu dari Supabase agar enak dibaca manusia
            const dateObj = new Date(sale.created_at);
            const opsiFormat = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
            const tanggalLokalan = dateObj.toLocaleDateString('id-ID', opsiFormat).replace(',', ' //');

            const isMember = (sale.tipe_pembeli || '').toLowerCase().startsWith('member');
            const orangBadge = isMember
                ? `<span class="bg-purple-950 text-purple-400 border border-purple-800 text-[10px] px-2 py-0.5 font-bold">👤 MEMBER</span>`
                : `<span class="bg-zinc-900 text-zinc-400 border border-zinc-700 text-[10px] px-2 py-0.5 font-bold">👤 NON-MEMBER</span>`;


            soldHtml += `
                <tr class="hover:bg-rose-950/10 transition-colors">
                    <td class="p-4 text-red-500 font-bold tracking-tight">${tanggalLokalan} WIB</td>
                    <td class="p-4 font-bold text-white uppercase">
                        ${sale.nama_barang}
                        <div class="text-[10px] text-yellow-400 font-bold">Harga pakai (per PCS): Rp ${sale.jumlah ? Math.round(Number(sale.total_harga)/Number(sale.jumlah)).toLocaleString('id-ID') : 0}</div>

                    </td>
                    <td class="p-4">${orangBadge}</td>
                    <td class="p-4">${sale.ukuran || '—'}</td>
                    <td class="p-4 text-center text-rose-400 font-bold">${sale.jumlah} PCS</td>
                    <td class="p-4 text-emerald-400 font-bold">Rp ${Number(sale.total_harga).toLocaleString('id-ID')}</td>
                    <td class="p-4 text-center">
                        <button onclick="deleteFromSalesHistory(${sale.id}, '${sale.nama_barang}')" class="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-[10px] font-bold uppercase">Hapus</button>
                    </td>
                </tr>
            `;
        });

        soldHtml += `</tbody></table>`;
        soldContainer.innerHTML = soldHtml;
    }

    // Render 1 candle profit (hanya 1 candle di bagian atas)
    // Kita pilih produk dengan abs(profit) terbesar, lalu mapping ke progress fill atas.
    try {
        const topFill = document.getElementById('dashboardProgressFill');
        const topText = document.getElementById('dashboardProgressText');
        const topSub = document.getElementById('dashboardProgressSub');
        if (topFill && topText && topSub && profitProduk && profitProduk.size > 0) {
            let best = null;
            let maxAbs = 0;
            profitProduk.forEach(v => {
                const p = v.profit || 0;
                const abs = Math.abs(p);
                if (abs > maxAbs) {
                    maxAbs = abs;
                    best = v;
                }
            });
            if (!best) return;

            const percent = Math.min(100, Math.round((Math.abs(best.profit || 0) / (maxAbs || 1)) * 100));
            const isNeg = (best.profit || 0) < 0;
            topFill.style.transition = 'width 600ms ease, filter 300ms ease';
            topFill.style.width = `${percent}%`;
            topFill.style.background = isNeg ? 'linear-gradient(90deg, #ef4444, #7f1d1d)' : 'linear-gradient(90deg, #10b981, #34d399)';

            topText.innerText = `${percent}% profit terpantau — candel memanas`;
            topSub.innerText = `Produk fokus: ${(best.nama_barang || '').toString().toUpperCase()} • Modal Rp ${(best.modalTotal || 0).toLocaleString('id-ID')}`;

            // partikel kecil arah profit (tanpa teks tambahan)
            try { window.CandleManager?.applyPaymentDelta?.(); } catch (e) {}

        }
    } catch (e) {}


    await loadPayments();
    await loadExpenses();

    // Render candlestick chart with sales history data
    renderCandlestickChartFromSalesHistory(salesHistory);
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
        <div class="block sm:hidden">
            <div class="space-y-2">
    `

    expenses.forEach(expense => {
        const tanggalObj = new Date(expense.tanggal);
        const tanggalFormat = tanggalObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });

        let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 text-[9px] uppercase">${expense.kategori}</span>`;
        if (expense.kategori === 'Pembelian Stok') katBadge = `<span class="bg-blue-950/60 text-blue-400 px-2 py-0.5 border border-blue-800/50 text-[9px]">📦 STOK</span>`;
        if (expense.kategori === 'Operasional') katBadge = `<span class="bg-purple-950/60 text-purple-400 px-2 py-0.5 border border-purple-800/50 text-[9px]">💼 OP</span>`;
        if (expense.kategori === 'Gaji') katBadge = `<span class="bg-green-950/60 text-green-400 px-2 py-0.5 border border-green-800/50 text-[9px]">👥 GAJI</span>`;
        if (expense.kategori === 'Listrik') katBadge = `<span class="bg-yellow-950/60 text-yellow-400 px-2 py-0.5 border border-yellow-800/50 text-[9px]">⚡ LISTRIK</span>`;

        html += `
            <div class="p-3 border border-red-950/40 bg-black/40">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="text-[10px] text-red-500 font-bold">${tanggalFormat}</div>
                        <div class="text-[11px] font-bold text-white uppercase leading-4">${expense.keterangan}</div>
                        <div class="mt-2">${katBadge}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[11px] text-red-400 font-bold">Rp ${Number(expense.nominal).toLocaleString('id-ID')}</div>
                        <button onclick="deleteExpense(${expense.id})" class="mt-2 px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-[10px] font-bold uppercase">Hapus</button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;
    expenseContainer.innerHTML = html;
}
async function deleteExpense(id) {
    const konfirmasi = confirm('[PERINGATAN] HAPUS PENGELUARAN? Tidak bisa dikembalikan.');
    if (!konfirmasi) return;

    try {
        const { error } = await supabaseClient
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) {
            alert('❌ Gagal menghapus: ' + error.message);
            return;
        }

        alert('✅ PENGELUARAN BERHASIL DIHAPUS');
        // Untuk halaman pengeluaran, refresh riwayat pengeluaran yang benar.
        if (typeof loadExpenses === 'function') {
            await loadExpenses();
        } else {
            await loadDashboard();
        }
    } catch (err) {
        console.error('Error deleting expense:', err);
        alert('❌ Error: ' + err.message);
    }
}

async function deleteFromSalesHistory(id, namaBarang) {
    const konfirmasi = confirm(`[PERINGATAN] HAPUS RECORD PENJUALAN "${namaBarang.toUpperCase()}"? STOCK AKAN DIKEMBALIKAN DAN RECORD TERKAIT DIHAPUS SEKALIGUS. Tidak bisa dikembalikan.`);
    if (!konfirmasi) return;

    try {
        // 1) Ambil data sales_history (jadi source of truth)
        const { data: saleRecord, error: fetchErr } = await supabaseClient
            .from('sales_history')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !saleRecord) {
            alert('❌ Gagal ambil data penjualan: ' + (fetchErr?.message || 'Tidak ditemukan'));
            return;
        }

        // 2) Restore stock
        // Catatan: sistem stok/varian bergantung pada (nama_barang + ukuran). Agar akurat, kita juga cocokkan ukuran saat restore.
        const namaBarangSale = String(saleRecord.nama_barang || '').trim();
        const ukuranSale = saleRecord.ukuran ? String(saleRecord.ukuran).trim() : null;


        // 2a) Coba match exact nama_barang + ukuran (kalau tersedia)
        let product = null;
        try {
            let q = supabaseClient
                .from('products')
                .select('*')
                .eq('nama_barang', namaBarangSale);

            if (ukuranSale !== null) {
                q = q.eq('ukuran', ukuranSale);
            }

            const { data, error } = await q.maybeSingle();
            if (!error && data) product = data;
        } catch (e) {}

        // 2b) Fallback: match ilike nama_barang + ukuran
        if (!product && namaBarangSale) {
            try {
                let q = supabaseClient
                    .from('products')
                    .select('*')
                    .ilike('nama_barang', `%${namaBarangSale}%`)
                    .limit(5);

                if (ukuranSale !== null) {
                    q = q.eq('ukuran', ukuranSale);
                }

                const { data, error } = await q;
                if (!error && Array.isArray(data) && data.length > 0) product = data[0];
            } catch (e) {}
        }


        if (!product) {
            // Jangan silent: ini yang membuat stok "tetap kritis" walau riwayat dihapus
            alert('⚠️ Produk tidak ditemukan untuk restore stok: ' + namaBarangSale);
        } else {
            // Prefer restore by product_id (lebih akurat daripada nama_barang + ukuran)
            // Pastikan currentStok diambil dari target yang benar (restoreTargetId),
            // bukan dari hasil match nama_barang+ukuran yang mungkin tidak sama.
            const restoreTargetId = saleRecord.product_id || product.id;
            const deltaQty = parseInt(saleRecord.jumlah || 0, 10);

            let currentStok = 0;
            try {
                const { data: targetProduct } = await supabaseClient
                    .from('products')
                    .select('stok')
                    .eq('id', restoreTargetId)
                    .single();

                currentStok = parseInt(targetProduct?.stok || 0, 10);
            } catch (e) {
                // fallback pakai stok dari hasil match awal
                currentStok = parseInt(product.stok || 0, 10);
            }

            const stokBaru = currentStok + deltaQty;
            const { error: updateErr } = await supabaseClient
                .from('products')
                .update({ stok: stokBaru })
                .eq('id', restoreTargetId);

            if (updateErr) {
                alert('⚠️ Stock tidak terupdate: ' + updateErr.message);
            }
        }



        // 3) Hapus record payments terkait (kalau payment_id ada)
        // Tujuan: kalau user hapus 1 transaksi dari dashboard, tidak perlu hapus 1-1 lagi.
        if (saleRecord.payment_id) {
            await supabaseClient
                .from('payments')
                .delete()
                .eq('id', saleRecord.payment_id);
        }

        // 4) Hapus sales_history
        const { error: delErr } = await supabaseClient
            .from('sales_history')
            .delete()
            .eq('id', id);

        if (delErr) {
            alert('❌ Gagal menghapus record: ' + delErr.message);
        } else {
            alert('✅ RECORD PENJUALAN DIHAPUS SEKALIGUS + STOCK DIKEMBALIKAN');
            await loadDashboard();
        }
    } catch (err) {
        console.error('Error deleting sales_history:', err);
        alert('❌ Error: ' + err.message);
    }
}


async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[PERINGATAN] HAPUS PRODUK "${namaBarang.toUpperCase()}"?`);
    if (!konfirmasi) return;

    // ambil stok agar candel bisa turun saat produk dihapus
    let stokTerhapus = 0;
    try {
        const { data: product } = await supabaseClient
            .from('products')
            .select('stok')
            .eq('id', id)
            .single();
        stokTerhapus = parseInt(product?.stok || 0, 10);
    } catch (e) {}

    try {
        await supabaseClient.from('products').delete().eq('id', id);

        // efek visual candel turun (stok berkurang sebesar stokTerhapus)
        try {
            if (stokTerhapus > 0) {
                window.CandleManager?.applyStockDelta?.(-stokTerhapus);
                try {
                    localStorage.setItem('candle_stock_delta', JSON.stringify({ delta: -stokTerhapus, t: Date.now() }));
                } catch (e) {}
            }
        } catch (e) {}

        await loadDashboard();
    } catch (err) {
        alert('❌ Gagal menghapus produk: ' + (err?.message || err));
    }
}


document.getElementById('refreshPaymentsBtn')?.addEventListener('click', loadPayments);
window.confirmPayment = confirmPayment;
window.deletePayment = deletePayment;
window.deleteFromSalesHistory = deleteFromSalesHistory;
window.deleteExpense = deleteExpense;
window.deleteProduct = deleteProduct;
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();

    // Sync animasi candel dari halaman lain (barang/penjualan)
    window.addEventListener('storage', (e) => {
        if (!e || !e.key) return;

        if (e.key === 'candle_stock_delta') {
            try {
                const payload = JSON.parse(e.newValue || '{}');
                window.CandleManager?.applyStockDelta?.(payload.delta);
            } catch (err) {}
        }

        if (e.key === 'candle_payment_delta') {
            try {
                window.CandleManager?.applyPaymentDelta?.();
            } catch (err) {}
        }
    });

    // initial refresh jika container ada
    try {
        window.CandleManager?.refreshStockCandleFromProductsTotal?.();
    } catch (e) {}
});

