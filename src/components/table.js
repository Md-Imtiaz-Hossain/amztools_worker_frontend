import { COLUMN_MAP, renderCellContent } from '../columns.js';
import { getAuthStatus } from '../auth.js';
import { openColumnSearchModal } from './columnSearchModal.js';
import { openDetailsModal } from './detailsModal.js';
import { openEditModal } from './createEditModal.js';
import { Api } from '../api.js';
import { showToast } from '../utils/toast.js';

export function renderTable(containerEl, state, handlers) {
  const { isAuthenticated } = getAuthStatus();
  const visibleCols = state.visibleColumns.map(key => COLUMN_MAP.get(key)).filter(Boolean);
  const products = state.products || [];
  const selectedIds = state.selectedIds || new Set();

  const allPageSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
  const somePageSelected = products.some(p => selectedIds.has(p.id)) && !allPageSelected;

  containerEl.innerHTML = `
    <div class="table-card">
      <div class="table-responsive">
        <table class="data-table" id="main-data-table">
          <thead>
            <tr>
              <!-- Selection Checkbox Column Header -->
              <th class="th-checkbox">
                <input type="checkbox" id="th-select-all" ${allPageSelected ? 'checked' : ''} title="Select/Deselect all rows on this page" />
              </th>

              <!-- Dynamic Visible Columns Headers -->
              ${visibleCols.map(col => {
                const isSorted = state.sortBy === col.key;
                const sortArrow = isSorted ? (state.sortOrder === 'ASC' ? '▲' : '▼') : '';
                const hasColFilter = state.columnFilters && state.columnFilters[col.key];

                return `
                  <th class="th-data ${isSorted ? 'th-sorted' : ''}" data-col="${col.key}">
                    <div class="th-content">
                      <span class="th-label" data-col="${col.key}" title="Click to sort by ${col.label}">
                        ${col.label} ${sortArrow ? `<span class="sort-icon">${sortArrow}</span>` : ''}
                      </span>
                      <!-- Search button for every column -->
                      <button type="button" class="btn-col-search ${hasColFilter ? 'filter-active' : ''}" data-col="${col.key}" title="Filter by ${col.label}">
                        🔍${hasColFilter ? '•' : ''}
                      </button>
                    </div>
                  </th>
                `;
              }).join('')}

              <!-- Actions Column Header (Only visible when logged in) -->
              ${isAuthenticated ? `
                <th class="th-actions">Actions</th>
              ` : ''}
            </tr>
          </thead>

          <tbody id="table-body">
            ${state.isLoading ? `
              <tr>
                <td colspan="${visibleCols.length + (isAuthenticated ? 2 : 1)}" class="td-loading">
                  <div class="loading-spinner"></div>
                  <span>Loading product catalog data...</span>
                </td>
              </tr>
            ` : products.length === 0 ? `
              <tr>
                <td colspan="${visibleCols.length + (isAuthenticated ? 2 : 1)}" class="td-empty">
                  <div class="empty-state-box">
                    <span class="empty-icon">📦</span>
                    <p class="empty-title">No wholesale products found</p>
                    <p class="empty-desc">${state.globalSearch || Object.keys(state.columnFilters || {}).length ? 'Try clearing your filters or search keywords.' : 'The wholesale_products table is empty. Click "+ Create Product" or initialize the D1 database.'}</p>
                  </div>
                </td>
              </tr>
            ` : products.map(product => {
              const isSelected = selectedIds.has(product.id);
              return `
                <tr class="table-row ${isSelected ? 'row-selected' : ''}" data-id="${product.id}" title="Click row to view full product details">
                  <!-- Row Checkbox -->
                  <td class="td-checkbox" onclick="event.stopPropagation()">
                    <input type="checkbox" class="row-checkbox" data-id="${product.id}" ${isSelected ? 'checked' : ''} />
                  </td>

                  <!-- Dynamic Data Cells -->
                  ${visibleCols.map(col => `
                    <td class="td-cell td-col-${col.key}">
                      ${renderCellContent(col, product[col.key], product)}
                    </td>
                  `).join('')}

                  <!-- Actions Column (Only visible when logged in) -->
                  ${isAuthenticated ? `
                    <td class="td-actions" onclick="event.stopPropagation()">
                      <div class="action-btn-group">
                        <button type="button" class="btn btn-xs btn-outline btn-edit" data-id="${product.id}" title="Edit product">
                          ✎ Edit
                        </button>
                        <button type="button" class="btn btn-xs btn-danger-outline btn-delete" data-id="${product.id}" title="Delete product">
                          🗑
                        </button>
                      </div>
                    </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div class="table-pagination">
        <div class="pagination-info">
          Showing <strong>${products.length > 0 ? (state.page - 1) * state.limit + 1 : 0}</strong>
          to <strong>${Math.min(state.page * state.limit, state.total)}</strong>
          of <strong>${state.total.toLocaleString()}</strong> items
          ${selectedIds.size > 0 ? `&bull; <span class="badge badge-info">${selectedIds.size} checked</span>` : ''}
        </div>

        <div class="pagination-controls">
          <button type="button" class="btn btn-xs btn-outline" id="pg-first" ${state.page <= 1 ? 'disabled' : ''}>⏮ First</button>
          <button type="button" class="btn btn-xs btn-outline" id="pg-prev" ${state.page <= 1 ? 'disabled' : ''}>◀ Prev</button>
          <span class="pagination-page-indicator">Page ${state.page} of ${state.totalPages || 1}</span>
          <button type="button" class="btn btn-xs btn-outline" id="pg-next" ${state.page >= state.totalPages ? 'disabled' : ''}>Next ▶</button>
          <button type="button" class="btn btn-xs btn-outline" id="pg-last" ${state.page >= state.totalPages ? 'disabled' : ''}>Last ⏭</button>
        </div>
      </div>
    </div>
  `;

  bindTableEvents(containerEl, state, handlers, products);
}

function bindTableEvents(containerEl, state, handlers, products) {
  // Master checkbox indeterminate state
  const thSelectAll = containerEl.querySelector('#th-select-all');
  if (thSelectAll) {
    const selectedIds = state.selectedIds || new Set();
    const allPageSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
    const somePageSelected = products.some(p => selectedIds.has(p.id)) && !allPageSelected;
    thSelectAll.indeterminate = somePageSelected;

    thSelectAll.addEventListener('change', (e) => {
      handlers.onToggleSelectAllPage(e.target.checked);
    });
  }

  // Row selection checkboxes
  containerEl.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id, 10);
      handlers.onToggleRowSelection(id, e.target.checked);
    });
  });

  // Sort header click
  containerEl.querySelectorAll('.th-label').forEach(th => {
    th.addEventListener('click', () => {
      const colKey = th.dataset.col;
      handlers.onSortChanged(colKey);
    });
  });

  // Search button for every column
  containerEl.querySelectorAll('.btn-col-search').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const colKey = btn.dataset.col;
      const currentVal = state.columnFilters ? state.columnFilters[colKey] : null;
      openColumnSearchModal(colKey, currentVal, (appliedColKey, filterValue) => {
        handlers.onColumnFilterChanged(appliedColKey, filterValue);
      });
    });
  });

  // Click row to view details modal
  containerEl.querySelectorAll('.table-row').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt(row.dataset.id, 10);
      const product = products.find(p => p.id === id);
      if (product) {
        openDetailsModal(product);
      }
    });
  });

  // Edit button in actions
  containerEl.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      const product = products.find(p => p.id === id);
      if (product) {
        openEditModal(product, handlers.onProductUpdated);
      }
    });
  });

  // Delete button in actions
  containerEl.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      const product = products.find(p => p.id === id);
      const asin = product ? product.asin : `ID ${id}`;

      if (confirm(`Are you sure you want to permanently delete product "${asin}"?`)) {
        btn.disabled = true;
        btn.textContent = '...';
        const res = await Api.deleteProduct(id);
        if (res && res.success) {
          showToast(`Deleted product ${asin}`, 'success');
          handlers.onProductDeleted(id);
        } else {
          showToast((res && res.error) || 'Failed to delete product', 'error');
          btn.disabled = false;
          btn.textContent = '🗑';
        }
      }
    });
  });

  // Pagination buttons
  const pgFirst = containerEl.querySelector('#pg-first');
  const pgPrev = containerEl.querySelector('#pg-prev');
  const pgNext = containerEl.querySelector('#pg-next');
  const pgLast = containerEl.querySelector('#pg-last');

  if (pgFirst) pgFirst.addEventListener('click', () => handlers.onPageChanged(1));
  if (pgPrev) pgPrev.addEventListener('click', () => handlers.onPageChanged(state.page - 1));
  if (pgNext) pgNext.addEventListener('click', () => handlers.onPageChanged(state.page + 1));
  if (pgLast) pgLast.addEventListener('click', () => handlers.onPageChanged(state.totalPages));
}
