import { getAuthStatus, clearSession, subscribeAuth } from '../auth.js';
import { getApiBaseUrl, setApiBaseUrl, PRODUCTION_BACKEND_URL, LOCAL_BACKEND_URL } from '../config.js';
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
            <label style="font-weight: 600; margin-bottom: 6px; display: block;">Quick Environment Presets</label>
            <div style="display: flex; gap: 8px; margin-bottom: 14px;">
              <button type="button" class="btn btn-sm btn-outline" id="preset-prod-btn" style="flex: 1; text-align: center; border-color: #22c55e; font-weight: 600;" title="Connect directly to remote Cloudflare D1 database">
                🟢 Live Cloudflare D1
              </button>
              <button type="button" class="btn btn-sm btn-outline" id="preset-local-btn" style="flex: 1; text-align: center; border-color: #3b82f6; font-weight: 600;" title="Connect to local wrangler dev worker">
                💻 Local Worker (8787)
              </button>
            </div>
            <label for="cfg-api-url">Worker API Base URL</label>
            <input type="url" id="cfg-api-url" class="form-control" value="${apiUrl}" placeholder="https://amztools-worker-backend.imtiaz15-11790.workers.dev" />
            <small class="form-text">Choose <strong>Live Cloudflare D1</strong> to query the real Cloudflare database from localhost.</small>
          </div>
          <div class="modal-tool-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-xs btn-outline" id="btn-test-connection">Test Connection</button>
            <button type="button" class="btn btn-xs btn-outline" id="btn-init-db">Initialize D1 Table</button>
            <button type="button" class="btn btn-xs btn-outline" id="btn-seed-db">Seed Sample Data</button>
          </div>
          <div id="cfg-test-result" class="mt-2 text-sm"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="api-config-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="api-config-save">Save & Reconnect</button>
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
    authBox.innerHTML = `
      <div class="auth-logged-in">
        <span class="user-badge" title="Session active for 1 week">👤 ${user.username || 'Admin'}</span>
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

  const currentUrl = getApiBaseUrl();
  const isProd = currentUrl.includes('workers.dev');
  const envLabel = isProd ? 'Live D1' : 'Local (8787)';

  try {
    const res = await Api.fetchProducts({ limit: 1 });
    if (res && res.success !== false) {
      dot.className = 'status-dot status-online';
      text.textContent = `${envLabel} Connected`;
    } else {
      dot.className = 'status-dot status-warning';
      text.textContent = `${envLabel} Warning`;
    }
  } catch (err) {
    dot.className = 'status-dot status-offline';
    text.textContent = `${envLabel} Offline`;
  }
}

function bindNavEvents(onReloadNeeded) {
  const configModal = navEl.querySelector('#api-config-modal');
  const openConfigBtn = navEl.querySelector('#api-status-btn');
  const closeConfigBtn = navEl.querySelector('#api-config-close');
  const cancelConfigBtn = navEl.querySelector('#api-config-cancel');
  const saveConfigBtn = navEl.querySelector('#api-config-save');
  const testConnBtn = navEl.querySelector('#btn-test-connection');
  const initDbBtn = navEl.querySelector('#btn-init-db');
  const seedDbBtn = navEl.querySelector('#btn-seed-db');
  const presetProdBtn = navEl.querySelector('#preset-prod-btn');
  const presetLocalBtn = navEl.querySelector('#preset-local-btn');
  const testResult = navEl.querySelector('#cfg-test-result');
  const urlInput = navEl.querySelector('#cfg-api-url');

  const openConfig = () => {
    urlInput.value = getApiBaseUrl();
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

  const runTestConnection = async (targetUrl) => {
    testResult.innerHTML = '<span class="text-muted">Testing connection...</span>';
    try {
      const res = await fetch(`${targetUrl}/`);
      const data = await res.json();
      testResult.innerHTML = `<span class="text-profit-pos">✓ Connected! ${data.name || 'Worker API Online'}</span>`;
    } catch (e) {
      testResult.innerHTML = `<span class="text-profit-neg">✕ Failed to connect: ${e.message}</span>`;
    }
  };

  if (presetProdBtn) {
    presetProdBtn.addEventListener('click', () => {
      urlInput.value = PRODUCTION_BACKEND_URL;
      runTestConnection(PRODUCTION_BACKEND_URL);
    });
  }

  if (presetLocalBtn) {
    presetLocalBtn.addEventListener('click', () => {
      urlInput.value = LOCAL_BACKEND_URL;
      runTestConnection(LOCAL_BACKEND_URL);
    });
  }

  testConnBtn.addEventListener('click', () => {
    runTestConnection(urlInput.value.trim());
  });

  initDbBtn.addEventListener('click', async () => {
    testResult.innerHTML = '<span class="text-muted">Initializing Cloudflare D1 wholesale_products table...</span>';
    const res = await Api.initTable();
    if (res && res.success) {
      testResult.innerHTML = `<span class="text-profit-pos">✓ D1 Table initialized successfully!</span>`;
      showToast('Table wholesale_products ready in D1', 'success');
      if (typeof onReloadNeeded === 'function') onReloadNeeded();
    } else {
      testResult.innerHTML = `<span class="text-profit-neg">✕ Init failed: ${(res && res.error) || 'Error'}</span>`;
    }
  });

  if (seedDbBtn) {
    seedDbBtn.addEventListener('click', async () => {
      testResult.innerHTML = '<span class="text-muted">Seeding sample wholesale products...</span>';
      const res = await Api.seedData();
      if (res && res.success) {
        testResult.innerHTML = `<span class="text-profit-pos">✓ Successfully seeded products!</span>`;
        showToast('Sample products seeded into database', 'success');
        if (typeof onReloadNeeded === 'function') onReloadNeeded();
      } else {
        testResult.innerHTML = `<span class="text-profit-neg">✕ Seeding failed: ${(res && res.error) || 'Error'}</span>`;
      }
    });
  }

  saveConfigBtn.addEventListener('click', () => {
    const newUrl = urlInput.value.trim();
    if (newUrl) {
      setApiBaseUrl(newUrl);
      const docsLink = navEl.querySelector('#nav-docs-link');
      if (docsLink) docsLink.href = `${newUrl}/docs`;
      showToast('API URL saved. Reconnecting...', 'info');
      closeConfig();
      checkApiHealth();
      if (typeof onReloadNeeded === 'function') {
        onReloadNeeded();
      }
    }
  });
}
