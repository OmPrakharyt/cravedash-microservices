/**
 * CRAVEDASH — MAIN APPLICATION ENGINE
 * PS034 · 24SDCS03A — SOA Programming & Microservices
 * Team: Om Prakhar · Mradul Dixit · Abhinav Singh
 *
 * REAL ROLE-BASED SYSTEM:
 *  CONSUMER        → Marketplace + My Orders
 *  RESTAURANT_OWNER → Menu Manager + Incoming Orders (Accept/Reject)
 *  DELIVERY_PARTNER → Pickup Queue + Active Deliveries
 *  ADMIN           → All above + System Health
 *
 * Shared order state via localStorage — simulates real-time cross-role flow:
 *  Consumer places order  →  PENDING_CONFIRMATION
 *  Restaurant Accepts     →  PREPARING
 *  Restaurant Rejects     →  REJECTED
 *  Delivery picks up      →  PICKED_UP
 *  Delivery delivers      →  DELIVERED
 */

const GATEWAY  = 'http://localhost:8080';
const KEY_TOKEN = 'cravedash_jwt_token';
const KEY_USER  = 'cravedash_user';
const KEY_ORDERS = 'cravedash_orders'; // shared cross-role order store

/* ══════════════════════════════════════════════════════════════
   SEED DATA
══════════════════════════════════════════════════════════════ */
const RESTAURANTS = [
    {
        id: 1, name: 'Gourmet Smash & Grills', cuisine: 'American', rating: 4.8,
        deliveryTimeMinutes: 25, address: '742 Evergreen Blvd, Central Square',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', isOpen: true,
        menu: [
            { id: 101, name: 'Truffle Smash Burger', description: 'Double dry-aged Angus patty with black truffle aioli', price: 299, category: 'Burgers', isAvailable: true, prepTime: 15 },
            { id: 102, name: 'Crispy Bacon Smokehouse', description: 'Smoked bacon, barbecue glaze, crispy onion strings', price: 249, category: 'Burgers', isAvailable: true, prepTime: 15 },
            { id: 103, name: 'Parmesan Rosemary Fries', description: 'Hand-cut fries with coarse sea salt & aged parmesan', price: 129, category: 'Sides', isAvailable: true, prepTime: 8 },
            { id: 104, name: 'Salted Caramel Shake', description: 'Vanilla gelato with house-made salted caramel', price: 149, category: 'Beverages', isAvailable: true, prepTime: 5 }
        ]
    },
    {
        id: 2, name: 'Royal Nizami Biryani & Kebabs', cuisine: 'Indian', rating: 4.9,
        deliveryTimeMinutes: 30, address: '108 Heritage Row, Old Market',
        imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600', isOpen: true,
        menu: [
            { id: 201, name: 'Hyderabadi Dum Biryani', description: 'Slow-cooked basmati with saffron & spiced chicken', price: 349, category: 'Main Course', isAvailable: true, prepTime: 25 },
            { id: 202, name: 'Galouti Kebab Melt', description: 'Melt-in-mouth lamb patties with 24 royal spices', price: 279, category: 'Starters', isAvailable: true, prepTime: 18 },
            { id: 203, name: 'Paneer Butter Masala', description: 'Cottage cheese in velvety tomato gravy with butter', price: 299, category: 'Main Course', isAvailable: true, prepTime: 20 },
            { id: 204, name: 'Garlic Butter Naan', description: 'Clay oven flatbread with roasted garlic', price: 59, category: 'Breads', isAvailable: true, prepTime: 6 }
        ]
    },
    {
        id: 3, name: 'Tokyo Ramen & Sushi Lab', cuisine: 'Japanese', rating: 4.7,
        deliveryTimeMinutes: 35, address: '45 Cyber Hub, Tech District',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', isOpen: true,
        menu: [
            { id: 301, name: 'Tonkotsu Ramen', description: '18-hour pork bone broth with chashu & tamago', price: 320, category: 'Ramen', isAvailable: true, prepTime: 20 },
            { id: 302, name: 'Dragon Sushi Roll', description: 'Tempura shrimp, spicy tuna, avocado, tobiko', price: 299, category: 'Sushi', isAvailable: true, prepTime: 15 },
            { id: 303, name: 'Pork Gyoza', description: 'Crispy pan-seared dumplings with ginger sauce', price: 179, category: 'Appetizers', isAvailable: true, prepTime: 10 },
            { id: 304, name: 'Matcha Mille Crepe', description: 'Japanese matcha crepe with sweet red bean', price: 159, category: 'Desserts', isAvailable: true, prepTime: 5 }
        ]
    },
    {
        id: 4, name: 'Bella Italia Artisan Trattoria', cuisine: 'Italian', rating: 4.85,
        deliveryTimeMinutes: 28, address: '12 Harbor Walk, Marina Promenade',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600', isOpen: true,
        menu: [
            { id: 401, name: 'Burrata Margherita', description: 'San Marzano tomato, fresh burrata, sweet basil', price: 379, category: 'Pizza', isAvailable: true, prepTime: 18 },
            { id: 402, name: 'Tagliatelle Bolognese', description: 'Handmade egg pasta, slow-braised beef ragu, Parmigiano', price: 399, category: 'Pasta', isAvailable: true, prepTime: 16 },
            { id: 403, name: 'Espresso Tiramisu', description: 'Ladyfingers soaked in espresso, mascarpone cream', price: 199, category: 'Dessert', isAvailable: true, prepTime: 5 }
        ]
    }
];

/* ══════════════════════════════════════════════════════════════
   APP STATE
══════════════════════════════════════════════════════════════ */
const state = {
    user: null,
    token: '',
    role: '',
    restaurants: JSON.parse(JSON.stringify(RESTAURANTS)),
    cart: { restaurantId: null, restaurantName: '', items: [] },
    activeTab: ''
};

// Helpers to read/write shared order store
function getOrders()          { return JSON.parse(localStorage.getItem(KEY_ORDERS) || '[]'); }
function saveOrders(orders)   { localStorage.setItem(KEY_ORDERS, JSON.stringify(orders)); }
function addOrder(order)      { const o = getOrders(); o.push(order); saveOrders(o); }
function updateOrderStatus(id, status, extra = {}) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) { orders[idx].status = status; Object.assign(orders[idx], extra); saveOrders(orders); }
}

/* ══════════════════════════════════════════════════════════════
   ROLE CONFIG
══════════════════════════════════════════════════════════════ */
const ROLE_CONFIG = {
    CONSUMER: {
        label: '🛒 Consumer',
        icon: 'fa-user',
        defaultTab: 'marketplace',
        tabs: [
            { id: 'marketplace',  label: 'Marketplace',  icon: 'fa-utensils' },
            { id: 'my-orders',    label: 'My Orders',    icon: 'fa-receipt' },
            { id: 'topology',     label: 'Mesh Topology', icon: 'fa-network-wired' }
        ]
    },
    RESTAURANT_OWNER: {
        label: '🍽️ Restaurant Owner',
        icon: 'fa-store',
        defaultTab: 'incoming-orders',
        tabs: [
            { id: 'incoming-orders', label: 'Incoming Orders', icon: 'fa-clipboard-list' },
            { id: 'menu-manager',    label: 'Menu Manager',    icon: 'fa-store' },
            { id: 'topology',        label: 'Mesh Topology',   icon: 'fa-network-wired' }
        ]
    },
    DELIVERY_PARTNER: {
        label: '🏍️ Delivery Partner',
        icon: 'fa-motorcycle',
        defaultTab: 'delivery',
        tabs: [
            { id: 'delivery',  label: 'My Deliveries', icon: 'fa-motorcycle' },
            { id: 'topology',  label: 'Mesh Topology', icon: 'fa-network-wired' }
        ]
    },
    ADMIN: {
        label: '🛡️ Admin',
        icon: 'fa-user-shield',
        defaultTab: 'admin',
        tabs: [
            { id: 'marketplace',     label: 'Marketplace',    icon: 'fa-utensils' },
            { id: 'my-orders',       label: 'All Orders',     icon: 'fa-receipt' },
            { id: 'incoming-orders', label: 'Incoming Orders', icon: 'fa-clipboard-list' },
            { id: 'menu-manager',    label: 'Menu Manager',   icon: 'fa-store' },
            { id: 'delivery',        label: 'Delivery',       icon: 'fa-motorcycle' },
            { id: 'admin',           label: 'Admin Dashboard', icon: 'fa-chart-line' },
            { id: 'topology',        label: 'Mesh Topology',  icon: 'fa-network-wired' }
        ]
    }
};

/* ══════════════════════════════════════════════════════════════
   BOOTSTRAP
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // ── Auth Guard ──
    const token = localStorage.getItem(KEY_TOKEN);
    const userJson = localStorage.getItem(KEY_USER);
    if (!token || !userJson) { window.location.href = 'login.html'; return; }

    try {
        state.user  = JSON.parse(userJson);
        state.token = token;
        state.role  = state.user.role;
    } catch {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    // ── Setup ──
    buildNav();
    updateHeader();
    setupLogout();
    setupMarketplace();
    setupCart();
    setupPartnerConsole();
    setupTopology();
    setupAdminHandlers();
    setupRefreshButtons();

    // Try backend sync
    tryFetchBackend();

    const cfg = ROLE_CONFIG[state.role] || ROLE_CONFIG.CONSUMER;
    switchTab(cfg.defaultTab);

    showToast(`Welcome, ${state.user.fullName}! Role: ${cfg.label}`, 'success');
});

/* ══════════════════════════════════════════════════════════════
   NAV BUILD (strict role isolation)
══════════════════════════════════════════════════════════════ */
function buildNav() {
    const nav = document.getElementById('main-nav');
    nav.innerHTML = '';
    const cfg = ROLE_CONFIG[state.role] || ROLE_CONFIG.CONSUMER;

    cfg.tabs.forEach(tab => {
        const btn = document.createElement('button');
        btn.className = 'nav-tab';
        btn.dataset.tab = tab.id;
        btn.id = `nav-${tab.id}`;
        btn.innerHTML = `<i class="fa-solid ${tab.icon}"></i><span>${tab.label}</span>`;
        btn.addEventListener('click', () => switchTab(tab.id));
        nav.appendChild(btn);
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));

    const btn  = document.getElementById(`nav-${tabId}`);
    const view = document.getElementById(`view-${tabId}`);
    if (btn)  btn.classList.add('active');
    if (view) view.classList.add('active');

    // Load data for each tab
    if (tabId === 'my-orders')       renderMyOrders();
    if (tabId === 'incoming-orders') renderIncomingOrders();
    if (tabId === 'delivery')        renderDeliveryDashboard();
    if (tabId === 'admin')           renderAdminDashboard();
    if (tabId === 'topology')        pingMeshProbes();
}

/* ══════════════════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════════════════ */
function updateHeader() {
    const cfg = ROLE_CONFIG[state.role] || ROLE_CONFIG.CONSUMER;
    document.getElementById('hdr-name').textContent = state.user.fullName;
    document.getElementById('hdr-role').textContent = cfg.label;
    document.getElementById('hdr-avatar').innerHTML = `<i class="fa-solid ${cfg.icon}"></i>`;

    // Show cart FAB only for consumers (and admins)
    if (state.role === 'CONSUMER' || state.role === 'ADMIN') {
        document.getElementById('cart-fab').style.display = 'flex';
    }

    // Update JWT viewer
    const display   = document.getElementById('jwt-token-display');
    const claimsDiv = document.getElementById('jwt-claims-display');
    if (display)   display.textContent = `Bearer ${state.token}`;
    if (claimsDiv) claimsDiv.innerHTML = `
        <div class="claim-item"><span class="claim-key">User ID</span><span class="claim-val">${state.user.id || 'N/A'}</span></div>
        <div class="claim-item"><span class="claim-key">Email</span><span class="claim-val">${state.user.email}</span></div>
        <div class="claim-item"><span class="claim-key">Role</span><span class="claim-val">${state.user.role}</span></div>
        <div class="claim-item"><span class="claim-key">Issuer</span><span class="claim-val">CraveDash-AuthService</span></div>
    `;
}

/* ══════════════════════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════════════════════ */
function setupLogout() {
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem(KEY_TOKEN);
        localStorage.removeItem(KEY_USER);
        window.location.href = 'login.html';
    });
}

/* ══════════════════════════════════════════════════════════════
   MARKETPLACE
══════════════════════════════════════════════════════════════ */
function setupMarketplace() {
    renderRestaurants(state.restaurants);

    // Cuisine filter chips
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const cuisine = chip.dataset.cuisine;
            renderRestaurants(cuisine === 'ALL'
                ? state.restaurants
                : state.restaurants.filter(r => r.cuisine === cuisine));
        });
    });

    // Search
    document.getElementById('restaurant-search')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        renderRestaurants(state.restaurants.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q) ||
            r.menu.some(m => m.name.toLowerCase().includes(q))
        ));
    });

    // Modal close
    document.getElementById('menu-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('menu-modal')?.addEventListener('click', e => {
        if (e.target.id === 'menu-modal') closeModal();
    });
}

function renderRestaurants(list) {
    const grid = document.getElementById('restaurants-grid');
    if (!grid) return;

    const badge = document.getElementById('restaurant-count-badge');
    if (badge) badge.textContent = `${list.length} verified partners`;

    const statEl = document.getElementById('stat-restaurants');
    if (statEl) statEl.textContent = list.length;

    if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-magnifying-glass"></i><h3>No restaurants found</h3><p>Try a different search or filter</p></div>`;
        return;
    }

    grid.innerHTML = '';
    list.forEach(r => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.innerHTML = `
            <div class="card-image-wrap">
                <img src="${r.imageUrl}" alt="${r.name}" loading="lazy">
                <div class="card-badge-rating"><i class="fa-solid fa-star"></i> ${r.rating}</div>
                <div class="card-badge-cuisine">${r.cuisine}</div>
            </div>
            <div class="restaurant-body">
                <h3 class="restaurant-title">${r.name}</h3>
                <div class="restaurant-addr"><i class="fa-solid fa-location-dot"></i> ${r.address}</div>
                <div class="restaurant-footer">
                    <div class="delivery-eta"><i class="fa-solid fa-clock"></i> ${r.deliveryTimeMinutes} mins</div>
                    <button class="btn-view-menu">Explore Menu</button>
                </div>
            </div>`;
        card.querySelector('.btn-view-menu').addEventListener('click', e => { e.stopPropagation(); openMenu(r.id); });
        card.addEventListener('click', () => openMenu(r.id));
        grid.appendChild(card);
    });
}

function openMenu(restaurantId) {
    const rest = state.restaurants.find(r => r.id === restaurantId);
    if (!rest) return;

    document.getElementById('modal-rest-name').textContent   = rest.name;
    document.getElementById('modal-rest-cuisine').textContent = `${rest.cuisine} · ~${rest.deliveryTimeMinutes} mins delivery`;

    const body = document.getElementById('modal-menu-items');
    body.innerHTML = '';

    // Group by category
    const categories = [...new Set(rest.menu.map(i => i.category))];
    categories.forEach(cat => {
        const catHeader = document.createElement('div');
        catHeader.className = 'menu-category-header';
        catHeader.textContent = cat;
        body.appendChild(catHeader);

        rest.menu.filter(i => i.category === cat).forEach(item => {
            const available = item.isAvailable !== false;
            const div = document.createElement('div');
            div.className = 'modal-dish-card';
            div.innerHTML = `
                <div class="dish-details">
                    <h4>${item.name} ${!available ? '<span class="oos-tag">Out of Stock</span>' : ''}</h4>
                    <p>${item.description}</p>
                    <div class="dish-meta">
                        <span class="dish-price">₹${item.price}</span>
                        <span class="dish-category-tag">${item.category}</span>
                        <span style="color:var(--text-muted);font-size:0.75rem"><i class="fa-solid fa-clock"></i> ${item.prepTime}m</span>
                    </div>
                </div>
                <button class="btn-add-cart" ${!available ? 'disabled' : ''} data-item-id="${item.id}" data-rest-id="${rest.id}">
                    ${available ? '<i class="fa-solid fa-plus"></i> Add' : 'Unavailable'}
                </button>`;
            if (available) {
                div.querySelector('.btn-add-cart').addEventListener('click', e => {
                    e.stopPropagation();
                    addToCart(rest, item);
                });
            }
            body.appendChild(div);
        });
    });

    document.getElementById('menu-modal').classList.add('open');
}

function closeModal() { document.getElementById('menu-modal').classList.remove('open'); }

/* ══════════════════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════════════════ */
function setupCart() {
    document.getElementById('cart-fab')?.addEventListener('click', () => {
        document.getElementById('cart-drawer').classList.toggle('open');
    });
    document.getElementById('cart-drawer-close')?.addEventListener('click', () => {
        document.getElementById('cart-drawer').classList.remove('open');
    });
    document.getElementById('btn-place-order')?.addEventListener('click', handlePlaceOrder);

    document.querySelectorAll('.pay-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.pay-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        });
    });

    renderCart();
}

function addToCart(restaurant, item) {
    if (state.cart.restaurantId && state.cart.restaurantId !== restaurant.id) {
        if (!confirm(`Clear cart from "${state.cart.restaurantName}" and add from "${restaurant.name}"?`)) return;
        state.cart.items = [];
    }
    state.cart.restaurantId   = restaurant.id;
    state.cart.restaurantName = restaurant.name;

    const existing = state.cart.items.find(i => i.menuItemId === item.id);
    if (existing) { existing.quantity += 1; }
    else { state.cart.items.push({ menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }); }

    renderCart();
    showToast(`"${item.name}" added to cart`, 'success');
    document.getElementById('cart-drawer').classList.add('open');
}

function updateCartItemQuantity(itemId, delta) {
    const item = state.cart.items.find(i => i.menuItemId === itemId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) state.cart.items = state.cart.items.filter(i => i.menuItemId !== itemId);
    if (!state.cart.items.length) { state.cart.restaurantId = null; state.cart.restaurantName = ''; }
    renderCart();
}
window.updateCartItemQuantity = updateCartItemQuantity;

function renderCart() {
    const list       = document.getElementById('cart-items-list');
    const counter    = document.getElementById('cart-counter');
    const restTag    = document.getElementById('cart-restaurant-name');
    const subtotalEl = document.getElementById('cart-subtotal');
    const grandEl    = document.getElementById('cart-grand-total');

    const totalQty = state.cart.items.reduce((a, i) => a + i.quantity, 0);
    if (counter)  counter.textContent  = totalQty;
    if (restTag)  restTag.textContent  = state.cart.restaurantName || 'No items selected';

    // Update stat
    const statOrders = document.getElementById('stat-orders');
    if (statOrders) statOrders.textContent = getOrders().filter(o => o.userId === state.user.id || o.userId == state.user.id).length;

    if (!list) return;

    if (!state.cart.items.length) {
        list.innerHTML = '<div class="empty-state-mini">Your basket is empty. Browse restaurants!</div>';
        if (subtotalEl) subtotalEl.textContent = '₹0';
        if (grandEl)    grandEl.textContent    = '₹0';
        return;
    }

    list.innerHTML = '';
    let subtotal = 0;
    state.cart.items.forEach(item => {
        subtotal += item.price * item.quantity;
        const el = document.createElement('div');
        el.className = 'cart-item-card';
        el.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4><span>₹${item.price} each</span>
            </div>
            <div class="cart-item-qty">
                <button class="btn-qty" onclick="updateCartItemQuantity(${item.menuItemId},-1)">−</button>
                <span>${item.quantity}</span>
                <button class="btn-qty" onclick="updateCartItemQuantity(${item.menuItemId},1)">+</button>
            </div>`;
        list.appendChild(el);
    });

    const fee = 49;
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (grandEl)    grandEl.textContent    = `₹${subtotal + fee}`;
}

/* ══════════════════════════════════════════════════════════════
   PLACE ORDER
══════════════════════════════════════════════════════════════ */
async function handlePlaceOrder() {
    if (!state.cart.items.length) { showToast('Add items to cart first!', 'error'); return; }

    const address  = document.getElementById('order-address-input').value.trim() || state.user.address || '742 Evergreen Blvd';
    const payRadio = document.querySelector('input[name="paymethod"]:checked');
    const payMethod = payRadio ? payRadio.value : 'UPI';

    const checkoutBtn = document.getElementById('btn-place-order');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Orchestrating…';

    const rest     = state.restaurants.find(r => r.id === state.cart.restaurantId);
    const subtotal = state.cart.items.reduce((a, i) => a + i.price * i.quantity, 0);

    const orderPayload = {
        restaurantId: state.cart.restaurantId,
        userId: state.user.id,
        customerName: state.user.fullName,
        customerEmail: state.user.email,
        deliveryAddress: address,
        paymentMethod: payMethod,
        items: state.cart.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity }))
    };

    try {
        let orderResult = null;

        try {
            const resp = await fetch(`${GATEWAY}/api/v1/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                body: JSON.stringify(orderPayload),
                signal: AbortSignal.timeout(6000)
            });
            if (resp.ok) orderResult = await resp.json();
        } catch (_) { /* fallback below */ }

        // Local order (shared cross-role state)
        const localOrder = {
            id: orderResult?.id || `ORD-${Date.now()}`,
            orderNumber: orderResult?.orderNumber || `CRV-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
            restaurantId: state.cart.restaurantId,
            restaurantName: rest.name,
            userId: state.user.id,
            customerName: state.user.fullName,
            customerEmail: state.user.email,
            deliveryAddress: address,
            paymentMethod: payMethod,
            status: 'PENDING_CONFIRMATION',
            totalAmount: subtotal + 49,
            paymentRef: `TXN-${Date.now()}`,
            placedAt: new Date().toISOString(),
            items: state.cart.items.map(i => ({
                menuItemId: i.menuItemId,
                itemName: i.name,
                unitPrice: i.price,
                quantity: i.quantity,
                subtotal: i.price * i.quantity
            }))
        };

        addOrder(localOrder);

        showToast(`Order ${localOrder.orderNumber} placed! Waiting for restaurant confirmation…`, 'success');

        // Reset cart
        state.cart = { restaurantId: null, restaurantName: '', items: [] };
        renderCart();
        document.getElementById('cart-drawer').classList.remove('open');

        // Switch to My Orders
        switchTab('my-orders');

    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<span>Place Order &amp; Pay</span><i class="fa-solid fa-arrow-right"></i>';
    }
}

/* ══════════════════════════════════════════════════════════════
   MY ORDERS (Consumer view)
══════════════════════════════════════════════════════════════ */
function renderMyOrders() {
    const container = document.getElementById('my-orders-list');
    if (!container) return;

    const allOrders = getOrders();
    const myOrders  = state.role === 'ADMIN'
        ? allOrders
        : allOrders.filter(o => o.userId == state.user.id || o.customerEmail === state.user.email);

    // Update admin stat
    const admOrders = document.getElementById('adm-orders');
    if (admOrders) admOrders.textContent = allOrders.length;

    // Update consumer stat
    const statOrders = document.getElementById('stat-orders');
    if (statOrders) statOrders.textContent = myOrders.length;

    if (!myOrders.length) {
        container.innerHTML = `<div class="empty-state" style="border-radius:16px">
            <i class="fa-solid fa-receipt"></i>
            <h3>No orders yet</h3>
            <p>Browse restaurants in the Marketplace tab and place your first order!</p>
        </div>`;
        return;
    }

    container.innerHTML = '';
    [...myOrders].reverse().forEach(order => {
        container.appendChild(buildOrderTrackCard(order));
    });
}

function buildOrderTrackCard(order) {
    const STEPS = [
        { key: 'PENDING_CONFIRMATION', label: 'Placed',    icon: 'fa-file-invoice' },
        { key: 'CONFIRMED',            label: 'Confirmed', icon: 'fa-circle-check' },
        { key: 'PREPARING',            label: 'Preparing', icon: 'fa-kitchen-set' },
        { key: 'READY_FOR_PICKUP',     label: 'Ready',     icon: 'fa-box' },
        { key: 'PICKED_UP',            label: 'Picked Up', icon: 'fa-motorcycle' },
        { key: 'DELIVERED',            label: 'Delivered', icon: 'fa-house-chimney' }
    ];

    const ORDER_RANK = {
        'PENDING_CONFIRMATION': 0,
        'CONFIRMED': 1, 'PREPARING': 1,
        'READY_FOR_PICKUP': 2,
        'PICKED_UP': 3,
        'DELIVERED': 4,
        'REJECTED': -1
    };

    const card = document.createElement('div');
    card.className = 'order-track-card';

    const currentRank = ORDER_RANK[order.status] ?? 0;

    const stepHTML = STEPS.map((step, i) => {
        const stepRank = ORDER_RANK[step.key] ?? i;
        const isDone   = currentRank > stepRank;
        const isActive = currentRank === stepRank && order.status !== 'REJECTED';
        const cls = isDone ? 'done' : (isActive ? 'active' : '');
        const connector = i < STEPS.length - 1
            ? `<div class="step-connector ${isDone ? 'done' : ''}"></div>` : '';
        return `
            <div class="step-node ${cls}">
                <div class="step-node-icon"><i class="fa-solid ${step.icon}"></i></div>
                <div class="step-node-label">${step.label}</div>
            </div>${connector}`;
    }).join('');

    const itemsHTML = order.items.map(i =>
        `<div class="oac-item-row"><span>${i.quantity}× ${i.itemName}</span><span>₹${i.subtotal}</span></div>`
    ).join('');

    const placedTime = new Date(order.placedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
        <div class="order-track-header">
            <div>
                <div class="order-track-num">#${order.orderNumber}</div>
                <div class="order-track-rest">${order.restaurantName} · ${placedTime}</div>
            </div>
            <span class="order-status-pill status-${order.status}">${order.status.replace(/_/g,' ')}</span>
        </div>
        ${order.status !== 'REJECTED' ? `<div class="order-track-stepper">${stepHTML}</div>` : `<div style="padding:1rem 1.4rem;color:#FF5252;font-size:0.85rem"><i class="fa-solid fa-xmark"></i> Order was rejected by the restaurant.</div>`}
        <div class="oac-items-list" style="margin:0 1.4rem 0.8rem">${itemsHTML}</div>
        <div class="order-track-meta">
            <span><i class="fa-solid fa-location-dot"></i> ${order.deliveryAddress}</span>
            <span><i class="fa-solid fa-wallet"></i> ${order.paymentMethod}</span>
            <span><i class="fa-solid fa-tag"></i> ₹${order.totalAmount}</span>
            <span><i class="fa-solid fa-code"></i> ${order.paymentRef}</span>
        </div>`;
    return card;
}

/* ══════════════════════════════════════════════════════════════
   RESTAURANT OWNER — INCOMING ORDERS (Accept / Reject)
══════════════════════════════════════════════════════════════ */
function renderIncomingOrders() {
    const grid = document.getElementById('incoming-orders-grid');
    if (!grid) return;

    const allOrders = getOrders();

    // Show ALL pending/preparing orders to restaurant owner (or admin)
    // In real app this would be filtered by restaurant ID
    const relevant = state.role === 'ADMIN'
        ? allOrders
        : allOrders.filter(o =>
            ['PENDING_CONFIRMATION','CONFIRMED','PREPARING','READY_FOR_PICKUP'].includes(o.status)
        );

    if (!relevant.length) {
        grid.innerHTML = `<div class="empty-state">
            <i class="fa-solid fa-inbox"></i>
            <h3>No Incoming Orders</h3>
            <p>Orders from consumers will appear here in real time. Start the backend services and place test orders from the Consumer account.</p>
        </div>`;
        return;
    }

    grid.innerHTML = '';
    [...relevant].reverse().forEach(order => {
        grid.appendChild(buildRestaurantOrderCard(order));
    });
}

function buildRestaurantOrderCard(order) {
    const isPending   = order.status === 'PENDING_CONFIRMATION';
    const isConfirmed = order.status === 'CONFIRMED' || order.status === 'PREPARING';
    const isReady     = order.status === 'READY_FOR_PICKUP';

    const itemsHTML = order.items.map(i =>
        `<div class="oac-item-row"><span>${i.quantity}× ${i.itemName}</span><span>₹${i.subtotal}</span></div>`
    ).join('');

    const placedTime = new Date(order.placedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const card = document.createElement('div');
    card.className = 'order-action-card';
    card.id = `rest-card-${order.id}`;

    let accentBar = 'oac-accent-bar';
    if (isConfirmed) accentBar += ' green';
    if (isReady)     accentBar += ' purple';

    let actionsHTML = '';
    if (isPending) {
        actionsHTML = `
            <button class="btn-accept" onclick="restaurantAction('${order.id}','ACCEPT')">
                <i class="fa-solid fa-check"></i> Accept Order
            </button>
            <button class="btn-reject" onclick="restaurantAction('${order.id}','REJECT')">
                <i class="fa-solid fa-xmark"></i> Reject
            </button>`;
    } else if (isConfirmed) {
        actionsHTML = `
            <button class="btn-pickup" style="background:rgba(0,230,118,0.12);border-color:rgba(0,230,118,0.3);color:#00E676" onclick="restaurantAction('${order.id}','READY')">
                <i class="fa-solid fa-box"></i> Mark Ready for Pickup
            </button>`;
    } else if (isReady) {
        actionsHTML = `<div style="font-size:0.82rem;color:#7C4DFF;padding:0.3rem 0"><i class="fa-solid fa-check-double"></i> Waiting for delivery partner to pick up</div>`;
    } else {
        actionsHTML = `<div style="font-size:0.82rem;color:var(--text-muted)">Status: ${order.status.replace(/_/g,' ')}</div>`;
    }

    card.innerHTML = `
        <div class="${accentBar}"></div>
        <div class="oac-header">
            <div>
                <div class="oac-order-num">#${order.orderNumber}</div>
                <div class="oac-time">${order.customerName} · ${placedTime}</div>
            </div>
            <span class="order-status-pill status-${order.status}">${order.status.replace(/_/g,' ')}</span>
        </div>
        <div class="oac-body">
            <div class="oac-info-row"><i class="fa-solid fa-user"></i> <strong>${order.customerName}</strong></div>
            <div class="oac-info-row"><i class="fa-solid fa-location-dot"></i> ${order.deliveryAddress}</div>
            <div class="oac-info-row"><i class="fa-solid fa-wallet"></i> ${order.paymentMethod} · ₹${order.totalAmount}</div>
        </div>
        <div class="oac-items-list">${itemsHTML}</div>
        <div class="oac-total"><span>Order Total:</span><strong>₹${order.totalAmount}</strong></div>
        <div class="oac-actions">${actionsHTML}</div>`;
    return card;
}

window.restaurantAction = function(orderId, action) {
    if (action === 'ACCEPT') {
        updateOrderStatus(orderId, 'PREPARING');
        showToast('Order accepted! Kitchen is now preparing.', 'success');
    } else if (action === 'REJECT') {
        if (!confirm('Are you sure you want to reject this order?')) return;
        updateOrderStatus(orderId, 'REJECTED');
        showToast('Order rejected.', 'error');
    } else if (action === 'READY') {
        updateOrderStatus(orderId, 'READY_FOR_PICKUP');
        showToast('Order marked Ready for Pickup! Notifying delivery fleet.', 'success');
    }
    renderIncomingOrders(); // re-render
};

/* ══════════════════════════════════════════════════════════════
   MENU MANAGER (Restaurant Owner)
══════════════════════════════════════════════════════════════ */
function setupPartnerConsole() {
    const select = document.getElementById('partner-restaurant-select');
    if (!select) return;

    state.restaurants.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.name} (${r.cuisine})`;
        select.appendChild(opt);
    });

    select.addEventListener('change', e => renderPartnerMenu(Number(e.target.value)));
    renderPartnerMenu(state.restaurants[0].id);
}

function renderPartnerMenu(restaurantId) {
    const tbody    = document.getElementById('partner-menu-tbody');
    const avail    = document.getElementById('partner-available-count');
    const unavail  = document.getElementById('partner-unavailable-count');
    if (!tbody) return;

    const rest = state.restaurants.find(r => r.id === restaurantId);
    if (!rest) return;

    let activeCount = 0, outCount = 0;
    tbody.innerHTML = '';

    rest.menu.forEach(item => {
        const isAvailable = item.isAvailable !== false;
        if (isAvailable) activeCount++; else outCount++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="table-item-cell">
                    <img src="${rest.imageUrl}" alt="${item.name}">
                    <div><h4>${item.name}</h4><p>${item.description}</p></div>
                </div>
            </td>
            <td><span class="badge-role">${item.category}</span></td>
            <td><strong>₹${item.price}</strong></td>
            <td>${item.prepTime || 15} min</td>
            <td>
                <span class="partner-stat-pill" style="padding:0.2rem 0.6rem;font-size:0.75rem">
                    <i class="fa-solid ${isAvailable ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger'}"></i>
                    ${isAvailable ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <label class="stock-switch">
                    <input type="checkbox" ${isAvailable ? 'checked' : ''} data-item-id="${item.id}">
                </label>
            </td>`;

        tr.querySelector('input[type="checkbox"]').addEventListener('change', async e => {
            item.isAvailable = e.target.checked;
            renderPartnerMenu(restaurantId);
            renderRestaurants(state.restaurants);
            showToast(`"${item.name}" → ${e.target.checked ? 'IN STOCK ✓' : 'OUT OF STOCK ✗'}`, e.target.checked ? 'success' : 'error');

            // Try backend update
            try {
                await fetch(`${GATEWAY}/api/v1/restaurants/${restaurantId}/items/${item.id}/availability`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
                    body: JSON.stringify({ available: e.target.checked }),
                    signal: AbortSignal.timeout(3000)
                });
            } catch (_) {}
        });

        tbody.appendChild(tr);
    });

    if (avail)   avail.textContent   = activeCount;
    if (unavail) unavail.textContent = outCount;
}

/* ══════════════════════════════════════════════════════════════
   DELIVERY PARTNER
══════════════════════════════════════════════════════════════ */
function renderDeliveryDashboard() {
    const allOrders = getOrders();
    const readyQ    = allOrders.filter(o => o.status === 'READY_FOR_PICKUP');
    const activeD   = allOrders.filter(o => o.status === 'PICKED_UP');
    const delivered = allOrders.filter(o => o.status === 'DELIVERED');

    document.getElementById('d-total').textContent    = delivered.length;
    document.getElementById('d-earnings').textContent = `₹${delivered.length * 89}`;
    document.getElementById('d-active').textContent   = activeD.length;

    renderDeliveryQueue(readyQ);
    renderActiveDeliveries(activeD);
}

function renderDeliveryQueue(orders) {
    const grid = document.getElementById('delivery-queue-grid');
    if (!grid) return;

    if (!orders.length) {
        grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-hourglass"></i><h3>Pickup Queue Empty</h3><p>Orders accepted by restaurants will appear here once they are marked "Ready for Pickup".</p></div>`;
        return;
    }

    grid.innerHTML = '';
    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-action-card';
        const itemsHTML = order.items.map(i =>
            `<div class="oac-item-row"><span>${i.quantity}× ${i.itemName}</span><span>₹${i.subtotal}</span></div>`
        ).join('');

        card.innerHTML = `
            <div class="oac-accent-bar blue"></div>
            <div class="oac-header">
                <div>
                    <div class="oac-order-num">#${order.orderNumber}</div>
                    <div class="oac-time">${order.restaurantName}</div>
                </div>
                <span class="order-status-pill status-READY_FOR_PICKUP">Ready</span>
            </div>
            <div class="oac-body">
                <div class="oac-info-row"><i class="fa-solid fa-store"></i> Pickup from: <strong>${order.restaurantName}</strong></div>
                <div class="oac-info-row"><i class="fa-solid fa-user"></i> Deliver to: <strong>${order.customerName}</strong></div>
                <div class="oac-info-row"><i class="fa-solid fa-location-dot"></i> ${order.deliveryAddress}</div>
                <div class="oac-info-row"><i class="fa-solid fa-wallet"></i> ${order.paymentMethod} · ₹${order.totalAmount}</div>
            </div>
            <div class="oac-items-list">${itemsHTML}</div>
            <div class="oac-actions">
                <button class="btn-pickup" onclick="deliveryAction('${order.id}','PICKUP')">
                    <i class="fa-solid fa-motorcycle"></i> Accept & Pick Up
                </button>
            </div>`;
        grid.appendChild(card);
    });
}

function renderActiveDeliveries(orders) {
    const grid = document.getElementById('delivery-active-grid');
    if (!grid) return;

    if (!orders.length) {
        grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-map-location-dot"></i><h3>No Active Deliveries</h3><p>Pick up an order from the queue above to start a delivery.</p></div>`;
        return;
    }

    grid.innerHTML = '';
    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-action-card';
        card.innerHTML = `
            <div class="oac-accent-bar green"></div>
            <div class="oac-header">
                <div>
                    <div class="oac-order-num">#${order.orderNumber}</div>
                    <div class="oac-time">En route to ${order.customerName}</div>
                </div>
                <span class="order-status-pill status-PICKED_UP">En Route</span>
            </div>
            <div class="oac-body">
                <div class="oac-info-row"><i class="fa-solid fa-user"></i> Customer: <strong>${order.customerName}</strong></div>
                <div class="oac-info-row"><i class="fa-solid fa-location-dot"></i> ${order.deliveryAddress}</div>
                <div class="oac-info-row"><i class="fa-solid fa-wallet"></i> ${order.paymentMethod} — ₹${order.totalAmount}</div>
            </div>
            <div class="oac-actions">
                <button class="btn-deliver" onclick="deliveryAction('${order.id}','DELIVER')">
                    <i class="fa-solid fa-circle-check"></i> Mark Delivered
                </button>
            </div>`;
        grid.appendChild(card);
    });
}

window.deliveryAction = function(orderId, action) {
    if (action === 'PICKUP') {
        updateOrderStatus(orderId, 'PICKED_UP', { deliveryPartnerId: state.user.id, deliveryPartnerName: state.user.fullName });
        showToast('Order picked up! Delivering to customer…', 'success');
    } else if (action === 'DELIVER') {
        updateOrderStatus(orderId, 'DELIVERED', { deliveredAt: new Date().toISOString() });
        showToast('🎉 Order delivered! Great job!', 'success');
    }
    renderDeliveryDashboard();
};

/* ══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════════════════════ */
function setupAdminHandlers() {
    document.getElementById('btn-admin-health')?.addEventListener('click', renderAdminDashboard);
}

async function renderAdminDashboard() {
    const allOrders = getOrders();
    document.getElementById('adm-orders').textContent = allOrders.length;

    const revenue = allOrders.filter(o => o.status === 'DELIVERED')
        .reduce((a, o) => a + (o.totalAmount || 0), 0);
    document.getElementById('adm-revenue').textContent = `₹${revenue}`;

    // All orders list
    const container = document.getElementById('admin-all-orders');
    if (container) {
        if (!allOrders.length) {
            container.innerHTML = `<div class="empty-state" style="border-radius:16px"><i class="fa-solid fa-inbox"></i><h3>No orders yet</h3></div>`;
        } else {
            container.innerHTML = '';
            [...allOrders].reverse().forEach(o => container.appendChild(buildOrderTrackCard(o)));
        }
    }

    // Render service health grid
    await renderServiceHealthGrid();

    // Load users
    await renderAdminUsers();
}

async function renderServiceHealthGrid() {
    const services = [
        { name: 'Eureka Server',     port: 8761, dotId: 'svc-eureka',     url: 'http://localhost:8761/actuator/health', adminId: 'adm-svc-eureka' },
        { name: 'API Gateway',       port: 8080, dotId: 'svc-gateway',    url: `${GATEWAY}/actuator/health`,           adminId: 'adm-svc-gateway' },
        { name: 'Auth Service',      port: 8084, dotId: 'svc-auth',       url: `${GATEWAY}/api/v1/auth/health`,        adminId: 'adm-svc-auth' },
        { name: 'Restaurant Service',port: 8081, dotId: 'svc-restaurant', url: `${GATEWAY}/api/v1/restaurants`,        adminId: 'adm-svc-restaurant' },
        { name: 'Order Service',     port: 8082, dotId: 'svc-order',      url: `${GATEWAY}/api/v1/orders/health`,      adminId: 'adm-svc-order' },
        { name: 'Payment Service',   port: 8083, dotId: 'svc-payment',    url: `${GATEWAY}/api/v1/payments/health`,    adminId: 'adm-svc-payment' }
    ];

    const grid = document.getElementById('admin-services-grid');
    if (grid) {
        grid.innerHTML = services.map(s => `
            <div class="admin-service-card" id="${s.adminId}">
                <div class="admin-svc-indicator checking" id="dot-${s.adminId}"></div>
                <div class="admin-svc-name">${s.name}</div>
                <div class="admin-svc-port">:${s.port}</div>
                <div class="admin-svc-status" id="txt-${s.adminId}">Checking…</div>
            </div>`).join('');
    }

    // Probe all
    services.forEach(async svc => {
        const dot = document.getElementById(`dot-${svc.adminId}`);
        const txt = document.getElementById(`txt-${svc.adminId}`);
        const nodeDot = document.getElementById(svc.dotId);

        try {
            const resp = await fetch(svc.url, { signal: AbortSignal.timeout(2500) });
            const online = resp.ok || resp.status < 500;
            if (dot)     dot.className     = `admin-svc-indicator ${online ? 'online' : 'offline'}`;
            if (txt)     txt.textContent   = online ? 'ONLINE ✓' : 'DEGRADED ⚠';
            if (nodeDot) nodeDot.className = `node-status-indicator ${online ? 'online' : 'offline'}`;
        } catch {
            if (dot)     dot.className   = 'admin-svc-indicator offline';
            if (txt)     txt.textContent = 'OFFLINE ✗';
            if (nodeDot) { nodeDot.className = 'node-status-indicator'; nodeDot.style.background = '#FF1744'; }
        }
    });
}

async function renderAdminUsers() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    const roleColors = { CONSUMER: '#FF6B35', RESTAURANT_OWNER: '#00E676', DELIVERY_PARTNER: '#FFB347', ADMIN: '#7C4DFF' };
    const demoUsers = [
        { id: 1, fullName: 'Om Prakhar',    email: 'om@cravedash.com',     role: 'CONSUMER',          phoneNumber: '+91-9876543210' },
        { id: 2, fullName: 'Mradul Dixit',  email: 'mradul@cravedash.com', role: 'RESTAURANT_OWNER',  phoneNumber: '+91-9876543211' },
        { id: 3, fullName: 'Abhinav Singh', email: 'abhinav@cravedash.com',role: 'DELIVERY_PARTNER',  phoneNumber: '+91-9876543212' },
        { id: 4, fullName: 'CraveDash Admin', email: 'admin@cravedash.com',role: 'ADMIN',              phoneNumber: '+91-9876543213' }
    ];

    try {
        const resp = await fetch(`${GATEWAY}/api/v1/auth/users`, {
            headers: { 'Authorization': `Bearer ${state.token}` },
            signal: AbortSignal.timeout(3000)
        });
        const users = resp.ok ? await resp.json() : demoUsers;
        document.getElementById('adm-users').textContent = users.length;
        tbody.innerHTML = users.map((u, i) => `
            <tr>
                <td>${u.id || i+1}</td>
                <td><strong>${u.fullName}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge-role" style="color:${roleColors[u.role]||'#FF6B35'}">${u.role}</span></td>
                <td>${u.phoneNumber || '—'}</td>
            </tr>`).join('');
    } catch {
        document.getElementById('adm-users').textContent = demoUsers.length;
        tbody.innerHTML = demoUsers.map((u, i) => `
            <tr>
                <td>${i+1}</td>
                <td><strong>${u.fullName}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge-role" style="color:${roleColors[u.role]||'#FF6B35'}">${u.role}</span></td>
                <td>${u.phoneNumber}</td>
            </tr>`).join('');
    }
}

/* ══════════════════════════════════════════════════════════════
   MICROSERVICE TOPOLOGY
══════════════════════════════════════════════════════════════ */
function setupTopology() {
    document.getElementById('btn-refresh-mesh')?.addEventListener('click', pingMeshProbes);
}

async function pingMeshProbes() {
    showToast('Pinging microservice mesh…', 'info');
    await renderServiceHealthGrid();
}

/* ══════════════════════════════════════════════════════════════
   REFRESH BUTTONS
══════════════════════════════════════════════════════════════ */
function setupRefreshButtons() {
    document.getElementById('btn-refresh-my-orders')?.addEventListener('click', renderMyOrders);
    document.getElementById('btn-refresh-incoming')?.addEventListener('click', renderIncomingOrders);
    document.getElementById('btn-refresh-delivery')?.addEventListener('click', renderDeliveryDashboard);
}

/* ══════════════════════════════════════════════════════════════
   BACKEND SYNC
══════════════════════════════════════════════════════════════ */
async function tryFetchBackend() {
    try {
        const resp = await fetch(`${GATEWAY}/api/v1/restaurants`, {
            headers: { 'Authorization': `Bearer ${state.token}` },
            signal: AbortSignal.timeout(5000)
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data?.length) {
                for (const r of data) {
                    try {
                        const mResp = await fetch(`${GATEWAY}/api/v1/restaurants/${r.id}/menu`, { signal: AbortSignal.timeout(3000) });
                        if (mResp.ok) r.menu = await mResp.json();
                    } catch (_) {}
                }
                state.restaurants = data;
                if (state.activeTab === 'marketplace') renderRestaurants(state.restaurants);
                setupPartnerConsole();
            }
        }
    } catch (_) {}
}

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-circle-check', error: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(110%)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}
