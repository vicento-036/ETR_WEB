import React from 'react';

function EmptyState({
  title,
  message,
  children,
  action = null,
  className = '',
  titleClassName = '',
  messageClassName = '',
}) {
  return (
    <div className={className}>
      {title ? <strong className={titleClassName}>{title}</strong> : null}
      {message ? <span className={messageClassName}>{message}</span> : null}
      {children}
      {action}
    </div>
  );
}

export default EmptyState;
