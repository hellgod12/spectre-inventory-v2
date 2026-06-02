const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDashboard() {
    const container = document.getElementById('productContainer');
    
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    const { data: members, error: memError } = await supabaseClient
        .from('members')
        .select('id');

    if (prodError) {
        container.innerHTML = `<div class="p-8 text-center text-red-600 text-xs uppercase">>> CRITICAL_ERROR: SERVER REJECTED CONNECTION</div>`;
        return;
    }

    const jumlahMember = members ? members.length : 0;
    document.getElementById('totalMembers').innerText = jumlahMember + " Souls";

    if (!products || products.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-red-900/60 text-xs uppercase">>> DATABASE_IS_EMPTY_VOID</div>`;
        return;
    }

    let totalStock = 0;
    let omsetSimulasi = 0;
    let profitSimulasi = 0;
    let totalTerjualCount = 0;

    let tableHtml = `
        <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
                <tr class="bg-stone-950 text-red-500/70 border-b border-red-950 uppercase tracking-wider text-[10px]">
                    <th class="p-4 font-bold">ITEM_NAME</th>
                    <th class="p-4 font-bold">SECTOR_TYPE</th>
                    <th class="p-4 font-bold text-center">STOCK_LEVEL</th>
                    <th class="p-4 font-bold">BASE_COST</th>
                    <th class="p-4 font-bold">PUBLIC_PRICE</th>
                    <th class="p-4 font-bold">MEMBER_PRICE</th>
                    <th class="p-4 font-bold text-center">PURGE_DATA</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-red-950/30 bg-black/40">
    `;

    products.forEach(item => {
        const currentStock = parseInt(item.stok || 0);
        totalStock += currentStock;

        const simulasiTerjual = 3; 
        totalTerjualCount += simulasiTerjual;
        omsetSimulasi += (parseFloat(item.harga_jual || 0) * simulasiTerjual);
        profitSimulasi += ((parseFloat(item.harga_jual || 0) - parseFloat(item.harga_modal || 0)) * simulasiTerjual);

        // Desain Badge Kategori Menyeramkan
        let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 font-bold text-[9px] uppercase">Gears</span>`;
        if (item.kategori === 'Skateboard') {
            katBadge = `<span class="bg-red-950/60 text-red-500 px-2 py-0.5 border border-red-800/50 font-bold text-[9px] uppercase">🛹 SKATE_CORE</span>`;
        } else if (item.kategori === 'Perlengkapan') {
            katBadge = `<span class="bg-orange-950/60 text-orange-400 px-2 py-0.5 border border-orange-800/40 font-bold text-[9px] uppercase">🛠️ HARDWARE</span>`;
        } else if (item.kategori === 'Apparel') {
            katBadge = `<span class="bg-zinc-900 text-zinc-400 px-2 py-0.5 border border-zinc-700 font-bold text-[9px] uppercase">👕 APPAREL</span>`;
        }

        const stokBadge = currentStock <= 5 
            ? `<span class="bg-red-950 text-red-500 border border-red-600 px-2 py-0.5 font-bold text-[10px] animate-pulse">☠️ CRITICAL_${currentStock}</span>`
            : `<span class="bg-stone-900 text-slate-300 border border-stone-800 px-2 py-0.5 font-bold text-[10px]">${currentStock} UNITS</span>`;

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
                        DELETE
                    </button>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    container.innerHTML = tableHtml;

    document.getElementById('totalItems').innerText = products.length;
    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalOmset').innerText = 'Rp ' + omsetSimulasi.toLocaleString('id-ID');
    document.getElementById('totalProfit').innerText = 'Rp ' + profitSimulasi.toLocaleString('id-ID');
    document.getElementById('totalSalesCount').innerText = totalTerjualCount + " Records";
}

async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[SYS_ALERT] DESTROY "${namaBarang.toUpperCase()}" FROM CLOUD DATABASE PERMANENTLY?`);
    if (konfirmasi) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else loadDashboard();
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
