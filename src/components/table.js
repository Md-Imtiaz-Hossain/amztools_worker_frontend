import { COLUMN_MAP, NUMERIC_COLUMNS, renderCellContent } from '../columns.js';
import { getAuthStatus } from '../auth.js';
import { openDetailsModal } from './detailsModal.js';
import { openEditModal } from './createEditModal.js';
import { Api } from '../api.js';
import { showToast } from '../utils/toast.js';

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('...');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push('...');
  }

  pages.push(totalPages);
  return pages;
}

export function renderTable(containerEl, state, handlers) {
  const { isAuthenticated, user } = getAuthStatus();
  const canWrite = isAuthenticated && Boolean(user?.canWrite);
  const visibleCols = state.visibleColumns.map(key => COLUMN_MAP.get(key)).filter(Boolean);
  const products = state.products || [];
  const selectedIds = state.selectedIds || new Set();

  const allPageSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
  const somePageSelected = products.some(p => selectedIds.has(p.id)) && !allPageSelected;

  const totalItems = state.total || 0;
  const totalPages = Math.max(1, state.totalPages || 1);
  const startItem = products.length > 0 ? (state.page - 1) * state.limit + 1 : 0;
  const endItem = products.length > 0 ? (state.page - 1) * state.limit + products.length : 0;
  const pageNumbers = getPageNumbers(state.page, totalPages);

  containerEl.innerHTML = `
    <div class="table-card">
      <!-- Colorful Quick-Scroll Control Bar (height matches row size) -->
      <div class="table-scroll-controls-bar">
        <div class="scroll-controls-left">
          <span class="scroll-bar-label">⚡ Fast Navigation:</span>
          <button type="button" class="btn btn-scroll btn-scroll-left" id="btn-scroll-left" title="Scroll table left">◀ Scroll Left</button>
          <button type="button" class="btn btn-scroll btn-scroll-right" id="btn-scroll-right" title="Scroll table right">Scroll Right ▶</button>
        </div>
        <div class="scroll-controls-right">
          <button type="button" class="btn btn-scroll btn-scroll-top" id="btn-scroll-top" title="Scroll to top of table">▲ Top</button>
          <button type="button" class="btn btn-scroll btn-scroll-bottom" id="btn-scroll-bottom" title="Scroll to bottom of table">▼ Bottom</button>
        </div>
      </div>

      <div class="table-responsive" id="table-scroll-container">
        <table class="data-table" id="main-data-table">
          <thead>
            <tr>
              <!-- Selection Checkbox Column Header -->
              <th class="th-checkbox">
                <input type="checkbox" id="th-select-all" ${allPageSelected ? 'checked' : ''} title="Select/Deselect all rows on this page" />
              </th>

              <!-- Details Column Header (Separate dedicated column) -->
              <th class="th-details-col">
                <div class="th-top-row">
                  <span class="th-label">Details</span>
                </div>
              </th>

              <!-- Dynamic Visible Columns with Inline Search (Newline) & Resizers -->
              ${visibleCols.map(col => {
                const isSorted = state.sortBy === col.key;
                const sortArrow = isSorted ? (state.sortOrder === 'ASC' ? '▲' : '▼') : '';
                const activeFilter = state.columnFilters && state.columnFilters[col.key];
                const hasColFilter = activeFilter !== undefined && activeFilter !== null;

                let filterDisplayVal = '';
                if (hasColFilter) {
                  if (typeof activeFilter === 'object') {
                    if (activeFilter.min && activeFilter.max) filterDisplayVal = `${activeFilter.min}-${activeFilter.max}`;
                    else if (activeFilter.min) filterDisplayVal = `>=${activeFilter.min}`;
                    else if (activeFilter.max) filterDisplayVal = `<=${activeFilter.max}`;
                  } else {
                    filterDisplayVal = String(activeFilter);
                  }
                }

                const isNumeric = col.type === 'number' || col.type === 'currency' || col.type === 'percent';
                const placeholder = isNumeric ? 'e.g. >50, 10-50' : `Search ${col.label}...`;

                return `
                  <th class="th-data ${isSorted ? 'th-sorted' : ''}" data-col="${col.key}">
                    <!-- Line 1: Title and Sort Arrow -->
                    <div class="th-top-row">
                      <span class="th-label" data-col="${col.key}" title="Click to sort by ${col.label}">
                        ${col.label} ${sortArrow ? `<span class="sort-icon">${sortArrow}</span>` : ''}
                      </span>
                      <!-- Column Drag Resizer Handle -->
                      <div class="col-resizer" data-col="${col.key}" title="Drag to resize column width"></div>
                    </div>

                    <!-- Line 2 (Newline): Inline Search Input & Search Button -->
                    <div class="th-search-row">
                      <input type="text"
                             class="th-inline-search-input ${hasColFilter ? 'has-filter' : ''}"
                             data-col="${col.key}"
                             placeholder="${placeholder}"
                             value="${escapeAttr(filterDisplayVal)}"
                             title="${isNumeric ? 'Filter numeric values: e.g. >50, <100, 10-50, or exact number' : 'Search ' + col.label}"
                             onclick="event.stopPropagation()" />
                      <button type="button"
                              class="btn-inline-search ${hasColFilter ? 'filter-active' : ''}"
                              data-col="${col.key}"
                              title="${hasColFilter ? 'Clear filter' : 'Search ' + col.label}"
                              onclick="event.stopPropagation()">
                        ${hasColFilter ? '✕' : '🔍'}
                      </button>
                    </div>
                  </th>
                `;
              }).join('')}

              <!-- Actions Column Header (Only visible when user has write access: SuperAdmin & Admin) -->
              ${canWrite ? `
                <th class="th-actions">Actions</th>
              ` : ''}
            </tr>
          </thead>

          <tbody id="table-body">
            ${state.isLoading ? `
              <tr>
                <td colspan="${visibleCols.length + (canWrite ? 3 : 2)}" class="td-loading">
                  <div class="loading-spinner"></div>
                  <span>Loading product catalog data...</span>
                </td>
              </tr>
            ` : products.length === 0 ? `
              <tr>
                <td colspan="${visibleCols.length + (canWrite ? 3 : 2)}" class="td-empty">
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
                <tr class="table-row ${isSelected ? 'row-selected' : ''}" data-id="${product.id}">
                  <!-- Row Checkbox -->
                  <td class="td-checkbox">
                    <input type="checkbox" class="row-checkbox" data-id="${product.id}" ${isSelected ? 'checked' : ''} />
                  </td>

                  <!-- Dedicated Details Column Button -->
                  <td class="td-details-col">
                    <button type="button" class="btn btn-xs btn-details" data-id="${product.id}" title="View all 67 fields for ${escapeAttr(product.asin || 'product')}">
                      ℹ Details
                    </button>
                  </td>

                  <!-- Dynamic Data Cells -->
                  ${visibleCols.map(col => `
                    <td class="td-cell td-col-${col.key}">
                      ${renderCellContent(col, product[col.key], product)}
                    </td>
                  `).join('')}

                  <!-- Actions Column (Only visible when user has write access: SuperAdmin & Admin) -->
                  ${canWrite ? `
                    <td class="td-actions">
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

      <!-- Pagination Bar (Always anchored at bottom of card) -->
      <div class="table-pagination">
        <div class="pagination-info">
          Showing <strong>${startItem.toLocaleString()}</strong> to <strong>${endItem.toLocaleString()}</strong> of <strong>${totalItems.toLocaleString()}</strong> items
          ${selectedIds.size > 0 ? `&bull; <span class="badge badge-info">${selectedIds.size} checked</span>` : ''}
        </div>

        <div class="pagination-center">
          <div class="pagination-controls">
            <button type="button" class="btn btn-xs btn-outline pg-nav-btn" id="pg-first" ${state.page <= 1 ? 'disabled' : ''} title="Go to First Page (1)">⏮ First</button>
            <button type="button" class="btn btn-xs btn-outline pg-nav-btn" id="pg-prev" ${state.page <= 1 ? 'disabled' : ''} title="Go to Previous Page">◀ Prev</button>
            
            <div class="pagination-numbers">
              ${pageNumbers.map(p => {
                if (p === '...') {
                  return `<span class="pagination-ellipsis">&hellip;</span>`;
                }
                const isActive = p === state.page;
                return `
                  <button type="button" class="btn-page ${isActive ? 'btn-page-active' : ''}" data-page="${p}" ${isActive ? 'disabled aria-current="page"' : ''} title="Page ${p}">
                    ${p}
                  </button>
                `;
              }).join('')}
            </div>

            <button type="button" class="btn btn-xs btn-outline pg-nav-btn" id="pg-next" ${state.page >= totalPages ? 'disabled' : ''} title="Go to Next Page">Next ▶</button>
            <button type="button" class="btn btn-xs btn-outline pg-nav-btn" id="pg-last" ${state.page >= totalPages ? 'disabled' : ''} title="Go to Last Page (${totalPages})">Last ⏭</button>
          </div>
        </div>

        <div class="pagination-right">
          <!-- Quick Page Jump -->
          <div class="pagination-jump-group">
            <label for="pg-jump-input">Go to:</label>
            <input type="number" id="pg-jump-input" class="pagination-jump-input" min="1" max="${totalPages}" value="${state.page}" title="Enter page number (1-${totalPages}) and press Enter" />
            <button type="button" class="btn btn-xs btn-outline" id="pg-jump-btn" title="Jump to page">Go</button>
          </div>

          <!-- Bottom Per-Page Selector (Synced with toolbar) -->
          <div class="pagination-per-page">
            <select id="pg-bottom-limit" class="form-select form-select-xs" title="Items per page (max 100)">
              <option value="20" ${state.limit === 20 ? 'selected' : ''}>20 / page</option>
              <option value="25" ${state.limit === 25 ? 'selected' : ''}>25 / page</option>
              <option value="50" ${state.limit === 50 ? 'selected' : ''}>50 / page</option>
              <option value="100" ${state.limit === 100 ? 'selected' : ''}>100 / page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;

  bindTableEvents(containerEl, state, handlers, products);
}

function bindTableEvents(containerEl, state, handlers, products) {
  const scrollContainer = containerEl.querySelector('#table-scroll-container');

  // Quick scroll buttons
  const btnScrollLeft = containerEl.querySelector('#btn-scroll-left');
  const btnScrollRight = containerEl.querySelector('#btn-scroll-right');
  const btnScrollTop = containerEl.querySelector('#btn-scroll-top');
  const btnScrollBottom = containerEl.querySelector('#btn-scroll-bottom');

  if (scrollContainer) {
    if (btnScrollLeft) {
      btnScrollLeft.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: -350, behavior: 'smooth' });
      });
    }
    if (btnScrollRight) {
      btnScrollRight.addEventListener('click', () => {
        scrollContainer.scrollBy({ left: 350, behavior: 'smooth' });
      });
    }
    if (btnScrollTop) {
      btnScrollTop.addEventListener('click', () => {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (btnScrollBottom) {
      btnScrollBottom.addEventListener('click', () => {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  // Master checkbox selection
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
      if (colKey) handlers.onSortChanged(colKey);
    });
  });

  // Dedicated Details button click
  containerEl.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const product = products.find(p => p.id === id);
      if (product) {
        openDetailsModal(product);
      }
    });
  });

  // Edit button click
  containerEl.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const product = products.find(p => p.id === id);
      if (product) {
        openEditModal(product, handlers.onProductUpdated);
      }
    });
  });

  // Delete button click
  containerEl.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
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

  // Inline Search Inputs & Search/Clear Buttons in Headers
  containerEl.querySelectorAll('.th-inline-search-input').forEach(input => {
    const colKey = input.dataset.col;

    const applyInlineFilter = () => {
      const val = input.value.trim();
      const col = COLUMN_MAP.get(colKey);
      const isNumeric = col && (col.type === 'number' || col.type === 'currency' || col.type === 'percent');

      if (!val) {
        handlers.onColumnFilterChanged(colKey, null);
        return;
      }

      if (isNumeric) {
        // Range syntax: 10-50
        if (val.includes('-') && !val.startsWith('-')) {
          const parts = val.split('-');
          const min = parseFloat(parts[0]);
          const max = parseFloat(parts[1]);
          handlers.onColumnFilterChanged(colKey, { min: !isNaN(min) ? min : '', max: !isNaN(max) ? max : '' });
          return;
        }
        // Greater than: >50 or >=50
        if (val.startsWith('>')) {
          const num = parseFloat(val.replace(/[>=]/g, ''));
          handlers.onColumnFilterChanged(colKey, { min: !isNaN(num) ? num : '' });
          return;
        }
        // Less than: <50 or <=50
        if (val.startsWith('<')) {
          const num = parseFloat(val.replace(/[<=]/g, ''));
          handlers.onColumnFilterChanged(colKey, { max: !isNaN(num) ? num : '' });
          return;
        }
      }

      handlers.onColumnFilterChanged(colKey, val);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applyInlineFilter();
      }
    });

    const searchBtn = containerEl.querySelector(`.btn-inline-search[data-col="${colKey}"]`);
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const hasColFilter = state.columnFilters && state.columnFilters[colKey] !== undefined;
        if (hasColFilter) {
          // Clear active filter
          input.value = '';
          handlers.onColumnFilterChanged(colKey, null);
        } else {
          applyInlineFilter();
        }
      });
    }
  });

  // Draggable Column Resizers
  containerEl.querySelectorAll('.col-resizer').forEach(resizer => {
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const th = resizer.closest('th');
      const startX = e.pageX;
      const startWidth = th.offsetWidth;
      resizer.classList.add('resizing');

      const onMouseMove = (moveEvent) => {
        const diff = moveEvent.pageX - startX;
        const newWidth = Math.max(90, startWidth + diff);
        th.style.width = `${newWidth}px`;
        th.style.minWidth = `${newWidth}px`;
      };

      const onMouseUp = () => {
        resizer.classList.remove('resizing');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  });

  // Pagination Controls: First, Prev, Next, Last
  const pgFirst = containerEl.querySelector('#pg-first');
  const pgPrev = containerEl.querySelector('#pg-prev');
  const pgNext = containerEl.querySelector('#pg-next');
  const pgLast = containerEl.querySelector('#pg-last');

  if (pgFirst) pgFirst.addEventListener('click', () => handlers.onPageChanged(1));
  if (pgPrev) pgPrev.addEventListener('click', () => handlers.onPageChanged(state.page - 1));
  if (pgNext) pgNext.addEventListener('click', () => handlers.onPageChanged(state.page + 1));
  if (pgLast) pgLast.addEventListener('click', () => handlers.onPageChanged(state.totalPages));

  // Direct Page Number buttons
  containerEl.querySelectorAll('.btn-page:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (!isNaN(p)) handlers.onPageChanged(p);
    });
  });

  // Jump to Page Input & Button
  const jumpInput = containerEl.querySelector('#pg-jump-input');
  const jumpBtn = containerEl.querySelector('#pg-jump-btn');
  const triggerJump = () => {
    if (!jumpInput) return;
    const target = parseInt(jumpInput.value, 10);
    if (!isNaN(target)) {
      const clamped = Math.max(1, Math.min(state.totalPages, target));
      handlers.onPageChanged(clamped);
    }
  };

  if (jumpBtn) jumpBtn.addEventListener('click', triggerJump);
  if (jumpInput) {
    jumpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerJump();
    });
  }

  // Bottom Per-Page Limit Selector (Synced with toolbar)
  const bottomLimitSelect = containerEl.querySelector('#pg-bottom-limit');
  if (bottomLimitSelect) {
    bottomLimitSelect.addEventListener('change', (e) => {
      handlers.onPageSizeChanged(parseInt(e.target.value, 10));
    });
  }
}

function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/"/g, '&quot;');
}
