export function hasValue(value) {
  return String(value ?? '').trim().length > 0;
}
