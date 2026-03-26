/**
 * Phone Number Utilities for num_zero
 *
 * Converts phone numbers to deterministic email addresses for Better-Auth compatibility.
 * Format: [digits]@num_zero.com
 *
 * Better-Auth requires an email for user registration. Since this platform is phone-first,
 * we generate a synthetic email from the phone number so the auth system works transparently.
 */

// Must be a syntactically valid email domain (underscores are invalid in DNS labels).
const PHONE_EMAIL_DOMAIN = 'numzero.com'

/**
 * Strips all non-digit characters from a phone number, keeping the leading '+' if present.
 * @example sanitizePhone('+1 (555) 123-4567') => '+15551234567'
 */
export function sanitizePhone(phone: string): string {
    const trimmed = phone.trim()
    const hasPlus = trimmed.startsWith('+')
    const digits = trimmed.replace(/\D/g, '')
    return hasPlus ? `+${digits}` : digits
}

/**
 * Converts a phone number into a deterministic email for Better-Auth.
 * Note: some validators reject emails whose local-part begins with '+', so we use digits-only.
 * @example phoneToEmail('+237612345678') => '237612345678@num_zero.com'
 * @example phoneToEmail('237612345678')  => '237612345678@num_zero.com'
 */
export function phoneToEmail(phone: string): string {
    const digits = phoneToUsername(phone)
    return `${digits}@${PHONE_EMAIL_DOMAIN}`
}

/**
 * Converts a phone number into a valid Better-Auth username (digits only).
 * The username plugin only accepts alphanumeric characters — no '+' or spaces.
 * @example phoneToUsername('+237 612 345 678') => '237612345678'
 */
export function phoneToUsername(phone: string): string {
    return phone.replace(/\D/g, '')
}

/**
 * Checks whether an email is a synthetic phone-generated email from this platform.
 */
export function isPhoneEmail(email: string): boolean {
    if (!email.endsWith(`@${PHONE_EMAIL_DOMAIN}`)) return false
    const local = email.slice(0, email.length - (`@${PHONE_EMAIL_DOMAIN}`).length)
    return /^\d{8,15}$/.test(local)
}

/**
 * Extracts the phone number back from a synthetic phone email.
 * @example emailToPhone('+237612345678@num_zero.com') => '+237612345678'
 * @returns The phone number string, or null if not a phone email.
 */
export function emailToPhone(email: string): string | null {
    if (!isPhoneEmail(email)) return null
    const local = email.slice(0, email.length - (`@${PHONE_EMAIL_DOMAIN}`).length)
    return `+${local}`
}

/**
 * Basic phone number format validation.
 * Accepts: +[country_code][number] with at least 8 digits total.
 */
export function isValidPhone(phone: string): boolean {
    const sanitized = sanitizePhone(phone)
    const digits = sanitized.replace(/\D/g, '')
    return digits.length >= 8 && digits.length <= 15
}
