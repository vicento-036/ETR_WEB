import React, { useMemo, useState } from 'react';
import '../../styles/daily-expense.css';
import '../../styles/order-entry.css';

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
  status: 'Draft',
  creditTerms: '',
  customerPo: '',
  account: '',
  deliveryAddress: '',
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

function Field({ label, children, className = '' }) {
  return (
    <label className={`etr-expense-field etr-order-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function OrderEntry() {
  const [order, setOrder] = useState(initialOrder);
  const [items, setItems] = useState([createOrderItem()]);
  const [message, setMessage] = useState('');

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

  const authorizePerson = () => {
    setMessage('Authorized person selection is ready for backend lookup integration.');
  };

  const closeDraft = () => {
    setMessage('Order entry draft closed in the frontend.');
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
                <input type="text" value={order.creditTerms} onChange={(event) => updateOrder('creditTerms', event.target.value)} />
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
                <Field label="Account">
                  <input type="text" value={order.account} onChange={(event) => updateOrder('account', event.target.value)} />
                </Field>
                <Field label="Delivery Address">
                  <input type="text" value={order.deliveryAddress} onChange={(event) => updateOrder('deliveryAddress', event.target.value)} />
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
            <strong>{order.status || 'Draft'}</strong>
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
              <button type="button" onClick={authorizePerson}>Authorize Person</button>
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
                      <td><input value={item.code} onChange={(event) => updateItem(item.id, 'code', event.target.value)} /></td>
                      <td><input value={item.description} onChange={(event) => updateItem(item.id, 'description', event.target.value)} /></td>
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
            <button type="button" onClick={closeDraft}>Close</button>
          </div>
        </section>
      </div>
    </div>
  );
}
