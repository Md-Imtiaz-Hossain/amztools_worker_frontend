import { STORAGE_KEYS } from './config.js';

const authListeners = [];

export function subscribeAuth(listener) {
  authListeners.push(listener);
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

function notifyAuth() {
  const status = getAuthStatus();
  authListeners.forEach(fn => fn(status));
}

export function getAuthStatus() {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const expiry = localStorage.getItem(STORAGE_KEYS.AUTH_EXPIRY);
  const userJson = localStorage.getItem(STORAGE_KEYS.AUTH_USER);

  if (!token || !expiry) {
    return { isAuthenticated: false, user: null, token: null };
  }

  const expiryTimestamp = parseInt(expiry, 10);
  if (isNaN(expiryTimestamp) || Date.now() > expiryTimestamp) {
    // Session expired after 1 month
    clearSession();
    return { isAuthenticated: false, user: null, token: null };
  }

  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    user = null;
  }

  return { isAuthenticated: true, user, token };
}

// 1 month session default (30 days = 2,592,000 seconds)
export const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60;

export function saveSession(token, user, expiresInSeconds = ONE_MONTH_SECONDS) {
  const expiryTimestamp = Date.now() + (expiresInSeconds * 1000);
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.AUTH_EXPIRY, String(expiryTimestamp));
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  }
  notifyAuth();
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.AUTH_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  notifyAuth();
}

/**
 * Role & Permission Helpers based on backend configuration:
 * - Super admin: Access everything (product CRUD, user management, create new users)
 * - admin: Restrict only create new user, permit everything else (product CRUD, editing, deleting)
 * - customer: Like guest user, only read data (read-only: cannot create/edit/delete products)
 */

export function normalizeRole(role) {
  if (!role || typeof role !== 'string') return '';
  const clean = role.trim().toLowerCase().replace(/[-_]/g, ' ');
  if (clean === 'super admin' || clean === 'superadmin') return 'Super admin';
  if (clean === 'admin') return 'admin';
  if (clean === 'customer' || clean === 'guest') return 'customer';
  return role.trim();
}

export function isSuperAdmin(user) {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === 'Super admin';
}

export function isAdmin(user) {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === 'admin';
}

export function isCustomer(user) {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === 'customer';
}

export function canWriteProducts(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  // Super admin and admin can create/edit/delete products; customer has read-only access
  return role === 'Super admin' || role === 'admin';
}

export function canCreateUsers(user) {
  if (!user) return false;
  // SuperAdmin: Access everything (can create new users)
  // Admin: Restrict only create new user
  // Customer: Read-only
  return isSuperAdmin(user);
}
