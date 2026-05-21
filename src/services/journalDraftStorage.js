const JOURNAL_DRAFT_STORAGE_KEY = 'etr.journalEntry.draft';
const storage = typeof window !== 'undefined' ? window.localStorage : null;

export function clearJournalDraftStorage() {
  storage?.removeItem(JOURNAL_DRAFT_STORAGE_KEY);
}
