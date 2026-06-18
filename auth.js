// Authentication and Role Management System
// SECURITY NOTE: In production, these should be set as environment variables
// For Vercel deployment: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project settings
// For local development: Create .env file with these variables
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 
                     process.env?.VITE_SUPABASE_URL || 
                     'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                         process.env?.VITE_SUPABASE_ANON_KEY || 
                         'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'sb-auth-token' // Explicit storage key to ensure consistency
    }
});

// User role and session
let currentUserRole = null;
let currentUserEmail = null;
let currentUserId = null;

// Track auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session ? 'User logged in' : 'User logged out');
    
    if (event === 'SIGNED_IN') {
        // Refresh user data
        if (session) {
            currentUserEmail = session.user.email;
            currentUserId = session.user.id;
            // Role will be fetched by initAuth
        }
    } else if (event === 'SIGNED_OUT') {
        // Clear user data
        currentUserEmail = null;
        currentUserId = null;
        currentUserRole = null;
        // Clear localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
    }
});

// Initialize authentication
async function initAuth() {
    try {
        // Check session
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) {
            window.location.href = 'login.html';
            return false;
        }

        // Get user role from profiles table
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error || !profile) {
            console.error('Failed to get profile:', error);
            alert('Failed to get user profile. Please contact administrator.');
            await supabaseClient.auth.signOut();
            window.location.href = 'login.html';
            return false;
        }

        currentUserRole = profile.role;
        currentUserEmail = session.user.email;
        currentUserId = session.user.id;

        // Store in localStorage
        localStorage.setItem('userRole', currentUserRole);
        localStorage.setItem('userEmail', currentUserEmail);
        localStorage.setItem('userId', currentUserId);

        return true;
    } catch (err) {
        console.error('Auth init error:', err);
        window.location.href = 'login.html';
        return false;
    }
}

// Check if user has specific role
function hasRole(role) {
    return currentUserRole === role;
}

// Check if user is ADMIN
function isAdmin() {
    return currentUserRole === 'ADMIN';
}

// Check if user is CASHIER
function isCashier() {
    return currentUserRole === 'CASHIER';
}

// Require ADMIN role
function requireAdmin() {
    if (!isAdmin()) {
        alert('Akses ditolak. Hanya ADMIN yang dapat mengakses fitur ini.');
        return false;
    }
    return true;
}

// Logout function
async function logout() {
    try {
        await supabaseClient.auth.signOut();

        // Clear localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');

        window.location.href = 'login.html';
    } catch (err) {
        console.error('Logout error:', err);
        alert('Logout failed. Please try again.');
    }
}

// Hide elements based on role
function hideElementsForCashier() {
    if (isCashier()) {
        // Hide delete buttons
        const deleteButtons = document.querySelectorAll('[data-role="admin-only"]');
        deleteButtons.forEach(btn => {
            btn.style.display = 'none';
        });

        // Hide admin menu items
        const adminMenuItems = document.querySelectorAll('[data-menu="admin-only"]');
        adminMenuItems.forEach(item => {
            item.style.display = 'none';
        });
    }
}

// Utility function to escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show user info in UI
function showUserInfo() {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        // Use DOM API instead of innerHTML for security
        const container = document.createElement('div');
        container.className = 'flex items-center gap-2';
        
        const emailSpan = document.createElement('span');
        emailSpan.className = 'text-sm font-semibold';
        emailSpan.textContent = currentUserEmail;
        
        const roleSpan = document.createElement('span');
        roleSpan.className = `text-xs px-2 py-1 rounded ${currentUserRole === 'ADMIN' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}`;
        roleSpan.textContent = currentUserRole;
        
        container.appendChild(emailSpan);
        container.appendChild(roleSpan);
        
        userInfoEl.innerHTML = '';
        userInfoEl.appendChild(container);
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    const authSuccess = await initAuth();
    if (authSuccess) {
        hideElementsForCashier();
        showUserInfo();
    }
});
