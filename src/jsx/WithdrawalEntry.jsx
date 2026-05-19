import React, { useMemo, useState } from 'react';
import '../css/WithdrawalEntry.css';

const todayIso = new Date().toISOString().slice(0, 10);
const emptyForm = {
  transactionNo: '',
  transactionDate: todayIso,
  withdrawalType: '',
  recipientCode: '',
  recipientName: '',
  address: '',
  reasonCode: '',
  reasonDescription: '',
  remarks: '',
  warehouse: '',
  chargeToCode: '',
  chargeToName: '',
  company: '',
  referenceType: '',
  referenceNo: '',
  createdBy: '',
  createdDate: todayIso,
  lastModifiedBy: '',
  lastModifiedDate: todayIso,
  approvedBy: '',
  approvedDate: todayIso,
  deliveryInstructions: '',
  podNo: '',
  targetDelivery: todayIso,
  noOfPallets: '0',
  declareValue: '0.0000',
};

const detailTabs = [
  { id: 'details', label: 'Details' },
  { id: 'allocation', label: 'Stock Allocation' },
  { id: 'insufficient', label: 'Insufficient Stocks' },
];

const lookupData = {
  recipient: [
    { code: 'CUST-001', description: 'Northern Luzon Customer', address: 'Balintawak, Quezon City' },
    { code: 'EMP-014', description: 'Charlvn Talatayod', address: 'Head Office' },
  ],
  reason: [
    { code: 'SAMPLE', description: 'Sample issuance' },
    { code: 'DAMAGE', description: 'Damaged stock replacement' },
  ],
  warehouse: [
    { code: 'MAIN', description: 'Main Warehouse' },
    { code: 'COLD', description: 'Cold Storage Warehouse' },
  ],
  chargeTo: [
    { code: 'OPS', description: 'Operations Department' },
    { code: 'SALES', description: 'Sales Team' },
  ],
  company: [
    { code: 'MDLI', description: 'Masigasig Distribution and Logistics Inc.' },
    { code: 'ETR', description: 'ETR Total Business Solutions Provider' },
  ],
  item: [
    { code: 'ITM-001', description: 'Sample Inventory Item', unit: 'BOX' },
    { code: 'ITM-002', description: 'Promo Stock Item', unit: 'PCS' },
  ],
};

const actionLabels = ['New', 'Copy From', 'Edit', 'Delete', 'Find', 'Save', 'Undo', 'Approve', 'Reject', 'Print'];

function createBlankDetailRow() {
  return {
    id: crypto.randomUUID?.() || String(Date.now()),
    selected: false,
    itemCode: '',
    itemDescription: '',
    unit: '',
    quantity: '',
    insufficientQuantity: '',
    withdrawalQuantity: '',
    remarks: '',
  };
}

function parseNumber(value) {
  return Number(String(value || 0).replace(/,/g, '')) || 0;
}

function ActionIcon({ label }) {
  const icons = {
    New: <path d="M6 3h8l4 4v14H6V3Zm8 1.8V8h3.2L14 4.8Z" />,
    'Copy From': <path d="M7 7h10v12H7V7Zm-3-4h10v2H6v10H4V3Z" />,
    Edit: <path d="M5 16.8 15.8 6l2.2 2.2L7.2 19H5v-2.2ZM17 4.8 18.8 3 21 5.2 19.2 7 17 4.8Z" />,
    Delete: <path d="M7 7h10l-1 14H8L7 7Zm2-4h6l1 2h4v2H4V5h4l1-2Z" />,
    Find: <path d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z" />,
    Save: <path d="M5 3h13l1 1v17H5V3Zm3 2v5h8V5H8Zm0 10v4h8v-4H8Z" />,
    Undo: <path d="M9 7V3L2 10l7 7v-4h5a5 5 0 0 1 5 5v1h2v-1a7 7 0 0 0-7-7H9Z" />,
    Approve: <path d="M9.2 16.6 4.9 12.3l1.4-1.4 2.9 2.9 8.5-8.5 1.4 1.4-9.9 9.9Z" />,
    Reject: <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm11.2 0L19 6.4 6.4 19 5 17.6 17.6 5Z" />,
    Print: <path d="M7 3h10v5H7V3Zm-2 7h14a2 2 0 0 1 2 2v6h-4v3H7v-3H3v-6a2 2 0 0 1 2-2Zm4 7v2h6v-2H9Z" />,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[label]}</svg>;
}

function Field({ label, children, link = false, className = '', error = '', onLabelClick }) {
  return (
    <label className={`etr-withdrawal-field ${className} ${error ? 'has-error' : ''}`}>
      <button type="button" className={link ? 'is-link-label' : ''} onClick={onLabelClick} disabled={!onLabelClick}>
        {label}
      </button>
      {children || <input type="text" />}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function LookupModal({ type, title, onClose, onSelect }) {
  const rows = lookupData[type] || [];
  const [query, setQuery] = useState('');
  const filteredRows = rows.filter((row) => `${row.code} ${row.description}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="etr-withdrawal-modal-backdrop" role="presentation">
      <section className="etr-withdrawal-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="etr-withdrawal-modal-head">
          <div>
            <p className="etr-expense-kicker">Lookup</p>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code or description" />
        <div className="etr-withdrawal-lookup-list">
          {filteredRows.map((row) => (
            <button type="button" key={`${row.code}-${row.description}`} onClick={() => onSelect(row)}>
              <strong>{row.code}</strong>
              <span>{row.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function WithdrawalEntry() {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(true);
  const [status, setStatus] = useState('Pending');
  const [formData, setFormData] = useState(emptyForm);
  const [details, setDetails] = useState([createBlankDetailRow()]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [lookup, setLookup] = useState(null);

  const totals = useMemo(() => ({
    quantity: details.reduce((sum, row) => sum + parseNumber(row.quantity), 0),
    withdrawalQuantity: details.reduce((sum, row) => sum + parseNumber(row.withdrawalQuantity), 0),
    insufficientQuantity: details.reduce((sum, row) => sum + parseNumber(row.insufficientQuantity), 0),
  }), [details]);

  const updateForm = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const updateDetail = (rowId, field, value) => {
    setDetails((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.withdrawalType) nextErrors.withdrawalType = 'Withdrawal Type is required.';
    if (!formData.recipientName) nextErrors.recipient = 'Recipient is required.';
    if (!formData.reasonDescription) nextErrors.reason = 'Reason is required.';
    if (!formData.chargeToName) nextErrors.chargeTo = 'Charge To is required.';
    if (!formData.company) nextErrors.company = 'Company is required.';
    if (!details.some((row) => row.itemCode && parseNumber(row.quantity) > 0)) nextErrors.details = 'At least one detail with quantity is required.';
    if (details.some((row) => parseNumber(row.withdrawalQuantity) !== (parseNumber(row.quantity) - parseNumber(row.insufficientQuantity)))) {
      nextErrors.details = 'W.Quantity must equal Quantity less Insfnt.Qty.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAction = (action) => {
    if (action === 'New') {
      setFormData(emptyForm);
      setDetails([createBlankDetailRow()]);
      setStatus('Pending');
      setIsEditing(true);
      setMessage('New withdrawal entry started.');
      setErrors({});
      return;
    }
    if (action === 'Edit') {
      setIsEditing(true);
      setMessage('Edit mode enabled.');
      return;
    }
    if (action === 'Undo') {
      setIsEditing(false);
      setMessage('Changes cancelled for this frontend draft.');
      return;
    }
    if (action === 'Find' || action === 'Copy From') {
      setMessage(`${action} will open backend search once the API is ready.`);
      return;
    }
    if (action === 'Delete') {
      setMessage('Delete is ready for backend integration.');
      return;
    }
    if (action === 'Print') {
      setMessage('Print options will be wired after backend report endpoints are available.');
      return;
    }
    if (action === 'Reject') {
      setStatus('Rejected');
      setIsEditing(false);
      setMessage('Frontend status changed to Rejected.');
      return;
    }
    if (action === 'Approve') {
      if (totals.insufficientQuantity > 0) {
        setErrors({ details: 'There are items with insufficient stock.' });
        setActiveTab('insufficient');
        return;
      }
      if (validate()) {
        setStatus('Approved');
        setIsEditing(false);
        setMessage('Frontend status changed to Approved.');
      }
      return;
    }
    if (action === 'Save' && validate()) {
      setIsEditing(false);
      setStatus((current) => (current === 'Rejected' ? 'Pending' : current));
      setMessage('Frontend draft validated. Ready to connect to Save API.');
    }
  };

  const handleLookupSelect = (row) => {
    if (lookup === 'recipient') {
      setFormData((current) => ({ ...current, recipientCode: row.code, recipientName: row.description, address: row.address || '' }));
      setErrors((current) => ({ ...current, recipient: '' }));
    }
    if (lookup === 'reason') {
      setFormData((current) => ({ ...current, reasonCode: row.code, reasonDescription: row.description }));
      setErrors((current) => ({ ...current, reason: '' }));
    }
    if (lookup === 'warehouse') setFormData((current) => ({ ...current, warehouse: row.description }));
    if (lookup === 'chargeTo') {
      setFormData((current) => ({ ...current, chargeToCode: row.code, chargeToName: row.description }));
      setErrors((current) => ({ ...current, chargeTo: '' }));
    }
    if (lookup === 'company') {
      setFormData((current) => ({ ...current, company: row.description }));
      setErrors((current) => ({ ...current, company: '' }));
    }
    if (lookup === 'item') {
      setDetails((current) => current.map((detail, index) => (
        index === 0 && !detail.itemCode
          ? { ...detail, itemCode: row.code, itemDescription: row.description, unit: row.unit, quantity: '0', insufficientQuantity: '0', withdrawalQuantity: '0' }
          : detail
      )));
    }
    setLookup(null);
  };

  const deleteSelectedDetails = () => {
    setDetails((current) => {
      const remaining = current.filter((row) => !row.selected);
      return remaining.length ? remaining : [createBlankDetailRow()];
    });
  };

  const actionDisabled = (action) => {
    if (action === 'Edit') return isEditing || status !== 'Pending';
    if (['Save', 'Undo'].includes(action)) return !isEditing;
    if (['Approve', 'Reject', 'Delete', 'Print'].includes(action)) return isEditing || status !== 'Pending';
    return false;
  };

  return (
    <div className="etr-withdrawal-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Inventory</p>
          <h1>Withdrawal Entry</h1>
          <span>Create and review stock withdrawal transactions.</span>
        </div>
        <div className="etr-withdrawal-header-actions">
          <span className={`etr-withdrawal-status-pill is-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
          {actionLabels.map((action) => (
            <button
              type="button"
              key={action}
              className={action === 'Save' ? 'is-primary' : ''}
              disabled={actionDisabled(action)}
              onClick={() => handleAction(action)}
            >
              <ActionIcon label={action} />
              <span>{action}</span>
            </button>
          ))}
        </div>
      </div>

      {message ? <div className="etr-expense-save-message">{message}</div> : null}

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
                <input type="text" value={formData.transactionNo} onChange={(event) => updateForm('transactionNo', event.target.value)} readOnly={!isEditing} />
              </Field>
              <Field label="Transaction Date">
                <input type="date" value={formData.transactionDate} onChange={(event) => updateForm('transactionDate', event.target.value)} disabled={!isEditing} />
              </Field>
              <Field label="Type" className="is-wide" error={errors.withdrawalType}>
                <select value={formData.withdrawalType} onChange={(event) => updateForm('withdrawalType', event.target.value)} disabled={!isEditing}>
                  <option value="" />
                  <option>Warehouse Withdrawal</option>
                  <option>Charge Withdrawal</option>
                </select>
              </Field>
              <Field
                label="Recipient"
                link
                className="is-wide"
                error={errors.recipient}
                onLabelClick={() => isEditing && setLookup('recipient')}
              >
                <div className="etr-withdrawal-split-input">
                  <input type="text" value={formData.recipientCode} readOnly />
                  <input type="text" value={formData.recipientName} readOnly />
                </div>
              </Field>
              <Field label="Address" className="is-wide">
                <input type="text" value={formData.address} onChange={(event) => updateForm('address', event.target.value)} readOnly={!isEditing} />
              </Field>
              <Field
                label="Reason"
                link
                className="is-wide"
                error={errors.reason}
                onLabelClick={() => isEditing && setLookup('reason')}
              >
                <div className="etr-withdrawal-split-input">
                  <input type="text" value={formData.reasonCode} readOnly />
                  <input type="text" value={formData.reasonDescription} readOnly />
                </div>
              </Field>
              <Field label="Remarks" className="is-wide">
                <textarea rows="3" value={formData.remarks} onChange={(event) => updateForm('remarks', event.target.value)} readOnly={!isEditing} />
              </Field>
              <Field label="Warehouse" link className="is-wide" onLabelClick={() => isEditing && setLookup('warehouse')}>
                <input type="text" value={formData.warehouse} readOnly />
              </Field>
              <Field
                label="Charge To"
                link
                className="is-wide"
                error={errors.chargeTo}
                onLabelClick={() => isEditing && setLookup('chargeTo')}
              >
                <div className="etr-withdrawal-split-input">
                  <input type="text" value={formData.chargeToCode} readOnly />
                  <input type="text" value={formData.chargeToName} readOnly />
                </div>
              </Field>
              <Field label="Company" link className="is-wide" error={errors.company} onLabelClick={() => isEditing && setLookup('company')}>
                <input type="text" value={formData.company} readOnly />
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
                <select value={formData.referenceType} onChange={(event) => updateForm('referenceType', event.target.value)} disabled={!isEditing}>
                  <option value="" />
                  <option>Withdrawal</option>
                  <option>StockTransfer</option>
                  <option>SOFile</option>
                </select>
              </Field>
              <Field label="Reference No." link>
                <input type="text" value={formData.referenceNo} onChange={(event) => updateForm('referenceNo', event.target.value)} readOnly={!isEditing} />
              </Field>
              <div className="etr-withdrawal-row-pair">
                <Field label="Created By"><input type="text" value={formData.createdBy} readOnly /></Field>
                <Field label="Date"><input type="date" value={formData.createdDate} readOnly /></Field>
              </div>
              <div className="etr-withdrawal-row-pair">
                <Field label="Last Modified By"><input type="text" value={formData.lastModifiedBy} readOnly /></Field>
                <Field label="Date"><input type="date" value={formData.lastModifiedDate} readOnly /></Field>
              </div>
              <div className="etr-withdrawal-row-pair">
                <Field label="Approved / Rejected By"><input type="text" value={formData.approvedBy} readOnly /></Field>
                <Field label="Date"><input type="date" value={formData.approvedDate} readOnly /></Field>
              </div>
              <Field label="Del. Instructions">
                <input type="text" value={formData.deliveryInstructions} onChange={(event) => updateForm('deliveryInstructions', event.target.value)} readOnly={!isEditing} />
              </Field>
              <div className="etr-withdrawal-row-pair etr-withdrawal-pod-inline">
                <Field label="POD No."><input type="text" value={formData.podNo} onChange={(event) => updateForm('podNo', event.target.value)} readOnly={!isEditing} /></Field>
                <button type="button" disabled={!isEditing} onClick={() => updateForm('podNo', `POD-${Date.now().toString().slice(-6)}`)}>Autogenerate</button>
              </div>
              <div className="etr-withdrawal-row-pair">
                <Field label="Target Delivery"><input type="date" value={formData.targetDelivery} onChange={(event) => updateForm('targetDelivery', event.target.value)} disabled={!isEditing} /></Field>
                <Field label="No. of Pallets"><input type="number" value={formData.noOfPallets} onChange={(event) => updateForm('noOfPallets', event.target.value)} readOnly={!isEditing} /></Field>
              </div>
              <Field label="Declare Value">
                <input type="number" step="0.0001" value={formData.declareValue} onChange={(event) => updateForm('declareValue', event.target.value)} readOnly={!isEditing} />
              </Field>
            </div>
          </div>
        </div>
      </section>

      <section className="etr-withdrawal-table-panel">
        <div className="etr-withdrawal-tabs">
          {detailTabs.map((tab) => (
            <button type="button" key={tab.id} className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="etr-withdrawal-table-tools">
          <button type="button" onClick={deleteSelectedDetails} disabled={!isEditing}>
            <ActionIcon label="Reject" />
            <span>Delete Selected</span>
          </button>
          <button type="button" onClick={() => setDetails((current) => [...current, createBlankDetailRow()])} disabled={!isEditing}>Add Row</button>
          <span>Total Qty: {totals.quantity.toFixed(2)}</span>
          <span>Total W. Qty.: {totals.withdrawalQuantity.toFixed(2)}</span>
          <span>Total Insfnt. Qty.: {totals.insufficientQuantity.toFixed(2)}</span>
        </div>
        {errors.details ? <div className="etr-withdrawal-table-error">{errors.details}</div> : null}

        <div className="etr-withdrawal-table-wrap">
          {activeTab === 'details' ? (
            <table className="etr-withdrawal-table">
              <thead>
                <tr>
                  <th aria-label="Select row" />
                  <th>Item Code</th>
                  <th>Item Description</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Insfnt.Qty</th>
                  <th>W.Quantity</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {details.map((row) => (
                  <tr key={row.id}>
                    <td><input type="checkbox" checked={row.selected} onChange={(event) => updateDetail(row.id, 'selected', event.target.checked)} disabled={!isEditing} /></td>
                    <td><button type="button" className="etr-withdrawal-link" onClick={() => isEditing && setLookup('item')}>{row.itemCode || 'Click to Select'}</button></td>
                    <td><button type="button" className="etr-withdrawal-link" onClick={() => isEditing && setLookup('item')}>{row.itemDescription || 'Click to Select'}</button></td>
                    <td><input value={row.unit} onChange={(event) => updateDetail(row.id, 'unit', event.target.value)} readOnly={!isEditing} /></td>
                    <td><input type="number" value={row.quantity} onChange={(event) => updateDetail(row.id, 'quantity', event.target.value)} readOnly={!isEditing} /></td>
                    <td><input type="number" value={row.insufficientQuantity} onChange={(event) => updateDetail(row.id, 'insufficientQuantity', event.target.value)} readOnly={!isEditing} /></td>
                    <td><input type="number" value={row.withdrawalQuantity} onChange={(event) => updateDetail(row.id, 'withdrawalQuantity', event.target.value)} readOnly={!isEditing} /></td>
                    <td><input value={row.remarks} onChange={(event) => updateDetail(row.id, 'remarks', event.target.value)} readOnly={!isEditing} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {activeTab === 'allocation' ? (
            <table className="etr-withdrawal-table">
              <thead><tr><th>Item Code</th><th>Item Description</th><th>Warehouse</th><th>Location</th><th>Lot</th><th>Mfg Date</th><th>Expiry Date</th><th>Unit</th><th>Quantity</th></tr></thead>
              <tbody><tr><td colSpan="9">Stock allocation rows will be populated by the stock preallocation API.</td></tr></tbody>
            </table>
          ) : null}

          {activeTab === 'insufficient' ? (
            <table className="etr-withdrawal-table">
              <thead><tr><th>Item Code</th><th>Item Description</th><th>Unit</th><th>Quantity</th></tr></thead>
              <tbody>{details.filter((row) => parseNumber(row.insufficientQuantity) > 0).map((row) => <tr key={row.id}><td>{row.itemCode}</td><td>{row.itemDescription}</td><td>{row.unit}</td><td>{row.insufficientQuantity}</td></tr>)}</tbody>
            </table>
          ) : null}
        </div>
      </section>

      {lookup ? (
        <LookupModal
          type={lookup}
          title={`Select ${lookup.replace(/([A-Z])/g, ' $1')}`}
          onClose={() => setLookup(null)}
          onSelect={handleLookupSelect}
        />
      ) : null}
    </div>
  );
}
