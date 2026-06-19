// Member Payments Management
// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[member-payments.js] supabaseClient not initialized. Ensure auth.js is loaded before member-payments.js');
}

// Load member payments
async function loadMemberPayments() {
    try {
        const { data: payments } = await supabaseClient.from('payments').select('*').order('created_at', { ascending: false });

        if (!payments || payments.length === 0) {
            const memberDebtListEl = document.getElementById('memberDebtList');
            if (memberDebtListEl) memberDebtListEl.innerHTML = '<div class="p-8 text-center text-muted text-xs">No member debt found</div>';
            const paymentHistoryEl = document.getElementById('paymentHistory');
            if (paymentHistoryEl) paymentHistoryEl.innerHTML = '<div class="p-8 text-center text-muted text-xs">No payment history found</div>';
            return;
        }

        // Filter for member transactions
        const memberPayments = payments.filter(p => p.buyer && p.buyer.includes('Member'));

        // Calculate outstanding debt by member
        const memberDebt = new Map();
        memberPayments.forEach(payment => {
            if (payment.status !== 'paid' && payment.status !== 'cancelled' && (payment.remaining_amount || 0) > 0) {
                const memberName = payment.buyer.replace('Member (', '').replace(')', '');
                const currentDebt = memberDebt.get(memberName) || 0;
                memberDebt.set(memberName, currentDebt + (payment.remaining_amount || 0));
            }
        });

        const totalOutstanding = Array.from(memberDebt.values()).reduce((sum, debt) => sum + debt, 0);
        const totalOutstandingEl = document.getElementById('totalOutstanding');
        if (totalOutstandingEl) totalOutstandingEl.innerText = 'Rp ' + totalOutstanding.toLocaleString('id-ID');

        // Render member debt list
        const memberDebtListEl = document.getElementById('memberDebtList');
        if (memberDebtListEl) {
            if (memberDebt.size === 0) {
                memberDebtListEl.innerHTML = '<div class="p-8 text-center text-muted text-xs">No outstanding balances</div>';
            } else {
                let debtHtml = '<div class="space-y-3">';
                memberDebt.forEach((debt, memberName) => {
                    debtHtml += `
                        <div class="member-payment-card flex justify-between items-center">
                            <div>
                                <div class="font-semibold text-white">${memberName}</div>
                                <div class="text-xs text-muted">Member</div>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold text-red-400">Rp ${debt.toLocaleString('id-ID')}</div>
                                <div class="text-xs text-muted">Outstanding</div>
                            </div>
                        </div>
                    `;
                });
                debtHtml += '</div>';
                memberDebtListEl.innerHTML = debtHtml;
            }
        }

        // Render payment history
        renderPaymentHistory(memberPayments);
    } catch (error) {
        console.error('Failed to load member payments:', error);
    }
}

function renderPaymentHistory(payments) {
    const filterStatus = document.getElementById('filterStatus').value;
    const filteredPayments = filterStatus === 'all' ? payments : payments.filter(p => p.status === filterStatus);

    const paymentHistoryEl = document.getElementById('paymentHistory');
    if (filteredPayments.length === 0) {
        paymentHistoryEl.innerHTML = '<div class="p-8 text-center text-muted text-xs">No payments found</div>';
        return;
    }

    let historyHtml = '<div class="space-y-3">';
    filteredPayments.forEach(payment => {
        const statusColors = {
            'pending': 'status-pending',
            'partial': 'status-partial',
            'paid': 'status-paid',
            'cancelled': 'status-cancelled'
        };
        const statusClass = statusColors[payment.status] || 'status-pending';

        historyHtml += `
            <div class="member-payment-card">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="text-xs text-muted mb-1">${payment.invoice_number || 'N/A'}</div>
                        <div class="font-semibold text-white">${payment.product || 'Unknown'}</div>
                        <div class="text-xs text-muted">${payment.buyer || 'Unknown'}</div>
                    </div>
                    <span class="status-badge ${statusClass}">${payment.status?.toUpperCase() || 'PENDING'}</span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                        <div class="text-muted">Total</div>
                        <div class="font-semibold">Rp ${(payment.total_harga || 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div>
                        <div class="text-muted">Paid</div>
                        <div class="font-semibold text-green-400">Rp ${(payment.paid_amount || 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div>
                        <div class="text-muted">Remaining</div>
                        <div class="font-semibold text-yellow-400">Rp ${(payment.remaining_amount || 0).toLocaleString('id-ID')}</div>
                    </div>
                </div>
                ${payment.status !== 'paid' && payment.status !== 'cancelled' ? `
                    <div class="flex gap-2">
                        <button onclick="addPayment('${payment.id}', ${payment.remaining_amount})" class="flex-1 px-3 py-2 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition">Add Payment</button>
                        ${payment.status === 'partial' ? `
                            <button onclick="markAsPaid('${payment.id}')" class="flex-1 px-3 py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition">Mark Paid</button>
                        ` : ''}
                        <button onclick="cancelPayment('${payment.id}')" class="flex-1 px-3 py-2 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition">Cancel</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    historyHtml += '</div>';
    paymentHistoryEl.innerHTML = historyHtml;
}

// Add payment
async function addPayment(paymentId, remainingAmount) {
    const amount = prompt('Enter payment amount:', remainingAmount);
    if (amount === null) return;

    const paymentAmountNum = parseFloat(amount);
    if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
        alert('Invalid payment amount');
        return;
    }

    try {
        const { data: invoice } = await supabaseClient.from('payments').select('*').eq('id', paymentId).single();

        if (!invoice) {
            alert('Payment not found');
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

        const { error } = await supabaseClient.from('payments').update({
            paid_amount: newPaidAmount,
            remaining_amount: Math.max(0, newRemainingAmount),
            status: newStatus,
            confirmed_at: newStatus === 'paid' ? new Date().toISOString() : null
        }).eq('id', paymentId);

        if (error) {
            alert('Failed to add payment: ' + error.message);
        } else {
            alert('Payment added successfully');
            loadMemberPayments();
        }
    } catch (err) {
        alert('Error adding payment: ' + err.message);
    }
}

// Mark as paid
async function markAsPaid(paymentId) {
    if (!confirm('Mark this payment as fully paid?')) return;

    try {
        const { data: invoice } = await supabaseClient.from('payments').select('*').eq('id', paymentId).single();

        if (!invoice) {
            alert('Payment not found');
            return;
        }

        const { error } = await supabaseClient.from('payments').update({
            paid_amount: invoice.total_harga,
            remaining_amount: 0,
            status: 'paid',
            confirmed_at: new Date().toISOString()
        }).eq('id', paymentId);

        if (error) {
            alert('Failed to mark as paid: ' + error.message);
        } else {
            alert('Payment marked as paid');
            loadMemberPayments();
        }
    } catch (err) {
        alert('Error marking as paid: ' + err.message);
    }
}

// Cancel payment
async function cancelPayment(paymentId) {
    if (!confirm('Cancel this payment and restore stock?')) return;

    try {
        const { data: invoice } = await supabaseClient.from('payments').select('*').eq('id', paymentId).single();

        if (!invoice) {
            alert('Payment not found');
            return;
        }

        if (invoice.status === 'cancelled') {
            alert('Payment already cancelled');
            return;
        }

        // Find related sales_history records
        const { data: salesHistory } = await supabaseClient.from('sales_history').select('*').eq('payment_id', paymentId);

        if (salesHistory && salesHistory.length > 0) {
            let stockRestoreErrors = [];
            
            // Restore stock for each sales record
            for (const sale of salesHistory) {
                try {
                    // Fetch current stock first
                    const { data: currentProduct, error: fetchError } = await supabaseClient
                        .from('products')
                        .select('stok')
                        .eq('id', sale.product_id)
                        .single();
                    
                    if (fetchError || !currentProduct) {
                        stockRestoreErrors.push(`Failed to fetch stock for ${sale.nama_barang}: ${fetchError?.message || 'Product not found'}`);
                        continue;
                    }
                    
                    // Calculate new stock
                    const newStock = currentProduct.stok + sale.jumlah;
                    
                    const { data: updatedProduct, error: updateError } = await supabaseClient
                        .from('products')
                        .update({ stok: newStock })
                        .eq('id', sale.product_id)
                        .select('stok')
                        .single();
                    
                    if (updateError || !updatedProduct) {
                        stockRestoreErrors.push(`Failed to restore stock for ${sale.nama_barang}: ${updateError?.message || 'Product not found'}`);
                    }
                } catch (stockError) {
                    stockRestoreErrors.push(`Stock restore error for ${sale.nama_barang}: ${stockError.message}`);
                }
            }
            
            // Only update payment status if all stock restoration succeeded
            if (stockRestoreErrors.length > 0) {
                const errorMsg = stockRestoreErrors.join('\n');
                alert(`Payment NOT cancelled. Stock restoration failed:\n${errorMsg}\n\nPlease try again or contact administrator.`);
                return;
            }
        }

        // Update payment status to cancelled (only if stock restoration succeeded)
        const { error } = await supabaseClient.from('payments').update({ status: 'cancelled' }).eq('id', paymentId);

        if (error) {
            alert('Stock restored but failed to cancel payment status. Manual adjustment required: ' + error.message);
        } else {
            alert('Payment cancelled and stock restored successfully');
            loadMemberPayments();
        }
    } catch (err) {
        alert('Error cancelling payment: ' + err.message);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Filter change handler
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', loadMemberPayments);
    }

    // Load on page load
    loadMemberPayments();
});
