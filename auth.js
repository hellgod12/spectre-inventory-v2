// Authentication and Role Management System
const SUPABASE_URL = 'https://kbaltquoajrmpixgsiec.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LQ1lYO5I1MXJ0itz_PjBA_bvOLm9qP';
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
    console.log('=== AUTH STATE CHANGE (auth.js) ===');
    console.log('AUTH EVENT:', event);
    console.log('AUTH SESSION:', session);
});

// Initialize authentication
async function initAuth() {
    console.log('=== AUTH INIT START ===');

    // Debug: Current URL
    console.log('CURRENT URL:', window.location.href);

    // Debug: Entire localStorage contents
    console.log('LOCAL STORAGE KEYS:', Object.keys(localStorage));
    Object.keys(localStorage).forEach(key => {
        console.log('LS KEY:', key);
        console.log('LS VALUE:', localStorage.getItem(key));
    });

    // Debug: Supabase client configuration
    console.log('SUPABASE CLIENT CONFIG:', supabaseClient);

    try {
        // Check session
        const { data: { session } } = await supabaseClient.auth.getSession();
        console.log('SESSION IN AUTH:', session);
        console.log('SESSION USER ID:', session?.user?.id);

        if (!session) {
            console.log('No session found, would redirect to login');
            console.warn('Would redirect to login.html');
            // window.location.href = 'login.html';
            return false;
        }

        console.log('Session found:', session.user.email);

        // Get user role from profiles table
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        console.log('PROFILE RESULT:', profile);
        console.log('PROFILE ERROR:', error);

        if (error || !profile) {
            console.error('Failed to get profile:', error);
            console.error('Profile data:', profile);
            alert('Failed to get user profile. Please contact administrator.');
            await supabaseClient.auth.signOut();
            console.log('Profile error, would redirect to login');
            console.warn('Would redirect to login.html');
            // window.location.href = 'login.html';
            return false;
        }

        currentUserRole = profile.role;
        currentUserEmail = session.user.email;
        currentUserId = session.user.id;

        // Store in localStorage
        localStorage.setItem('userRole', currentUserRole);
        localStorage.setItem('userEmail', currentUserEmail);
        localStorage.setItem('userId', currentUserId);

        console.log('User role:', currentUserRole);
        console.log('=== AUTH INIT END ===');

        return true;
    } catch (err) {
        console.error('Auth init error:', err);
        console.log('Auth init error, would redirect to login');
        console.warn('Would redirect to login.html');
        // window.location.href = 'login.html';
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
    console.log('=== LOGOUT START ===');
    
    try {
        await supabaseClient.auth.signOut();
        
        // Clear localStorage
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        
        console.log('Logout successful');
        console.log('Logout, would redirect to login');
        console.warn('Would redirect to login.html');
        // window.location.href = 'login.html';
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

// Show user info in UI
function showUserInfo() {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        userInfoEl.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">${currentUserEmail}</span>
                <span class="text-xs px-2 py-1 rounded ${currentUserRole === 'ADMIN' ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}">${currentUserRole}</span>
            </div>
        `;
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
