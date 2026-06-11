import React, { useRef } from 'react';

function defaultDisplayFormatter(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function DateTextInput({
  value,
  onChange,
  readOnly = false,
  className = '',
  name,
  displayFormatter = defaultDisplayFormatter,
  placeholder = 'MM/DD/YYYY',
  ariaReadOnly,
  ariaInvalid,
  ariaRequired,
  required = false,
  disabled,
  ...props
}) {
  const pickerRef = useRef(null);
  const isPickerDisabled = readOnly || disabled;

  const openPicker = () => {
    if (isPickerDisabled) {
      return;
    }

    const picker = pickerRef.current;

    if (!picker) {
      return;
    }

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
      return;
    }

    picker.focus();
  };

  return (
    <span className={className} style={{ position: 'relative', display: 'block' }}>
      <input
        {...props}
        type="text"
        name={name}
        inputMode="numeric"
        placeholder={placeholder}
        value={displayFormatter(value)}
        readOnly
        style={{ fontWeight: 400 }}
        aria-readonly={ariaReadOnly}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        required={required}
        onClick={openPicker}
        onFocus={openPicker}
      />
      <input
        ref={pickerRef}
        type="date"
        name={name}
        value={value || ''}
        onChange={(event) => onChange?.(event.target.value, event)}
        disabled={disabled}
        readOnly={readOnly}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}

export default DateTextInput;
