const ACCESS_TOKEN_KEY = 'etris.accessToken';
const USER_KEY = 'etris.user';
const EXPIRES_AT_KEY = 'etris.expiresAt';

export function saveAuth(data) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken ?? '');
  sessionStorage.setItem(USER_KEY, JSON.stringify(data.user ?? null));
  sessionStorage.setItem(EXPIRES_AT_KEY, data.expiresAt ?? '');
}

export function getToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getUser() {
  const rawUser = sessionStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    clearAuth();
    return null;
  }
}

export function getExpiresAt() {
  return sessionStorage.getItem(EXPIRES_AT_KEY);
}

export function isTokenExpired() {
  const expiresAt = getExpiresAt();

  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

export function clearAuth() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(EXPIRES_AT_KEY);
}