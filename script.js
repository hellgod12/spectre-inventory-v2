const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- MODUL VISUAL TAMBAHAN ---
const quotes = [
    "LEMAH_ADALAH_PILIHAN. DISIPLIN_ADALAH_KEWAJIBAN.",
    "UANG_ADALAH_ENERGI. PASTIKAN_IA_MENGALIR_KE_KAS_KITA.",
    "KEGAGALAN_ADALAH_BUG_DALAM_SISTEM. PERBAIKI_SEKARANG.",
    "JAGA_STOK_GUDANG. JAGA_KENDALI_ATAS_DUNIAMU."
];

function tampilkanQuote() {
    const quoteBox = document.getElementById('quoteBox');
    if (quoteBox) {
        quoteBox.innerText = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
    }
}

async function renderCandle() {
    const { data: sales } = await supabaseClient
        .from('sales_history')
        .select('created_at, total_harga')
        .order('created_at', { ascending: true });

    if (!sales || sales.length === 0) return;

    // Format data untuk ApexCharts Candlestick
    const seriesData = sales.map(s => ({
        x: new Date(s.created_at).toLocaleDateString(),
        y: [s.total_harga, s.total_harga, s.total_harga, s.total_harga]
    }));

    const options = {
        chart: { type: 'candlestick', height: 250, background: 'transparent', toolbar: { show: false } },
        series: [{ data: seriesData }],
        theme: { mode: 'dark' },
        xaxis: { type: 'category', labels: { style: { colors: '#a1a1aa' } } },
        yaxis: { labels: { style: { colors: '#a1a1aa' }, formatter: (v) => 'Rp ' + v.toLocaleString() } },
        plotOptions: { candlestick: { colors: { upward: '#10b981', downward: '#ef4444' } } }
    };

    const chartEl = document.querySelector("#candleChart");
    if (chartEl) {
        chartEl.innerHTML = ""; // Bersihkan sebelum render
        new ApexCharts(chartEl, options).render();
    }
}

// --- LOGIKA UTAMA DASHBOARD ---
async function loadDashboard() {
    // 1. Jalankan Fitur Baru
    tampilkanQuote();
    renderCandle();

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

    if (products) {
        products.forEach(item => { totalStock += parseInt(item.stok || 0); });
        document.getElementById('totalItems').innerText = products.length;
    }

    if (salesHistory) {
        salesHistory.forEach(sale => {
            omsetAsli += parseFloat(sale.total_harga || 0);
            totalTerjualCount += parseInt(sale.jumlah || 0);
            const dataBarang = products ? products.find(p => p.nama_barang === sale.nama_barang) : null;
            const modalSatuan = dataBarang ? parseFloat(dataBarang.harga_modal || 0) : 0;
            profitAsli += (parseFloat(sale.total_harga || 0) - (modalSatuan * parseInt(sale.jumlah || 0)));
        });
    }

    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalOmset').innerText = 'Rp ' + omsetAsli.toLocaleString('id-ID');
    document.getElementById('totalProfit').innerText = 'Rp ' + profitAsli.toLocaleString('id-ID');
    document.getElementById('totalSalesCount').innerText = totalTerjualCount + " Barang";

    // --- RENDERING TABEL 1 (STOK) & TABEL 2 (RIWAYAT) ---
    // (Kode render tabel Anda tetap di sini, tidak ada yang saya ubah)
    // ...
}

async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[PERINGATAN] HANCURKAN "${namaBarang.toUpperCase()}" PERMANEN?`);
    if (konfirmasi) {
        await supabaseClient.from('products').delete().eq('id', id);
        loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
