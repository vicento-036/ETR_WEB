import React from 'react';

function UploadDropzone({
  children,
  inputRef,
  accept,
  multiple = false,
  disabled = false,
  onChange,
  onDragOver,
  onDragLeave,
  onDrop,
  className = '',
  error = '',
}) {
  const dropzoneClassName = [className, error ? 'has-error' : ''].filter(Boolean).join(' ');

  return (
    <>
      <label
        className={dropzoneClassName}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={onChange}
          disabled={disabled}
        />
        {children}
      </label>
      {error ? <small role="alert">{error}</small> : null}
    </>
  );
}

export default UploadDropzone;
