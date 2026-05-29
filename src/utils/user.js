export function getUserField(user, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = user?.[fieldName];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}
