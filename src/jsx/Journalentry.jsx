import React, { useEffect, useMemo, useState } from 'react';
import '../css/Journalentry.css';

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
    status: 'Draft',
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
    status: 'Draft',
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

const initialLines = [
  {
    id: 1,
    selected: false,
    accountCode: '6100-001',
    accountTitle: 'Office Supplies Expense',
    subsidiary: 'HEAD OFFICE',
    costCenter: 'ADMIN',
    debit: '12500.00',
    credit: '',
    remarks: 'May supplies accrual',
  },
  {
    id: 2,
    selected: false,
    accountCode: '2100-004',
    accountTitle: 'Accrued Expenses',
    subsidiary: 'HEAD OFFICE',
    costCenter: 'ADMIN',
    debit: '',
    credit: '12500.00',
    remarks: 'Offsetting liability',
  },
];

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

function getStatusClass(status) {
  return `is-${String(status || '').toLowerCase().replace(/\s+/g, '-')}`;
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

function getUserDisplayName(user) {
  return user?.employeeName
    || user?.EmployeeName
    || user?.fullName
    || user?.FullName
    || user?.name
    || user?.Name
    || user?.username
    || user?.Username
    || 'etradmin';
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

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return journalRows;
    }

    return journalRows.filter((row) => (
      managerColumns.some((column) => String(row[column.key] || '').toLowerCase().includes(normalizedQuery))
    ));
  }, [query]);

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

function JournalEntryView({ user }) {
  const [lines, setLines] = useState(initialLines);
  const auditUserName = getUserDisplayName(user);
  const [header, setHeader] = useState({
    transactionNo: '',
    transactionDate: '2026-05-19',
    ledgerBook: 'GENERAL',
    referenceType: 'Adjustment',
    referenceNo: 'JV-0519-018',
    company: 'ETR Integrated Systems',
    remarks: 'Month-end accrual adjustment',
  });

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
          <button type="button" className="is-primary">Save Draft</button>
          <button type="button">Post to Ledger</button>
          <button type="button">Print Voucher</button>
        </div>
      </div>

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
                  <span>User trail</span>
                </div>
                <div className="etr-journal-audit-grid">
                  <label className="etr-journal-field">
                    <span>Created By</span>
                    <input value={auditUserName} readOnly />
                  </label>
                  <label className="etr-journal-field">
                    <span>Last Modified By</span>
                    <input value={auditUserName} readOnly />
                  </label>
                  <label className="etr-journal-field">
                    <span>Posted/Cancelled By</span>
                    <input value="" readOnly placeholder="-" />
                  </label>
                </div>
              </section>

              <section className="etr-journal-card etr-journal-cancel-card">
                <label className="etr-journal-field">
                  <span>Cancellation Remarks</span>
                  <textarea rows={3} placeholder="No cancellation remarks" />
                </label>
              </section>
            </div>
          </div>

        </div>

        <aside className="etr-journal-side-stack">
          <section className="etr-journal-card etr-journal-summary-card">
            <div className="etr-journal-card-head">
              <h2>Amount</h2>
              <span>Auto-computed totals</span>
            </div>
            <label className="etr-journal-field">
              <span>Debit Total</span>
              <input value={formatMoney(totals.debit)} readOnly />
            </label>
            <label className="etr-journal-field">
              <span>Credit Total</span>
              <input value={formatMoney(totals.credit)} readOnly />
            </label>
            <label className="etr-journal-field">
              <span>Variance</span>
              <input className={isBalanced ? 'is-balanced-total' : 'is-warning-total'} value={signedVarianceLabel} readOnly />
            </label>
          </section>

          <section className="etr-journal-card etr-journal-side-remarks-card">
            <div className="etr-journal-card-head">
              <h2>Remarks</h2>
              <span>Supporting notes</span>
            </div>

            <label className="etr-journal-field">
              <textarea value={header.remarks} onChange={(event) => updateHeader('remarks', event.target.value)} rows={3} />
            </label>
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
        </section>
      </div>
    </div>
  );
}

export default JournalEntryView;
