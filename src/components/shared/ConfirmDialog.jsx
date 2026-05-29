import React from 'react';

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  return (
    <div className="etr-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="etr-confirm-modal">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="etr-confirm-actions">
          <button type="button" className="etr-confirm-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="etr-confirm-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
