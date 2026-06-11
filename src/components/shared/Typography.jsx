import React from 'react';

const typographyVariants = {
  kicker: 'etr-text-kicker',
  title: 'etr-text-title',
  subtitle: 'etr-text-subtitle',
  label: 'etr-text-label',
  body: 'etr-text-body',
  muted: 'etr-text-muted',
  value: 'etr-text-value',
};

function Typography({
  children,
  variant = 'body',
  className = '',
  as,
  ...props
}) {
  const Component = as || (variant === 'title' ? 'h1' : variant === 'kicker' ? 'p' : 'span');
  const variantClassName = typographyVariants[variant] || '';
  const textClassName = [variantClassName, className].filter(Boolean).join(' ');

  return (
    <Component className={textClassName} {...props}>
      {children}
    </Component>
  );
}

export default Typography;
