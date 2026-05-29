import { buildApiUrl, getAuthHeaders } from './apiClient';
import { ENDPOINTS } from '../constants/endpoints';

export function fetchCostUnits(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.costUnits), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}
