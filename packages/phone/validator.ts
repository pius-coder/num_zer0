export function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s\-\(\)]/g, "");
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
}
