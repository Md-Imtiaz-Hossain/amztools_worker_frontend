import { renderNavbar } from './src/components/navbar.js';
import { renderWelcomeSection } from './src/components/welcomeSection.js';
import { renderToolbar } from './src/components/tableToolbar.js';
import { renderTable } from './src/components/table.js';
import { renderFooter } from './src/components/footer.js';
import { getVisibleColumnKeys, setVisibleColumnKeys } from './src/columns.js';
import { Api } from './src/api.js';
import { subscribeAuth } from './src/auth.js';
import { showToast } from './src/utils/toast.js';
import { getSavedPageSize, setSavedPageSize } from './src/config.js';

// Central Application State
const state = {
  products: [],
  page: 1,
  limit: getSavedPageSize(), // Default 20 items per page (persisted in localStorage, max 100)
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
let welcomeContainer = null;
let toolbarContainer = null;
let tableContainer = null;
let footerContainer = null;

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
    queryParams.search = state.globalSearch;
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
        state.total = res.pagination.totalItems !== undefined ? res.pagination.totalItems : (res.pagination.total || 0);
        state.totalPages = Math.max(1, res.pagination.totalPages || Math.ceil(state.total / state.limit) || 1);
      } else {
        state.total = state.products.length;
        state.totalPages = Math.max(1, Math.ceil(state.total / state.limit) || 1);
      }

      // Check if page requested is beyond totalPages (e.g. after search filter narrowed results)
      if (state.page > state.totalPages && state.totalPages > 0) {
        state.page = state.totalPages;
        loadData();
        return;
      }

      if (res.fallbackFromDbError) {
        showToast('⚠️ Live DB unreachable. Loaded Demo Data so you can continue testing.', 'warning');
      }
    } else {
      state.products = [];
      state.total = 0;
      state.totalPages = 1;
      const err = (res && res.error) || 'Failed to fetch products';
      showToast(err, 'error');
    }
  } catch (err) {
    // If anything fails unexpectedly, ensure demo data is shown so user can test
    const { queryDemoProducts } = await import('./src/demoData.js');
    const fallback = queryDemoProducts(queryParams);
    state.products = fallback.data || [];
    state.total = fallback.pagination.totalItems;
    state.totalPages = fallback.pagination.totalPages;
    showToast('⚠️ DB connection failed. Showing Demo Data for testing.', 'warning');
  } finally {
    state.isLoading = false;
    renderView();
  }
}

function renderView() {
  const handlers = {
    onPageSizeChanged(newLimit) {
      const sanitized = Math.min(100, Math.max(1, parseInt(newLimit, 10) || 20));
      state.limit = sanitized;
      setSavedPageSize(sanitized);
      state.page = 1;
      loadData();
    },
    onPageChanged(newPage) {
      const pageNum = parseInt(newPage, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= state.totalPages && pageNum !== state.page) {
        state.page = pageNum;
        loadData();
        const scrollContainer = document.getElementById('table-scroll-container');
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

  if (welcomeContainer) {
    renderWelcomeSection(welcomeContainer, state);
  }
  if (toolbarContainer) {
    renderToolbar(toolbarContainer, state, handlers);
  }
  if (tableContainer) {
    renderTable(tableContainer, state, handlers);
  }
  if (footerContainer) {
    renderFooter(footerContainer);
  }
}

// App Initialization
function initApp() {
  welcomeContainer = document.getElementById('welcome-container');
  toolbarContainer = document.getElementById('toolbar-container');
  tableContainer = document.getElementById('table-container');
  footerContainer = document.getElementById('footer-container');

  renderNavbar('navbar-container', () => {
    loadData();
  });

  // Re-render when auth changes (reveals/hides Create and Action buttons)
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
