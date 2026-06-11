import React from 'react';

function StatusPill({
  children,
  className = '',
  variant = '',
  baseClassName = '',
  ...props
}) {
  const variantClassName = variant ? `is-${variant}` : '';
  const pillClassName = [baseClassName, variantClassName, className].filter(Boolean).join(' ');

  return (
    <span className={pillClassName} {...props}>
      {children}
    </span>
  );
}

export default StatusPill;
