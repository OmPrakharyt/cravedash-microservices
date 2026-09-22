/**
 * CRAVEDASH — AUTH SERVICE CLIENT
 * Handles real JWT authentication with backend, local storage,
 * demo account seeding, and role-based redirect
 * Course: 24SDCS03A — SOA Programming & Microservices
 */

const AUTH_BASE = 'http://localhost:8080/api/v1/auth';
const STORAGE_TOKEN_KEY = 'cravedash_jwt_token';
const STORAGE_USER_KEY = 'cravedash_user';

// Demo accounts pre-seeded in the backend DataLoader
const DEMO_ACCOUNTS = {
    'CONSUMER': {
        email: 'om@cravedash.com',
        password: 'cravedash123',
        name: 'Om Prakhar',
        phone: '+91-9876543210',
        role: 'CONSUMER'
    },
    'RESTAURANT_OWNER': {
        email: 'mradul@cravedash.com',
        password: 'cravedash123',
        name: 'Mradul Dixit',
        phone: '+91-9876543211',
        role: 'RESTAURANT_OWNER'
    },
    'DELIVERY_PARTNER': {
        email: 'abhinav@cravedash.com',
        password: 'cravedash123',
        name: 'Abhinav Singh',
        phone: '+91-9876543212',
        role: 'DELIVERY_PARTNER'
    },
    'ADMIN': {
        email: 'admin@cravedash.com',
        password: 'admin123',
        name: 'CraveDash Admin',
        phone: '+91-9876543213',
        role: 'ADMIN'
    }
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (token) {
        const user = JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || '{}');
        if (user && user.role) {
            window.location.href = 'index.html';
            return;
        }
    }

    checkBackendStatus();
});

/* ============================================================
   BACKEND STATUS CHECK
   ============================================================ */
async function checkBackendStatus() {
    const dot = document.getElementById('backend-dot');
    const txt = document.getElementById('backend-status-text');

    try {
        const resp = await fetch(`${AUTH_BASE}/health`, { signal: AbortSignal.timeout(3000) });
        if (resp.ok) {
            dot.className = 'status-dot online';
            txt.textContent = 'Auth Service: ONLINE — Spring Boot :8084 via Gateway :8080';
            // Attempt to seed demo accounts
            seedDemoAccountsIfNeeded();
        } else {
            throw new Error('Non-OK');
        }
    } catch (e) {
        dot.className = 'status-dot offline';
        txt.textContent = 'Backend offline — using offline fallback mode (JWT demo simulation)';
    }
}

/* ============================================================
   SEED DEMO ACCOUNTS (one-time registration on first run)
   ============================================================ */
async function seedDemoAccountsIfNeeded() {
    // Register demo accounts silently, ignoring "already exists" errors
    for (const account of Object.values(DEMO_ACCOUNTS)) {
        try {
            await fetch(`${AUTH_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: account.email,
                    password: account.password,
                    fullName: account.name,
                    phoneNumber: account.phone,
                    role: account.role
                }),
                signal: AbortSignal.timeout(3000)
            });
        } catch (e) {
            // Ignore errors — already exists or offline
        }
    }
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */
function switchAuthTab(tab) {
    const loginSection = document.getElementById('login-form-section');
    const registerSection = document.getElementById('register-form-section');
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const jwtPreview = document.getElementById('jwt-preview');

    if (tab === 'login') {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
    }

    if (jwtPreview) jwtPreview.style.display = 'none';
}

/* ============================================================
   FILL DEMO CREDENTIALS
   ============================================================ */
function fillDemo(email, password, role) {
    // Ensure we are on the login tab
    switchAuthTab('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    showToast(`Demo credentials filled: ${role.replace('_', ' ')}`, 'info');
}

/* ============================================================
   LOGIN HANDLER
   ============================================================ */
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');
    const btnText = document.getElementById('login-btn-text');
    const btnLoading = document.getElementById('login-btn-loading');

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        let authData = null;

        // --- 1. Try real backend first ---
        try {
            const resp = await fetch(`${AUTH_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                signal: AbortSignal.timeout(5000)
            });

            if (resp.ok) {
                authData = await resp.json();
            }
            // If backend returns non-OK (401, 403, 500 etc.), fall through to demo check
        } catch (networkErr) {
            // Network is down or timed out — fall through to demo check
            console.warn('Backend unavailable, trying demo fallback:', networkErr.message);
        }

        // --- 2. If backend didn't authenticate, try demo credentials ---
        if (!authData) {
            const demoUser = Object.values(DEMO_ACCOUNTS).find(
                u => u.email === email && u.password === password
            );

            if (demoUser) {
                // Valid demo credentials → generate offline JWT
                authData = generateMockJwt(demoUser);
                showToast('Offline demo mode — JWT simulation active', 'info');
            } else {
                // Not a demo account and backend also rejected → real error
                throw new Error('Invalid email or password');
            }
        }

        // Store JWT and user in localStorage
        localStorage.setItem(STORAGE_TOKEN_KEY, authData.token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authData.user));

        // Show JWT preview
        showJwtPreview(authData);
        showToast(`Welcome back, ${authData.user.fullName}!`, 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1800);

    } catch (err) {
        errorEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${err.message}`;
        errorEl.style.display = 'flex';
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

/* ============================================================
   REGISTER HANDLER
   ============================================================ */
async function handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');
    const submitBtn = document.getElementById('register-submit-btn');
    const btnText = document.getElementById('reg-btn-text');
    const btnLoading = document.getElementById('reg-btn-loading');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        let authData = null;

        try {
            const resp = await fetch(`${AUTH_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName, phoneNumber: phone, role }),
                signal: AbortSignal.timeout(5000)
            });

            if (resp.ok) {
                authData = await resp.json();
            } else {
                const errBody = await resp.json().catch(() => ({}));
                throw new Error(errBody.error || 'Registration failed');
            }
        } catch (networkErr) {
            if (networkErr.message.includes('already exists') || networkErr.message.includes('Registration')) {
                throw networkErr;
            }

            // Offline fallback
            const mockUser = { email, fullName, phoneNumber: phone, role, id: Date.now() };
            authData = generateMockJwt({ ...mockUser, password });
        }

        localStorage.setItem(STORAGE_TOKEN_KEY, authData.token);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(authData.user));

        showJwtPreview(authData);
        showToast(`Account created! Welcome, ${fullName}!`, 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1800);

    } catch (err) {
        errorEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${err.message}`;
        errorEl.style.display = 'flex';
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

/* ============================================================
   JWT PREVIEW
   ============================================================ */
function showJwtPreview(authData) {
    const preview = document.getElementById('jwt-preview');
    const tokenBox = document.getElementById('jwt-token-text');
    const claimsRow = document.getElementById('jwt-claims-row');

    tokenBox.textContent = `Bearer ${authData.token}`;
    claimsRow.innerHTML = `
        <span class="jwt-claim-chip">sub: ${authData.user.email}</span>
        <span class="jwt-claim-chip">role: ${authData.user.role}</span>
        <span class="jwt-claim-chip">uid: ${authData.user.id || 'demo'}</span>
        <span class="jwt-claim-chip">iss: CraveDash-AuthService</span>
    `;

    preview.style.display = 'block';
}

/* ============================================================
   MOCK JWT GENERATOR (offline fallback)
   ============================================================ */
function generateMockJwt(user) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({
        sub: user.email,
        userId: user.id || Math.floor(Math.random() * 1000) + 10,
        fullName: user.name || user.fullName,
        role: user.role,
        iss: 'CraveDash-AuthService',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400
    })).replace(/=/g, '');
    const sig = btoa('cravedash_hmac_sha256_signature').replace(/=/g, '');
    const token = `${header}.${payload}.${sig}`;

    return {
        token,
        expiresIn: 86400000,
        user: {
            id: user.id || Math.floor(Math.random() * 1000) + 10,
            email: user.email,
            fullName: user.name || user.fullName,
            phoneNumber: user.phone || user.phoneNumber || '',
            role: user.role
        }
    };
}

/* ============================================================
   TOGGLE PASSWORD VISIBILITY
   ============================================================ */
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
