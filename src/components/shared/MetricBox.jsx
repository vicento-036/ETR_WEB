import React from 'react';

function MetricBox({
  label,
  value,
  hint,
  tone = '',
  className = '',
  labelClassName = '',
  valueClassName = '',
  hintClassName = '',
}) {
  const toneClassName = tone ? `is-${tone}` : '';
  const boxClassName = [className, toneClassName].filter(Boolean).join(' ');

  return (
    <div className={boxClassName}>
      {label ? <span className={labelClassName}>{label}</span> : null}
      {value !== undefined && value !== null ? <strong className={valueClassName}>{value}</strong> : null}
      {hint ? <small className={hintClassName}>{hint}</small> : null}
    </div>
  );
}

export default MetricBox;
