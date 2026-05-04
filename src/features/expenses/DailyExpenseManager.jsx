import React, { useState } from 'react';
import { formatDateForTable } from './expenseUtils.jsx';
import { dailyExpenseColumns, dailyExpenseFieldKeys } from './ExpenseEntry';
import './ExpenseEntry.css';

function renderExpenseCell(row, fieldKey) {
  if (fieldKey === 'status') {
    return (
      <span className={`etr-expense-status ${row.status === 'Approved' ? 'is-approved' : 'is-pending'}`}>
        {row.status || 'Pending'}
      </span>
    );
  }

  if (fieldKey === 'date' || fieldKey === 'receiptDate') {
    return formatDateForTable(row[fieldKey]);
  }

  return row[fieldKey] || '';
}

export function DailyExpenseManagerView({
  expenseRows,
  isLoading = false,
  error = '',
  onOpenTransaction,
  onCreateNew,
}) {
  const [managerQuery, setManagerQuery] = useState('');
  const filteredRows = expenseRows.filter((row) => {
    const query = managerQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return dailyExpenseFieldKeys
      .map((fieldKey) => row[fieldKey])
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className="etr-expense-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Finance</p>
          <h1>Daily Expense Manager</h1>
          <span>Review daily expense transactions and open the full entry details.</span>
        </div>
        <div className="etr-expense-actions">
          <button type="button" className="etr-expense-save-button" onClick={onCreateNew}>New Entry</button>
        </div>
      </div>

      {error ? <div className="etr-expense-save-message is-error">{error}</div> : null}

      <section className="etr-expense-table-panel">
        <div className="etr-expense-table-head">
          <div>
            <h2>Daily Expense Transactions</h2>
            <span>Status shows whether each transaction is Pending or Approved.</span>
          </div>
          <label className="etr-expense-manager-search">
            <span>Search</span>
            <input
              value={managerQuery}
              onChange={(event) => setManagerQuery(event.target.value)}
              placeholder="Reference, employee, status, or document no"
            />
          </label>
        </div>

        <div className="etr-expense-table-wrap">
          <table className="etr-expense-table manager">
            <thead>
              <tr>
                {dailyExpenseColumns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={dailyExpenseColumns.length}>Loading daily expense transactions...</td>
                </tr>
              ) : null}
              {!isLoading && filteredRows.map((row) => (
                <tr
                  key={row.referenceNo}
                  onClick={() => onOpenTransaction(row)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOpenTransaction(row);
                    }
                  }}
                  tabIndex="0"
                >
                  {dailyExpenseFieldKeys.map((fieldKey) => (
                    <td
                      key={fieldKey}
                      className={['amount', 'vat', 'total'].includes(fieldKey) ? 'is-number' : undefined}
                    >
                      {renderExpenseCell(row, fieldKey)}
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={dailyExpenseColumns.length}>No daily expense transactions found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DailyExpenseManagerView;
