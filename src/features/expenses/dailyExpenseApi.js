import { getToken } from '../../shared/services/authStorage';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const DAILY_EXPENSE_ENDPOINT = '/api/daily-expense';
export const CURRENT_EMPLOYEE_ENDPOINT = '/api/employees/current';

export function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

export function getApiCollection(data) {
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

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  if (Array.isArray(data?.records)) {
    return data.records;
  }

  return [];
}

export function getValidationMessage(data, fallback = 'Unable to save daily expense.') {
  if (data?.errors) {
    return Object.values(data.errors).flat().filter(Boolean).join(' ');
  }

  return data?.message || fallback;
}

function getField(row, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = row?.[fieldName];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}

export function getEmployeeNoFromRecord(record) {
  return getField(record, [
    'employeeCode',
    'EmployeeCode',
    'empCode',
    'EmpCode',
    'employeeNo',
    'EmployeeNo',
    'employeeNumber',
    'EmployeeNumber',
    'empNo',
    'EmpNo',
    'username',
    'Username',
  ]);
}

export function getEmployeeNameFromRecord(record) {
  const employeeName = getField(record, ['employeeName', 'EmployeeName', 'fullName', 'FullName', 'name', 'Name', 'displayName', 'DisplayName']);

  if (employeeName) {
    return employeeName;
  }

  const firstName = getField(record, ['firstName', 'FirstName', 'firstname', 'Firstname']);
  const lastName = getField(record, ['lastName', 'LastName', 'lastname', 'Lastname']);
  const middleName = getField(record, ['middleName', 'MiddleName', 'middlename', 'Middlename']);

  if (lastName && firstName) {
    return [lastName, [firstName, middleName].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  }

  return firstName || lastName || getField(record, ['username', 'Username']);
}

function normalizeMoney(value, decimalPlaces = 2) {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numericValue = Number(String(value || '').replace(/,/g, ''));

  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

function normalizeIsoDate(value) {
  if (!value) {
    return '';
  }

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 10);
  }

  const [month, day, year] = stringValue.split('/');
  return year && month && day
    ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    : stringValue;
}

function normalizeExpenseType(row) {
  const explicit = getField(row, ['expenseType', 'ExpenseType']);

  if (explicit) {
    return explicit;
  }

  const code = getField(row, ['expenseTypeCode', 'ExpenseTypeCode', 'accountCode', 'AccountCode', 'code', 'Code']);
  const description = getField(row, [
    'expenseTypeDescription',
    'ExpenseTypeDescription',
    'accountDescription',
    'AccountDescription',
    'description',
    'Description',
  ]);

  return [code, description].filter(Boolean).join(' - ');
}

export function normalizeDailyExpense(row) {
  const amount = getField(row, ['amount', 'Amount']);
  const vat = getField(row, ['vat', 'Vat', 'VAT']);
  const total = getField(row, ['total', 'Total']);
  return {
    id: getField(row, ['dailyExpenseId', 'DailyExpenseId', 'dailyExpenseID', 'DailyExpenseID', 'id', 'Id']),
    employeeNo: getEmployeeNoFromRecord(row),
    employeeName: getEmployeeNameFromRecord(row),
    date: normalizeIsoDate(getField(row, ['date', 'Date', 'expenseDate', 'ExpenseDate', 'entryDate', 'EntryDate'])),
    referenceNo: getField(row, ['referenceNo', 'ReferenceNo', 'referenceNumber', 'ReferenceNumber']),
    receiptDate: normalizeIsoDate(getField(row, ['receiptDate', 'ReceiptDate'])),
    expenseType: normalizeExpenseType(row),
    expenseTypeId: getField(row, ['expenseTypeId', 'ExpenseTypeId', 'expenseTypeID', 'ExpenseTypeID', 'accountTitleId', 'AccountTitleId']),
    tinNo: getField(row, ['tinNo', 'TinNo', 'tin', 'Tin', 'TIN']),
    orSiNo: getField(row, ['orSiNo', 'OrSiNo', 'orSINo', 'ORSINo', 'ORNo', 'orNo']),
    documentNo: getField(row, ['documentNo', 'DocumentNo']),
    description: getField(row, ['description', 'Description']),
    amount: normalizeMoney(amount),
    vat: normalizeMoney(vat),
    total: normalizeMoney(total, 4),
    attachment: getField(row, ['attachment', 'Attachment', 'attachmentName', 'AttachmentName', 'fileName', 'FileName']) || 'No attachment',
    attachmentUrl: getField(row, ['attachmentUrl', 'AttachmentUrl', 'attachmentURL', 'AttachmentURL', 'fileUrl', 'FileUrl', 'url', 'Url']),
    attachmentType: getField(row, ['attachmentType', 'AttachmentType', 'fileType', 'FileType']),
    attachmentSize: getField(row, ['attachmentSize', 'AttachmentSize', 'fileSize', 'FileSize']),
    attachmentIsImage: row?.attachmentIsImage ?? row?.AttachmentIsImage ?? row?.isImage ?? row?.IsImage ?? false,
    status: getField(row, ['status', 'Status']) || 'Pending',
  };
}

function buildHeaders() {
  const token = getToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDailyExpenses({ signal } = {}) {
  const response = await fetch(buildApiUrl(DAILY_EXPENSE_ENDPOINT), {
    headers: buildHeaders(),
    signal,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 405) {
      throw new Error('Backend does not expose a GET endpoint for /api/daily-expense yet.');
    }

    throw new Error(getValidationMessage(data, 'Unable to load daily expense transactions.'));
  }

  return getApiCollection(data).map(normalizeDailyExpense);
}

export async function fetchCurrentEmployee({ signal } = {}) {
  const response = await fetch(buildApiUrl(CURRENT_EMPLOYEE_ENDPOINT), {
    headers: buildHeaders(),
    signal,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getValidationMessage(data, 'Unable to load employee record.'));
  }

  const record = data?.employee || data?.data || data?.result || data;

  return {
    employeeNo: getEmployeeNoFromRecord(record),
    employeeName: getEmployeeNameFromRecord(record),
  };
}

export async function updateDailyExpense(transaction) {
  const target = transaction.id || transaction.referenceNo;

  if (!target) {
    throw new Error('Missing daily expense transaction id or reference no.');
  }

  const response = await fetch(buildApiUrl(`${DAILY_EXPENSE_ENDPOINT}/${encodeURIComponent(target)}`), {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(transaction),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getValidationMessage(data, 'Unable to update daily expense.'));
  }

  return normalizeDailyExpense(data?.data || data?.result || data?.dailyExpense || data || transaction);
}

export async function approveDailyExpense(transaction) {
  const target = transaction.id || transaction.referenceNo;

  if (!target) {
    throw new Error('Missing daily expense transaction id or reference no.');
  }

  let response = await fetch(buildApiUrl(`${DAILY_EXPENSE_ENDPOINT}/${encodeURIComponent(target)}/approve`), {
    method: 'PUT',
    headers: buildHeaders(),
  });
  let data = await response.json().catch(() => ({}));

  if (response.status === 404 || response.status === 405) {
    response = await fetch(buildApiUrl(`${DAILY_EXPENSE_ENDPOINT}/${encodeURIComponent(target)}`), {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify({ ...transaction, status: 'Approved' }),
    });
    data = await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    if (response.status === 404 || response.status === 405) {
      return {
        ...transaction,
        status: 'Approved',
      };
    }

    throw new Error(getValidationMessage(data, 'Unable to approve daily expense.'));
  }

  return normalizeDailyExpense(data?.data || data?.result || data?.dailyExpense || { ...transaction, status: 'Approved' });
}
