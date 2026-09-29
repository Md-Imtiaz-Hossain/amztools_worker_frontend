import { renderNavbar } from './src/components/navbar.js';
import { renderToolbar } from './src/components/tableToolbar.js';
import { renderTable } from './src/components/table.js';
import { getVisibleColumnKeys, setVisibleColumnKeys } from './src/columns.js';
import { Api } from './src/api.js';
import { subscribeAuth } from './src/auth.js';
import { showToast } from './src/utils/toast.js';

// Central Application State
const state = {
  products: [],
  page: 1,
  limit: 50, // Default 50 items per page (supports 50, 100, 150)
  total: 0,
  totalPages: 1,
  sortBy: 'id',
  sortOrder: 'DESC',
  globalSearch: '',
  columnFilters: {}, // Holds per-column filters
  visibleColumns: getVisibleColumnKeys(),
  selectedIds: new Set(),
  selectedProductsMap: new Map(),
  isLoading: false
};

// DOM Container Elements
let toolbarContainer = null;
let tableContainer = null;

async function loadData() {
  state.isLoading = true;
  renderView();

  const queryParams = {
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder
  };

  if (state.globalSearch) {
    queryParams.q = state.globalSearch;
  }

  // Add all per-column filters
  for (const [colKey, filterVal] of Object.entries(state.columnFilters)) {
    if (filterVal) {
      if (typeof filterVal === 'object') {
        if (filterVal.min !== undefined && filterVal.min !== '') {
          queryParams[`${colKey}_min`] = filterVal.min;
        }
        if (filterVal.max !== undefined && filterVal.max !== '') {
          queryParams[`${colKey}_max`] = filterVal.max;
        }
      } else {
        queryParams[colKey] = filterVal;
      }
    }
  }

  try {
    const res = await Api.fetchProducts(queryParams);
    if (res && res.success) {
      state.products = res.data || [];
      // Keep selected products map updated
      state.products.forEach(p => {
        if (state.selectedIds.has(p.id)) {
          state.selectedProductsMap.set(p.id, p);
        }
      });

      if (res.pagination) {
        state.page = res.pagination.page;
        state.limit = res.pagination.limit;
        state.total = res.pagination.total;
        state.totalPages = res.pagination.totalPages;
      }
    } else {
      state.products = [];
      const err = (res && res.error) || 'Failed to fetch products';
      showToast(err, 'error');
    }
  } catch (err) {
    state.products = [];
    showToast('Failed to connect to backend API', 'error');
  } finally {
    state.isLoading = false;
    renderView();
  }
}

function renderView() {
  const handlers = {
    onPageSizeChanged(newLimit) {
      state.limit = newLimit;
      state.page = 1;
      loadData();
    },
    onPageChanged(newPage) {
      if (newPage >= 1 && newPage <= state.totalPages) {
        state.page = newPage;
        loadData();
      }
    },
    onSearchChanged(query) {
      state.globalSearch = query;
      state.page = 1;
      loadData();
    },
    onSortChanged(colKey) {
      if (state.sortBy === colKey) {
        state.sortOrder = state.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      } else {
        state.sortBy = colKey;
        state.sortOrder = 'DESC';
      }
      loadData();
    },
    onColumnFilterChanged(colKey, filterVal) {
      if (!filterVal) {
        delete state.columnFilters[colKey];
      } else {
        state.columnFilters[colKey] = filterVal;
      }
      state.page = 1;
      loadData();
    },
    onClearAllColumnFilters() {
      state.columnFilters = {};
      state.page = 1;
      loadData();
    },
    onColumnsChanged(newKeys) {
      state.visibleColumns = newKeys;
      setVisibleColumnKeys(newKeys);
      renderView();
    },
    onToggleRowSelection(id, checked) {
      if (checked) {
        state.selectedIds.add(id);
        const prod = state.products.find(p => p.id === id);
        if (prod) state.selectedProductsMap.set(id, prod);
      } else {
        state.selectedIds.delete(id);
        state.selectedProductsMap.delete(id);
      }
      renderView();
    },
    onToggleSelectAllPage(checked) {
      state.products.forEach(p => {
        if (checked) {
          state.selectedIds.add(p.id);
          state.selectedProductsMap.set(p.id, p);
        } else {
          state.selectedIds.delete(p.id);
          state.selectedProductsMap.delete(p.id);
        }
      });
      renderView();
    },
    getSelectedProducts() {
      return Array.from(state.selectedProductsMap.values());
    },
    onProductCreated() {
      loadData();
    },
    onProductUpdated() {
      loadData();
    },
    onProductDeleted(deletedId) {
      state.selectedIds.delete(deletedId);
      state.selectedProductsMap.delete(deletedId);
      loadData();
    },
    onRefresh() {
      loadData();
    }
  };

  if (toolbarContainer) {
    renderToolbar(toolbarContainer, state, handlers);
  }
  if (tableContainer) {
    renderTable(tableContainer, state, handlers);
  }
}

// App Initialization
function initApp() {
  toolbarContainer = document.getElementById('toolbar-container');
  tableContainer = document.getElementById('table-container');

  renderNavbar('navbar-container', () => {
    loadData();
  });

  // Re-render when auth changes (e.g. login/logout reveals or hides Create & Action buttons)
  subscribeAuth(() => {
    renderView();
  });

  loadData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
