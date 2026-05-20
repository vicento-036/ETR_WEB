import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  rejectReasonID: '',
  rejectDescription: '',
  deliveryStatus: 0,
  modificationHistory: [],
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

const actionLabels = ['New', 'Edit', 'Save', 'Approve', 'Reject', 'Print'];

function createBlankDetailRow() {
  return {
    id: crypto.randomUUID?.() || String(Date.now()),
    selected: false,
    itemCode: '',
    itemDescription: '',
    unit: '',
    quantity: '0',
    insufficientQuantity: '0',
    withdrawalQuantity: '0',
    withdrawableQuantity: '0',
    remarks: '',
    itemKey: null,
    unitKey: null,
  };
}

function createBlankAllocationRow(item = null) {
  return {
    id: crypto.randomUUID?.() || String(Date.now()),
    itemCode: item?.code || '',
    itemDescription: item?.description || '',
    itemKey: item?.itemKey || null,
    warehouse: '',
    warehouseKey: null,
    location: '',
    locationKey: null,
    lot: '',
    manufacturingDate: '',
    expiryDate: '',
    quantity: '0',
    unit: '',
    unitKey: null,
  };
}

function createBlankInsufficientRow(item = null) {
  return {
    id: crypto.randomUUID?.() || String(Date.now()),
    itemCode: item?.code || '',
    itemDescription: item?.description || '',
    itemKey: item?.itemKey || null,
    quantity: '0',
    unit: '',
    unitKey: null,
  };
}

function parseNumber(value) {
  return Number(String(value || 0).replace(/,/g, '')) || 0;
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

function RejectReasonModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  return (
    <div className="etr-withdrawal-modal-backdrop" role="presentation">
      <section className="etr-withdrawal-modal" role="dialog" aria-modal="true" aria-label="Rejection Reason">
        <div className="etr-withdrawal-modal-head">
          <div>
            <p className="etr-expense-kicker">Confirmation</p>
            <h2>Select Rejection Reason</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <Field label="Reason">
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter rejection reason" />
        </Field>
        <Field label="Remarks">
          <textarea rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional remarks" />
        </Field>
        <div className="etr-withdrawal-modal-actions">
          <button type="button" onClick={() => onConfirm({ reason, remarks })}>Confirm Rejection</button>
        </div>
      </section>
    </div>
  );
}

export default function WithdrawalEntry() {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [details, setDetails] = useState([createBlankDetailRow()]);
  const [allocations, setAllocations] = useState([]);
  const [insufficientStocks, setInsufficientStocks] = useState([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [lookup, setLookup] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingItemLookupRow, setPendingItemLookupRow] = useState(null);
  const [withdrawalId, setWithdrawalId] = useState(-1);
  const tableBodyRef = useRef(null);

  const totals = useMemo(() => ({
    quantity: details.reduce((sum, row) => sum + parseNumber(row.quantity), 0),
    withdrawalQuantity: allocations.reduce((sum, row) => sum + parseNumber(row.quantity), 0),
    insufficientQuantity: insufficientStocks.reduce((sum, row) => sum + parseNumber(row.quantity), 0),
  }), [details, allocations, insufficientStocks]);

  const getCreatedInfo = () => {
    if (formData.createdBy && formData.createdDate) {
      return `${formData.createdBy} on ${formData.createdDate}`;
    }
    return 'Not created yet';
  };

  const getLastModifiedInfo = () => {
    const parts = [];
    if (formData.lastModifiedBy && formData.lastModifiedDate) {
      parts.push(`${formData.lastModifiedBy} on ${formData.lastModifiedDate}`);
    }
    if (formData.modificationHistory && formData.modificationHistory.length > 0) {
      formData.modificationHistory.forEach(hist => {
        if (hist.modifiedBy !== formData.lastModifiedBy) {
          parts.push(`${hist.modifiedBy} on ${hist.modifiedDate}`);
        }
      });
    }
    return parts.join(' | ') || 'Not modified yet';
  };

  const getApprovedInfo = () => {
    if (formData.approvedBy && formData.approvedDate) {
      return `${formData.approvedBy} on ${formData.approvedDate}`;
    }
    return 'Not approved yet';
  };

  useEffect(() => {
    if (!isEditing) return;
    
    const lastRow = details[details.length - 1];
    const hasItemCode = lastRow.itemCode && lastRow.itemCode.trim() !== '';
    const hasEmptyRow = details.some(row => !row.itemCode || row.itemCode.trim() === '');
    
    if (hasItemCode && !hasEmptyRow) {
      setDetails(current => [...current, createBlankDetailRow()]);
    }
    
    const nonEmptyRows = details.filter(row => row.itemCode && row.itemCode.trim() !== '');
    const emptyRows = details.filter(row => !row.itemCode || row.itemCode.trim() === '');
    
    if (emptyRows.length > 1) {
      const keepEmptyRow = emptyRows[emptyRows.length - 1];
      setDetails([...nonEmptyRows, keepEmptyRow]);
    }
  }, [details, isEditing]);

  const updateForm = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const updateDetail = (rowId, field, value) => {
    setDetails((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const addModificationHistory = (modifiedBy, modifiedDate) => {
    setFormData(prev => ({
      ...prev,
      modificationHistory: [
        ...(prev.modificationHistory || []),
        { modifiedBy, modifiedDate }
      ]
    }));
  };

  const preallocateStocks = (itemKey, unitKey, quantity, warehouseKey, locationKey) => {
    const allocatedQuantity = Math.min(quantity, 100);
    const unallocatedQuantity = quantity - allocatedQuantity;
    
    return {
      preallocated: allocatedQuantity > 0 ? [{
        warehouseKey,
        locationKey,
        lotNumber: `LOT-${Date.now()}`,
        manufacturingDate: new Date(),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        quantity: allocatedQuantity,
      }] : [],
      unallocatedQuantity,
    };
  };

  const processQuantityChange = (itemKey, newQuantity) => {
    const detailRow = details.find(d => d.itemKey === itemKey);
    if (!detailRow) return;

    const remainingAllocations = allocations.filter(a => a.itemKey !== itemKey);
    const remainingInsufficient = insufficientStocks.filter(i => i.itemKey !== itemKey);
    
    const warehouseKey = formData.warehouse ? parseInt(formData.warehouse) || -1 : -1;
    const locationKey = -1;
    
    const result = preallocateStocks(itemKey, detailRow.unitKey, parseNumber(newQuantity), warehouseKey, locationKey);
    
    const newAllocations = result.preallocated.map(stock => createBlankAllocationRow({
      code: detailRow.itemCode,
      description: detailRow.itemDescription,
      itemKey: itemKey,
    }));
    
    newAllocations.forEach((alloc, idx) => {
      const stock = result.preallocated[idx];
      alloc.warehouse = `Warehouse ${stock.warehouseKey}`;
      alloc.warehouseKey = stock.warehouseKey;
      alloc.location = `Location ${stock.locationKey}`;
      alloc.locationKey = stock.locationKey;
      alloc.lot = stock.lotNumber;
      alloc.manufacturingDate = stock.manufacturingDate.toISOString().slice(0, 10);
      alloc.expiryDate = stock.expirationDate.toISOString().slice(0, 10);
      alloc.quantity = stock.quantity.toString();
      alloc.unit = detailRow.unit;
      alloc.unitKey = detailRow.unitKey;
    });
    
    let newInsufficient = [...remainingInsufficient];
    if (result.unallocatedQuantity > 0) {
      const insufficientRow = createBlankInsufficientRow({
        code: detailRow.itemCode,
        description: detailRow.itemDescription,
        itemKey: itemKey,
      });
      insufficientRow.quantity = result.unallocatedQuantity.toString();
      insufficientRow.unit = detailRow.unit;
      insufficientRow.unitKey = detailRow.unitKey;
      newInsufficient.push(insufficientRow);
    }
    
    setAllocations([...remainingAllocations, ...newAllocations]);
    setInsufficientStocks(newInsufficient);
    
    const totalAllocated = [...remainingAllocations, ...newAllocations]
      .filter(a => a.itemKey === itemKey)
      .reduce((sum, a) => sum + parseNumber(a.quantity), 0);
    
    updateDetail(detailRow.id, 'withdrawableQuantity', totalAllocated.toString());
    updateDetail(detailRow.id, 'insufficientQuantity', result.unallocatedQuantity.toString());
    updateDetail(detailRow.id, 'withdrawalQuantity', totalAllocated.toString());
  };

  const validateEntries = () => {
    const nextErrors = {};
    let hasError = false;
    
    if (!formData.withdrawalType) {
      nextErrors.withdrawalType = 'Withdrawal Type is required.';
      hasError = true;
    }
    if (!formData.recipientName) {
      nextErrors.recipient = 'Recipient is required.';
      hasError = true;
    }
    if (!formData.reasonDescription) {
      nextErrors.reason = 'Reason is required.';
      hasError = true;
    }
    if (!formData.chargeToName) {
      nextErrors.chargeTo = 'Charge To is required.';
      hasError = true;
    }
    if (!formData.company) {
      nextErrors.company = 'Company is required.';
      hasError = true;
    }
    
    if (details.filter(d => d.itemCode && parseNumber(d.quantity) > 0).length === 0) {
      nextErrors.details = 'At least one detail is needed to save this record';
      hasError = true;
    }
    
    if (insufficientStocks.length > 0 && insufficientStocks.some(i => parseNumber(i.quantity) > 0)) {
      setActiveTab('insufficient');
      nextErrors.insufficientStock = 'There are items with Insufficient stock';
      hasError = true;
    }
    
    const hasQuantityError = details.some(detail => {
      const quantity = parseNumber(detail.quantity);
      const insufficient = parseNumber(detail.insufficientQuantity);
      const withdrawal = parseNumber(detail.withdrawalQuantity);
      return withdrawal !== (quantity - insufficient);
    });
    
    if (hasQuantityError) {
      setActiveTab('details');
      nextErrors.quantityMismatch = 'There are items with unequal allocated stock and withdrawable stocks';
      hasError = true;
    }
    
    setErrors(nextErrors);
    return !hasError;
  };

  const handleAction = (action) => {
    if (action === 'New') {
      newRecord();
      return;
    }
    if (action === 'Edit') {
      setIsEditing(true);
      setMessage('Edit mode enabled.');
      return;
    }
    if (action === 'Save') {
      handleSave();
      return;
    }
    if (action === 'Approve') {
      handleApprove();
      return;
    }
    if (action === 'Reject') {
      if (withdrawalId === -1) {
        setMessage('Please save the record first');
        return;
      }
      setShowRejectModal(true);
      return;
    }
    if (action === 'Print') {
      handlePrint();
      return;
    }
  };

  const newRecord = () => {
    setFormData({ 
      ...emptyForm, 
      transactionDate: todayIso,
      createdBy: 'Current User',
      createdDate: todayIso,
      modificationHistory: []
    });
    setDetails([createBlankDetailRow()]);
    setAllocations([]);
    setInsufficientStocks([]);
    setWithdrawalId(-1);
    setIsEditing(true);
    setMessage('New withdrawal entry started.');
    setErrors({});
  };

  const handlePrint = () => {
    setMessage('Print options: Delivery Receipt, Withdrawal Form, POD, Picklist - API integration needed');
  };

  const handleApprove = () => {
    if (withdrawalId === -1) {
      setMessage('Please save the record first');
      return;
    }
    
    if (!validateEntries()) {
      return;
    }
    
    if (insufficientStocks.length > 0 && insufficientStocks.some(i => parseNumber(i.quantity) > 0)) {
      setMessage('There is insufficient stock in one of the items. Please check.');
      setActiveTab('insufficient');
      return;
    }
    
    if (window.confirm('Are you sure you want to approve this record?')) {
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        approvedBy: 'Current User',
        approvedDate: todayIso,
      }));
      setMessage('Record approved successfully');
    }
  };

  const handleRejectConfirm = ({ reason, remarks }) => {
    setShowRejectModal(false);
    setIsEditing(false);
    setFormData(prev => ({
      ...prev,
      rejectReasonID: reason,
      rejectDescription: remarks,
      approvedBy: 'Current User',
      approvedDate: todayIso,
    }));
    setMessage(`Record rejected. Reason: ${reason}`);
  };

  const handleSave = () => {
    if (validateEntries()) {
      if (withdrawalId === -1) {
        const newTransNo = `SW-${Date.now()}`;
        setFormData(prev => ({ 
          ...prev, 
          transactionNo: newTransNo,
          lastModifiedBy: 'Current User',
          lastModifiedDate: todayIso,
        }));
        setWithdrawalId(Date.now());
      } else {
        if (formData.lastModifiedBy && formData.lastModifiedDate) {
          addModificationHistory(formData.lastModifiedBy, formData.lastModifiedDate);
        }
        setFormData(prev => ({
          ...prev,
          lastModifiedBy: 'Current User',
          lastModifiedDate: todayIso,
        }));
      }
      setIsEditing(false);
      setMessage('Record saved successfully');
    }
  };

  const handleLookupSelect = (row) => {
    if (lookup === 'recipient') {
      setFormData((current) => ({ 
        ...current, 
        recipientCode: row.code, 
        recipientName: row.description, 
        address: row.address || '',
      }));
      setErrors((current) => ({ ...current, recipient: '' }));
    }
    if (lookup === 'reason') {
      setFormData((current) => ({ ...current, reasonCode: row.code, reasonDescription: row.description }));
      setErrors((current) => ({ ...current, reason: '' }));
    }
    if (lookup === 'warehouse') {
      setFormData((current) => ({ ...current, warehouse: row.description, warehouseKey: row.code }));
      details.forEach(detail => {
        if (detail.itemKey) {
          processQuantityChange(detail.itemKey, detail.quantity);
        }
      });
    }
    if (lookup === 'chargeTo') {
      setFormData((current) => ({ ...current, chargeToCode: row.code, chargeToName: row.description }));
      setErrors((current) => ({ ...current, chargeTo: '' }));
    }
    if (lookup === 'company') {
      setFormData((current) => ({ ...current, company: row.description, companyKey: row.code }));
      setErrors((current) => ({ ...current, company: '' }));
    }
    if (lookup === 'item' && pendingItemLookupRow) {
      updateDetail(pendingItemLookupRow.id, 'itemCode', row.code);
      updateDetail(pendingItemLookupRow.id, 'itemDescription', row.description);
      updateDetail(pendingItemLookupRow.id, 'unit', row.unit);
      updateDetail(pendingItemLookupRow.id, 'itemKey', row.code);
      updateDetail(pendingItemLookupRow.id, 'unitKey', row.unit === 'BOX' ? 1 : 2);
      processQuantityChange(row.code, 0);
      setPendingItemLookupRow(null);
    }
    setLookup(null);
  };

  const handleItemLookupClick = (row) => {
    if (!isEditing) return;
    setPendingItemLookupRow(row);
    setLookup('item');
  };

  const deleteSelectedDetails = () => {
    if (window.confirm('Are you sure you want to remove the selected items?')) {
      const selectedIds = details.filter(row => row.selected).map(row => row.id);
      const remainingAllocations = allocations.filter(a => !selectedIds.includes(a.id));
      const remainingInsufficient = insufficientStocks.filter(i => !selectedIds.includes(i.id));
      
      setAllocations(remainingAllocations);
      setInsufficientStocks(remainingInsufficient);
      
      const remainingDetails = details.filter(row => !row.selected);
      setDetails(remainingDetails.length ? remainingDetails : [createBlankDetailRow()]);
    }
  };

  const actionDisabled = (action) => {
    if (action === 'Edit') return isEditing;
    if (action === 'Save') return !isEditing;
    if (action === 'Approve') return isEditing || withdrawalId === -1;
    if (action === 'Reject') return isEditing || withdrawalId === -1;
    if (action === 'Print') return false;
    return false;
  };

  const duplicateAllocationRow = (row) => {
    const newRow = { ...row, id: crypto.randomUUID?.() || String(Date.now()) };
    setAllocations([...allocations, newRow]);
  };

  const deleteAllocationRow = (rowId) => {
    if (window.confirm('Are you sure you want to remove this line?')) {
      const remaining = allocations.filter(a => a.id !== rowId);
      setAllocations(remaining);
      
      const affectedRow = allocations.find(a => a.id === rowId);
      if (affectedRow) {
        const remainingForItem = remaining.filter(a => a.itemKey === affectedRow.itemKey);
        const totalAllocated = remainingForItem.reduce((sum, a) => sum + parseNumber(a.quantity), 0);
        const detailRow = details.find(d => d.itemKey === affectedRow.itemKey);
        if (detailRow) {
          updateDetail(detailRow.id, 'withdrawableQuantity', totalAllocated.toString());
          updateDetail(detailRow.id, 'withdrawalQuantity', totalAllocated.toString());
        }
      }
    }
  };

  return (
    <div className="etr-withdrawal-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Inventory</p>
          <h1>Withdrawal Entry</h1>
          <span>Create and review stock withdrawal transactions.</span>
        </div>
        <div className="etr-withdrawal-actions">
          {actionLabels.map((action) => (
            <button
              type="button"
              key={action}
              className={action === 'Save' ? 'etr-expense-save-button' : ''}
              disabled={actionDisabled(action)}
              onClick={() => handleAction(action)}
            >
              {action}
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
              <Field
                label="Warehouse"
                link
                className="is-wide"
                onLabelClick={() => isEditing && setLookup('warehouse')}
              >
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
              <Field
                label="Company"
                link
                className="is-wide"
                error={errors.company}
                onLabelClick={() => isEditing && setLookup('company')}
              >
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
              
              <Field label="Created By" className="is-wide">
                <input type="text" value={getCreatedInfo()} readOnly />
              </Field>
              <Field label="Last Modified By" className="is-wide">
                <input type="text" value={getLastModifiedInfo()} readOnly />
              </Field>
              <Field label="Approved By" className="is-wide">
                <input type="text" value={getApprovedInfo()} readOnly />
              </Field>

              <Field label="Del. Instructions">
                <input type="text" value={formData.deliveryInstructions} onChange={(event) => updateForm('deliveryInstructions', event.target.value)} readOnly={!isEditing} />
              </Field>
              <div className="etr-withdrawal-row-pair etr-withdrawal-pod-inline">
                <Field label="POD No.">
                  <input type="text" value={formData.podNo} onChange={(event) => updateForm('podNo', event.target.value)} readOnly={!isEditing} />
                </Field>
                <button 
                  type="button" 
                  disabled={!isEditing || withdrawalId === -1} 
                  onClick={() => {
                    const newPodNo = `POD-${Date.now().toString().slice(-6)}`;
                    updateForm('podNo', newPodNo);
                  }}
                >
                  Generate POD
                </button>
              </div>
              <div className="etr-withdrawal-row-pair">
                <Field label="Target Delivery">
                  <input type="date" value={formData.targetDelivery} onChange={(event) => updateForm('targetDelivery', event.target.value)} disabled={!isEditing} />
                </Field>
                <Field label="No. of Pallets">
                  <input type="number" value={formData.noOfPallets} onChange={(event) => updateForm('noOfPallets', event.target.value)} readOnly={!isEditing} />
                </Field>
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
            Delete Selected
          </button>
          <span>Total Qty: {totals.quantity.toFixed(2)}</span>
          <span>Total W. Qty.: {totals.withdrawalQuantity.toFixed(2)}</span>
          <span>Total Insfnt. Qty.: {totals.insufficientQuantity.toFixed(2)}</span>
        </div>
        {errors.details && <div className="etr-withdrawal-table-error">{errors.details}</div>}
        {errors.insufficientStock && <div className="etr-withdrawal-table-error">{errors.insufficientStock}</div>}
        {errors.quantityMismatch && <div className="etr-withdrawal-table-error">{errors.quantityMismatch}</div>}

        <div className="etr-withdrawal-table-wrap">
          {activeTab === 'details' && (
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
              <tbody ref={tableBodyRef}>
                {details.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={row.selected} 
                        onChange={(event) => updateDetail(row.id, 'selected', event.target.checked)} 
                        disabled={!isEditing}
                      />
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="etr-withdrawal-link" 
                        onClick={() => handleItemLookupClick(row)}
                        disabled={!isEditing}
                      >
                        {row.itemCode || 'Click to Select'}
                      </button>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="etr-withdrawal-link" 
                        onClick={() => handleItemLookupClick(row)}
                        disabled={!isEditing}
                      >
                        {row.itemDescription || 'Click to Select'}
                      </button>
                    </td>
                    <td>
                      <input 
                        value={row.unit} 
                        onChange={(event) => updateDetail(row.id, 'unit', event.target.value)} 
                        readOnly={!isEditing} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={row.quantity} 
                        onChange={(event) => {
                          const newQty = event.target.value;
                          updateDetail(row.id, 'quantity', newQty);
                          if (row.itemKey) {
                            processQuantityChange(row.itemKey, newQty);
                          }
                        }} 
                        readOnly={!isEditing} 
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={row.insufficientQuantity} 
                        readOnly 
                        style={{ backgroundColor: '#fff0f0' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={row.withdrawalQuantity} 
                        readOnly 
                        style={{ backgroundColor: '#e8f5e9' }}
                      />
                    </td>
                    <td>
                      <input 
                        value={row.remarks} 
                        onChange={(event) => updateDetail(row.id, 'remarks', event.target.value)} 
                        readOnly={!isEditing} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'allocation' && (
            <table className="etr-withdrawal-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Description</th>
                  <th>Warehouse</th>
                  <th>Location</th>
                  <th>Lot</th>
                  <th>Mfg Date</th>
                  <th>Expiry Date</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((row) => (
                  <tr key={row.id}>
                    <td>{row.itemCode}</td>
                    <td>{row.itemDescription}</td>
                    <td>{row.warehouse}</td>
                    <td>{row.location}</td>
                    <td>{row.lot}</td>
                    <td>{row.manufacturingDate}</td>
                    <td>{row.expiryDate}</td>
                    <td>{row.unit}</td>
                    <td>
                      <input 
                        type="number" 
                        value={row.quantity} 
                        onChange={(e) => {
                          const newQty = e.target.value;
                          setAllocations(prev => prev.map(a => a.id === row.id ? { ...a, quantity: newQty } : a));
                        }}
                        readOnly={!isEditing}
                      />
                    </td>
                    <td>
                      {isEditing && (
                        <div className="etr-withdrawal-allocation-actions">
                          <button type="button" onClick={() => duplicateAllocationRow(row)}>Copy</button>
                          <button type="button" onClick={() => deleteAllocationRow(row.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center' }}>No stock allocations. Add items in the Details tab.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'insufficient' && (
            <table className="etr-withdrawal-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Description</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {insufficientStocks.map((row) => (
                  <tr key={row.id}>
                    <td>{row.itemCode}</td>
                    <td>{row.itemDescription}</td>
                    <td>{row.unit}</td>
                    <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>{row.quantity}</td>
                    <td>
                      {isEditing && (
                        <button type="button" onClick={() => setLookup('item')}>Allocate Stock</button>
                      )}
                    </td>
                  </tr>
                ))}
                {insufficientStocks.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No insufficient stock items.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {lookup && (
        <LookupModal
          type={lookup}
          title={`Select ${lookup.replace(/([A-Z])/g, ' $1')}`}
          onClose={() => {
            setLookup(null);
            setPendingItemLookupRow(null);
          }}
          onSelect={handleLookupSelect}
        />
      )}

      {showRejectModal && (
        <RejectReasonModal onClose={() => setShowRejectModal(false)} onConfirm={handleRejectConfirm} />
      )}
    </div>
  );
}