import { getApiBaseUrl } from './config.js';
import { getAuthStatus, clearSession } from './auth.js';
import { showToast } from './utils/toast.js';

async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const { token, isAuthenticated } = getAuthStatus();
  if (isAuthenticated && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      if (isAuthenticated) {
        showToast('Session expired. Please log in again.', 'warning');
        clearSession();
      }
      return { success: false, status: 401, error: (data && data.error) || 'Unauthorized' };
    }

    if (!response.ok) {
      const errMsg = (data && (data.error || data.message)) || `Server returned status ${response.status}`;
      return { success: false, status: response.status, error: errMsg };
    }

    return data || { success: true };
  } catch (err) {
    console.error(`API request error on ${url}:`, err);
    return {
      success: false,
      status: 0,
      error: `Network error: Cannot connect to API backend at ${baseUrl}. Please ensure the Cloudflare Worker is running.`
    };
  }
}

export const Api = {
  // Authentication
  async login(username, password) {
    return await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  async logout() {
    return await request('/api/auth/logout', {
      method: 'POST'
    });
  },

  async verifyMe() {
    return await request('/api/auth/me', {
      method: 'GET'
    });
  },

  // Products
  async fetchProducts(params = {}) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        searchParams.append(key, String(val).trim());
      }
    }
    const queryStr = searchParams.toString();
    const endpoint = `/api/products${queryStr ? '?' + queryStr : ''}`;
    return await request(endpoint, { method: 'GET' });
  },

  async fetchProductById(id) {
    return await request(`/api/products/${id}`, { method: 'GET' });
  },

  async createProduct(productData) {
    return await request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async updateProduct(id, productData) {
    return await request(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  async deleteProduct(id) {
    return await request(`/api/products/${id}`, {
      method: 'DELETE'
    });
  },

  async batchDelete(ids) {
    return await request('/api/products/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  },

  async initTable() {
    return await request('/api/products/init-table', {
      method: 'POST'
    });
  }
};
