import React from 'react';
import accountPayablesIcon from '../../../assets/icons/account-payables.jpg';
import accountReceivablesIcon from '../../../assets/icons/account-receivables.jpg';

export const modules = [
  {
    title: 'Sales Analytics',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18h16v2H2V4h2v14Zm3-2V9h3v7H7Zm5 0V5h3v11h-3Zm5 0v-4h3v4h-3Z" />
      </svg>
    ),
  },
  {
    title: 'Customer Relationship Management',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM8 13c2.76 0 5 2.24 5 5v1h-2v-1a3 3 0 0 0-6 0v1H3v-1c0-2.76 2.24-5 5-5Zm8 0c2.76 0 5 2.24 5 5v1h-2v-1a3 3 0 0 0-6 0v1h-2v-1c0-2.76 2.24-5 5-5Zm-4-1h0Z" />
      </svg>
    ),
  },
  {
    title: 'Inventory Management and Analysis',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V5h14v14ZM7 7h5v5H7V7Zm7 1h3v2h-3V8Zm0 4h3v2h-3v-2ZM9.5 17l-3-3 1.41-1.41 1.59 1.58 4.09-4.08L15 11.5 9.5 17Z" />
      </svg>
    ),
  },
  {
    title: 'Accounts Payables',
    icon: (
      <img src={accountPayablesIcon} alt="" />
    ),
  },
  {
    title: 'Accounts Receivables',
    icon: (
      <img src={accountReceivablesIcon} alt="" />
    ),
  },
  {
    title: 'Accounting',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4v3h14V7H5Zm0 5v3h4v-3H5Zm6 0v3h8v-3h-8Zm-6 5v2h4v-2H5Zm6 0v2h8v-2h-8Z" />
      </svg>
    ),
  },
  {
    title: 'Logistics',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h11v8h2.5l2.5-3.5h2V16h-1a3 3 0 1 1-6 0H9a3 3 0 1 1-6 0H2V8a2 2 0 0 1 1-2Zm2 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm12 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-1-7v3h2.5L20 9h-4Z" />
      </svg>
    ),
  },
  {
    title: 'Human Resources',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM5.5 13a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm13 0a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM12 14c3.31 0 6 2.69 6 6h-2a4 4 0 0 0-8 0H6c0-3.31 2.69-6 6-6Zm-6.5.5c1.98 0 3.67 1.21 4.39 2.93l-1.88.68A2.75 2.75 0 0 0 5.5 16.5c-1.1 0-2.08.65-2.51 1.61l-1.88-.68A4.75 4.75 0 0 1 5.5 14.5Zm13 0a4.75 4.75 0 0 1 4.39 2.93l-1.88.68a2.75 2.75 0 0 0-5.02 0l-1.88-.68a4.75 4.75 0 0 1 4.39-2.93Z" />
      </svg>
    ),
  },
];
