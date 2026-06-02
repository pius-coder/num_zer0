export interface Service {
  id: string
  slug: string
  name: string
  category: string
}

export interface CountryPrice {
  iso: string
  name: string
  priceEur: number
  priceXaf: number
  flag: string
}

export function eurToXaf(priceEur: number): number {
  const rate = 655.957
  const baseXaf = Math.ceil(priceEur * rate)
  let margin: number
  if (priceEur < 0.5) margin = 500
  else if (priceEur <= 1) margin = 1000
  else margin = 2000
  return baseXaf + margin
}

export const SERVICES: Service[] = [
  { id: 'wa', slug: 'whatsapp', name: 'WhatsApp', category: 'social' },
  { id: 'tg', slug: 'telegram', name: 'Telegram', category: 'social' },
  { id: 'vb', slug: 'viber', name: 'Viber', category: 'social' },
  { id: 'sg', slug: 'signal', name: 'Signal', category: 'social' },
  { id: 'li', slug: 'line', name: 'Line', category: 'social' },
  { id: 'imo', slug: 'imo', name: 'Imo', category: 'social' },
  { id: 'fb', slug: 'facebook', name: 'Facebook', category: 'social' },
  { id: 'gm', slug: 'gmail', name: 'Gmail', category: 'social' },
  { id: 'ub', slug: 'uber', name: 'Uber', category: 'social' },
  { id: 'az', slug: 'amazon', name: 'Amazon', category: 'social' },
]

export const COUNTRIES: CountryPrice[] = [
  { iso: 'FR', name: 'France', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇫🇷' },
  { iso: 'DE', name: 'Germany', priceEur: 0.40, priceXaf: eurToXaf(0.40), flag: '🇩🇪' },
  { iso: 'GB', name: 'United Kingdom', priceEur: 0.50, priceXaf: eurToXaf(0.50), flag: '🇬🇧' },
  { iso: 'US', name: 'United States', priceEur: 0.55, priceXaf: eurToXaf(0.55), flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', priceEur: 0.45, priceXaf: eurToXaf(0.45), flag: '🇨🇦' },
  { iso: 'ES', name: 'Spain', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇪🇸' },
  { iso: 'IT', name: 'Italy', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇮🇹' },
  { iso: 'PT', name: 'Portugal', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇵🇹' },
  { iso: 'NL', name: 'Netherlands', priceEur: 0.40, priceXaf: eurToXaf(0.40), flag: '🇳🇱' },
  { iso: 'BE', name: 'Belgium', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇧🇪' },
  { iso: 'SE', name: 'Sweden', priceEur: 0.50, priceXaf: eurToXaf(0.50), flag: '🇸🇪' },
  { iso: 'NO', name: 'Norway', priceEur: 0.60, priceXaf: eurToXaf(0.60), flag: '🇳🇴' },
  { iso: 'DK', name: 'Denmark', priceEur: 0.55, priceXaf: eurToXaf(0.55), flag: '🇩🇰' },
  { iso: 'FI', name: 'Finland', priceEur: 0.50, priceXaf: eurToXaf(0.50), flag: '🇫🇮' },
  { iso: 'IE', name: 'Ireland', priceEur: 0.45, priceXaf: eurToXaf(0.45), flag: '🇮🇪' },
  { iso: 'RO', name: 'Romania', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇷🇴' },
  { iso: 'PL', name: 'Poland', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇵🇱' },
  { iso: 'GR', name: 'Greece', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇬🇷' },
  { iso: 'HU', name: 'Hungary', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇭🇺' },
  { iso: 'AT', name: 'Austria', priceEur: 0.40, priceXaf: eurToXaf(0.40), flag: '🇦🇹' },
  { iso: 'CH', name: 'Switzerland', priceEur: 0.70, priceXaf: eurToXaf(0.70), flag: '🇨🇭' },
  { iso: 'AU', name: 'Australia', priceEur: 0.55, priceXaf: eurToXaf(0.55), flag: '🇦🇺' },
  { iso: 'NZ', name: 'New Zealand', priceEur: 0.50, priceXaf: eurToXaf(0.50), flag: '🇳🇿' },
  { iso: 'JP', name: 'Japan', priceEur: 0.65, priceXaf: eurToXaf(0.65), flag: '🇯🇵' },
  { iso: 'KR', name: 'South Korea', priceEur: 0.60, priceXaf: eurToXaf(0.60), flag: '🇰🇷' },
  { iso: 'CN', name: 'China', priceEur: 0.45, priceXaf: eurToXaf(0.45), flag: '🇨🇳' },
  { iso: 'IN', name: 'India', priceEur: 0.20, priceXaf: eurToXaf(0.20), flag: '🇮🇳' },
  { iso: 'ID', name: 'Indonesia', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇮🇩' },
  { iso: 'MY', name: 'Malaysia', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇲🇾' },
  { iso: 'PH', name: 'Philippines', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇵🇭' },
  { iso: 'SG', name: 'Singapore', priceEur: 0.55, priceXaf: eurToXaf(0.55), flag: '🇸🇬' },
  { iso: 'TH', name: 'Thailand', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇹🇭' },
  { iso: 'VN', name: 'Vietnam', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇻🇳' },
  { iso: 'ZA', name: 'South Africa', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇿🇦' },
  { iso: 'NG', name: 'Nigeria', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇳🇬' },
  { iso: 'KE', name: 'Kenya', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇰🇪' },
  { iso: 'EG', name: 'Egypt', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇪🇬' },
  { iso: 'MA', name: 'Morocco', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇲🇦' },
  { iso: 'CM', name: 'Cameroon', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇨🇲' },
  { iso: 'CI', name: "Côte d'Ivoire", priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇨🇮' },
  { iso: 'SN', name: 'Senegal', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇸🇳' },
  { iso: 'ML', name: 'Mali', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇲🇱' },
  { iso: 'BF', name: 'Burkina Faso', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇧🇫' },
  { iso: 'TG', name: 'Togo', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇹�' },
  { iso: 'BJ', name: 'Benin', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇧🇯' },
  { iso: 'NE', name: 'Niger', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇳🇪' },
  { iso: 'TD', name: 'Chad', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇹🇩' },
  { iso: 'CF', name: 'Central African Republic', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇨🇫' },
  { iso: 'GA', name: 'Gabon', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇬🇦' },
  { iso: 'CG', name: 'Congo', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇨🇬' },
  { iso: 'CD', name: 'DR Congo', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇨🇩' },
  { iso: 'AO', name: 'Angola', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇦🇴' },
  { iso: 'MZ', name: 'Mozambique', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇲🇿' },
  { iso: 'MG', name: 'Madagascar', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇲🇬' },
  { iso: 'TZ', name: 'Tanzania', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇹🇿' },
  { iso: 'UG', name: 'Uganda', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇺🇬' },
  { iso: 'RW', name: 'Rwanda', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇷🇼' },
  { iso: 'ET', name: 'Ethiopia', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇪🇹' },
  { iso: 'GH', name: 'Ghana', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇬🇭' },
  { iso: 'ZM', name: 'Zambia', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇿🇲' },
  { iso: 'ZW', name: 'Zimbabwe', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇿🇼' },
  { iso: 'MW', name: 'Malawi', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇲🇼' },
  { iso: 'BW', name: 'Botswana', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇧🇼' },
  { iso: 'NA', name: 'Namibia', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇳🇦' },
  { iso: 'LS', name: 'Lesotho', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇱🇸' },
  { iso: 'SZ', name: 'Eswatini', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇸🇿' },
  { iso: 'MU', name: 'Mauritius', priceEur: 0.40, priceXaf: eurToXaf(0.40), flag: '🇲🇺' },
  { iso: 'SC', name: 'Seychelles', priceEur: 0.45, priceXaf: eurToXaf(0.45), flag: '🇸🇨' },
  { iso: 'KM', name: 'Comoros', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇰🇲' },
  { iso: 'DJ', name: 'Djibouti', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇩🇯' },
  { iso: 'MR', name: 'Mauritania', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇲🇷' },
  { iso: 'GM', name: 'Gambia', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇬🇲' },
  { iso: 'SL', name: 'Sierra Leone', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇸🇱' },
  { iso: 'LR', name: 'Liberia', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇱🇷' },
  { iso: 'GN', name: 'Guinea', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇬🇳' },
  { iso: 'SO', name: 'Somalia', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇸🇴' },
  { iso: 'SS', name: 'South Sudan', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇸🇸' },
  { iso: 'SD', name: 'Sudan', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇸🇩' },
  { iso: 'ER', name: 'Eritrea', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇪🇷' },
  { iso: 'BI', name: 'Burundi', priceEur: 0.25, priceXaf: eurToXaf(0.25), flag: '🇧🇮' },
  { iso: 'CV', name: 'Cape Verde', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇨🇻' },
  { iso: 'ST', name: 'São Tomé and Príncipe', priceEur: 0.30, priceXaf: eurToXaf(0.30), flag: '🇸🇹' },
  { iso: 'GQ', name: 'Equatorial Guinea', priceEur: 0.35, priceXaf: eurToXaf(0.35), flag: '🇬�' },
]

export function getCountryByIso(iso: string): CountryPrice | undefined {
  return COUNTRIES.find(c => c.iso === iso)
}

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find(s => s.slug === slug)
}
