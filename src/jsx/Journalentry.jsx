import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getToken } from '../services/authStorage';
import { clearJournalDraftStorage } from '../services/journalDraftStorage';
import '../css/Journalentry.css';

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
  canPrint: false,
};

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

const MANAGER_PAGE_SIZE = 7;
const MAX_VISIBLE_PAGE_BUTTONS = 6;

function createBlankJournalLine(id = Date.now()) {
  return {
    id,
    selected: false,
    accountTitleId: '',
    costUnitId: '',
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
    canApprove: getJournalPermission(source, ['canApprove', 'CanApprove', 'approve', 'Approve', 'canPost', 'CanPost', 'post', 'Post', 'canPostToLedger', 'CanPostToLedger'], fullAccess),
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
  const companyId = getField(row, ['companyId', 'CompanyID', 'CompanyId', 'id', 'Id']);
  const code = getField(row, ['code', 'Code', 'companyCode', 'CompanyCode']);
  const description = getField(row, ['description', 'Description', 'name', 'Name', 'companyName', 'CompanyName']);

  if (!companyId && !description) {
    return null;
  }

  return {
    companyId: companyId || description,
    code,
    description,
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
    row.costUnitId === value
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
    row.companyId === value
    || row.code.toLowerCase() === normalizedValue
    || row.description.toLowerCase() === normalizedValue
    || row.display.toLowerCase() === normalizedValue
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

function getJournalSortValue(row, column) {
  if (column.numeric) {
    return Number(row[column.key] || 0);
  }

  if (column.key === 'entryDate' || column.key === 'createdDate' || column.key === 'lastModifiedDate') {
    return new Date(row[column.key]).getTime() || 0;
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

  if (lastName && firstName) {
    return [lastName, [firstName, middleName].filter(Boolean).join(' ')].filter(Boolean).join(', ');
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

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadRows = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [journalResponse, bookResponse, employeeResponse] = await Promise.all([
          fetch(buildApiUrl(JOURNAL_ENTRY_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(BOOK_OF_ACCOUNTS_ENDPOINT), { headers, signal: controller.signal }),
          fetch(buildApiUrl(EMPLOYEES_ENDPOINT), { headers, signal: controller.signal }),
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
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLoadError(error.message || 'Unable to load journal entries.');
          setEntryRows([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadRows();

    return () => controller.abort();
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

      // Tie-breaker: sort by journalEntryId descending (newest first)
      const firstId = Number(first.journalEntryId || 0);
      const secondId = Number(second.journalEntryId || 0);
      return secondId - firstId;
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
                <tr
                  key={row.id}
                  className={`etr-expense-clickable-row ${selectedDetailEntry?.journalEntryId === row.journalEntryId ? 'is-selected' : ''}`}
                  onClick={() => handleRowClick(row)}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                  title="Click to show details; double-click to open journal entry"
                >
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

            {detailError ? <div className="etr-journal-action-message is-error">{detailError}</div> : null}

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
  const [isReferenceTypeMenuOpen, setIsReferenceTypeMenuOpen] = useState(false);
  const [header, setHeader] = useState(createDefaultJournalHeader);
  const [lines, setLines] = useState(createDefaultJournalLines);
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
    const resolvedBook = findBook(nextBookRows, String(data?.bookID ?? data?.bookId ?? ''));
    const nextLines = Array.isArray(data?.details) && data.details.length > 0
      ? data.details.map((detail, index) => {
        const accountTitle = findAccountTitle(nextAccountTitleRows, String(detail?.accountTitleID ?? detail?.accountTitleId ?? ''));
        const costUnit = findCostUnit(nextCostUnitRows, String(detail?.costUnitID ?? detail?.costUnitId ?? ''));

        const rawRemarks = String(detail?.remarks || '');
        const parts = rawRemarks.split(' | ');
        let costCenter = '';
        let detailRemarks = rawRemarks;

        if (parts.length > 1) {
          const firstPart = parts[0];
          const matchedClassification = findClassification(nextClassificationRows, firstPart);
          if (matchedClassification) {
            costCenter = matchedClassification.display;
            detailRemarks = parts.slice(1).join(' | ');
          }
        } else if (parts.length === 1 && parts[0]) {
          const matchedClassification = findClassification(nextClassificationRows, parts[0]);
          if (matchedClassification) {
            costCenter = matchedClassification.display;
            detailRemarks = '';
          }
        }

        return {
          id: Date.now() + index,
          journalDetailId: String(detail?.journalEntryDetailID ?? detail?.journalEntryDetailId ?? detail?.detailID ?? detail?.detailId ?? ''),
          selected: false,
          accountTitleId: accountTitle?.accountTitleId || String(detail?.accountTitleID ?? detail?.accountTitleId ?? ''),
          costUnitId: costUnit?.costUnitId || String(detail?.costUnitID ?? detail?.costUnitId ?? ''),
          accountCode: accountTitle?.code || '',
          accountTitle: accountTitle?.description || '',
          subsidiary: costUnit?.display || '',
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
      remarks: String(data?.remarks || ''),
    }));
    setLines(nextLines);

    const createdName = getField(data, ['createdByName', 'CreatedByName']) || getField(data, ['createdBy', 'CreatedBy']);
    const createdDate = data?.createDate ?? data?.CreateDate ?? data?.createdDate ?? data?.CreatedDate;
    const modifiedName = getField(data, ['lastUpdatedByName', 'LastUpdatedByName']) || getField(data, ['lastModifiedBy', 'LastModifiedBy', 'lastUpdatedBy', 'LastUpdatedBy']);
    const modifiedDate = data?.lastUpdateDate ?? data?.LastUpdateDate ?? data?.lastModifiedDate ?? data?.LastModifiedDate;

    setAuditTrail({
      created: createdName ? { name: createdName, at: createdDate } : null,
      modified: modifiedName ? { name: modifiedName, at: modifiedDate } : null,
      postedCancelled: null,
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
  const isExistingJournalEntry = selectedJournalEntryId > 0;
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
        };
      }

      return { ...current, [field]: value };
    });
  };

  const updateLine = (lineId, field, value) => {
    setLines((current) => {
      let shouldAddNextLine = false;
      const nextLines = current.map((line, index) => {
        if (line.id !== lineId) {
          return line;
        }

        const nextLine = { ...line, [field]: value };

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

        if (field === 'costCenter') {
          const resolvedClassification = findClassification(classificationRows, nextLine[field]);

          if (resolvedClassification) {
            nextLine.costCenter = resolvedClassification.display;
          }
        }

        shouldAddNextLine = (
          index === current.length - 1
          && (field === 'debit' || field === 'credit')
          && parseAmount(value) > 0
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
          selectField: 'costCenter',
          selectValue: row.display,
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
        Remarks: header.remarks.trim(),
        Details: activeLines.map((line) => ({
          ...(line.journalDetailId ? { JournalEntryDetailID: Number(line.journalDetailId) } : {}),
          AccountTitleID: Number(line.accountTitleId),
          Debit: parseAmount(line.debit),
          Credit: parseAmount(line.credit),
          CostUnitID: line.costUnitId ? Number(line.costUnitId) : null,
          Remarks: [line.costCenter, line.remarks].filter(Boolean).join(' | ').slice(0, 200),
        })),
      },
    };
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
      const savedHeader = {
        ...header,
        status: 'Pending',
        transactionNo: String(data?.entryNumber || ''),
        referenceNo: String(data?.referenceNo ?? header.referenceNo),
        referenceType: isDailyExpenseEntry ? 'Journal Entry' : '',
      };

      setHeader(savedHeader);
      setAuditTrail({
        created: { name: auditUserName || getUserDisplayName(user), at: now },
        modified: { name: auditUserName || getUserDisplayName(user), at: now },
        postedCancelled: null,
      });
      clearJournalDraftStorage();
      setActionMessage(
        mode === 'post'
          ? 'Journal entry saved successfully.'
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

    if (!selectedJournalEntryId) {
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
      const { payload } = buildJournalPayload(selectedJournalEntryId);
      const token = getToken();
      const response = await fetch(buildApiUrl(`${JOURNAL_ENTRY_ENDPOINT}/${selectedJournalEntryId}`), {
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

  const handlePostToLedger = async () => {
    clearActionFeedback();

    const confirmed = window.confirm('Save this journal entry to the WebAPI?');

    if (!confirmed) {
      return;
    }

    await submitJournalEntry('post');
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
              disabled={isSubmitting || isLocked || !permissions.canApprove}
              title={!isBalanced ? 'Debit and credit must balance before posting' : undefined}
            >
              {isSubmitting ? 'Posting...' : 'Post to Ledger'}
            </button>
            <button type="button" onClick={handlePrintVoucher} disabled={isSubmitting || !permissions.canPrint}>
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
              disabled={isSubmitting || isLocked || !permissions.canApprove}
              title={!isBalanced ? 'Debit and credit must balance before posting' : undefined}
            >
              {isSubmitting ? 'Posting...' : 'Post to Ledger'}
            </button>
            <button type="button" onClick={handlePrintVoucher} disabled={isSubmitting || !permissions.canPrint}>
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
                    <div
                      className="etr-journal-empty-dropdown"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          setIsReferenceTypeMenuOpen(false);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="etr-journal-empty-dropdown-button"
                        onClick={() => setIsReferenceTypeMenuOpen((current) => !current)}
                        aria-haspopup="listbox"
                        aria-expanded={isReferenceTypeMenuOpen}
                        aria-label="Reference Type"
                      >
                        <span aria-hidden="true">&nbsp;</span>
                      </button>
                      {isReferenceTypeMenuOpen ? (
                        <div
                          className="etr-journal-empty-dropdown-menu"
                          role="listbox"
                          tabIndex={-1}
                          aria-label="No reference types available"
                        />
                      ) : null}
                    </div>
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
                    <select value={header.company} onChange={(event) => updateHeader('company', event.target.value)} disabled={isLookupsLoading || isReadOnlyDetail}>
                      <option value="">{isLookupsLoading ? 'Loading companies...' : 'Select company'}</option>
                      {companyRows.map((company) => (
                        <option key={company.companyId} value={company.description}>
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
                    <textarea rows={3} placeholder="No cancellation remarks" readOnly={isReadOnlyDetail} />
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
            <textarea value={header.remarks} onChange={(event) => updateHeader('remarks', event.target.value)} rows={3} readOnly={isReadOnlyDetail} />
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
    </div>
  );
}

export default JournalEntryView;

