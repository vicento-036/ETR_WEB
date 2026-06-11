import React from 'react';

function ActionGroup({
  children,
  className = '',
  align = '',
  ...props
}) {
  const alignClassName = align ? `is-${align}` : '';
  const groupClassName = [className, alignClassName].filter(Boolean).join(' ');

  return (
    <div className={groupClassName} {...props}>
      {children}
    </div>
  );
}

export default ActionGroup;
