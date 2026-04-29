import React, { useEffect, useRef, useState } from 'react';
import './ExpenseEntry.css';

const dailyExpenseColumns = [
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

const dailyExpenseRows = [
  {
    employeeNo: 'EMP-0017',
    employeeName: 'Dela Cruz, Juan',
    date: '04/29/2026',
    referenceNo: 'EXP-2026-0429-001',
    receiptDate: '04/28/2026',
    expenseType: 'Transportation',
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
  expenseTypeCode: '',
  tinNo: '',
  orSiNo: '',
  documentNo: '',
  description: '',
  amount: '',
  vat: '',
  attachment: '',
};

const accountTitleRows = [
  { accountTitleId: 1, code: '100-00-0000', description: 'ASSETS' },
  { accountTitleId: 2, code: '101-00-0000', description: 'CURRENT ASSETS' },
  { accountTitleId: 3, code: '101-10-0001', description: 'CASH ON HAND' },
  { accountTitleId: 4, code: '101-10-0002', description: 'Petty Cash Fund' },
  { accountTitleId: 5, code: '101-10-0003', description: 'Revolving Fund' },
  { accountTitleId: 6, code: '101-10-0004', description: 'CASH IN BANK' },
  { accountTitleId: 7, code: '101-10-0005', description: 'CASH IN BANK - ALLIED BANK' },
  { accountTitleId: 8, code: '101-20-0000', description: 'ACCOUNTS RECEIVABLES & ADVANCES' },
  { accountTitleId: 9, code: '101-20-0001', description: 'Accounts Receivable - Trade' },
  { accountTitleId: 10, code: '101-20-0002', description: 'Allow for Doubtful Accounts - Trade' },
  { accountTitleId: 11, code: '101-20-0003', description: 'Accounts Receivable - Guaranteed' },
  { accountTitleId: 12, code: '101-20-0004', description: 'Accounts Receivable - Initial Stocking' },
  { accountTitleId: 13, code: '101-20-0005', description: 'Accounts Receivable - NonTrade' },
  { accountTitleId: 14, code: '101-20-0006', description: 'Allow for Doubtful Accounts - Non Trade' },
  { accountTitleId: 15, code: '101-20-0007', description: 'Accounts Receivable - Employees' },
  { accountTitleId: 16, code: '101-20-0008', description: 'Accounts Receivable - Others' },
  { accountTitleId: 17, code: '101-20-0009', description: 'Advances to E & E' },
  { accountTitleId: 18, code: '101-20-0010', description: 'Advances to SSS' },
  { accountTitleId: 19, code: '101-20-0011', description: 'Advances to Officers and Employees' },
  { accountTitleId: 20, code: '101-20-0012', description: 'Advances to Customers and Affiliates' },
  { accountTitleId: 21, code: '101-20-0013', description: 'Creditable Withholding Tax' },
  { accountTitleId: 22, code: '101-20-0014', description: 'VAT W/Tax Receivable' },
  { accountTitleId: 23, code: '101-30-0000', description: 'CLAIMS RECEIVABLE' },
  { accountTitleId: 24, code: '101-30-0001', description: 'Claims Accrual' },
  { accountTitleId: 25, code: '101-40-0000', description: 'INVENTORY' },
  { accountTitleId: 26, code: '101-40-0001', description: 'Merchandise Invty' },
  { accountTitleId: 27, code: '102-00-0000', description: 'FIXED ASSETS' },
  { accountTitleId: 28, code: '102-10-0000', description: 'LAND, BUILDING & IMPROVEMENTS' },
  { accountTitleId: 29, code: '102-10-0001', description: 'Land' },
  { accountTitleId: 30, code: '102-10-0002', description: 'Office Building' },
  { accountTitleId: 31, code: '102-20-0000', description: 'FURNITURE, FIXTURES & EQUIPMENT' },
  { accountTitleId: 32, code: '102-20-0001', description: 'Office Furniture & Equipment' },
  { accountTitleId: 33, code: '102-20-0002', description: 'Transportation Equipment' },
];

const lookupRows = [
  ...dailyExpenseRows,
  {
    employeeNo: 'EMP-0091',
    employeeName: 'Garcia, Anne',
    date: '04/26/2026',
    referenceNo: 'EXP-2026-0426-004',
    receiptDate: '04/26/2026',
    expenseType: 'Representation',
    tinNo: '238-771-009-000',
    orSiNo: 'OR-44219',
    documentNo: 'DOC-58092',
    description: 'Client presentation materials',
    amount: '4,725.00',
    vat: '567.00',
    total: '5,292.00',
    attachment: 'presentation-or.pdf',
  },
];

function parseMoney(value) {
  return Number(String(value || '').replace(/,/g, '')) || 0;
}

function formatMoney(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateForTable(value) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${month}/${day}/${year}` : value;
}

function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
    employeeNo: getEmployeeNo(user),
    employeeName: getEmployeeName(user),
    date: isoDate,
    referenceNo: generateReferenceNo(rows, isoDate),
    receiptDate: isoDate,
  };
}

function ExpenseChevronIcon({ isOpen }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`etr-expense-chevron ${isOpen ? 'is-open' : ''}`}>
      <path d="M8 10 12 14 16 10" />
    </svg>
  );
}

function FormField({ label, name, value, onChange, error, type = 'text', children, readOnly = false, required = false, placeholder = '' }) {
  return (
    <label className={`etr-expense-field ${error ? 'has-error' : ''}`}>
      <span>
        {label}
        {required ? <strong>*</strong> : null}
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
        />
      )}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export default function ExpenseEntryView({ user }) {
  const openedDateRef = useRef(getTodayIsoDate());
  const [expenseRows, setExpenseRows] = useState(dailyExpenseRows);
  const [formData, setFormData] = useState(() => createExpenseForm(user, dailyExpenseRows, openedDateRef.current));
  const [errors, setErrors] = useState({});
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isExpenseTypeLookupOpen, setIsExpenseTypeLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [expenseTypeQuery, setExpenseTypeQuery] = useState('');
  const [page, setPage] = useState(1);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
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

  useEffect(() => () => {
    if (attachmentPreview?.url) {
      URL.revokeObjectURL(attachmentPreview.url);
    }
  }, [attachmentPreview]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      employeeNo: getEmployeeNo(user),
      employeeName: getEmployeeName(user),
      referenceNo: generateReferenceNo(expenseRows, current.date || openedDateRef.current),
    }));
  }, [user, expenseRows]);

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
    } else {
      setFormData((current) => ({
        ...current,
        [name]: value,
        referenceNo: name === 'date' ? generateReferenceNo(expenseRows, value) : current.referenceNo,
      }));
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.employeeNo.trim()) nextErrors.employeeNo = 'Employee no is required.';
    if (!formData.employeeName.trim()) nextErrors.employeeName = 'Employee name is required.';
    if (formData.employeeName && /[0-9]/.test(formData.employeeName)) nextErrors.employeeName = 'Employee name cannot contain numbers.';
    if (!formData.referenceNo.trim()) nextErrors.referenceNo = 'Reference no is required.';
    if (!formData.expenseType.trim()) nextErrors.expenseType = 'Select an expense type.';
    if (!formData.amount || parseMoney(formData.amount) <= 0) nextErrors.amount = 'Enter a valid amount.';
    if (!formData.receiptDate) nextErrors.receiptDate = 'Receipt date is required.';
    if (!formData.description.trim()) nextErrors.description = 'Description is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const nextRow = {
      employeeNo: formData.employeeNo.trim(),
      employeeName: formData.employeeName.trim(),
      date: formatDateForTable(formData.date),
      referenceNo: formData.referenceNo.trim(),
      receiptDate: formatDateForTable(formData.receiptDate),
      expenseType: formData.expenseType,
      tinNo: formData.tinNo.trim(),
      orSiNo: formData.orSiNo.trim(),
      documentNo: formData.documentNo.trim(),
      description: formData.description.trim(),
      amount: formatMoney(parseMoney(formData.amount)),
      vat: formatMoney(parseMoney(formData.vat)),
      total: formatMoney(total),
      attachment: formData.attachment || 'No attachment',
    };

    const nextRows = [nextRow, ...expenseRows];
    setExpenseRows(nextRows);
    setPage(1);
    setFormData(createExpenseForm(user, nextRows, openedDateRef.current));
    setErrors({});
    setAttachmentPreview(null);
  };

  const handleClear = () => {
    setFormData(createExpenseForm(user, expenseRows, openedDateRef.current));
    setErrors({});
    setAttachmentPreview(null);
  };

  const handleSelectExpenseType = (row) => {
    setFormData((current) => ({
      ...current,
      expenseType: `${row.code} - ${row.description}`,
      expenseTypeCode: row.code,
    }));
    setErrors((current) => ({ ...current, expenseType: '' }));
    setExpenseTypeQuery('');
    setIsExpenseTypeLookupOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (attachmentPreview?.url) {
      URL.revokeObjectURL(attachmentPreview.url);
    }

    setFormData((current) => ({ ...current, attachment: file.name }));
    setAttachmentPreview({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'Document',
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    });
  };

  return (
    <div className="etr-expense-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Finance</p>
          <h1>Daily Expense Entry</h1>
          <span>Add-only expense capture. Updates require approval from accounting.</span>
        </div>

        <div className="etr-expense-actions">
          <button type="button" onClick={handleSave}>Save</button>
          <button type="button" onClick={handleClear}>Clear</button>
          <button type="button" onClick={handleClear}>New</button>
        </div>
      </div>

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
              <FormField label="Entry Date" name="date" type="date" value={formData.date} onChange={updateForm} />
              <FormField label="Reference No" name="referenceNo" value={formData.referenceNo} onChange={updateForm} error={errors.referenceNo} readOnly required />
            </div>
          </section>

          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Document Info</h2>
              <span>Receipt and tax references</span>
            </div>
            <div className="etr-expense-grid three">
              <FormField label="Receipt Date" name="receiptDate" type="date" value={formData.receiptDate} onChange={updateForm} error={errors.receiptDate} required />
              <FormField label="TIN No" name="tinNo" value={formData.tinNo} onChange={updateForm} />
              <FormField label="OR/SI No" name="orSiNo" value={formData.orSiNo} onChange={updateForm} />
              <FormField label="Document No" name="documentNo" value={formData.documentNo} onChange={updateForm} />
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
                        {filteredExpenseTypeRows.map((row) => (
                          <button type="button" key={row.accountTitleId} onClick={() => handleSelectExpenseType(row)}>
                            <span>{row.code}</span>
                            <strong>{row.description}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </FormField>
              <label className={`etr-expense-field etr-expense-description ${errors.description ? 'has-error' : ''}`}>
                <span>Particular/Description<strong>*</strong></span>
                <textarea name="description" value={formData.description} onChange={updateForm} rows="4" aria-invalid={!!errors.description} />
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
              <FormField label="Amount" name="amount" type="number" value={formData.amount} onChange={updateForm} error={errors.amount} required />
              <FormField label="VAT" name="vat" type="number" value={formData.vat} onChange={updateForm} />
              <FormField label="Total" name="total" value={formatMoney(total)} readOnly>
                <input value={formatMoney(total)} readOnly className="etr-expense-total-input" />
              </FormField>
            </div>
          </section>

          <section className="etr-expense-card etr-expense-upload-card">
            <div className="etr-expense-card-head">
              <h2>Attachment</h2>
              <span>Receipt preview</span>
            </div>
            <label className="etr-expense-upload">
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
              <span>Upload receipt or invoice</span>
              <strong>{formData.attachment || 'No file selected'}</strong>
            </label>
            <div className="etr-expense-preview">
              {attachmentPreview?.url ? (
                <img src={attachmentPreview.url} alt={attachmentPreview.name} />
              ) : (
                <div>
                  <strong>{attachmentPreview?.name || formData.attachment || 'Preview area'}</strong>
                  <span>{attachmentPreview ? `${attachmentPreview.type} - ${attachmentPreview.size}` : 'Image previews appear here after upload.'}</span>
                </div>
              )}
            </div>
          </section>

          <div className="etr-expense-approval-note">
            Existing expense records are view-only. Changes must go through approval.
          </div>
        </aside>
      </div>

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
