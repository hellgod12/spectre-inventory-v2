const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const quotes = ["LEMAH_ADALAH_PILIHAN.", "UANG_ADALAH_ENERGI.", "DISIPLIN_ADALAH_KUNCI."];

async function renderCandle() {
    const { data: sales } = await supabaseClient.from('sales_history').select('created_at, total_harga');
    const chartEl = document.querySelector("#candleChart");
    if (!sales || sales.length === 0) {
        if (chartEl) chartEl.innerHTML = "<p class='text-center text-xs text-stone-600'>DATA_TIDAK_TERSEDIA</p>";
        return;
    }
    const series = sales.map(s => ({ x: new Date(s.created_at).toLocaleDateString(), y: [s.total_harga, s.total_harga, s.total_harga, s.total_harga] }));
    new ApexCharts(chartEl, {
        chart: { type: 'candlestick', height: 200, toolbar: { show: false } },
        series: [{ data: series }],
        theme: { mode: 'dark' }
    }).render();
}

async function loadDashboard() {
    document.getElementById('quoteBox').innerText = quotes[Math.floor(Math.random() * quotes.length)];
    renderCandle();
    
    // Tarik data Produk & Sales (Logika lama Anda di sini)
    const { data: products } = await supabaseClient.from('products').select('*');
    const { data: salesHistory } = await supabaseClient.from('sales_history').select('*');
    
    // Hitung & Render Tabel (Gunakan kode lama Anda untuk bagian ini)
    // Pastikan ID 'productContainer' & 'soldContainer' terisi
}

document.addEventListener('DOMContentLoaded', loadDashboard);
