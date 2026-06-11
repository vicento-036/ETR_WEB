import React from 'react';

function DataTable({
  columns = [],
  rows = [],
  getRowKey = (_, index) => index,
  renderCell,
  emptyMessage = 'No records found.',
  className = '',
  wrapperClassName = '',
  emptyClassName = '',
}) {
  return (
    <div className={wrapperClassName}>
      <table className={className}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key || column.label} className={column.headerClassName}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              {columns.map((column) => (
                <td key={column.key || column.label} className={column.className}>
                  {renderCell ? renderCell(row, column, rowIndex) : row[column.key]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className={emptyClassName} colSpan={Math.max(columns.length, 1)}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
