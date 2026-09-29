import { ALL_COLUMNS, getVisibleColumnKeys, setVisibleColumnKeys } from '../columns.js';
import { showToast } from '../utils/toast.js';

let modalEl = null;
let onColumnsChangedCallback = null;

export function openColumnSettingsModal(onColumnsChanged) {
  onColumnsChangedCallback = onColumnsChanged;
  if (!modalEl) {
    createModalDom();
  }
  populateCheckboxes();
  modalEl.classList.add('modal-active');
}

export function closeColumnSettingsModal() {
  if (modalEl) {
    modalEl.classList.remove('modal-active');
  }
}

function createModalDom() {
  modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.id = 'column-settings-modal';

  modalEl.innerHTML = `
    <div class="modal-dialog modal-lg" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Table Column Settings</h3>
          <p class="modal-subtitle">Choose which columns to display on the main product analysis table (68 available)</p>
        </div>
        <button type="button" class="modal-close" id="col-settings-close">&times;</button>
      </div>

      <div class="modal-body">
        <div class="col-settings-toolbar">
          <input type="text" id="col-filter-input" class="form-control form-control-sm" placeholder="Search columns..." />
          <div class="col-presets">
            <button type="button" class="btn btn-xs btn-outline" id="preset-default">Reset to Default (Basic)</button>
            <button type="button" class="btn btn-xs btn-outline" id="preset-financials">Financials Only</button>
            <button type="button" class="btn btn-xs btn-outline" id="preset-all">Select All (68)</button>
            <button type="button" class="btn btn-xs btn-outline" id="preset-none">Clear All</button>
          </div>
        </div>

        <div id="col-groups-container" class="col-groups-grid">
          <!-- Checkbox groups injected dynamically -->
        </div>
      </div>

      <div class="modal-footer">
        <div class="col-count-status" id="col-count-status">0 columns selected</div>
        <div class="modal-footer-actions">
          <button type="button" class="btn btn-secondary" id="col-settings-cancel">Cancel</button>
          <button type="button" class="btn btn-primary" id="col-settings-apply">Apply & Save</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeColumnSettingsModal();
  });

  modalEl.querySelector('#col-settings-close').addEventListener('click', closeColumnSettingsModal);
  modalEl.querySelector('#col-settings-cancel').addEventListener('click', closeColumnSettingsModal);

  modalEl.querySelector('#col-filter-input').addEventListener('input', (e) => {
    filterColumnCheckboxes(e.target.value.toLowerCase());
  });

  // Presets
  modalEl.querySelector('#preset-default').addEventListener('click', () => {
    const defaultKeys = new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
    setAllCheckboxes(col => defaultKeys.has(col.key));
  });

  modalEl.querySelector('#preset-financials').addEventListener('click', () => {
    const financialKeys = new Set(['asin', 'title', 'brand', 'cost', 'sell_price', 'profit', 'margin_pct', 'roi_pct', 'break_even_sell_price', 'referral_fee', 'fba_pick_pack_fee']);
    setAllCheckboxes(col => financialKeys.has(col.key));
  });

  modalEl.querySelector('#preset-all').addEventListener('click', () => {
    setAllCheckboxes(() => true);
  });

  modalEl.querySelector('#preset-none').addEventListener('click', () => {
    setAllCheckboxes(() => false);
  });

  modalEl.querySelector('#col-settings-apply').addEventListener('click', () => {
    const selectedKeys = [];
    modalEl.querySelectorAll('.col-checkbox-item input[type="checkbox"]').forEach(cb => {
      if (cb.checked) {
        selectedKeys.push(cb.value);
      }
    });

    if (selectedKeys.length === 0) {
      showToast('Please select at least 1 column to display', 'warning');
      return;
    }

    setVisibleColumnKeys(selectedKeys);
    showToast(`Table updated with ${selectedKeys.length} column(s)`, 'success');
    closeColumnSettingsModal();

    if (typeof onColumnsChangedCallback === 'function') {
      onColumnsChangedCallback(selectedKeys);
    }
  });
}

function populateCheckboxes() {
  const container = modalEl.querySelector('#col-groups-container');
  container.innerHTML = '';

  const activeKeys = new Set(getVisibleColumnKeys());

  // Group columns by category
  const categories = {};
  ALL_COLUMNS.forEach(col => {
    const cat = col.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(col);
  });

  for (const [catName, cols] of Object.entries(categories)) {
    const groupCard = document.createElement('div');
    groupCard.className = 'col-group-card';
    groupCard.dataset.category = catName.toLowerCase();

    let itemsHtml = cols.map(col => `
      <label class="col-checkbox-item" data-name="${col.label.toLowerCase()} ${col.key.toLowerCase()}">
        <input type="checkbox" value="${col.key}" ${activeKeys.has(col.key) ? 'checked' : ''} />
        <span class="col-label">${col.label}</span>
        <span class="col-type-tag">${col.type}</span>
      </label>
    `).join('');

    groupCard.innerHTML = `
      <div class="col-group-header">
        <h4>${catName}</h4>
        <button type="button" class="btn-group-toggle" data-cat="${catName}">Toggle All</button>
      </div>
      <div class="col-group-list">
        ${itemsHtml}
      </div>
    `;

    groupCard.querySelector('.btn-group-toggle').addEventListener('click', () => {
      const cbs = groupCard.querySelectorAll('input[type="checkbox"]');
      const anyUnchecked = Array.from(cbs).some(cb => !cb.checked);
      cbs.forEach(cb => { cb.checked = anyUnchecked; });
      updateSelectedCount();
    });

    container.appendChild(groupCard);
  }

  container.addEventListener('change', updateSelectedCount);
  updateSelectedCount();
}

function setAllCheckboxes(predicate) {
  modalEl.querySelectorAll('.col-checkbox-item input[type="checkbox"]').forEach(cb => {
    const colKey = cb.value;
    const col = ALL_COLUMNS.find(c => c.key === colKey);
    cb.checked = predicate(col);
  });
  updateSelectedCount();
}

function updateSelectedCount() {
  const total = modalEl.querySelectorAll('.col-checkbox-item input[type="checkbox"]:checked').length;
  const statusEl = modalEl.querySelector('#col-count-status');
  if (statusEl) {
    statusEl.textContent = `${total} of ${ALL_COLUMNS.length} columns selected`;
  }
}

function filterColumnCheckboxes(query) {
  modalEl.querySelectorAll('.col-checkbox-item').forEach(item => {
    const match = !query || item.dataset.name.includes(query);
    item.style.display = match ? 'flex' : 'none';
  });

  modalEl.querySelectorAll('.col-group-card').forEach(card => {
    const visibleItems = card.querySelectorAll('.col-checkbox-item:not([style*="display: none"])');
    card.style.display = visibleItems.length > 0 ? 'block' : 'none';
  });
}
