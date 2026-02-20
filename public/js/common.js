// ===== MicroFund API Helper & Common Utilities =====

const API_BASE = '/api';

// ===== Token Management =====
const Auth = {
  getToken: () => localStorage.getItem('mf_token'),
  getUser: () => JSON.parse(localStorage.getItem('mf_user') || 'null'),
  setSession: (token, user) => {
    localStorage.setItem('mf_token', token);
    localStorage.setItem('mf_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('mf_token');
    localStorage.removeItem('mf_user');
  },
  isLoggedIn: () => !!localStorage.getItem('mf_token'),
  isRole: (role) => {
    const user = Auth.getUser();
    return user && user.role === role;
  },
  requireAuth: (redirectTo = '/index.html') => {
    if (!Auth.isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },
  requireRole: (role, redirectTo = '/dashboard.html') => {
    const user = Auth.getUser();
    if (!user || user.role !== role) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },
};

// ===== API Fetch Wrapper =====
const api = {
  request: async (method, endpoint, body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body && method !== 'GET') config.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await res.json();

      if (res.status === 401) {
        Auth.clearSession();
        window.location.href = '/index.html';
        return;
      }

      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error('API Error:', err);
      return { ok: false, data: { message: 'Network error. Please try again.' } };
    }
  },
  get: (endpoint) => api.request('GET', endpoint),
  post: (endpoint, body) => api.request('POST', endpoint, body),
  put: (endpoint, body) => api.request('PUT', endpoint, body),
  delete: (endpoint) => api.request('DELETE', endpoint),
};

// ===== Theme Management =====
const Theme = {
  init: () => {
    const saved = localStorage.getItem('mf_theme') || 'dark';
    Theme.apply(saved);
  },
  toggle: () => {
    const current = localStorage.getItem('mf_theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    Theme.apply(next);
    localStorage.setItem('mf_theme', next);
  },
  apply: (theme) => {
    document.documentElement.classList.toggle('light-mode', theme === 'light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  },
};

// ===== Toast Notifications =====
const Toast = {
  container: null,
  init: () => {
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.className = 'toast-container';
      document.body.appendChild(Toast.container);
    }
  },
  show: (title, message = '', type = 'info', duration = 4000) => {
    Toast.init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    Toast.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success: (title, msg) => Toast.show(title, msg, 'success'),
  error: (title, msg) => Toast.show(title, msg, 'error'),
  warning: (title, msg) => Toast.show(title, msg, 'warning'),
  info: (title, msg) => Toast.show(title, msg, 'info'),
};

// ===== Formatting Utilities =====
const Format = {
  currency: (amount, decimals = 0) => {
    if (amount === undefined || amount === null) return '₹0';
    return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },
  date: (date, format = 'short') => {
    if (!date) return '—';
    const d = new Date(date);
    if (format === 'short') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (format === 'long') return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    if (format === 'time') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (format === 'datetime') return Format.date(date, 'short') + ', ' + Format.date(date, 'time');
    return d.toLocaleDateString();
  },
  timeAgo: (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const intervals = [
      { label: 'year', secs: 31536000 }, { label: 'month', secs: 2592000 },
      { label: 'week', secs: 604800 }, { label: 'day', secs: 86400 },
      { label: 'hour', secs: 3600 }, { label: 'min', secs: 60 },
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.secs);
      if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  },
  percent: (val, total) => total ? Math.round((val / total) * 100) + '%' : '0%',
  creditRating: (score) => {
    if (score >= 800) return { label: 'Exceptional', color: '#22C55E' };
    if (score >= 740) return { label: 'Very Good', color: '#4ADE80' };
    if (score >= 670) return { label: 'Good', color: '#F59E0B' };
    if (score >= 580) return { label: 'Fair', color: '#FB923C' };
    return { label: 'Poor', color: '#EF4444' };
  },
};

// ===== Status Badge HTML =====
const Badge = {
  status: (status) => `<span class="badge badge-${status}">${status}</span>`,
  risk: (risk) => `<span class="badge badge-${risk}"><span class="risk-dot ${risk}"></span>${risk}</span>`,
};

// ===== EMI Calculator =====
const EMI = {
  calculate: (principal, annualRate, months) => {
    const P = parseFloat(principal);
    const r = parseFloat(annualRate) / 12 / 100;
    const n = parseInt(months);
    if (!P || !r || !n) return null;

    let emi;
    if (r === 0) emi = P / n;
    else emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;

    return {
      emi: Math.round(emi * 100) / 100,
      totalPayable: Math.round(totalPayable * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      principal: P,
    };
  },
};

// ===== Sidebar Navigation Builder =====
const Nav = {
  build: (activeLink) => {
    const user = Auth.getUser();
    if (!user) return;

    const navEl = document.getElementById('sidebarNav');
    const userNameEl = document.getElementById('sidebarUserName');
    const userRoleEl = document.getElementById('sidebarUserRole');
    const userAvatarEl = document.getElementById('sidebarUserAvatar');

    if (userNameEl) userNameEl.textContent = user.name;
    if (userRoleEl) userRoleEl.textContent = user.role;
    if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();

    if (!navEl) return;

    let links = [];

    const common = [
      { href: '/dashboard.html', icon: '📊', label: 'Dashboard', key: 'dashboard' },
      { href: '/wallet.html', icon: '💳', label: 'Wallet', key: 'wallet' },
    ];

    if (user.role === 'borrower') {
      links = [
        ...common,
        { href: '/loans.html', icon: '📋', label: 'My Loans', key: 'loans' },
        { href: '/loans.html?tab=apply', icon: '➕', label: 'Apply for Loan', key: 'apply' },
        { href: '/credit.html', icon: '⭐', label: 'Credit Score', key: 'credit' },
        { href: '/analytics.html', icon: '📈', label: 'Analytics', key: 'analytics' },
      ];
    } else if (user.role === 'lender') {
      links = [
        ...common,
        { href: '/loans.html', icon: '🔍', label: 'Browse Loans', key: 'loans' },
        { href: '/loans.html?tab=funded', icon: '💰', label: 'Funded Loans', key: 'funded' },
        { href: '/analytics.html', icon: '📈', label: 'Analytics', key: 'analytics' },
      ];
    } else if (user.role === 'admin') {
      links = [
        { href: '/dashboard.html', icon: '📊', label: 'Dashboard', key: 'dashboard' },
        { href: '/admin.html', icon: '🔧', label: 'Admin Panel', key: 'admin' },
        { href: '/admin.html?tab=loans', icon: '📋', label: 'Loan Management', key: 'loans' },
        { href: '/admin.html?tab=users', icon: '👥', label: 'User Management', key: 'users' },
        { href: '/analytics.html', icon: '📈', label: 'Analytics', key: 'analytics' },
        { href: '/wallet.html', icon: '💳', label: 'Wallet', key: 'wallet' },
      ];
    }

    navEl.innerHTML = links.map(l => `
      <a href="${l.href}" class="nav-link ${activeLink === l.key ? 'active' : ''}">
        <span class="nav-icon">${l.icon}</span>
        <span>${l.label}</span>
        ${l.badge ? `<span class="badge">${l.badge}</span>` : ''}
      </a>
    `).join('');
  },
};

// ===== Notifications Manager =====
const Notifications = {
  poll: null,
  load: async () => {
    const res = await api.get('/users/notifications');
    if (!res.ok) return;

    const { notifications, unreadCount } = res.data;

    // Update badge
    const badge = document.getElementById('notifCount');
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    // Populate dropdown
    const dropdown = document.getElementById('notifDropdown');
    if (!dropdown) return;

    if (notifications.length === 0) {
      dropdown.innerHTML = '<div class="empty-state" style="padding:32px"><div class="empty-state-icon">🔔</div><div class="empty-state-title">No notifications</div></div>';
      return;
    }

    dropdown.innerHTML = `
      <div style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
        <span style="font-size:13px;font-weight:700;color:var(--text-primary)">Notifications</span>
        ${unreadCount > 0 ? '<button onclick="Notifications.markAllRead()" style="font-size:11px;color:var(--gold);background:none;border:none;cursor:pointer;font-family:inherit">Mark all read</button>' : ''}
      </div>
      ${notifications.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Notifications.markRead('${n._id}')">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${Format.timeAgo(n.createdAt)}</div>
        </div>
      `).join('')}
    `;
  },
  markRead: async (id) => {
    await api.put(`/users/notifications/${id}/read`);
    Notifications.load();
  },
  markAllRead: async () => {
    await api.put('/users/notifications/read-all/mark');
    Notifications.load();
  },
  startPolling: (interval = 30000) => {
    Notifications.load();
    Notifications.poll = setInterval(Notifications.load, interval);
  },
};

// ===== Modal Helpers =====
const Modal = {
  open: (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },
  close: (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  closeOnOverlay: (id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', (e) => { if (e.target === el) Modal.close(id); });
  },
};

// ===== Loading State =====
const Loading = {
  show: (containerId, message = 'Loading...') => {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="loading-state"><div class="spinner"></div><div style="color:var(--text-muted);font-size:14px">${message}</div></div>`;
  },
  hide: (containerId) => {
    const el = document.getElementById(containerId);
    // Will be replaced by content render
  },
};

// ===== EMI Calculator Modal =====
function openEMICalculator() {
  Modal.open('emiCalcModal');
  document.getElementById('calcPrincipal').addEventListener('input', calcEMI);
  document.getElementById('calcRate').addEventListener('input', calcEMI);
  document.getElementById('calcTenure').addEventListener('input', calcEMI);
}

function calcEMI() {
  const P = parseFloat(document.getElementById('calcPrincipal')?.value);
  const r = parseFloat(document.getElementById('calcRate')?.value);
  const n = parseInt(document.getElementById('calcTenure')?.value);

  if (!P || !r || !n) {
    document.getElementById('emiResult').style.display = 'none';
    return;
  }

  const result = EMI.calculate(P, r, n);
  if (!result) return;

  document.getElementById('emiResult').style.display = 'block';
  document.getElementById('calcEMI').textContent = Format.currency(result.emi, 2);
  document.getElementById('calcTotal').textContent = Format.currency(result.totalPayable, 2);
  document.getElementById('calcInterest').textContent = Format.currency(result.totalInterest, 2);
}

// ===== Common Page Initialization =====
// Call AFTER injecting sidebar/topbar HTML into the DOM
function initPageControls(activeNav) {
  const user = Auth.getUser();
  if (!user) return;

  // Build nav (elements now exist in DOM)
  Nav.build(activeNav);

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', Theme.toggle);
  Theme.apply(localStorage.getItem('mf_theme') || 'dark');

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    Auth.clearSession();
    window.location.href = '/index.html';
  });

  // Notification toggle
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  notifBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown?.classList.toggle('open');
  });
  document.addEventListener('click', () => notifDropdown?.classList.remove('open'));

  // Mobile sidebar
  const menuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  menuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    sidebarOverlay?.classList.toggle('open');
  });
  sidebarOverlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('open');
  });

  // EMI Calculator modal events
  Modal.closeOnOverlay('emiCalcModal');
  document.getElementById('calcTenure')?.addEventListener('input', function() {
    document.getElementById('calcTenureVal').textContent = this.value + ' months';
  });
  document.getElementById('calcPrincipal')?.addEventListener('input', calcEMI);
  document.getElementById('calcRate')?.addEventListener('input', calcEMI);
  document.getElementById('calcTenure')?.addEventListener('input', calcEMI);

  // Start notifications polling
  Notifications.startPolling();

  // Update wallet
  refreshWalletDisplay();
}

function initPage(activeNav, requireRole = null) {
  Theme.init();
  if (!Auth.requireAuth()) return;
  const user = Auth.getUser();
  if (!user) return;
  if (requireRole && user.role !== requireRole) {
    window.location.href = '/dashboard.html';
    return;
  }
  return user;
}

async function refreshWalletDisplay() {
  const walletEl = document.getElementById('topbarWallet');
  if (!walletEl) return;
  const res = await api.get('/users/wallet');
  if (res.ok) {
    walletEl.textContent = Format.currency(res.data.wallet);
    // Update stored user
    const user = Auth.getUser();
    if (user) {
      user.wallet = res.data.wallet;
      localStorage.setItem('mf_user', JSON.stringify(user));
    }
  }
}
