import React, { useEffect, useRef, useState } from 'react';
import { getToken } from '../../shared/services/authStorage';
import {
  buildApiUrl,
  DAILY_EXPENSE_ENDPOINT,
  getApiCollection,
  getValidationMessage,
  normalizeDailyExpense,
} from './dailyExpenseApi';
import './ExpenseEntry.css';

const ACCOUNT_TITLES_ENDPOINT = '/api/accounttitles';
const CURRENT_EMPLOYEE_ENDPOINT = '/api/employees/current';
const ATTACHMENT_ACCEPT = 'image/*,application/pdf,.pdf';
const ATTACHMENT_EXTENSION_PATTERN = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|pdf|png|tif|tiff|webp)$/i;
const ATTACHMENT_IMAGE_EXTENSION_PATTERN = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|png|tif|tiff|webp)$/i;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENT_LABEL = '5 MB';
const MAX_DESCRIPTION_LENGTH = 255;
const MAX_DOCUMENT_REFERENCE_LENGTH = 50;
const MAX_TIN_DIGITS = 14;

export const dailyExpenseColumns = [
  'Status',
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
];

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

export const dailyExpenseFieldKeys = [
  'status',
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
];

const emptyExpenseForm = {
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



function parseMoney(value) {
  return Number(String(value || '').replace(/,/g, '')) || 0;
}

function formatMoney(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTotal(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function formatDateForTable(value) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${month}/${day}/${year}` : value;
}

function toIsoDateInput(value) {
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

function normalizeMoneyInput(value) {
  return String(value || '').replace(/,/g, '');
}

function formatTinNo(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 9);
  const fourth = digits.slice(9, 14);

  return [first, second, third, fourth].filter(Boolean).join('-');
}

function isAllowedAttachment(file) {
  if (!file) {
    return false;
  }

  return file.type.startsWith('image/')
    || file.type === 'application/pdf'
    || ATTACHMENT_EXTENSION_PATTERN.test(file.name);
}

function isImageAttachment(file) {
  if (!file) {
    return false;
  }

  return file.type.startsWith('image/') || ATTACHMENT_IMAGE_EXTENSION_PATTERN.test(file.name);
}

function formatAttachmentSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isFutureIsoDate(value) {
  return Boolean(value) && value > getTodayIsoDate();
}

function getUserField(user, fieldNames) {
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

function getEmployeeNo(user) {
  return getUserField(user, [
    'employeeCode',
    'EmployeeCode',
    'empCode',
    'EmpCode',
    'employeeNo',
    'employeeNumber',
    'empNo',
    'empNumber',
    'EmployeeNo',
    'EmployeeNumber',
    'EmpNo',
    'username',
  ]);
}

function getEmployeeName(user) {
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

function normalizeAccountTitle(row) {
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

function normalizeEmployee(row) {
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

function getReferenceDateToken(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}-${month}${day}` : '0000-0000';
}

function generateReferenceNo(rows, isoDate) {
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

function createExpenseForm(user, rows, isoDate = getTodayIsoDate()) {
  return {
    ...emptyExpenseForm,
    employeeNo: user ? getEmployeeNo(user) : '',
    employeeName: user ? getEmployeeName(user) : '',
    date: isoDate,
    referenceNo: generateReferenceNo(rows, isoDate),
    receiptDate: isoDate,
  };
}

function createExpenseFormFromTransaction(transaction) {
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

function createExpenseRowFromForm(formData, total, status = 'Pending', attachment = null) {
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
    attachmentUrl: attachment?.url || '',
    attachmentType: attachment?.type || '',
    attachmentSize: attachment?.size || '',
    attachmentIsImage: Boolean(attachment?.isImage),
    status,
  };
}

function ExpenseChevronIcon({ isOpen }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`etr-expense-chevron ${isOpen ? 'is-open' : ''}`}>
      <path d="M8 10 12 14 16 10" />
    </svg>
  );
}

function FormField({
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

export function ExpenseEntryView({
  user,
  expenseRows,
  selectedTransaction = null,
  onTransactionSaved,
  onApproveTransaction,
  onBackToManager,
}) {
  const openedDateRef = useRef(getTodayIsoDate());
  const attachmentInputRef = useRef(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [accountTitleRows, setAccountTitleRows] = useState([]);
  const [isAccountTitlesLoading, setIsAccountTitlesLoading] = useState(false);
  const [accountTitlesError, setAccountTitlesError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [formData, setFormData] = useState(() => createExpenseForm(null, expenseRows, openedDateRef.current));
  const [errors, setErrors] = useState({});
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isExpenseTypeLookupOpen, setIsExpenseTypeLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [expenseTypeQuery, setExpenseTypeQuery] = useState('');
  const [page, setPage] = useState(1);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const isExistingTransaction = Boolean(selectedTransaction);
  const isApprovedTransaction = selectedTransaction?.status === 'Approved';
  const isFormReadOnly = isExistingTransaction && !isEditingExisting;
  const total = parseMoney(formData.amount) + parseMoney(formData.vat);
  const pageSize = 2;
  const totalPages = Math.max(1, Math.ceil(expenseRows.length / pageSize));
  const pagedRows = expenseRows.slice((page - 1) * pageSize, page * pageSize);
  const filteredLookupRows = expenseRows.filter((row) => {
    const query = lookupQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [row.referenceNo, row.employeeNo, row.employeeName, row.documentNo]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });
  const filteredExpenseTypeRows = accountTitleRows.filter((row) => {
    const query = expenseTypeQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [row.code, row.description]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadAccountTitles = async () => {
      setIsAccountTitlesLoading(true);
      setAccountTitlesError('');

      try {
        const response = await fetch(buildApiUrl(ACCOUNT_TITLES_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load account titles.');
        }

        setAccountTitleRows(getApiCollection(data).map(normalizeAccountTitle).filter(Boolean));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAccountTitleRows([]);
          setAccountTitlesError(error.message || 'Unable to load account titles.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsAccountTitlesLoading(false);
        }
      }
    };

    loadAccountTitles();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadCurrentEmployee = async () => {
      setEmployeeError('');

      try {
        const response = await fetch(buildApiUrl(CURRENT_EMPLOYEE_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load employee record.');
        }

        const employee = normalizeEmployee(data?.employee || data?.data || data);

        if (!employee) {
          throw new Error('Employee record has no employee no or employee name.');
        }

        setEmployeeInfo(employee);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setEmployeeInfo(null);
          setEmployeeError(error.message || 'Unable to load employee record.');
        }
      }
    };

    loadCurrentEmployee();

    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (selectedTransaction) {
      return;
    }

    setFormData((current) => ({
      ...current,
      employeeNo: employeeInfo ? getEmployeeNo(employeeInfo) : '',
      employeeName: employeeInfo ? getEmployeeName(employeeInfo) : '',
      referenceNo: generateReferenceNo(expenseRows, current.date || openedDateRef.current),
    }));
  }, [employeeInfo, user, expenseRows, selectedTransaction]);

  useEffect(() => {
    if (selectedTransaction) {
      setFormData(createExpenseFormFromTransaction(selectedTransaction));
      setAttachmentPreview(selectedTransaction.attachmentUrl ? {
        name: selectedTransaction.attachment === 'No attachment' ? 'Attachment' : selectedTransaction.attachment,
        size: selectedTransaction.attachmentSize || '',
        type: selectedTransaction.attachmentType || 'Document',
        url: selectedTransaction.attachmentUrl,
        isImage: Boolean(selectedTransaction.attachmentIsImage),
      } : null);
      setIsEditingExisting(false);
    } else {
      setFormData(createExpenseForm(employeeInfo, expenseRows, getTodayIsoDate()));
      setAttachmentPreview(null);
      setIsEditingExisting(false);
    }

    setErrors({});
    setSaveError('');
    setSaveMessage('');
    setIsAttachmentViewerOpen(false);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  }, [selectedTransaction?.referenceNo]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    
    // Validate employee name: prevent numbers
    if (name === 'employeeName') {
      // Remove any numbers from the input
      const cleanedValue = value.replace(/[0-9]/g, '');
      setFormData((current) => ({ ...current, [name]: cleanedValue }));
      
      // Show error if user tried to enter numbers
      if (cleanedValue !== value) {
        setErrors((current) => ({ ...current, [name]: 'Employee name cannot contain numbers.' }));
        // Clear error after 2 seconds
        setTimeout(() => {
          setErrors((current) => ({ ...current, [name]: '' }));
        }, 2000);
      } else {
        setErrors((current) => ({ ...current, [name]: '' }));
      }
    } else if (name === 'tinNo') {
      const digits = value.replace(/\D/g, '');
      const hasInvalidCharacters = /[^0-9-]/.test(value);
      const isTooLong = digits.length > MAX_TIN_DIGITS;

      setFormData((current) => ({ ...current, tinNo: formatTinNo(value) }));
      setErrors((current) => ({
        ...current,
        tinNo: hasInvalidCharacters
          ? 'TIN No can only contain numbers and dash (-).'
          : isTooLong
            ? `TIN No cannot exceed ${MAX_TIN_DIGITS} digits.`
            : '',
      }));
    } else if (name === 'orSiNo') {
      const hasInvalidCharacters = /[^a-zA-Z0-9-]/.test(value);
      const cleanedValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      const isTooLong = cleanedValue.length > MAX_DOCUMENT_REFERENCE_LENGTH;
      const formattedValue = cleanedValue.slice(0, MAX_DOCUMENT_REFERENCE_LENGTH);

      setFormData((current) => ({ ...current, orSiNo: formattedValue }));
      setErrors((current) => ({
        ...current,
        orSiNo: hasInvalidCharacters
          ? 'OR/SI No can only contain letters, numbers, and dash (-).'
          : isTooLong
            ? `OR/SI No cannot exceed ${MAX_DOCUMENT_REFERENCE_LENGTH} characters.`
            : '',
      }));
    } else if (name === 'documentNo') {
      const hasInvalidCharacters = /[^a-zA-Z0-9-]/.test(value);
      const cleanedValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      const isTooLong = cleanedValue.length > MAX_DOCUMENT_REFERENCE_LENGTH;
      const formattedValue = cleanedValue.slice(0, MAX_DOCUMENT_REFERENCE_LENGTH);

      setFormData((current) => ({ ...current, documentNo: formattedValue }));
      setErrors((current) => ({
        ...current,
        documentNo: hasInvalidCharacters
          ? 'Document No can only contain letters, numbers, and dash (-).'
          : isTooLong
            ? `Document No cannot exceed ${MAX_DOCUMENT_REFERENCE_LENGTH} characters.`
            : '',
      }));
    } else if (name === 'amount' || name === 'vat') {
      const cleanedValue = value.replace(/[eE+-]/g, '');

      if (name === 'vat') {
        const amount = parseMoney(formData.amount);
        const vat = parseMoney(cleanedValue);

        setFormData((current) => ({ ...current, vat: cleanedValue }));
        setErrors((current) => ({
          ...current,
          vat: amount > 0 && vat > amount ? 'VAT cannot be higher than Amount.' : '',
        }));
      } else {
        const amount = parseMoney(cleanedValue);
        const vat = parseMoney(formData.vat);

        setFormData((current) => ({ ...current, amount: cleanedValue }));
        setErrors((current) => ({
          ...current,
          amount: '',
          vat: cleanedValue && vat > amount ? 'VAT cannot be higher than Amount.' : '',
        }));
      }
    } else if (name === 'description') {
      const isTooLong = value.length > MAX_DESCRIPTION_LENGTH;
      const formattedValue = value.slice(0, MAX_DESCRIPTION_LENGTH);

      setFormData((current) => ({ ...current, description: formattedValue }));
      setErrors((current) => ({
        ...current,
        description: isTooLong ? `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.` : '',
      }));
    } else if (name === 'date') {
      setFormData((current) => ({
        ...current,
        date: value,
        referenceNo: value ? generateReferenceNo(expenseRows, value) : '',
      }));
      setErrors((current) => ({
        ...current,
        date: isFutureIsoDate(value) ? 'Entry Date cannot be later than today.' : '',
      }));
    } else if (name === 'receiptDate') {
      setFormData((current) => ({ ...current, receiptDate: value }));
      setErrors((current) => ({
        ...current,
        receiptDate: isFutureIsoDate(value) ? 'Receipt Date cannot be later than today.' : '',
      }));
    } else {
      setFormData((current) => ({
        ...current,
        [name]: value,
      }));
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const blockInvalidMoneyInput = (event) => {
    if (['+', '-', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  };

  const blockInvalidMoneyPaste = (event) => {
    const pastedValue = event.clipboardData.getData('text');

    if (/[eE+-]/.test(pastedValue)) {
      event.preventDefault();
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.employeeNo.trim()) nextErrors.employeeNo = 'Employee no is required.';
    if (!formData.employeeName.trim()) nextErrors.employeeName = 'Employee name is required.';
    if (formData.employeeName && /[0-9]/.test(formData.employeeName)) nextErrors.employeeName = 'Employee name cannot contain numbers.';
    if (!formData.date) nextErrors.date = 'Entry date is required.';
    if (isFutureIsoDate(formData.date)) nextErrors.date = 'Entry Date cannot be later than today.';
    if (!formData.referenceNo.trim()) nextErrors.referenceNo = 'Reference no is required.';
    if (!formData.expenseType.trim() || !formData.expenseTypeId) nextErrors.expenseType = 'Select an expense type.';
    if (!formData.amount || parseMoney(formData.amount) <= 0) nextErrors.amount = 'Enter a valid amount.';
    if (!formData.receiptDate) nextErrors.receiptDate = 'Receipt date is required.';
    if (isFutureIsoDate(formData.receiptDate)) nextErrors.receiptDate = 'Receipt Date cannot be later than today.';
    if (!formData.description.trim()) nextErrors.description = 'Description is required.';
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) nextErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;

    const amount = parseMoney(formData.amount);
    const vat = parseMoney(formData.vat);
    if (vat > amount) nextErrors.vat = 'VAT cannot be higher than Amount.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const token = getToken();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const localRow = {
        ...selectedTransaction,
        ...createExpenseRowFromForm(formData, total, selectedTransaction?.status || 'Pending', attachmentPreview),
      };
      const payload = {
          id: selectedTransaction?.id,
          employeeNo: formData.employeeNo.trim(),
          employeeName: formData.employeeName.trim(),
          expenseDate: formData.date,
        referenceNo: formData.referenceNo.trim(),
        receiptDate: formData.receiptDate || null,
        orSINo: formData.orSiNo.trim(),
        documentNo: formData.documentNo.trim(),
        description: formData.description.trim(),
        amount: parseMoney(formData.amount),
        vat: parseMoney(formData.vat),
        total,
        tin: formData.tinNo.trim(),
        vendorID: null,
        expenseType: Number(formData.expenseTypeId),
        attachment: formData.attachment || '',
        status: localRow.status,
      };
      let data = {};
      let shouldUseLocalRow = false;

      if (isExistingTransaction) {
        const target = selectedTransaction.id || selectedTransaction.referenceNo;
        const response = await fetch(buildApiUrl(`${DAILY_EXPENSE_ENDPOINT}/${encodeURIComponent(target)}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        data = await response.json().catch(() => ({}));

        if (!response.ok && ![404, 405].includes(response.status)) {
          throw new Error(getValidationMessage(data));
        }

        shouldUseLocalRow = !response.ok;
      } else {
        const response = await fetch(buildApiUrl(DAILY_EXPENSE_ENDPOINT), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(getValidationMessage(data));
        }
      }

      const responseRow = data?.data || data?.result || data?.dailyExpense;
      const nextRow = responseRow && !shouldUseLocalRow
        ? { ...localRow, ...normalizeDailyExpense(responseRow) }
        : localRow;
      const nextRows = [nextRow, ...expenseRows];
      await onTransactionSaved?.(nextRow, { selectTransaction: isExistingTransaction });
      setPage(1);
      if (isExistingTransaction) {
        setIsEditingExisting(false);
      } else {
        setFormData(createExpenseForm(employeeInfo, nextRows, getTodayIsoDate()));
        setAttachmentPreview(null);
      }
      setErrors({});
      setIsAttachmentViewerOpen(false);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      setSaveMessage(data.message || (isExistingTransaction ? 'Daily expense updated successfully.' : 'Daily expense saved successfully.'));
    } catch (error) {
      setSaveError(error.message || 'Unable to save daily expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (selectedTransaction && onBackToManager) {
      onBackToManager();
      return;
    }

    setFormData(createExpenseForm(employeeInfo, expenseRows, getTodayIsoDate()));
    setErrors({});
    setSaveError('');
    setSaveMessage('');
    setIsAttachmentViewerOpen(false);
    setAttachmentPreview(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const handleApprove = async () => {
    if (!selectedTransaction) {
      return;
    }

    setIsApproving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      const approvedTransaction = await onApproveTransaction?.(selectedTransaction);
      setIsEditingExisting(false);
      setSaveMessage('Daily expense approved successfully.');

      if (approvedTransaction) {
        setFormData(createExpenseFormFromTransaction(approvedTransaction));
      }
    } catch (error) {
      setSaveError(error.message || 'Unable to approve daily expense.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSelectExpenseType = (row) => {
    if (!row.accountTitleId) {
      setErrors((current) => ({ ...current, expenseType: 'Selected account title has no AccountTitleID.' }));
      return;
    }

    setFormData((current) => ({
      ...current,
      expenseType: `${row.code} - ${row.description}`,
      expenseTypeId: row.accountTitleId,
    }));
    setErrors((current) => ({ ...current, expenseType: '' }));
    setExpenseTypeQuery('');
    setIsExpenseTypeLookupOpen(false);
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAllowedAttachment(file)) {
      event.target.value = '';
      setErrors((current) => ({
        ...current,
        attachment: 'Image or PDF only.',
      }));
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      event.target.value = '';
      setErrors((current) => ({
        ...current,
        attachment: `Attachment cannot exceed ${MAX_ATTACHMENT_LABEL}.`,
      }));
      return;
    }

    try {
      const url = await readFileAsDataUrl(file);

      setFormData((current) => ({ ...current, attachment: file.name }));
      setErrors((current) => ({ ...current, attachment: '' }));
      setAttachmentPreview({
        name: file.name,
        size: formatAttachmentSize(file.size),
        type: file.type || 'Document',
        url,
        isImage: isImageAttachment(file),
      });
      setIsAttachmentViewerOpen(false);
    } catch {
      event.target.value = '';
      setErrors((current) => ({
        ...current,
        attachment: 'Unable to read selected attachment.',
      }));
    }
  };

  const handleChooseAttachment = () => {
    attachmentInputRef.current?.click();
  };

  const handlePreviewAttachment = () => {
    if (!attachmentPreview?.url) {
      return;
    }

    if (attachmentPreview.isImage) {
      setIsAttachmentViewerOpen(true);
      return;
    }

    window.open(attachmentPreview.url, '_blank', 'noopener,noreferrer');
  };

  const handleRemoveAttachment = () => {
    setFormData((current) => ({ ...current, attachment: '' }));
    setIsAttachmentViewerOpen(false);
    setAttachmentPreview(null);
    setErrors((current) => ({ ...current, attachment: '' }));
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  return (
    <div className="etr-expense-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Finance</p>
          <h1>Daily Expense Entry</h1>
          <span>{isExistingTransaction ? 'Transaction details from Daily Expense Manager.' : 'Create a new daily expense transaction.'}</span>
        </div>

        <div className="etr-expense-actions">
          {isExistingTransaction ? (
            <>
              <button type="button" onClick={onBackToManager}>Back</button>
              <button type="button" onClick={() => setIsEditingExisting(true)} disabled={isEditingExisting}>Edit</button>
              <button
                type="button"
                className="etr-expense-save-button"
                onClick={handleApprove}
                disabled={isApprovedTransaction || isApproving}
              >
                {isApprovedTransaction ? 'Approved' : isApproving ? 'Approving...' : 'Approve'}
              </button>
              {isEditingExisting ? (
                <button type="button" className="etr-expense-save-button" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
              ) : null}
            </>
          ) : (
            <>
              <button type="button" onClick={handleClear} disabled={isSaving}>New</button>
              <button type="button" className="etr-expense-save-button" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </>
          )}
        </div>
      </div>

      {saveMessage ? <div className="etr-expense-save-message">{saveMessage}</div> : null}
      {saveError ? <div className="etr-expense-save-message is-error">{saveError}</div> : null}

      <div className="etr-expense-form-shell">
        <div className="etr-expense-main-stack">
          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Employee Info</h2>
              <span>Requester details</span>
            </div>
            <div className="etr-expense-grid two">
              <FormField label="Employee No" name="employeeNo" value={formData.employeeNo} onChange={updateForm} error={errors.employeeNo} readOnly required />
              <FormField label="Employee Name" name="employeeName" value={formData.employeeName} onChange={updateForm} error={errors.employeeName} readOnly required placeholder="Lastname, Firstname, Middle Initial" />
              {employeeError ? <div className="etr-expense-field-note">{employeeError}</div> : null}
              <FormField label="Entry Date" name="date" type="date" value={formData.date} onChange={updateForm} error={errors.date} readOnly={isFormReadOnly} />
              <FormField label="Reference No" name="referenceNo" value={formData.referenceNo} onChange={updateForm} error={errors.referenceNo} readOnly required />
            </div>
          </section>

          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Document Info</h2>
              <span>Receipt and tax references</span>
            </div>
            <div className="etr-expense-grid three">
              <FormField label="Receipt Date" name="receiptDate" type="date" value={formData.receiptDate} onChange={updateForm} error={errors.receiptDate} readOnly={isFormReadOnly} required />
              <FormField label="TIN No" name="tinNo" value={formData.tinNo} onChange={updateForm} placeholder="000-000-000-00000" readOnly={isFormReadOnly} />
              <FormField
                label="OR/SI No"
                name="orSiNo"
                value={formData.orSiNo}
                onChange={updateForm}
                error={errors.orSiNo}
                readOnly={isFormReadOnly}
              />
              <FormField
                label="Document No"
                name="documentNo"
                value={formData.documentNo}
                onChange={updateForm}
                error={errors.documentNo}
                readOnly={isFormReadOnly}
              />
            </div>
          </section>

          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Expense Details</h2>
              <span>Classification and supporting notes</span>
            </div>
            <div className="etr-expense-grid details">
              <FormField label="Expense Type" name="expenseType" value={formData.expenseType} onChange={updateForm} error={errors.expenseType} required>
                <div className="etr-expense-combo">
                  <button
                    type="button"
                    className={`etr-expense-lookup-button ${formData.expenseType ? 'has-value' : ''}`}
                    onClick={() => setIsExpenseTypeLookupOpen((current) => !current)}
                    aria-expanded={isExpenseTypeLookupOpen}
                    aria-invalid={!!errors.expenseType}
                    disabled={isFormReadOnly}
                  >
                    <span>{formData.expenseType || 'Select type'}</span>
                    <ExpenseChevronIcon isOpen={isExpenseTypeLookupOpen} />
                  </button>

                  {isExpenseTypeLookupOpen ? (
                    <div className="etr-expense-combo-panel">
                      <input
                        value={expenseTypeQuery}
                        onChange={(event) => setExpenseTypeQuery(event.target.value)}
                        placeholder="Search code or description"
                        autoFocus
                      />
                      <div className="etr-expense-combo-list">
                        {isAccountTitlesLoading ? (
                          <div className="etr-expense-combo-status">Loading account titles...</div>
                        ) : null}
                        {!isAccountTitlesLoading && accountTitlesError ? (
                          <div className="etr-expense-combo-status is-error">{accountTitlesError}</div>
                        ) : null}
                        {!isAccountTitlesLoading && !accountTitlesError && filteredExpenseTypeRows.length === 0 ? (
                          <div className="etr-expense-combo-status">No account titles found.</div>
                        ) : null}
                        {!isAccountTitlesLoading && !accountTitlesError ? filteredExpenseTypeRows.map((row) => (
                          <button type="button" key={row.accountTitleId} onClick={() => handleSelectExpenseType(row)}>
                            <span>{row.code}</span>
                            <strong>{row.description}</strong>
                          </button>
                        )) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </FormField>
              <label className={`etr-expense-field etr-expense-description ${errors.description ? 'has-error' : ''}`}>
                <span>Particular/Description</span>
                <textarea name="description" value={formData.description} onChange={updateForm} rows="4" aria-invalid={!!errors.description} readOnly={isFormReadOnly} />
                {errors.description ? <small>{errors.description}</small> : null}
              </label>
            </div>
          </section>
        </div>

        <aside className="etr-expense-side-stack">
          <section className="etr-expense-card etr-expense-amount-card">
            <div className="etr-expense-card-head">
              <h2>Amount</h2>
              <span>Auto-computed total</span>
            </div>
            <div className="etr-expense-grid amount">
              <FormField
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={updateForm}
                onKeyDown={blockInvalidMoneyInput}
                onPaste={blockInvalidMoneyPaste}
                inputMode="decimal"
                error={errors.amount}
                readOnly={isFormReadOnly}
                required
              />
              <FormField
                label="VAT"
                name="vat"
                type="number"
                value={formData.vat}
                onChange={updateForm}
                onKeyDown={blockInvalidMoneyInput}
                onPaste={blockInvalidMoneyPaste}
                inputMode="decimal"
                error={errors.vat}
                readOnly={isFormReadOnly}
              />
              <FormField label="Total" name="total" value={formatTotal(total)} readOnly>
                <input value={formatTotal(total)} readOnly className="etr-expense-total-input" />
              </FormField>
            </div>
          </section>

          <section className="etr-expense-card etr-expense-upload-card">
            <div className="etr-expense-card-head">
              <h2>Attachment</h2>
              <span>Receipt preview</span>
            </div>
            <label className={`etr-expense-upload ${errors.attachment ? 'has-error' : ''}`}>
              <input
                ref={attachmentInputRef}
                type="file"
                accept={ATTACHMENT_ACCEPT}
                onChange={handleFileChange}
                disabled={isFormReadOnly}
              />
              <span>Upload receipt or invoice</span>
              <strong>{formData.attachment || 'No file selected'}</strong>
            </label>
            {errors.attachment ? <small className="etr-expense-upload-error">{errors.attachment}</small> : null}
            <button
              type="button"
              className={`etr-expense-preview ${attachmentPreview?.url ? 'is-clickable' : ''}`}
              onClick={handlePreviewAttachment}
              disabled={!attachmentPreview?.url}
              aria-label={attachmentPreview?.url ? `View ${attachmentPreview.name}` : 'No attachment preview available'}
            >
              {attachmentPreview?.url ? (
                attachmentPreview.isImage ? (
                  <img src={attachmentPreview.url} alt={attachmentPreview.name} />
                ) : (
                  <div>
                    <strong>{attachmentPreview.name}</strong>
                    <span>{attachmentPreview.type} - {attachmentPreview.size}</span>
                  </div>
                )
              ) : (
                <div>
                  <strong>{attachmentPreview?.name || formData.attachment || 'Preview area'}</strong>
                  <span>{attachmentPreview ? `${attachmentPreview.type} - ${attachmentPreview.size}` : `Images and PDF receipts/invoices only. Max ${MAX_ATTACHMENT_LABEL}.`}</span>
                </div>
              )}
            </button>
            {formData.attachment && !isFormReadOnly ? (
              <div className="etr-expense-attachment-actions">
                <button type="button" onClick={handleChooseAttachment}>Change</button>
                <button type="button" onClick={handleRemoveAttachment}>Remove</button>
              </div>
            ) : null}
          </section>

          <div className="etr-expense-approval-note">
            {isExistingTransaction
              ? `Current status: ${selectedTransaction.status || 'Pending'}`
              : 'New entries start as Pending after saving.'}
          </div>
        </aside>
      </div>

      {isAttachmentViewerOpen && attachmentPreview?.url && attachmentPreview.isImage ? (
        <div className="etr-expense-viewer-backdrop" role="presentation" onClick={() => setIsAttachmentViewerOpen(false)}>
          <section className="etr-expense-viewer" role="dialog" aria-modal="true" aria-label="Attachment preview" onClick={(event) => event.stopPropagation()}>
            <div className="etr-expense-viewer-head">
              <strong>{attachmentPreview.name}</strong>
              <button type="button" onClick={() => setIsAttachmentViewerOpen(false)} aria-label="Close attachment preview">Close</button>
            </div>
            <img src={attachmentPreview.url} alt={attachmentPreview.name} />
          </section>
        </div>
      ) : null}

      {isLookupOpen ? (
        <div className="etr-expense-modal-backdrop" role="presentation">
          <section className="etr-expense-modal" role="dialog" aria-modal="true" aria-label="Find expense record">
            <div className="etr-expense-modal-head">
              <div>
                <p className="etr-expense-kicker">Lookup</p>
                <h2>Find Daily Expense</h2>
              </div>
              <button type="button" onClick={() => setIsLookupOpen(false)} aria-label="Close lookup">Close</button>
            </div>
            <label className="etr-expense-modal-search">
              <span>Search</span>
              <input value={lookupQuery} onChange={(event) => setLookupQuery(event.target.value)} placeholder="Reference, employee, or document no" />
            </label>
            <div className="etr-expense-table-wrap">
              <table className="etr-expense-table lookup">
                <thead>
                  <tr>
                    <th>Reference No</th>
                    <th>Employee</th>
                    <th>Expense Type</th>
                    <th>Document No</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLookupRows.map((row) => (
                    <tr key={row.referenceNo}>
                      <td>{row.referenceNo}</td>
                      <td>{row.employeeName}</td>
                      <td>{row.expenseType}</td>
                      <td>{row.documentNo}</td>
                      <td className="is-number">{row.total}</td>
                      <td><span className="etr-expense-readonly-badge">View only</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

    </div>
  );
}

export default ExpenseEntryView;
