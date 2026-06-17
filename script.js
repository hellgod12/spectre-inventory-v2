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
    const paid = payments.filter(p => p.status === 'paid').length;
    const unpaid = total - paid;
    const percent = total === 0 ? 0 : Math.round((paid / total) * 100);

    fill.style.width = `${percent}%`;
    progressText.innerText = `${percent}% dikonfirmasi — neraka rekening semakin mendekat`;
    progressSub.innerText = total === 0
        ? 'Belum ada data pembayaran'
        : `${paid} Lunas • ${unpaid} Belum Bayar • ${total} total order`;
}

async function loadPayments() {
    console.log('loadPayments() called');
    
    const paymentsContainer = document.getElementById('paymentsContainer');
    console.log('Payments container:', paymentsContainer);
    
    if (!paymentsContainer) {
        console.log('Payments container not found, returning');
        return;
    }

    const mobile = isMobile();

    let payments = [];
    let supabaseError = null;

    try {
        // Fetch payments, online_orders, members, and sales_history data
        const [paymentsResult, onlineOrdersResult, membersResult, salesHistoryResult] = await Promise.all([
            supabaseClient.from('payments').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('online_orders').select('*').order('order_date', { ascending: false }),
            supabaseClient.from('members').select('*'),
            supabaseClient.from('sales_history').select('*')
        ]);

        const { data, error } = paymentsResult;
        const { data: onlineOrders } = onlineOrdersResult;
        const { data: members } = membersResult;
        const { data: salesHistory } = salesHistoryResult;

        if (error) supabaseError = error;
        else payments = normalizePayments(data);

        // Normalize online_orders to match payments structure
        let normalizedOnlineOrders = [];
        if (onlineOrders && onlineOrders.length > 0) {
            normalizedOnlineOrders = onlineOrders.map(order => ({
                id: order.id,
                buyer: order.customer_name || 'Online Customer',
                product: order.product_name,
                ukuran: order.size || null,
                jumlah: order.quantity,
                total_harga: order.total_amount,
                method: order.payment_method || 'Online',
                status: mapOrderStatus(order.order_status),
                invoice_number: order.order_number,
                source: 'online',
                created_at: order.order_date,
                paid_amount: order.paid_amount || 0,
                remaining_amount: order.remaining_amount || order.total_amount
            }));
        }

        // Combine payments and online_orders
        payments = [
            ...payments.map(p => ({ ...p, source: 'in-store' })),
            ...normalizedOnlineOrders
        ];

        // Sort by created_at/order_date
        payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Create phone to name map
        const phoneToName = new Map();
        if (members) {
            members.forEach(member => {
                phoneToName.set(member.telepon, member.nama);
            });
        }
        
        // Create payment_id to ukuran map from sales_history
        const paymentIdToUkuran = new Map();
        if (salesHistory) {
            salesHistory.forEach(sale => {
                if (sale.payment_id && sale.ukuran) {
                    paymentIdToUkuran.set(sale.payment_id, sale.ukuran);
                }
            });
        }
        
        // Helper function to get display name from buyer field
        function getDisplayName(buyer) {
            if (!buyer) return 'Walk-in';
            // Extract phone number if present
            const phoneMatch = buyer.match(/\d{10,15}/);
            if (phoneMatch) {
                const phoneNumber = phoneMatch[0];
                const memberName = phoneToName.get(phoneNumber);
                if (memberName) return memberName;
            }
            return buyer;
        }
        
        // Add display name and ukuran to each payment
        payments = payments.map(payment => ({
            ...payment,
            displayName: getDisplayName(payment.buyer),
            ukuran: payment.ukuran || paymentIdToUkuran.get(payment.id) || null
        }));
        
        console.log('Payments query result:', payments);
        console.log('Payments count:', payments?.length);
        console.log('Supabase error:', supabaseError);
    } catch (error) {
        supabaseError = error;
        console.error('Payments query exception:', error);
    }

    if (supabaseError) {
        console.error('Payments query failed:', supabaseError);
        updateDashboardProgress([]);
        paymentsContainer.innerHTML = `<div class="p-8 text-center text-red-500 text-xs uppercase">>> Gagal memuat pembayaran</div>`;
        return;
    }

    if (!payments || payments.length === 0) {
        console.log('No payments data found');
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
            
            // Extract sizes from product summary for multi-item payments
            let displayUkuran = payment.ukuran || '—';
            if (!payment.ukuran && payment.product) {
                const sizeMatches = payment.product.match(/\[([^\]]+)\]/g);
                if (sizeMatches && sizeMatches.length > 0) {
                    displayUkuran = sizeMatches.map(s => s.replace(/[\[\]]/g, '')).join(', ');
                }
            }
            
            html += `
                <div class="p-3 border border-red-950/40 bg-black/40">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <div class="text-[10px] text-red-500 font-bold uppercase">${payment.displayName || payment.buyer}</div>
                                ${payment.source === 'online' ? '<span class="text-[8px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase">ONLINE</span>' : '<span class="text-[8px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">IN-STORE</span>'}
                            </div>
                            <div class="mt-1 text-[12px] font-bold text-white uppercase">${payment.product}</div>
                            <div class="mt-1 text-[11px] text-slate-400">Ukuran: ${displayUkuran}</div>
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
        
        // Extract sizes from product summary for multi-item payments
        let displayUkuran = payment.ukuran || '—';
        if (!payment.ukuran && payment.product) {
            const sizeMatches = payment.product.match(/\[([^\]]+)\]/g);
            if (sizeMatches && sizeMatches.length > 0) {
                displayUkuran = sizeMatches.map(s => s.replace(/[\[\]]/g, '')).join(', ');
            }
        }
        
        html += `
            <tr class="hover:bg-red-950/10 transition-colors">
                <td class="p-3 font-bold">
                    <div class="flex items-center gap-2">
                        ${payment.displayName || payment.buyer}
                        ${payment.source === 'online' ? '<span class="text-[8px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase">ONLINE</span>' : '<span class="text-[8px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">IN-STORE</span>'}
                    </div>
                </td>
                <td class="p-3">${payment.product}</td>
                <td class="p-3">${displayUkuran}</td>
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
    const konfirmasi = confirm('[PERINGATAN] HAPUS RECORD PEMBAYARAN INI? Stok akan dikembalikan dan sales_history akan dihapus. Tidak bisa dikembalikan.');
    if (!konfirmasi) return;

    try {
        // First, check if this is an online order or in-store payment
        // Fetch both tables to determine the source
        const [paymentCheck, onlineCheck] = await Promise.all([
            supabaseClient.from('payments').select('id').eq('id', id).single(),
            supabaseClient.from('online_orders').select('id').eq('id', id).single()
        ]);

        let source = 'in-store';
        if (onlineCheck.data) {
            source = 'online';
        } else if (!paymentCheck.data) {
            alert('❌ Data tidak ditemukan');
            return;
        }

        if (source === 'online') {
            // Delete from online_orders table
            const { error: delOnline } = await supabaseClient
                .from('online_orders')
                .delete()
                .eq('id', id);

            if (delOnline) {
                console.error('Gagal hapus online order:', delOnline);
                alert('❌ Gagal menghapus: ' + delOnline.message);
            } else {
                alert('✅ ONLINE ORDER BERHASIL DIHAPUS.');
                await loadPayments();
            }
        } else {
            // Delete from payments table (in-store)
            const { data: paymentData, error: fetchError } = await supabaseClient
                .from('payments')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !paymentData) {
                console.error('Gagal mengambil payment:', fetchError);
                alert('❌ Gagal mengambil data pembayaran');
                return;
            }

            // Fetch sales_history records associated with this payment
            const { data: salesHistory, error: salesError } = await supabaseClient
                .from('sales_history')
                .select('*')
                .eq('invoice_number', paymentData.invoice_number);

            if (salesError) {
                console.error('Gagal mengambil sales_history:', salesError);
            }

            // Restore stock for each sales_history record
            if (salesHistory && salesHistory.length > 0) {
                for (const sale of salesHistory) {
                    // Get current stock
                    const { data: productData } = await supabaseClient
                        .from('products')
                        .select('stok')
                        .eq('id', sale.product_id)
                        .single();

                    if (productData) {
                        const newStock = productData.stok + sale.jumlah;
                        const { error: stockError } = await supabaseClient
                            .from('products')
                            .update({ stok: newStock })
                            .eq('id', sale.product_id);

                        if (stockError) {
                            console.error('Gagal mengembalikan stok:', stockError);
                        }
                    }
                }

                // Delete sales_history records
                const { error: deleteSalesError } = await supabaseClient
                    .from('sales_history')
                    .delete()
                    .eq('invoice_number', paymentData.invoice_number);

                if (deleteSalesError) {
                    console.error('Gagal menghapus sales_history:', deleteSalesError);
                }
            }

            // Delete payment record
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
                    window.CandleManager?.applyPaymentDelta?.();
                    localStorage.setItem('candle_payment_delta', JSON.stringify({ t: Date.now() }));
                } catch (e) {}

                alert('✅ RECORD PEMBAYARAN BERHASIL DIHAPUS. Stok dikembalikan dan sales_history dihapus.');
                await loadPayments();
            }
        }
    } catch (err) {
        console.error('Error deleting payment:', err);
        alert('❌ Error: ' + err.message);
    }
}


async function confirmPayment(id) {
    const { error } = await supabaseClient
        .from('payments')
        .update({ status: 'paid', confirmed_at: new Date().toISOString() })
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

async function loadOutstandingPayments() {
    const outstandingContainer = document.getElementById('outstandingContainer');
    if (!outstandingContainer) {
        console.log('outstandingContainer not found');
        return;
    }

    const mobile = isMobile();
    console.log('loadOutstandingPayments called, mobile:', mobile);

    try {
        // Get all payments and members data
        const [paymentsResult, membersResult] = await Promise.all([
            supabaseClient.from('payments').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('members').select('*')
        ]);

        const { data: allPayments, error: paymentsError } = paymentsResult;
        const { data: members, error: membersError } = membersResult;

        console.log('All payments:', allPayments);
        console.log('Members:', members);

        if (paymentsError) {
            console.error('Error fetching payments:', paymentsError);
            outstandingContainer.innerHTML = `<div class="p-8 text-center text-red-500 text-xs uppercase">>> Gagal memuat outstanding payments</div>`;
            return;
        }

        if (!allPayments || allPayments.length === 0) {
            console.log('No payments found at all');
            outstandingContainer.innerHTML = `<div class="p-8 text-center text-slate-500 text-xs uppercase">>> Tidak ada data pembayaran</div>`;
            return;
        }

        // Create a map of phone numbers to member names
        const phoneToName = new Map();
        if (members) {
            members.forEach(member => {
                console.log(`Mapping phone: ${member.telepon} -> name: ${member.nama}`);
                phoneToName.set(member.telepon, member.nama);
            });
        }
        console.log('Phone to name map:', Array.from(phoneToName.entries()));

        // Filter payments with remaining_amount > 0 (regardless of status)
        const outstandingPayments = allPayments.filter(payment => {
            const remaining = parseFloat(payment.remaining_amount || 0);
            return remaining > 0;
        });

        console.log('Outstanding payments (remaining > 0):', outstandingPayments);

        if (outstandingPayments.length === 0) {
            console.log('No payments with remaining_amount > 0');
            outstandingContainer.innerHTML = `<div class="p-8 text-center text-slate-500 text-xs uppercase">>> Semua pembayaran sudah lunas</div>`;
            return;
        }

        // Group by buyer and calculate total outstanding
        const buyerDebt = new Map();
        const buyerTransactionCount = new Map();
        const buyerNames = new Map();

        outstandingPayments.forEach(payment => {
            const buyer = payment.buyer || 'Unknown';
            const remainingAmount = parseFloat(payment.remaining_amount || 0);
            
            // Extract phone number from buyer field (format: "Member (085156944139)" or just phone number)
            let phoneNumber = buyer;
            const phoneMatch = buyer.match(/\d{10,15}/);
            if (phoneMatch) {
                phoneNumber = phoneMatch[0];
            }
            
            // Try to get member name from phone number
            const memberName = phoneToName.get(phoneNumber) || buyer;
            console.log(`Payment buyer: ${buyer} -> Extracted phone: ${phoneNumber} -> Mapped to: ${memberName}`);
            buyerNames.set(buyer, memberName);
            
            const currentDebt = buyerDebt.get(buyer) || 0;
            const currentCount = buyerTransactionCount.get(buyer) || 0;
            
            buyerDebt.set(buyer, currentDebt + remainingAmount);
            buyerTransactionCount.set(buyer, currentCount + 1);
        });

        // Convert to array and sort by debt amount (highest first)
        const outstandingList = Array.from(buyerDebt.entries())
            .map(([buyer, debt]) => ({
                buyer,
                displayName: buyerNames.get(buyer) || buyer,
                debt,
                transactionCount: buyerTransactionCount.get(buyer)
            }))
            .sort((a, b) => b.debt - a.debt);

        // Calculate total outstanding
        const totalOutstanding = outstandingList.reduce((sum, item) => sum + item.debt, 0);

        // Render based on device type
        if (mobile) {
            let html = `
                <div class="space-y-2">
                    <div class="p-3 border border-red-950/40 bg-black/40">
                        <div class="text-[10px] text-red-500 font-bold uppercase">Total Outstanding</div>
                        <div class="mt-1 text-[14px] font-bold text-white">${formatCurrency(totalOutstanding)}</div>
                        <div class="mt-1 text-[11px] text-slate-400">${outstandingList.length} orang belum bayar</div>
                    </div>
            `;

            outstandingList.forEach(item => {
                html += `
                    <div class="p-3 border border-red-950/40 bg-black/40">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="text-[11px] text-red-500 font-bold uppercase">${item.displayName}</div>
                                <div class="mt-1 text-[12px] font-bold text-white">${formatCurrency(item.debt)}</div>
                                <div class="mt-1 text-[11px] text-slate-400">${item.transactionCount} transaksi belum lunas</div>
                            </div>
                            <div class="text-right">
                                <span class="badge status-belumbayar">Pending</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            outstandingContainer.innerHTML = html;
        } else {
            let html = `
                <div class="mb-4 p-3 border border-red-950/40 bg-black/40">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-[10px] text-red-500 font-bold uppercase">Total Outstanding</div>
                            <div class="text-[14px] font-bold text-white">${formatCurrency(totalOutstanding)}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-[11px] text-slate-400">${outstandingList.length} orang belum bayar</div>
                        </div>
                    </div>
                </div>
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-black/60 border-b border-red-950 text-red-500/80 uppercase text-[10px]">
                            <th class="p-3 font-bold tracking-wider">NAMA PEMBELI</th>
                            <th class="p-3 font-bold text-right tracking-wider">JUMLAH HUTANG</th>
                            <th class="p-3 font-bold text-center tracking-wider">TRANSAKSI</th>
                            <th class="p-3 font-bold tracking-wider">STATUS</th>
                        </tr>
                    </thead>
                    <tbody class="bg-black/45 divide-y divide-red-950/25">
            `;

            outstandingList.forEach(item => {
                html += `
                    <tr class="hover:bg-red-950/10 transition-colors">
                        <td class="p-3 font-bold">${item.displayName}</td>
                        <td class="p-3 text-right font-bold text-red-400">${formatCurrency(item.debt)}</td>
                        <td class="p-3 text-center">${item.transactionCount}</td>
                        <td class="p-3"><span class="badge status-belumbayar">Pending</span></td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            outstandingContainer.innerHTML = html;
        }

    } catch (error) {
        console.error('Error loading outstanding payments:', error);
        outstandingContainer.innerHTML = `<div class="p-8 text-center text-red-500 text-xs uppercase">>> Error memuat data</div>`;
    }
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

    // Tarik data produk aktif (hanya is_active = true)
    const { data: products, error: prodError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });


    // Tarik data member
    const { data: members, error: membersError } = await supabaseClient.from('members').select('id');
    console.log('Members query result:', members);
    console.log('Members query error:', membersError);

    const totalMembersEl = document.getElementById('totalMembers');
    console.log('totalMembers element:', totalMembersEl);

    if (totalMembersEl) {
        const memberCount = members ? members.length : 0;
        totalMembersEl.innerText = memberCount + " Jiwa";
        console.log('Updated totalMembers to:', memberCount + " Jiwa");
    } else {
        console.error('totalMembers element not found');
    }

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
        // Using order_date (actual order date) instead of created_at (database entry time)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: onlineOrders } = await supabaseClient
            .from('online_orders')
            .select('gross_sales, net_revenue')
            .gte('order_date', thirtyDaysAgo.toISOString())
            .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);
        
        if (onlineOrders) {
            marketplaceRevenue = onlineOrders.reduce((sum, o) => sum + (parseFloat(o.net_revenue) || 0), 0);
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
    
    // Load online sales statistics and dashboard sections
    loadOnlineSalesStatistics();
    loadRecentOnlineOrders();
    loadSalesComparisonChart();
    loadPayments(); // Load payments data
    loadOutstandingPayments(); // Load outstanding payments for dashboard
    renderInvoices(); // Render invoices and outstanding payments
    
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

    document.getElementById('inventoryValue').innerText = 'Rp ' + inventoryValue.toLocaleString('id-ID');
    document.getElementById('totalModalBarang').innerText = 'Rp ' + totalModalBarang.toLocaleString('id-ID');
    document.getElementById('lowStockItems').innerText = lowStockItems;

    // Render product inventory list
    if (products && products.length > 0) {
        const mobile = isMobile();
        
        if (mobile) {
            let cards = '<div class="space-y-2">';
            products.forEach(item => {
                const currentStock = parseInt(item.stok || 0);
                const stockClass = currentStock <= 5 ? 'text-red-400' : 'text-green-400';
                const stockBadge = currentStock <= 5 
                    ? `<span class="bg-red-950 text-red-500 border border-red-600 px-2 py-0.5 font-bold text-[10px] animate-pulse">⚠️ KRITIS_${currentStock}</span>`
                    : `<span class="bg-stone-900 text-slate-300 border border-stone-800 px-2 py-0.5 font-bold text-[10px]">${currentStock} UNIT</span>`;
                
                cards += `
                    <div class="p-3 border border-red-950/40 bg-black/40">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="text-[10px] font-mono text-muted mb-1">${item.sku || '-'}</div>
                                <div class="text-[11px] text-white font-bold uppercase leading-4">${item.nama_barang}</div>
                                <div class="mt-2 text-[11px] text-muted">${item.kategori || '-'}</div>
                                <div class="mt-2 text-[11px] text-slate-400">Size: ${item.ukuran || '-'}</div>
                                <div class="mt-2">${stockBadge}</div>
                                <div class="mt-2 text-[11px] text-slate-500">
                                    Modal: Rp ${Number(item.harga_modal).toLocaleString('id-ID')}<br/>
                                    Value: Rp ${(currentStock * Number(item.harga_modal)).toLocaleString('id-ID')}
                                </div>
                            </div>
                            <div class="text-right">
                                <button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-[10px] font-bold uppercase">Hapus</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            cards += '</div>';
            container.innerHTML = cards;
        } else {
            let inventoryHtml = '<table class="w-full text-xs" style="border-collapse: collapse;">';
            inventoryHtml += '<thead><tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">';
            inventoryHtml += '<th class="text-left p-3 text-muted">SKU</th>';
            inventoryHtml += '<th class="text-left p-3 text-muted">Product</th>';
            inventoryHtml += '<th class="text-left p-3 text-muted">Category</th>';
            inventoryHtml += '<th class="text-left p-3 text-muted">Size</th>';
            inventoryHtml += '<th class="text-right p-3 text-muted">Stock</th>';
            inventoryHtml += '<th class="text-right p-3 text-muted">Modal</th>';
            inventoryHtml += '<th class="text-right p-3 text-muted">Value</th>';
            inventoryHtml += '<th class="text-center p-3 text-muted">Action</th>';
            inventoryHtml += '</tr></thead><tbody>';
            
            products.forEach(item => {
                const currentStock = parseInt(item.stok || 0);
                const baseCost = parseFloat(item.harga_modal || 0);
                const itemValue = currentStock * baseCost;
                const stockClass = currentStock <= 5 ? 'text-red-400' : 'text-green-400';
                
                inventoryHtml += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">';
                inventoryHtml += `<td class="p-3 font-mono text-xs text-muted">${item.sku || '-'}</td>`;
                inventoryHtml += `<td class="p-3 font-medium">${item.nama_barang || '-'}</td>`;
                inventoryHtml += `<td class="p-3 text-muted">${item.kategori || '-'}</td>`;
                inventoryHtml += `<td class="p-3 text-muted">${item.ukuran || '-'}</td>`;
                inventoryHtml += `<td class="p-3 text-right ${stockClass}">${currentStock}</td>`;
                inventoryHtml += `<td class="p-3 text-right">Rp ${baseCost.toLocaleString('id-ID')}</td>`;
                inventoryHtml += `<td class="p-3 text-right">Rp ${itemValue.toLocaleString('id-ID')}</td>`;
                inventoryHtml += `<td class="p-3 text-center">
                    <button onclick="deleteProduct(${item.id}, '${item.nama_barang}')" class="bg-transparent hover:bg-red-600 hover:text-white text-red-600 border border-red-900 px-2.5 py-1 text-[9px] font-bold uppercase transition-all">HAPUS</button>
                </td>`;
                inventoryHtml += '</tr>';
            });
            
            inventoryHtml += '</tbody></table>';
            container.innerHTML = inventoryHtml;
        }
    } else {
        container.innerHTML = '<div class="p-8 text-center text-muted text-xs">No products found</div>';
    }

    // Load online sales statistics
    await loadOnlineSalesStatistics(omsetAsli);
}

// Load online sales statistics
async function loadOnlineSalesStatistics(offlineRevenue = 0) {
    console.log('loadOnlineSalesStatistics() called, offlineRevenue:', offlineRevenue);
    try {
        // Online Sales Today - Only count valid sales (delivered, completed, paid, shipped)
        // Using order_date (actual order date) instead of created_at (database entry time)
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

        const { data: todayOrders } = await supabaseClient
            .from('online_orders')
            .select('gross_sales, net_revenue')
            .gte('order_date', todayStart)
            .lt('order_date', todayEnd)
            .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

        console.log('Today orders:', todayOrders);
        const todayRevenue = todayOrders ? todayOrders.reduce((sum, o) => sum + (parseFloat(o.net_revenue) || 0), 0) : 0;
        const todayOrdersCount = todayOrders ? todayOrders.length : 0;
        console.log('Today revenue:', todayRevenue, 'Today orders count:', todayOrdersCount);

        // Online Sales Yesterday (for growth calculation) - Only count valid sales
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
        const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1).toISOString();

        const { data: yesterdayOrders } = await supabaseClient
            .from('online_orders')
            .select('net_revenue')
            .gte('order_date', yesterdayStart)
            .lt('order_date', yesterdayEnd)
            .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

        const yesterdayRevenue = yesterdayOrders ? yesterdayOrders.reduce((sum, o) => sum + (parseFloat(o.net_revenue) || 0), 0) : 0;
        const todayGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0;

        // Online Sales This Month - Only count valid sales
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();

        const { data: monthOrders } = await supabaseClient
            .from('online_orders')
            .select('gross_sales, net_revenue')
            .gte('order_date', monthStart)
            .lt('order_date', monthEnd)
            .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

        const monthRevenue = monthOrders ? monthOrders.reduce((sum, o) => sum + (parseFloat(o.net_revenue) || 0), 0) : 0;
        const monthOrdersCount = monthOrders ? monthOrders.length : 0;

        // Online Sales Last Month (for growth calculation) - Only count valid sales
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        const { data: lastMonthOrders } = await supabaseClient
            .from('online_orders')
            .select('net_revenue')
            .gte('order_date', lastMonthStart)
            .lt('order_date', lastMonthEnd)
            .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

        const lastMonthRevenue = lastMonthOrders ? lastMonthOrders.reduce((sum, o) => sum + (parseFloat(o.net_revenue) || 0), 0) : 0;
        const monthGrowth = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0;

        // Sales Overview (Online + Offline + Total)
        const totalRevenue = offlineRevenue + monthRevenue;

        // Average Order Value (AOV) Online
        const aov = monthOrdersCount > 0 ? (monthRevenue / monthOrdersCount) : 0;

        // Update DOM elements
        document.getElementById('onlineSalesTodayRevenue').innerText = 'Rp ' + todayRevenue.toLocaleString('id-ID');
        document.getElementById('onlineSalesTodayOrders').innerText = todayOrdersCount;
        document.getElementById('onlineSalesTodayTrend').innerText = `${todayGrowth >= 0 ? '↑' : '↓'} ${Math.abs(todayGrowth)}%`;
        document.getElementById('onlineSalesTodayTrend').className = `spectre-kpi-trend ${todayGrowth >= 0 ? 'spectre-kpi-trend--up' : 'spectre-kpi-trend--down'}`;

        document.getElementById('onlineSalesMonthRevenue').innerText = 'Rp ' + monthRevenue.toLocaleString('id-ID');
        document.getElementById('onlineSalesMonthOrders').innerText = monthOrdersCount;
        document.getElementById('onlineSalesMonthTrend').innerText = `${monthGrowth >= 0 ? '↑' : '↓'} ${Math.abs(monthGrowth)}%`;
        document.getElementById('onlineSalesMonthTrend').className = `spectre-kpi-trend ${monthGrowth >= 0 ? 'spectre-kpi-trend--up' : 'spectre-kpi-trend--down'}`;

        document.getElementById('totalSalesRevenue').innerText = 'Rp ' + totalRevenue.toLocaleString('id-ID');
        document.getElementById('onlineAOV').innerText = 'Rp ' + aov.toLocaleString('id-ID');

        // Load top selling online products
        await loadTopSellingOnlineProducts(monthStart, monthEnd);

        // Load best selling product
        await loadBestSellingProduct(monthStart, monthEnd);

        // Load recent online orders
        await loadRecentOnlineOrders();

        // Load sales comparison chart
        await loadSalesComparisonChart();

    } catch (error) {
        console.error('Error loading online sales statistics:', error);
        console.error('Error details:', error.message, error.stack);
    }
}

// Load top selling online products
async function loadTopSellingOnlineProducts(startDate, endDate) {
    try {
        const { data: orderItems } = await supabaseClient
            .from('order_items')
            .select('product_name, sku, quantity, total_price, online_orders!inner(order_status, order_date)')
            .gte('online_orders.order_date', startDate)
            .lt('online_orders.order_date', endDate)
            .in('online_orders.order_status', ['delivered', 'completed', 'paid', 'shipped']);

        if (!orderItems || orderItems.length === 0) {
            document.getElementById('topSellingProducts').innerHTML = '<div class="p-8 text-center text-muted text-xs">No data available</div>';
            return;
        }

        // Aggregate by product
        const productSales = {};
        orderItems.forEach(item => {
            const key = item.product_name;
            if (!productSales[key]) {
                productSales[key] = {
                    name: item.product_name,
                    sku: item.sku,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[key].quantity += item.quantity || 0;
            productSales[key].revenue += item.total_price || 0;
        });

        // Sort by quantity and get top 5
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const container = document.getElementById('topSellingProducts');
        container.innerHTML = topProducts.map((product, index) => `
            <div class="product-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">${index + 1}</div>
                    <div>
                        <div style="font-weight: 500; font-size: 14px;">${product.name}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.5);">${product.sku || '-'}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; font-size: 14px;">${product.quantity} units</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.5);">Rp ${(product.revenue / 1000000).toFixed(2)}M</div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading top selling products:', error);
    }
}

// Load best selling product
async function loadBestSellingProduct(startDate, endDate) {
    try {
        const { data: orderItems } = await supabaseClient
            .from('order_items')
            .select('product_name, sku, quantity, total_price, online_orders!inner(order_status, order_date)')
            .gte('online_orders.order_date', startDate)
            .lt('online_orders.order_date', endDate)
            .in('online_orders.order_status', ['delivered', 'completed', 'paid', 'shipped']);

        if (!orderItems || orderItems.length === 0) {
            document.getElementById('bestSellingProduct').innerHTML = '<div class="p-8 text-center text-muted text-xs">No data available</div>';
            return;
        }

        // Aggregate by product
        const productSales = {};
        orderItems.forEach(item => {
            const key = item.product_name;
            if (!productSales[key]) {
                productSales[key] = {
                    name: item.product_name,
                    sku: item.sku,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[key].quantity += item.quantity || 0;
            productSales[key].revenue += item.total_price || 0;
        });

        // Get best selling
        const bestProduct = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)[0];

        const container = document.getElementById('bestSellingProduct');
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">🏆</div>
                <div style="font-weight: 600; font-size: 18px; margin-bottom: 4px;">${bestProduct.name}</div>
                <div style="font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 12px;">${bestProduct.sku || '-'}</div>
                <div style="display: flex; justify-content: center; gap: 24px;">
                    <div>
                        <div style="font-weight: 600; font-size: 24px;">${bestProduct.quantity}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.5);">Units Sold</div>
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 24px;">Rp ${(bestProduct.revenue / 1000000).toFixed(2)}M</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.5);">Revenue</div>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading best selling product:', error);
    }
}

// Map online order status to payment status
function mapOrderStatus(orderStatus) {
    const statusMap = {
        'pending': 'Belum Bayar',
        'paid': 'Sudah Bayar',
        'shipped': 'Sudah Bayar',
        'delivered': 'Sudah Bayar',
        'cancelled': 'Batal'
    };
    return statusMap[orderStatus] || 'Belum Bayar';
}

// Load recent online orders
async function loadRecentOnlineOrders() {
    console.log('loadRecentOnlineOrders() called');
    try {
        const { data: recentOrders } = await supabaseClient
            .from('online_orders')
            .select(`
                order_number,
                customer_name,
                gross_sales,
                order_status,
                order_date,
                marketplace_accounts (
                    platform
                )
            `)
            .order('order_date', { ascending: false })
            .limit(10);

        console.log('Recent orders:', recentOrders);

        if (!recentOrders || recentOrders.length === 0) {
            document.getElementById('recentOnlineOrders').innerHTML = '<div class="p-8 text-center text-muted text-xs">No orders yet</div>';
            return;
        }

        const container = document.getElementById('recentOnlineOrders');
        container.innerHTML = recentOrders.map(order => `
            <div class="order-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${getStatusColor(order.order_status)};"></div>
                    <div>
                        <div style="font-weight: 500; font-size: 13px;">${order.order_number}</div>
                        <div style="font-size: 11px; color: rgba(255,255,255,0.5);">${order.marketplace_accounts?.platform || 'Unknown'}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; font-size: 13px;">Rp ${(order.gross_sales / 1000).toFixed(0)}K</div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.5);">${formatDateShort(order.order_date)}</div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading recent online orders:', error);
        console.error('Error details:', error.message, error.stack);
    }
}

// Load sales comparison chart (30 days)
async function loadSalesComparisonChart() {
    console.log('loadSalesComparisonChart() called');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get online sales by day - Only count valid sales
        // Using order_date (actual order date) instead of created_at (database entry time)
        const { data: onlineOrders } = await supabaseClient
            .from('online_orders')
            .select('net_revenue, order_date')
            .gte('order_date', thirtyDaysAgo.toISOString())
            .in('order_status', ['delivered', 'completed', 'paid', 'shipped']);

        console.log('Online orders for chart:', onlineOrders);

        // Get offline sales by day
        const { data: offlinePayments } = await supabaseClient
            .from('payments')
            .select('paid_amount, created_at')
            .eq('status', 'paid')
            .gte('created_at', thirtyDaysAgo.toISOString());

        // Aggregate by date
        const onlineByDate = {};
        const offlineByDate = {};

        if (onlineOrders) {
            onlineOrders.forEach(order => {
                const date = order.order_date.split('T')[0];
                if (!onlineByDate[date]) onlineByDate[date] = 0;
                onlineByDate[date] += parseFloat(order.net_revenue) || 0;
            });
        }

        if (offlinePayments) {
            offlinePayments.forEach(payment => {
                const date = payment.created_at.split('T')[0];
                if (!offlineByDate[date]) offlineByDate[date] = 0;
                offlineByDate[date] += parseFloat(payment.paid_amount) || 0;
            });
        }

        // Generate labels and data for last 30 days
        const labels = [];
        const onlineData = [];
        const offlineData = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
            onlineData.push(onlineByDate[dateStr] || 0);
            offlineData.push(offlineByDate[dateStr] || 0);
        }

        // Create chart
        const ctx = document.getElementById('salesComparisonChart');
        if (!ctx) return;

        // Destroy existing chart if it exists and is a Chart instance
        if (window.salesComparisonChart && typeof window.salesComparisonChart.destroy === 'function') {
            window.salesComparisonChart.destroy();
            window.salesComparisonChart = null;
        }

        window.salesComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Online Sales',
                        data: onlineData,
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Offline Sales',
                        data: offlineData,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: { size: 11 }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { size: 10 },
                            callback: function(value) {
                                return 'Rp ' + (value / 1000000).toFixed(1) + 'M';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading sales comparison chart:', error);
        console.error('Error details:', error.message, error.stack);
    }
}

// Helper function to get status color
function getStatusColor(status) {
    const colors = {
        'PENDING': '#f59e0b',
        'PROCESSING': '#3b82f6',
        'SHIPPED': '#8b5cf6',
        'DELIVERED': '#10b981',
        'COMPLETED': '#10b981',
        'CANCELLED': '#ef4444',
        'RETURNED': '#ef4444'
    };
    return colors[status] || '#6b7280';
}

// Helper function to format date short
function formatDateShort(date) {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// Render invoices in Invoice Management section (POS + Marketplace)
async function renderInvoices() {
    console.log('renderInvoices() called');
    
    // Fetch POS payments and members data
    const [paymentsResult, membersResult] = await Promise.all([
        supabaseClient.from('payments').select('*'),
        supabaseClient.from('members').select('*')
    ]);
    
    const { data: payments, error: paymentsError } = paymentsResult;
    const { data: members } = membersResult;
    
    console.log('Payments loaded:', payments);
    console.log('Payments count:', payments?.length);
    console.log('Payments query error:', paymentsError);
    console.log('Members loaded:', members);
    
    // Create phone to name map
    const phoneToName = new Map();
    if (members) {
        members.forEach(member => {
            phoneToName.set(member.telepon, member.nama);
        });
    }
    
    // Helper function to get display name from buyer field
    function getDisplayName(buyer) {
        if (!buyer) return 'Walk-in';
        // Extract phone number if present
        const phoneMatch = buyer.match(/\d{10,15}/);
        if (phoneMatch) {
            const phoneNumber = phoneMatch[0];
            const memberName = phoneToName.get(phoneNumber);
            if (memberName) return memberName;
        }
        return buyer;
    }
    
    // Render invoices in Invoice Management section (POS + Marketplace)
    const invoiceContainer = document.getElementById('invoiceContainer');
    console.log('Invoice container:', invoiceContainer);
    
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
                        buyer: getDisplayName(payment.buyer) || 'Walk-in'
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
                        buyer: getDisplayName(order.customer_name) || 'Online Customer',
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

    // Render Outstanding Payments widget (member debt) - DISABLED, using loadOutstandingPayments() instead
    // const outstandingContainer = document.getElementById('outstandingContainer');
    // console.log('Outstanding container:', outstandingContainer);
    // 
    // if (outstandingContainer && payments) {
    //     console.log('Rendering outstanding payments with payments:', payments);
    //     
    //     // Filter for member transactions with remaining balance
    //     const memberPayments = payments.filter(p => 
    //         p.buyer && p.buyer.includes('Member') && 
    //         p.status !== 'paid' && 
    //         p.status !== 'cancelled' &&
    //         (p.remaining_amount || 0) > 0
    //     );
    // 
    //     console.log('Member payments with outstanding balance:', memberPayments);
    // 
    //     // Group by member
    //     const memberDebt = new Map();
    //     memberPayments.forEach(payment => {
    //         const memberName = payment.buyer.replace('Member (', '').replace(')', '');
    //         const currentDebt = memberDebt.get(memberName) || 0;
    //         memberDebt.set(memberName, currentDebt + (payment.remaining_amount || 0));
    //     });
    // 
    //     const totalOutstanding = Array.from(memberDebt.values()).reduce((sum, debt) => sum + debt, 0);
    // 
    //     if (memberDebt.size === 0) {
    //         outstandingContainer.innerHTML = '<div class="p-8 text-center text-muted text-xs">No outstanding payments</div>';
    //     } else {
    //         let outstandingHtml = '<div class="space-y-3">';
    //         outstandingHtml += `
    //             <div class="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
    //                 <div class="flex justify-between items-center">
    //                     <span class="text-xs text-muted">Total Outstanding</span>
    //                     <span class="font-semibold text-red-400">Rp ${totalOutstanding.toLocaleString('id-ID')}</span>
    //                 </div>
    //             </div>
    //         `;
    // 
    //         memberDebt.forEach((debt, memberName) => {
    //             outstandingHtml += `
    //                 <div class="p-3 bg-black/50 border border-stone-800 rounded-lg flex justify-between items-center">
    //                     <div>
    //                         <div class="font-semibold text-white text-sm">${memberName}</div>
    //                         <div class="text-xs text-muted">Member</div>
    //                     </div>
    //                     <span class="font-semibold text-red-400 text-sm">Rp ${debt.toLocaleString('id-ID')}</span>
    //                 </div>
    //             `;
    //         });
    // 
    //         outstandingHtml += '</div>';
    //         outstandingContainer.innerHTML = outstandingHtml;
    //     }
    // }
}

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
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Failed to refresh products:', error);
        return null;
    }
    
    console.log('Products refreshed:', products.length, 'items');
    console.log('=== REFRESH PRODUCTS END ===');
    return products;
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
        // Get the sales history record
        const { data: saleRecord, error: fetchError } = await supabaseClient
            .from('sales_history')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !saleRecord) {
            alert('❌ Gagal mengambil data penjualan: ' + (fetchError?.message || 'Record tidak ditemukan'));
            return;
        }

        // Restore stock
        const { data: product } = await supabaseClient
            .from('products')
            .select('stok')
            .eq('id', saleRecord.product_id)
            .single();

        if (product) {
            const newStock = product.stok + saleRecord.jumlah;
            await supabaseClient
                .from('products')
                .update({ stok: newStock })
                .eq('id', saleRecord.product_id);
        }

        // Delete the sales history record
        const { error: deleteError } = await supabaseClient
            .from('sales_history')
            .delete()
            .eq('id', id);

        if (deleteError) {
            alert('❌ Gagal menghapus: ' + deleteError.message);
            return;
        }

        alert('✅ RECORD PENJUALAN BERHASIL DIHAPUS DAN STOCK TELAH DIKEMBALIKAN');
        await loadDashboard();
    } catch (err) {
        console.error('Error deleting from sales history:', err);
        alert('❌ Error: ' + err.message);
    }
}

// Chart rendering function
async function deleteProduct(id, namaBarang) {
    const konfirmasi = confirm(`[PERINGATAN] ARCHIVE PRODUK "${namaBarang.toUpperCase()}"?\n\nProduk akan diarsipkan (soft delete) dan tidak akan muncul di dashboard, POS, atau penjualan.\nData sales_history dan order_items tetap aman.`);
    if (!konfirmasi) return;

    try {
        // Soft delete: update is_active = false and deleted_at = NOW()
        const { error } = await supabaseClient
            .from('products')
            .update({ 
                is_active: false,
                deleted_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            alert('❌ Gagal mengarsipkan produk: ' + error.message);
            return;
        }

        alert('✅ Produk berhasil diarsipkan');
        await loadDashboard();
    } catch (err) {
        alert('❌ Gagal mengarsipkan produk: ' + (err?.message || err));
    }
}

// Event listeners
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

