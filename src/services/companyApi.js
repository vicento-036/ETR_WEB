import { buildApiUrl, getAuthHeaders } from './apiClient';
import { ENDPOINTS } from '../constants/endpoints';

export function searchCompanies(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.companiesSearch), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}
