import React from 'react';

function StatusPill({ children, className = '' }) {
  return <span className={className}>{children}</span>;
}

export default StatusPill;
