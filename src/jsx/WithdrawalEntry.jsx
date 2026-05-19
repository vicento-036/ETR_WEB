import React, { useMemo, useState } from 'react';
import '../css/WithdrawalEntry.css';

const todayIso = new Date().toISOString().slice(0, 10);

const detailTabs = [
  { id: 'details', label: 'Details' },
  { id: 'allocation', label: 'Stock Allocation' },
  { id: 'insufficient', label: 'Insufficient Stocks' },
];

const detailColumns = [
  'Item Code',
  'Item Description',
  'Unit',
  'Quantity',
  'Insfnt.Qty',
  'W.Quantity',
  'Remarks',
];

function ActionIcon({ label }) {
  const icons = {
    New: <path d="M6 3h8l4 4v14H6V3Zm8 1.8V8h3.2L14 4.8Z" />,
    'Copy From': <path d="M7 7h10v12H7V7Zm-3-4h10v2H6v10H4V3Z" />,
    Find: <path d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z" />,
    Save: <path d="M5 3h13l1 1v17H5V3Zm3 2v5h8V5H8Zm0 10v4h8v-4H8Z" />,
    Undo: <path d="M9 7V3L2 10l7 7v-4h5a5 5 0 0 1 5 5v1h2v-1a7 7 0 0 0-7-7H9Z" />,
    Approve: <path d="M9.2 16.6 4.9 12.3l1.4-1.4 2.9 2.9 8.5-8.5 1.4 1.4-9.9 9.9Z" />,
    Reject: <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm11.2 0L19 6.4 6.4 19 5 17.6 17.6 5Z" />,
    Print: <path d="M7 3h10v5H7V3Zm-2 7h14a2 2 0 0 1 2 2v6h-4v3H7v-3H3v-6a2 2 0 0 1 2-2Zm4 7v2h6v-2H9Z" />,
    Close: <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm11.2 0L19 6.4 6.4 19 5 17.6 17.6 5Z" />,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[label]}
    </svg>
  );
}

function Field({ label, children, link = false, className = '' }) {
  return (
    <label className={`etr-withdrawal-field ${className}`}>
      <span className={link ? 'is-link-label' : ''}>{label}</span>
      {children || <input type="text" />}
    </label>
  );
}

function SplitField({ label, link = false }) {
  return (
    <Field label={label} link={link}>
      <div className="etr-withdrawal-split-input">
        <input type="text" aria-label={`${label} code`} />
        <input type="text" aria-label={`${label} description`} />
      </div>
    </Field>
  );
}

export default function WithdrawalEntry() {
  const [activeTab, setActiveTab] = useState('details');
  const totals = useMemo(() => ({
    quantity: 0,
    withdrawalQuantity: 0,
    insufficientQuantity: 0,
  }), []);

  return (
    <div className="etr-withdrawal-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Inventory</p>
          <h1>Withdrawal Entry</h1>
          <span>Create and review stock withdrawal transactions.</span>
        </div>
        <div className="etr-withdrawal-header-actions">
          <span className="etr-withdrawal-status-pill">Pending</span>
          <button type="button">New</button>
          <button type="button">Find</button>
          <button type="button" className="is-primary">Save</button>
        </div>
      </div>

      <section className="etr-withdrawal-form-panel">
        <div className="etr-withdrawal-form-section">
          <div className="etr-withdrawal-grid dense">
            <div className="etr-withdrawal-grid-column">
              <div className="etr-withdrawal-card-head">
                <div>
                  <p>General</p>
                  <h2>Transaction Info</h2>
                </div>
              </div>
              <Field label="Transaction No.">
                <input type="text" />
              </Field>
              <Field label="Transaction Date">
                <input type="date" defaultValue={todayIso} />
              </Field>
              <Field label="Type" className="is-wide">
                <select defaultValue="">
                  <option value="" />
                  <option>Warehouse Withdrawal</option>
                  <option>Charge Withdrawal</option>
                </select>
              </Field>
              <SplitField label="Recipient" link />
              <Field label="Address" className="is-wide">
                <input type="text" />
              </Field>
              <SplitField label="Reason" link />
              <Field label="Remarks" className="is-wide">
                <textarea rows="3" />
              </Field>
              <Field label="Warehouse" link className="is-wide">
                <input type="text" />
              </Field>
              <SplitField label="Charge To" link />
              <Field label="Company" link className="is-wide">
                <input type="text" />
              </Field>
            </div>

            <div className="etr-withdrawal-grid-column etr-withdrawal-stocks-column">
              <div className="etr-withdrawal-card-head">
                <div>
                  <p aria-hidden="true">&nbsp;</p>
                  <h2>Withdrawing Stocks At</h2>
                </div>
              </div>
              <Field label="Reference Type">
                <select defaultValue="">
                  <option value="" />
                  <option>Order Entry</option>
                  <option>Delivery Manifest</option>
                </select>
              </Field>
              <Field label="Reference No." link>
                <input type="text" />
              </Field>
              <div className="etr-withdrawal-row-pair">
                <Field label="Created By">
                  <input type="text" />
                </Field>
                <Field label="Date">
                  <input type="date" defaultValue={todayIso} />
                </Field>
              </div>
              <div className="etr-withdrawal-row-pair">
                <Field label="Last Modified By">
                  <input type="text" />
                </Field>
                <Field label="Date">
                  <input type="date" defaultValue={todayIso} />
                </Field>
              </div>
              <div className="etr-withdrawal-row-pair">
                <Field label="Approved / Rejected By">
                  <input type="text" />
                </Field>
                <Field label="Date">
                  <input type="date" defaultValue={todayIso} />
                </Field>
              </div>
              <Field label="Del. Instructions">
                <input type="text" />
              </Field>
              <div className="etr-withdrawal-row-pair etr-withdrawal-pod-inline">
                <Field label="POD No.">
                  <input type="text" />
                </Field>
                <button type="button">Autogenerate</button>
              </div>
              <div className="etr-withdrawal-row-pair">
                <Field label="Target Delivery">
                  <input type="date" defaultValue={todayIso} />
                </Field>
                <Field label="No. of Pallets">
                  <input type="number" defaultValue="0" />
                </Field>
              </div>
              <Field label="Declare Value">
                <input type="number" step="0.0001" defaultValue="0.0000" />
              </Field>
            </div>
          </div>
        </div>
      </section>

      <section className="etr-withdrawal-table-panel">
        <div className="etr-withdrawal-tabs">
          {detailTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="etr-withdrawal-table-tools">
          <button type="button">
            <ActionIcon label="Reject" />
            <span>Delete Selected</span>
          </button>
          <span>Total Qty: {totals.quantity}</span>
          <span>Total W. Qty.: {totals.withdrawalQuantity}</span>
          <span>Total Insfnt. Qty.: {totals.insufficientQuantity}</span>
        </div>

        <div className="etr-withdrawal-table-wrap">
          <table className="etr-withdrawal-table">
            <thead>
              <tr>
                <th aria-label="Select row" />
                {detailColumns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox" aria-label="Select detail row" /></td>
                <td><button type="button" className="etr-withdrawal-link">Click to Select</button></td>
                <td><button type="button" className="etr-withdrawal-link">Click to Select</button></td>
                <td>
                  <select aria-label="Unit">
                    <option />
                  </select>
                </td>
                <td><input type="number" aria-label="Quantity" /></td>
                <td><input type="number" aria-label="Insufficient quantity" /></td>
                <td><input type="number" aria-label="Withdrawal quantity" /></td>
                <td><input type="text" aria-label="Remarks" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
