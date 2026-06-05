import type { SmsActivationStatus } from '#/type/sms_activation'

export const STATUS_LABELS: Record<SmsActivationStatus, string> = {
  awaiting_number: 'Attribution du numéro…',
  awaiting_sms: 'En attente du SMS…',
  sms_received: 'SMS reçu',
  completed: 'Activation terminée',
  cancelled: 'Annulée',
  expired: 'Expirée',
  no_numbers: 'Aucun numéro disponible',
  max_price_too_low: 'Prix maximum trop bas',
}

export const STATUS_COLORS: Record<SmsActivationStatus, string> = {
  awaiting_number: 'text-amber-500',
  awaiting_sms: 'text-amber-500',
  sms_received: 'text-[#25D366]',
  completed: 'text-[#25D366]',
  cancelled: 'text-red-500',
  expired: 'text-gray-400',
  no_numbers: 'text-red-500',
  max_price_too_low: 'text-red-500',
}

export const SVG_IDS = new Set([
  'az', 'bj', 'df', 'dt', 'dw', 'dx', 'dz', 'ee',
  'eo', 'er', 'et', 'fp', 'fq', 'fu', 'fy', 'gn',
  'gs', 'gv', 'hd', 'hf', 'ia', 'ic', 'ie', 'il',
  'jf', 'kj', 'lv', 'mc', 'mh', 'nq', 'of', 'og',
  'oh', 'op', 'pg', 'qc', 'qm', 'qz', 'rc', 'rl',
  'sx', 'tj', 'tt', 'up', 'vf', 'wl', 'yb', 'yu',
])

export const NO_ICON_IDS = new Set([
  'ac', 'af', 'an', 'aq', 'ar', 'at', 'av', 'aw',
  'ax', 'ba', 'bb', 'bc', 'be', 'bf', 'bn', 'bo',
  'bp', 'br', 'bu', 'bw', 'cc', 'cm', 'cn', 'cr',
  'cy', 'da', 'de', 'dg', 'dj', 'dr', 'du', 'dv',
  'eh', 'em', 'eq', 'es', 'eu', 'ev', 'fc', 'fd',
  'ff', 'fh', 'fi', 'fj', 'ft', 'full', 'fv', 'fx',
  'gc', 'gg', 'gk', 'gt', 'gy', 'hh', 'hj', 'hs',
  'ib', 'ih', 'ij', 'ik', 'io', 'ir', 'iu', 'jc',
  'je', 'ji', 'jr', 'js', 'kb', 'kd', 'ke', 'kh',
  'kk', 'ko', 'kp', 'kq', 'ks', 'kv', 'ky', 'lb',
  'lj', 'lm', 'lo', 'ma', 'mg', 'ml', 'mn', 'mp',
  'mt', 'mv', 'mw', 'my', 'nb', 'nh', 'ni', 'nt',
  'nu', 'nw', 'ob', 'ok', 'ov', 'pc', 'pl', 'pp',
  'ps', 'py', 'pz', 'qi', 'qj', 'qn', 'qr', 'qt',
  'qy', 'rd', 'rj', 'rm', 'ro', 'rs', 'rw', 'rz',
  'sa', 'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'sl',
  'ss', 'st', 'sv', 'sy', 'th', 'tk', 'ui', 'un',
  'uu', 'uv', 'vd', 'vg', 'vj', 'vk', 'vr', 'we',
  'wf', 'wg', 'wj', 'wn', 'wq', 'ws', 'wt', 'xh',
  'xj', 'xm', 'xn', 'xp', 'xr', 'xu', 'ya', 'yg',
  'yh', 'yj', 'yk', 'ym', 'yo', 'yp', 'yx', 'yz',
  'zb', 'zi', 'zj', 'zo', 'zr', 'zs',
])

export const XAF_USD_RATE = 600
export const FLAG_BASE = 'https://flagcdn.com'
export const PAGE_SIZE = 20
