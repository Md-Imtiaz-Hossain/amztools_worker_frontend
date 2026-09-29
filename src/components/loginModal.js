import { Api } from '../api.js';
import { saveSession } from '../auth.js';
import { showToast } from '../utils/toast.js';

let modalEl = null;

export function openLoginModal() {
  if (!modalEl) {
    createLoginModalDom();
  }
  const usernameInput = modalEl.querySelector('#login-username');
  const passwordInput = modalEl.querySelector('#login-password');
  const errorEl = modalEl.querySelector('#login-error');
  
  errorEl.textContent = '';
  usernameInput.value = '';
  passwordInput.value = '';

  modalEl.classList.add('modal-active');
  usernameInput.focus();
}

export function closeLoginModal() {
  if (modalEl) {
    modalEl.classList.remove('modal-active');
  }
}

function createLoginModalDom() {
  modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.id = 'login-modal';

  modalEl.innerHTML = `
    <div class="modal-dialog modal-sm" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 class="modal-title">Worker API Sign In</h3>
        <button type="button" class="modal-close" id="login-modal-close">&times;</button>
      </div>
      <form id="login-form">
        <div class="modal-body">
          <p class="modal-subtitle">Sign in to manage product catalog (Create, Update, Delete). Session remains active for 1 week.</p>
          <div id="login-error" class="form-error-banner"></div>
          
          <div class="form-group">
            <label for="login-username">Username</label>
            <input type="text" id="login-username" class="form-control" placeholder="e.g. admin" required autocomplete="username" />
          </div>
          
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required autocomplete="current-password" />
          </div>

          <div class="login-hint">
            <span>Default credentials configured in code: <code>admin</code> / <code>password123</code></span>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="login-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="login-submit-btn">Sign In</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeLoginModal();
  });

  modalEl.querySelector('#login-modal-close').addEventListener('click', closeLoginModal);
  modalEl.querySelector('#login-cancel-btn').addEventListener('click', closeLoginModal);

  const form = modalEl.querySelector('#login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = modalEl.querySelector('#login-username').value.trim();
    const password = modalEl.querySelector('#login-password').value;
    const submitBtn = modalEl.querySelector('#login-submit-btn');
    const errorEl = modalEl.querySelector('#login-error');

    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      const res = await Api.login(username, password);
      if (res && res.success && res.token) {
        saveSession(res.token, res.user, res.expiresInSeconds || 7 * 24 * 3600);
        showToast(`Welcome back, ${res.user.username}! Session active for 1 week.`, 'success');
        closeLoginModal();
      } else {
        errorEl.textContent = (res && res.error) || 'Invalid username or password';
      }
    } catch (err) {
      errorEl.textContent = 'An unexpected error occurred during login';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}
