const ACCESS_TOKEN_KEY = 'etris.accessToken';
const USER_KEY = 'etris.user';
const EXPIRES_AT_KEY = 'etris.expiresAt';
const storage = typeof window !== 'undefined' ? window.localStorage : null;

export function saveAuth(data) {
  storage?.setItem(ACCESS_TOKEN_KEY, data.accessToken ?? '');
  storage?.setItem(USER_KEY, JSON.stringify(data.user ?? null));
  storage?.setItem(EXPIRES_AT_KEY, data.expiresAt ?? '');
}

export function getToken() {
  return storage?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getUser() {
  const rawUser = storage?.getItem(USER_KEY);

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
  return storage?.getItem(EXPIRES_AT_KEY) ?? null;
}

export function isTokenExpired() {
  const expiresAt = getExpiresAt();

  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

export function clearAuth() {
  storage?.removeItem(ACCESS_TOKEN_KEY);
  storage?.removeItem(USER_KEY);
  storage?.removeItem(EXPIRES_AT_KEY);
}
