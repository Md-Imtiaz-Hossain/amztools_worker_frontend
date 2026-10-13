import { Api } from '../api.js';
import { showToast } from '../utils/toast.js';

let modalEl = null;

export function openCreateUserModal() {
  if (!modalEl) {
    createModalDom();
  }
  const form = modalEl.querySelector('#create-user-form');
  form.reset();
  modalEl.querySelector('#user-error').textContent = '';
  modalEl.classList.add('modal-active');
  modalEl.querySelector('#user-fullname').focus();
}

export function closeCreateUserModal() {
  if (modalEl) {
    modalEl.classList.remove('modal-active');
  }
}

function createModalDom() {
  modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.id = 'create-user-modal';

  modalEl.innerHTML = `
    <div class="modal-dialog modal-sm" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 class="modal-title">⚡ Create New User</h3>
        <button type="button" class="modal-close" id="create-user-close">&times;</button>
      </div>
      <form id="create-user-form">
        <div class="modal-body">
          <p class="modal-subtitle">SuperAdmin privilege: Provision accounts with designated roles.</p>
          <div id="user-error" class="form-error-banner"></div>

          <div class="form-group">
            <label for="user-fullname">Full Name</label>
            <input type="text" id="user-fullname" class="form-control" placeholder="e.g. John Doe" required autocomplete="name" />
          </div>

          <div class="form-group">
            <label for="user-email">Email (Unique)</label>
            <input type="email" id="user-email" class="form-control" placeholder="e.g. user@example.com" required autocomplete="email" />
          </div>

          <div class="form-group">
            <label for="user-password">Password</label>
            <input type="password" id="user-password" class="form-control" placeholder="Min 6 characters" minlength="6" required autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label for="user-role">Role</label>
            <select id="user-role" class="form-select">
              <option value="customer">customer (Like guest user, only read data)</option>
              <option value="admin">admin (Permit everything, restricted from creating users)</option>
              <option value="Super admin">Super admin (Access everything)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="create-user-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary" id="create-user-submit">Create User</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeCreateUserModal();
  });

  modalEl.querySelector('#create-user-close').addEventListener('click', closeCreateUserModal);
  modalEl.querySelector('#create-user-cancel').addEventListener('click', closeCreateUserModal);

  const form = modalEl.querySelector('#create-user-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const full_name = modalEl.querySelector('#user-fullname').value.trim();
    const email = modalEl.querySelector('#user-email').value.trim();
    const password = modalEl.querySelector('#user-password').value;
    const role = modalEl.querySelector('#user-role').value;
    const submitBtn = modalEl.querySelector('#create-user-submit');
    const errorEl = modalEl.querySelector('#user-error');

    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
      const res = await Api.createUser({ full_name, email, password, role });
      if (res && res.success) {
        showToast(`User "${full_name}" created successfully as ${role}!`, 'success');
        closeCreateUserModal();
      } else {
        errorEl.textContent = (res && res.error) || 'Failed to create user';
      }
    } catch (err) {
      errorEl.textContent = 'Network or server error while creating user';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create User';
    }
  });
}
