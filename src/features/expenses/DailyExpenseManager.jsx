import React, { useEffect, useMemo, useState } from 'react';
import { getToken } from '../../services/authStorage';
import './ExpenseEntry.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const DAILY_EXPENSE_ENDPOINT = '/api/daily-expense';

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

function normalizeDailyExpense(row) {
  const expenseDate = getField(row, ['expenseDate', 'ExpenseDate', 'date', 'Date']);
  const receiptDate = getField(row, ['receiptDate', 'ReceiptDate']);

  const expenseTypeDisplay =
    getField(row, ['expenseTypeDisplay', 'ExpenseTypeDisplay'])
    || [
      getField(row, ['expenseTypeCode', 'ExpenseTypeCode']),
      getField(row, ['expenseTypeDescription', 'ExpenseTypeDescription']),
    ].filter(Boolean).join(' - ')
    || getField(row, ['expenseType', 'ExpenseType']);

  return {
    expenseId: getField(row, ['expenseID', 'expenseId', 'ExpenseID', 'ExpenseId', 'id', 'Id']),
    status: getField(row, ['status', 'Status']) || 'Pending',
    employeeCode: getField(row, ['employeeCode', 'EmployeeCode', 'employeeNo', 'EmployeeNo']),
    employeeName: getField(row, ['employeeName', 'EmployeeName', 'name', 'Name']),
    date: formatDate(expenseDate),
    dateInput: formatDateForInput(expenseDate),
    referenceNo: getField(row, ['referenceNo', 'ReferenceNo']),
    receiptDate: formatDate(receiptDate),
    receiptDateInput: formatDateForInput(receiptDate),
    expenseType: expenseTypeDisplay,
    expenseTypeId: getField(row, ['expenseType', 'ExpenseType']),
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
    attachment: getField(row, ['attachment', 'Attachment']),
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
  { key: 'tinNo', label: 'TIN No' },
  { key: 'orSiNo', label: 'OR/SI No' },
  { key: 'documentNo', label: 'Document No' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', isNumber: true },
  { key: 'vat', label: 'Vat', isNumber: true },
  { key: 'total', label: 'Total', isNumber: true },
  { key: 'attachment', label: 'Attachment' },
];

export default function DailyExpenseManager({ onNewEntry, onOpenExpense }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const token = getToken();
    const controller = new AbortController();

    const loadDailyExpenses = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetch(buildApiUrl(DAILY_EXPENSE_ENDPOINT), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load daily expense transactions.');
        }

        setRows(getApiCollection(data).map(normalizeDailyExpense));
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

  return (
    <div className="etr-expense-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Finance</p>
          <h1>Daily Expense Manager</h1>
          <span>Review daily expense transactions and open the full entry details.</span>
        </div>

        <div className="etr-expense-actions">
          <button type="button" className="etr-expense-save-button" onClick={onNewEntry}>New Entry</button>
        </div>
      </div>

      {loadError ? <div className="etr-expense-save-message is-error">{loadError}</div> : null}

      <section className="etr-expense-table-panel">
        <div className="etr-expense-table-head">
          <div>
            <h2>Daily Expense Transactions</h2>
            <span>{isLoading ? 'Loading transactions...' : `${filteredRows.length} transaction${filteredRows.length === 1 ? '' : 's'} found`}</span>
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
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!isLoading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>No daily expense transactions found.</td>
                </tr>
              ) : null}

              {filteredRows.map((row) => (
                <tr
                  key={row.expenseId || row.referenceNo}
                  className="etr-expense-clickable-row"
                  onClick={() => onOpenExpense(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={column.isNumber ? 'is-number' : ''}>
                      {column.key === 'status' ? (
                        <span className={`etr-expense-status ${String(row.status).toLowerCase()}`}>
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
      </section>
    </div>
  );
}
