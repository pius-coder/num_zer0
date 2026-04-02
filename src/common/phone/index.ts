export type ParsedPhone = {
  countryCode: string;
  nationalNumber: string;
  raw: string;
  formatted: string;
};

export type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

export function parsePhone(raw: string): ParsedPhone | null {
  const cleaned = raw.replace(/[\s\-()]/g, "");
  const match = cleaned.match(/^(\+?\d{1,3})(\d{6,14})$/);
  if (!match || !match[1] || !match[2]) return null;
  return {
    countryCode: match[1],
    nationalNumber: match[2],
    raw,
    formatted: `${match[1]} ${match[2]}`,
  };
}

export function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s\-()]/g, "");
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
}

export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

export function sanitizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export function phoneToEmail(phone: string): string {
  const digits = sanitizePhone(phone).replace("+", "");
  return `${digits}@numzero.com`;
}

export function phoneToUsername(phone: string): string {
  return sanitizePhone(phone).replace("+", "");
}

export function isPhoneEmail(email: string): boolean {
  return /^\d+@numzero\.com$/.test(email);
}

export function emailToPhone(email: string): string {
  const digits = email.split("@")[0];
  return `+${digits}`;
}
