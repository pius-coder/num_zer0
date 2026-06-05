/**
 * sms-online.pro numeric country code → ISO 3166-1 alpha-2 code
 *
 * WARNING: These are NOT telephone country prefixes.
 * sms-online.pro uses its own sequential numbering system.
 * DO NOT use mobile calling codes (e.g. 33 for France, 57 for Colombia).
 */
export const SMS_COUNTRY_MAP: Record<number, string> = {
  0: 'RU',   1: 'UA',   2: 'KZ',   3: 'CN',   4: 'PH',
  5: 'MM',   6: 'ID',   7: 'MY',   8: 'KE',   9: 'TZ',
  10: 'VN',  11: 'KG',  13: 'IL',  14: 'HK',  15: 'PL',
  16: 'GB',  17: 'MG',  18: 'CD',  19: 'NG',  20: 'MO',
  21: 'EG',  22: 'IN',  23: 'IE',  24: 'KH',  25: 'LA',
  26: 'HT',  27: 'CI',  28: 'GM',  29: 'RS',  30: 'YE',
  31: 'ZA',  32: 'RO',  33: 'CO',  34: 'EE',  35: 'AZ',
  36: 'CA',  37: 'MA',  38: 'GH',  39: 'AR',  40: 'UZ',
  41: 'CM',  42: 'TD',  43: 'DE',  44: 'LT',  45: 'HR',
  46: 'SE',  47: 'IQ',  48: 'NL',  49: 'LV',  50: 'AT',
  51: 'BY',  52: 'TH',  53: 'SA',  54: 'MX',  55: 'TW',
  56: 'ES',  57: 'IR',  58: 'DZ',  59: 'SI',  60: 'BD',
  61: 'SN',  62: 'TR',  63: 'CZ',  64: 'LK',  65: 'PE',
  66: 'PK',  67: 'NZ',  68: 'GN',  69: 'ML',  70: 'VE',
  71: 'ET',  72: 'MN',  73: 'BR',  74: 'AF',  75: 'UG',
  76: 'AO',  77: 'CY',  78: 'FR',  79: 'PG',  80: 'MZ',
  81: 'NP',  82: 'BE',  83: 'BG',  84: 'HU',  85: 'MD',
  86: 'IT',  87: 'PY',  88: 'HN',  89: 'TN',  90: 'NI',
  91: 'TL',  92: 'BO',  93: 'CR',  94: 'GT',  95: 'AE',
  96: 'ZW',  97: 'PR',  98: 'SD',  99: 'TG',  100: 'KW',
  101: 'SV', 102: 'LY', 103: 'JM', 104: 'TT', 105: 'EC',
  107: 'OM', 108: 'BA', 109: 'DO', 110: 'SY', 111: 'QA', 112: 'PA', 113: 'CU',
  114: 'MR', 115: 'SL', 116: 'JO', 117: 'PT', 118: 'BB',
  119: 'BI', 120: 'BJ', 121: 'BN', 122: 'BS', 123: 'BW',
  124: 'BZ', 125: 'CF', 126: 'DM', 127: 'GD', 128: 'GE',
  129: 'GR', 130: 'GW', 131: 'GY', 132: 'IS', 133: 'KM',
  134: 'KN', 135: 'LR', 136: 'LS', 137: 'MW', 138: 'NA',
  139: 'NE', 140: 'RW', 141: 'SK', 142: 'SR', 143: 'TJ',
  144: 'MC', 145: 'BH', 146: 'RE', 147: 'ZM', 148: 'AM',
  149: 'SO', 150: 'CG', 151: 'CL', 152: 'BF', 153: 'LB',
  154: 'GA', 155: 'AL', 156: 'UY', 157: 'MU', 158: 'BT',
  159: 'MV', 160: 'GP', 161: 'TM', 162: 'GF', 163: 'FI',
  164: 'LC', 165: 'LU', 166: 'VC', 167: 'GQ', 168: 'DJ',
  169: 'AG', 170: 'KY', 171: 'ME', 172: 'DK', 173: 'CH',
  174: 'NO', 175: 'AU', 176: 'ER', 178: 'ST', 179: 'AW',
  180: 'MS', 181: 'AI', 183: 'MK', 184: 'SC', 185: 'NC',
  186: 'CV', 187: 'US', 189: 'FJ', 196: 'SG', 201: 'GI',
}

/** ISO 3166-1 alpha-2 → sms-online.pro numeric code */
export const ISO_TO_SMS: Record<string, number> = {}
for (const [code, iso] of Object.entries(SMS_COUNTRY_MAP)) {
  ISO_TO_SMS[iso] = Number(code)
}

/** Lookup ISO code from numeric provider code. Returns null if not found. */
export function numericToIso(numeric: number): string | null {
  return SMS_COUNTRY_MAP[numeric] ?? null
}

/** Lookup numeric provider code from ISO code. Returns null if not found. */
export function isoToNumeric(iso: string): number | null {
  return ISO_TO_SMS[iso] ?? null
}
