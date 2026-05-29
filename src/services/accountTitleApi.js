import { buildApiUrl, getAuthHeaders } from './apiClient';
import { ENDPOINTS } from '../constants/endpoints';

export function fetchAccountTitles(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.accountTitles), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}

export function fetchAccountTitlePermissions(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.accountTitlePermissions), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}
