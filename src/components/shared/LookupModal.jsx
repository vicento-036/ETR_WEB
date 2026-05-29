import React from 'react';

function LookupModal({ title, children, onClose }) {
  return (
    <div className="etr-lookup-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="etr-lookup-modal">
        <div className="etr-lookup-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default LookupModal;
