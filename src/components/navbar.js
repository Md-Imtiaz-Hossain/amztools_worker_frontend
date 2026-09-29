import { getAuthStatus, clearSession, subscribeAuth } from '../auth.js';
import { getApiBaseUrl, setApiBaseUrl } from '../config.js';
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
        <div class="api-status-widget" id="api-status-btn" title="Click to configure Cloudflare Worker API URL">
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
            <label for="cfg-api-url">Worker API Base URL</label>
            <input type="url" id="cfg-api-url" class="form-control" value="${apiUrl}" placeholder="http://127.0.0.1:8787" />
            <small class="form-text">Default local: <code>http://127.0.0.1:8787</code> or production worker URL</small>
          </div>
          <div class="modal-tool-actions">
            <button type="button" class="btn btn-xs btn-outline" id="btn-test-connection">Test Connection</button>
            <button type="button" class="btn btn-xs btn-outline" id="btn-init-db">Initialize D1 Table</button>
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

  try {
    const res = await Api.fetchProducts({ limit: 1 });
    if (res && res.success !== false) {
      dot.className = 'status-dot status-online';
      text.textContent = 'API Connected';
    } else {
      dot.className = 'status-dot status-warning';
      text.textContent = 'API Warning';
    }
  } catch (err) {
    dot.className = 'status-dot status-offline';
    text.textContent = 'API Offline';
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
  const testResult = navEl.querySelector('#cfg-test-result');

  const openConfig = () => configModal.classList.add('modal-active');
  const closeConfig = () => configModal.classList.remove('modal-active');

  openConfigBtn.addEventListener('click', openConfig);
  closeConfigBtn.addEventListener('click', closeConfig);
  cancelConfigBtn.addEventListener('click', closeConfig);
  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) closeConfig();
  });

  testConnBtn.addEventListener('click', async () => {
    testResult.innerHTML = '<span class="text-muted">Testing connection...</span>';
    const tempUrl = navEl.querySelector('#cfg-api-url').value.trim();
    try {
      const res = await fetch(`${tempUrl}/`);
      const data = await res.json();
      testResult.innerHTML = `<span class="text-profit-pos">✓ Connected! ${data.name || 'Worker API Online'}</span>`;
    } catch (e) {
      testResult.innerHTML = `<span class="text-profit-neg">✕ Failed to connect: ${e.message}</span>`;
    }
  });

  initDbBtn.addEventListener('click', async () => {
    testResult.innerHTML = '<span class="text-muted">Initializing Cloudflare D1 wholesale_products table...</span>';
    const res = await Api.initTable();
    if (res && res.success) {
      testResult.innerHTML = `<span class="text-profit-pos">✓ D1 Table initialized successfully!</span>`;
      showToast('Table wholesale_products ready in D1', 'success');
    } else {
      testResult.innerHTML = `<span class="text-profit-neg">✕ Init failed: ${(res && res.error) || 'Error'}</span>`;
    }
  });

  saveConfigBtn.addEventListener('click', () => {
    const newUrl = navEl.querySelector('#cfg-api-url').value.trim();
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
