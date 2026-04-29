import React, { useEffect, useRef, useState } from 'react';
import ExpenseEntryView from '../features/expenses/ExpenseEntry';

const sidebarSections = [
  {
    id: 'sales',
    title: 'Sales',
    children: [
      { id: 'customer', label: 'Customer', icon: 'group' },
      { id: 'sales-agent', label: 'Sales Agent', icon: 'person' },
      { id: 'bill-collector', label: 'Bill Collector', icon: 'person' },
      {
        id: 'advanced-pricing',
        label: 'Advanced Pricing',
        icon: 'bars',
        children: [
          { id: 'pricelist', label: 'Pricelist', icon: 'document' },
          { id: 'promo-deals', label: 'Promo Deals', icon: 'folder' },
          { id: 'promo-discount', label: 'Promo Discount', icon: 'document' },
        ],
      },
      { id: 'order-entry', label: 'Order Entry', icon: 'table' },
      { id: 'invoice', label: 'Invoice', icon: 'document' },
      { id: 'billing-entry', label: 'Billing Entry', icon: 'clipboard' },
      { id: 'customer-returns', label: 'Customer Returns', icon: 'folder' },
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics',
    children: [
      { id: 'picklist-entry', label: 'Picklist Entry', icon: 'clipboard' },
      { id: 'delivery-manifest', label: 'Delivery Manifest', icon: 'table' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    children: [
      { id: 'purchase-order', label: 'Purchase Order', icon: 'document' },
      { id: 'supplier-returns', label: 'Supplier Returns', icon: 'folder' },
      { id: 'stock-transfer', label: 'Stock Transfer', icon: 'network' },
      { id: 'withdrawal-entry', label: 'Withdrawal Entry', icon: 'clipboard' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    children: [
      { id: 'expense-entry', label: 'Expense Entry', icon: 'document' },
      { id: 'official-receipt', label: 'Official Receipt', icon: 'document' },
      { id: 'official-receipt-deductions', label: 'Official Receipt Deductions', icon: 'table' },
      { id: 'payable-entry', label: 'Payable Entry', icon: 'clipboard' },
      { id: 'voucher-payment', label: 'Voucher Payment', icon: 'folder' },
      { id: 'journal-entry', label: 'Journal Entry', icon: 'document' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    children: [
      { id: 'stock-inquiry', label: 'Stock Inquiry', icon: 'bars' },
      { id: 'lot-inquiry', label: 'Lot inquiry', icon: 'table' },
      { id: 'price-inquiry', label: 'Price Inquiry', icon: 'document' },
      { id: 'receivables-inquiry', label: 'Receivables Inquiry', icon: 'folder' },
      { id: 'payables-inquiry', label: 'Payables Inquiry', icon: 'folder' },
      { id: 'bank-inquiry', label: 'Bank Inquiry', icon: 'table' },
      { id: 'ledger-view', label: 'Ledger View', icon: 'clipboard' },
      { id: 'account-balances', label: 'Account Balances', icon: 'bars' },
    ],
  },
];

function SidebarIcon({ type }) {
  const icons = {
    bars: <path d="M4 19h16v1.8H4V19Zm1-2V9h2v8H5Zm4 0V5h2v12H9Zm4 0v-6h2v6h-2Zm4 0v-3h2v3h-2Z" />,
    clipboard: <path d="M9 3h6l1 2h3v16H5V5h3l1-2Zm0 4H7v12h10V7h-2v2H9V7Zm1-2v2h4V5h-4Z" />,
    network: <path d="M5 5h4v4H5V5Zm10 0h4v4h-4V5ZM10 15h4v4h-4v-4ZM7 9v2h10V9h2v4h-5v2h-4v-2H5V9h2Z" />,
    folder: <path d="M4 6h5l2 2h9v10H4V6Zm2 2v8h12V10h-8.2L7.8 8H6Z" />,
    document: <path d="M6 3h8l4 4v14H6V3Zm2 2v14h8V8h-3V5H8Zm2 7h4v2h-4v-2Zm0-4h4v2h-4V8Z" />,
    table: <path d="M5 5h14v14H5V5Zm2 2v2h3V7H7Zm5 0v2h5V7h-5ZM7 11v2h3v-2H7Zm5 0v2h5v-2h-5ZM7 15v2h3v-2H7Zm5 0v2h5v-2h-5Z" />,
    globe: <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 0 0-1.9 13.73c-.69-1.34-1.11-3.05-1.11-4.73H6.2A7.02 7.02 0 0 0 12 19Zm0-2c.77 0 1.86 1.3 2.48 3H9.52C10.14 4.3 11.23 3 12 3Zm3.11 5A15.3 15.3 0 0 1 15.8 12H8.2c.08-1.44.31-2.79.69-4h6.22ZM17.8 14h-2.8c0 1.68-.42 3.39-1.11 4.73A7.02 7.02 0 0 0 17.8 14Zm-4.37 0h-2.86c.3 1.93.95 3.43 1.43 3.88.48-.45 1.13-1.95 1.43-3.88Zm-.01-10c.7 1.35 1.12 3.06 1.12 4.74h2.8A7.02 7.02 0 0 0 13.42 4ZM6.2 10h2.8c0-1.68.42-3.39 1.12-4.74A7.02 7.02 0 0 0 6.2 10Z" />,
    group: <path d="M9 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6 1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM4 19v-1c0-2.76 2.24-5 5-5s5 2.24 5 5v1H4Zm11-.2V18c0-1.45-.5-2.78-1.34-3.83A4.5 4.5 0 0 1 20 18v.8h-5Z" />,
    person: <path d="M12 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm-6 8c0-3.31 2.69-6 6-6s6 2.69 6 6H6Z" />,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[type]}</svg>;
}

function ChevronIcon({ isOpen }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`etr-chevron-icon ${isOpen ? 'is-open' : ''}`}>
      <path d="M8 4 16 12 8 20" />
    </svg>
  );
}

function getUserInitials(name) {
  if (!name) {
    return 'ES';
  }

  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0].toUpperCase()).join('') || 'ES';
}

function getUserDisplayName(user) {
  if (!user) {
    return 'Executive Service Account';
  }

  const lastName = user.lastName || user.lastname || user.LastName || user.LASTNAME || '';
  const firstName = user.firstName || user.firstname || user.FirstName || user.FIRSTNAME || '';

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }

  if (lastName) {
    return lastName;
  }

  if (firstName) {
    return firstName;
  }

  return user.username || 'Executive Service Account';
}

function DashboardContent({ activeItemId, user }) {
  if (activeItemId === 'expense-entry') {
    return <ExpenseEntryView user={user} />;
  }

  return (
    <div className="etr-dashboard-empty-state">
      <p className="etr-expense-kicker">Module Workspace</p>
      <h1>Select a transaction from the sidebar</h1>
      <span>Finance Expense Entry is ready with the DailyExpense table.</span>
    </div>
  );
}

function DashboardNode({ item, level, openItems, activeItemId, onToggle, onSelect }) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isOpen = !!openItems[item.id];
  const isActive = activeItemId === item.id;

  return (
    <li className={`etr-dashboard-node level-${level}`}>
      <button
        type="button"
        className={`etr-dashboard-child-button ${hasChildren ? 'has-children' : 'is-leaf'} ${isOpen ? 'is-open' : ''} ${isActive ? 'is-active' : ''}`}
        onClick={() => (hasChildren ? onToggle(item.id) : onSelect(item.id))}
      >
        <span className="etr-dashboard-item-main">
          <span className="etr-dashboard-item-icon">
            <SidebarIcon type={item.icon} />
          </span>
          <span>{item.label}</span>
        </span>

        {hasChildren ? (
          <span className="etr-dashboard-item-arrow" aria-hidden="true">
            <ChevronIcon isOpen={isOpen} />
          </span>
        ) : null}
      </button>

      {hasChildren && isOpen ? (
        <ul className="etr-dashboard-child-list nested">
          {item.children.map((child) => (
            <DashboardNode
              key={child.id}
              item={child}
              level={level + 1}
              openItems={openItems}
              activeItemId={activeItemId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function DashboardPage({ user, onLogout }) {
  const [sidebarWidth, setSidebarWidth] = useState(398);
  const [activeItemId, setActiveItemId] = useState('expense-entry');
  const [openSections, setOpenSections] = useState({
    sales: false,
    logistics: false,
    inventory: false,
    finance: true,
    analytics: false,
    'advanced-pricing': false,
  });
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startWidth: 398,
  });
  const displayName = getUserDisplayName(user);
  const userInitials = getUserInitials(displayName);

  const toggleSection = (sectionId) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragStateRef.current.isDragging) {
        return;
      }

      const deltaX = event.clientX - dragStateRef.current.startX;
      const nextWidth = dragStateRef.current.startWidth + deltaX;
      setSidebarWidth(Math.max(0, Math.min(520, nextWidth)));
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current.isDragging) {
        return;
      }

      dragStateRef.current.isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleResizeStart = (event) => {
    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startWidth: sidebarWidth,
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleShowSidebar = () => {
    setSidebarWidth(sidebarWidth > 0 ? 0 : 398);
  };

  return (
    <main className="etr-dashboard-page">
      <header className="etr-dashboard-topbar">
        <button
          type="button"
          className="etr-dashboard-menu-button"
          onClick={handleShowSidebar}
          aria-label="Toggle sidebar"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="etr-dashboard-brand">ETRIS INTEGRATED SYSTEM</div>

        <label className="etr-dashboard-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z" />
          </svg>
          <input type="text" placeholder="Search module, document, or transaction" />
        </label>

        <div className="etr-dashboard-account-wrap">
          <div className="etr-dashboard-avatar">{userInitials}</div>
          <div className="etr-dashboard-account">
            <strong>{displayName}</strong>
          </div>
          <button type="button" className="etr-dashboard-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="etr-dashboard-shell" style={{ gridTemplateColumns: `${sidebarWidth}px 9px 1fr` }}>
        <aside className={`etr-dashboard-sidebar ${sidebarWidth <= 0 ? 'is-collapsed' : ''}`}>
          {sidebarSections.map((section) => {
            const isOpen = !!openSections[section.id];

            return (
              <section key={section.id} className="etr-dashboard-section">
                <button
                  type="button"
                  className={`etr-dashboard-section-toggle etr-dashboard-top-category ${isOpen ? 'is-open' : ''}`}
                  onClick={() => toggleSection(section.id)}
                >
                  <span>{section.title}</span>
                  <span className="etr-dashboard-item-arrow" aria-hidden="true">
                    <ChevronIcon isOpen={isOpen} />
                  </span>
                </button>

                {isOpen ? (
                  <ul className="etr-dashboard-child-list">
                    {section.children.map((item) => (
                      <DashboardNode
                        key={item.id}
                        item={item}
                        level={1}
                        openItems={openSections}
                        activeItemId={activeItemId}
                        onToggle={toggleSection}
                        onSelect={setActiveItemId}
                      />
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </aside>

        <button
          type="button"
          className="etr-dashboard-resizer"
          onPointerDown={handleResizeStart}
          aria-label="Resize sidebar"
        />

        <section className="etr-dashboard-main">
          <div className="etr-dashboard-canvas">
            <div className="etr-dashboard-content">
              <DashboardContent activeItemId={activeItemId} user={user} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
