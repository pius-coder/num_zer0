import { readFileSync, writeFileSync } from 'fs'

const prefixes = {
  FR: '+33', DE: '+49', GB: '+44', US: '+1', CA: '+1',
  ES: '+34', IT: '+39', PT: '+351', NL: '+31', BE: '+32',
  SE: '+46', NO: '+47', DK: '+45', FI: '+358', IE: '+353',
  RO: '+40', PL: '+48', GR: '+30', HU: '+36', AT: '+43',
  CH: '+41', AU: '+61', NZ: '+64', JP: '+81', KR: '+82',
  CN: '+86', IN: '+91', ID: '+62', MY: '+60', PH: '+63',
  SG: '+65', TH: '+66', VN: '+84', ZA: '+27', NG: '+234',
  KE: '+254', EG: '+20', MA: '+212', CM: '+237', CI: '+225',
  SN: '+221', ML: '+223', BF: '+226', TG: '+228', BJ: '+229',
  NE: '+227', TD: '+235', CF: '+236', GA: '+241', CG: '+242',
  CD: '+243', AO: '+244', MZ: '+258', MG: '+261', TZ: '+255',
  UG: '+256', RW: '+250', ET: '+251', GH: '+233', ZM: '+260',
  ZW: '+263', MW: '+265', BW: '+267', NA: '+264', LS: '+266',
  SZ: '+268', MU: '+230', SC: '+248', KM: '+269', DJ: '+253',
  MR: '+222', GM: '+220', SL: '+232', LR: '+231', GN: '+224',
  SO: '+252', SS: '+211', SD: '+249', ER: '+291',
}

const src = readFileSync('src/components/services/data.ts', 'utf8')

// Match: { iso: 'XX', name: '...', priceUsd: ..., priceXaf: usdToXaf(...), flag: '..' },
const regex = /\{ iso: '(\w{2})', name: '[^']+', priceUsd: [^,]+, priceXaf: [^,]+, flag: '[^']+' \},/g

let count = 0
const result = src.replace(regex, (match, iso) => {
  const prefix = prefixes[iso]
  if (!prefix) return match
  count++
  // Insert phonePrefix before flag
  return match.replace(', flag:', `, phonePrefix: '${prefix}', flag:`)
})

console.log('Updated:', count, 'countries')
writeFileSync('src/components/services/data.ts', result)
