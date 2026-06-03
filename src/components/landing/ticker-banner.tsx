import { TICKER_NOTIFICATIONS } from './data'
import type { JSX } from 'react'

const WhatsAppIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M128 24C70.6 24 24 70.6 24 128c0 22.3 6.2 43.1 16.9 60.9L24 232l43.1-16.9C84.9 225.8 105.7 232 128 232c57.4 0 104-46.6 104-104S185.4 24 128 24z"
      fill="#25D366"
    />
    <path
      d="M177.3 152.9c-3.1-1.6-18.4-9.1-21.3-10.1-2.9-1-5-1.6-7.1 1.6-2.1 3.1-8.1 10.1-9.9 12.1-1.8 2.1-3.6 2.3-6.7 0.8-3.1-1.6-13.1-4.8-24.9-15.4-9.2-8.3-15.4-18.5-17.2-21.6-1.8-3.1-0.2-4.8 1.4-6.4 1.4-1.4 3.1-3.6 4.7-5.4 1.6-1.8 2.1-3.1 3.1-5.2 1-2.1 0.5-3.9-0.3-5.5-0.8-1.6-7.1-17.1-9.7-23.4-2.6-6.2-5.2-5.2-7.1-5.2-1.8 0-3.9-0.3-6-0.3-2.1 0-5.5 0.8-8.3 3.9-2.9 3.1-11 10.8-11 26.3s11.3 30.5 12.9 32.6c1.6 2.1 22.1 34 53.6 47.4 7.5 3.2 13.3 5.1 17.9 6.5 7.5 2.4 14.3 2.1 19.7 1.3 6-0.9 18.4-7.5 21-14.8 2.6-7.3 2.6-13.5 1.8-14.8-0.8-1.3-2.9-2.1-6-3.7z"
      fill="white"
    />
  </svg>
)

const InstagramIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <rect x="28" y="28" width="200" height="200" rx="50" fill="#E4405F" />
    <circle cx="128" cy="128" r="50" fill="none" stroke="white" strokeWidth="10" />
    <circle cx="180" cy="76" r="12" fill="white" />
    <rect
      x="28"
      y="28"
      width="200"
      height="200"
      rx="50"
      fill="none"
      stroke="#E4405F"
      strokeWidth="56"
    />
  </svg>
)

const TikTokIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M192 40h-36v128c0 19.9-16.1 36-36 36s-36-16.1-36-36 16.1-36 36-36v-36c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72V76c7.6 5.5 16.8 8.8 27 9.9V50c-2.2-0.1-4.4-0.5-6.6-1.2-4.5-1.4-8.5-3.7-11.8-6.7-5.2-4.7-8.8-10.9-10.4-18.1h-0.2z"
      fill="white"
    />
  </svg>
)

const TelegramIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M128 24C70.6 24 24 70.6 24 128s46.6 104 104 104 104-46.6 104-104S185.4 24 128 24z"
      fill="#0088cc"
    />
    <path
      d="M105.8 158.2l-3.4 24.2c2.6 0 3.7-1.1 5.1-2.5 12.8-11.7 28.5-25.9 37.2-33.2l-38.9-22.2v33.7z"
      fill="#c8daea"
    />
    <path
      d="M106.8 144.2l59.8 43.3c6.8 3.8 11.7 1.8 13.4-6.3l23.8-112c2.5-10.8-3.8-14.9-11.5-11.8L60.2 109.8c-10.9 4.4-10.9 10.5-2 13.2l30.8 9.6 71.5-45.1c4.5-2.7 8.6-1.2 5.2 1.8z"
      fill="white"
    />
  </svg>
)

const FacebookIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M256 128C256 57.3 198.7 0 128 0S0 57.3 0 128c0 63.9 46.8 116.8 108 126.4V165H75.5v-37H108V99.8c0-32.1 19.1-49.8 48.4-49.8 14 0 28.7 2.5 28.7 2.5v31.6h-16.2c-15.9 0-20.9 9.9-20.9 20v24h35.5l-5.7 37H148v89.4c61.2-9.6 108-62.5 108-126.4z"
      fill="#1877F2"
    />
    <path
      d="M177.7 165l5.7-37H148v-24c0-10.1 5-20 20.9-20h16.2V52.5s-14.7-2.5-28.7-2.5c-29.3 0-48.4 17.7-48.4 49.8V128H75.5v37H108v89.4c7.8 1.2 15.8 1.8 24 1.8s16.2-0.6 24-1.8V165h21.7z"
      fill="white"
    />
  </svg>
)

const serviceIcon: Record<string, () => JSX.Element> = {
  WhatsApp: WhatsAppIcon,
  'WhatsApp Business': WhatsAppIcon,
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  Telegram: TelegramIcon,
  Facebook: FacebookIcon,
}

function maskName(name: string) {
  if (name.length <= 2) return `${name[0]}***${name[name.length - 1] ?? ''}`
  return `${name[0]}${name[1]}***${name[name.length - 1]}`
}

export default function TickerBanner() {
  const items = TICKER_NOTIFICATIONS.map((n, i) => {
    const Icon = serviceIcon[n.service]
    return (
      <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap mx-6">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.3)] shrink-0 animate-pulse" />
        {Icon ? <Icon /> : null}
        <span className="font-figtree text-sm tracking-[-0.14px] text-dark-900 font-semibold md:text-[15px]">
          <strong className="text-dark-900">{maskName(n.name)}</strong> a acheté{' '}
          <strong className="text-dark-900">
            {n.service}
            {n.country ? ` ${n.country}` : ''}
          </strong>
          {' — '}
          <span className="font-bold text-dark-900">{n.price}</span>
        </span>
      </span>
    )
  })

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full overflow-hidden bg-warm-100/95 border-t border-black/8 py-2 md:py-2.5 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="anim-ticker flex" style={{ width: 'max-content' }}>
        <div className="flex items-center shrink-0">{items}</div>
        <div className="flex items-center shrink-0">{items}</div>
      </div>
    </div>
  )
}
