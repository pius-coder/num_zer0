const PHONE_EMAIL_DOMAIN = 'numzero.com'

export function sanitizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

export function phoneToEmail(phone: string): string {
  const digits = sanitizePhone(phone).replace('+', '')
  return `${digits}@${PHONE_EMAIL_DOMAIN}`
}

export function phoneToUsername(phone: string): string {
  return sanitizePhone(phone).replace('+', '')
}

export function isPhoneEmail(email: string): boolean {
  const pattern = new RegExp(`^\\d{8,15}@${PHONE_EMAIL_DOMAIN.replace('.', '\\.')}$`)
  return pattern.test(email)
}

export function emailToPhone(email: string): string | null {
  if (!isPhoneEmail(email)) return null
  const digits = email.split('@')[0]
  return `+${digits}`
}

export function isValidPhone(phone: string): boolean {
  const cleaned = sanitizePhone(phone).replace('+', '')
  return /^\d{8,15}$/.test(cleaned)
}
