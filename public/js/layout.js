// ===== Shared HTML Layout Template =====
// Split into sidebar and topbar so they inject into correct DOM positions

function getSidebarHTML() {
  return `
<div class="sidebar-overlay" id="sidebarOverlay"></div>
<nav class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <div class="logo-mark">⚡ MicroFund</div>
    <div class="logo-sub">Smart Micro-Lending</div>
  </div>
  <div class="sidebar-nav" id="sidebarNav"></div>
  <div class="sidebar-footer">
    <div class="user-card">
      <div class="user-avatar" id="sidebarUserAvatar">U</div>
      <div style="overflow:hidden">
        <div class="user-name" id="sidebarUserName" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">—</div>
        <div class="user-role" id="sidebarUserRole" style="font-size:10px;text-transform:uppercase;letter-spacing:1px">—</div>
      </div>
    </div>
    <button id="logoutBtn" class="btn btn-ghost w-full mt-16" style="justify-content:center">🚪 Logout</button>
  </div>
</nav>`;
}

function getTopbarHTML(pageTitle = 'MicroFund') {
  return `
<header class="topbar">
  <button class="mobile-menu-btn" id="mobileMenuBtn">☰</button>
  <div class="topbar-title" id="topbarTitle">${pageTitle}</div>
  <div class="topbar-actions">
    <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(212,168,83,0.1);border:1px solid rgba(212,168,83,0.2);border-radius:8px">
      <span style="font-size:12px;color:var(--text-muted)">Wallet</span>
      <span id="topbarWallet" class="mono" style="font-size:13px;font-weight:700;color:var(--gold)">₹—</span>
    </div>
    <button onclick="openEMICalculator()" class="btn btn-ghost btn-sm" title="EMI Calculator">🧮</button>
    <div style="position:relative">
      <button class="notif-btn" id="notifBtn" title="Notifications">
        🔔
        <span class="notif-count" id="notifCount" style="display:none">0</span>
      </button>
      <div class="notif-dropdown" id="notifDropdown"></div>
    </div>
    <button class="theme-toggle" id="themeToggle" title="Toggle theme">☀️</button>
  </div>
</header>`;
}

// ===== EMI Calculator Modal HTML =====
function getEMIModalHTML() {
  return `
<div class="modal-overlay" id="emiCalcModal">
  <div class="modal modal-md">
    <div class="modal-header">
      <div>
        <div class="modal-title">🧮 EMI Calculator</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Calculate your monthly installments</div>
      </div>
      <button class="modal-close" onclick="Modal.close('emiCalcModal')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Loan Amount (₹)</label>
          <input type="number" id="calcPrincipal" class="form-input" placeholder="e.g. 50000" min="100" max="500000">
        </div>
        <div class="form-group">
          <label class="form-label">Interest Rate (% per annum)</label>
          <input type="number" id="calcRate" class="form-input" placeholder="e.g. 12" min="1" max="50" step="0.1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Loan Tenure (months)</label>
        <input type="range" id="calcTenure" min="1" max="60" value="12" style="width:100%;accent-color:var(--gold)">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-top:4px">
          <span>1 month</span>
          <span id="calcTenureVal" style="color:var(--gold);font-weight:600">12 months</span>
          <span>60 months</span>
        </div>
      </div>
      <div id="emiResult" style="display:none;margin-top:8px">
        <div style="background:rgba(212,168,83,0.08);border:1px solid rgba(212,168,83,0.2);border-radius:12px;padding:20px">
          <div class="grid-3" style="margin-bottom:0">
            <div class="text-center">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Monthly EMI</div>
              <div id="calcEMI" class="mono" style="font-size:22px;font-weight:700;color:var(--gold);margin-top:4px">—</div>
            </div>
            <div class="text-center">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Total Payable</div>
              <div id="calcTotal" class="mono" style="font-size:22px;font-weight:700;color:var(--text-primary);margin-top:4px">—</div>
            </div>
            <div class="text-center">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Total Interest</div>
              <div id="calcInterest" class="mono" style="font-size:22px;font-weight:700;color:var(--danger);margin-top:4px">—</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;
}
