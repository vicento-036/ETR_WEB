import { buildApiUrl, getAuthHeaders } from './apiClient';
import { ENDPOINTS } from '../constants/endpoints';

export async function logoutUser() {
  return fetch(buildApiUrl(ENDPOINTS.logout), {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}
