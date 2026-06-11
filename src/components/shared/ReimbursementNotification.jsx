import React from 'react';

function ReimbursementNotification({
  title,
  referenceNo,
  children,
  isPosted = false,
  className = '',
}) {
  const notificationClassName = [
    'etr-report-status-banner',
    isPosted ? 'is-posted' : '',
    className,
  ].filter(Boolean).join(' ');

  if (!title && !referenceNo && !children) {
    return null;
  }

  return (
    <div className={notificationClassName}>
      {title ? <strong>{title}</strong> : null}
      {referenceNo ? <span>Reference No: {referenceNo}</span> : null}
      {children}
    </div>
  );
}

export default ReimbursementNotification;
