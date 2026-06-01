export type ServiceCategory =
  | 'messaging'
  | 'social'
  | 'email'
  | 'finance'
  | 'dating'
  | 'marketplace'
  | 'gaming'
  | 'transport'
  | 'food'
  | 'crypto'
  | 'ai'
  | 'ecommerce'
  | 'other'

const CATEGORY_MAP: Record<string, ServiceCategory> = {
  whatsapp: 'messaging',
  telegram: 'messaging',
  viber: 'messaging',
  wechat: 'messaging',
  line: 'messaging',
  kakaotalk: 'messaging',
  signal: 'messaging',
  discord: 'messaging',
  skype: 'messaging',
  imo: 'messaging',
  zalo: 'messaging',
  facebook: 'social',
  instagram: 'social',
  twitter: 'social',
  tiktok: 'social',
  snapchat: 'social',
  reddit: 'social',
  pinterest: 'social',
  linkedin: 'social',
  threads: 'social',
  tumblr: 'social',
  gmail: 'email',
  google: 'email',
  yahoo: 'email',
  outlook: 'email',
  protonmail: 'email',
  paypal: 'finance',
  wise: 'finance',
  revolut: 'finance',
  venmo: 'finance',
  cashapp: 'finance',
  zelle: 'finance',
  binance: 'crypto',
  coinbase: 'crypto',
  kraken: 'crypto',
  bybit: 'crypto',
  kucoin: 'crypto',
  okx: 'crypto',
  huobi: 'crypto',
  bitfinex: 'crypto',
  tinder: 'dating',
  bumble: 'dating',
  hinge: 'dating',
  badoo: 'dating',
  meetic: 'dating',
  happn: 'dating',
  okcupid: 'dating',
  pof: 'dating',
  grindr: 'dating',
  fetlife: 'dating',
  amazon: 'marketplace',
  ebay: 'marketplace',
  aliexpress: 'marketplace',
  etsy: 'marketplace',
  mercari: 'marketplace',
  shopee: 'marketplace',
  lazada: 'marketplace',
  steam: 'gaming',
  epic: 'gaming',
  riot: 'gaming',
  playstation: 'gaming',
  xbox: 'gaming',
  nintendo: 'gaming',
  twitch: 'gaming',
  uber: 'transport',
  lyft: 'transport',
  bolt: 'transport',
  grab: 'transport',
  indrive: 'transport',
  doordash: 'food',
  ubereats: 'food',
  deliveroo: 'food',
  grubhub: 'food',
  claude: 'ai',
  openai: 'ai',
  chatgpt: 'ai',
  copilot: 'ai',
  midjourney: 'ai',
  perplexity: 'ai',
  gemini: 'ai',
  shopify: 'ecommerce',
  stripe: 'ecommerce',
  fiverr: 'ecommerce',
  upwork: 'ecommerce',
  netflix: 'other',
  spotify: 'other',
  apple: 'other',
  microsoft: 'other',
  samsung: 'other',
  nike: 'other',
  adidas: 'other',
}

export function categorize(slug: string): ServiceCategory {
  return CATEGORY_MAP[slug] ?? 'other'
}

export function titleCase(name: string): string {
  return name
    .split(/[\s,-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
