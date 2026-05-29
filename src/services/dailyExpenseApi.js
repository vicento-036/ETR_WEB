import { buildApiUrl, getAuthHeaders } from './apiClient';
import { ENDPOINTS } from '../constants/endpoints';

export function fetchDailyExpenses(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.dailyExpense), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}

export function fetchDailyExpenseById(expenseId, options = {}) {
  return fetch(buildApiUrl(`${ENDPOINTS.dailyExpense}/${expenseId}`), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}
