import React from 'react';

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isSubmitting = false,
  submittingLabel,
  baseClassName = 'etr-confirm',
  confirmClassName = 'etr-confirm-primary',
  cancelClassName = 'etr-confirm-secondary',
  modalClassName,
  titleBarClassName,
  bodyClassName,
  icon,
  iconClassName,
  actionsClassName,
  closeButtonLabel,
}) {
  const titleId = `${baseClassName}-dialog-title`;
  const content = (
    <>
      {icon ? <div className={iconClassName} aria-hidden="true">{icon}</div> : null}
      <p>{message}</p>
    </>
  );

  return (
    <div className={`${baseClassName}-overlay`} role="presentation" onMouseDown={onCancel}>
      <section
        className={modalClassName || `${baseClassName}-modal`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {titleBarClassName ? (
          <div className={titleBarClassName}>
            <h2 id={titleId}>{title}</h2>
            {closeButtonLabel ? (
              <button type="button" onClick={onCancel} aria-label={closeButtonLabel} disabled={isSubmitting}>
                x
              </button>
            ) : null}
          </div>
        ) : (
          <h2 id={titleId}>{title}</h2>
        )}
        {bodyClassName ? <div className={bodyClassName}>{content}</div> : content}
        <div className={actionsClassName || `${baseClassName}-actions`}>
          <button type="button" className={cancelClassName} onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClassName} onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (submittingLabel || confirmLabel) : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
