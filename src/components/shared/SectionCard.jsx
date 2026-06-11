import React from 'react';

function SectionCard({
  title,
  subtitle,
  children,
  className = '',
  headerClassName = '',
  titleClassName = '',
  subtitleClassName = '',
  actions = null,
  as: Component = 'section',
}) {
  return (
    <Component className={className}>
      {(title || subtitle || actions) ? (
        <div className={headerClassName}>
          <div>
            {title ? <h2 className={titleClassName}>{title}</h2> : null}
            {subtitle ? <span className={subtitleClassName}>{subtitle}</span> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </Component>
  );
}

export default SectionCard;
