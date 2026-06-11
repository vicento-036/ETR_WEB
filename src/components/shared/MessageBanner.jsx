import React from 'react';

const variantClassNames = {
  success: '',
  error: 'is-error',
  warning: 'is-warning',
  info: 'is-info',
};

function MessageBanner({
  children,
  message,
  variant = 'success',
  className = '',
  baseClassName = 'etr-expense-save-message',
  role,
}) {
  const content = children || message;

  if (!content) {
    return null;
  }

  const bannerClassName = [
    baseClassName,
    variantClassNames[variant] || (variant ? `is-${variant}` : ''),
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={bannerClassName} role={role || (variant === 'error' ? 'alert' : 'status')}>
      {content}
    </div>
  );
}

export default MessageBanner;
