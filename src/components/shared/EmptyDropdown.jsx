import React, { useState } from 'react';

function EmptyDropdown({ label = 'Empty dropdown', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`etr-journal-empty-dropdown ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="etr-journal-empty-dropdown-button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span aria-hidden="true">&nbsp;</span>
      </button>
      {isOpen ? (
        <div
          className="etr-journal-empty-dropdown-menu"
          role="listbox"
          tabIndex={-1}
          aria-label={`No ${label.toLowerCase()} available`}
        />
      ) : null}
    </div>
  );
}

export default EmptyDropdown;
