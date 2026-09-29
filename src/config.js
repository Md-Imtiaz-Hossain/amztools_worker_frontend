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

// Default backend worker URL (can be changed in the UI settings)
const DEFAULT_API_URL = typeof window !== 'undefined' && window.location && window.location.port === '8787'
  ? window.location.origin
  : 'http://127.0.0.1:8787';

export function getApiBaseUrl() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.API_BASE_URL) || DEFAULT_API_URL;
  }
  return DEFAULT_API_URL;
}

export function setApiBaseUrl(url) {
  const sanitized = url.replace(/\/+$/, '');
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.API_BASE_URL, sanitized);
  }
  return sanitized;
}

export { STORAGE_KEYS };
