import React, { useMemo, useState } from 'react';
import { getToken } from '../../services/authStorage';
import { ENDPOINTS } from '../../constants/endpoints';
import '../../styles/daily-expense.css';
import '../../styles/order-entry.css';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

function formatMonthDayYear(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

const todayDisplay = formatMonthDayYear(new Date());

const initialOrder = {
  orderNo: '',
  orderDate: todayDisplay,
  status: '',
  creditTerms: '',
  customerPo: '',
  account: '',
  custKey: '',
  deliveryAddress: '',
  isNewCustomer: false,
  remarks: '',
};

function createOrderItem(overrides = {}) {
  return {
    id: crypto.randomUUID?.() || String(Date.now()),
    code: '',
    description: '',
    unit: '',
    detailPrice: '',
    quantity: '',
    freeGoods: '',
    discountPercent: '',
    remarks: '',
    ...overrides,
  };
}

function parseAmount(value) {
  return Number(String(value || 0).replace(/,/g, '')) || 0;
}

function formatAmount(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function readBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }

  return fallback;
}

function getIsNewCustomer(value, fallback = false) {
  return readBoolean(value?.isNewCustomer ?? value?.IsNewCustomer, fallback);
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`etr-expense-field etr-order-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function CustomerLookupModal({
  isOpen,
  searchValue,
  onSearchChange,
  isLoading,
  isCreating,
  error,
  rows,
  onSelect,
  onCreateNew,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="etr-expense-lookup-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="etr-expense-lookup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="etr-customer-lookup-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="etr-expense-lookup-head">
          <h2 id="etr-customer-lookup-title">Select Customer</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <input
          className="etr-expense-lookup-search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !isLoading && rows.length === 0 && searchValue.trim()) {
              event.preventDefault();
              onCreateNew();
            }
          }}
          maxLength={255}
          placeholder="Search account no or store name"
          autoFocus
        />

        <div className="etr-expense-lookup-list">
          {isCreating ? (
            <div className="etr-expense-lookup-status">Adding customer...</div>
          ) : null}
          {!isCreating && isLoading ? (
            <div className="etr-expense-lookup-status">Loading customers...</div>
          ) : null}
          {!isCreating && !isLoading && error ? (
            <div className="etr-expense-lookup-status is-error">{error}</div>
          ) : null}
          {!isCreating && !isLoading && !error && rows.length === 0 ? (
            <div className="etr-expense-lookup-status">
              No customers found.
            </div>
          ) : null}
          {!isCreating && !isLoading && !error ? rows.map((row) => (
            <button type="button" key={row.custKey} className="etr-expense-lookup-option" onClick={() => onSelect(row)}>
              <strong>{row.customerName || row.storeName || row.accountNo}</strong>
              <span>{row.customerAddress || row.storeName || row.accountNo}</span>
            </button>
          )) : null}
        </div>
      </section>
    </div>
  );
}

function AddressLookupModal({
  isOpen,
  isLoading,
  error,
  rows,
  onSelect,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="etr-expense-lookup-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="etr-expense-lookup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="etr-address-lookup-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="etr-expense-lookup-head">
          <h2 id="etr-address-lookup-title">Select Delivery Address</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div className="etr-expense-lookup-list">
          {isLoading ? (
            <div className="etr-expense-lookup-status">Loading addresses...</div>
          ) : null}
          {!isLoading && error ? (
            <div className="etr-expense-lookup-status is-error">{error}</div>
          ) : null}
          {!isLoading && !error && rows.length === 0 ? (
            <div className="etr-expense-lookup-status">No ship-to addresses found for this customer.</div>
          ) : null}
          {!isLoading && !error ? rows.map((row) => (
            <button type="button" key={row.customerShipToID} className="etr-expense-lookup-option" onClick={() => onSelect(row)}>
              <strong>{row.code}</strong>
              <span>{row.addressString || row.name}</span>
            </button>
          )) : null}
        </div>
      </section>
    </div>
  );
}

function CreditTermLookupModal({
  isOpen,
  rows,
  onSelect,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="etr-expense-lookup-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="etr-expense-lookup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="etr-credit-term-lookup-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="etr-expense-lookup-head">
          <h2 id="etr-credit-term-lookup-title">Select Credit Term</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div className="etr-expense-lookup-list">
          {rows.length === 0 ? (
            <div className="etr-expense-lookup-status">No credit terms found.</div>
          ) : null}
          {rows.map((row) => (
            <button type="button" key={row.crTermKey} className="etr-expense-lookup-option" onClick={() => onSelect(row)}>
              <strong>{row.code}</strong>
              <span>{row.creditTerm}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ItemLookupModal({
  isOpen,
  searchValue,
  onSearchChange,
  isLoading,
  error,
  rows,
  onSelect,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="etr-expense-lookup-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="etr-expense-lookup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="etr-item-lookup-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="etr-expense-lookup-head">
          <h2 id="etr-item-lookup-title">Select Item</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <input
          className="etr-expense-lookup-search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search item code or description"
          autoFocus
        />

        <div className="etr-expense-lookup-list">
          {isLoading ? (
            <div className="etr-expense-lookup-status">Loading items...</div>
          ) : null}
          {!isLoading && error ? (
            <div className="etr-expense-lookup-status is-error">{error}</div>
          ) : null}
          {!isLoading && !error && rows.length === 0 ? (
            <div className="etr-expense-lookup-status">No items found.</div>
          ) : null}
          {!isLoading && !error ? rows.map((row) => (
            <button type="button" key={row.itemKey} className="etr-expense-lookup-option" onClick={() => onSelect(row)}>
              <strong>{row.code}</strong>
              <span>{row.description}</span>
            </button>
          )) : null}
        </div>
      </section>
    </div>
  );
}

export default function OrderEntry() {
  const [order, setOrder] = useState(initialOrder);
  const [items, setItems] = useState([createOrderItem()]);
  const [message, setMessage] = useState('');
  const [isCustomerLookupOpen, setIsCustomerLookupOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerRows, setCustomerRows] = useState([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);
  const [customerLookupError, setCustomerLookupError] = useState('');
  const [isManualCustomerMode, setIsManualCustomerMode] = useState(false);
  const [pendingNewCustomerName, setPendingNewCustomerName] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState('');
  const [isAddressLookupOpen, setIsAddressLookupOpen] = useState(false);
  const [addressRows, setAddressRows] = useState([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [addressLookupError, setAddressLookupError] = useState('');
  const [creditTermOptions, setCreditTermOptions] = useState([]);
  const [shipToOptions, setShipToOptions] = useState([]);
  const [isCreditTermLookupOpen, setIsCreditTermLookupOpen] = useState(false);
  const [isItemLookupOpen, setIsItemLookupOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemRows, setItemRows] = useState([]);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [itemLookupError, setItemLookupError] = useState('');
  const [activeRowId, setActiveRowId] = useState(null);

  const openCreditTermLookup = () => {
    if (order.isNewCustomer) {
      return;
    }

    setIsCreditTermLookupOpen(true);
  };

  const handleCreditTermSelect = (ct) => {
    setIsCreditTermLookupOpen(false);
    setOrder((current) => ({
      ...current,
      creditTerms: ct.creditTerm || ct.code,
    }));
  };

  const openItemLookup = (rowId) => {
    setActiveRowId(rowId);
    setIsItemLookupOpen(true);
    setItemSearch('');
    setItemLookupError('');
    handleItemSearch('');
  };

  const handleItemSearch = async (query) => {
    setItemSearch(query);
    setIsItemsLoading(true);
    setItemLookupError('');

    try {
      const token = getToken();
      const response = await fetch(
        buildApiUrl(`${ENDPOINTS.orderEntry}/items?query=${encodeURIComponent(query)}`),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const items = Array.isArray(data?.items) ? data.items : [];
        setItemRows(items);
      } else {
        setItemLookupError(data?.message || 'Failed to search items.');
      }
    } catch {
      setItemLookupError('Network error while searching items.');
    } finally {
      setIsItemsLoading(false);
    }
  };

  const handleItemSelect = (item) => {
    setIsItemLookupOpen(false);
    if (activeRowId) {
      setItems((current) => current.map((row) => (
        row.id === activeRowId ? { ...row, code: item.code, description: item.description } : row
      )));
    }
    setActiveRowId(null);
  };

  const openCustomerLookup = () => {
    setIsCustomerLookupOpen(true);
    setCustomerSearch('');
    setCustomerRows([]);
    setCustomerLookupError('');
    setCreateCustomerError('');
    setIsManualCustomerMode(false);
    handleCustomerSearch('');
  };

  const handleCustomerSearch = async (query) => {
    setCustomerSearch(query);
    setIsCustomersLoading(true);
    setCustomerLookupError('');
    setCreateCustomerError('');

    try {
      const token = getToken();
      const response = await fetch(
        buildApiUrl(`${ENDPOINTS.orderEntry}/customers?query=${encodeURIComponent(query)}`),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const items = Array.isArray(data?.items) ? data.items : [];
        setCustomerRows(items);
        if (items.length === 0) {
          setIsManualCustomerMode(true);
          setOrder((current) => ({
            ...current,
            account: query,
            custKey: '',
            deliveryAddress: '',
            isNewCustomer: true,
            creditTerms: '',
            remarks: current.remarks || 'New Customer',
          }));
        } else {
          setIsManualCustomerMode(false);
        }
      } else {
        setCustomerLookupError(data?.message || 'Failed to search customers.');
      }
    } catch {
      setCustomerLookupError('Network error while searching customers.');
    } finally {
      setIsCustomersLoading(false);
    }
  };

  const handleStageNewCustomer = () => {
    const customerName = customerSearch.trim();

    if (!customerName) {
      setCreateCustomerError('Customer name is required.');
      return;
    }

    setPendingNewCustomerName(customerName);
    setIsCustomerLookupOpen(false);
    setIsManualCustomerMode(true);
    setCreateCustomerError('');
    setShipToOptions([]);
    setOrder((current) => ({
      ...current,
      account: customerName,
      custKey: '',
      deliveryAddress: '',
      isNewCustomer: true,
      creditTerms: '',
      remarks: current.remarks || 'New Customer',
    }));
  };

  const createPendingCustomer = async (deliveryAddress) => {
    const customerName = pendingNewCustomerName.trim();

    if (!customerName || order.custKey || isCreatingCustomer) {
      return;
    }

    const customerAddress = deliveryAddress.trim();

    if (!customerAddress) {
      return;
    }

    setIsCreatingCustomer(true);
    setCreateCustomerError('');

    try {
      const token = getToken();
      const response = await fetch(
        buildApiUrl(`${ENDPOINTS.orderEntry}/customers`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            customerName,
            customerAddress,
            isNewCustomer: true,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setCreateCustomerError(data?.message || 'Failed to add customer.');
        return;
      }

      const created = data?.item ?? data?.Item ?? data;

      if (created) {
        setCustomerRows((current) => [created, ...current]);
        setIsManualCustomerMode(true);
        setPendingNewCustomerName('');
        setOrder((current) => ({
          ...current,
          deliveryAddress: created.customerAddress || customerAddress,
          isNewCustomer: getIsNewCustomer(created, true),
        }));
        await handleCustomerSelect(created, { isNewCustomer: true });
      }
    } catch {
      setCreateCustomerError('Network error while adding customer.');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleCustomerSelect = async (customer, options = {}) => {
    setIsCustomerLookupOpen(false);
    setCreateCustomerError('');
    const selectedIsNewCustomer = options.isNewCustomer ?? getIsNewCustomer(customer);
    setIsManualCustomerMode(selectedIsNewCustomer);

    try {
      const token = getToken();
      const response = await fetch(
        buildApiUrl(`${ENDPOINTS.orderEntry}/customers/${customer.custKey}/credit-term`),
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok && data) {
        const terms = Array.isArray(data.creditTermOptions) ? data.creditTermOptions : [];
        setCreditTermOptions(terms);

        const shipToList = Array.isArray(data.shipToOptions) ? data.shipToOptions : [];
        setShipToOptions(shipToList);
        const defaultShipTo = shipToList[0];
        const defaultTerm = terms.find(
          (t) => t.code === data.creditTermCode || t.crTermKey === data.creditTermKey,
        );
        const resolvedDeliveryAddress = defaultShipTo
          ? (defaultShipTo.addressString || defaultShipTo.name)
          : (customer.customerAddress || '');

        setOrder((current) => ({
          ...current,
          account: customer.customerName || customer.storeName || customer.accountNo,
          custKey: customer.custKey,
          creditTerms: defaultTerm
            ? defaultTerm.creditTerm || defaultTerm.code
            : (data.creditTerm || data.creditTermCode || current.creditTerms),
          deliveryAddress: resolvedDeliveryAddress || current.deliveryAddress,
          isNewCustomer: getIsNewCustomer(data, selectedIsNewCustomer),
        }));
      }
    } catch {
      // Credit term lookup failed silently — already set account name
    }
  };

  const openAddressLookup = () => {
    if (!order.custKey || order.isNewCustomer) {
      return;
    }

    setIsAddressLookupOpen(true);
    setAddressRows([]);
    setAddressLookupError('');

    const loadAddresses = async () => {
      setIsAddressesLoading(true);

      try {
        const token = getToken();
        const response = await fetch(
          buildApiUrl(`${ENDPOINTS.orderEntry}/customers/${order.custKey}/ship-to-addresses`),
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          const items = Array.isArray(data?.items) ? data.items : [];
          setAddressRows(items);
        } else {
          setAddressLookupError(data?.message || 'Failed to load addresses.');
        }
      } catch {
        setAddressLookupError('Network error while loading addresses.');
      } finally {
        setIsAddressesLoading(false);
      }
    };

    loadAddresses();
  };

  const handleAddressSelect = (address) => {
    setIsAddressLookupOpen(false);
    setOrder((current) => ({
      ...current,
      deliveryAddress: address.addressString || address.name || current.deliveryAddress,
    }));
  };

  const itemTotals = useMemo(() => items.map((item) => {
    const gross = parseAmount(item.detailPrice) * parseAmount(item.quantity);
    const discount = gross * (parseAmount(item.discountPercent) / 100);

    return {
      id: item.id,
      gross,
      discount,
      net: gross - discount,
    };
  }), [items]);

  const totals = useMemo(() => itemTotals.reduce((summary, item) => ({
    gross: summary.gross + item.gross,
    discount: summary.discount + item.discount,
    net: summary.net + item.net,
  }), { gross: 0, discount: 0, net: 0 }), [itemTotals]);

  const updateOrder = (field, value) => {
    setOrder((current) => ({ ...current, [field]: value }));
  };

  const handleDeliveryAddressBlur = (event) => {
    if (order.isNewCustomer && pendingNewCustomerName) {
      createPendingCustomer(event.target.value);
    }
  };

  const updateItem = (rowId, field, value) => {
    setItems((current) => current.map((item) => (
      item.id === rowId ? { ...item, [field]: value } : item
    )));
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      createOrderItem({
        code: '',
        description: '',
        unit: '',
        detailPrice: '0',
        quantity: '1',
        freeGoods: '0',
        discountPercent: '0',
      }),
    ]);
  };

  const removeItem = (rowId) => {
    setItems((current) => {
      const remaining = current.filter((item) => item.id !== rowId);
      return remaining.length ? remaining : [createOrderItem()];
    });
  };

  const closeOrder = () => {
    setMessage('Order entry closed in the frontend.');
  };

  return (
    <div className="etr-order-entry">
      <div className="etr-expense-toolbar">
        <div>
          <p className="etr-expense-kicker">Sales</p>
          <h1>Order Entry</h1>
          <span>Create and review customer order details.</span>
        </div>
      </div>

      {message ? <div className="etr-expense-save-message">{message}</div> : null}

      <div className="etr-expense-form-shell etr-order-form-shell">
        <div className="etr-expense-main-stack">
          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Order Information</h2>
              <span>Customer and transaction details</span>
            </div>
            <div className="etr-expense-grid three etr-order-info-grid">
              <Field label="Order No">
                <input type="text" value={order.orderNo} onChange={(event) => updateOrder('orderNo', event.target.value)} />
              </Field>
              <Field label="Order Date">
                <input type="text" inputMode="numeric" placeholder="MM/DD/YYYY" value={order.orderDate} onChange={(event) => updateOrder('orderDate', event.target.value)} />
              </Field>
              <Field label="Credit Terms">
                {order.isNewCustomer ? (
                  <input
                    type="text"
                    value={order.creditTerms}
                    onChange={(event) => updateOrder('creditTerms', event.target.value)}
                    maxLength={255}
                    placeholder="Credit terms"
                  />
                ) : (
                  <div className="etr-expense-combo">
                    <button
                      type="button"
                      className={`etr-expense-lookup-button ${order.creditTerms ? 'has-value' : ''}`}
                      onClick={openCreditTermLookup}
                    >
                      <span>{order.creditTerms || '-- Select Credit Term --'}</span>
                      <svg className="etr-expense-chevron" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                )}
              </Field>
              <Field label="Customer PO">
                <input type="text" value={order.customerPo} onChange={(event) => updateOrder('customerPo', event.target.value)} />
              </Field>
            </div>
          </section>

          <section className="etr-expense-card">
            <div className="etr-expense-card-head">
              <h2>Delivery Details</h2>
              <span>Ship-to address and remarks</span>
            </div>
            <div className="etr-expense-grid details">
              <div className="etr-expense-details-left">
                <Field label="Customer Account">
                  <div className="etr-expense-combo">
                    <button
                      type="button"
                      className={`etr-expense-lookup-button ${order.account ? 'has-value' : ''}`}
                      onClick={openCustomerLookup}
                    >
                      <span>{order.account || '-- Select Customer --'}</span>
                      <svg className="etr-expense-chevron" viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </Field>
                <Field label="Delivery Address">
                  {isManualCustomerMode || order.isNewCustomer ? (
                    <input
                      type="text"
                      value={order.deliveryAddress}
                      onChange={(event) => updateOrder('deliveryAddress', event.target.value)}
                      onBlur={handleDeliveryAddressBlur}
                      maxLength={255}
                      placeholder="Delivery address"
                    />
                  ) : (
                    <div className="etr-expense-combo">
                      <button
                        type="button"
                        className={`etr-expense-lookup-button ${order.deliveryAddress ? 'has-value' : ''}`}
                        onClick={openAddressLookup}
                        disabled={!order.custKey}
                      >
                        <span>{order.deliveryAddress || '-- Select Delivery Address --'}</span>
                        <svg className="etr-expense-chevron" viewBox="0 0 24 24">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  )}
                </Field>
              </div>
              <Field label="Remarks" className="etr-expense-description">
                <input type="text" value={order.remarks} onChange={(event) => updateOrder('remarks', event.target.value)} />
              </Field>
            </div>
          </section>
        </div>

        <aside className="etr-expense-side-stack">
          <section className="etr-order-status-card">
            <div>
              <h2>Status</h2>
              <span>Current posting state</span>
            </div>
            <strong>{order.status || ''}</strong>
          </section>

          <section className="etr-expense-card etr-order-total-card">
            <div className="etr-order-amount-head">
              <h2>Amount</h2>
              <span>Auto-computed totals</span>
            </div>
            <dl className="etr-order-amount-list">
              <div>
                <dt>Gross Amount</dt>
                <dd>{formatAmount(totals.gross)}</dd>
              </div>
              <div>
                <dt>Discount Amount</dt>
                <dd>{formatAmount(totals.discount)}</dd>
              </div>
              <div>
                <dt>Net Amount</dt>
                <dd>{formatAmount(totals.net)}</dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="etr-expense-table-panel etr-order-items-panel">
          <div className="etr-expense-table-head">
            <div>
              <h2>Order Items</h2>
              <span>Product, quantity, free goods, discount, and remarks</span>
            </div>
            <div className="etr-expense-actions">
              <button type="button" className="etr-expense-save-button" onClick={addItem}>Add Item</button>
            </div>
          </div>

          <div className="etr-order-table-wrap">
            <table className="etr-expense-table etr-order-table">
              <thead>
                <tr>
                  <th aria-label="Actions" />
                  <th>Code</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Detail Price</th>
                  <th>Quantity</th>
                  <th>Free Goods</th>
                  <th>Discount %</th>
                  <th>Total</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const rowTotal = itemTotals.find((total) => total.id === item.id)?.net || 0;

                  return (
                    <tr key={item.id}>
                      <td>
                        <button type="button" className="etr-order-row-menu" onClick={() => removeItem(item.id)} aria-label="Remove item">
                          ...
                        </button>
                      </td>
                      <td>
                        <input
                          value={item.code}
                          onClick={() => openItemLookup(item.id)}
                          readOnly
                          placeholder="Select code..."
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <input
                          value={item.description}
                          onClick={() => openItemLookup(item.id)}
                          readOnly
                          placeholder="Select item..."
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td><input value={item.unit} onChange={(event) => updateItem(item.id, 'unit', event.target.value)} /></td>
                      <td><input type="number" value={item.detailPrice} onChange={(event) => updateItem(item.id, 'detailPrice', event.target.value)} /></td>
                      <td><input type="number" value={item.quantity} onChange={(event) => updateItem(item.id, 'quantity', event.target.value)} /></td>
                      <td><input type="number" value={item.freeGoods} onChange={(event) => updateItem(item.id, 'freeGoods', event.target.value)} /></td>
                      <td><input type="number" value={item.discountPercent} onChange={(event) => updateItem(item.id, 'discountPercent', event.target.value)} /></td>
                      <td className="is-number">{formatAmount(rowTotal)}</td>
                      <td><input value={item.remarks} onChange={(event) => updateItem(item.id, 'remarks', event.target.value)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="etr-order-summary">
            <span>Gross Amount: <strong>{formatAmount(totals.gross)}</strong></span>
            <span>Discount Amount: <strong>{formatAmount(totals.discount)}</strong></span>
            <span>Net Amount: <strong>{formatAmount(totals.net)}</strong></span>
          </div>

          <div className="etr-order-footer-actions">
            <button type="button" onClick={closeOrder}>Close</button>
          </div>
        </section>
      </div>

      <CustomerLookupModal
        isOpen={isCustomerLookupOpen}
        searchValue={customerSearch}
        onSearchChange={handleCustomerSearch}
        isLoading={isCustomersLoading}
        isCreating={isCreatingCustomer}
        error={customerLookupError || createCustomerError}
        rows={customerRows}
        onSelect={handleCustomerSelect}
        onCreateNew={handleStageNewCustomer}
        onClose={() => setIsCustomerLookupOpen(false)}
      />

      <AddressLookupModal
        isOpen={isAddressLookupOpen}
        isLoading={isAddressesLoading}
        error={addressLookupError}
        rows={addressRows}
        onSelect={handleAddressSelect}
        onClose={() => setIsAddressLookupOpen(false)}
      />

      <CreditTermLookupModal
        isOpen={isCreditTermLookupOpen}
        rows={creditTermOptions}
        onSelect={handleCreditTermSelect}
        onClose={() => setIsCreditTermLookupOpen(false)}
      />

      <ItemLookupModal
        isOpen={isItemLookupOpen}
        searchValue={itemSearch}
        onSearchChange={handleItemSearch}
        isLoading={isItemsLoading}
        error={itemLookupError}
        rows={itemRows}
        onSelect={handleItemSelect}
        onClose={() => { setIsItemLookupOpen(false); setActiveRowId(null); }}
      />
    </div>
  );
}
