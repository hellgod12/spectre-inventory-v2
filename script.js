const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    
    // Tarik data dengan order terbaru
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="p-8 text-center text-red-400 font-medium">Gagal memuat data: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-400 font-medium">Database kosong. Silakan isi produk baru terlebih dahulu.</div>`;
        return;
    }

    let totalStock = 0;
    let totalAsset = 0;

    let tableHtml = `
        <table class="w-full text-left border-collapse text-sm">
            <thead>
                <tr class="bg-slate-800/60 text-slate-400 border-b border-slate-700">
                    <th class="p-4 font-semibold">Nama Produk</th>
                    <th class="p-4 font-semibold text-center">Stok</th>
                    <th class="p-4 font-semibold">Harga Modal</th>
                    <th class="p-4 font-semibold">Harga Jual</th>
                    <th class="p-4 font-semibold">Harga Member</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50">
    `;

    data.forEach((item, index) => {
        totalStock += parseInt(item.stok || 0);
        totalAsset += parseFloat(item.harga_modal || 0) * parseInt(item.stok || 0);

        // Menentukan indikator warna stok rendah (contoh jika kurang dari 5)
        const stokBedge = item.stok <= 5 
            ? `<span class="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">${item.stok} Low</span>`
            : `<span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">${item.stok} pcs</span>`;

        tableHtml += `
            <tr class="hover:bg-slate-800/30 transition-colors duration-200 group">
                <td class="p-4 font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">${item.nama_barang}</td>
                <td class="p-4 text-center">${stokBedge}</td>
                <td class="p-4 text-slate-300">Rp ${Number(item.harga_modal).toLocaleString('id-ID')}</td>
                <td class="p-4 text-cyan-400 font-medium">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
                <td class="p-4 text-purple-400">Rp ${Number(item.harga_member).toLocaleString('id-ID')}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

    // Masukkan hitungan statistik ke widget atas
    document.getElementById('totalItems').innerText = data.length;
    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalAsset').innerText = 'Rp ' + totalAsset.toLocaleString('id-ID');
}

document.addEventListener('DOMContentLoaded', loadDashboard);
