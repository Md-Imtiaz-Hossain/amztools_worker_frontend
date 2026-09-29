import { getAuthStatus } from '../auth.js';
import { downloadSelectedData } from './exportService.js';
import { openCreateModal } from './createEditModal.js';
import { openColumnSettingsModal } from './columnSettingsModal.js';

export function renderToolbar(containerEl, state, handlers) {
  const { isAuthenticated } = getAuthStatus();
  const selectedCount = state.selectedIds ? state.selectedIds.size : 0;
  const activeFilterCount = Object.keys(state.columnFilters || {}).length;

  containerEl.innerHTML = `
    <div class="table-toolbar">
      <div class="toolbar-left">
        <!-- Create Button (Hidden when not logged in) -->
        ${isAuthenticated ? `
          <button type="button" class="btn btn-primary btn-create" id="btn-create-product">
            <span class="btn-icon">＋</span> Create Product
          </button>
        ` : ''}

        <!-- Global Search Box -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="global-search-input" class="search-input" placeholder="Search ASIN, title, brand, wholesaler..." value="${state.globalSearch || ''}" />
          ${state.globalSearch ? `<button type="button" class="search-clear-btn" id="btn-clear-global-search">&times;</button>` : ''}
        </div>

        <!-- Column Settings Button -->
        <button type="button" class="btn btn-outline" id="btn-column-settings" title="Select and reorder visible table columns">
          <span>⚙ Columns (${state.visibleColumns.length})</span>
        </button>

        <!-- Active Column Filters Pill (if any) -->
        ${activeFilterCount > 0 ? `
          <div class="filter-badge-pill" id="btn-clear-col-filters" title="Click to clear all column filters">
            <span>Filters: ${activeFilterCount} active</span>
            <span class="pill-remove">&times;</span>
          </div>
        ` : ''}
      </div>

      <div class="toolbar-right">
        <!-- Page size selector: 50, 100, 150 -->
        <div class="per-page-selector">
          <label for="select-page-size">Show:</label>
          <select id="select-page-size" class="form-select form-select-sm">
            <option value="50" ${state.limit === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${state.limit === 100 ? 'selected' : ''}>100</option>
            <option value="150" ${state.limit === 150 ? 'selected' : ''}>150</option>
          </select>
        </div>

        <!-- Download Button -->
        <div class="download-group">
          <button type="button" class="btn btn-secondary btn-download ${selectedCount === 0 ? 'btn-download-disabled' : ''}" id="btn-download" title="Export checked rows to CSV">
            <span>📥 Download (${selectedCount})</span>
          </button>
          <div class="download-dropdown" id="download-dropdown" style="display: none;">
            <button type="button" class="dropdown-item" id="btn-dl-csv">Export as CSV</button>
            <button type="button" class="dropdown-item" id="btn-dl-json">Export as JSON</button>
          </div>
        </div>

        <!-- Refresh Button -->
        <button type="button" class="btn btn-icon-only btn-outline" id="btn-refresh" title="Reload data">
          ⟳
        </button>
      </div>
    </div>
  `;

  bindToolbarEvents(containerEl, state, handlers);
}

function bindToolbarEvents(containerEl, state, handlers) {
  // Create Product
  const createBtn = containerEl.querySelector('#btn-create-product');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      openCreateModal(handlers.onProductCreated);
    });
  }

  // Column Settings
  const colSettingsBtn = containerEl.querySelector('#btn-column-settings');
  if (colSettingsBtn) {
    colSettingsBtn.addEventListener('click', () => {
      openColumnSettingsModal(handlers.onColumnsChanged);
    });
  }

  // Page Size Selector
  const pageSizeSelect = containerEl.querySelector('#select-page-size');
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      handlers.onPageSizeChanged(parseInt(e.target.value, 10));
    });
  }

  // Global Search Input with debounce
  const searchInput = containerEl.querySelector('#global-search-input');
  let debounceTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        handlers.onSearchChanged(e.target.value.trim());
      }, 350);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimeout);
        handlers.onSearchChanged(searchInput.value.trim());
      }
    });
  }

  const clearSearchBtn = containerEl.querySelector('#btn-clear-global-search');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      handlers.onSearchChanged('');
    });
  }

  // Clear column filters
  const clearColFiltersBtn = containerEl.querySelector('#btn-clear-col-filters');
  if (clearColFiltersBtn) {
    clearColFiltersBtn.addEventListener('click', () => {
      handlers.onClearAllColumnFilters();
    });
  }

  // Download Button & Dropdown
  const downloadBtn = containerEl.querySelector('#btn-download');
  const downloadDropdown = containerEl.querySelector('#download-dropdown');
  if (downloadBtn && downloadDropdown) {
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selected = handlers.getSelectedProducts();
      if (!selected || selected.length === 0) {
        downloadSelectedData([]);
        return;
      }
      downloadDropdown.style.display = downloadDropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      downloadDropdown.style.display = 'none';
    });

    containerEl.querySelector('#btn-dl-csv').addEventListener('click', () => {
      downloadSelectedData(handlers.getSelectedProducts(), 'csv');
      downloadDropdown.style.display = 'none';
    });

    containerEl.querySelector('#btn-dl-json').addEventListener('click', () => {
      downloadSelectedData(handlers.getSelectedProducts(), 'json');
      downloadDropdown.style.display = 'none';
    });
  }

  // Refresh
  const refreshBtn = containerEl.querySelector('#btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      handlers.onRefresh();
    });
  }
}
