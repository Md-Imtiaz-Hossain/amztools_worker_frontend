import { COLUMN_MAP } from '../columns.js';

let modalEl = null;
let currentColumn = null;
let onFilterApplyCallback = null;

export function openColumnSearchModal(colKey, activeFilterValue, onApply) {
  const col = COLUMN_MAP.get(colKey);
  if (!col) return;

  currentColumn = col;
  onFilterApplyCallback = onApply;

  if (!modalEl) {
    createModalDom();
  }

  modalEl.querySelector('#col-search-title').textContent = `Filter by: ${col.label} (${col.key})`;
  const isNumeric = col.type === 'number' || col.type === 'currency' || col.type === 'percent';
  
  const textContainer = modalEl.querySelector('#col-search-text-container');
  const numContainer = modalEl.querySelector('#col-search-numeric-container');

  if (isNumeric) {
    textContainer.style.display = 'none';
    numContainer.style.display = 'block';
    
    // Check if active filter has min/max
    const minVal = typeof activeFilterValue === 'object' ? activeFilterValue.min : '';
    const maxVal = typeof activeFilterValue === 'object' ? activeFilterValue.max : '';
    const exactVal = typeof activeFilterValue === 'string' || typeof activeFilterValue === 'number' ? activeFilterValue : '';

    modalEl.querySelector('#col-filter-min').value = minVal || '';
    modalEl.querySelector('#col-filter-max').value = maxVal || '';
    modalEl.querySelector('#col-filter-exact').value = exactVal || '';
  } else {
    textContainer.style.display = 'block';
    numContainer.style.display = 'none';
    const textVal = typeof activeFilterValue === 'string' ? activeFilterValue : '';
    const input = modalEl.querySelector('#col-filter-text');
    input.value = textVal;
    setTimeout(() => input.focus(), 50);
  }

  modalEl.classList.add('modal-active');
}

export function closeColumnSearchModal() {
  if (modalEl) {
    modalEl.classList.remove('modal-active');
  }
}

function createModalDom() {
  modalEl = document.createElement('div');
  modalEl.className = 'modal-backdrop';
  modalEl.id = 'column-search-modal';

  modalEl.innerHTML = `
    <div class="modal-dialog modal-sm" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h4 class="modal-title" id="col-search-title">Column Search</h4>
        <button type="button" class="modal-close" id="col-search-close">&times;</button>
      </div>

      <div class="modal-body">
        <div id="col-search-text-container">
          <div class="form-group">
            <label for="col-filter-text">Keyword / Substring</label>
            <input type="text" id="col-filter-text" class="form-control" placeholder="Search this column..." />
            <small class="form-text">Case-insensitive substring match</small>
          </div>
        </div>

        <div id="col-search-numeric-container" style="display: none;">
          <div class="form-group">
            <label for="col-filter-exact">Exact Value</label>
            <input type="number" step="any" id="col-filter-exact" class="form-control" placeholder="Exact number..." />
          </div>
          <div class="form-row" style="display: flex; gap: 8px;">
            <div class="form-group" style="flex: 1;">
              <label for="col-filter-min">Min (>=)</label>
              <input type="number" step="any" id="col-filter-min" class="form-control" placeholder="Min" />
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="col-filter-max">Max (<=)</label>
              <input type="number" step="any" id="col-filter-max" class="form-control" placeholder="Max" />
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-outline" id="col-filter-clear">Clear Filter</button>
        <button type="button" class="btn btn-primary" id="col-filter-apply">Apply Filter</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeColumnSearchModal();
  });

  modalEl.querySelector('#col-search-close').addEventListener('click', closeColumnSearchModal);

  modalEl.querySelector('#col-filter-clear').addEventListener('click', () => {
    if (currentColumn && typeof onFilterApplyCallback === 'function') {
      onFilterApplyCallback(currentColumn.key, null);
    }
    closeColumnSearchModal();
  });

  modalEl.querySelector('#col-filter-apply').addEventListener('click', () => {
    if (!currentColumn || typeof onFilterApplyCallback !== 'function') {
      closeColumnSearchModal();
      return;
    }

    const isNumeric = currentColumn.type === 'number' || currentColumn.type === 'currency' || currentColumn.type === 'percent';
    if (isNumeric) {
      const exact = modalEl.querySelector('#col-filter-exact').value.trim();
      const min = modalEl.querySelector('#col-filter-min').value.trim();
      const max = modalEl.querySelector('#col-filter-max').value.trim();

      if (exact) {
        onFilterApplyCallback(currentColumn.key, exact);
      } else if (min || max) {
        onFilterApplyCallback(currentColumn.key, { min, max });
      } else {
        onFilterApplyCallback(currentColumn.key, null);
      }
    } else {
      const textVal = modalEl.querySelector('#col-filter-text').value.trim();
      onFilterApplyCallback(currentColumn.key, textVal || null);
    }

    closeColumnSearchModal();
  });
}
