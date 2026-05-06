import React, { useEffect, useRef, useState } from 'react';
import { getToken } from '../../services/authStorage';
import './ExpenseEntry.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const ACCOUNT_TITLES_ENDPOINT = '/api/accounttitles';
const COST_UNITS_ENDPOINT = '/api/costunits';
const CURRENT_EMPLOYEE_ENDPOINT = '/api/employees/current';
const DAILY_EXPENSE_ENDPOINT = '/api/daily-expense';
const ATTACHMENT_ACCEPT = 'image/*,application/pdf,.pdf';
const ATTACHMENT_EXTENSION_PATTERN = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|pdf|png|tif|tiff|webp)$/i;
const ATTACHMENT_IMAGE_EXTENSION_PATTERN = /\.(avif|bmp|gif|heic|heif|jpeg|jpg|png|tif|tiff|webp)$/i;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENT_LABEL = '5 MB';
const MAX_DOCUMENT_REFERENCE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 255;
const MAX_TIN_DIGITS = 14;

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

const dailyExpenseColumns = [
  'Employee No',
  'Employee Name',
  'Date',
  'Reference No',
  'Receipt Date',
  'Expense Type',
  'Cost Unit',
  'TIN No',
  'OR/SI No',
  'Document No',
  'Description',
  'Amount',
  'Vat',
  'Total',
  'Attachment',
];

const dailyExpenseRows = [
  {
    employeeNo: 'EMP-0017',
    employeeName: 'Dela Cruz, Juan',
    date: '04/29/2026',
    referenceNo: 'EXP-2026-0429-001',
    receiptDate: '04/28/2026',
    expenseType: 'Transportation',
    costUnit: '',
    tinNo: '123-456-789-000',
    orSiNo: 'SI-009218',
    documentNo: 'DOC-58142',
    description: 'Client visit fare and parking',
    amount: '1,850.00',
    vat: '222.00',
    total: '2,072.00',
    attachment: 'receipt-001.pdf',
  },
  {
    employeeNo: 'EMP-0042',
    employeeName: 'Santos, Maria',
    date: '04/29/2026',
    referenceNo: 'EXP-2026-0429-002',
    receiptDate: '04/29/2026',
    expenseType: 'Meals',
    costUnit: '',
    tinNo: '987-654-321-000',
    orSiNo: 'OR-31874',
    documentNo: 'DOC-58143',
    description: 'Project meeting lunch',
    amount: '3,200.00',
    vat: '384.00',
    total: '3,584.00',
    attachment: 'meal-or.jpg',
  },
  {
    employeeNo: 'EMP-0068',
    employeeName: 'Reyes, Carlo',
    date: '04/28/2026',
    referenceNo: 'EXP-2026-0428-006',
    receiptDate: '04/27/2026',
    expenseType: 'Supplies',
    costUnit: '',
    tinNo: '456-120-884-000',
    orSiNo: 'SI-77105',
    documentNo: 'DOC-58131',
    description: 'Office printing supplies',
    amount: '5,460.00',
    vat: '655.20',
    total: '6,115.20',
    attachment: 'supplies-si.pdf',
  },
];

const dailyExpenseFieldKeys = [
  'employeeNo',
  'employeeName',
  'date',
  'referenceNo',
  'receiptDate',
  'expenseType',
  'costUnit',
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
  costUnit: '',
  costUnitId: '',
  tinNo: '',
  orSiNo: '',
  documentNo: '',
  description: '',
  amount: '',
  vat: '',
  attachment: '',
  attachmentUrl: '',
};



function parseMoney(value) {
  return Number(String(value || '').replace(/,/g, '')) || 0;
}

function sanitizeMoneyInput(value) {
  const cleanedValue = String(value || '').replace(/[^0-9.]/g, '');
  const [wholePart, ...decimalParts] = cleanedValue.split('.');

  return decimalParts.length > 0
    ? `${wholePart}.${decimalParts.join('')}`
    : wholePart;
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

function formatTinNo(value) {
  const digits = String(value || '').replace(/\D/g, '');
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

function isImageAttachmentName(name) {
  return ATTACHMENT_IMAGE_EXTENSION_PATTERN.test(String(name || ''));
}

function getAttachmentUrl(attachment, attachmentUrl = '') {
  const source = String(attachmentUrl || attachment || '').trim();

  if (!source) {
    return '';
  }

  if (/^(https?:|blob:|data:)/i.test(source)) {
    return source;
  }

  if (source.startsWith('/')) {
    return buildApiUrl(source);
  }

  if (source.includes('/') || source.includes('\\')) {
    return buildApiUrl(`/${source.replace(/\\/g, '/').replace(/^\/+/, '')}`);
  }

  return buildApiUrl(`/uploads/${encodeURIComponent(source)}`);
}

function createExistingAttachmentPreview(record) {
  const attachment = record?.attachment || '';
  const attachmentUrl = record?.attachmentUrl || '';
  const url = getAttachmentUrl(attachment, attachmentUrl);

  if (!attachment || !url) {
    return null;
  }

  return {
    name: attachment,
    size: 'Uploaded file',
    type: isImageAttachmentName(attachment) ? 'Image' : 'Document',
    url,
    isImage: isImageAttachmentName(attachment),
    isObjectUrl: false,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

function blockNonMoneyKeys(event) {
  const allowedControlKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  if (
    allowedControlKeys.includes(event.key)
    || event.ctrlKey
    || event.metaKey
    || /^\d$/.test(event.key)
  ) {
    return;
  }

  if (event.key === '.') {
    const { selectionStart, selectionEnd, value } = event.currentTarget;
    const selectedText = value.slice(selectionStart ?? 0, selectionEnd ?? 0);

    if (!value.includes('.') || selectedText.includes('.')) {
      return;
    }
  }

  if (event.key !== 'Shift') {
    event.preventDefault();
  }
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

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  if (Array.isArray(data?.records)) {
    return data.records;
  }

  return [];
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

function normalizeCostUnit(row) {
  const costUnitId = getUserField(row, ['costUnitId', 'costUnitID', 'CostUnitID', 'CostUnitId', 'id', 'Id']);
  const code = getUserField(row, ['code', 'Code']);
  const description = getUserField(row, ['description', 'Description', 'name', 'Name']);
  const type = getUserField(row, ['type', 'Type']);

  if (!costUnitId || !code || !description) {
    return null;
  }

  return {
    costUnitId,
    code,
    description,
    type,
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

function getValidationMessage(data) {
  if (data?.errors) {
    return Object.values(data.errors).flat().filter(Boolean).join(' ');
  }

  return data?.message || 'Unable to save daily expense.';
}

function createExpenseForm(user, isoDate = getTodayIsoDate()) {
  return {
    ...emptyExpenseForm,
    employeeNo: user ? getEmployeeNo(user) : '',
    employeeName: user ? getEmployeeName(user) : '',
    date: isoDate,
    referenceNo: '',
    receiptDate: isoDate,
  };
}

function createExpenseFormFromRecord(record) {
  if (!record) {
    return null;
  }

  return {
    ...emptyExpenseForm,
    employeeNo: record.employeeCode || record.employeeNo || '',
    employeeName: record.employeeName || '',
    date: record.dateInput || '',
    referenceNo: record.referenceNo || '',
    receiptDate: record.receiptDateInput || '',
    expenseType: String(record.expenseType || ''),
    expenseTypeId: record.expenseTypeId || '',
    costUnit: record.costUnit || record.subsidiary || '',
    costUnitId: record.costUnitId || record.subsidiaryId || '',
    tinNo: record.tinNo || '',
    orSiNo: record.orSiNo || '',
    documentNo: record.documentNo || '',
    description: record.description || '',
    amount: String(record.amountValue ?? record.amount ?? '').replace(/,/g, ''),
    vat: String(record.vatValue ?? record.vat ?? '').replace(/,/g, ''),
    attachment: record.attachment || '',
    attachmentUrl: record.attachmentUrl || '',
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
  inputMode,
  onKeyDown,
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
          inputMode={inputMode}
          onKeyDown={onKeyDown}
        />
      )}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export default function ExpenseEntryView({
  user,
  selectedExpense = null,
  onBack,
}) {
  const attachmentInputRef = useRef(null);
  const attachmentObjectUrlRef = useRef('');
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [accountTitleRows, setAccountTitleRows] = useState([]);
  const [isAccountTitlesLoading, setIsAccountTitlesLoading] = useState(false);
  const [accountTitlesError, setAccountTitlesError] = useState('');
  const [costUnitRows, setCostUnitRows] = useState([]);
  const [isCostUnitsLoading, setIsCostUnitsLoading] = useState(false);
  const [costUnitsError, setCostUnitsError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [expenseRows, setExpenseRows] = useState(dailyExpenseRows);
  const [formData, setFormData] = useState(() => createExpenseForm(null));
  const [errors, setErrors] = useState({});
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isExpenseTypeLookupOpen, setIsExpenseTypeLookupOpen] = useState(false);
  const [isCostUnitLookupOpen, setIsCostUnitLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [expenseTypeQuery, setExpenseTypeQuery] = useState('');
  const [costUnitQuery, setCostUnitQuery] = useState('');
  const [page, setPage] = useState(1);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailStatus, setDetailStatus] = useState('');
  const isDetailMode = !!selectedExpense;
  const isApprovedDetail = detailStatus.toLowerCase() === 'approved';
  const isReadOnlyDetail = isDetailMode && (!isEditingDetail || isApprovedDetail);
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
  const filteredCostUnitRows = costUnitRows.filter((row) => {
    const query = costUnitQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [row.code, row.description]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  const revokeAttachmentObjectUrl = () => {
    if (attachmentObjectUrlRef.current) {
      URL.revokeObjectURL(attachmentObjectUrlRef.current);
      attachmentObjectUrlRef.current = '';
    }
  };

  useEffect(() => () => {
    revokeAttachmentObjectUrl();
  }, []);

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

    const loadCostUnits = async () => {
      setIsCostUnitsLoading(true);
      setCostUnitsError('');

      try {
        const response = await fetch(buildApiUrl(COST_UNITS_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load cost units.');
        }

        setCostUnitRows(getApiCollection(data).map(normalizeCostUnit).filter(Boolean));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setCostUnitRows([]);
          setCostUnitsError(error.message || 'Unable to load cost units.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCostUnitsLoading(false);
        }
      }
    };

    loadCostUnits();

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
    if (selectedExpense) {
      revokeAttachmentObjectUrl();
      setFormData(createExpenseFormFromRecord(selectedExpense));
      setErrors({});
      setSaveError('');
      setSaveMessage('');
      setIsEditingDetail(false);
      setDetailStatus(selectedExpense.status || 'Pending');
      setIsAttachmentViewerOpen(false);
      setAttachmentPreview(createExistingAttachmentPreview(selectedExpense));
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
    }
  }, [selectedExpense]);

  useEffect(() => {
    if (selectedExpense) {
      return;
    }

    setFormData((current) => ({
      ...current,
      employeeNo: employeeInfo ? getEmployeeNo(employeeInfo) : '',
      employeeName: employeeInfo ? getEmployeeName(employeeInfo) : '',
    }));
  }, [employeeInfo, selectedExpense, user]);

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
    } else if (name === 'date' || name === 'receiptDate') {
      const fieldLabel = name === 'date' ? 'Entry Date' : 'Receipt Date';
      const isFutureDate = isFutureIsoDate(value);

      setFormData((current) => ({ ...current, [name]: value }));
      setErrors((current) => ({
        ...current,
        [name]: isFutureDate ? `${fieldLabel} cannot be later than today.` : '',
      }));
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
      const formattedValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      const isTooLong = formattedValue.length > MAX_DOCUMENT_REFERENCE_LENGTH;

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
      const formattedValue = value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
      const isTooLong = formattedValue.length > MAX_DOCUMENT_REFERENCE_LENGTH;

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
      const cleanedValue = sanitizeMoneyInput(value);

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

        setFormData((current) => ({ ...current, [name]: cleanedValue }));
        setErrors((current) => ({
          ...current,
          amount: '',
          vat: cleanedValue && vat > amount ? 'VAT cannot be higher than Amount.' : '',
        }));
      }
    } else if (name === 'description') {
      const isTooLong = value.length > MAX_DESCRIPTION_LENGTH;

      setFormData((current) => ({ ...current, description: value }));
      setErrors((current) => ({
        ...current,
        description: isTooLong ? `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.` : '',
      }));
    } else {
      setFormData((current) => ({
        ...current,
        [name]: value,
      }));
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.employeeNo.trim()) nextErrors.employeeNo = 'Employee no is required.';
    if (!formData.employeeName.trim()) nextErrors.employeeName = 'Employee name is required.';
    if (formData.employeeName && /[0-9]/.test(formData.employeeName)) nextErrors.employeeName = 'Employee name cannot contain numbers.';
    if (!formData.date) nextErrors.date = 'Entry Date is required.';
    if (isFutureIsoDate(formData.date)) nextErrors.date = 'Entry Date cannot be later than today.';
    if (!formData.expenseType.trim() || !formData.expenseTypeId) nextErrors.expenseType = 'Select an expense type.';
    if (!formData.costUnit.trim() || !formData.costUnitId) nextErrors.costUnit = 'Select a cost unit.';
    if (!formData.amount || parseMoney(formData.amount) <= 0) nextErrors.amount = 'Enter a valid amount.';
    if (!formData.receiptDate) nextErrors.receiptDate = 'Receipt date is required.';
    if (isFutureIsoDate(formData.receiptDate)) nextErrors.receiptDate = 'Receipt Date cannot be later than today.';
    if (!formData.description.trim()) nextErrors.description = 'Description is required.';
    if (formData.tinNo.replace(/\D/g, '').length > MAX_TIN_DIGITS) nextErrors.tinNo = `TIN No cannot exceed ${MAX_TIN_DIGITS} digits.`;
    if (formData.orSiNo.length > MAX_DOCUMENT_REFERENCE_LENGTH) nextErrors.orSiNo = `OR/SI No cannot exceed ${MAX_DOCUMENT_REFERENCE_LENGTH} characters.`;
    if (formData.documentNo.length > MAX_DOCUMENT_REFERENCE_LENGTH) nextErrors.documentNo = `Document No cannot exceed ${MAX_DOCUMENT_REFERENCE_LENGTH} characters.`;
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) nextErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
    if (!formData.attachment.trim()) nextErrors.attachment = 'Attachment is required.';
    if (formData.attachment && !attachmentPreview && !isDetailMode) nextErrors.attachment = 'Attach an image or PDF file.';
    
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
      const response = await fetch(buildApiUrl(DAILY_EXPENSE_ENDPOINT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          expenseDate: formData.date,
          receiptDate: formData.receiptDate || null,
          orSINo: formData.orSiNo.trim(),
          documentNo: formData.documentNo.trim(),
          description: formData.description.trim(),
          amount: parseMoney(formData.amount),
          vat: parseMoney(formData.vat),
          total,
          tin: formData.tinNo.trim(),
          vendorID: null,
          costUnitID: Number(formData.costUnitId),
          expenseType: Number(formData.expenseTypeId),
          attachment: formData.attachment || '',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getValidationMessage(data));
      }

      const responseEmployeeNo = data.employeeNo || formData.employeeNo.trim();
      const responseEmployeeName = data.employeeName || formData.employeeName.trim();
      const responseReferenceNo = data.referenceNo || formData.referenceNo.trim() || 'Generated';

      const nextRow = {
        expenseId: data.expenseId,
        employeeNo: responseEmployeeNo,
        employeeName: responseEmployeeName,
        date: formatDateForTable(formData.date),
        referenceNo: responseReferenceNo,
        receiptDate: formatDateForTable(formData.receiptDate),
        expenseType: formData.expenseType,
        costUnit: formData.costUnit,
        costUnitId: formData.costUnitId,
        tinNo: formData.tinNo.trim(),
        orSiNo: formData.orSiNo.trim(),
        documentNo: formData.documentNo.trim(),
        description: formData.description.trim(),
        amount: formatMoney(parseMoney(formData.amount)),
        vat: formatMoney(parseMoney(formData.vat)),
        total: formatTotal(total),
        attachment: formData.attachment || 'No attachment',
      };

      const nextRows = [nextRow, ...expenseRows];
      setExpenseRows(nextRows);
      setPage(1);
      setFormData({
        ...createExpenseForm(employeeInfo),
        referenceNo: responseReferenceNo === 'Generated' ? '' : responseReferenceNo,
      });
      setErrors({});
      setIsAttachmentViewerOpen(false);
      revokeAttachmentObjectUrl();
      setAttachmentPreview(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      setSaveMessage(data.message || 'Daily expense saved successfully.');
    } catch (error) {
      setSaveError(error.message || 'Unable to save daily expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const buildUpdatePayload = (status) => ({
    expenseID: Number(selectedExpense?.expenseId),
    expenseDate: formData.date,
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
    costUnitID: Number(formData.costUnitId),
    attachment: formData.attachment || '',
    status,
  });

  const handleUpdateDetail = async () => {
    if (!selectedExpense?.expenseId || !validateForm()) {
      return;
    }

    const token = getToken();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const response = await fetch(buildApiUrl(`${DAILY_EXPENSE_ENDPOINT}/${selectedExpense.expenseId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildUpdatePayload(detailStatus || selectedExpense.status || 'Pending')),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getValidationMessage(data));
      }

      setIsEditingDetail(false);
      setSaveMessage(data.message || 'Daily expense updated successfully.');
    } catch (error) {
      setSaveError(error.message || 'Unable to update daily expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense?.expenseId || !validateForm()) {
      return;
    }

    const token = getToken();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const response = await fetch(buildApiUrl(`${DAILY_EXPENSE_ENDPOINT}/${selectedExpense.expenseId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildUpdatePayload('Approved')),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getValidationMessage(data));
      }

      setIsEditingDetail(false);
      setDetailStatus('Approved');
      setSaveMessage(data.message || 'Daily expense approved successfully.');
    } catch (error) {
      setSaveError(error.message || 'Unable to approve daily expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFormData(createExpenseForm(employeeInfo));
    setErrors({});
    setSaveError('');
    setSaveMessage('');
    setIsAttachmentViewerOpen(false);
    revokeAttachmentObjectUrl();
    setAttachmentPreview(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
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

  const handleSelectCostUnit = (row) => {
    if (!row.costUnitId) {
      setErrors((current) => ({ ...current, costUnit: 'Selected cost unit has no CostUnitID.' }));
      return;
    }

    setFormData((current) => ({
      ...current,
      costUnit: `${row.code} - ${row.description}`,
      costUnitId: row.costUnitId,
    }));
    setErrors((current) => ({ ...current, costUnit: '' }));
    setCostUnitQuery('');
    setIsCostUnitLookupOpen(false);
  };

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

    revokeAttachmentObjectUrl();
    const isImage = isImageAttachment(file);
    let previewUrl = '';
    let isObjectUrl = false;

    try {
      if (isImage) {
        previewUrl = await readFileAsDataUrl(file);
      } else {
        previewUrl = URL.createObjectURL(file);
        attachmentObjectUrlRef.current = previewUrl;
        isObjectUrl = true;
      }
    } catch {
      event.target.value = '';
      setErrors((current) => ({
        ...current,
        attachment: 'Unable to preview selected attachment.',
      }));
      return;
    }

    setFormData((current) => ({ ...current, attachment: file.name, attachmentUrl: '' }));
    setErrors((current) => ({ ...current, attachment: '' }));
    setAttachmentPreview({
      name: file.name,
      size: formatAttachmentSize(file.size),
      type: file.type || 'Document',
      url: previewUrl,
      isImage,
      isObjectUrl,
    });
    setIsAttachmentViewerOpen(false);
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
    revokeAttachmentObjectUrl();

    setFormData((current) => ({ ...current, attachment: '', attachmentUrl: '' }));
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
          <span>{isDetailMode ? 'Transaction details from Daily Expense Manager.' : 'Add-only expense capture. Updates require approval from accounting.'}</span>
        </div>

        <div className="etr-expense-actions">
          {isDetailMode ? (
            <>
              <button type="button" onClick={onBack} disabled={isSaving}>Back</button>
              {!isApprovedDetail ? (
                <button type="button" onClick={() => setIsEditingDetail((current) => !current)} disabled={isSaving}>
                  {isEditingDetail ? 'Cancel Edit' : 'Edit'}
                </button>
              ) : null}
              {isEditingDetail && !isApprovedDetail ? (
                <button type="button" className="etr-expense-save-button" onClick={handleUpdateDetail} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              ) : null}
              {!isApprovedDetail ? (
                <button type="button" className="etr-expense-save-button" onClick={handleApprove} disabled={isSaving}>
                  {isSaving ? 'Approving...' : 'Approve'}
                </button>
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
              <FormField
                label="Entry Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={updateForm}
                error={errors.date}
                readOnly
              />
              <FormField label="Reference No" name="referenceNo" value={formData.referenceNo} onChange={updateForm} error={errors.referenceNo} readOnly placeholder="Generated on save" />
            </div>
          </section>

          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Document Info</h2>
              <span>Receipt and tax references</span>
            </div>
            <div className="etr-expense-grid three">
              <FormField label="Receipt Date" name="receiptDate" type="date" value={formData.receiptDate} onChange={updateForm} error={errors.receiptDate} readOnly={isReadOnlyDetail} required />
              <FormField label="TIN No" name="tinNo" value={formData.tinNo} onChange={updateForm} error={errors.tinNo} readOnly={isReadOnlyDetail} placeholder="000-000-000-00000" />
              <FormField
                label="OR/SI No"
                name="orSiNo"
                value={formData.orSiNo}
                onChange={updateForm}
                error={errors.orSiNo}
                readOnly={isReadOnlyDetail}
              />
              <FormField
                label="Document No"
                name="documentNo"
                value={formData.documentNo}
                onChange={updateForm}
                error={errors.documentNo}
                readOnly={isReadOnlyDetail}
              />
            </div>
          </section>

          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Expense Details</h2>
              <span>Classification and supporting notes</span>
            </div>
            <div className="etr-expense-grid details">
              <div className="etr-expense-details-left">
                <FormField label="Expense Type" name="expenseType" value={formData.expenseType} onChange={updateForm} error={errors.expenseType} required>
                  <div className="etr-expense-combo">
                    <button
                      type="button"
                      className={`etr-expense-lookup-button ${formData.expenseType ? 'has-value' : ''}`}
                      onClick={() => {
                        if (!isReadOnlyDetail) {
                          setIsExpenseTypeLookupOpen((current) => !current);
                        }
                      }}
                      aria-expanded={isExpenseTypeLookupOpen}
                      aria-invalid={!!errors.expenseType}
                      disabled={isReadOnlyDetail}
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

                <FormField label="Cost Unit" name="costUnit" value={formData.costUnit} onChange={updateForm} error={errors.costUnit} required>
                  <div className="etr-expense-combo">
                    <button
                      type="button"
                      className={`etr-expense-lookup-button ${formData.costUnit ? 'has-value' : ''}`}
                      onClick={() => {
                        if (!isReadOnlyDetail) {
                          setIsCostUnitLookupOpen((current) => !current);
                        }
                      }}
                      aria-expanded={isCostUnitLookupOpen}
                      aria-invalid={!!errors.costUnit}
                      disabled={isReadOnlyDetail}
                    >
                      <span>{formData.costUnit || 'Select cost unit'}</span>
                      <ExpenseChevronIcon isOpen={isCostUnitLookupOpen} />
                    </button>

                    {isCostUnitLookupOpen ? (
                      <div className="etr-expense-combo-panel">
                        <input
                          value={costUnitQuery}
                          onChange={(event) => setCostUnitQuery(event.target.value)}
                          placeholder="Search code or description"
                          autoFocus
                        />
                        <div className="etr-expense-combo-list">
                          {isCostUnitsLoading ? (
                            <div className="etr-expense-combo-status">Loading cost units...</div>
                          ) : null}
                          {!isCostUnitsLoading && costUnitsError ? (
                            <div className="etr-expense-combo-status is-error">{costUnitsError}</div>
                          ) : null}
                          {!isCostUnitsLoading && !costUnitsError && filteredCostUnitRows.length === 0 ? (
                            <div className="etr-expense-combo-status">No cost units found.</div>
                          ) : null}
                          {!isCostUnitsLoading && !costUnitsError ? filteredCostUnitRows.map((row) => (
                            <button type="button" key={row.costUnitId} onClick={() => handleSelectCostUnit(row)}>
                              <span>{row.code}</span>
                              <strong>{row.description}</strong>
                            </button>
                          )) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </FormField>
              </div>
              <label className={`etr-expense-field etr-expense-description ${errors.description ? 'has-error' : ''}`}>
                <span>Particular/Description</span>
                <textarea name="description" value={formData.description} onChange={updateForm} readOnly={isReadOnlyDetail} rows="4" aria-invalid={!!errors.description} />
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
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={updateForm}
                onKeyDown={blockNonMoneyKeys}
                error={errors.amount}
                readOnly={isReadOnlyDetail}
                required
              />
              <FormField
                label="VAT"
                name="vat"
                type="text"
                inputMode="decimal"
                value={formData.vat}
                onChange={updateForm}
                onKeyDown={blockNonMoneyKeys}
                error={errors.vat}
                readOnly={isReadOnlyDetail}
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
                disabled={isReadOnlyDetail}
              />
              <span>{isReadOnlyDetail ? 'Uploaded receipt or invoice' : 'Upload receipt or invoice'}</span>
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
            {formData.attachment && !isReadOnlyDetail ? (
              <div className="etr-expense-attachment-actions">
                <button type="button" onClick={handleChooseAttachment}>Change</button>
                <button type="button" onClick={handleRemoveAttachment}>Remove</button>
              </div>
            ) : null}
          </section>

          <div className="etr-expense-approval-note">
            {isDetailMode ? `Current status: ${detailStatus || selectedExpense?.status || 'Pending'}` : 'Existing expense records are view-only. Changes must go through approval.'}
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
                    <tr key={row.expenseId || row.referenceNo}>
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
