import { getAuthStatus, clearSession, subscribeAuth } from '../auth.js';
import { getApiBaseUrl, setApiBaseUrl, PRODUCTION_BACKEND_URL, LOCAL_BACKEND_URL, isDemoMode, setDemoMode } from '../config.js';
import { openLoginModal } from './loginModal.js';
import { Api } from '../api.js';
import { showToast } from '../utils/toast.js';

let navEl = null;

export function renderNavbar(containerId, onReloadNeeded) {
  navEl = document.getElementById(containerId);
  if (!navEl) return;

  renderNavHtml();
  bindNavEvents(onReloadNeeded);

  subscribeAuth(() => {
    updateNavAuthState();
  });
}

function renderNavHtml() {
  const apiUrl = getApiBaseUrl();
  const docsUrl = `${apiUrl}/docs`;

  navEl.innerHTML = `
    <header class="app-header">
      <div class="header-left">
        <div class="brand">
          <span class="brand-logo">⚡</span>
          <span class="brand-name">AMZ Tools</span>
          <span class="brand-tag">Wholesale Catalog & Analytics</span>
        </div>
      </div>

      <div class="header-right">
        <!-- API URL & Health Indicator -->
        <div class="api-status-widget" id="api-status-btn" title="Click to configure Cloudflare Worker API URL & Environment">
          <span class="status-dot status-unknown" id="api-status-dot"></span>
          <span class="status-label" id="api-status-text">Worker API</span>
        </div>

        <!-- Documentation Link -->
        <a href="${docsUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-ghost doc-link" id="nav-docs-link" title="Open Swagger API Documentation">
          <span>📖 Swagger API</span>
        </a>

        <!-- Auth State Container -->
        <div class="auth-box" id="auth-box">
          <!-- Dynamic contents via updateNavAuthState() -->
        </div>
      </div>
    </header>

    <!-- Worker Settings Modal / Dialog -->
    <div class="modal-backdrop" id="api-config-modal">
      <div class="modal-dialog modal-sm" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h4 class="modal-title">Cloudflare Worker API Settings</h4>
          <button type="button" class="modal-close" id="api-config-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label style="font-weight: 600; margin-bottom: 6px; display: block;">Connection Mode</label>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button type="button" class="btn btn-sm btn-outline" id="btn-mode-db" style="flex: 1; text-align: center; font-weight: 600;" title="Connect directly to Cloudflare D1 Database">
                🟢 Live DB
              </button>
              <button type="button" class="btn btn-sm btn-outline" id="btn-mode-demo" style="flex: 1; text-align: center; font-weight: 600;" title="Test using local demo data">
                🟡 Local Demo Data
              </button>
            </div>

            <label for="cfg-api-url" style="font-weight: 600; margin-bottom: 4px; display: block;">Worker API URL</label>
            <input type="url" id="cfg-api-url" class="form-control" value="${apiUrl}" placeholder="https://amztools-worker-backend.imtiaz15-11790.workers.dev" />
          </div>
          <div class="modal-tool-actions" style="margin-top: 10px;">
            <button type="button" class="btn btn-sm btn-outline" id="btn-test-connection" style="width: 100%;">Test Connection</button>
          </div>
          <div id="cfg-test-result" class="mt-2 text-sm"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="api-config-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="api-config-save">Save</button>
        </div>
      </div>
    </div>
  `;

  updateNavAuthState();
  checkApiHealth();
}

function updateNavAuthState() {
  const authBox = navEl.querySelector('#auth-box');
  if (!authBox) return;

  const { isAuthenticated, user } = getAuthStatus();

  if (isAuthenticated && user) {
    const role = (user.role || 'User').toLowerCase();
    let roleIcon = '👤';
    let roleClass = 'role-admin';
    let roleTitle = `Role: ${user.role || 'User'} • Session active for 1 month`;

    if (role === 'super admin' || role === 'superadmin') {
      roleIcon = '⚡';
      roleClass = 'role-superadmin';
      roleTitle = 'Role: Super admin • Access everything • Session active for 1 month';
    } else if (role === 'admin') {
      roleIcon = '🛡️';
      roleClass = 'role-admin';
      roleTitle = 'Role: Admin • Full catalog access • Session active for 1 month';
    } else if (role === 'customer') {
      roleIcon = '👤';
      roleClass = 'role-customer';
      roleTitle = 'Role: Customer • Read Only • Session active for 1 month';
    }

    const displayName = user.full_name || user.email || 'User';
    const roleLabel = user.role || 'User';

    authBox.innerHTML = `
      <div class="auth-logged-in">
        <span class="user-badge ${roleClass}" title="${roleTitle}">
          ${roleIcon} ${displayName} <span class="role-tag">${roleLabel}</span>
        </span>
        <button type="button" class="btn btn-sm btn-outline btn-logout" id="btn-logout">Log Out</button>
      </div>
    `;

    authBox.querySelector('#btn-logout').addEventListener('click', () => {
      clearSession();
      showToast('Logged out successfully', 'info');
    });
  } else {
    authBox.innerHTML = `
      <div class="auth-logged-out">
        <span class="guest-badge">Guest (Read Only)</span>
        <button type="button" class="btn btn-sm btn-primary btn-login" id="btn-login">Sign In</button>
      </div>
    `;
    authBox.querySelector('#btn-login').addEventListener('click', openLoginModal);
  }
}

async function checkApiHealth() {
  const dot = navEl.querySelector('#api-status-dot');
  const text = navEl.querySelector('#api-status-text');
  if (!dot || !text) return;

  if (isDemoMode()) {
    dot.className = 'status-dot status-warning';
    text.textContent = 'Demo Data Ready';
    return;
  }

  const currentUrl = getApiBaseUrl();
  const isProd = currentUrl.includes('workers.dev');
  const envLabel = isProd ? 'Live D1' : 'Local (8787)';

  try {
    const res = await Api.fetchProducts({ limit: 1 });
    if (res && res.success !== false) {
      if (res.fallbackFromDbError) {
        dot.className = 'status-dot status-warning';
        text.textContent = 'Demo Data (DB Offline)';
      } else {
        dot.className = 'status-dot status-online';
        text.textContent = `${envLabel} Connected`;
      }
    } else {
      dot.className = 'status-dot status-warning';
      text.textContent = 'Demo Data (DB Offline)';
    }
  } catch (err) {
    dot.className = 'status-dot status-warning';
    text.textContent = 'Demo Data (DB Offline)';
  }
}

function bindNavEvents(onReloadNeeded) {
  const configModal = navEl.querySelector('#api-config-modal');
  const openConfigBtn = navEl.querySelector('#api-status-btn');
  const closeConfigBtn = navEl.querySelector('#api-config-close');
  const cancelConfigBtn = navEl.querySelector('#api-config-cancel');
  const saveConfigBtn = navEl.querySelector('#api-config-save');
  const testConnBtn = navEl.querySelector('#btn-test-connection');
  const modeDbBtn = navEl.querySelector('#btn-mode-db');
  const modeDemoBtn = navEl.querySelector('#btn-mode-demo');
  const testResult = navEl.querySelector('#cfg-test-result');
  const urlInput = navEl.querySelector('#cfg-api-url');

  let activeMode = isDemoMode() ? 'demo' : 'db';

  const updateModeStyles = () => {
    if (activeMode === 'db') {
      modeDbBtn.style.borderColor = '#22c55e';
      modeDbBtn.style.color = '#22c55e';
      modeDbBtn.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';

      modeDemoBtn.style.borderColor = '#475569';
      modeDemoBtn.style.color = '#94a3b8';
      modeDemoBtn.style.backgroundColor = 'transparent';
    } else {
      modeDemoBtn.style.borderColor = '#f59e0b';
      modeDemoBtn.style.color = '#f59e0b';
      modeDemoBtn.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';

      modeDbBtn.style.borderColor = '#475569';
      modeDbBtn.style.color = '#94a3b8';
      modeDbBtn.style.backgroundColor = 'transparent';
    }
  };

  const openConfig = () => {
    activeMode = isDemoMode() ? 'demo' : 'db';
    urlInput.value = getApiBaseUrl();
    updateModeStyles();
    testResult.innerHTML = '';
    configModal.classList.add('modal-active');
  };
  const closeConfig = () => configModal.classList.remove('modal-active');

  openConfigBtn.addEventListener('click', openConfig);
  closeConfigBtn.addEventListener('click', closeConfig);
  cancelConfigBtn.addEventListener('click', closeConfig);
  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) closeConfig();
  });

  const runTestConnection = async (targetUrl, mode = activeMode) => {
    testResult.innerHTML = '<span class="text-muted">Testing connection...</span>';

    if (mode === 'demo') {
      try {
        const res = await fetch(`${targetUrl}/api/products/demo?limit=1`).catch(() => null);
        if (res && res.ok) {
          testResult.innerHTML = `<span class="text-profit-pos" style="color: #f59e0b;">✓ Connected to Worker! Demo Data ready.</span>`;
          return;
        }
      } catch (e) {}
      testResult.innerHTML = `<span class="text-profit-pos" style="color: #f59e0b;">✓ Demo Data Ready (10 sample products loaded for testing).</span>`;
      return;
    }

    // Testing Live DB mode
    try {
      const res = await fetch(`${targetUrl}/api/products?limit=1`);
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success && Array.isArray(data.data)) {
        const total = (data.pagination && data.pagination.totalItems) ?? data.data.length;
        testResult.innerHTML = `<span class="text-profit-pos">✓ Connected to Live D1 Database! (${total} records available)</span>`;
      } else {
        const errMsg = (data && (data.error || data.message)) || `Server status ${res.status}`;
        testResult.innerHTML = `
          <div style="color: #ef4444; margin-bottom: 6px;">✕ Live DB Connection failed: ${errMsg}</div>
          <div style="padding: 6px 10px; background: rgba(245, 158, 11, 0.12); border: 1px solid #d97706; border-radius: 4px; font-size: 11px;">
            <div style="color: #fbbf24; margin-bottom: 4px;">⚠️ Live DB is unreachable, but you can test using local demo data!</div>
            <button type="button" class="btn btn-xs btn-outline" id="btn-quick-switch-demo" style="border-color: #f59e0b; color: #f59e0b; font-weight: 600;">👉 Switch to Local Demo Data</button>
          </div>
        `;
        const switchBtn = testResult.querySelector('#btn-quick-switch-demo');
        if (switchBtn) {
          switchBtn.addEventListener('click', () => {
            activeMode = 'demo';
            if (!urlInput.value || urlInput.value === PRODUCTION_BACKEND_URL) {
              urlInput.value = LOCAL_BACKEND_URL;
            }
            updateModeStyles();
            runTestConnection(urlInput.value.trim(), 'demo');
          });
        }
      }
    } catch (e) {
      testResult.innerHTML = `
        <div style="color: #ef4444; margin-bottom: 6px;">✕ Live DB Connection failed: ${e.message}</div>
        <div style="padding: 6px 10px; background: rgba(245, 158, 11, 0.12); border: 1px solid #d97706; border-radius: 4px; font-size: 11px;">
          <div style="color: #fbbf24; margin-bottom: 4px;">⚠️ Live DB is unreachable, but you can test using local demo data!</div>
          <button type="button" class="btn btn-xs btn-outline" id="btn-quick-switch-demo" style="border-color: #f59e0b; color: #f59e0b; font-weight: 600;">👉 Switch to Local Demo Data</button>
        </div>
      `;
      const switchBtn = testResult.querySelector('#btn-quick-switch-demo');
      if (switchBtn) {
        switchBtn.addEventListener('click', () => {
          activeMode = 'demo';
          if (!urlInput.value || urlInput.value === PRODUCTION_BACKEND_URL) {
            urlInput.value = LOCAL_BACKEND_URL;
          }
          updateModeStyles();
          runTestConnection(urlInput.value.trim(), 'demo');
        });
      }
    }
  };

  if (modeDbBtn) {
    modeDbBtn.addEventListener('click', () => {
      activeMode = 'db';
      urlInput.value = PRODUCTION_BACKEND_URL;
      updateModeStyles();
      runTestConnection(PRODUCTION_BACKEND_URL, 'db');
    });
  }

  if (modeDemoBtn) {
    modeDemoBtn.addEventListener('click', () => {
      activeMode = 'demo';
      if (!urlInput.value || urlInput.value === PRODUCTION_BACKEND_URL) {
        urlInput.value = LOCAL_BACKEND_URL;
      }
      updateModeStyles();
      runTestConnection(urlInput.value.trim(), 'demo');
    });
  }

  testConnBtn.addEventListener('click', () => {
    runTestConnection(urlInput.value.trim(), activeMode);
  });

  saveConfigBtn.addEventListener('click', () => {
    const newUrl = urlInput.value.trim();
    if (newUrl) {
      setApiBaseUrl(newUrl);
    }
    setDemoMode(activeMode === 'demo');
    const docsLink = navEl.querySelector('#nav-docs-link');
    if (docsLink) docsLink.href = `${newUrl || getApiBaseUrl()}/docs`;

    const modeMsg = activeMode === 'demo' ? 'Switched to Local Demo Data mode' : 'Switched to Live DB Connection';
    showToast(`${modeMsg}. Reloading...`, 'info');
    closeConfig();
    checkApiHealth();
    if (typeof onReloadNeeded === 'function') {
      onReloadNeeded();
    }
  });
}
