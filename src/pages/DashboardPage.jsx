import React, { useEffect, useRef, useState } from 'react';

const salesAnalyticsSections = [
  {
    id: 'sales-report',
    title: 'SALES REPORT (SALESFORCE)',
    children: [
      {
        id: 'comparative-sales-performance',
        label: 'Comparative Sales Performance',
        icon: 'bars',
        children: [
          { id: 'csp-monthly-summary', label: 'Monthly Summary', icon: 'document' },
          { id: 'csp-territory-breakdown', label: 'Territory Breakdown', icon: 'table' },
        ],
      },
    ],
  },
  {
    id: 'product-sales',
    title: 'PRODUCT SALES REPORTS',
    children: [
      {
        id: 'performance-by-product-group',
        label: 'Performance by Product Group',
        icon: 'clipboard',
        children: [
          { id: 'performance-top-groups', label: 'Top Performing Groups', icon: 'bars' },
          { id: 'performance-growth-groups', label: 'Growth by Group', icon: 'document' },
        ],
      },
      {
        id: 'comparative-sales',
        label: 'Comparative Sales',
        icon: 'network',
        children: [
          { id: 'comparative-sales-quarterly', label: 'Quarterly Comparison', icon: 'bars' },
          { id: 'comparative-sales-ytd', label: 'YTD Comparison', icon: 'table' },
        ],
      },
      {
        id: 'customer-group-product',
        label: 'Customer Group Product',
        icon: 'folder',
        children: [
          { id: 'customer-group-top-customers', label: 'Top Customer Groups', icon: 'group' },
          { id: 'customer-group-product-mix', label: 'Product Mix', icon: 'document' },
        ],
      },
      {
        id: 'product-performance-growth',
        label: 'Product Performance Y to Y (Growth)',
        icon: 'document',
        children: [
          { id: 'product-growth-national', label: 'National Growth', icon: 'bars' },
          { id: 'product-growth-per-brand', label: 'Growth per Brand', icon: 'table' },
        ],
      },
      {
        id: 'product-performance-monthly',
        label: 'Product Performance Y o Y (Monthly)',
        icon: 'document',
        children: [
          { id: 'product-monthly-trend', label: 'Monthly Trend', icon: 'bars' },
          { id: 'product-monthly-variance', label: 'Monthly Variance', icon: 'table' },
        ],
      },
    ],
  },
  {
    id: 'customer-sales',
    title: 'CUSTOMER SALES REPORTS',
    children: [
      {
        id: 'growth-performance',
        label: 'Growth Performance',
        icon: 'bars',
        children: [
          { id: 'growth-top-customers', label: 'Top Growth Customers', icon: 'group' },
          { id: 'growth-low-customers', label: 'Low Growth Customers', icon: 'document' },
        ],
      },
      {
        id: 'customer-sales-item',
        label: 'Customer Sales',
        icon: 'folder',
        children: [
          { id: 'customer-sales-ranking', label: 'Customer Ranking', icon: 'bars' },
          { id: 'customer-sales-detail', label: 'Sales Detail', icon: 'table' },
        ],
      },
    ],
  },
  {
    id: 'inquiry',
    title: 'INQUIRY REPORTS',
    children: [
      {
        id: 'order-monitoring-report',
        label: 'Order Monitoring Report',
        icon: 'table',
        children: [
          { id: 'order-pending', label: 'Pending Orders', icon: 'document' },
          { id: 'order-completed', label: 'Completed Orders', icon: 'check' },
        ],
      },
      {
        id: 'aging-report',
        label: 'Aging Report',
        icon: 'bars',
        children: [
          { id: 'aging-current', label: 'Current Aging', icon: 'table' },
          { id: 'aging-overdue', label: 'Overdue Aging', icon: 'document' },
        ],
      },
      {
        id: 'ar-inquiry',
        label: 'AR Inquiry',
        icon: 'table',
        children: [
          { id: 'ar-customer-balance', label: 'Customer Balance', icon: 'group' },
          { id: 'ar-payment-status', label: 'Payment Status', icon: 'check' },
        ],
      },
      {
        id: 'transaction-monitoring',
        label: 'Transaction Monitoring',
        icon: 'folder',
        children: [
          { id: 'transaction-daily-log', label: 'Daily Log', icon: 'document' },
          { id: 'transaction-status-board', label: 'Status Board', icon: 'table' },
        ],
      },
      {
        id: 'stock-inquiry',
        label: 'Stock Inquiry',
        icon: 'folder',
        children: [
          { id: 'stock-availability', label: 'Stock Availability', icon: 'bars' },
          { id: 'stock-reorder-list', label: 'Reorder List', icon: 'clipboard' },
        ],
      },
    ],
  },
  {
    id: 'field-force',
    title: 'FIELD FORCE REPORTS',
    children: [
      {
        id: 'attendance-report',
        label: 'Attendance Report',
        icon: 'check',
        children: [
          { id: 'attendance-daily', label: 'Daily Attendance', icon: 'document' },
          { id: 'attendance-summary', label: 'Attendance Summary', icon: 'table' },
        ],
      },
      {
        id: 'call-coverage-report',
        label: 'Call Coverage Report',
        icon: 'bars',
        children: [
          { id: 'coverage-territory', label: 'Territory Coverage', icon: 'globe' },
          { id: 'coverage-rep-performance', label: 'Representative Performance', icon: 'person' },
        ],
      },
    ],
  },
  {
    id: 'quick-views',
    title: 'QUICK VIEWS',
    children: [
      {
        id: 'regions',
        label: 'Regions',
        icon: 'globe',
        children: [
          { id: 'regions-north', label: 'North Region', icon: 'folder' },
          { id: 'regions-south', label: 'South Region', icon: 'folder' },
        ],
      },
      {
        id: 'district-managers',
        label: 'District Managers',
        icon: 'group',
        children: [
          { id: 'district-active', label: 'Active Managers', icon: 'person' },
          { id: 'district-assigned', label: 'Assigned Districts', icon: 'table' },
        ],
      },
      {
        id: 'pmrs',
        label: 'PMRs',
        icon: 'person',
        children: [
          { id: 'pmr-roster', label: 'PMR Roster', icon: 'group' },
          { id: 'pmr-territories', label: 'Assigned Territories', icon: 'globe' },
        ],
      },
      {
        id: 'product-groups',
        label: 'Product Groups',
        icon: 'cubes',
        children: [
          { id: 'product-group-catalog', label: 'Group Catalog', icon: 'clipboard' },
          { id: 'product-group-status', label: 'Group Status', icon: 'table' },
        ],
      },
      {
        id: 'products',
        label: 'Products',
        icon: 'folder',
        children: [
          { id: 'products-master-list', label: 'Master List', icon: 'document' },
          { id: 'products-fast-moving', label: 'Fast Moving Items', icon: 'bars' },
        ],
      },
    ],
  },
];

function SidebarIcon({ type }) {
  const icons = {
    chart: <path d="M4 18h16v2H2V4h2v14Zm3-1V9h3v8H7Zm5 0V5h3v12h-3Zm5 0v-5h3v5h-3Z" />,
    bars: <path d="M4 19h16v1.8H4V19Zm1-2V9h2v8H5Zm4 0V5h2v12H9Zm4 0v-6h2v6h-2Zm4 0v-3h2v3h-2Z" />,
    clipboard: <path d="M9 3h6l1 2h3v16H5V5h3l1-2Zm0 4H7v12h10V7h-2v2H9V7Zm1-2v2h4V5h-4Z" />,
    network: <path d="M5 5h4v4H5V5Zm10 0h4v4h-4V5ZM10 15h4v4h-4v-4ZM7 9v2h10V9h2v4h-5v2h-4v-2H5V9h2Z" />,
    folder: <path d="M4 6h5l2 2h9v10H4V6Zm2 2v8h12V10h-8.2L7.8 8H6Z" />,
    document: <path d="M6 3h8l4 4v14H6V3Zm2 2v14h8V8h-3V5H8Zm2 7h4v2h-4v-2Zm0-4h4v2h-4V8Z" />,
    table: <path d="M5 5h14v14H5V5Zm2 2v2h3V7H7Zm5 0v2h5V7h-5ZM7 11v2h3v-2H7Zm5 0v2h5v-2h-5ZM7 15v2h3v-2H7Zm5 0v2h5v-2h-5Z" />,
    check: <path d="M6 4h12v16H6V4Zm2 2v12h8V6H8Zm1 6.5 1.4-1.4 1.6 1.6 3.6-3.6 1.4 1.4-5 5-3-3Z" />,
    globe: <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 0 0-1.9 13.73c-.69-1.34-1.11-3.05-1.11-4.73H6.2A7.02 7.02 0 0 0 12 19Zm0-2c.77 0 1.86 1.3 2.48 3H9.52C10.14 4.3 11.23 3 12 3Zm3.11 5A15.3 15.3 0 0 1 15.8 12H8.2c.08-1.44.31-2.79.69-4h6.22ZM17.8 14h-2.8c0 1.68-.42 3.39-1.11 4.73A7.02 7.02 0 0 0 17.8 14Zm-4.37 0h-2.86c.3 1.93.95 3.43 1.43 3.88.48-.45 1.13-1.95 1.43-3.88Zm-.01-10c.7 1.35 1.12 3.06 1.12 4.74h2.8A7.02 7.02 0 0 0 13.42 4ZM6.2 10h2.8c0-1.68.42-3.39 1.12-4.74A7.02 7.02 0 0 0 6.2 10Z" />,
    group: <path d="M9 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6 1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM4 19v-1c0-2.76 2.24-5 5-5s5 2.24 5 5v1H4Zm11-.2V18c0-1.45-.5-2.78-1.34-3.83A4.5 4.5 0 0 1 20 18v.8h-5Z" />,
    person: <path d="M12 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm-6 8c0-3.31 2.69-6 6-6s6 2.69 6 6H6Z" />,
    cubes: <path d="m12 2 7 4v8l-7 4-7-4V6l7-4Zm0 2.3L7.2 7 12 9.7 16.8 7 12 4.3Zm-5 4.4v4.1l4 2.3v-4.1l-4-2.3Zm10 0-4 2.3v4.1l4-2.3V8.7Z" />,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[type]}</svg>;
}

function DashboardNode({ item, level, openItems, onToggle }) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isOpen = !!openItems[item.id];

  return (
    <li className={`etr-dashboard-node level-${level}`}>
      <button
        type="button"
        className={`etr-dashboard-child-button ${hasChildren ? 'has-children' : 'is-leaf'} ${isOpen ? 'is-open' : ''}`}
        onClick={() => hasChildren && onToggle(item.id)}
      >
        <span className="etr-dashboard-item-main">
          <span className="etr-dashboard-item-icon">
            <SidebarIcon type={item.icon} />
          </span>
          <span>{item.label}</span>
        </span>

        {hasChildren ? (
          <span className="etr-dashboard-item-arrow" aria-hidden="true">
            {isOpen ? '\u25be' : '\u25b8'}
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
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function DashboardPage({ user, onLogout }) {
  const [sidebarWidth, setSidebarWidth] = useState(398);
  const [isSalesAnalyticsOpen, setIsSalesAnalyticsOpen] = useState(true);
  const [openSections, setOpenSections] = useState({
    'sales-report': true,
    'comparative-sales-performance': false,
  });
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startWidth: 398,
  });

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

  return (
    <main className="etr-dashboard-page">
      <header className="etr-dashboard-topbar">
        <div className="etr-dashboard-brand">Masigasig Sales Portal</div>

        <label className="etr-dashboard-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z" />
          </svg>
          <input type="text" placeholder="Search" />
        </label>

        <div className="etr-dashboard-account-wrap">
          <div className="etr-dashboard-avatar">ES</div>
          <div className="etr-dashboard-account">
            <strong>{user?.username || 'Executive Service Account'}</strong>
            <span>EXECUTIVE MANAGER</span>
          </div>
          <button type="button" className="etr-dashboard-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="etr-dashboard-shell" style={{ gridTemplateColumns: `${sidebarWidth}px 9px 1fr` }}>
        <aside className={`etr-dashboard-sidebar ${sidebarWidth <= 0 ? 'is-collapsed' : ''}`}>
          <section className="etr-dashboard-root-group">
            <button
              type="button"
              className={`etr-dashboard-root-button ${isSalesAnalyticsOpen ? 'is-open is-active' : ''}`}
              onClick={() => setIsSalesAnalyticsOpen((current) => !current)}
            >
              <span className="etr-dashboard-item-main">
                <span className="etr-dashboard-item-icon">
                  <SidebarIcon type="chart" />
                </span>
                <span>Sales Analytics</span>
              </span>

              <span className="etr-dashboard-item-arrow" aria-hidden="true">
                {isSalesAnalyticsOpen ? '\u25be' : '\u25b8'}
              </span>
            </button>

            {isSalesAnalyticsOpen && sidebarWidth > 0 ? (
              <div className="etr-dashboard-subgroups">
                {salesAnalyticsSections.map((section) => {
                  const isOpen = !!openSections[section.id];

                  return (
                    <section key={section.id} className="etr-dashboard-section">
                      <button
                        type="button"
                        className={`etr-dashboard-section-toggle ${isOpen ? 'is-open' : ''}`}
                        onClick={() => toggleSection(section.id)}
                      >
                        <span>{section.title}</span>
                        <span className="etr-dashboard-item-arrow" aria-hidden="true">
                          {isOpen ? '\u25be' : '\u25b8'}
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
                              onToggle={toggleSection}
                            />
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            ) : null}
          </section>
        </aside>

        <button
          type="button"
          className="etr-dashboard-resizer"
          onPointerDown={handleResizeStart}
          aria-label="Resize Sales Analytics panel"
        />

        <section className="etr-dashboard-main">
          <div className="etr-dashboard-canvas">
            <div className="etr-dashboard-scroll-space" />
          </div>
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
