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
    // Session expired after 1 week
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

export function saveSession(token, user, expiresInSeconds = 7 * 24 * 60 * 60) {
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
