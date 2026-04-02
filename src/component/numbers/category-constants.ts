export const CATEGORY_LABELS: Record<string, string> = {
  messaging: 'Messagerie',
  social: 'Social',
  email: 'Email',
  finance: 'Finance',
  crypto: 'Crypto',
  ai: 'AI',
  dating: 'Dating',
  gaming: 'Gaming',
  marketplace: 'Marketplace',
  transport: 'Transport',
  food: 'Food',
  ecommerce: 'E-commerce',
  other: 'Autre',
}

export const CATEGORY_COLORS: Record<string, string> = {
  messaging: 'var(--category-messaging, #25D366)',
  social: 'var(--category-social, #E4405F)',
  email: 'var(--category-email, #EA4335)',
  finance: 'var(--category-finance, #FF9900)',
  crypto: 'var(--category-crypto, #F7931A)',
  ai: 'var(--category-ai, #7C3AED)',
  dating: 'var(--category-dating, #FF6B6B)',
  gaming: 'var(--category-gaming, #5865F2)',
  marketplace: 'var(--category-marketplace, #FF9900)',
  transport: 'var(--category-transport, #000000)',
  food: 'var(--category-food, #FF6B00)',
  ecommerce: 'var(--category-ecommerce, #0066FF)',
  other: 'var(--category-other, #888888)',
}

export const CATEGORIES = [
  'all',
  'messaging',
  'social',
  'email',
  'finance',
  'crypto',
  'ai',
  'dating',
  'gaming',
  'marketplace',
  'transport',
  'food',
  'ecommerce',
  'other',
] as const

export type FilterMode = 'all' | 'popular'

export const HOT_SERVICES = ['whatsapp', 'telegram', 'instagram', 'gmail', 'google', 'tiktok']
