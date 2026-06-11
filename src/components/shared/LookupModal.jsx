import React from 'react';

function LookupModal({
  title,
  children,
  onClose,
  isOpen = true,
  baseClassName = 'etr-lookup',
  closeLabel = 'Close',
  titleId,
}) {
  if (!isOpen) {
    return null;
  }

  const resolvedTitleId = titleId || `${baseClassName}-title`;

  return (
    <div className={`${baseClassName}-overlay`} role="presentation" onMouseDown={onClose}>
      <section
        className={`${baseClassName}-dialog`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`${baseClassName}-head`}>
          <h2 id={resolvedTitleId}>{title}</h2>
          <button type="button" onClick={onClose}>{closeLabel}</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default LookupModal;
