import React from 'react';

// API Configuration
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
export const ACCOUNT_TITLES_ENDPOINT = '/api/accounttitles';
export const CURRENT_EMPLOYEE_ENDPOINT = '/api/employees/current';
export const DAILY_EXPENSE_ENDPOINT = '/api/daily-expense';

// File Attachment Constants
export const ATTACHMENT_ACCEPT = 'image/*,application/pdf,.pdf';
export const ATTACHMENT_EXTENSION_PATTERN = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|pdf|png|tif|tiff|webp)$/i;
export const ATTACHMENT_IMAGE_EXTENSION_PATTERN = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|png|tif|tiff|webp)$/i;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENT_LABEL = '5 MB';

// Form Field Constraints
export const MAX_DESCRIPTION_LENGTH = 255;
export const MAX_DOCUMENT_REFERENCE_LENGTH = 50;
export const MAX_TIN_DIGITS = 14;

// Table Configuration
export const dailyExpenseColumns = [
  'Employee No',
  'Employee Name',
  'Date',
  'Reference No',
  'Receipt Date',
  'Expense Type',
  'TIN No',
  'OR/SI No',
  'Document No',
  'Description',
  'Amount',
  'Vat',
  'Total',
  'Attachment',
  'Status',
];

export const dailyExpenseFieldKeys = [
  'employeeNo',
  'employeeName',
  'date',
  'referenceNo',
  'receiptDate',
  'expenseType',
  'tinNo',
  'orSiNo',
  'documentNo',
  'description',
  'amount',
  'vat',
  'total',
  'attachment',
  'status',
];

// Initial Data
export const initialDailyExpenseRows = [
  {
    employeeNo: 'EMP-0017',
    employeeName: 'Dela Cruz, Juan',
    date: '2026-04-29',
    referenceNo: 'EXP-2026-0429-001',
    receiptDate: '2026-04-28',
    expenseType: '6100 - Transportation',
    expenseTypeId: '6100',
    tinNo: '123-456-789-00000',
    orSiNo: 'SI-009218',
    documentNo: 'DOC-58142',
    description: 'Client visit fare and parking',
    amount: '1,850.00',
    vat: '222.00',
    total: '2,072.0000',
    attachment: 'receipt-001.pdf',
    status: 'Pending',
  },
  {
    employeeNo: 'EMP-0042',
    employeeName: 'Santos, Maria',
    date: '2026-04-29',
    referenceNo: 'EXP-2026-0429-002',
    receiptDate: '2026-04-29',
    expenseType: '6200 - Meals',
    expenseTypeId: '6200',
    tinNo: '987-654-321-00000',
    orSiNo: 'OR-31874',
    documentNo: 'DOC-58143',
    description: 'Project meeting lunch',
    amount: '3,200.00',
    vat: '384.00',
    total: '3,584.0000',
    attachment: 'meal-or.jpg',
    status: 'Approved',
  },
  {
    employeeNo: 'EMP-0068',
    employeeName: 'Reyes, Carlo',
    date: '2026-04-28',
    referenceNo: 'EXP-2026-0428-006',
    receiptDate: '2026-04-27',
    expenseType: '6300 - Supplies',
    expenseTypeId: '6300',
    tinNo: '456-120-884-00000',
    orSiNo: 'SI-77105',
    documentNo: 'DOC-58131',
    description: 'Office printing supplies',
    amount: '5,460.00',
    vat: '655.20',
    total: '6,115.2000',
    attachment: 'supplies-si.pdf',
    status: 'Pending',
  },
];

export const emptyExpenseForm = {
  employeeNo: '',
  employeeName: '',
  date: '',
  referenceNo: '',
  receiptDate: '',
  expenseType: '',
  expenseTypeId: '',
  tinNo: '',
  orSiNo: '',
  documentNo: '',
  description: '',
  amount: '',
  vat: '',
  attachment: '',
};

// URL Builder
export function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

// Money Formatting
export function parseMoney(value) {
  return Number(String(value || '').replace(/,/g, '')) || 0;
}

export function formatMoney(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTotal(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

// Date Formatting
export function formatDateForTable(value) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${month}/${day}/${year}` : value;
}

export function toIsoDateInput(value) {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const [month, day, year] = String(value).split('/');
  return year && month && day
    ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    : '';
}

export function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isFutureIsoDate(value) {
  return Boolean(value) && value > getTodayIsoDate();
}

// Input Formatting
export function normalizeMoneyInput(value) {
  return String(value || '').replace(/,/g, '');
}

export function formatTinNo(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 9);
  const fourth = digits.slice(9, 14);

  return [first, second, third, fourth].filter(Boolean).join('-');
}

// File Attachment Validation
export function isAllowedAttachment(file) {
  if (!file) {
    return false;
  }

  return file.type.startsWith('image/')
    || file.type === 'application/pdf'
    || ATTACHMENT_EXTENSION_PATTERN.test(file.name);
}

export function isImageAttachment(file) {
  if (!file) {
    return false;
  }

  return file.type.startsWith('image/') || ATTACHMENT_IMAGE_EXTENSION_PATTERN.test(file.name);
}

export function formatAttachmentSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

// User Field Extraction
export function getUserField(user, fieldNames) {
  if (!user) {
    return '';
  }

  for (const fieldName of fieldNames) {
    const value = user[fieldName];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}

export function getEmployeeNo(user) {
  return getUserField(user, [
    'employeeNo',
    'employeeNumber',
    'empNo',
    'empNumber',
    'employeeId',
    'employeeID',
    'EmployeeNo',
    'EmployeeNumber',
    'EmpNo',
    'EmployeeId',
    'id',
    'userId',
    'username',
  ]);
}

export function getEmployeeName(user) {
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

// API Data Parsing
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

export function normalizeAccountTitle(row) {
  const accountTitleId = getUserField(row, ['accountTitleId', 'accountTitleID', 'AccountTitleID', 'AccountTitleId', 'id', 'Id']);
  const code = getUserField(row, ['code', 'Code', 'accountCode', 'AccountCode']);
  const description = getUserField(row, ['description', 'Description', 'accountDescription', 'AccountDescription', 'name', 'Name']);

  if (!code || !description) {
    return null;
  }

  return {
    accountTitleId,
    code,
    description,
  };
}

export function normalizeEmployee(row) {
  if (!row) {
    return null;
  }

  const employeeNo = getEmployeeNo(row);
  const employeeName = getEmployeeName(row);
  const employeeId = getUserField(row, ['employeeId', 'employeeID', 'EmployeeID', 'EmployeeId', 'id', 'Id']);

  if (!employeeNo && !employeeName) {
    return null;
  }

  return {
    employeeId,
    employeeNo,
    employeeName,
  };
}

export function getValidationMessage(data) {
  if (data?.errors) {
    return Object.values(data.errors).flat().filter(Boolean).join(' ');
  }

  return data?.message || 'Unable to save daily expense.';
}

// Reference Number Generation
export function getReferenceDateToken(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}-${month}${day}` : '0000-0000';
}

export function generateReferenceNo(rows, isoDate) {
  const dateToken = getReferenceDateToken(isoDate);
  const prefix = `EXP-${dateToken}-`;
  const nextSequence = rows.reduce((highestSequence, row) => {
    if (!row.referenceNo?.startsWith(prefix)) {
      return highestSequence;
    }

    const sequence = Number(row.referenceNo.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(highestSequence, sequence) : highestSequence;
  }, 0) + 1;

  return `${prefix}${String(nextSequence).padStart(3, '0')}`;
}

// Form Creation & Transformation
export function createExpenseForm(user, rows, isoDate = getTodayIsoDate()) {
  return {
    ...emptyExpenseForm,
    employeeNo: user ? getEmployeeNo(user) : '',
    employeeName: user ? getEmployeeName(user) : '',
    date: isoDate,
    referenceNo: generateReferenceNo(rows, isoDate),
    receiptDate: isoDate,
  };
}

export function createExpenseFormFromTransaction(transaction) {
  if (!transaction) {
    return { ...emptyExpenseForm };
  }

  return {
    ...emptyExpenseForm,
    employeeNo: transaction.employeeNo || '',
    employeeName: transaction.employeeName || '',
    date: toIsoDateInput(transaction.date),
    referenceNo: transaction.referenceNo || '',
    receiptDate: toIsoDateInput(transaction.receiptDate),
    expenseType: transaction.expenseType || '',
    expenseTypeId: transaction.expenseTypeId || '',
    tinNo: transaction.tinNo || '',
    orSiNo: transaction.orSiNo || '',
    documentNo: transaction.documentNo || '',
    description: transaction.description || '',
    amount: normalizeMoneyInput(transaction.amount),
    vat: normalizeMoneyInput(transaction.vat),
    attachment: transaction.attachment === 'No attachment' ? '' : transaction.attachment || '',
  };
}

export function createExpenseRowFromForm(formData, total, status = 'Pending') {
  return {
    employeeNo: formData.employeeNo.trim(),
    employeeName: formData.employeeName.trim(),
    date: formData.date,
    referenceNo: formData.referenceNo.trim(),
    receiptDate: formData.receiptDate,
    expenseType: formData.expenseType,
    expenseTypeId: formData.expenseTypeId,
    tinNo: formData.tinNo.trim(),
    orSiNo: formData.orSiNo.trim(),
    documentNo: formData.documentNo.trim(),
    description: formData.description.trim(),
    amount: formatMoney(parseMoney(formData.amount)),
    vat: formatMoney(parseMoney(formData.vat)),
    total: formatTotal(total),
    attachment: formData.attachment || 'No attachment',
    status,
  };
}

// Icon Components
export function ExpenseChevronIcon({ isOpen }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`etr-expense-chevron ${isOpen ? 'is-open' : ''}`}>
      <path d="M8 10 12 14 16 10" />
    </svg>
  );
}

// Form Field Component
export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  children,
  readOnly = false,
  required = false,
  placeholder = '',
  maxLength,
  onKeyDown,
  onPaste,
  inputMode,
}) {
  return (
    <label className={`etr-expense-field ${error ? 'has-error' : ''}`}>
      <span>
        {label}
      </span>
      {children || (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          aria-invalid={!!error}
          placeholder={placeholder}
          maxLength={maxLength}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          inputMode={inputMode}
        />
      )}
      {error ? <small>{error}</small> : null}
    </label>
  );
}
