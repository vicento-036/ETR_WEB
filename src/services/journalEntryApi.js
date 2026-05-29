import { buildApiUrl, getAuthHeaders } from './apiClient';
import { ENDPOINTS } from '../constants/endpoints';

export function fetchJournalEntries(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.journalEntry), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}

export function fetchJournalEntryPermissions(options = {}) {
  return fetch(buildApiUrl(ENDPOINTS.journalEntryPermissions), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}

export function fetchJournalEntryById(journalEntryId, options = {}) {
  return fetch(buildApiUrl(`${ENDPOINTS.journalEntry}/${journalEntryId}`), {
    ...options,
    headers: getAuthHeaders(options.headers),
  });
}
