/**
 * Frontend Configuration & Constants
 */

const STORAGE_KEYS = {
  API_BASE_URL: 'amz_api_base_url',
  AUTH_TOKEN: 'amz_auth_token',
  AUTH_USER: 'amz_auth_user',
  AUTH_EXPIRY: 'amz_auth_expiry',
  VISIBLE_COLUMNS: 'amz_visible_columns',
  PAGE_SIZE: 'amz_page_size',
  DENSITY: 'amz_table_density'
};

// Known Production Cloudflare Worker Backend URL
export const PRODUCTION_BACKEND_URL = 'https://amztools-worker-backend.imtiaz15-11790.workers.dev';

/**
 * Automatically determine the correct backend URL based on environment
 */
export function getAutoApiUrl() {
  if (typeof window === 'undefined' || !window.location) {
    return PRODUCTION_BACKEND_URL;
  }

  const hostname = window.location.hostname;

  // 1. If running locally
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // If backend and frontend run on same port
    if (window.location.port === '8787') {
      return window.location.origin;
    }
    // Default local worker port or fallback to production if local is not running
    return 'http://127.0.0.1:8787';
  }

  // 2. If running on Cloudflare workers.dev or pages.dev
  if (hostname.includes('workers.dev') || hostname.includes('pages.dev')) {
    // If hostname matches amztools-worker-frontend.* -> amztools-worker-backend.*
    if (hostname.includes('worker-frontend')) {
      return `https://${hostname.replace('worker-frontend', 'worker-backend')}`;
    }
    return PRODUCTION_BACKEND_URL;
  }

  // Default to production backend
  return PRODUCTION_BACKEND_URL;
}

export function getApiBaseUrl() {
  const autoUrl = getAutoApiUrl();

  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.API_BASE_URL);
    if (saved && saved.trim() !== '') {
      // If user is on an HTTPS page, but saved URL is insecure HTTP (like http://127.0.0.1),
      // ignore it to prevent Mixed Content security blocking in modern browsers
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:' && saved.startsWith('http://')) {
        localStorage.removeItem(STORAGE_KEYS.API_BASE_URL);
        return autoUrl;
      }
      return saved.replace(/\/+$/, '');
    }
  }

  return autoUrl;
}

export function setApiBaseUrl(url) {
  const sanitized = url.replace(/\/+$/, '');
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.API_BASE_URL, sanitized);
  }
  return sanitized;
}

export { STORAGE_KEYS };
