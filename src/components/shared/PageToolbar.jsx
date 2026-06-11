import React from 'react';
import Typography from './Typography.jsx';

function PageToolbar({
  kicker,
  title,
  subtitle,
  actions = null,
  className = '',
  contentClassName = '',
  actionsClassName = '',
}) {
  return (
    <div className={className}>
      <div className={contentClassName}>
        {kicker ? <Typography variant="kicker">{kicker}</Typography> : null}
        {title ? <Typography variant="title">{title}</Typography> : null}
        {subtitle ? <Typography variant="subtitle">{subtitle}</Typography> : null}
      </div>
      {actions ? <div className={actionsClassName}>{actions}</div> : null}
    </div>
  );
}

export default PageToolbar;
