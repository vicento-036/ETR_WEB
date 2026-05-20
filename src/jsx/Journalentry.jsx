import React, { useEffect, useMemo, useState } from 'react';
import { getToken } from '../services/authStorage';
import '../css/Journalentry.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const CURRENT_EMPLOYEE_ENDPOINT = '/api/employees/current';
const JOURNAL_DRAFT_STORAGE_KEY = 'etr.journalEntry.draft';
const JOURNAL_SEQUENCE_STORAGE_KEY = 'etr.journalEntry.sequence';
const JOURNAL_ENTRIES_STORAGE_KEY = 'etr.journalEntry.records';
const JOURNAL_ENTRIES_UPDATED_EVENT = 'etr-journal-entries-updated';

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

const MANAGER_PAGE_SIZE = 8;
const MAX_VISIBLE_PAGE_BUTTONS = 6;

const journalRows = [
  {
    id: 'JE-2026-00018',
    status: 'Pending',
    book: 'GENERAL',
    entryNumber: 'JE-2026-00018',
    entryDate: 'May 19, 2026',
    referenceNumber: 'JV-0519-018',
    referenceType: 'Adjustment',
    createdBy: 'etradmin',
    createdDate: 'May 19, 2026 08:12 AM',
    modifiedBy: 'etradmin',
    modifiedDate: 'May 19, 2026 08:18 AM',
    remarks: 'Month-end accrual adjustment',
    debitTotal: 12500,
    creditTotal: 12500,
  },
  {
    id: 'JE-2026-00017',
    status: 'Posted',
    book: 'GENERAL',
    entryNumber: 'JE-2026-00017',
    entryDate: 'May 18, 2026',
    referenceNumber: 'OR-20381',
    referenceType: 'Reclass',
    createdBy: 'finance01',
    createdDate: 'May 18, 2026 02:25 PM',
    modifiedBy: 'finance01',
    modifiedDate: 'May 18, 2026 03:02 PM',
    remarks: 'Bank charge reclassification',
    debitTotal: 2480,
    creditTotal: 2480,
  },
  {
    id: 'JE-2026-00016',
    status: 'Pending',
    book: 'MANUAL',
    entryNumber: 'JE-2026-00016',
    entryDate: 'May 17, 2026',
    referenceNumber: 'AP-14832',
    referenceType: 'Accrual',
    createdBy: 'acctg02',
    createdDate: 'May 17, 2026 10:44 AM',
    modifiedBy: 'acctg02',
    modifiedDate: 'May 17, 2026 11:01 AM',
    remarks: 'Utilities accrual',
    debitTotal: 8300,
    creditTotal: 7600,
  },
  {
    id: 'JE-2026-00015',
    status: 'Posted',
    book: 'ADJUSTING',
    entryNumber: 'JE-2026-00015',
    entryDate: 'May 16, 2026',
    referenceNumber: 'JV-0516-015',
    referenceType: 'Manual Voucher',
    createdBy: 'finance01',
    createdDate: 'May 16, 2026 04:10 PM',
    modifiedBy: 'finance01',
    modifiedDate: 'May 16, 2026 04:32 PM',
    remarks: 'Depreciation adjustment',
    debitTotal: 18400,
    creditTotal: 18400,
  },
  {
    id: 'JE-2026-00014',
    status: 'Pending',
    book: 'GENERAL',
    entryNumber: 'JE-2026-00014',
    entryDate: 'May 15, 2026',
    referenceNumber: 'JV-0515-014',
    referenceType: 'Accrual',
    createdBy: 'acctg02',
    createdDate: 'May 15, 2026 01:25 PM',
    modifiedBy: 'acctg02',
    modifiedDate: 'May 15, 2026 01:46 PM',
    remarks: 'Freight accrual',
    debitTotal: 6900,
    creditTotal: 6900,
  },
  {
    id: 'JE-2026-00013',
    status: 'Posted',
    book: 'GENERAL',
    entryNumber: 'JE-2026-00013',
    entryDate: 'May 14, 2026',
    referenceNumber: 'OR-20302',
    referenceType: 'Reclass',
    createdBy: 'etradmin',
    createdDate: 'May 14, 2026 09:50 AM',
    modifiedBy: 'etradmin',
    modifiedDate: 'May 14, 2026 10:04 AM',
    remarks: 'Collection clearing reclass',
    debitTotal: 31250,
    creditTotal: 31250,
  },
  {
    id: 'JE-2026-00012',
    status: 'Cancelled',
    book: 'MANUAL',
    entryNumber: 'JE-2026-00012',
    entryDate: 'May 13, 2026',
    referenceNumber: 'AP-14790',
    referenceType: 'Adjustment',
    createdBy: 'acctg03',
    createdDate: 'May 13, 2026 03:18 PM',
    modifiedBy: 'acctg03',
    modifiedDate: 'May 13, 2026 03:20 PM',
    remarks: 'Supplier balance adjustment',
    debitTotal: 5450,
    creditTotal: 5000,
  },
  {
    id: 'JE-2026-00011',
    status: 'Posted',
    book: 'ADJUSTING',
    entryNumber: 'JE-2026-00011',
    entryDate: 'May 12, 2026',
    referenceNumber: 'JV-0512-011',
    referenceType: 'Manual Voucher',
    createdBy: 'finance01',
    createdDate: 'May 12, 2026 11:08 AM',
    modifiedBy: 'finance01',
    modifiedDate: 'May 12, 2026 11:32 AM',
    remarks: 'Inventory variance correction',
    debitTotal: 9210,
    creditTotal: 9210,
  },
  {
    id: 'JE-2026-00010',
    status: 'Pending',
    book: 'GENERAL',
    entryNumber: 'JE-2026-00010',
    entryDate: 'May 11, 2026',
    referenceNumber: 'JV-0511-010',
    referenceType: 'Accrual',
    createdBy: 'acctg02',
    createdDate: 'May 11, 2026 05:41 PM',
    modifiedBy: 'acctg02',
    modifiedDate: 'May 11, 2026 05:55 PM',
    remarks: 'Professional fees accrual',
    debitTotal: 15000,
    creditTotal: 15000,
  },
];

function createBlankJournalLine(id = Date.now()) {
  return {
    id,
    selected: false,
    accountCode: '',
    accountTitle: '',
    subsidiary: '',
    costCenter: '',
    debit: '',
    credit: '',
    remarks: '',
  };
}

function createDefaultJournalLines() {
  const baseId = Date.now();

  return [
    createBlankJournalLine(baseId),
    createBlankJournalLine(baseId + 1),
  ];
}

function createDefaultJournalHeader() {
  return {
    status: '',
    transactionNo: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    ledgerBook: 'GENERAL',
    referenceType: 'Adjustment',
    referenceNo: '',
    company: 'ETR Integrated Systems',
    remarks: '',
  };
}

function createDefaultAuditTrail() {
  return {
    created: null,
    modified: null,
    postedCancelled: null,
  };
}

export function clearJournalDraftStorage() {
  window.localStorage?.removeItem(JOURNAL_DRAFT_STORAGE_KEY);
}

const managerColumns = [
  { key: 'status', label: 'Status' },
  { key: 'book', label: 'Book' },
  { key: 'entryNumber', label: 'Entry Number' },
  { key: 'entryDate', label: 'Entry Date' },
  { key: 'referenceNumber', label: 'Reference No.' },
  { key: 'referenceType', label: 'Type' },
  { key: 'debitTotal', label: 'Debit', numeric: true },
  { key: 'creditTotal', label: 'Credit', numeric: true },
  { key: 'remarks', label: 'Remarks' },
];

const lineColumns = [
  { key: 'accountCode', label: 'Account Code' },
  { key: 'accountTitle', label: 'Account Title' },
  { key: 'subsidiary', label: 'Subsidiary' },
  { key: 'costCenter', label: 'Cost Center' },
  { key: 'debit', label: 'Debit', numeric: true },
  { key: 'credit', label: 'Credit', numeric: true },
  { key: 'remarks', label: 'Remarks' },
];

function parseAmount(value) {
  const amount = Number(String(value || '').replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeJournalStatus(status) {
  const normalized = String(status || '').trim();

  if (normalized === 'Draft') {
    return 'Pending';
  }

  if (normalized === 'Pending' || normalized === 'Posted' || normalized === 'Cancelled') {
    return normalized;
  }

  return '';
}

function getStatusClass(status) {
  if (status === 'Unsaved') {
    return 'is-unsaved';
  }

  const normalized = normalizeJournalStatus(status);

  if (!normalized) {
    return 'is-unsaved';
  }

  return `is-${normalized.toLowerCase()}`;
}

function getJournalSortValue(row, column) {
  if (column.numeric) {
    return Number(row[column.key] || 0);
  }

  if (column.key === 'entryDate') {
    return new Date(row.entryDate).getTime() || 0;
  }

  return String(row[column.key] || '').toLowerCase();
}

function getVisiblePages(currentPage, totalPages) {
  const visibleCount = Math.min(MAX_VISIBLE_PAGE_BUTTONS, totalPages);
  const half = Math.floor(visibleCount / 2);
  const start = Math.max(1, Math.min(currentPage - half, totalPages - visibleCount + 1));

  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

function getUserField(user, fieldNames) {
  if (!user) {
    return '';
  }

  for (const fieldName of fieldNames) {
    const value = user[fieldName];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function isPlaceholderAuditName(name) {
  return /^etr\s+etr$|^etr,\s*etr$/i.test(String(name || '').trim());
}

function getAuditEmployeeName(user) {
  if (!user) {
    return 'Executive Service Account';
  }

  const employeeName = getUserField(user, [
    'employeeName',
    'EmployeeName',
    'fullName',
    'full_name',
    'FullName',
    'name',
    'displayName',
    'Name',
  ]);

  if (employeeName && !isPlaceholderAuditName(employeeName)) {
    return employeeName;
  }

  const lastName = getUserField(user, ['lastName', 'lastname', 'LastName', 'LASTNAME']);
  const firstName = getUserField(user, ['firstName', 'firstname', 'FirstName', 'FIRSTNAME']);
  const middleName = getUserField(user, ['middleName', 'middlename', 'MiddleName', 'MIDDLENAME']);

  if (lastName && firstName) {
    const composed = [lastName, [firstName, middleName].filter(Boolean).join(' ')].filter(Boolean).join(', ');

    if (!isPlaceholderAuditName(composed)) {
      return composed;
    }
  }

  return getUserField(user, ['username', 'Username']) || 'Executive Service Account';
}

function formatAuditDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const datePart = date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return `${datePart} ${timePart}`;
}

function formatAuditStamp(name, value) {
  const displayName = String(name || '').trim();
  const displayDate = formatAuditDateTime(value);

  if (!displayName && !displayDate) {
    return '-';
  }

  if (!displayDate) {
    return displayName;
  }

  return `${displayName}\n${displayDate}`;
}

function formatAuditStampFromRecord(record) {
  if (!record?.name || !record?.at) {
    return '-';
  }

  return formatAuditStamp(record.name, record.at);
}

function resolveAuditStamp(record, fallbackName, fallbackDate) {
  if (record?.name && record?.at) {
    return formatAuditStamp(record.name, record.at);
  }

  if (fallbackName) {
    return formatAuditStamp(fallbackName, fallbackDate);
  }

  return '-';
}

function loadSavedJournalEntries() {
  try {
    const rawEntries = window.localStorage?.getItem(JOURNAL_ENTRIES_STORAGE_KEY);

    if (!rawEntries) {
      return [];
    }

    const entries = JSON.parse(rawEntries);

    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.map((entry) => ({
      ...entry,
      status: normalizeJournalStatus(entry.status),
    }));
  } catch {
    return [];
  }
}

function loadJournalEntries() {
  const savedEntries = loadSavedJournalEntries();
  const savedIds = new Set(savedEntries.map((entry) => entry.id));

  return [
    ...savedEntries,
    ...journalRows.filter((entry) => !savedIds.has(entry.id)),
  ];
}

function saveSavedJournalEntries(entries) {
  window.localStorage?.setItem(JOURNAL_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
}

function notifyJournalEntriesUpdated() {
  window.dispatchEvent(new Event(JOURNAL_ENTRIES_UPDATED_EVENT));
}

function buildManagerRowFromEntry({ header, lines, transactionNo }) {
  const debit = lines.reduce((sum, line) => sum + parseAmount(line.debit), 0);
  const credit = lines.reduce((sum, line) => sum + parseAmount(line.credit), 0);

  return {
    id: transactionNo,
    status: normalizeJournalStatus(header.status),
    book: header.ledgerBook,
    entryNumber: transactionNo,
    entryDate: formatDisplayDate(header.transactionDate),
    referenceNumber: header.referenceNo,
    referenceType: header.referenceType,
    remarks: header.remarks,
    debitTotal: debit,
    creditTotal: credit,
  };
}

function upsertJournalEntry(row) {
  const savedEntries = loadSavedJournalEntries();
  const nextEntries = [
    row,
    ...savedEntries.filter((entry) => entry.id !== row.id),
  ];

  saveSavedJournalEntries(nextEntries);
  notifyJournalEntriesUpdated();
}

function getNextJournalSequence() {
  const storage = typeof window !== 'undefined' ? window.localStorage : null;
  const current = Number(storage?.getItem(JOURNAL_SEQUENCE_STORAGE_KEY) || '0');
  const next = current + 1;

  storage?.setItem(JOURNAL_SEQUENCE_STORAGE_KEY, String(next));

  return next;
}

function generateJournalTransactionNo(transactionDate) {
  const date = transactionDate ? new Date(transactionDate) : new Date();
  const stamp = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = stamp.getFullYear();
  const month = String(stamp.getMonth() + 1).padStart(2, '0');
  const day = String(stamp.getDate()).padStart(2, '0');
  const sequence = String(getNextJournalSequence()).padStart(4, '0');

  return `JE-${year}-${month}${day}-${sequence}`;
}

function formatDisplayDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function validateJournalEntry(header, lines, { requireBalanced = false } = {}) {
  const errors = [];

  if (!header.transactionDate) {
    errors.push('Transaction date is required.');
  }

  if (!String(header.referenceNo || '').trim()) {
    errors.push('Reference no. is required.');
  }

  if (!String(header.company || '').trim()) {
    errors.push('Company is required.');
  }

  const activeLines = lines.filter((line) => (
    String(line.accountCode || '').trim() || String(line.accountTitle || '').trim()
  ));

  if (activeLines.length === 0) {
    errors.push('Add at least one journal line with an account.');
  }

  activeLines.forEach((line, index) => {
    const debit = parseAmount(line.debit);
    const credit = parseAmount(line.credit);

    if (debit > 0 && credit > 0) {
      errors.push(`Line ${index + 1}: enter either debit or credit, not both.`);
    }

    if (debit <= 0 && credit <= 0) {
      errors.push(`Line ${index + 1}: enter a debit or credit amount.`);
    }
  });

  if (requireBalanced) {
    const debit = lines.reduce((sum, line) => sum + parseAmount(line.debit), 0);
    const credit = lines.reduce((sum, line) => sum + parseAmount(line.credit), 0);

    if (Math.abs(debit - credit) >= 0.01) {
      errors.push('Debit and credit totals must match before posting.');
    }
  }

  return errors;
}

function printJournalVoucher({ header, lines, totals, auditTrail, auditUserName }) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');

  if (!printWindow) {
    throw new Error('Pop-up blocked. Allow pop-ups to print the voucher.');
  }

  const lineRows = lines
    .filter((line) => line.accountCode || line.accountTitle)
    .map((line) => `
      <tr>
        <td>${line.accountCode || '-'}</td>
        <td>${line.accountTitle || '-'}</td>
        <td>${line.subsidiary || '-'}</td>
        <td>${line.costCenter || '-'}</td>
        <td class="num">${line.debit ? formatMoney(parseAmount(line.debit)) : ''}</td>
        <td class="num">${line.credit ? formatMoney(parseAmount(line.credit)) : ''}</td>
        <td>${line.remarks || ''}</td>
      </tr>
    `)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Journal Voucher ${header.transactionNo || 'Draft'}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #12314e; margin: 24px; }
      h1 { margin: 0 0 6px; font-size: 20px; }
      .meta { margin-bottom: 18px; font-size: 12px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #b7c9dc; padding: 8px; text-align: left; }
      th { background: #eaf4fd; text-transform: uppercase; font-size: 11px; }
      .num { text-align: right; }
      .totals { margin-top: 14px; display: grid; gap: 6px; max-width: 280px; margin-left: auto; }
      .totals div { display: flex; justify-content: space-between; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>Journal Voucher</h1>
    <div class="meta">
      <div><strong>Transaction No.:</strong> ${header.transactionNo || 'Draft'}</div>
      <div><strong>Date:</strong> ${formatDisplayDate(header.transactionDate)}</div>
      <div><strong>Ledger Book:</strong> ${header.ledgerBook}</div>
      <div><strong>Reference:</strong> ${header.referenceType} / ${header.referenceNo}</div>
      <div><strong>Company:</strong> ${header.company}</div>
      <div><strong>Status:</strong> ${header.status}</div>
      <div><strong>Prepared by:</strong> ${auditUserName}</div>
      <div><strong>Posted by:</strong> ${auditTrail.postedCancelled?.name || '-'}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Account Code</th>
          <th>Account Title</th>
          <th>Subsidiary</th>
          <th>Cost Center</th>
          <th>Debit</th>
          <th>Credit</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows || '<tr><td colspan="7">No journal lines</td></tr>'}
      </tbody>
    </table>
    <div class="totals">
      <div><span>Debit Total</span><span>${formatMoney(totals.debit)}</span></div>
      <div><span>Credit Total</span><span>${formatMoney(totals.credit)}</span></div>
      <div><span>Variance</span><span>${formatMoney(totals.variance)}</span></div>
    </div>
    <p style="margin-top:18px;font-size:12px;">${header.remarks || ''}</p>
  </body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function JournalMetric({ label, value, tone = '' }) {
  return (
    <div className={`etr-journal-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function JournalEntryManagerView({ onNewEntry }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'entryDate', direction: 'desc' });
  const [entryRows, setEntryRows] = useState(() => loadJournalEntries());

  useEffect(() => {
    const refreshRows = () => {
      setEntryRows(loadJournalEntries());
    };

    refreshRows();
    window.addEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, refreshRows);

    return () => {
      window.removeEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, refreshRows);
    };
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return entryRows;
    }

    return entryRows.filter((row) => (
      managerColumns.some((column) => String(row[column.key] || '').toLowerCase().includes(normalizedQuery))
    ));
  }, [entryRows, query]);

  const sortedRows = useMemo(() => {
    const column = managerColumns.find((item) => item.key === sortConfig.key);

    if (!column) {
      return filteredRows;
    }

    return [...filteredRows].sort((first, second) => {
      const firstValue = getJournalSortValue(first, column);
      const secondValue = getJournalSortValue(second, column);

      if (firstValue < secondValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (firstValue > secondValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [filteredRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / MANAGER_PAGE_SIZE));
  const visiblePages = getVisiblePages(page, totalPages);
  const pagedRows = sortedRows.slice((page - 1) * MANAGER_PAGE_SIZE, page * MANAGER_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const handleSort = (columnKey) => {
    setSortConfig((current) => ({
      key: columnKey,
      direction: current.key === columnKey && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="etr-journal-entry etr-journal-manager">
      <div className="etr-journal-toolbar">
        <div>
          <p className="etr-journal-kicker">Finance</p>
          <h1>Journal Manager</h1>
          <span>Review, search, and monitor journal vouchers before posting.</span>
        </div>

        <div className="etr-journal-actions">
          <button type="button" className="is-primary" onClick={onNewEntry}>New Journal Entry</button>
        </div>
      </div>

      <section className="etr-journal-panel etr-journal-manager-panel">
        <div className="etr-journal-panel-head">
          <div>
            <h2>Journal Entries</h2>
            <span>{sortedRows.length} record{sortedRows.length === 1 ? '' : 's'} found</span>
          </div>

          <label className="etr-journal-search">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Entry no, reference, book, or status"
            />
          </label>
        </div>

        <div className="etr-journal-table-wrap">
          <table className="etr-journal-table">
            <thead>
              <tr>
                {managerColumns.map((column) => (
                  <th
                    key={column.key}
                    aria-sort={sortConfig.key === column.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      className={`etr-journal-sort-button ${sortConfig.key === column.key ? 'is-active' : ''}`}
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <span className={`etr-journal-sort-indicator ${sortConfig.key === column.key ? `is-${sortConfig.direction}` : ''}`} aria-hidden="true" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={managerColumns.length}>No journal entries found.</td>
                </tr>
              ) : null}

              {pagedRows.map((row) => (
                <tr key={row.id}>
                  {managerColumns.map((column) => (
                    <td key={column.key} className={column.numeric ? 'is-number' : ''}>
                      {column.key === 'status' ? (
                        <span className={`etr-journal-status ${getStatusClass(row.status)}`}>{row.status}</span>
                      ) : column.numeric ? formatMoney(row[column.key]) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedRows.length > 0 ? (
          <div className="etr-journal-pagination" aria-label="Journal manager pagination">
            <span>
              Showing {(page - 1) * MANAGER_PAGE_SIZE + 1}-{Math.min(page * MANAGER_PAGE_SIZE, sortedRows.length)} of {sortedRows.length}
            </span>
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              Previous
            </button>
            <div className="etr-journal-page-numbers">
              {visiblePages.map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className={pageNumber === page ? 'is-active' : ''}
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function JournalEntryView({ user, onSaved }) {
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [auditTrail, setAuditTrail] = useState(createDefaultAuditTrail);
  const [previewAuditAt] = useState(() => new Date());
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [header, setHeader] = useState(createDefaultJournalHeader);
  const [lines, setLines] = useState(createDefaultJournalLines);

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadCurrentEmployee = async () => {
      try {
        const response = await fetch(buildApiUrl(CURRENT_EMPLOYEE_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          return;
        }

        const employee = data?.employee || data?.data || data;

        if (employee && typeof employee === 'object') {
          setEmployeeInfo(employee);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setEmployeeInfo(null);
        }
      }
    };

    loadCurrentEmployee();

    return () => controller.abort();
  }, []);

  const auditUserName = getAuditEmployeeName(employeeInfo || user);
  const createdAuditStamp = resolveAuditStamp(auditTrail.created, auditUserName, previewAuditAt);
  const modifiedAuditStamp = resolveAuditStamp(auditTrail.modified, auditUserName, previewAuditAt);
  const postedCancelledAuditStamp = formatAuditStampFromRecord(auditTrail.postedCancelled);

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + parseAmount(line.debit), 0);
    const credit = lines.reduce((sum, line) => sum + parseAmount(line.credit), 0);

    return {
      debit,
      credit,
      variance: debit - credit,
    };
  }, [lines]);

  const isBalanced = Math.abs(totals.variance) < 0.01;
  const varianceLabel = formatMoney(Math.abs(totals.variance));
  const signedVarianceLabel = totals.variance < 0 ? `-${varianceLabel}` : varianceLabel;
  const normalizedStatus = normalizeJournalStatus(header.status);
  const displayStatus = header.transactionNo ? (normalizedStatus || 'Pending') : 'Unsaved';
  const isPosted = normalizedStatus === 'Posted';
  const isCancelled = normalizedStatus === 'Cancelled';
  const isLocked = isPosted || isCancelled;

  const clearActionFeedback = () => {
    setActionMessage('');
    setActionError('');
  };

  const handleSaveDraft = async () => {
    clearActionFeedback();

    const validationErrors = validateJournalEntry(header, lines);

    if (validationErrors.length > 0) {
      setActionError(validationErrors.join(' '));
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 350);
      });

      const transactionNo = header.transactionNo.trim() || generateJournalTransactionNo(header.transactionDate);
      const nextHeader = {
        ...header,
        status: 'Pending',
        transactionNo,
      };

      upsertJournalEntry(buildManagerRowFromEntry({ header: nextHeader, lines, transactionNo }));
      clearJournalDraftStorage();
      onSaved?.();
    } catch (error) {
      setActionError(error.message || 'Unable to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostToLedger = async () => {
    clearActionFeedback();

    if (isPosted) {
      setActionError('This journal entry is already posted.');
      return;
    }

    if (isCancelled) {
      setActionError('This journal entry is cancelled and cannot be posted.');
      return;
    }

    const validationErrors = validateJournalEntry(header, lines, { requireBalanced: true });

    if (validationErrors.length > 0) {
      setActionError(validationErrors.join(' '));
      return;
    }

    const confirmed = window.confirm('Post this journal entry to the ledger?');

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 350);
      });

      const transactionNo = header.transactionNo.trim() || generateJournalTransactionNo(header.transactionDate);
      const nextHeader = {
        ...header,
        status: 'Posted',
        transactionNo,
      };

      upsertJournalEntry(buildManagerRowFromEntry({ header: nextHeader, lines, transactionNo }));
      clearJournalDraftStorage();
      onSaved?.();
    } catch (error) {
      setActionError(error.message || 'Unable to post journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintVoucher = () => {
    clearActionFeedback();

    const validationErrors = validateJournalEntry(header, lines);

    if (validationErrors.length > 0) {
      setActionError(validationErrors.join(' '));
      return;
    }

    try {
      printJournalVoucher({
        header,
        lines,
        totals,
        auditTrail,
        auditUserName,
      });
      setActionMessage(header.transactionNo
        ? `Print preview opened for ${header.transactionNo}.`
        : 'Print preview opened for unsaved draft voucher.');
    } catch (error) {
      setActionError(error.message || 'Unable to print voucher.');
    }
  };

  const updateHeader = (field, value) => {
    setHeader((current) => ({ ...current, [field]: value }));
  };

  const updateLine = (lineId, field, value) => {
    setLines((current) => (
      current.map((line) => (line.id === lineId ? { ...line, [field]: value } : line))
    ));
  };

  const addLine = () => {
    setLines((current) => [
      ...current,
      {
        id: Date.now(),
        selected: false,
        accountCode: '',
        accountTitle: '',
        subsidiary: '',
        costCenter: '',
        debit: '',
        credit: '',
        remarks: '',
      },
    ]);
  };

  const deleteSelected = () => {
    setLines((current) => {
      const next = current.filter((line) => !line.selected);
      return next.length > 0 ? next : current;
    });
  };

  return (
    <div className="etr-journal-entry">
      <div className="etr-journal-toolbar">
        <div>
          <p className="etr-journal-kicker">Finance</p>
          <h1>Journal Entry</h1>
          <span>Prepare balanced debit and credit lines for ledger posting.</span>
        </div>

        <div className="etr-journal-actions">
          <button
            type="button"
            className="is-primary"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isLocked}
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handlePostToLedger}
            disabled={isSubmitting || isLocked || !isBalanced}
            title={!isBalanced ? 'Debit and credit must balance before posting' : undefined}
          >
            {isSubmitting ? 'Posting...' : 'Post to Ledger'}
          </button>
          <button type="button" onClick={handlePrintVoucher} disabled={isSubmitting}>
            Print Voucher
          </button>
        </div>
      </div>

      {actionMessage ? React.createElement('div', { className: 'etr-journal-action-message' }, actionMessage) : null}
      {actionError ? React.createElement('div', { className: 'etr-journal-action-message is-error' }, actionError) : null}

      <div className="etr-journal-form-shell">
        <div className="etr-journal-content-column">
          <div className="etr-journal-main-stack">
            <div className="etr-journal-column">
              <section className="etr-journal-card">
                <div className="etr-journal-card-head">
                  <h2>General Info</h2>
                  <span>Voucher header</span>
                </div>

                <div className="etr-journal-form-grid two">
                  <label className="etr-journal-field">
                    <span>Transaction No.</span>
                    <input value={header.transactionNo} onChange={(event) => updateHeader('transactionNo', event.target.value)} placeholder="Generated on save" />
                  </label>
                  <label className="etr-journal-field">
                    <span>Transaction Date</span>
                    <input type="date" value={header.transactionDate} onChange={(event) => updateHeader('transactionDate', event.target.value)} />
                  </label>
                  <label className="etr-journal-field is-wide">
                    <span>Ledger Book</span>
                    <select value={header.ledgerBook} onChange={(event) => updateHeader('ledgerBook', event.target.value)}>
                      <option value="GENERAL">GENERAL</option>
                      <option value="MANUAL">MANUAL</option>
                      <option value="ADJUSTING">ADJUSTING</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="etr-journal-card">
                <div className="etr-journal-card-head">
                  <h2>Reference Info</h2>
                  <span>Source document and company</span>
                </div>

                <div className="etr-journal-form-grid two">
                  <label className="etr-journal-field">
                    <span>Reference Type</span>
                    <select value={header.referenceType} onChange={(event) => updateHeader('referenceType', event.target.value)}>
                      <option>Adjustment</option>
                      <option>Accrual</option>
                      <option>Reclass</option>
                      <option>Manual Voucher</option>
                    </select>
                  </label>
                  <label className="etr-journal-field">
                    <span>Reference No.</span>
                    <input value={header.referenceNo} onChange={(event) => updateHeader('referenceNo', event.target.value)} placeholder="Click to select" />
                  </label>
                  <label className="etr-journal-field is-wide">
                    <span>Company</span>
                    <input value={header.company} onChange={(event) => updateHeader('company', event.target.value)} />
                  </label>
                </div>
              </section>
            </div>

            <div className="etr-journal-column etr-journal-column-narrow">
              <section className="etr-journal-card">
                <div className="etr-journal-card-head">
                  <h2>Audit</h2>
                  <span>User trail and cancellation</span>
                </div>
                <div className="etr-journal-audit-grid">
                  <label className="etr-journal-field">
                    <span>Created By</span>
                    <textarea value={createdAuditStamp} rows={2} readOnly />
                  </label>
                  <label className="etr-journal-field">
                    <span>Last Modified By</span>
                    <textarea value={modifiedAuditStamp} rows={2} readOnly />
                  </label>
                  <label className="etr-journal-field">
                    <span>Posted/Cancelled By</span>
                    <textarea value={postedCancelledAuditStamp} rows={2} readOnly />
                  </label>
                  <label className="etr-journal-field">
                    <span>Cancellation Remarks</span>
                    <textarea rows={3} placeholder="No cancellation remarks" />
                  </label>
                </div>
              </section>
            </div>
          </div>

        </div>

        <aside className="etr-journal-side-stack">
          <section className={`etr-journal-card etr-journal-status-card ${getStatusClass(displayStatus)}`}>
            <div className="etr-journal-status-card-body">
              <div className="etr-journal-status-copy">
                <strong>Status</strong>
                <small>Current posting state</small>
              </div>
              <span className={`etr-journal-status-pill ${getStatusClass(displayStatus)}`}>{displayStatus}</span>
            </div>
          </section>

          <section className="etr-journal-card etr-journal-amount-card">
            <div className="etr-journal-card-head">
              <h2>Amount</h2>
              <span>Auto-computed totals</span>
            </div>
            <dl className="etr-journal-amount-metrics">
              <div>
                <dt>Debit Total</dt>
                <dd>{formatMoney(totals.debit)}</dd>
              </div>
              <div>
                <dt>Credit Total</dt>
                <dd>{formatMoney(totals.credit)}</dd>
              </div>
              <div className={isBalanced ? 'is-balanced' : 'is-warning'}>
                <dt>Variance</dt>
                <dd>{signedVarianceLabel}</dd>
              </div>
            </dl>
            <div className={`etr-journal-balance-note ${isBalanced ? 'is-balanced' : 'is-warning'}`}>
              <strong>{isBalanced ? 'Balanced entry' : 'Out of balance'}</strong>
              <span>
                {isBalanced
                  ? 'Debit and credit totals match. Ready for posting review.'
                  : 'Adjust journal lines until variance returns to zero.'}
              </span>
            </div>
          </section>

        </aside>

        <section className="etr-journal-table-panel">
          <div className="etr-journal-card-head etr-journal-table-head">
            <div>
              <h2>Journal Details</h2>
              <span>{lines.length} line{lines.length === 1 ? '' : 's'}</span>
            </div>
            <div className="etr-journal-line-actions">
              <button type="button" onClick={deleteSelected}>Delete Selected</button>
              <button type="button" onClick={addLine}>Add Line</button>
            </div>
          </div>

          <div className="etr-journal-lines-wrap">
            <table className="etr-journal-lines">
              <thead>
                <tr>
                  <th aria-label="Select row" />
                  {lineColumns.map((column) => <th key={column.key}>{column.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={line.selected}
                        onChange={(event) => updateLine(line.id, 'selected', event.target.checked)}
                        aria-label="Select journal line"
                      />
                    </td>
                    {lineColumns.map((column) => (
                      <td key={column.key} className={column.numeric ? 'is-number' : ''}>
                        <input
                          value={line[column.key]}
                          onChange={(event) => updateLine(line.id, column.key, event.target.value)}
                          inputMode={column.numeric ? 'decimal' : undefined}
                          aria-label={column.label}
                          placeholder={column.numeric ? '0.0000' : 'Click to select'}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="etr-journal-field etr-journal-details-remarks">
            <span>Remarks</span>
            <textarea value={header.remarks} onChange={(event) => updateHeader('remarks', event.target.value)} rows={3} />
          </label>
        </section>
      </div>
    </div>
  );
}

export default JournalEntryView;
