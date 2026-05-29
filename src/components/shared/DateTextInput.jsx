import React from 'react';

function DateTextInput({ value, onChange, readOnly = false, className = '', ...props }) {
  return (
    <input
      {...props}
      className={className}
      type="date"
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
      readOnly={readOnly}
    />
  );
}

export default DateTextInput;
