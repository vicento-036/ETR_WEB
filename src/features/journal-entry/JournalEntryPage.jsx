import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getToken } from '../../services/authStorage';
import { clearJournalDraftStorage } from '../../services/journalDraftStorage';
import EmptyDropdown from '../../components/shared/EmptyDropdown.jsx';
import '../../styles/journal-entry.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const CURRENT_EMPLOYEE_ENDPOINT = '/api/employees/current';
const EMPLOYEES_ENDPOINT = '/api/employees';
const ACCOUNT_TITLES_ENDPOINT = '/api/accounttitles';
const COST_UNITS_ENDPOINT = '/api/costunits';
const SYSTEM_CLASSIFICATIONS_ENDPOINT = '/api/system-classifications/hierarchical';
const DAILY_EXPENSE_ENDPOINT = '/api/daily-expense';
const BOOK_OF_ACCOUNTS_ENDPOINT = '/api/bookofaccounts';
const COMPANY_SEARCH_ENDPOINT = '/api/companies/search';
const JOURNAL_ENTRY_ENDPOINT = '/api/journal-entry';
const JOURNAL_ENTRY_PERMISSIONS_ENDPOINT = '/api/journal-entry/permissions';
const JOURNAL_ENTRY_DAILY_EXPENSE_ENDPOINT = '/api/journal-entry/daily-expense';
const JOURNAL_SEQUENCE_STORAGE_KEY = 'etr.journalEntry.sequence';

const defaultJournalPermissions = {
  canCreate: false,
  canDelete: false,
  canEdit: false,
  canSearch: false,
  canApprove: false,
  canPost: false,
  canPrint: false,
};

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

const MANAGER_PAGE_SIZE = 8;
const MAX_VISIBLE_PAGE_BUTTONS = 6;

function createBlankJournalLine(id = Date.now()) {
  return {
    id,
    selected: false,
    accountTitleId: '',
    costUnitId: '',
    costCenterId: '',
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

function createNextJournalLineId(lines) {
  const highestLineId = lines.reduce((highest, line) => {
    const lineId = Number(line.id);
    return Number.isFinite(lineId) ? Math.max(highest, lineId) : highest;
  }, Date.now());

  return highestLineId + 1;
}

function createDefaultJournalHeader() {
  return {
    status: '',
    transactionNo: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    bookId: '',
    ledgerBook: '',
    referenceId: '',
    referenceType: '',
    referenceNo: '',
    company: '',
    companyId: '',
    companyAddress: '',
    companyTinNumber: '',
    cancellationRemarks: '',
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

const managerColumns = [
  { key: 'status', label: 'Status' },
  { key: 'book', label: 'Book' },
  { key: 'entryNumber', label: 'Entry Number' },
  { key: 'entryDate', label: 'Entry Date' },
  { key: 'referenceNumber', label: 'Reference Number' },
  { key: 'referenceType', label: 'Reference Type' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdDate', label: 'Created Date' },
  { key: 'lastModifiedBy', label: 'Last Modified By' },
  { key: 'lastModifiedDate', label: 'Last Modified Date' },
  { key: 'remarks', label: 'Remarks' },
];

const managerDetailColumns = [
  { key: 'accountCode', label: 'Account Code' },
  { key: 'accountDescription', label: 'Account Description' },
  { key: 'businessUnit', label: 'Business Unit' },
  { key: 'debit', label: 'Debit', numeric: true },
  { key: 'credit', label: 'Credit', numeric: true },
  { key: 'area', label: 'Area' },
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

function sanitizeAmountInput(value) {
  const normalizedValue = String(value || '').replace(/,/g, '');
  const [wholePart = '', ...decimalParts] = normalizedValue.split('.');
  const digitsOnlyWholePart = wholePart.replace(/\D/g, '');
  const digitsOnlyDecimalPart = decimalParts.join('').replace(/\D/g, '');

  return decimalParts.length > 0
    ? `${digitsOnlyWholePart}.${digitsOnlyDecimalPart}`
    : digitsOnlyWholePart;
}

function formatMoney(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getApiCollection(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.$values)) {
    return data.$values;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.employees)) {
    return data.employees;
  }

  if (Array.isArray(data?.employees?.$values)) {
    return data.employees.$values;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  return [];
}

function getPermissionBoolean(source, fieldNames, fallback = false) {
  for (const fieldName of fieldNames) {
    const value = source?.[fieldName];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase();

      if (['true', '1', 'yes', 'y'].includes(normalized)) {
        return true;
      }

      if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
      }
    }
  }

  return fallback;
}

function normalizePermissionKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getPermissionFromCollection(source, aliases, fallback = false) {
  const rows = Array.isArray(source) ? source : getApiCollection(source);
  const normalizedAliases = aliases.map(normalizePermissionKey).filter(Boolean);

  for (const row of rows) {
    if (typeof row === 'string') {
      const normalizedRow = normalizePermissionKey(row);

      if (normalizedAliases.some((alias) => normalizedRow.includes(alias))) {
        return true;
      }

      continue;
    }

    const permissionName = getField(row, [
      'permission',
      'Permission',
      'permissionName',
      'PermissionName',
      'name',
      'Name',
      'code',
      'Code',
      'action',
      'Action',
      'claim',
      'Claim',
    ]);
    const normalizedName = normalizePermissionKey(permissionName);

    if (!normalizedAliases.some((alias) => normalizedName.includes(alias))) {
      continue;
    }

    return getPermissionBoolean(row, [
      'isAllowed',
      'IsAllowed',
      'allowed',
      'Allowed',
      'hasAccess',
      'HasAccess',
      'enabled',
      'Enabled',
      'value',
      'Value',
      'canAccess',
      'CanAccess',
    ], true);
  }

  return fallback;
}

function getJournalPermission(source, aliases, fullAccess = false) {
  return getPermissionBoolean(source, aliases, getPermissionFromCollection(source, aliases, fullAccess));
}

function normalizeJournalPermissions(data) {
  const source = data?.permissions || data?.Permissions || data?.data || data?.Data || data || {};
  const fullAccess = getPermissionBoolean(source, [
    'fullAccess',
    'FullAccess',
    'allAccess',
    'AllAccess',
    'isAdmin',
    'IsAdmin',
    'canAccess',
    'CanAccess',
  ]);

  return {
    canCreate: getJournalPermission(source, ['canCreate', 'CanCreate', 'create', 'Create', 'add', 'Add', 'new', 'New'], fullAccess),
    canDelete: getJournalPermission(source, ['canDelete', 'CanDelete', 'delete', 'Delete', 'remove', 'Remove'], fullAccess),
    canEdit: getJournalPermission(source, ['canEdit', 'CanEdit', 'edit', 'Edit', 'canUpdate', 'CanUpdate', 'update', 'Update'], fullAccess),
    canSearch: getJournalPermission(source, ['canSearch', 'CanSearch', 'search', 'Search', 'canView', 'CanView', 'canRead', 'CanRead', 'view', 'View'], fullAccess),
    canApprove: getJournalPermission(source, ['canApprove', 'CanApprove', 'approve', 'Approve'], fullAccess),
    canPost: getJournalPermission(source, ['canPost', 'CanPost', 'post', 'Post', 'canPostToLedger', 'CanPostToLedger', 'canApprove', 'CanApprove', 'approve', 'Approve'], fullAccess),
    canPrint: getJournalPermission(source, ['canPrint', 'CanPrint', 'print', 'Print', 'canPrintVoucher', 'CanPrintVoucher', 'voucher', 'Voucher'], fullAccess),
  };
}

function getField(source, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = source?.[fieldName];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}

function getJournalEntryReferenceTypeLabel(data, fallback = '') {
  const referenceTypeLabel = getField(data, [
    'referenceTypeLabel',
    'ReferenceTypeLabel',
    'referenceTypeName',
    'ReferenceTypeName',
    'referenceTypeDescription',
    'ReferenceTypeDescription',
  ]);
  const rawReferenceType = data?.referenceType ?? data?.ReferenceType;

  if (referenceTypeLabel.toLowerCase() === 'expense report') {
    return 'Journal Entry';
  }

  if (Number(rawReferenceType) === 32768) {
    return 'Journal Entry';
  }

  return referenceTypeLabel || fallback;
}

function normalizeAccountTitle(row) {
  const accountTitleId = getField(row, ['accountTitleId', 'accountTitleID', 'AccountTitleID', 'AccountTitleId', 'id', 'Id']);
  const code = getField(row, ['code', 'Code', 'accountCode', 'AccountCode']);
  const description = getField(row, ['description', 'Description', 'accountDescription', 'AccountDescription', 'name', 'Name']);

  if (!accountTitleId || !code || !description) {
    return null;
  }

  return {
    accountTitleId,
    code,
    description,
    display: `${code} - ${description}`,
  };
}

function normalizeCostUnit(row) {
  const costUnitId = getField(row, ['costUnitId', 'costUnitID', 'CostUnitID', 'CostUnitId', 'id', 'Id']);
  const code = getField(row, ['code', 'Code']);
  const description = getField(row, ['description', 'Description', 'name', 'Name']);

  if (!costUnitId || !code || !description) {
    return null;
  }

  return {
    costUnitId,
    code,
    description,
    display: `${code} - ${description}`,
  };
}

function normalizeClassification(row) {
  const classificationId = getField(row, ['classificationId', 'classificationID', 'ClassificationID', 'ClassificationId', 'id', 'Id']);
  const code = getField(row, ['code', 'Code']);
  const description = getField(row, ['description', 'Description', 'name', 'Name']);
  const hierarchy = getField(row, ['hierarchy', 'Hierarchy']);
  const display = getField(row, ['display', 'Display']);

  if (!classificationId) {
    return null;
  }

  const finalDisplay = display || hierarchy || [code, description].filter(Boolean).join(' - ');

  return {
    classificationId,
    code: code || '',
    description: description || '',
    hierarchy: hierarchy || '',
    display: finalDisplay,
  };
}

function normalizeBook(row) {
  const bookId = getField(row, ['bookId', 'bookID', 'BookID', 'BookId', 'bookOfAccountId', 'BookOfAccountID', 'BookOfAccountId', 'id', 'Id']);
  const code = getField(row, ['code', 'Code']);
  const description = getField(row, ['description', 'Description', 'name', 'Name']);

  if (!bookId && !description && !code) {
    return null;
  }

  return {
    bookId: bookId || description || code,
    code,
    description,
    display: description || code,
  };
}

function normalizeCompany(row) {
  const companyId = getField(row, ['companyKey', 'CompanyKey', 'companyId', 'CompanyID', 'CompanyId', 'id', 'Id']);
  const code = getField(row, ['code', 'Code', 'companyCode', 'CompanyCode']);
  const description = getField(row, ['description', 'Description', 'name', 'Name', 'companyName', 'CompanyName']);
  const address = getField(row, ['address', 'Address', 'companyAddress', 'CompanyAddress']);
  const tinNumber = getField(row, ['tinNumber', 'TinNumber', 'TINNumber', 'tinnumber', 'tinNo', 'TinNo', 'TIN', 'tin']);

  if (!companyId && !description) {
    return null;
  }

  return {
    companyId: companyId || description,
    code,
    description,
    address,
    tinNumber,
    display: description ? (code ? `${code} - ${description}` : description) : code,
  };
}

function normalizeEmployeeLookup(row) {
  const employeeId = getField(row, ['employeeId', 'employeeID', 'EmployeeID', 'EmployeeId', 'id', 'Id']);
  const userId = getField(row, ['userId', 'userID', 'UserID', 'UserId'])
    || getField(row?.user, ['userId', 'userID', 'UserID', 'UserId', 'id', 'Id']);
  const employeeNo = getField(row, ['employeeNo', 'employeeCode', 'employeeNumber', 'EmployeeNo', 'EmployeeCode', 'EmployeeNumber']);
  const displayName = getAuditEmployeeName(row);

  if (!employeeId && !userId && !employeeNo && !displayName) {
    return null;
  }

  return {
    employeeId,
    userId,
    employeeNo,
    displayName,
  };
}

function findEmployeeName(employees, value, matchOrder = ['userId', 'employeeId', 'employeeNo', 'displayName']) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) {
    return '';
  }

  for (const fieldName of matchOrder) {
    const employee = employees.find((row) => String(row[fieldName] || '').trim().toLowerCase() === normalizedValue);

    if (employee?.displayName) {
      return employee.displayName;
    }
  }

  return '';
}

function normalizeDailyExpenseReference(row) {
  const expenseId = getField(row, ['expenseId', 'ExpenseID', 'ExpenseId', 'id', 'Id']);
  const referenceNo = getField(row, ['referenceNo', 'ReferenceNo']);
  const employeeName = getField(row, ['employeeName', 'EmployeeName']);
  const documentNo = getField(row, ['documentNo', 'DocumentNo']);
  const description = getField(row, ['description', 'Description']);
  const rawStatus = getField(row, ['status', 'Status', 'statusLabel', 'StatusLabel']);
  const numericStatus = Number(row?.statusValue ?? row?.StatusValue ?? row?.statusID ?? row?.StatusID ?? row?.status ?? row?.Status ?? '');
  const normalizedStatus = Number.isFinite(numericStatus) && numericStatus > 0
    ? (numericStatus === 1 ? 'Approved' : numericStatus === 2 ? 'Rejected' : 'Pending')
    : rawStatus || 'Pending';

  if (!expenseId || !referenceNo) {
    return null;
  }

  return {
    expenseId,
    referenceNo,
    employeeName,
    documentNo,
    description,
    status: normalizedStatus,
    display: [referenceNo, employeeName, documentNo].filter(Boolean).join(' - '),
  };
}

function findAccountTitle(rows, value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return rows.find((row) => (
    row.accountTitleId === value
    || row.code.toLowerCase() === normalizedValue
    || row.description.toLowerCase() === normalizedValue
    || row.display.toLowerCase() === normalizedValue
  )) || null;
}

function findCostUnit(rows, value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return rows.find((row) => (
    String(row.costUnitId) === normalizedValue
    || row.code.toLowerCase() === normalizedValue
    || row.description.toLowerCase() === normalizedValue
    || row.display.toLowerCase() === normalizedValue
  )) || null;
}

function findClassification(rows, value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return rows.find((row) => (
    String(row.classificationId) === String(value)
    || row.code.toLowerCase() === normalizedValue
    || row.description.toLowerCase() === normalizedValue
    || row.display.toLowerCase() === normalizedValue
    || row.hierarchy.toLowerCase() === normalizedValue
  )) || null;
}

function findBook(rows, value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return rows.find((row) => (
    row.bookId === value
    || row.code.toLowerCase() === normalizedValue
    || row.description.toLowerCase() === normalizedValue
    || row.display.toLowerCase() === normalizedValue
  )) || null;
}

function findCompany(rows, value) {
  const normalizedValue = String(value || '').trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  return rows.find((row) => (
    String(row.companyId || '').trim().toLowerCase() === normalizedValue
    || String(row.code || '').trim().toLowerCase() === normalizedValue
    || String(row.description || '').trim().toLowerCase() === normalizedValue
    || String(row.display || '').trim().toLowerCase() === normalizedValue
  )) || null;
}

function getReferenceOptionLabel(row) {
  return [row.referenceNo, row.employeeName, row.documentNo].filter(Boolean).join(' - ');
}

function resolveJournalAuditName(row, nameFields, idFields, employeeRows) {
  const displayName = getField(row, nameFields);

  if (displayName && !isPlaceholderAuditName(displayName)) {
    return displayName;
  }

  return findEmployeeName(employeeRows, getField(row, idFields), ['userId', 'employeeId', 'employeeNo', 'displayName']);
}

function normalizeApiJournalEntry(row, bookRows = [], employeeRows = []) {
  const journalEntryId = Number(row?.journalEntryID ?? row?.journalEntryId ?? 0);
  const entryNumber = getField(row, ['entryNumber', 'EntryNumber']);
  const entryDate = row?.entryDate ?? row?.EntryDate ?? '';
  const referenceNo = getField(row, ['referenceNo', 'ReferenceNo']);
  const referenceTypeLabel = getField(row, ['referenceTypeLabel', 'ReferenceTypeLabel']) || 'Journal Entry';
  const statusLabel = getField(row, ['statusLabel', 'StatusLabel']) || 'Pending';
  const bookId = getField(row, ['bookId', 'bookID', 'BookID', 'BookId', 'bookOfAccountId', 'BookOfAccountID', 'BookOfAccountId', 'BookOfAccountID'])
    || getField(row?.book, ['bookId', 'bookID', 'BookID', 'BookId', 'bookOfAccountId', 'BookOfAccountID', 'BookOfAccountId', 'BookOfAccountID', 'id', 'Id'])
    || getField(row?.bookOfAccount, ['bookId', 'bookID', 'BookID', 'BookId', 'bookOfAccountId', 'BookOfAccountID', 'BookOfAccountId', 'BookOfAccountID', 'id', 'Id']);
  const mappedBook = findBook(bookRows, bookId);
  const bookLabel = mappedBook?.display
    || getField(row, ['ledgerBook', 'LedgerBook', 'bookCode', 'BookCode', 'bookDescription', 'BookDescription'])
    || getField(row?.book, ['code', 'Code', 'description', 'Description', 'name', 'Name'])
    || getField(row?.bookOfAccount, ['code', 'Code', 'description', 'Description', 'name', 'Name'])
    || (referenceTypeLabel === 'Journal Entry' ? 'Journal Voucher' : '');

  return {
    id: journalEntryId || entryNumber || referenceNo,
    journalEntryId,
    status: statusLabel,
    book: bookLabel || bookId,
    entryNumber,
    entryDate: formatDisplayDate(entryDate),
    entryDateValue: entryDate,
    referenceNumber: referenceNo,
    referenceType: 'Journal Entry',
    createdBy: resolveJournalAuditName(row, ['createdByName', 'CreatedByName'], [
      'createdBy',
      'CreatedBy',
      'createdById',
      'CreatedById',
      'createdByID',
      'CreatedByID',
      'createBy',
      'CreateBy',
      'userId',
      'UserId',
      'userID',
      'UserID',
    ], employeeRows),
    createdDate: formatDisplayDate(row?.createDate ?? row?.CreateDate ?? ''),
    lastModifiedBy: resolveJournalAuditName(row, ['lastUpdatedByName', 'LastUpdatedByName'], [
      'lastUpdatedBy',
      'LastUpdatedBy',
      'lastUpdatedById',
      'LastUpdatedById',
      'lastUpdatedByID',
      'LastUpdatedByID',
      'lastModifiedBy',
      'LastModifiedBy',
      'modifiedBy',
      'ModifiedBy',
      'updatedBy',
      'UpdatedBy',
    ], employeeRows),
    lastModifiedDate: formatDisplayDate(row?.lastUpdateDate ?? row?.LastUpdateDate ?? ''),
    remarks: getField(row, ['remarks', 'Remarks']),
    debitTotal: Number(row?.debitTotal ?? row?.DebitTotal ?? 0),
    creditTotal: Number(row?.creditTotal ?? row?.CreditTotal ?? 0),
    raw: row,
  };
}

function normalizeJournalEntryDetail(row) {
  const area = getField(row, ['area', 'Area']);

  return {
    id: Number(row?.journalEntryDetailID ?? row?.JournalEntryDetailID ?? row?.detailID ?? row?.DetailID ?? 0)
      || `${getField(row, ['accountCode', 'AccountCode', 'Account Code'])}-${getField(row, ['debit', 'Debit'])}-${getField(row, ['credit', 'Credit'])}`,
    journalEntryId: Number(row?.journalEntryID ?? row?.JournalEntryID ?? row?.journalEntryId ?? row?.JournalEntryId ?? 0),
    accountCode: getField(row, ['accountCode', 'AccountCode', 'Account Code']),
    accountDescription: getField(row, ['accountDescription', 'AccountDescription', 'Account Description']),
    businessUnit: getField(row, ['businessUnit', 'BusinessUnit', 'Business Unit']),
    costCenter: getField(row, ['costCenter', 'CostCenter', 'Cost Center']),
    debit: parseAmount(row?.debit ?? row?.Debit ?? 0),
    credit: parseAmount(row?.credit ?? row?.Credit ?? 0),
    area: area === '-1' ? '' : area,
    remarks: getField(row, ['remarks', 'Remarks']),
  };
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
  if (!String(status || '').trim()) {
    return '';
  }

  if (status === 'Unsaved') {
    return 'is-unsaved';
  }

  const normalized = normalizeJournalStatus(status);

  if (!normalized) {
    return 'is-unsaved';
  }

  return `is-${normalized.toLowerCase()}`;
}

function isLineLookupField(field) {
  return field === 'accountCode'
    || field === 'accountTitle'
    || field === 'subsidiary'
    || field === 'costCenter';
}

function matchesLookupSearch(row, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    row.code,
    row.description,
    row.display,
    row.hierarchy,
  ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
}

function JournalLineLookupModal({ lookup, searchTerm, onSearchChange, onSelect, onClose }) {
  if (!lookup) {
    return null;
  }

  const filteredRows = lookup.rows.filter((row) => matchesLookupSearch(row, searchTerm));

  return (
    <div className="etr-journal-lookup-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="etr-journal-lookup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="etr-journal-lookup-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="etr-journal-lookup-head">
          <div>
            <h2 id="etr-journal-lookup-title">{lookup.title}</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <input
          className="etr-journal-lookup-search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={lookup.placeholder}
          autoFocus
        />

        <div className="etr-journal-lookup-list">
          {filteredRows.length > 0 ? filteredRows.map((row) => (
            <button
              key={row.id}
              type="button"
              className="etr-journal-lookup-option"
              onClick={() => onSelect(row)}
            >
              <strong>{row.primary}</strong>
              <span>{row.secondary}</span>
            </button>
          )) : (
            <div className="etr-journal-lookup-empty">No matching records found.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function PostJournalEntryConfirmDialog({
  isSubmitting,
  onConfirm,
  onCancel,
  message = 'Are you sure you want to post this journal entry?',
}) {
  return (
    <div className="etr-journal-post-overlay" role="presentation" onMouseDown={onCancel}>
      <section
        className="etr-journal-post-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="etr-journal-post-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="etr-journal-post-titlebar">
          <h2 id="etr-journal-post-title">Post</h2>
          <button type="button" onClick={onCancel} aria-label="Close post confirmation" disabled={isSubmitting}>×</button>
        </div>
        <div className="etr-journal-post-body">
          <div className="etr-journal-post-icon" aria-hidden="true">?</div>
          <p>{message}</p>
        </div>
        <div className="etr-journal-post-actions">
          <button type="button" className="is-primary" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Yes'}
          </button>
          <button type="button" onClick={onCancel} disabled={isSubmitting}>No</button>
        </div>
      </section>
    </div>
  );
}

function getJournalSortValue(row, column) {
  if (column.numeric) {
    return Number(row[column.key] || 0);
  }

  if (column.key === 'entryDate' || column.key === 'createdDate' || column.key === 'lastModifiedDate') {
    return new Date(row[column.key]).getTime() || 0;
  }

  return String(row[column.key] || '').toLowerCase();
}

function getSearchRelevance(row, query) {
  const columns = ['entryNumber', 'referenceNumber', 'book', 'createdBy', 'lastModifiedBy', 'remarks', 'status'];
  let maxRelevance = 0;

  for (const key of columns) {
    const value = String(row[key] || '').toLowerCase();
    if (value === query) {
      return 3; // exact match
    }
    if (value.startsWith(query)) {
      maxRelevance = Math.max(maxRelevance, 2);
    } else if (value.includes(query)) {
      maxRelevance = Math.max(maxRelevance, 1);
    }
  }

  return maxRelevance;
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
  return false;
}

function getAuditEmployeeName(user) {
  if (!user) {
    return '';
  }

  const fullName = getUserField(user, ['employeeName', 'fullName', 'name', 'displayName', 'EmployeeName', 'FullName', 'Name']);

  if (fullName) {
    return fullName;
  }

  const lastName = getUserField(user, ['lastName', 'lastname', 'LastName', 'LASTNAME']);
  const firstName = getUserField(user, ['firstName', 'firstname', 'FirstName', 'FIRSTNAME']);
  const middleName = getUserField(user, ['middleName', 'middlename', 'MiddleName', 'MIDDLENAME']);

  if (firstName && lastName) {
    return [[firstName, middleName].filter(Boolean).join(' '), lastName].filter(Boolean).join(' ');
  }

  return firstName || lastName || getUserField(user, ['username']) || 'Executive Service Account';
}

function formatAuditDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const datePart = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
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

function isMeaningfulAuditDate(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getFullYear() > 1900;
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
    return '';
  }

  return formatAuditStamp(record.name, record.at);
}

function resolveAuditStamp(record) {
  if (record?.name && record?.at) {
    return formatAuditStamp(record.name, record.at);
  }

  return '';
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
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrintDateTime(value = new Date()) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const formatted = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  return formatted.replace(',', '').replace('AM', 'am').replace('PM', 'pm');
}

function formatMetaDate(value) {
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

function formatMoney4Decimal(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function normalizeCompanyAddressText(value) {
  return String(value || '')
    .replace(/Para(?:a|\u00f1|\u00c3\u00b1|\u00e6)?aque/g, 'Para\u00f1aque')
    .replace(/Par(?:a|\u00e6)aque/g, 'Para\u00f1aque')
    .replace(/PARA(?:A|\u00d1|\u00c3\u00b1|\u00c6)?AQUE/g, 'PARA\u00d1AQUE')
    .replace(/PAR(?:A|\u00c6)AQUE/g, 'PARA\u00d1AQUE');
}

function pdfVLine(page, x, y1, y2, lw = 0.5) {
  page.push(`q 0.72 G ${lw} w ${x.toFixed(2)} ${y1.toFixed(2)} m ${x.toFixed(2)} ${y2.toFixed(2)} l S Q`);
}

function wrapText(text, size, maxWidth) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const prefix = currentLine ? ' ' : '';
    const testLine = `${currentLine}${prefix}${word}`;

    if (estimatePdfWidth(testLine, size) <= maxWidth) {
      currentLine = testLine;
      continue;
    }

    for (const ch of `${prefix}${word}`) {
      const testCharLine = `${currentLine}${ch}`;
      if (estimatePdfWidth(testCharLine, size) > maxWidth) {
        if (currentLine) {
          lines.push(currentLine.trimEnd());
        }
        currentLine = ch === ' ' ? '' : ch;
      } else {
        currentLine = testCharLine;
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length ? lines : [''];
}

function chunkText(text, chunkSize) {
  const value = String(text || '');
  const chunks = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize));
  }
  return chunks.length ? chunks : [''];
}

function truncateText(text, size, maxWidth) {
  const str = String(text || '');
  if (estimatePdfWidth(str, size) <= maxWidth) {
    return str;
  }
  let temp = '';
  for (const ch of str) {
    if (estimatePdfWidth(temp + ch + '...', size) > maxWidth) {
      return temp + '...';
    }
    temp += ch;
  }
  return temp + '...';
}

function drawWrappedPdfText(page, text, x, y, size, maxWidth, maxLines, options = {}) {
  const lines = wrapText(text, size, maxWidth).slice(0, maxLines);

  if (lines.length === maxLines) {
    const allLines = wrapText(text, size, maxWidth);
    if (allLines.length > maxLines) {
      lines[maxLines - 1] = truncateText(lines[maxLines - 1], size, maxWidth);
    }
  }

  lines.forEach((lineText, index) => {
    const textOptions = { ...options };
    if (options.clip !== false) {
      textOptions.clipWidth = maxWidth;
    }
    delete textOptions.clip;
    pdfTxt(page, lineText, x, y - index * 9, size, textOptions);
  });

  return lines.length;
}

function normalizeDateTextToIso(value) {
  const text = String(value || '').trim();

  if (!text) {
    return '';
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!slashMatch) {
    return '';
  }

  const month = slashMatch[1].padStart(2, '0');
  const day = slashMatch[2].padStart(2, '0');
  const year = slashMatch[3];
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (
    date.getFullYear() !== Number(year)
    || date.getMonth() + 1 !== Number(month)
    || date.getDate() !== Number(day)
  ) {
    return '';
  }

  return `${year}-${month}-${day}`;
}

function DateTextInput({ value, onChange, readOnly = false }) {
  const pickerRef = useRef(null);

  const openPicker = () => {
    if (readOnly) {
      return;
    }

    const picker = pickerRef.current;

    if (!picker) {
      return;
    }

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    picker.focus();
  };

  return (
    <span style={{ position: 'relative', display: 'block' }}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="MM/DD/YYYY"
        value={formatDisplayDate(value)}
        readOnly
        style={{ fontWeight: 400 }}
        onClick={openPicker}
        onFocus={openPicker}
      />
      <input
        ref={pickerRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={readOnly}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </span>
  );
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

// ─── Raw PDF helpers (same technique as the reimbursement report) ─────────────

function escapePdfStr(value) {
  return String(value ?? '').split('').map((ch) => {
    const code = ch.charCodeAt(0);
    if (ch === '\\') return '\\\\';
    if (ch === '(') return '\\(';
    if (ch === ')') return '\\)';
    if (code >= 0x20 && code <= 0x7e) return ch;
    if (code >= 0xa0 && code <= 0xff) {
      return `\\${code.toString(8).padStart(3, '0')}`;
    }
    return '';
  }).join('');
}

function estimatePdfWidth(text, size) {
  return String(text || '').split('').reduce((sum, ch) => {
    if ('MW'.includes(ch)) return sum + size * 0.82;
    if ('IJ'.includes(ch) || 'ijltfr.,;:|!\''.includes(ch)) return sum + size * 0.34;
    if (' -/\\()[]{}'.includes(ch)) return sum + size * 0.32;
    if (/[A-Z]/.test(ch)) return sum + size * 0.62;
    if (/[0-9]/.test(ch)) return sum + size * 0.56;
    return sum + size * 0.5;
  }, 0);
}

function pdfTxt(page, text, x, y, size, options = {}) {
  const safe = escapePdfStr(text);
  const font = options.font || 'F1';
  const gray = options.gray ?? 0;
  const align = options.align || 'left';
  const width = options.width || 0;
  const ew = estimatePdfWidth(safe, size);
  const tx = align === 'right' ? x + width - ew : align === 'center' ? x + (width - ew) / 2 : x;
  const clip = options.clipWidth
    ? `${x.toFixed(2)} ${(y - size * 0.35).toFixed(2)} ${options.clipWidth.toFixed(2)} ${(size * 1.35).toFixed(2)} re W n `
    : '';
  page.push(`q ${clip}${gray} g BT /${font} ${size} Tf ${tx.toFixed(2)} ${y.toFixed(2)} Td (${safe}) Tj ET Q`);
}

function pdfFill(page, x, y, w, h, gray) {
  page.push(`q ${gray} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`);
}

function pdfBorder(page, x, y, w, h, lw = 0.4) {
  page.push(`q 0.72 G ${lw} w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S Q`);
}

function pdfHLine(page, x1, y, x2, lw = 0.5) {
  page.push(`q 0.72 G ${lw} w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S Q`);
}

function buildJournalVoucherPdfBlob({ header, lines, totals }) {
  const PAGE_W = 612;  // letter portrait
  const PAGE_H = 792;
  const M = 25;        // outer margin for border box
  const PW = PAGE_W - M * 2; // 562
  const PH = PAGE_H - M * 2; // 742

  const company   = String(header.company || header.companyName || 'MASIGASIG TRANSPORT AND LOGISTICS SOLUTIONS, INC.').toUpperCase();
  const address   = normalizeCompanyAddressText(header.companyAddress);
  const tin       = String(header.companyTinNumber || '');
  const refNo     = String(header.referenceNo || '-');
  const entryNo   = String(header.transactionNo || 'DRAFT').toUpperCase();
  const entryDate = formatMetaDate(header.transactionDate);
  const note      = String(header.remarks || '');
  const printed   = formatPrintDateTime();

  const activeLines = lines.filter((l) => l.accountCode || l.accountTitle || parseAmount(l.debit) > 0 || parseAmount(l.credit) > 0);

  // Sorting logic: Debit lines first
  const sortedLines = [...activeLines].sort((a, b) => {
    const aDebit = parseAmount(a.debit) > 0;
    const bDebit = parseAmount(b.debit) > 0;
    if (aDebit && !bDebit) return -1;
    if (!aDebit && bDebit) return 1;
    return 0;
  });

  const stream = ['0.45 w', '0.45 G', '0 g'];

  // Define exact vertical layout coordinates (adjusted for larger address/TIN fonts)
  const companyY = 750;
  const addressY = 732;
  const tinY     = 718;
  const titleY   = 690;
  const metaY    = 666;
  const tblTop   = 604;
  const tblY     = 90;
  const tblW     = PW - 20;
  const tblH     = tblTop - tblY; // 540
  const tblX     = M + 10;

  // 1. Company Header (left-aligned, Arial 12 Bold -> F2 size 12)
  pdfTxt(stream, company, M + 10, companyY, 12, { font: 'F2', gray: 0.1 });
  
  // Printed Date (right-aligned, Tahoma 6 Bold -> F2 size 6)
  pdfTxt(stream, `Printed Date : ${printed}`, M + PW - 230, companyY, 6, { font: 'F2', gray: 0.2, align: 'right', width: 220 });

  // Company Address and TIN (Arial 10 Regular -> F1 size 10)
  if (address) {
    pdfTxt(stream, address, M + 10, addressY, 10, { gray: 0.15 });
  }
  if (tin) {
    pdfTxt(stream, `TIN #: ${tin}`, M + 10, tinY, 10, { gray: 0.15 });
  }

  // 2. Document Title (left-aligned, Tahoma 13 Bold -> F2 size 13)
  pdfTxt(stream, 'JOURNAL VOUCHER', M + 10, titleY, 13, { font: 'F2', gray: 0.08 });

  // 3. Notes & Meta Block
  pdfTxt(stream, 'Notes', M + 10, metaY, 9, { font: 'F2', gray: 0.1 });
  const noteX = M + 58;
  const labelX = M + PW - 150;
  const valueX = labelX + 86;
  const noteMaxWidth = 230;
  const valueMaxWidth = 80;
  const referenceLines = chunkText(refNo, 10).slice(0, 3);
  drawWrappedPdfText(stream, note, noteX, metaY, 8, noteMaxWidth, 3, { gray: 0.15, clip: false });

  // Right: Metadata Block - fixed column so long references cannot overlap notes.
  pdfTxt(stream, 'Reference No.:', labelX, metaY, 9, { font: 'F2', gray: 0.1 });
  referenceLines.forEach((lineText, index) => {
    pdfTxt(stream, lineText, valueX, metaY - index * 9, 8, { gray: 0.2, clipWidth: valueMaxWidth });
  });
  const referenceLineCount = referenceLines.length;
  const entryY = metaY - Math.max(10, referenceLineCount * 9);
  pdfTxt(stream, 'Entry No.:', labelX, entryY, 9, { font: 'F2', gray: 0.1 });
  const entryLineCount = drawWrappedPdfText(stream, entryNo, valueX, entryY, 8, valueMaxWidth, 2, { gray: 0.2 });
  const dateY = entryY - Math.max(10, entryLineCount * 9);
  pdfTxt(stream, 'Date:', labelX, dateY, 9, { font: 'F2', gray: 0.1 });
  drawWrappedPdfText(stream, entryDate, valueX, dateY, 8, valueMaxWidth, Math.max(1, 2 - entryLineCount), { gray: 0.2 });
  // Draw the outer table box
  pdfBorder(stream, tblX, tblY, tblW, tblH, 0.5);

  // Column configuration
  const codeW = 85;
  const titleW = 317;
  const amtW = 70;
  const COLS = [tblX, tblX + codeW, tblX + codeW + titleW, tblX + codeW + titleW + amtW];
  const WIDTHS = [codeW, titleW, amtW, amtW];

  // Draw continuous vertical column lines from bottom to top of table
  pdfVLine(stream, COLS[1], tblY, tblTop, 0.5);
  pdfVLine(stream, COLS[2], tblY, tblTop, 0.5);
  pdfVLine(stream, COLS[3], tblY, tblTop, 0.5);

  // Draw table header row background
  const hdrH = 18;
  pdfFill(stream, tblX, tblTop - hdrH, tblW, hdrH, 0.96);
  pdfHLine(stream, tblX, tblTop - hdrH, tblX + tblW, 0.5);

  // Draw header labels (Tahoma 8 Bold -> F2 size 8)
  pdfTxt(stream, 'Account Code', COLS[0], tblTop - 12, 8, { font: 'F2', gray: 0.1, align: 'center', width: codeW });
  pdfTxt(stream, 'Account Title', COLS[1], tblTop - 12, 8, { font: 'F2', gray: 0.1, align: 'center', width: titleW });
  pdfTxt(stream, 'Debit', COLS[2], tblTop - 12, 8, { font: 'F2', gray: 0.1, align: 'center', width: amtW });
  pdfTxt(stream, 'Credit', COLS[3], tblTop - 12, 8, { font: 'F2', gray: 0.1, align: 'center', width: amtW });

  // Print data rows (Tahoma 8 Regular -> F1 size 8)
  let currentY = tblTop - hdrH;
  const rowH = 15;

  sortedLines.forEach((line) => {
    const debit = parseAmount(line.debit);
    const credit = parseAmount(line.credit);
    
    // Format Account Title with Subsidiary
    let titleText = String(line.accountTitle || '-');
    if (line.subsidiary) {
      let subText = String(line.subsidiary);
      const match = subText.match(/^[A-Za-z0-9\-_]+\s*-\s*(.+)$/);
      if (match) {
        subText = match[1];
      }
      titleText += ` - ${subText}`;
    }

    // Accounting Convention: Indent Credit account codes and titles (where credit > 0) to the right
    const indent = credit > 0 ? 15 : 4;
    const codeX = COLS[0] + indent;
    const titleX = COLS[1] + indent;

    pdfTxt(stream, String(line.accountCode || '-'), codeX, currentY - 11, 8, { gray: 0.1 });
    pdfTxt(stream, titleText, titleX, currentY - 11, 8, { gray: 0.1 });
    if (debit > 0) {
      pdfTxt(stream, formatMoney4Decimal(debit), COLS[2] + 4, currentY - 11, 8, { gray: 0.08, align: 'right', width: amtW - 8 });
    }
    if (credit > 0) {
      pdfTxt(stream, formatMoney4Decimal(credit), COLS[3] + 4, currentY - 11, 8, { gray: 0.08, align: 'right', width: amtW - 8 });
    }
    currentY -= rowH;
  });

  // Print Totals Row (Tahoma 8 Bold -> F2 size 8)
  // Draw horizontal line above total values (Debit and Credit columns only)
  pdfHLine(stream, COLS[2], currentY, tblX + tblW, 0.5);

  pdfTxt(stream, 'TOTAL >>', COLS[1] - 4, currentY - 11, 8, { font: 'F2', gray: 0.1, align: 'right', width: titleW });
  pdfTxt(stream, formatMoney4Decimal(totals.debit), COLS[2] + 4, currentY - 11, 8, { font: 'F2', gray: 0.05, align: 'right', width: amtW - 8 });
  pdfTxt(stream, formatMoney4Decimal(totals.credit), COLS[3] + 4, currentY - 11, 8, { font: 'F2', gray: 0.05, align: 'right', width: amtW - 8 });

  // Draw double horizontal lines below total values (Debit and Credit columns only)
  const doubleY1 = currentY - rowH;
  const doubleY2 = doubleY1 - 2;
  pdfHLine(stream, COLS[2], doubleY1, tblX + tblW, 0.5);
  pdfHLine(stream, COLS[2], doubleY2, tblX + tblW, 0.5);

  // 5. Signature Section (Tahoma 8 Regular -> F1 size 8)
  const sigLineY = 50;
  const sigLabelY = 38;
  const sigColW = tblW / 4; // 135.5
  const sigLabels = ['Prepared By:', 'Checked By:', 'Approved By:', 'Received By:'];

  sigLabels.forEach((label, i) => {
    const sx = tblX + i * sigColW;
    const lineStart = sx + 10;
    const lineEnd = sx + sigColW - 10;

    // Draw signature line
    pdfHLine(stream, lineStart, sigLineY, lineEnd, 0.5);
    // Draw signature label (centered)
    pdfTxt(stream, label, sx, sigLabelY, 8, { gray: 0.1, align: 'center', width: sigColW });
  });

  // build the binary PDF
  const contentStr = stream.join('\n');
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>'];
  objects.push(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`);
  objects.push(`<< /Length ${contentStr.length} >>\nstream\n${contentStr}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((o) => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function downloadVoucherPdf(blob, entryNo) {
  const filename = `JournalVoucher-${entryNo || 'draft'}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
function JournalMetric({ label, value, tone = '' }) {
  return (
    <div className={`etr-journal-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function JournalEntryManagerView({ onNewEntry, onOpenEntry }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'entryDate', direction: 'desc' });
  const rowClickTimerRef = useRef(null);
  const [entryRows, setEntryRows] = useState([]);
  const [bookRows, setBookRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [permissions, setPermissions] = useState(defaultJournalPermissions);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState(() => new Set());
  const [isBulkPosting, setIsBulkPosting] = useState(false);
  const [bulkPostMessage, setBulkPostMessage] = useState('');
  const [bulkPostError, setBulkPostError] = useState('');
  const [showBulkPostConfirm, setShowBulkPostConfirm] = useState(false);

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadPermissions = async () => {
      try {
        const response = await fetch(buildApiUrl(JOURNAL_ENTRY_PERMISSIONS_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setPermissions(defaultJournalPermissions);
          return;
        }

        setPermissions(normalizeJournalPermissions(data));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setPermissions(defaultJournalPermissions);
        }
      }
    };

    loadPermissions();

    return () => controller.abort();
  }, []);

  const loadJournalRows = useCallback(async (signal) => {
    const token = getToken();
    setIsLoading(true);
    setLoadError('');

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [journalResponse, bookResponse, employeeResponse] = await Promise.all([
        fetch(buildApiUrl(JOURNAL_ENTRY_ENDPOINT), { headers, signal }),
        fetch(buildApiUrl(BOOK_OF_ACCOUNTS_ENDPOINT), { headers, signal }),
        fetch(buildApiUrl(EMPLOYEES_ENDPOINT), { headers, signal }),
      ]);
      const journalData = await journalResponse.json().catch(() => ({}));
      const bookData = await bookResponse.json().catch(() => ({}));
      const employeeData = await employeeResponse.json().catch(() => ({}));

      if (!journalResponse.ok) {
        throw new Error(journalData?.message || 'Unable to load journal entries.');
      }

      if (!bookResponse.ok) {
        throw new Error(bookData?.message || 'Unable to load journal books.');
      }

      const nextBookRows = getApiCollection(bookData).map(normalizeBook).filter(Boolean);
      const nextEmployeeRows = employeeResponse.ok
        ? getApiCollection(employeeData).map(normalizeEmployeeLookup).filter(Boolean)
        : [];
      setBookRows(nextBookRows);
      setEntryRows(getApiCollection(journalData).map((row) => normalizeApiJournalEntry(row, nextBookRows, nextEmployeeRows)));
      setSelectedPostIds(new Set());
    } catch (error) {
      if (error.name !== 'AbortError') {
        setLoadError(error.message || 'Unable to load journal entries.');
        setEntryRows([]);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadJournalRows(controller.signal);

    return () => controller.abort();
  }, [loadJournalRows]);

  const refreshJournalRows = () => {
    setBulkPostMessage('');
    setBulkPostError('');
    const controller = new AbortController();
    loadJournalRows(controller.signal);
  };

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
    const normalizedQuery = query.trim().toLowerCase();
    const hasQuery = normalizedQuery.length > 0;

    const column = managerColumns.find((item) => item.key === sortConfig.key);

    if (!column && !hasQuery) {
      return filteredRows;
    }

    return [...filteredRows].sort((first, second) => {
      // Primary: search relevance (when query is active)
      if (hasQuery) {
        const firstRelevance = getSearchRelevance(first, normalizedQuery);
        const secondRelevance = getSearchRelevance(second, normalizedQuery);
        if (firstRelevance !== secondRelevance) {
          return secondRelevance - firstRelevance;
        }
      }

      // Secondary: user-selected column sort
      if (column) {
        const firstValue = getJournalSortValue(first, column);
        const secondValue = getJournalSortValue(second, column);

        if (firstValue < secondValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }

        if (firstValue > secondValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
      }

      // Tie-breaker: sort by journalEntryId descending (newest first)
      const firstId = Number(first.journalEntryId || 0);
      const secondId = Number(second.journalEntryId || 0);
      return secondId - firstId;
    });
  }, [filteredRows, sortConfig, query]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / MANAGER_PAGE_SIZE));
  const visiblePages = getVisiblePages(page, totalPages);
  const pagedRows = sortedRows.slice((page - 1) * MANAGER_PAGE_SIZE, page * MANAGER_PAGE_SIZE);
  const pendingPagedRows = pagedRows.filter((row) => normalizeJournalStatus(row.status) === 'Pending' && Number(row.journalEntryId || 0) > 0);
  const selectedPostCount = selectedPostIds.size;
  const areAllPendingPagedRowsSelected = pendingPagedRows.length > 0
    && pendingPagedRows.every((row) => selectedPostIds.has(Number(row.journalEntryId)));

  useEffect(() => {
    setPage(1);
  }, [query, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setSelectedPostIds((current) => {
      const validPendingIds = new Set(entryRows
        .filter((row) => normalizeJournalStatus(row.status) === 'Pending')
        .map((row) => Number(row.journalEntryId || 0))
        .filter((id) => id > 0));
      const next = new Set([...current].filter((id) => validPendingIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [entryRows]);

  const handleSort = (columnKey) => {
    setSortConfig((current) => ({
      key: columnKey,
      direction: current.key === columnKey && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleShowDetails = async (row) => {
    const journalEntryId = Number(row?.journalEntryId || row?.raw?.journalEntryID || row?.raw?.journalEntryId || 0);

    if (!journalEntryId) {
      setSelectedDetailEntry(row);
      setDetailRows([]);
      setDetailError('Unable to determine the journal entry ID for this row.');
      return;
    }

    const token = getToken();

    setSelectedDetailEntry(row);
    setIsDetailLoading(true);
    setDetailError('');
    setDetailRows([]);

    try {
      const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_ENDPOINT}/${journalEntryId}/details`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to load journal entry details.');
      }

      setDetailRows(getApiCollection(data).map(normalizeJournalEntryDetail));
    } catch (error) {
      setDetailError(error.message || 'Unable to load journal entry details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleRowClick = (row) => {
    if (rowClickTimerRef.current) {
      window.clearTimeout(rowClickTimerRef.current);
    }

    rowClickTimerRef.current = window.setTimeout(() => {
      handleShowDetails(row);
      rowClickTimerRef.current = null;
    }, 220);
  };

  const handleRowDoubleClick = (row) => {
    if (rowClickTimerRef.current) {
      window.clearTimeout(rowClickTimerRef.current);
      rowClickTimerRef.current = null;
    }

    onOpenEntry?.(row.raw || row);
  };

  const togglePostSelection = (row) => {
    const journalEntryId = Number(row.journalEntryId || 0);

    if (!journalEntryId || normalizeJournalStatus(row.status) !== 'Pending') {
      return;
    }

    setBulkPostMessage('');
    setBulkPostError('');
    setSelectedPostIds((current) => {
      const next = new Set(current);

      if (next.has(journalEntryId)) {
        next.delete(journalEntryId);
      } else {
        next.add(journalEntryId);
      }

      return next;
    });
  };

  const togglePendingPageSelection = () => {
    setBulkPostMessage('');
    setBulkPostError('');
    setSelectedPostIds((current) => {
      const next = new Set(current);

      if (areAllPendingPagedRowsSelected) {
        pendingPagedRows.forEach((row) => next.delete(Number(row.journalEntryId)));
      } else {
        pendingPagedRows.forEach((row) => next.add(Number(row.journalEntryId)));
      }

      return next;
    });
  };

  const executeBulkPostSelected = async () => {
    setBulkPostMessage('');
    setBulkPostError('');
    setShowBulkPostConfirm(false);

    if (!permissions.canPost) {
      setBulkPostError('Post permission is required.');
      return;
    }

    const idsToPost = [...selectedPostIds];

    if (idsToPost.length === 0) {
      setBulkPostError('Select at least one pending journal entry.');
      return;
    }

    setIsBulkPosting(true);

    try {
      const token = getToken();

      for (const journalEntryId of idsToPost) {
        const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_ENDPOINT}/${journalEntryId}/post`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || `Unable to post journal entry ${journalEntryId}.`);
        }
      }

      setEntryRows((current) => current.map((row) => (
        selectedPostIds.has(Number(row.journalEntryId || 0))
          ? { ...row, status: 'Posted', raw: { ...(row.raw || {}), status: 1, statusLabel: 'Posted' } }
          : row
      )));
      setSelectedPostIds(new Set());
      setBulkPostMessage(`${idsToPost.length} journal entr${idsToPost.length === 1 ? 'y' : 'ies'} posted successfully.`);
    } catch (error) {
      setBulkPostError(error.message || 'Unable to post selected journal entries.');
    } finally {
      setIsBulkPosting(false);
    }
  };

  const handleBulkPostSelected = () => {
    setBulkPostMessage('');
    setBulkPostError('');

    if (!permissions.canPost) {
      setBulkPostError('Post permission is required.');
      return;
    }

    if (selectedPostIds.size === 0) {
      setBulkPostError('Select at least one pending journal entry.');
      return;
    }

    setShowBulkPostConfirm(true);
  };

  useEffect(() => () => {
    if (rowClickTimerRef.current) {
      window.clearTimeout(rowClickTimerRef.current);
    }
  }, []);

  return (
    <div className="etr-journal-entry etr-journal-manager">
      <div className="etr-journal-toolbar">
        <div>
          <p className="etr-journal-kicker">Finance</p>
          <h1>Journal Manager</h1>
          <span>Review, search, and monitor journal vouchers before posting.</span>
        </div>

        <div className="etr-journal-actions">
          <button
            type="button"
            className="is-primary"
            onClick={onNewEntry}
            disabled={!permissions.canCreate}
            title={!permissions.canCreate ? 'Create permission is required' : undefined}
          >
            New Journal Entry
          </button>
        </div>
      </div>

      {loadError ? <div className="etr-journal-action-message is-error">{loadError}</div> : null}
      {bulkPostError ? <div className="etr-journal-action-message is-error">{bulkPostError}</div> : null}
      {bulkPostMessage ? <div className="etr-journal-action-message">{bulkPostMessage}</div> : null}

      <section className="etr-journal-panel etr-journal-manager-panel">
        <div className="etr-journal-panel-head">
          <div>
            <h2>Journal Entries</h2>
            <span>{isLoading ? 'Loading journal entries...' : `${sortedRows.length} record${sortedRows.length === 1 ? '' : 's'} found`}</span>
          </div>

          <label className="etr-journal-search">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Entry no, reference, book, or status"
              disabled={!permissions.canSearch}
            />
          </label>
          <div className="etr-journal-bulk-post-actions">
            <span>{selectedPostCount} selected</span>
            <button
              type="button"
              className="is-secondary is-icon-only"
              onClick={refreshJournalRows}
              disabled={isLoading || isBulkPosting}
              aria-label="Refresh journal entries"
              title="Refresh journal entries"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleBulkPostSelected}
              disabled={isBulkPosting || selectedPostCount === 0 || !permissions.canPost}
              title={!permissions.canPost ? 'Post permission is required' : undefined}
            >
              {isBulkPosting ? 'Posting...' : 'Post Selected'}
            </button>
          </div>
        </div>

        <div className="etr-journal-table-wrap">
          <table className="etr-journal-table">
            <thead>
              <tr>
                <th className="etr-journal-select-column">
                  <input
                    type="checkbox"
                    checked={areAllPendingPagedRowsSelected}
                    onChange={togglePendingPageSelection}
                    disabled={pendingPagedRows.length === 0 || isBulkPosting}
                    aria-label="Select pending journal entries on this page"
                  />
                </th>
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
                  <td colSpan={managerColumns.length + 1}>No journal entries found.</td>
                </tr>
              ) : null}

              {pagedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`etr-expense-clickable-row ${selectedDetailEntry?.journalEntryId === row.journalEntryId ? 'is-selected' : ''}`}
                  onClick={() => handleRowClick(row)}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                  title="Click to show details; double-click to open journal entry"
                >
                  <td className="etr-journal-select-column" onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedPostIds.has(Number(row.journalEntryId || 0))}
                      onChange={() => togglePostSelection(row)}
                      disabled={normalizeJournalStatus(row.status) !== 'Pending' || isBulkPosting}
                      aria-label={`Select journal entry ${row.entryNumber || row.journalEntryId}`}
                    />
                  </td>
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

        <div className="etr-journal-manager-detail-overlay">
          <div className="etr-journal-manager-detail-popover">
            <div className="etr-journal-manager-detail-head">
              <div>
                <span>Journal Entry Details</span>
              </div>
            </div>

            {selectedDetailEntry && detailError ? <div className="etr-journal-action-message is-error">{detailError}</div> : null}

            <div className="etr-journal-lines-wrap">
              <table className="etr-journal-lines etr-journal-manager-detail-table">
                <thead>
                  <tr>
                    {managerDetailColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedDetailEntry && isDetailLoading ? (
                    <tr>
                      <td colSpan={managerDetailColumns.length}>Loading details...</td>
                    </tr>
                  ) : null}

                  {selectedDetailEntry && !isDetailLoading && detailRows.length === 0 ? (
                    <tr>
                      <td colSpan={managerDetailColumns.length}>No details found for this journal entry.</td>
                    </tr>
                  ) : null}

                  {selectedDetailEntry && !isDetailLoading ? detailRows.map((detail, detailIndex) => (
                    <tr key={`${detail.id}-${detailIndex}`}>
                      {managerDetailColumns.map((column) => (
                        <td key={column.key} className={column.numeric ? 'is-number' : ''}>
                          {column.numeric ? formatMoney(detail[column.key]) : detail[column.key]}
                        </td>
                      ))}
                    </tr>
                  )) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      {showBulkPostConfirm ? (
        <PostJournalEntryConfirmDialog
          isSubmitting={isBulkPosting}
          message={`Are you sure you want to post ${selectedPostCount} selected journal entr${selectedPostCount === 1 ? 'y' : 'ies'}?`}
          onConfirm={executeBulkPostSelected}
          onCancel={() => setShowBulkPostConfirm(false)}
        />
      ) : null}
    </div>
  );
}

function JournalEntryView({ user, selectedExpense = null, selectedJournalEntry = null, onSaved, onBack }) {
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [referenceRows, setReferenceRows] = useState([]);
  const [bookRows, setBookRows] = useState([]);
  const [companyRows, setCompanyRows] = useState([]);
  const [accountTitleRows, setAccountTitleRows] = useState([]);
  const [costUnitRows, setCostUnitRows] = useState([]);
  const [classificationRows, setClassificationRows] = useState([]);
  const [auditTrail, setAuditTrail] = useState(createDefaultAuditTrail);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [isLookupsLoading, setIsLookupsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [header, setHeader] = useState(createDefaultJournalHeader);
  const [lines, setLines] = useState(createDefaultJournalLines);
  const [savedJournalEntryId, setSavedJournalEntryId] = useState(0);
  const [lineLookup, setLineLookup] = useState(null);
  const [lineLookupSearch, setLineLookupSearch] = useState('');
  const [permissions, setPermissions] = useState(defaultJournalPermissions);

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadPermissions = async () => {
      try {
        const response = await fetch(buildApiUrl(JOURNAL_ENTRY_PERMISSIONS_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setPermissions(defaultJournalPermissions);
          return;
        }

        setPermissions(normalizeJournalPermissions(data));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setPermissions(defaultJournalPermissions);
        }
      }
    };

    loadPermissions();

    return () => controller.abort();
  }, [user]);

  const applyJournalEntryRecord = (data, nextBookRows = bookRows, nextAccountTitleRows = accountTitleRows, nextCostUnitRows = costUnitRows, nextClassificationRows = classificationRows) => {
    setSavedJournalEntryId(Number(data?.journalEntryID ?? data?.journalEntryId ?? 0));

    const resolvedBook = findBook(nextBookRows, String(data?.bookID ?? data?.bookId ?? ''));
    const nextLines = Array.isArray(data?.details) && data.details.length > 0
      ? data.details.map((detail, index) => {
        const accountTitle = findAccountTitle(nextAccountTitleRows, String(detail?.accountTitleID ?? detail?.accountTitleId ?? ''));
        const costUnit = findCostUnit(nextCostUnitRows, String(detail?.costUnitID ?? detail?.costUnitId ?? ''));

        const rawRemarks = String(detail?.remarks || '');
        const parts = rawRemarks.split(' | ');
        let costCenterId = String(detail?.costCenterID ?? detail?.costCenterId ?? detail?.CostCenterID ?? detail?.CostCenterId ?? '');
        let costCenter = '';
        let detailRemarks = rawRemarks;

        const matchedAreaClassification = findClassification(nextClassificationRows, costCenterId);
        if (matchedAreaClassification) {
          costCenterId = matchedAreaClassification.classificationId;
          costCenter = matchedAreaClassification.display;
        } else if (costCenterId === '-1') {
          costCenterId = '';
        }

        if (parts.length > 1) {
          const firstPart = parts[0];
          const matchedClassification = findClassification(nextClassificationRows, firstPart);
          if (matchedClassification) {
            costCenterId = matchedClassification.classificationId;
            costCenter = matchedClassification.display;
            detailRemarks = parts.slice(1).join(' | ');
          }
        } else if (parts.length === 1 && parts[0]) {
          const matchedClassification = findClassification(nextClassificationRows, parts[0]);
          if (matchedClassification) {
            costCenterId = matchedClassification.classificationId;
            costCenter = matchedClassification.display;
            detailRemarks = '';
          }
        }

        if (!costCenterId || costCenterId === '-1' || costCenterId === '0') {
          const dbDetailCostCenter = String(detail?.costCenter ?? detail?.CostCenter ?? detail?.['Cost Center'] ?? '');
          if (dbDetailCostCenter) {
            const matchedDbClassification = findClassification(nextClassificationRows, dbDetailCostCenter);
            if (matchedDbClassification) {
              costCenterId = matchedDbClassification.classificationId;
              costCenter = matchedDbClassification.display;
            } else {
              costCenter = dbDetailCostCenter;
            }
          }
        }

        if (!costCenterId || costCenterId === '-1' || costCenterId === '0') {
          const headerCostCenterId = String(data?.costCenterID ?? data?.costCenterId ?? data?.CostCenterID ?? data?.CostCenterId ?? '');
          if (headerCostCenterId && headerCostCenterId !== '-1' && headerCostCenterId !== '0') {
            const matchedHeaderClassification = findClassification(nextClassificationRows, headerCostCenterId);
            if (matchedHeaderClassification) {
              costCenterId = matchedHeaderClassification.classificationId;
              costCenter = matchedHeaderClassification.display;
            }
          }
        }

        return {
          id: Date.now() + index,
          journalDetailId: String(detail?.journalEntryDetailID ?? detail?.journalEntryDetailId ?? detail?.detailID ?? detail?.detailId ?? ''),
          selected: false,
          accountTitleId: accountTitle?.accountTitleId || String(detail?.accountTitleID ?? detail?.accountTitleId ?? ''),
          costUnitId: String(detail?.costUnitID ?? detail?.costUnitId ?? costUnit?.costUnitId ?? ''),
          costCenterId,
          accountCode: accountTitle?.code || '',
          accountTitle: accountTitle?.description || '',
          subsidiary: costUnit?.display || detail?.businessUnit || detail?.BusinessUnit || '',
          costCenter: costCenter,
          debit: Number(detail?.debit ?? 0) > 0 ? String(detail.debit) : '',
          credit: Number(detail?.credit ?? 0) > 0 ? String(detail.credit) : '',
          remarks: detailRemarks,
        };
      })
      : createDefaultJournalLines();

    setHeader((current) => ({
      ...current,
      status: getField(data, ['statusLabel', 'StatusLabel']) || 'Pending',
      transactionNo: String(data?.entryNumber || ''),
      transactionDate: String(data?.entryDate || '').slice(0, 10) || current.transactionDate,
      bookId: resolvedBook?.bookId || String(data?.bookID ?? data?.bookId ?? current.bookId),
      ledgerBook: resolvedBook?.display || current.ledgerBook,
      referenceId: Number(data?.referenceType ?? data?.ReferenceType) === 32768 ? String(data?.referenceID ?? data?.referenceId ?? '') : '',
      referenceType: getJournalEntryReferenceTypeLabel(data, current.referenceType),
      referenceNo: String(data?.referenceNo || ''),
      cancellationRemarks: String(data?.cancellationReason ?? data?.CancellationReason ?? data?.cancellationRemarks ?? data?.CancellationRemarks ?? current.cancellationRemarks ?? ''),
      company: getField(data, ['companyName', 'CompanyName']) || current.company,
      companyAddress: getField(data, ['address', 'Address', 'companyAddress', 'CompanyAddress']) || current.companyAddress,
      companyTinNumber: getField(data, ['tinNumber', 'TinNumber', 'tinnumber', 'TINNumber', 'TIN']) || current.companyTinNumber,
      remarks: String(data?.remarks || ''),
    }));
    setLines(nextLines);

    const createdName = getField(data, ['createdByName', 'CreatedByName']) || getField(data, ['createdBy', 'CreatedBy']);
    const createdDate = data?.createDate ?? data?.CreateDate ?? data?.createdDate ?? data?.CreatedDate;
    const modifiedName = getField(data, ['lastUpdatedByName', 'LastUpdatedByName']) || getField(data, ['lastModifiedBy', 'LastModifiedBy', 'lastUpdatedBy', 'LastUpdatedBy']);
    const modifiedDate = data?.lastUpdateDate ?? data?.LastUpdateDate ?? data?.lastModifiedDate ?? data?.LastModifiedDate;
    const statusLabel = getField(data, ['statusLabel', 'StatusLabel']) || 'Pending';
    const postedDate = data?.postedDate ?? data?.PostedDate;
    const postedName = getField(data, ['postedByName', 'PostedByName'])
      || (isMeaningfulAuditDate(postedDate) ? modifiedName : '');
    const postedCancelled = statusLabel === 'Posted' && postedName && isMeaningfulAuditDate(postedDate)
      ? { name: postedName, at: postedDate }
      : statusLabel === 'Cancelled' && modifiedName && isMeaningfulAuditDate(modifiedDate)
        ? { name: modifiedName, at: modifiedDate }
        : null;

    setAuditTrail({
      created: createdName ? { name: createdName, at: createdDate } : null,
      modified: modifiedName ? { name: modifiedName, at: modifiedDate } : null,
      postedCancelled,
    });
  };

  const loadJournalForReference = async (expenseId, signal) => {
    if (!expenseId) {
      return;
    }

    const token = getToken();
    const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_DAILY_EXPENSE_ENDPOINT}/${expenseId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    });

    if (response.status === 404) {
      setHeader((current) => ({
        ...current,
        status: '',
        transactionNo: '',
      }));
      setLines(createDefaultJournalLines());
      setAuditTrail(createDefaultAuditTrail());
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load journal entry for the selected daily expense.');
    }

    applyJournalEntryRecord(data);
  };

  const loadJournalById = async (journalEntryId, signal) => {
    if (!journalEntryId) {
      return;
    }

    const token = getToken();
    const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_ENDPOINT}/${journalEntryId}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to load the selected journal entry.');
    }

    applyJournalEntryRecord(data);
  };

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadInitialData = async () => {
      setIsLookupsLoading(true);
      setLookupError('');

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [employeeResponse, accountTitleResponse, costUnitResponse, bookResponse, companyResponse, referenceResponse, classificationResponse] = await Promise.all([
          fetch(buildApiUrl(CURRENT_EMPLOYEE_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(ACCOUNT_TITLES_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(COST_UNITS_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(BOOK_OF_ACCOUNTS_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(COMPANY_SEARCH_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(DAILY_EXPENSE_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(SYSTEM_CLASSIFICATIONS_ENDPOINT), { headers, signal: controller.signal }),
        ]);

        const employeeData = await employeeResponse.json().catch(() => ({}));
        const accountTitleData = await accountTitleResponse.json().catch(() => ({}));
        const costUnitData = await costUnitResponse.json().catch(() => ({}));
        const bookData = await bookResponse.json().catch(() => ({}));
        const companyData = await companyResponse.json().catch(() => ({}));
        const referenceData = await referenceResponse.json().catch(() => ({}));
        const classificationData = await classificationResponse.json().catch(() => ({}));

        if (employeeResponse.ok) {
          const employee = employeeData?.employee || employeeData?.data || employeeData;

          if (employee && typeof employee === 'object') {
            setEmployeeInfo(employee);
          }
        }

        if (!accountTitleResponse.ok) {
          throw new Error(accountTitleData?.message || 'Unable to load account title options.');
        }

        if (!costUnitResponse.ok) {
          throw new Error(costUnitData?.message || 'Unable to load cost unit options.');
        }

        if (!classificationResponse.ok) {
          throw new Error(classificationData?.message || 'Unable to load classification options.');
        }

        if (!bookResponse.ok) {
          throw new Error(bookData?.message || 'Unable to load ledger book options.');
        }

        if (!companyResponse.ok) {
          throw new Error(companyData?.message || 'Unable to load company options.');
        }

        if (!referenceResponse.ok && referenceResponse.status !== 403) {
          throw new Error(referenceData?.message || 'Unable to load daily expense references.');
        }

        const nextAccountTitleRows = getApiCollection(accountTitleData).map(normalizeAccountTitle).filter(Boolean);
        const nextCostUnitRows = getApiCollection(costUnitData).map(normalizeCostUnit).filter(Boolean);
        const nextClassificationRows = getApiCollection(classificationData).map(normalizeClassification).filter(Boolean);
        const nextBookRows = getApiCollection(bookData).map(normalizeBook).filter(Boolean);
        const nextCompanyRows = getApiCollection(companyData).map(normalizeCompany).filter(Boolean);
        const nextReferenceRows = referenceResponse.ok ? getApiCollection(referenceData)
          .map(normalizeDailyExpenseReference)
          .filter(Boolean)
          .filter((row) => row.status.toLowerCase() === 'approved') : [];

        setAccountTitleRows(nextAccountTitleRows);
        setCostUnitRows(nextCostUnitRows);
        setClassificationRows(nextClassificationRows);
        setBookRows(nextBookRows);
        setCompanyRows(nextCompanyRows);
        setReferenceRows(nextReferenceRows);

        setHeader((current) => {
          const nextHeader = { ...current };

          if (!current.bookId && nextBookRows.length > 0) {
            nextHeader.bookId = nextBookRows[0].bookId;
            nextHeader.ledgerBook = nextBookRows[0].display;
          }

          if (!current.company && nextCompanyRows.length > 0) {
            nextHeader.company = nextCompanyRows[0].description || nextCompanyRows[0].display || '';
            nextHeader.companyId = String(nextCompanyRows[0].companyId || '');
            nextHeader.companyAddress = nextCompanyRows[0].address || '';
            nextHeader.companyTinNumber = nextCompanyRows[0].tinNumber || '';
          }

          return nextHeader;
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLookupError(error.message || 'Unable to load journal entry lookups.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLookupsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedJournalEntry || !selectedExpense) {
      return;
    }

    const selectedReferenceId = String(selectedExpense?.expenseId || '');
    const selectedReferenceNo = String(selectedExpense?.referenceNo || '');

    setHeader((current) => ({
      ...current,
      referenceId: selectedReferenceId || current.referenceId,
      referenceNo: selectedReferenceNo || current.referenceNo,
      referenceType: '',
    }));
  }, [selectedExpense]);

  useEffect(() => {
    if (selectedJournalEntry || !header.referenceId || accountTitleRows.length === 0 || costUnitRows.length === 0 || classificationRows.length === 0) {
      return;
    }

    const controller = new AbortController();

    loadJournalForReference(header.referenceId, controller.signal).catch((error) => {
      if (error.name !== 'AbortError') {
        setActionError(error.message || 'Unable to load journal entry details.');
      }
    });

    return () => controller.abort();
  }, [selectedJournalEntry, header.referenceId, accountTitleRows, costUnitRows, classificationRows, bookRows]);

  useEffect(() => {
    const journalEntryId = selectedJournalEntry?.journalEntryId || selectedJournalEntry?.journalEntryID || 0;

    if (!journalEntryId || accountTitleRows.length === 0 || costUnitRows.length === 0 || classificationRows.length === 0) {
      return;
    }

    const controller = new AbortController();

    loadJournalById(journalEntryId, controller.signal).catch((error) => {
      if (error.name !== 'AbortError') {
        setActionError(error.message || 'Unable to load the selected journal entry.');
      }
    });

    return () => controller.abort();
  }, [selectedJournalEntry, accountTitleRows, costUnitRows, classificationRows, bookRows]);

  useEffect(() => {
    setIsEditingDetail(false);
    setActionMessage('');
    setActionError('');
    setSavedJournalEntryId(Number(selectedJournalEntry?.journalEntryId ?? selectedJournalEntry?.journalEntryID ?? 0));
  }, [selectedJournalEntry]);

  const auditUserName = getAuditEmployeeName(employeeInfo);
  const createdAuditStamp = resolveAuditStamp(auditTrail.created);
  const modifiedAuditStamp = resolveAuditStamp(auditTrail.modified);
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
  const signedVarianceLabel = varianceLabel;
  const selectedJournalEntryId = Number(selectedJournalEntry?.journalEntryId ?? selectedJournalEntry?.journalEntryID ?? 0);
  const activeJournalEntryId = selectedJournalEntryId || savedJournalEntryId;
  const isExistingJournalEntry = activeJournalEntryId > 0;
  const normalizedStatus = normalizeJournalStatus(header.status);
  const displayStatus = header.transactionNo ? (normalizedStatus || 'Pending') : '';
  const isPosted = normalizedStatus === 'Posted';
  const isCancelled = normalizedStatus === 'Cancelled';
  const isLocked = isPosted || isCancelled;
  const isReadOnlyDetail = isExistingJournalEntry && (!isEditingDetail || isLocked);
  const selectedLineCount = lines.filter((line) => line.selected).length;

  const clearActionFeedback = () => {
    setActionMessage('');
    setActionError('');
  };

  const updateHeader = (field, value) => {
    setHeader((current) => {
      if (field === 'bookId') {
        const selectedBook = findBook(bookRows, value);

        return {
          ...current,
          bookId: selectedBook?.bookId || value,
          ledgerBook: selectedBook?.display || current.ledgerBook,
        };
      }

      if (field === 'referenceId') {
        const selectedReference = referenceRows.find((row) => row.expenseId === value);

        return {
          ...current,
          referenceId: value,
          referenceNo: selectedReference?.referenceNo || '',
          referenceType: '',
        };
      }

      if (field === 'company') {
        const selectedCompany = findCompany(companyRows, value);

        return {
          ...current,
          company: selectedCompany?.description || value,
          companyId: String(selectedCompany?.companyId || ''),
          companyAddress: selectedCompany?.address || '',
          companyTinNumber: selectedCompany?.tinNumber || '',
        };
      }

      return { ...current, [field]: value };
    });
  };

  const updateLine = (lineId, field, value) => {
    const nextValue = field === 'debit' || field === 'credit'
      ? sanitizeAmountInput(value)
      : value;

    setLines((current) => {
      let shouldAddNextLine = false;
      const nextLines = current.map((line, index) => {
        if (line.id !== lineId) {
          return line;
        }

        const nextLine = { ...line, [field]: nextValue };

        if (field === 'accountCode' || field === 'accountTitle' || field === 'accountTitleId') {
          const resolvedAccountTitle = findAccountTitle(accountTitleRows, field === 'accountTitleId' ? value : nextLine[field]);

          if (resolvedAccountTitle) {
            nextLine.accountTitleId = resolvedAccountTitle.accountTitleId;
            nextLine.accountCode = resolvedAccountTitle.code;
            nextLine.accountTitle = resolvedAccountTitle.description;
          } else if (field === 'accountCode' || field === 'accountTitle') {
            nextLine.accountTitleId = '';
          }
        }

        if (field === 'subsidiary' || field === 'costUnitId') {
          const resolvedCostUnit = findCostUnit(costUnitRows, field === 'costUnitId' ? value : nextLine[field]);

          if (resolvedCostUnit) {
            nextLine.costUnitId = resolvedCostUnit.costUnitId;
            nextLine.subsidiary = resolvedCostUnit.display;
          } else if (field === 'subsidiary') {
            nextLine.costUnitId = '';
          }
        }

        if (field === 'costCenter' || field === 'costCenterId') {
          const resolvedClassification = findClassification(classificationRows, field === 'costCenterId' ? value : nextLine[field]);

          if (resolvedClassification) {
            nextLine.costCenterId = resolvedClassification.classificationId;
            nextLine.costCenter = resolvedClassification.display;
          } else if (field === 'costCenter') {
            nextLine.costCenterId = '';
          }
        }

        shouldAddNextLine = (
          index === current.length - 1
          && (field === 'debit' || field === 'credit')
          && parseAmount(nextValue) > 0
        );

        return nextLine;
      });

      return shouldAddNextLine
        ? [...nextLines, createBlankJournalLine(createNextJournalLineId(nextLines))]
        : nextLines;
    });
  };

  const getLineLookupConfig = (lineId, field) => {
    if (field === 'accountCode' || field === 'accountTitle') {
      return {
        lineId,
        field,
        title: field === 'accountCode' ? 'Select Account Code' : 'Select Account Title',
        placeholder: 'Search code or description',
        rows: accountTitleRows.map((row) => ({
          id: row.accountTitleId,
          code: row.code,
          description: row.description,
          display: row.display,
          primary: field === 'accountCode' ? row.code : row.description,
          secondary: field === 'accountCode' ? row.description : row.code,
          selectField: 'accountTitleId',
          selectValue: row.accountTitleId,
        })),
      };
    }

    if (field === 'subsidiary') {
      return {
        lineId,
        field,
        title: 'Select Subsidiary',
        placeholder: 'Search code or description',
        rows: costUnitRows.map((row) => ({
          id: row.costUnitId,
          code: row.code,
          description: row.description,
          display: row.display,
          primary: row.code,
          secondary: row.description,
          selectField: 'costUnitId',
          selectValue: row.costUnitId,
        })),
      };
    }

    if (field === 'costCenter') {
      return {
        lineId,
        field,
        title: 'Select Cost Center',
        placeholder: 'Search code or description',
        rows: classificationRows.map((row) => ({
          id: row.classificationId,
          code: row.code,
          description: row.description,
          display: row.display,
          hierarchy: row.hierarchy,
          primary: row.code || row.display,
          secondary: row.description || row.hierarchy || row.display,
          selectField: 'costCenterId',
          selectValue: row.classificationId,
        })),
      };
    }

    return null;
  };

  const openLineLookup = (lineId, field) => {
    if (isReadOnlyDetail) {
      return;
    }

    const lookupConfig = getLineLookupConfig(lineId, field);

    if (!lookupConfig) {
      return;
    }

    setLineLookup(lookupConfig);
    setLineLookupSearch('');
  };

  const closeLineLookup = () => {
    setLineLookup(null);
    setLineLookupSearch('');
  };

  const selectLineLookupRow = (row) => {
    if (!lineLookup) {
      return;
    }

    updateLine(lineLookup.lineId, row.selectField, row.selectValue);
    closeLineLookup();
  };

  const buildJournalPayload = (journalEntryId = 0) => {
    const activeLines = lines.filter((line) => (
      String(line.accountCode || '').trim()
      || String(line.accountTitle || '').trim()
      || parseAmount(line.debit) > 0
      || parseAmount(line.credit) > 0
      || String(line.subsidiary || '').trim()
      || String(line.costCenter || '').trim()
    ));

    const isDailyExpenseEntry = Boolean(header.referenceId);

      if (!header.referenceNo) {
        throw new Error('Reference no. is required.');
      }

    if (!header.bookId) {
      throw new Error('Select a valid ledger book first.');
    }

    if (activeLines.length < 2) {
      throw new Error('Add at least two journal detail rows before saving.');
    }

    const unresolvedLine = activeLines.find((line) => !line.accountTitleId);

    if (unresolvedLine) {
      throw new Error('Each journal line must match a valid account title from the API list.');
    }

    return {
      endpoint: isDailyExpenseEntry ? JOURNAL_ENTRY_DAILY_EXPENSE_ENDPOINT : JOURNAL_ENTRY_ENDPOINT,
      isDailyExpenseEntry,
      payload: {
        ...(journalEntryId ? { JournalEntryID: Number(journalEntryId) } : {}),
        ...(isDailyExpenseEntry ? { ReferenceID: Number(header.referenceId) } : {}),
        ReferenceNo: header.referenceNo.trim(),
        EntryDate: header.transactionDate,
        BookID: Number(header.bookId),
        CompanyID: header.companyId ? Number(header.companyId) : null,
        CostCenterID: activeLines.find((line) => line.costCenterId)?.costCenterId
          ? Number(activeLines.find((line) => line.costCenterId).costCenterId)
          : null,
        Remarks: header.remarks.trim(),
        Details: activeLines.map((line) => ({
          ...(line.journalDetailId ? { JournalEntryDetailID: Number(line.journalDetailId) } : {}),
          AccountTitleID: Number(line.accountTitleId),
          Debit: parseAmount(line.debit),
          Credit: parseAmount(line.credit),
          CostUnitID: line.costUnitId ? Number(line.costUnitId) : null,
          CostCenterID: line.costCenterId ? Number(line.costCenterId) : null,
          Remarks: String(line.remarks || '').trim().slice(0, 200),
        })),
      },
    };
  };

  const postJournalEntryById = async (journalEntryId) => {
    if (!journalEntryId) {
      throw new Error('Save the journal entry before posting.');
    }

    const token = getToken();
    const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_ENDPOINT}/${journalEntryId}/post`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || 'Unable to post journal entry.');
    }

    return data;
  };

  const submitJournalEntry = async (mode = 'save') => {
    clearActionFeedback();

    if (isPosted) {
      setActionError('This journal entry is already posted.');
      return;
    }

    if (isCancelled) {
      setActionError('This journal entry is cancelled and cannot be saved.');
      return;
    }

    const validationErrors = validateJournalEntry(header, lines, { requireBalanced: mode === 'post' });

    if (validationErrors.length > 0) {
      setActionError(validationErrors.join(' '));
      return;
    }

    setIsSubmitting(true);

    try {
      const { endpoint, payload, isDailyExpenseEntry } = buildJournalPayload();
      const token = getToken();
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to save journal entry.');
      }

      const now = new Date();
      const nextJournalEntryId = Number(data?.journalEntryId ?? data?.journalEntryID ?? activeJournalEntryId ?? 0);
      let nextStatus = 'Pending';
      let postedAt = null;

      if (mode === 'post') {
        try {
          await postJournalEntryById(nextJournalEntryId);
          nextStatus = 'Posted';
          postedAt = new Date();
        } catch (error) {
          throw new Error(`Journal entry was saved, but posting failed: ${error.message || 'Unable to post journal entry.'}`);
        }
      }

      const savedHeader = {
        ...header,
        status: nextStatus,
        transactionNo: String(data?.entryNumber || ''),
        referenceNo: String(data?.referenceNo ?? header.referenceNo),
        referenceType: isDailyExpenseEntry ? 'Journal Entry' : '',
      };

      setSavedJournalEntryId(nextJournalEntryId);
      setHeader(savedHeader);
      setAuditTrail({
        created: { name: auditUserName || getUserDisplayName(user), at: now },
        modified: { name: auditUserName || getUserDisplayName(user), at: now },
        postedCancelled: postedAt ? { name: auditUserName || getUserDisplayName(user), at: postedAt } : null,
      });
      clearJournalDraftStorage();
      setActionMessage(
        mode === 'post'
          ? 'Journal entry posted successfully.'
          : 'Journal entry saved successfully.',
      );
      onSaved?.();
    } catch (error) {
      setActionError(error.message || 'Unable to save journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (header.transactionNo) {
      return;
    }
    await submitJournalEntry('save');
  };

  const handleUpdateDetail = async () => {
    clearActionFeedback();

    if (!activeJournalEntryId) {
      setActionError('Select a journal entry first.');
      return;
    }

    if (isLocked || isReadOnlyDetail) {
      setActionError('Posted or cancelled journal entries cannot be modified.');
      return;
    }

    const validationErrors = validateJournalEntry(header, lines);

    if (validationErrors.length > 0) {
      setActionError(validationErrors.join(' '));
      return;
    }

    setIsSubmitting(true);

    try {
      const { payload } = buildJournalPayload(activeJournalEntryId);
      const token = getToken();
      const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_ENDPOINT}/${activeJournalEntryId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to update journal entry.');
      }

      const now = new Date();
      setAuditTrail((current) => ({
        ...current,
        modified: { name: auditUserName || getUserDisplayName(user), at: now },
      }));
      setIsEditingDetail(false);
      setActionMessage(data?.message || 'Journal entry updated successfully.');
      onSaved?.();
    } catch (error) {
      setActionError(error.message || 'Unable to update journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executePostToLedger = async () => {
    clearActionFeedback();
    setShowPostConfirm(false);

    if (!activeJournalEntryId) {
      await submitJournalEntry('post');
      return;
    }

    setIsSubmitting(true);

    try {
      await postJournalEntryById(activeJournalEntryId);
      const postedAt = new Date();

      setHeader((current) => ({
        ...current,
        status: 'Posted',
      }));
      setAuditTrail((current) => ({
        ...current,
        modified: { name: auditUserName || getUserDisplayName(user), at: postedAt },
        postedCancelled: { name: auditUserName || getUserDisplayName(user), at: postedAt },
      }));
      setActionMessage('Journal entry posted successfully.');
      onSaved?.();
    } catch (error) {
      setActionError(error.message || 'Unable to post journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostToLedger = async () => {
    clearActionFeedback();

    if (!permissions.canPost) {
      setActionError('You do not have permission to post journal entries.');
      return;
    }

    if (isLocked) {
      setActionError('This journal entry cannot be posted.');
      return;
    }

    const validationErrors = validateJournalEntry(header, lines, { requireBalanced: true });

    if (validationErrors.length > 0) {
      setActionError(validationErrors.join(' '));
      return;
    }

    setShowPostConfirm(true);
  };

  const handlePrintVoucher = async () => {
    clearActionFeedback();

    if (!isExistingJournalEntry) {
      setActionError('Save the journal entry before printing.');
      return;
    }

    const activeLines = lines.filter((line) => (
      String(line.accountCode || '').trim()
      || String(line.accountTitle || '').trim()
      || parseAmount(line.debit) > 0
      || parseAmount(line.credit) > 0
    ));

    if (!activeJournalEntryId && activeLines.length === 0) {
      setActionError('Add at least one journal line before printing.');
      return;
    }

    setIsSubmitting(true);

    try {
      let printHeader = header;
      let printLines = lines;
      let printTotals = totals;

      if (activeJournalEntryId) {
        const token = getToken();
        const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_ENDPOINT}/${activeJournalEntryId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data) {
          printHeader = {
            ...header,
            status: getField(data, ['statusLabel', 'StatusLabel']) || header.status,
            transactionNo: String(data?.entryNumber ?? data?.EntryNumber ?? header.transactionNo ?? ''),
            transactionDate: String(data?.entryDate ?? data?.EntryDate ?? header.transactionDate ?? '').slice(0, 10) || header.transactionDate,
            referenceNo: String(data?.referenceNo ?? data?.ReferenceNo ?? header.referenceNo ?? ''),
            company: getField(data, ['companyName', 'CompanyName']) || header.company,
            companyAddress: getField(data, ['address', 'Address', 'companyAddress', 'CompanyAddress']) || header.companyAddress,
            companyTinNumber: getField(data, ['tinNumber', 'TinNumber', 'tinnumber', 'TINNumber', 'TIN']) || header.companyTinNumber,
            remarks: String(data?.remarks ?? data?.Remarks ?? header.remarks ?? ''),
          };

          if (Array.isArray(data?.details) && data.details.length > 0) {
            printLines = data.details.map((detail, index) => {
              const accountTitle = findAccountTitle(accountTitleRows, String(detail?.accountTitleID ?? detail?.accountTitleId ?? ''));
              const costUnit = findCostUnit(costUnitRows, String(detail?.costUnitID ?? detail?.costUnitId ?? ''));

              return {
                id: index + 1,
                accountCode: accountTitle?.code || String(detail?.accountCode ?? detail?.AccountCode ?? detail?.accountTitleID ?? detail?.accountTitleId ?? ''),
                accountTitle: accountTitle?.description || String(detail?.accountDescription ?? detail?.AccountDescription ?? ((detail?.accountTitleID ?? detail?.accountTitleId) ? 'Account Title ' + (detail?.accountTitleID ?? detail?.accountTitleId) : '')),
                subsidiary: costUnit?.display || detail?.businessUnit || detail?.BusinessUnit || '',
                debit: Number(detail?.debit ?? detail?.Debit ?? 0) > 0 ? String(detail?.debit ?? detail?.Debit) : '',
                credit: Number(detail?.credit ?? detail?.Credit ?? 0) > 0 ? String(detail?.credit ?? detail?.Credit) : '',
                remarks: String(detail?.remarks ?? detail?.Remarks ?? ''),
              };
            });
            printTotals = {
              debit: printLines.reduce((sum, line) => sum + parseAmount(line.debit), 0),
              credit: printLines.reduce((sum, line) => sum + parseAmount(line.credit), 0),
              variance: 0,
            };
            printTotals.variance = printTotals.debit - printTotals.credit;
          }
        }
      }

      const pdfBlob = buildJournalVoucherPdfBlob({
        header: printHeader,
        lines: printLines,
        totals: printTotals,
      });
      downloadVoucherPdf(pdfBlob, printHeader.transactionNo);
      setActionMessage(printHeader.transactionNo
        ? `PDF downloaded for ${printHeader.transactionNo}.`
        : 'PDF downloaded for unsaved draft voucher.');
    } catch (error) {
      setActionError(error.message || 'Unable to print voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const deleteSelected = () => {
    clearActionFeedback();

    if (!permissions.canDelete) {
      setActionError('You do not have permission to delete journal detail rows.');
      return;
    }

    if (isLocked || isReadOnlyDetail) {
      setActionError('Posted or cancelled journal entries cannot be modified.');
      return;
    }

    if (selectedLineCount === 0) {
      setActionError('Select at least one journal detail row to delete.');
      return;
    }

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
        </div>

      <div className="etr-journal-actions">
        {isExistingJournalEntry ? (
          <>
            {onBack ? <button type="button" onClick={onBack} disabled={isSubmitting}>Back</button> : null}
            <button
              type="button"
              onClick={() => setIsEditingDetail((current) => !current)}
              disabled={isSubmitting || isLocked || !permissions.canEdit}
              title={!permissions.canEdit ? 'Edit permission is required' : undefined}
            >
              {isEditingDetail ? 'Cancel Edit' : 'Edit'}
            </button>
            {isEditingDetail && !isLocked && permissions.canEdit ? (
              <button type="button" className="is-primary" onClick={handleUpdateDetail} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handlePostToLedger}
              disabled={isSubmitting || isLocked || !permissions.canPost}
              title={!permissions.canPost ? 'Post permission is required' : (!isBalanced ? 'Debit and credit must balance before posting' : undefined)}
            >
              {isSubmitting ? 'Posting...' : 'Post to Ledger'}
            </button>
            <button type="button" onClick={handlePrintVoucher} disabled={isSubmitting}>
              Print Voucher
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="is-primary"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isLocked || !permissions.canCreate || !!header.transactionNo}
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={handlePostToLedger}
              disabled={isSubmitting || isLocked || !permissions.canPost}
              title={!permissions.canPost ? 'Post permission is required' : (!isBalanced ? 'Debit and credit must balance before posting' : undefined)}
            >
              {isSubmitting ? 'Posting...' : 'Post to Ledger'}
            </button>
            <button
              type="button"
              onClick={handlePrintVoucher}
              disabled={true}
              title="Save the journal entry before printing"
            >
              Print Voucher
            </button>
          </>
        )}
      </div>
      </div>

      {actionMessage ? React.createElement('div', { className: 'etr-journal-action-message' }, actionMessage) : null}
      {actionError ? React.createElement('div', { className: 'etr-journal-action-message is-error' }, actionError) : null}
      {lookupError ? React.createElement('div', { className: 'etr-journal-action-message is-error' }, lookupError) : null}

      <div className="etr-journal-form-shell">
        <div className="etr-journal-content-column">
          <div className="etr-journal-main-stack">
            <div className="etr-journal-column">
              <section className="etr-journal-card">
                <div className="etr-journal-card-head">
                  <h2>General Info</h2>
                </div>

                <div className="etr-journal-form-grid two">
                  <label className="etr-journal-field">
                    <span>Transaction No.</span>
                    <input value={header.transactionNo} onChange={(event) => updateHeader('transactionNo', event.target.value)} placeholder="Generated by WebAPI" readOnly />
                  </label>
                  <label className="etr-journal-field">
                    <span>Transaction Date</span>
                    <DateTextInput value={header.transactionDate} onChange={(value) => updateHeader('transactionDate', value)} readOnly={isReadOnlyDetail} />
                  </label>
                  <label className="etr-journal-field is-wide">
                    <span>Ledger Book</span>
                    <select value={header.bookId} onChange={(event) => updateHeader('bookId', event.target.value)} disabled={isLookupsLoading || isReadOnlyDetail}>
                      <option value="">{isLookupsLoading ? 'Loading books...' : 'Select ledger book'}</option>
                      {bookRows.map((book) => (
                        <option key={book.bookId} value={book.bookId}>{book.display}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="etr-journal-card">
                <div className="etr-journal-card-head">
                  <h2>Reference Info</h2>
                </div>

                <div className="etr-journal-form-grid two">
                  <label className="etr-journal-field">
                    <span>Reference Type</span>
                    <EmptyDropdown label="Reference Type" />
                  </label>
                  <label className="etr-journal-field">
                    <span>Reference No</span>
                    <input
                      value={header.referenceNo}
                      onChange={(event) => updateHeader('referenceNo', event.target.value)}
                      placeholder={header.referenceId ? "Generated from reference" : "Enter reference number"}
                      readOnly={!!header.referenceId || isLocked}
                    />
                  </label>
                  <label className="etr-journal-field is-wide">
                    <span>Company</span>
                    <select value={header.companyId || header.company} onChange={(event) => updateHeader('company', event.target.value)} disabled={isLookupsLoading || isReadOnlyDetail}>
                      <option value="">{isLookupsLoading ? 'Loading companies...' : 'Select company'}</option>
                      {companyRows.map((company) => (
                        <option key={company.companyId} value={company.companyId}>
                          {company.display}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            </div>

            <div className="etr-journal-column etr-journal-column-narrow">
              <section className="etr-journal-card">
                <div className="etr-journal-card-head">
                  <h2>System Logs</h2>
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
                    <textarea value={header.cancellationRemarks || ''} rows={3} placeholder="No cancellation remarks" readOnly />
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
              <strong>{isBalanced ? 'Balanced entry' : ''}</strong>
              <span>
                {isBalanced
                  ? ''
                  : ''}
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
              <button
                type="button"
                onClick={deleteSelected}
                disabled={isSubmitting || isLocked || isReadOnlyDetail || !permissions.canDelete || selectedLineCount === 0}
                title={selectedLineCount === 0 ? 'Select at least one row to delete' : undefined}
              >
                Delete Selected
              </button>
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
                        disabled={isReadOnlyDetail}
                        aria-label="Select journal line"
                      />
                    </td>
                    {lineColumns.map((column) => (
                      <td key={column.key} className={column.numeric ? 'is-number' : ''}>
                        {isLineLookupField(column.key) ? (
                          <input
                            className="etr-journal-line-lookup-input"
                            value={line[column.key]}
                            onClick={() => openLineLookup(line.id, column.key)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openLineLookup(line.id, column.key);
                              }
                            }}
                            aria-label={column.label}
                            placeholder="Click to select"
                            disabled={isReadOnlyDetail}
                            readOnly
                          />
                        ) : (
                          <input
                            value={line[column.key]}
                            onChange={(event) => updateLine(line.id, column.key, event.target.value)}
                            inputMode={column.numeric ? 'decimal' : undefined}
                            aria-label={column.label}
                            placeholder={column.numeric ? '0.0000' : 'Click to select'}
                            readOnly={isReadOnlyDetail}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="etr-journal-field etr-journal-details-remarks">
            <span>Remarks</span>
            <textarea
              value={header.remarks}
              onChange={(event) => updateHeader('remarks', event.target.value)}
              rows={Math.min(Math.max(String(header.remarks || '').split('\n').length + Math.floor(String(header.remarks || '').length / 80), 2), 10)}
              readOnly={isReadOnlyDetail}
            />
          </label>
        </section>
      </div>

      <JournalLineLookupModal
        lookup={lineLookup}
        searchTerm={lineLookupSearch}
        onSearchChange={setLineLookupSearch}
        onSelect={selectLineLookupRow}
        onClose={closeLineLookup}
      />
      {showPostConfirm ? (
        <PostJournalEntryConfirmDialog
          isSubmitting={isSubmitting}
          onConfirm={executePostToLedger}
          onCancel={() => setShowPostConfirm(false)}
        />
      ) : null}
    </div>
  );
}

export default JournalEntryView;

