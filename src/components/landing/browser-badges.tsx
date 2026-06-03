import { BROWSER_BADGES } from './data'

export default function BrowserBadges() {
  const [b1, b2, b3] = BROWSER_BADGES.links

  return (
    <div className="flex flex-col items-center justify-center w-full gap-2 p-3 bg-warm-100 rounded-[14px] md:p-4">
      <div className="flex-none h-10 w-[135px] relative overflow-visible md:h-[45px] md:w-[155px]">
        <div
          className="absolute bottom-0 top-0 w-10 left-[8px] md:w-[45px]"
          style={{ transform: 'rotate(2deg)' }}
        >
          <a
            href={b1.href}
            target="_blank"
            rel="noopener"
            className="border border-black/12 bg-[rgb(255,250,245)] rounded-[12px] h-full w-full flex items-center justify-center shadow-[-0.36px_0.6px_0.7px_-1.25px_rgba(0,0,0,0.216),-1.37px_2.29px_2.67px_-2.5px_rgba(0,0,0,0.191),-6px_10px_11.66px_-3.75px_rgba(0,0,0,0.075)]"
          >
            <img
              decoding="async"
              loading="lazy"
              width="30"
              height="auto"
              src={b1.icon}
              alt={b1.platform}
              className="block object-contain w-[30px] h-auto md:w-[34px]"
            />
          </a>
        </div>
        <div
          className="absolute bottom-0 top-0 w-10 left-[calc(49.68%-20px)] md:w-[45px]"
          style={{ transform: 'rotate(-2deg)' }}
        >
          <a
            href={b2.href}
            target="_blank"
            rel="noopener"
            className="border border-black/12 bg-[rgb(255,250,245)] rounded-[12px] h-full w-full flex items-center justify-center shadow-[-0.36px_0.6px_0.7px_-1.25px_rgba(0,0,0,0.216),-1.37px_2.29px_2.67px_-2.5px_rgba(0,0,0,0.191),-6px_10px_11.66px_-3.75px_rgba(0,0,0,0.075)]"
          >
            <img
              decoding="async"
              loading="lazy"
              width="34"
              height="auto"
              src={b2.icon}
              alt={b2.platform}
              className="block object-contain w-[30px] h-auto md:w-[34px]"
            />
          </a>
        </div>
        <div
          className="absolute bottom-0 top-0 w-10 left-[86px] md:w-[45px]"
          style={{ transform: 'rotate(2deg)' }}
        >
          <a
            href={b3.href}
            target="_blank"
            rel="noopener"
            className="border border-black/12 bg-[rgb(255,250,245)] rounded-[12px] h-full w-full flex items-center justify-center shadow-[-0.36px_0.6px_0.7px_-1.25px_rgba(0,0,0,0.216),-1.37px_2.29px_2.67px_-2.5px_rgba(0,0,0,0.191),-6px_10px_11.66px_-3.75px_rgba(0,0,0,0.075)]"
          >
            <img
              decoding="async"
              loading="lazy"
              width="30"
              height="auto"
              src={b3.icon}
              alt={b3.platform}
              className="block object-contain w-[30px] h-auto md:w-[34px]"
            />
          </a>
        </div>
      </div>
      <p className="font-figtree font-medium text-base tracking-[-0.01em] leading-[1.6] text-dark-900/75 text-center m-0 break-words">
        {BROWSER_BADGES.text}
      </p>
    </div>
  )
}
