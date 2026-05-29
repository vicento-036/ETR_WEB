import { buildApiUrl, getAuthHeaders } from './apiClient';
import { ENDPOINTS } from '../constants/endpoints';

export function fetchCurrentEmployee(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.currentEmployee), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}

export function fetchEmployees(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.employees), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}
