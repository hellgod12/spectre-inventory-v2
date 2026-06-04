const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const expenseForm = document.getElementById('expenseForm');
const btnTambah = document.getElementById('btnTambah');
const expenseContainer = document.getElementById('expenseContainer');
const expenseProgressFill = document.getElementById('expenseProgressFill');
const expenseProgressText = document.getElementById('expenseProgressText');
const expenseProgressLabel = document.getElementById('expenseProgressLabel');
const expenseStatus = document.getElementById('expenseStatus');

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

async function loadExpenses() {
    const { data: expenses, error } = await supabaseClient
        .from('expenses')
        .select('*')
        .order('tanggal', { ascending: false })
        .limit(20);

    if (error) {
        expenseContainer.innerHTML = `<div class="p-8 text-center text-red-500 text-xs uppercase">>> Gagal memuat pengeluaran: ${error.message}</div>`;
        return;
    }

    if (!expenses || expenses.length === 0) {
        expenseContainer.innerHTML = `<div class="p-8 text-center text-slate-500 text-xs uppercase">>> Belum ada pengeluaran tercatat</div>`;
        updateExpenseProgress([]);
        return;
    }

    let html = `
        <table class="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
                <tr class="bg-black/60 border-b border-red-950 text-red-500/80 uppercase text-[10px]">
                    <th class="p-3 font-bold tracking-wider">TANGGAL</th>
                    <th class="p-3 font-bold tracking-wider">KETERANGAN</th>
                    <th class="p-3 font-bold tracking-wider">KATEGORI</th>
                    <th class="p-3 font-bold text-right tracking-wider">NOMINAL</th>
                    <th class="p-3 font-bold tracking-wider">CATATAN</th>
                </tr>
            </thead>
            <tbody class="bg-black/45 divide-y divide-red-950/25">

    `;

    let totalExpense = 0;
    expenses.forEach(expense => {
        totalExpense += parseFloat(expense.nominal || 0);
        const tanggalObj = new Date(expense.tanggal);
        const tanggalFormat = tanggalObj.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });

        let katBadge = `<span class="bg-stone-900 text-stone-400 px-2 py-0.5 border border-stone-800 text-[9px] uppercase">${expense.kategori}</span>`;
        if (expense.kategori === 'Pembelian Stok') katBadge = `<span class="bg-blue-950/60 text-blue-400 px-2 py-0.5 border border-blue-800/50 text-[9px] uppercase">📦 STOK</span>`;
        if (expense.kategori === 'Operasional') katBadge = `<span class="bg-purple-950/60 text-purple-400 px-2 py-0.5 border border-purple-800/50 text-[9px] uppercase">💼 OPERASIONAL</span>`;
        if (expense.kategori === 'Listrik') katBadge = `<span class="bg-yellow-950/60 text-yellow-400 px-2 py-0.5 border border-yellow-800/50 text-[9px] uppercase">⚡ LISTRIK</span>`;
        if (expense.kategori === 'Transport') katBadge = `<span class="bg-orange-950/60 text-orange-400 px-2 py-0.5 border border-orange-800/50 text-[9px] uppercase">🚚 TRANSPORT</span>`;
        if (expense.kategori === 'Gaji') katBadge = `<span class="bg-green-950/60 text-green-400 px-2 py-0.5 border border-green-800/50 text-[9px] uppercase">👥 GAJI</span>`;

        html += `
            <tr class="hover:bg-red-950/15 transition-colors">
                <td class="p-3 text-red-500 font-bold">${tanggalFormat}</td>
                <td class="p-3 font-bold text-white uppercase">${expense.keterangan}</td>
                <td class="p-3">${katBadge}</td>
                <td class="p-3 text-right text-red-400 font-bold">Rp ${Number(expense.nominal).toLocaleString('id-ID')}</td>
                <td class="p-3 text-slate-400 text-[10px]">${expense.catatan || '-'}</td>
            </tr>

        `;
    });

    html += `</tbody></table>`;
    expenseContainer.innerHTML = html;
    updateExpenseProgress(expenses);
}

function updateExpenseProgress(expenses = []) {
    const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.nominal) || 0), 0);
    const targetBudget = 2000000; // Target budget default 2M
    const percent = totalExpense ? Math.min(100, Math.round((totalExpense / targetBudget) * 100)) : 0;


    if (expenseProgressFill) expenseProgressFill.style.width = `${percent}%`;
    if (expenseProgressText) expenseProgressText.innerText = `${percent}% terserap`;
    if (expenseProgressLabel) expenseProgressLabel.innerText = totalExpense ? 'DISIKAT KELUAR' : 'MENUNGGU';

    // Update KPI cards
    const expenseTotalEl = document.getElementById('expenseTotal');
    const expenseMonthlyEl = document.getElementById('expenseMonthly');
    const expenseAverageEl = document.getElementById('expenseAverage');
    const expenseLargestEl = document.getElementById('expenseLargest');

    if (expenseTotalEl) expenseTotalEl.innerText = 'Rp ' + totalExpense.toLocaleString('id-ID');

    // Calculate monthly expenses (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.tanggal);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + (parseFloat(e.nominal) || 0), 0);
    if (expenseMonthlyEl) expenseMonthlyEl.innerText = 'Rp ' + monthlyTotal.toLocaleString('id-ID');

    // Calculate average expense
    const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
    if (expenseAverageEl) expenseAverageEl.innerText = 'Rp ' + averageExpense.toLocaleString('id-ID');

    // Calculate largest expense
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => parseFloat(e.nominal) || 0)) : 0;
    if (expenseLargestEl) expenseLargestEl.innerText = 'Rp ' + largestExpense.toLocaleString('id-ID');
}

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnTambah.innerText = 'MEMPROSES...';
    btnTambah.disabled = true;

    const keterangan = document.getElementById('keterangan').value;
    const kategori = document.getElementById('kategori').value;
    const nominal = parseFloat(document.getElementById('nominal').value);
    const tanggal = document.getElementById('tanggal').value;
    const catatan = document.getElementById('catatan').value || null;

    const { data, error } = await supabaseClient
        .from('expenses')
        .insert([{ keterangan, kategori, nominal, tanggal, catatan }]);

    if (error) {
        alert('❌ GAGAL CATAT: ' + error.message);
        expenseStatus.innerHTML = `<strong class="block text-red-400 mb-2">ERROR PENCATATAN</strong><span>${error.message}</span>`;
    } else {
        alert(`✅ PENGELUARAN TERCATAT // Rp ${Number(nominal).toLocaleString('id-ID')} untuk "${keterangan.toUpperCase()}"`);
        expenseForm.reset();
        expenseStatus.innerHTML = `
            <strong class="block text-emerald-300 mb-2">PENCATATAN BERHASIL</strong>
            <span>Rp ${Number(nominal).toLocaleString('id-ID')} telah dicatat untuk ${keterangan}.</span>
        `;
        await loadExpenses();
        showToast('PENGELUARAN TERCATAT // Aliran dana terpantau.');
    }

    btnTambah.innerText = 'CATAT_PENGELUARAN';
    btnTambah.disabled = false;
});



document.addEventListener('DOMContentLoaded', loadExpenses);
