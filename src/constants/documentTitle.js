export const ETR_APP_DOCUMENT_TITLE = 'ETR INTEGRATED SYSTEM';

export function formatDashboardDocumentTitle(moduleLabel) {
  if (!moduleLabel) {
    return ETR_APP_DOCUMENT_TITLE;
  }

  return `${moduleLabel} – ${ETR_APP_DOCUMENT_TITLE}`;
}

export function formatLoginDocumentTitle() {
  return `Sign In – ${ETR_APP_DOCUMENT_TITLE}`;
}
