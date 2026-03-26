import type { ParsedPhone } from "./types";

export function parsePhone(raw: string): ParsedPhone | null {
  const cleaned = raw.replace(/[\s\-\(\)]/g, "");
  const match = cleaned.match(/^(\+?\d{1,3})(\d{6,14})$/);

  if (!match) return null;

  return {
    countryCode: match[1],
    nationalNumber: match[2],
    raw,
    formatted: `${match[1]} ${match[2]}`,
  };
}
