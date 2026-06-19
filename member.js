// member.js - Member Management Module

// Supabase client is initialized in auth.js
// Use global supabaseClient from auth.js
if (typeof supabaseClient === 'undefined') {
    console.error('[member.js] supabaseClient not initialized. Ensure auth.js is loaded before member.js');
}

// Export members to Excel
async function exportMembersToExcel() {
    try {
        showLoading('Loading members for export...');
        
        const { data: members, error } = await supabaseClient
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading members for export:', error);
            alert('Failed to load members for export');
            hideLoading();
            return;
        }
        
        if (!members || members.length === 0) {
            alert('No members to export');
            hideLoading();
            return;
        }
        
        // Call the export function from export-utils.js
        await window.exportMembersToExcel(members);
        hideLoading();
    } catch (error) {
        console.error('Error exporting members:', error);
        alert('Failed to export members');
        hideLoading();
    }
}

// Local function: Load member KPIs and insights
async function loadMemberKPIs() {
    try {
        const { data: members } = await supabaseClient.from('members').select('*');
        const { data: payments } = await supabaseClient.from('payments').select('*');

        const totalMembers = members ? members.length : 0;
        const activeMembers = members ? members.length : 0;

        let memberRevenue = 0;
        if (payments) {
            payments.forEach(payment => {
                if (payment.buyer && payment.buyer.includes('Member')) {
                    memberRevenue += parseFloat(payment.total_harga) || 0;
                }
            });
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const newMembers = members ? members.filter(m => {
            const memberDate = new Date(m.created_at);
            return memberDate.getMonth() === currentMonth && memberDate.getFullYear() === currentYear;
        }).length : 0;

        const memberTotalEl = document.getElementById('memberTotal');
        const memberActiveEl = document.getElementById('memberActive');
        const memberRevenueEl = document.getElementById('memberRevenue');
        const memberNewEl = document.getElementById('memberNew');

        if (memberTotalEl) memberTotalEl.innerText = totalMembers;
        if (memberActiveEl) memberActiveEl.innerText = activeMembers;
        if (memberRevenueEl) memberRevenueEl.innerText = 'Rp ' + memberRevenue.toLocaleString('id-ID');
        if (memberNewEl) memberNewEl.innerText = newMembers;

        const memberInsightsEl = document.getElementById('memberInsights');
        if (memberInsightsEl && members && members.length > 0) {
            const recentMembers = members.slice(-3).reverse();
            
            // Use DOM API instead of innerHTML for security
            const container = document.createElement('div');
            container.className = 'space-y-3';
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'text-xs uppercase tracking-wide text-muted mb-2';
            titleDiv.textContent = 'Recent Members';
            container.appendChild(titleDiv);
            
            recentMembers.forEach(m => {
                const initial = m.nama.charAt(0).toUpperCase();
                const regDate = new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                
                const itemDiv = document.createElement('div');
                itemDiv.className = 'member-insights-item';
                
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'member-insights-avatar';
                avatarDiv.textContent = initial;
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'member-insights-info';
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'member-insights-name';
                nameDiv.textContent = m.nama;
                
                const phoneDiv = document.createElement('div');
                phoneDiv.className = 'member-insights-phone';
                phoneDiv.textContent = m.telepon;
                
                const discountDiv = document.createElement('div');
                discountDiv.className = 'member-insights-discount';
                if (m.diskon_persen > 0) {
                    const discountSpan = document.createElement('span');
                    discountSpan.className = 'text-xs text-emerald-400 font-bold';
                    discountSpan.textContent = m.diskon_persen + '% OFF';
                    discountDiv.appendChild(discountSpan);
                } else {
                    const discountSpan = document.createElement('span');
                    discountSpan.className = 'text-xs text-slate-500';
                    discountSpan.textContent = '0% OFF';
                    discountDiv.appendChild(discountSpan);
                }
                
                const dateDiv = document.createElement('div');
                dateDiv.className = 'member-insights-date';
                dateDiv.textContent = regDate;
                
                infoDiv.appendChild(nameDiv);
                infoDiv.appendChild(phoneDiv);
                infoDiv.appendChild(discountDiv);
                
                itemDiv.appendChild(avatarDiv);
                itemDiv.appendChild(infoDiv);
                itemDiv.appendChild(dateDiv);
                
                container.appendChild(itemDiv);
            });
            
            memberInsightsEl.innerHTML = '';
            memberInsightsEl.appendChild(container);
        }

        loadMemberTable(members, payments);
    } catch (error) {
        console.warn('Failed to load member KPIs:', error);
    }
}

// Local function: Load member table
function loadMemberTable(members, payments) {
    const memberTableBody = document.getElementById('memberTableBody');
    if (!memberTableBody) return;

    if (!members || members.length === 0) {
        memberTableBody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-muted">No members found</td></tr>';
        return;
    }

    let tableHtml = '';
    members.forEach(member => {
        let hasOutstanding = false;
        let outstandingAmount = 0;
        if (payments) {
            payments.forEach(payment => {
                if (payment.buyer === member.nama && (payment.status === 'pending' || payment.status === 'partial')) {
                    hasOutstanding = true;
                    outstandingAmount += parseFloat(payment.remaining_amount || 0);
                }
            });
        }

        const statusClass = hasOutstanding ? 'status-badge--outstanding' : 'status-badge--active';
        const statusText = hasOutstanding ? 'Has Outstanding' : 'Active';
        const initial = member.nama.charAt(0).toUpperCase();

        tableHtml += `
            <tr class="spectre-table__row">
                <td class="spectre-table__cell">
                    <div class="flex items-center gap-3">
                        <div class="table-avatar">
                            ${initial}
                        </div>
                        <span class="font-semibold">${member.nama}</span>
                    </div>
                </td>
                <td class="spectre-table__cell text-muted">${member.telepon}</td>
                <td class="spectre-table__cell">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td class="spectre-table__cell">
                    <div class="flex gap-2">
                        <button onclick="editMember('${member.id}', '${member.nama}', '${member.telepon}', ${member.diskon_persen || 0})" data-role="admin-only" class="spectre-btn spectre-btn--primary spectre-btn--small">
                            Edit
                        </button>
                        <button onclick="deleteMember('${member.id}', '${member.nama}')" data-role="admin-only" class="spectre-btn spectre-btn--danger spectre-btn--small">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    memberTableBody.innerHTML = tableHtml;
}

// Global function: Delete member
window.deleteMember = async function(memberId, memberName) {
    if (!requireAdmin()) {
        return;
    }

    if (!confirm('Yakin ingin menghapus member ini?')) {
        return;
    }

    try {
        const { data: payments } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('buyer', memberName);

        let hasOutstanding = false;
        let outstandingAmount = 0;

        if (payments) {
            payments.forEach(payment => {
                if (payment.status === 'pending' || payment.status === 'partial') {
                    hasOutstanding = true;
                    outstandingAmount += parseFloat(payment.remaining_amount || 0);
                }
            });
        }

        if (hasOutstanding) {
            alert('Member masih memiliki tagihan aktif.');
            return;
        }

        const { error } = await supabaseClient
            .from('members')
            .delete()
            .eq('id', memberId);

        if (error) {
            console.error('Failed to delete member:', error);
            alert('Gagal menghapus member: ' + error.message);
            return;
        }

        alert('Member berhasil dihapus.');
        await loadMemberKPIs();
    } catch (err) {
        console.error('Error deleting member:', err);
        alert('Error deleting member: ' + err.message);
    }
};

// Global function: Edit member
window.editMember = async function(memberId, memberName, memberPhone, currentDiskon) {
    if (!requireAdmin()) {
        return;
    }

    const newDiskon = prompt(`Edit diskon untuk member ${memberName} (${memberPhone})\n\nDiskon saat ini: ${currentDiskon}%\n\nMasukkan diskon baru (0-100):`, currentDiskon);

    if (newDiskon === null) {
        return; // User cancelled
    }

    const diskonPersen = parseInt(newDiskon);

    if (isNaN(diskonPersen) || diskonPersen < 0 || diskonPersen > 100) {
        alert('Diskon harus berupa angka antara 0-100!');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('members')
            .update({ diskon_persen: diskonPersen })
            .eq('id', memberId);

        if (error) {
            console.error('Failed to update member:', error);
            alert('Gagal mengupdate member: ' + error.message);
            return;
        }

        alert(`Diskon member ${memberName} berhasil diupdate menjadi ${diskonPersen}%!`);
        await loadMemberKPIs();
    } catch (err) {
        console.error('Error updating member:', err);
        alert('Error updating member: ' + err.message);
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    await loadMemberKPIs();
    
    // Form submit handler
    const memberForm = document.getElementById('memberForm');
    if (memberForm) {
        memberForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nama = document.getElementById('inputNama').value;
            const telepon = document.getElementById('inputTelepon').value;
            const diskon_persen = parseInt(document.getElementById('inputDiskon').value) || 0;

            // Check if phone number already exists
            const { data: existingMember, error: checkError } = await supabaseClient
                .from('members')
                .select('telepon, nama')
                .eq('telepon', telepon)
                .single();

            if (existingMember) {
                alert(`❌ NOMOR TELEPON SUDAH TERDAFTAR!\n\nNomor ${telepon} sudah digunakan oleh member: ${existingMember.nama}\n\nSilakan gunakan nomor telepon yang berbeda.`);
                return;
            }

            const { error } = await supabaseClient.from('members').insert([{ nama, telepon, diskon_persen }]);

            if (error) {
                alert('Gagal registrasi: ' + error.message);
            } else {
                alert('🎉 MEMBER BERHASIL DIKUNCI KE DATABASE!');
                document.getElementById('memberForm').reset();
                document.getElementById('inputDiskon').value = 0;
                loadMemberKPIs();
            }
        });
    }
});
