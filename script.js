// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js

// Load marketplace data for combined POS + Marketplace analytics (Manual Entry System)
// This ensures marketplace data is included in dashboard metrics

// Sidebar Toggle Functionality
function toggleSidebar() {
    const sidebar = document.querySelector('.spectre-sidebar');
    sidebar.classList.toggle('spectre-sidebar--collapsed');
}

function formatCurrency(value) {
    return 'Rp ' + Number(value).toLocaleString('id-ID');
}

function isMobile() {
    return window.innerWidth < 640; // cocok untuk iPhone/Android (Tailwind sm)
}

// Populate user profile section
async function populateUserProfile() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            const userEmail = user.email;
            const userAvatarEl = document.getElementById('userAvatar');
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            
            if (userAvatarEl) {
                userAvatarEl.textContent = userEmail.charAt(0).toUpperCase();
            }
            if (userNameEl) {
                userNameEl.textContent = userEmail.split('@')[0];
            }
            if (userRoleEl) {
                // Determine role based on email
                if (userEmail.includes('admin')) {
                    userRoleEl.textContent = 'Administrator';
                } else if (userEmail.includes('kasir')) {
                    userRoleEl.textContent = 'Cashier';
                } else {
                    userRoleEl.textContent = 'User';
                }
            }
        }
    } catch (error) {
        console.error('Error populating user profile:', error);
    }
}

// Populate dashboard hero section
async function populateDashboardHero() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            const userEmail = user.email;
            const dashboardUsernameEl = document.getElementById('dashboardUsername');
            const dashboardRoleEl = document.getElementById('dashboardRole');
            const dashboardDateEl = document.getElementById('dashboardDate');
            
            if (dashboardUsernameEl) {
                dashboardUsernameEl.textContent = userEmail.split('@')[0];
            }
            if (dashboardRoleEl) {
                if (userEmail.includes('admin')) {
                    dashboardRoleEl.textContent = 'Administrator';
                } else if (userEmail.includes('kasir')) {
                    dashboardRoleEl.textContent = 'Cashier';
                } else {
                    dashboardRoleEl.textContent = 'User';
                }
            }
            if (dashboardDateEl) {
                const now = new Date();
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dashboardDateEl.textContent = now.toLocaleDateString('en-US', options);
            }
        }
    } catch (error) {
        console.error('Error populating dashboard hero:', error);
    }
}

// Update system status timestamp
function updateSystemStatusTimestamp() {
    const timestampEl = document.getElementById('systemStatusLastUpdated');
    if (timestampEl) {
        const now = new Date();
        timestampEl.textContent = now.toLocaleTimeString();
    }
}

// Animated counter for statistics
function animateCounter(element, targetValue, duration = 1000) {
    const startValue = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (targetValue - startValue) * easeOut;
        
        if (typeof targetValue === 'number') {
            element.textContent = Math.round(currentValue).toLocaleString('id-ID');
        } else {
            // For currency values, format as Rp
            element.textContent = 'Rp ' + Math.round(currentValue).toLocaleString('id-ID');
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Show loading skeleton
function showLoadingSkeleton() {
    const kpiCards = document.querySelectorAll('.spectre-kpi-card');
    kpiCards.forEach(card => {
        const valueEl = card.querySelector('.spectre-kpi-value');
        if (valueEl) {
            const originalText = valueEl.textContent;
            valueEl.innerHTML = '<div class="skeleton skeleton-value"></div>';
            valueEl.dataset.originalValue = originalText;
        }
    });
}

// Hide loading skeleton and show actual values
function hideLoadingSkeleton() {
    const kpiCards = document.querySelectorAll('.spectre-kpi-card');
    kpiCards.forEach(card => {
        const valueEl = card.querySelector('.spectre-kpi-value');
        if (valueEl && valueEl.dataset.originalValue) {
            valueEl.textContent = valueEl.dataset.originalValue;
            delete valueEl.dataset.originalValue;
        }
    });
}

// Add ripple effect to buttons
function addRippleEffect() {
    const buttons = document.querySelectorAll('.spectre-btn, .spectre-cta');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Safe growth calculation function
// Returns growth percentage as a string with arrow indicator
// Returns "0%" if previous value is 0 or data is invalid
function calculateGrowth(currentValue, previousValue) {
    if (previousValue === 0 || previousValue === null || previousValue === undefined || isNaN(previousValue)) {
        return '0%';
    }
    if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
        return '0%';
    }

    const growth = ((currentValue - previousValue) / previousValue) * 100;
    
    // Handle edge cases
    if (!isFinite(growth) || isNaN(growth)) {
        return '0%';
    }

    const arrow = growth >= 0 ? '↑' : '↓';
    const percentage = Math.abs(growth).toFixed(1);
    return `${arrow} ${percentage}%`;
}


function makeSkuFromNamaBarang(nama) {
    const txt = String(nama || '').trim().toUpperCase();
    if (!txt) return '';
    return txt
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
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

    if (supabaseError) {
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
        alert('Gagal konfirmasi pembayaran: ' + error.message);
        return;
    }

    // animasi pembayaran turun/naik saat konfirmasi (di HP)
    try {
        window.CandleManager?.applyPaymentDelta?.();
        localStorage.setItem('candle_payment_delta', JSON.stringify({ t: Date.now() }));
    } catch (e) {}

    await loadPayments();
}


async function renderCandlestickChartFromSalesHistory(salesHistory = []) {
    const canvas = document.getElementById('candlestickChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 320;
    const cssH = 360;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = cssW;
    const height = cssH;
    ctx.clearRect(0, 0, width, height);

    const padL = 60;
    const padR = 20;
    const padT = 40;
    const padB = 50;

    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padT + (plotH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
        const x = padL + (plotW / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + plotH);
        ctx.stroke();
    }

    // Parse sales data
    const parseDate = (v) => {
        try {
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
        } catch (e) {}
        return null;
    };

    // Combine POS sales_history with marketplace orders
    let items = (salesHistory || [])
        .map(s => ({
            type: 'POS',
            t: parseDate(s.created_at),
            v: Number(s.total_harga || 0)
        }))
        .filter(x => x.t && Number.isFinite(x.v));

    // Add marketplace orders to chart data (Manual Entry System)
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: onlineOrders } = await supabaseClient
            .from('online_orders')
            .select('created_at, gross_sales')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false });
        
        if (onlineOrders) {
            const marketplaceItems = onlineOrders
                .map(o => ({
                    type: 'MARKETPLACE',
                    t: parseDate(o.created_at),
                    v: Number(o.gross_sales || 0)
                }))
                .filter(x => x.t && Number.isFinite(x.v));
            
            items = items.concat(marketplaceItems);
        }
    } catch (error) {
        console.error('Error loading marketplace orders for chart:', error);
    }

    // Generate professional placeholder chart if insufficient data
    if (items.length < 2) {
        drawPlaceholderChart(ctx, width, height, padL, padR, padT, padB, plotW, plotH);
        return;
    }

    // Sort by time and bucket by day
    items.sort((a, b) => a.t - b.t);

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
            const total = arr.reduce((sum, x) => sum + x.v, 0);
            const count = arr.length;
            return { key, total, count };
        })
        .sort((a, b) => a.key.localeCompare(b.key));

    const maxBuckets = 7;
    const sliced = buckets.slice(Math.max(0, buckets.length - maxBuckets));

    if (sliced.length < 2) {
        drawPlaceholderChart(ctx, width, height, padL, padR, padT, padB, plotW, plotH);
        return;
    }

    // Calculate scales
    const values = sliced.map(b => b.total);
    const maxY = Math.max(...values);
    const minY = 0;
    const span = maxY - minY || 1;

    const xToPx = (i) => padL + (plotW / (sliced.length - 1)) * i;
    const yToPx = (y) => padT + (1 - (y - minY) / span) * plotH;

    // Draw Revenue Trend (area chart with gradient)
    drawAreaChart(ctx, sliced, xToPx, yToPx, 'rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 1)', padT, plotH);

    // Draw axes labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
        const val = minY + (span / 4) * i;
        const y = yToPx(val);
        ctx.textAlign = 'right';
        ctx.fillText(formatCompactNumber(val), padL - 10, y + 4);
    }

    // X-axis labels
    for (let i = 0; i < sliced.length; i++) {
        const x = xToPx(i);
        const label = sliced[i].key.slice(5); // MM-DD
        ctx.textAlign = 'center';
        ctx.fillText(label, x, height - padB + 20);
    }

    // Chart title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Revenue Trend', padL, padT - 15);
}

function drawPlaceholderChart(ctx, width, height, padL, padR, padT, padB, plotW, plotH) {
    // Generate smooth placeholder data
    const points = 7;
    const data = [];
    for (let i = 0; i < points; i++) {
        const x = i / (points - 1);
        const y = 0.3 + 0.4 * Math.sin(x * Math.PI * 2) + 0.2 * Math.random();
        data.push({ x, y });
    }

    const xToPx = (i) => padL + (plotW / (points - 1)) * i;
    const yToPx = (y) => padT + (1 - y) * plotH;

    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

    ctx.beginPath();
    ctx.moveTo(xToPx(0), padT + plotH);
    for (let i = 0; i < points; i++) {
        ctx.lineTo(xToPx(i), yToPx(data[i].y));
    }
    ctx.lineTo(xToPx(points - 1), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(xToPx(0), yToPx(data[0].y));
    for (let i = 0; i < points; i++) {
        ctx.lineTo(xToPx(i), yToPx(data[i].y));
    }
    ctx.strokeStyle = 'rgba(99, 102, 241, 1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw axes labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
        const val = i / 4;
        const y = padT + (1 - val) * plotH;
        ctx.textAlign = 'right';
        ctx.fillText(formatCompactNumber(val * 1000000), padL - 10, y + 4);
    }

    // X-axis labels
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < points; i++) {
        const x = xToPx(i);
        ctx.textAlign = 'center';
        ctx.fillText(days[i], x, height - padB + 20);
    }

    // Chart title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Revenue Trend', padL, padT - 15);
}

function drawAreaChart(ctx, data, xToPx, yToPx, fillColor, strokeColor, padT, plotH) {
    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, fillColor.replace('0.3', '0.05').replace('0.4', '0.05'));

    ctx.beginPath();
    ctx.moveTo(xToPx(0), padT + plotH);
    for (let i = 0; i < data.length; i++) {
        ctx.lineTo(xToPx(i), yToPx(data[i].total));
    }
    ctx.lineTo(xToPx(data.length - 1), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(xToPx(0), yToPx(data[0].total));
    for (let i = 0; i < data.length; i++) {
        ctx.lineTo(xToPx(i), yToPx(data[i].total));
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function formatCompactNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toFixed(0);
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
    
    // Populate user profile section
    await populateUserProfile();
    
    // Populate dashboard hero section
    await populateDashboardHero();
    
    // Update system status timestamp
    updateSystemStatusTimestamp();
    
    // Show loading skeleton
    showLoadingSkeleton();
    
    // Add ripple effect to buttons
    addRippleEffect();
    
    // Add card animation to KPI cards
    const kpiCards = document.querySelectorAll('.spectre-kpi-card');
    kpiCards.forEach((card, index) => {
        card.classList.add('card-animate');
    });
    
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
    let pendingRevenue = 0;

    // Load combined POS + Marketplace data for dashboard (Manual Entry System)
    let combinedRevenue = 0;
    let combinedProfit = 0;
    let combinedOrders = 0;
    let marketplaceRevenue = 0;
    let marketplaceProfit = 0;
    let marketplaceOrders = 0;

    // Profit per produk (modal vs revenue terjual)
    // profitProduk[p.nama_barang] = { nama_barang, kategori, ukuran, profit, revenue, modalTotal, qty }
    const profitProduk = new Map();

    // Hitung sisa stok di gudang saat ini (dari tabel products)
    if (products) {
        products.forEach(item => { totalStock += parseInt(item.stok || 0); });
        document.getElementById('totalItems').innerText = products.length;
    }

    // Pre-map produk modal per nama_barang (for profit calculation)
    const modalMap = new Map();
    (products || []).forEach(p => {
        modalMap.set(String(p.nama_barang || '').toUpperCase(), parseFloat(p.harga_modal || 0));
    });

    // Hitung total penjualan dari tabel riwayat (untuk items sold count)
    // Items Sold = SUM(jumlah) dari transaksi yang masih ada
    if (salesHistory) {
        salesHistory.forEach(sale => {
            const nama = String(sale.nama_barang || '').toUpperCase();
            const qty = parseInt(sale.jumlah || 0);
            const revenue = parseFloat(sale.total_harga || 0);
            const modalSatuan = modalMap.get(nama) || 0;
            const totalModal = modalSatuan * qty;

            totalTerjualCount += qty;

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

    // Calculate revenue from payments table (only paid invoices)
    // Revenue = SUM(paid_amount) dari transaksi PAID yang masih ada
    const { data: payments } = await supabaseClient.from('payments').select('*');
    omsetAsli = 0;
    pendingRevenue = 0;
    if (payments) {
        payments.forEach(payment => {
            if (payment.status === 'paid') {
                omsetAsli += parseFloat(payment.paid_amount || 0);
            } else if (payment.status === 'pending' || payment.status === 'partial') {
                pendingRevenue += parseFloat(payment.remaining_amount || 0);
            }
        });
    }

    // Calculate profit from sales_history (for cost tracking)
    if (salesHistory) {
        salesHistory.forEach(sale => {
            const nama = String(sale.nama_barang || '').toUpperCase();
            const revenue = parseFloat(sale.total_harga || 0);
            const modalSatuan = modalMap.get(nama) || 0;
            const qty = parseInt(sale.jumlah || 0);
            const totalModal = modalSatuan * qty;
            profitAsli += (revenue - totalModal);
        });
    }

    const profitBersih = profitAsli - totalExpenses;

    // Load combined POS + Marketplace data for dashboard (Manual Entry System)
    // This must be after POS data calculations to ensure omsetAsli, profitAsli, totalTerjualCount are initialized
    try {
        // Get marketplace data directly from online_orders table (Manual Entry)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: onlineOrders } = await supabaseClient
            .from('online_orders')
            .select('gross_sales, net_revenue')
            .gte('created_at', thirtyDaysAgo.toISOString());
        
        if (onlineOrders) {
            marketplaceRevenue = onlineOrders.reduce((sum, o) => sum + (parseFloat(o.gross_sales) || 0), 0);
            marketplaceProfit = onlineOrders.reduce((sum, o) => sum + (parseFloat(o.net_revenue) || 0), 0);
            marketplaceOrders = onlineOrders.length;
            
            combinedRevenue = omsetAsli + marketplaceRevenue;
            combinedProfit = profitAsli + marketplaceProfit;
            combinedOrders = totalTerjualCount + marketplaceOrders;
        }
    } catch (error) {
        console.error('Error loading marketplace data:', error);
        // Fallback to POS-only data if marketplace data fails to load
        combinedRevenue = omsetAsli;
        combinedProfit = profitAsli;
        combinedOrders = totalTerjualCount;
    }

    // Use combined data for dashboard KPIs (POS + Marketplace)
    // If combined data is available, use it; otherwise fallback to POS-only data
    const displayRevenue = combinedRevenue > 0 ? combinedRevenue : omsetAsli;
    const displayProfit = combinedProfit > 0 ? combinedProfit : profitBersih;
    const displayOrders = combinedOrders > 0 ? combinedOrders : totalTerjualCount;

    document.getElementById('totalStock').innerText = totalStock;
    document.getElementById('totalOmset').innerText = 'Rp ' + displayRevenue.toLocaleString('id-ID');
    document.getElementById('totalProfit').innerText = 'Rp ' + displayProfit.toLocaleString('id-ID');
    document.getElementById('totalSalesCount').innerText = displayOrders + " Barang";

    // Hide loading skeleton after data is loaded
    hideLoadingSkeleton();
    
    // Animate counters for key statistics
    const totalOmsetEl = document.getElementById('totalOmset');
    const totalProfitEl = document.getElementById('totalProfit');
    const totalStockEl = document.getElementById('totalStock');
    
    if (totalOmsetEl) {
        animateCounter(totalOmsetEl, displayRevenue, 1200);
    }
    if (totalProfitEl) {
        animateCounter(totalProfitEl, displayProfit, 1200);
    }
    if (totalStockEl) {
        animateCounter(totalStockEl, totalStock, 800);
    }

    // Update KPI cards (separate from Inventory Overview to avoid duplicate ID conflicts)
    const kpiTotalItemsEl = document.getElementById('kpiTotalItems');
    const kpiTotalStockEl = document.getElementById('kpiTotalStock');
    if (kpiTotalItemsEl) kpiTotalItemsEl.innerText = products.length;
    if (kpiTotalStockEl) kpiTotalStockEl.innerText = totalStock;
    document.getElementById('totalExpenses').innerText = 'Rp ' + totalExpenses.toLocaleString('id-ID');
    document.getElementById('netProfit').innerText = 'Rp ' + displayProfit.toLocaleString('id-ID');

    // Update trend indicators - set to 0% since we don't have historical data
    const revenueTrendEl = document.getElementById('revenueTrend');
    const profitTrendEl = document.getElementById('profitTrend');
    const expensesTrendEl = document.getElementById('expensesTrend');
    const balanceTrendEl = document.getElementById('balanceTrend');
    const salesTrendEl = document.getElementById('salesTrend');
    const membersTrendEl = document.getElementById('membersTrend');
    const productsTrendEl = document.getElementById('productsTrend');
    const stockTrendEl = document.getElementById('stockTrend');

    // Calculate marketplace contribution for trend indicators
    const marketplaceRevenuePercent = displayRevenue > 0 ? (marketplaceRevenue / displayRevenue * 100).toFixed(0) : 0;
    const marketplaceOrdersPercent = displayOrders > 0 ? (marketplaceOrders / displayOrders * 100).toFixed(0) : 0;

    if (revenueTrendEl) {
        if (marketplaceRevenue > 0) {
            revenueTrendEl.innerText = `↑ ${marketplaceRevenuePercent}% Marketplace`;
            revenueTrendEl.classList.add('spectre-kpi-trend--up');
        } else {
            revenueTrendEl.innerText = '↑ 0%';
        }
    }
    if (profitTrendEl) profitTrendEl.innerText = '↑ 0%';
    if (expensesTrendEl) expensesTrendEl.innerText = '↓ 0%';
    if (balanceTrendEl) balanceTrendEl.innerText = '↑ 0%';
    if (salesTrendEl) {
        if (marketplaceOrders > 0) {
            salesTrendEl.innerText = `↑ ${marketplaceOrdersPercent}% Marketplace`;
            salesTrendEl.classList.add('spectre-kpi-trend--up');
        } else {
            salesTrendEl.innerText = '↑ 0%';
        }
    }
    if (membersTrendEl) membersTrendEl.innerText = '↑ 0%';
    if (productsTrendEl) productsTrendEl.innerText = '↑ 0%';
    if (stockTrendEl) stockTrendEl.innerText = '↑ 0%';

    // Calculate inventory value and low stock items for main dashboard Inventory Overview
    let totalModalBarang = 0;
    let inventoryValue = 0;
    let lowStockItems = 0;

    if (products && products.length > 0) {
        products.forEach(item => {
            const currentStock = parseInt(item.stok || 0);
            const baseCost = parseFloat(item.harga_modal || 0);

            // Calculate total sold for this product from sales_history
            const totalSold = (salesHistory || [])
                .filter(s => s.product_id === item.id)
                .reduce((sum, s) => sum + (parseInt(s.jumlah) || 0), 0);

            const initialStock = currentStock + totalSold;

            // Total Modal Barang = initial_stock × base_cost
            totalModalBarang += initialStock * baseCost;

            // Inventory Value = current_stock × base_cost
            inventoryValue += currentStock * baseCost;

            if (currentStock <= 5) {
                lowStockItems++;
            }
        });
    }

    // Update main dashboard Inventory Overview elements
    const inventoryValueEl = document.getElementById('inventoryValue');
    const lowStockItemsEl = document.getElementById('lowStockItems');
    const totalModalBarangEl = document.getElementById('totalModalBarang');
    
    if (inventoryValueEl) inventoryValueEl.innerText = 'Rp ' + inventoryValue.toLocaleString('id-ID');
    if (lowStockItemsEl) lowStockItemsEl.innerText = lowStockItems;
    if (totalModalBarangEl) totalModalBarangEl.innerText = 'Rp ' + totalModalBarang.toLocaleString('id-ID');

    // Render invoices in Invoice Management section (POS + Marketplace)
    const invoiceContainer = document.getElementById('invoiceContainer');
    if (invoiceContainer) {
        let combinedTransactions = [];
        
        // Add POS payments
        if (payments) {
            payments.forEach(payment => {
                combinedTransactions.push({
                    type: 'POS',
                    id: payment.id,
                    invoice_number: payment.invoice_number || 'POS-' + payment.id.substring(0, 8),
                    product: payment.product || 'Unknown',
                    quantity: payment.jumlah || 0,
                    total: payment.total_harga || 0,
                    paid: payment.paid_amount || 0,
                    remaining: payment.remaining_amount || 0,
                    status: payment.status || 'pending',
                    created_at: payment.created_at,
                    buyer: payment.buyer || 'Walk-in'
                });
            });
        }
        
        // Add marketplace orders (Manual Entry System)
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data: onlineOrders } = await supabaseClient
                .from('online_orders')
                .select(`
                    *,
                    marketplace_accounts (
                        platform,
                        shop_name
                    ),
                    order_items (
                        product_name,
                        quantity,
                        unit_price
                    )
                `)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (onlineOrders) {
                onlineOrders.forEach(order => {
                    const firstItem = order.order_items && order.order_items[0] ? order.order_items[0] : {};
                    combinedTransactions.push({
                        type: 'MARKETPLACE',
                        id: order.id,
                        invoice_number: order.order_number || 'MKT-' + order.id.substring(0, 8),
                        product: firstItem.product_name || 'Unknown',
                        quantity: firstItem.quantity || 0,
                        total: order.gross_sales || 0,
                        paid: order.net_revenue || 0,
                        remaining: 0,
                        status: order.order_status === 'COMPLETED' || order.order_status === 'DELIVERED' ? 'paid' : 'pending',
                        created_at: order.created_at,
                        buyer: order.customer_name || 'Online Customer',
                        platform: order.marketplace_accounts?.platform || 'Unknown'
                    });
                });
            }
        } catch (error) {
            console.error('Error loading marketplace orders for invoice container:', error);
        }
        
        // Sort by date
        combinedTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (combinedTransactions.length === 0) {
            invoiceContainer.innerHTML = '<div class="p-8 text-center text-muted text-xs">No transactions found</div>';
        } else {
            let invoiceHtml = '<div class="space-y-3">';
            combinedTransactions.forEach(transaction => {
                const statusColors = {
                    'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                    'partial': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    'paid': 'bg-green-500/20 text-green-400 border-green-500/30',
                    'cancelled': 'bg-red-500/20 text-red-400 border-red-500/30'
                };
                const statusColor = statusColors[transaction.status] || statusColors['pending'];
                const typeBadge = transaction.type === 'POS' 
                    ? '<span class="px-2 py-1 text-xs font-semibold rounded bg-purple-500/20 text-purple-400 border-purple-500/30">POS</span>'
                    : `<span class="px-2 py-1 text-xs font-semibold rounded bg-orange-500/20 text-orange-400 border-orange-500/30">${transaction.platform || 'MKT'}</span>`;

                invoiceHtml += `
                    <div class="p-4 bg-black/50 border border-stone-800 rounded-lg">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    ${typeBadge}
                                    <div class="text-xs text-muted">${transaction.invoice_number}</div>
                                </div>
                                <div class="font-semibold text-white">${transaction.product}</div>
                                <div class="text-xs text-muted">Qty: ${transaction.quantity} • ${transaction.buyer}</div>
                            </div>
                            <span class="px-2 py-1 text-xs font-semibold rounded border ${statusColor}">${transaction.status?.toUpperCase() || 'PENDING'}</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-xs mb-3">
                            <div>
                                <div class="text-muted">Total</div>
                                <div class="font-semibold">Rp ${transaction.total.toLocaleString('id-ID')}</div>
                            </div>
                            <div>
                                <div class="text-muted">Paid</div>
                                <div class="font-semibold text-green-400">Rp ${transaction.paid.toLocaleString('id-ID')}</div>
                            </div>
                            <div>
                                <div class="text-muted">Remaining</div>
                                <div class="font-semibold text-yellow-400">Rp ${transaction.remaining.toLocaleString('id-ID')}</div>
                            </div>
                        </div>
                        ${transaction.type === 'POS' && transaction.status !== 'paid' && transaction.status !== 'cancelled' ? `
                            <div class="flex gap-2">
                                <button onclick="window.addPartialPayment('${transaction.id}', ${transaction.remaining})" class="flex-1 px-3 py-2 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition">Add Payment</button>
                                ${transaction.status === 'partial' ? `
                                    <button onclick="window.markAsPaid('${transaction.id}')" class="flex-1 px-3 py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition">Mark Paid</button>
                                ` : ''}
                                <button onclick="window.cancelInvoice('${transaction.id}')" data-role="admin-only" class="flex-1 px-3 py-2 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition">Cancel</button>
                            </div>
                        ` : ''}
                        ${transaction.type === 'POS' ? `
                            <button onclick="window.deleteTransaction('${transaction.id}')" data-role="admin-only" class="w-full mt-2 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition">Delete Permanently</button>
                        ` : `
                            <a href="marketplace.html" class="w-full mt-2 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition block text-center">View in Marketplace</a>
                        `}
                    </div>
                `;
            });
            invoiceHtml += '</div>';
            invoiceContainer.innerHTML = invoiceHtml;
        }
    }

    // Render Outstanding Payments widget (member debt)
    const outstandingContainer = document.getElementById('outstandingContainer');
    if (outstandingContainer && payments) {
        // Filter for member transactions with remaining balance
        const memberPayments = payments.filter(p => 
            p.buyer && p.buyer.includes('Member') && 
            p.status !== 'paid' && 
            p.status !== 'cancelled' &&
            (p.remaining_amount || 0) > 0
        );

        // Group by member
        const memberDebt = new Map();
        memberPayments.forEach(payment => {
            const memberName = payment.buyer.replace('Member (', '').replace(')', '');
            const currentDebt = memberDebt.get(memberName) || 0;
            memberDebt.set(memberName, currentDebt + (payment.remaining_amount || 0));
        });

        const totalOutstanding = Array.from(memberDebt.values()).reduce((sum, debt) => sum + debt, 0);

        if (memberDebt.size === 0) {
            outstandingContainer.innerHTML = '<div class="p-8 text-center text-muted text-xs">No outstanding payments</div>';
        } else {
            let outstandingHtml = '<div class="space-y-3">';
            outstandingHtml += `
                <div class="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-muted">Total Outstanding</span>
                        <span class="font-semibold text-red-400">Rp ${totalOutstanding.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            `;

            memberDebt.forEach((debt, memberName) => {
                outstandingHtml += `
                    <div class="p-3 bg-black/50 border border-stone-800 rounded-lg flex justify-between items-center">
                        <div>
                            <div class="font-semibold text-white text-sm">${memberName}</div>
                            <div class="text-xs text-muted">Member</div>
                        </div>
                        <span class="font-semibold text-red-400 text-sm">Rp ${debt.toLocaleString('id-ID')}</span>
                    </div>
                `;
            });

            outstandingHtml += '</div>';
            outstandingContainer.innerHTML = outstandingHtml;
        }
    }

    // Make invoice management functions globally accessible
    window.addPartialPayment = async function(invoiceId, paymentAmount) {
        const amount = prompt('Enter payment amount:', paymentAmount);
        if (amount === null) return;

        const paymentAmountNum = parseFloat(amount);
        if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
            alert('Invalid payment amount');
            return;
        }

        try {
            const { data: invoice } = await supabaseClient
                .from('payments')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (!invoice) {
                alert('Invoice not found');
                return;
            }

            if (invoice.status === 'cancelled') {
                alert('Cannot add payment to cancelled invoice');
                return;
            }

            const newPaidAmount = invoice.paid_amount + paymentAmountNum;
            const newRemainingAmount = invoice.remaining_amount - paymentAmountNum;
            let newStatus = invoice.status;

            if (newRemainingAmount <= 0) {
                newStatus = 'paid';
            } else if (newPaidAmount > 0) {
                newStatus = 'partial';
            }

            const { error } = await supabaseClient
                .from('payments')
                .update({
                    paid_amount: newPaidAmount,
                    remaining_amount: Math.max(0, newRemainingAmount),
                    status: newStatus,
                    confirmed_at: newStatus === 'paid' ? new Date().toISOString() : null
                })
                .eq('id', invoiceId);

            if (error) {
                alert('Failed to add payment: ' + error.message);
            } else {
                alert('Payment added successfully');
                location.reload();
            }
        } catch (err) {
            alert('Error adding payment: ' + err.message);
        }
    };

    window.markAsPaid = async function(invoiceId) {
        if (!confirm('Mark this invoice as fully paid?')) return;

        try {
            const { data: invoice } = await supabaseClient
                .from('payments')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (!invoice) {
                alert('Invoice not found');
                return;
            }

            const { error } = await supabaseClient
                .from('payments')
                .update({
                    paid_amount: invoice.total_harga,
                    remaining_amount: 0,
                    status: 'paid',
                    confirmed_at: new Date().toISOString()
                })
                .eq('id', invoiceId);

            if (error) {
                alert('Failed to mark as paid: ' + error.message);
            } else {
                alert('Invoice marked as paid');
                location.reload();
            }
        } catch (err) {
            alert('Error marking as paid: ' + err.message);
        }
    };

    window.cancelInvoice = async function(invoiceId) {
        // Role check: Only ADMIN can cancel invoices
        if (!requireAdmin()) {
            return;
        }

        if (!confirm('Cancel this invoice and restore stock?')) return;

        try {
            const { data: invoice } = await supabaseClient
                .from('payments')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (!invoice) {
                alert('Invoice not found');
                return;
            }

            if (invoice.status === 'cancelled') {
                alert('Invoice already cancelled');
                return;
            }

            // Find related sales_history records
            const { data: salesHistory } = await supabaseClient
                .from('sales_history')
                .select('*')
                .eq('payment_id', invoiceId);

            if (salesHistory && salesHistory.length > 0) {
                // Restore stock for each sales record
                for (const sale of salesHistory) {
                    const { data: product } = await supabaseClient
                        .from('products')
                        .select('stok')
                        .eq('id', sale.product_id)
                        .single();

                    if (product) {
                        const newStock = product.stok + sale.jumlah;
                        await supabaseClient
                            .from('products')
                            .update({ stok: newStock })
                            .eq('id', sale.product_id);
                    }
                }
            }

            // Update invoice status to cancelled
            const { error } = await supabaseClient
                .from('payments')
                .update({ status: 'cancelled' })
                .eq('id', invoiceId);

            if (error) {
                alert('Failed to cancel invoice: ' + error.message);
            } else {
                alert('Invoice cancelled and stock restored');
                location.reload();
            }
        } catch (err) {
            alert('Error cancelling invoice: ' + err.message);
        }
    };

    window.deleteTransaction = async function(invoiceId) {
        // Role check: Only ADMIN can delete transactions
        if (!requireAdmin()) {
            return;
        }

        if (!confirm('Yakin ingin menghapus transaksi ini? Semua data penjualan dan pembayaran akan dihapus.')) return;

        try {
            console.log('=== DELETE TRANSACTION START ===');
            console.log('Invoice ID:', invoiceId);

            // Get invoice data
            const { data: invoice } = await supabaseClient
                .from('payments')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (!invoice) {
                alert('Invoice not found');
                return;
            }

            console.log('Invoice data:', invoice);

            // Find related sales_history records
            const { data: salesHistory } = await supabaseClient
                .from('sales_history')
                .select('*')
                .eq('payment_id', invoiceId);

            console.log('Sales history records:', salesHistory);

            if (salesHistory && salesHistory.length > 0) {
                // Restore stock for each sales record
                for (const sale of salesHistory) {
                    console.log('Restoring stock for product:', sale.product_id, 'quantity:', sale.jumlah);
                    
                    const { data: product } = await supabaseClient
                        .from('products')
                        .select('stok')
                        .eq('id', sale.product_id)
                        .single();

                    if (product) {
                        const oldStock = product.stok;
                        const newStock = product.stok + sale.jumlah;
                        console.log(`Stock restoration: ${oldStock} + ${sale.jumlah} = ${newStock}`);
                        
                        await supabaseClient
                            .from('products')
                            .update({ stok: newStock })
                            .eq('id', sale.product_id);
                            
                        console.log('Stock updated successfully');
                    } else {
                        console.error('Product not found:', sale.product_id);
                    }
                }

                // Delete sales_history records
                console.log('Deleting sales_history records...');
                const { error: historyError } = await supabaseClient
                    .from('sales_history')
                    .delete()
                    .eq('payment_id', invoiceId);

                if (historyError) {
                    console.error('Failed to delete sales history:', historyError);
                    alert('Failed to delete sales history: ' + historyError.message);
                    return;
                }
                console.log('Sales history deleted successfully');
            }

            // Delete payment record
            console.log('Deleting payment record...');
            const { error: paymentError } = await supabaseClient
                .from('payments')
                .delete()
                .eq('id', invoiceId);

            if (paymentError) {
                console.error('Failed to delete payment:', paymentError);
                alert('Failed to delete payment: ' + paymentError.message);
                return;
            }
            console.log('Payment deleted successfully');

            console.log('=== DELETE TRANSACTION END ===');

            alert('Transaksi berhasil dihapus dan stok telah dikembalikan.');
            
            // Refresh products data (to show updated stock)
            console.log('Refreshing products...');
            await refreshProducts();
            console.log('Products refreshed');
            
            // Refresh dashboard (recalculates all metrics from database)
            console.log('Refreshing dashboard...');
            await loadDashboard();
            console.log('Dashboard refreshed');
            
        } catch (err) {
            console.error('Error deleting transaction:', err);
            alert('Error deleting transaction: ' + err.message);
        }
    };

    // Function to refresh products data (for stock updates)
    async function refreshProducts() {
        console.log('=== REFRESH PRODUCTS START ===');
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Failed to refresh products:', error);
            return null;
        }
        
        console.log('Products refreshed:', products.length, 'items');
        console.log('=== REFRESH PRODUCTS END ===');
        return products;
    }

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
                    <td class="p-4"><span class="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-700/50 font-mono text-purple-300 text-xs font-medium">${item.sku || '—'}</span></td>
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
    if (soldContainer) {
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
    }

    // Render 1 inventory profit indicator (hanya 1 indikator di bagian atas)
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

            topText.innerText = `${percent}% profit tracked — inventory active`;
            topSub.innerText = `Focus product: ${(best.nama_barang || '').toString().toUpperCase()} • Cost Rp ${(best.modalTotal || 0).toLocaleString('id-ID')}`;

            // partikel kecil arah profit (tanpa teks tambahan)
            try { window.InventoryManager?.applyPaymentDelta?.(); } catch (e) {}

        }
    } catch (e) {}


    await loadPayments();
    await loadExpenses();

    // Render area chart with sales history data (now includes marketplace)
    await renderCandlestickChartFromSalesHistory(salesHistory);
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

        // efek visual inventory turun (stok berkurang sebesar stokTerhapus)
        try {
            if (stokTerhapus > 0) {
                window.InventoryManager?.applyStockDelta?.(-stokTerhapus);
                try {
                    localStorage.setItem('inventory_stock_delta', JSON.stringify({ delta: -stokTerhapus, t: Date.now() }));
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

    // Sync animasi inventory dari halaman lain (barang/penjualan)
    window.addEventListener('storage', (e) => {
        if (!e || !e.key) return;

        if (e.key === 'inventory_stock_delta') {
            try {
                const payload = JSON.parse(e.newValue || '{}');
                window.InventoryManager?.applyStockDelta?.(payload.delta);
            } catch (err) {}
        }

        if (e.key === 'inventory_payment_delta') {
            try {
                window.InventoryManager?.applyPaymentDelta?.();
            } catch (err) {}
        }
    });

    // initial refresh jika container ada
    try {
        window.InventoryManager?.refreshStockProgressFromProductsTotal?.();
    } catch (e) {}
});

