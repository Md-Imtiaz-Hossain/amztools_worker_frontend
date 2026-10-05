/**
 * Frontend Configuration & Constants
 */

const STORAGE_KEYS = {
  API_BASE_URL: 'amz_api_base_url',
  DEMO_MODE: 'amz_demo_mode',
  AUTH_TOKEN: 'amz_auth_token',
  AUTH_USER: 'amz_auth_user',
  AUTH_EXPIRY: 'amz_auth_expiry',
  VISIBLE_COLUMNS: 'amz_visible_columns',
  PAGE_SIZE: 'amz_page_size',
  DENSITY: 'amz_table_density'
};

// Known Production Cloudflare Worker Backend URL
export const PRODUCTION_BACKEND_URL = 'https://amztools-worker-backend.imtiaz15-11790.workers.dev';
export const LOCAL_BACKEND_URL = 'http://127.0.0.1:8787';

/**
 * Automatically determine the correct backend URL based on environment
 */
export function getAutoApiUrl() {
  if (typeof window === 'undefined' || !window.location) {
    return PRODUCTION_BACKEND_URL;
  }

  const hostname = window.location.hostname;

  // 1. If running on Cloudflare workers.dev or pages.dev
  if (hostname.includes('workers.dev') || hostname.includes('pages.dev')) {
    // If hostname matches amztools-worker-frontend.* -> amztools-worker-backend.*
    if (hostname.includes('worker-frontend')) {
      return `https://${hostname.replace('worker-frontend', 'worker-backend')}`;
    }
    return PRODUCTION_BACKEND_URL;
  }

  // 2. If running locally on port 8787 (combined worker serving both frontend & backend)
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && window.location.port === '8787') {
    return window.location.origin;
  }

  // 3. For local development (e.g. running on localhost:3000), default to the live
  // Cloudflare production backend so all 34+ products from D1 appear immediately!
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

export function getSavedPageSize() {
  if (typeof localStorage !== 'undefined') {
    const saved = parseInt(localStorage.getItem(STORAGE_KEYS.PAGE_SIZE), 10);
    if (!isNaN(saved) && saved >= 1 && saved <= 100) {
      return saved;
    }
  }
  return 20; // Default 20 per page matching backend
}

export function setSavedPageSize(limit) {
  if (typeof localStorage !== 'undefined') {
    const val = parseInt(limit, 10);
    if (!isNaN(val) && val >= 1 && val <= 100) {
      localStorage.setItem(STORAGE_KEYS.PAGE_SIZE, String(val));
    }
  }
}

export function isDemoMode() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
  }
  return false;
}

export function setDemoMode(enabled) {
  if (typeof localStorage !== 'undefined') {
    if (enabled) {
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
    }
  }
}

export { STORAGE_KEYS };
