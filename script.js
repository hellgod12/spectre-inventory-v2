const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="p-8 text-center text-red-500 mono text-xs uppercase">>> ERROR: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-600 mono text-xs uppercase">>> DATABASE_KOSONG</div>`;
        return;
    }

    let totalStock = 0;
    let totalAsset = 0;

    let tableHtml = `
        <table class="w-full text-left border-collapse text-xs mono whitespace-nowrap">
            <thead>
                <tr class="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    <th class="p-4 font-bold">Nama Item</th>
                    <th class="p-4 font-bold text-center">Stok</th>
                    <th class="p-4 font-bold">Modal</th>
                    <th class="p-4 font-bold">Harga Jual</th>
                    <th class="p-4 font-bold">Member</th>
                    <th class="p-4 font-bold text-center">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/60">
    `;

    data.forEach(item => {
        totalStock += parseInt(item.stok || 0);
        totalAsset += parseFloat(item.harga_modal || 0) * parseInt(item.stok || 0);

        const stokBadge = item.stok <= 5 
            ? `<span class="bg-red-950/80 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold text-[10px]">⚠️ ${item.stok} UNIT</span>`
            : `<span class="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-bold text-[10px]">${item.stok} UNIT</span>`;

        tableHtml += `
            <tr class="hover:bg-slate-900/40 transition-colors">
                <td class="p-4 font-bold text-white uppercase">${item.nama_barang}</td>
                <td class="p-4 text-center">${stokBadge}</td>
                <td class="p-4 text-slate-400">Rp ${Number(item.harga_modal).toLocaleString('id-ID')}</td>
                <td class="p-4 text-cyan-400 font-bold">Rp ${Number(item.harga_jual).toLocaleString('id-ID')}</td>
                <td class="p-4 text-purple-400 font-bold">Rp ${Number(item.harga_member).toLocaleString('id-ID')}</td>
                <td class="p-4 text-center">
                    <button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

    document.getElementById('totalItems').innerText = data.length;
    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalAsset').innerText = 'Rp ' + totalAsset.toLocaleString('id-ID');
}

async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`Hapus "${namaBarang.toUpperCase()}" secara permanen?`);
    if (konfirmasi) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) alert('Gagal: ' + error.message);
        else loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
