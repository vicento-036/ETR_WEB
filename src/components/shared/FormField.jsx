import React from 'react';

function FormField({ label, children, className = '', error = '' }) {
  return (
    <label className={className}>
      {label ? <span>{label}</span> : null}
      {children}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}

export default FormField;
