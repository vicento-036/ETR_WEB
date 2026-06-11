import React from 'react';

function SearchField({
  label = 'Search',
  value,
  onChange,
  placeholder = 'Search',
  className = '',
  inputClassName = '',
  role = 'search',
  ...props
}) {
  return (
    <label className={className} role={role}>
      {label ? <span>{label}</span> : null}
      <input
        {...props}
        className={inputClassName}
        value={value}
        onChange={(event) => onChange?.(event.target.value, event)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default SearchField;
