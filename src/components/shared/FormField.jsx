import React from 'react';
import DateTextInput from './DateTextInput.jsx';

function FormField({
  label,
  children,
  className = '',
  error = '',
  name,
  value,
  onChange,
  type = 'text',
  readOnly = false,
  required = false,
  placeholder = '',
  maxLength,
  inputMode,
  onKeyDown,
  displayFormatter,
  inputClassName = '',
}) {
  const fieldClassName = [className, error ? 'has-error' : ''].filter(Boolean).join(' ');
  const handleChange = (event) => onChange?.(event);

  return (
    <label className={fieldClassName}>
      {label ? <span>{label}</span> : null}
      {children || (
        type === 'date' ? (
          <DateTextInput
            name={name}
            value={value}
            onChange={(_, event) => handleChange(event)}
            readOnly={readOnly}
            required={required}
            placeholder={placeholder || 'MM/DD/YYYY'}
            displayFormatter={displayFormatter}
            ariaInvalid={!!error}
            ariaRequired={required}
            className={inputClassName}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            readOnly={readOnly}
            aria-invalid={!!error}
            aria-required={required}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={inputMode}
            onKeyDown={onKeyDown}
            required={required}
            className={inputClassName}
          />
        )
      )}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}

export default FormField;
