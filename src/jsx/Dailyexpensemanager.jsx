import React, { useEffect, useMemo, useState } from 'react';
import { getToken } from '../services/authStorage';
import '../css/Dailyexpensemanager.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const DAILY_EXPENSE_ENDPOINT = '/api/daily-expense';
const COST_UNITS_ENDPOINT = '/api/costunits';
const CURRENT_EMPLOYEE_ENDPOINT = '/api/employees/current';
const MANAGER_PAGE_SIZE = 8;
const MAX_VISIBLE_PAGE_BUTTONS = 8;
const REPORT_VERIFIED_BY = 'ANGEL RASONABE';
const REPORT_APPROVED_BY = 'VILMA C';

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

function getField(row, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = row?.[fieldName];

    if (value !== undefined && value !== null && String(value).trim()) {
      return value;
    }
  }

  return '';
}

function getApiCollection(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatDateForInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const [month, day, year] = String(value).split('/');
    return year && month && day ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : String(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatMoney(value) {
  const numberValue = Number(String(value || 0).replace(/,/g, '')) || 0;

  return numberValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function parseMoney(value) {
  return Number(String(value || 0).replace(/,/g, '')) || 0;
}

function getTodayInputDate() {
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

function getReportEmployeeNo(user, rows) {
  return getUserField(user, [
    'employeeNo',
    'employeeCode',
    'employeeNumber',
    'empNo',
    'employeeId',
    'employeeID',
    'EmployeeNo',
    'EmployeeCode',
    'EmployeeNumber',
    'EmployeeId',
    'EmployeeID',
  ]) || rows.find((row) => row.employeeCode)?.employeeCode || '';
}

function getReportEmployeeName(user, rows) {
  const fullName = getUserField(user, ['employeeName', 'fullName', 'name', 'displayName', 'EmployeeName', 'FullName', 'Name']);

  if (fullName) {
    return fullName;
  }

  const lastName = getUserField(user, ['lastName', 'lastname', 'LastName', 'LASTNAME']);
  const firstName = getUserField(user, ['firstName', 'firstname', 'FirstName', 'FIRSTNAME']);

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }

  return rows.find((row) => row.employeeName)?.employeeName || firstName || lastName || '';
}

function normalizeReportEmployee(row) {
  if (!row) {
    return null;
  }

  const employeeNo = getReportEmployeeNo(row, []);
  const employeeName = getReportEmployeeName(row, []);

  if (!employeeNo && !employeeName) {
    return null;
  }

  return {
    employeeNo,
    employeeName,
  };
}

function getReportEmployeeFromApi(data) {
  return normalizeReportEmployee(data)
    || normalizeReportEmployee(data?.employee)
    || normalizeReportEmployee(data?.Employee)
    || normalizeReportEmployee(data?.data)
    || normalizeReportEmployee(data?.result);
}

function getSortValue(row, column) {
  if (column.isNumber) {
    return Number(String(row[`${column.key}Value`] ?? row[column.key] ?? 0).replace(/,/g, '')) || 0;
  }

  if (column.key === 'date') {
    return row.dateInput || row.date || '';
  }

  if (column.key === 'receiptDate') {
    return row.receiptDateInput || row.receiptDate || '';
  }

  return String(row[column.key] || '').toLowerCase();
}

function getVisiblePages(currentPage, totalPages) {
  const visibleCount = Math.min(MAX_VISIBLE_PAGE_BUTTONS, totalPages);
  const half = Math.floor(visibleCount / 2);
  const start = Math.max(1, Math.min(currentPage - half, totalPages - visibleCount + 1));

  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

function normalizeCostUnit(row) {
  const costUnitId = getField(row, ['costUnitID', 'costUnitId', 'CostUnitID', 'CostUnitId', 'id', 'Id']);
  const code = getField(row, ['code', 'Code']);
  const description = getField(row, ['description', 'Description']);

  if (!costUnitId || !code || !description) {
    return null;
  }

  return {
    costUnitId: String(costUnitId),
    display: `${code} - ${description}`,
  };
}

function normalizeExpenseStatusValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'approved' || normalized === '1') {
    return 1;
  }

  if (normalized === 'rejected' || normalized === '2') {
    return 2;
  }

  return 0;
}

function getExpenseStatusLabel(value) {
  const normalizedValue = normalizeExpenseStatusValue(value);

  if (normalizedValue === 1) {
    return 'Approved';
  }

  if (normalizedValue === 2) {
    return 'Rejected';
  }

  return 'Pending';
}

function getExpenseStatusClassName(value) {
  const normalizedValue = normalizeExpenseStatusValue(value);

  if (normalizedValue === 1) {
    return 'approved';
  }

  if (normalizedValue === 2) {
    return 'rejected';
  }

  return 'pending';
}

function normalizeDailyExpense(row, subsidiaryById = new Map()) {
  const expenseDate = getField(row, ['expenseDate', 'ExpenseDate', 'date', 'Date']);
  const receiptDate = getField(row, ['receiptDate', 'ReceiptDate']);
  const subsidiaryId = getField(row, ['costUnitID', 'costUnitId', 'CostUnitID', 'CostUnitId', 'subsidiaryId', 'SubsidiaryId']);
  const expenseId = getField(row, ['expenseID', 'expenseId', 'ExpenseID', 'ExpenseId', 'id', 'Id']);
  const attachmentValue = getField(row, ['attachment', 'Attachment']);
  const attachmentName = String(attachmentValue || '')
    .split(/[\\/]/)
    .filter(Boolean)
    .pop() || '';

  const expenseTypeDisplay =
    getField(row, ['expenseTypeDisplay', 'ExpenseTypeDisplay'])
    || [
      getField(row, ['expenseTypeCode', 'ExpenseTypeCode']),
      getField(row, ['expenseTypeDescription', 'ExpenseTypeDescription']),
    ].filter(Boolean).join(' - ')
    || getField(row, ['expenseType', 'ExpenseType']);
  const subsidiaryDisplay =
    getField(row, ['subsidiaryDisplay', 'SubsidiaryDisplay'])
    || [
      getField(row, ['subsidiaryCode', 'SubsidiaryCode', 'costUnitCode', 'CostUnitCode']),
      getField(row, ['subsidiaryDescription', 'SubsidiaryDescription', 'costUnitDescription', 'CostUnitDescription']),
    ].filter(Boolean).join(' - ')
    || subsidiaryById.get(String(subsidiaryId))
    || getField(row, ['subsidiary', 'Subsidiary', 'costUnit', 'CostUnit']);

  const statusValue = getField(row, ['statusValue', 'StatusValue', 'status', 'Status']);

  return {
    expenseId,
    status: getExpenseStatusLabel(statusValue),
    statusValue: normalizeExpenseStatusValue(statusValue),
    employeeCode: getField(row, ['employeeCode', 'EmployeeCode', 'employeeNo', 'EmployeeNo']),
    employeeName: getField(row, ['employeeName', 'EmployeeName', 'name', 'Name']),
    date: formatDate(expenseDate),
    dateInput: formatDateForInput(expenseDate),
    referenceNo: getField(row, ['referenceNo', 'ReferenceNo']),
    receiptDate: formatDate(receiptDate),
    receiptDateInput: formatDateForInput(receiptDate),
    expenseType: expenseTypeDisplay,
    expenseTypeId: getField(row, ['expenseType', 'ExpenseType']),
    subsidiary: subsidiaryDisplay,
    subsidiaryId,
    tinNo: getField(row, ['tin', 'TIN', 'tinNo', 'TinNo', 'TINNo']),
    orSiNo: getField(row, ['orSINo', 'orsiNo', 'orSiNo', 'orSI_No', 'or_si_no', 'ORSINo', 'ORSI_No', 'OrSiNo']),
    documentNo: getField(row, ['documentNo', 'DocumentNo']),
    description: getField(row, ['description', 'Description']),
    amount: formatMoney(getField(row, ['amount', 'Amount'])),
    amountValue: getField(row, ['amount', 'Amount']),
    vat: formatMoney(getField(row, ['vat', 'Vat', 'VAT'])),
    vatValue: getField(row, ['vat', 'Vat', 'VAT']),
    total: formatMoney(getField(row, ['total', 'Total'])),
    totalValue: getField(row, ['total', 'Total']),
    attachment: attachmentName || attachmentValue,
    attachmentUrl: expenseId ? `${DAILY_EXPENSE_ENDPOINT}/${expenseId}/attachment` : getField(row, ['attachmentUrl', 'AttachmentUrl', 'attachmentURL', 'AttachmentURL', 'attachmentPath', 'AttachmentPath', 'fileUrl', 'FileUrl', 'url', 'Url']),
  };
}

const columns = [
  { key: 'status', label: 'Status' },
  { key: 'employeeCode', label: 'Employee Code' },
  { key: 'employeeName', label: 'Employee Name' },
  { key: 'date', label: 'Date' },
  { key: 'referenceNo', label: 'Reference No' },
  { key: 'receiptDate', label: 'Receipt Date' },
  { key: 'expenseType', label: 'Expense Type' },
  { key: 'subsidiary', label: 'Subsidiary' },
  { key: 'tinNo', label: 'TIN No' },
  { key: 'orSiNo', label: 'OR/SI No' },
  { key: 'documentNo', label: 'Document No' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', isNumber: true },
  { key: 'vat', label: 'Vat', isNumber: true },
  { key: 'total', label: 'Total', isNumber: true },
  { key: 'attachment', label: 'Attachment' },
];

function ExpenseReportView({ rows, user, isLoading = false, loadError = '', onBack }) {
  const [employeeNo, setEmployeeNo] = useState(() => getReportEmployeeNo(user, rows));
  const [employeeName, setEmployeeName] = useState(() => getReportEmployeeName(user, rows));
  const [employeeLoadError, setEmployeeLoadError] = useState('');
  const [hasCurrentEmployee, setHasCurrentEmployee] = useState(false);
  const [reportDate, setReportDate] = useState(getTodayInputDate);
  const [purpose, setPurpose] = useState('Reimbursement');
  const [dateFrom, setDateFrom] = useState('2026-05-05');
  const [dateTo, setDateTo] = useState('2026-05-09');
  const reportNo = 'ER-2026-0001';
  const approvedRows = useMemo(() => rows.filter((row) => normalizeExpenseStatusValue(row.statusValue ?? row.status) === 1), [rows]);
  const filteredReportRows = useMemo(() => {
    return approvedRows.filter((row) => {
      const rowDate = row.dateInput || formatDateForInput(row.date);

      if (!rowDate) {
        return false;
      }

      if (dateFrom && rowDate < dateFrom) {
        return false;
      }

      if (dateTo && rowDate > dateTo) {
        return false;
      }

      return true;
    });
  }, [approvedRows, dateFrom, dateTo]);
  const grandTotal = filteredReportRows.reduce((sum, row) => sum + parseMoney(row.totalValue ?? row.total), 0);
  const dateRangeLabel = `${dateFrom ? formatDate(dateFrom) : 'Start'} - ${dateTo ? formatDate(dateTo) : 'End'}`;

  useEffect(() => {
    if (hasCurrentEmployee) {
      return;
    }

    setEmployeeNo(getReportEmployeeNo(user, rows));
    setEmployeeName(getReportEmployeeName(user, rows));
  }, [hasCurrentEmployee, rows, user]);

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadCurrentEmployee = async () => {
      setEmployeeLoadError('');

      try {
        const response = await fetch(buildApiUrl(CURRENT_EMPLOYEE_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load current employee information.');
        }

        const employee = getReportEmployeeFromApi(data);

        if (employee) {
          setEmployeeNo(employee.employeeNo);
          setEmployeeName(employee.employeeName);
          setHasCurrentEmployee(true);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setEmployeeLoadError(error.message || 'Unable to load current employee information.');
        }
      }
    };

    loadCurrentEmployee();

    return () => controller.abort();
  }, []);

  const handleGenerateReport = () => {
    if (isLoading || loadError) {
      return;
    }

    window.setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <div className="etr-report-workspace">
      <div className="etr-expense-toolbar etr-report-screen-toolbar">
        <div>
          <p className="etr-expense-kicker">Finance</p>
          <h1>Generate Expense Report</h1>
          <span>Set the report details, then generate the printable form directly.</span>
        </div>

        <div className="etr-expense-actions">
          <button type="button" onClick={onBack}>Back</button>
        </div>
      </div>

      <section className="etr-report-control-panel etr-report-screen-toolbar">
        <div className="etr-report-control-head">
          <div>
            <p>Report Builder</p>
            <h2>Approved expense reimbursement form</h2>
          </div>
          <span>{isLoading ? 'Loading expenses from API' : 'Generate opens print dialog'}</span>
        </div>

        {loadError ? <div className="etr-expense-save-message is-error">{loadError}</div> : null}
        {employeeLoadError ? <div className="etr-expense-save-message is-error">{employeeLoadError}</div> : null}

        <div className="etr-report-builder-layout">
          <div className="etr-report-control-grid">
            <label>
              <span>Employee No</span>
              <input value={employeeNo} onChange={(event) => setEmployeeNo(event.target.value)} />
            </label>
            <label>
              <span>Employee Name</span>
              <input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} />
            </label>
            <label>
              <span>Date</span>
              <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
            </label>
            <label className="is-wide">
              <span>Purpose</span>
              <input value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            </label>
            <label>
              <span>Date From</span>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label>
              <span>Date To</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </label>
          </div>

          <aside className="etr-report-filter-card">
            <span>Generate No</span>
            <strong>{reportNo}</strong>
            <p>{dateRangeLabel}</p>
            <button type="button" className="etr-report-generate-button" onClick={handleGenerateReport} disabled={isLoading || !!loadError}>
              {isLoading ? 'Loading Expenses...' : 'Generate Expense Report'}
            </button>
          </aside>
        </div>
      </section>

      <section className="etr-report-print-only" aria-hidden="true">
        <section className="etr-report-paper" aria-label="Final expense report">
        <div className="etr-report-company-bar">Masigasig Distribution and Logistics Inc.</div>
        <div className="etr-report-title-row">
          <div>
            <h2>FINAL REPORT</h2>
          </div>
          <div className="etr-report-number">
            <span>Generate No:</span>
            <strong>{reportNo}</strong>
          </div>
        </div>

        <div className="etr-report-info-grid">
          <div>
            <span>Employee No.</span>
            <strong>{employeeNo}</strong>
          </div>
          <div>
            <span>Name of Employee</span>
            <strong>{employeeName}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{formatDate(reportDate)}</strong>
          </div>
          <div className="is-purpose">
            <span>Purpose</span>
            <strong>{purpose}</strong>
          </div>
        </div>

        <div className="etr-report-table-wrap">
          <table className="etr-report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference No</th>
                <th>Particulars / Description</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportRows.length > 0 ? filteredReportRows.map((row) => (
                <tr key={row.expenseId || row.referenceNo || `${row.dateInput}-${row.total}`}>
                  <td>{row.date || formatDate(row.dateInput)}</td>
                  <td>{row.referenceNo}</td>
                  <td>{row.description || row.expenseType}</td>
                  <td className="is-number">{formatMoney(row.totalValue ?? row.total)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="etr-report-empty">No approved transactions found.</td>
                </tr>
              )}
              <tr className="etr-report-total-row">
                <td colSpan="3">TOTAL</td>
                <td className="is-number">{formatMoney(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="etr-report-signatures">
          <div>
            <span>Submitted By</span>
            <strong>{employeeName}</strong>
          </div>
          <div>
            <span>Verified By</span>
            <strong>{REPORT_VERIFIED_BY}</strong>
          </div>
          <div>
            <span>Approved By</span>
            <strong>{REPORT_APPROVED_BY}</strong>
          </div>
        </div>
      </section>
      </section>
    </div>
  );
}

export default function DailyExpenseManager({ user, onNewEntry, onOpenExpense }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadDailyExpenses = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [expenseResponse, costUnitResponse] = await Promise.all([
          fetch(buildApiUrl(DAILY_EXPENSE_ENDPOINT), {
            headers,
            signal: controller.signal,
          }),
          fetch(buildApiUrl(COST_UNITS_ENDPOINT), {
            headers,
            signal: controller.signal,
          }),
        ]);

        const expenseData = await expenseResponse.json().catch(() => ({}));
        const costUnitData = await costUnitResponse.json().catch(() => ({}));

        if (!expenseResponse.ok) {
          throw new Error(expenseData?.message || 'Unable to load daily expense transactions.');
        }

        if (!costUnitResponse.ok) {
          throw new Error(costUnitData?.message || 'Unable to load subsidiaries.');
        }

        const subsidiaryById = new Map(
          getApiCollection(costUnitData)
            .map(normalizeCostUnit)
            .filter(Boolean)
            .map((item) => [item.costUnitId, item.display])
        );

        setRows(getApiCollection(expenseData).map((row) => normalizeDailyExpense(row, subsidiaryById)));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setRows([]);
          setLoadError(error.message || 'Unable to load daily expense transactions.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadDailyExpenses();

    return () => controller.abort();
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) => columns
      .map((column) => row[column.key])
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery));
  }, [query, rows]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) {
      return filteredRows;
    }

    const column = columns.find((item) => item.key === sortConfig.key);

    if (!column) {
      return filteredRows;
    }

    return [...filteredRows].sort((first, second) => {
      const firstValue = getSortValue(first, column);
      const secondValue = getSortValue(second, column);

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

  if (isReportOpen) {
    return (
      <ExpenseReportView
        rows={rows}
        user={user}
        isLoading={isLoading}
        loadError={loadError}
        onBack={() => setIsReportOpen(false)}
      />
    );
  }

  return (
    <div className="etr-expense-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Finance</p>
          <h1>Daily Expense Manager</h1>
          <span>Review daily expense transactions and open the full entry details.</span>
        </div>

        <div className="etr-expense-actions">
          <button type="button" onClick={() => setIsReportOpen(true)}>Generate Expense Report</button>
          <button type="button" className="etr-expense-save-button" onClick={onNewEntry}>New Entry</button>
        </div>
      </div>

      {loadError ? <div className="etr-expense-save-message is-error">{loadError}</div> : null}

      <section className="etr-expense-table-panel">
        <div className="etr-expense-table-head">
          <div>
            <h2>Daily Expense Transactions</h2>
            <span>{isLoading ? 'Loading transactions...' : `${sortedRows.length} transaction${sortedRows.length === 1 ? '' : 's'} found`}</span>
          </div>

          <label className="etr-expense-manager-search">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Reference, employee, status, or document no"
            />
          </label>
        </div>

        <div className="etr-expense-table-wrap">
          <table className="etr-expense-table etr-expense-manager-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    aria-sort={sortConfig.key === column.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      className={`etr-expense-sort-button ${sortConfig.key === column.key ? 'is-active' : ''}`}
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <span className={`etr-expense-sort-indicator ${sortConfig.key === column.key ? `is-${sortConfig.direction}` : ''}`} aria-hidden="true" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!isLoading && sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>No daily expense transactions found.</td>
                </tr>
              ) : null}

              {pagedRows.map((row) => (
                <tr
                  key={row.expenseId || row.referenceNo}
                  className="etr-expense-clickable-row"
                  onClick={() => onOpenExpense(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={column.isNumber ? 'is-number' : ''}>
                      {column.key === 'status' ? (
                        <span className={`etr-expense-status ${getExpenseStatusClassName(row.statusValue)}`}>
                          {row.status}
                        </span>
                      ) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedRows.length > 0 ? (
          <div className="etr-expense-pagination" aria-label="Daily expense pagination">
            <span>
              Showing {(page - 1) * MANAGER_PAGE_SIZE + 1}-{Math.min(page * MANAGER_PAGE_SIZE, sortedRows.length)} of {sortedRows.length}
            </span>
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              Previous
            </button>
            <div className="etr-expense-page-numbers">
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
