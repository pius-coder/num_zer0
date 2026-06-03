import { FLOATING_IMAGES } from './data'

export default function FloatingImages() {
  const positions = [
    { bottom: 'bottom-[302px]', right: 'right-[-123px]' },
    { bottom: 'bottom-[429px]', right: 'right-[-153px]' },
    { bottom: 'bottom-[567px]', right: 'right-[-123px]' },
    { bottom: 'bottom-[579px]', left: 'left-[-124px]' },
    { bottom: 'bottom-[452px]', left: 'left-[-154px]' },
    { bottom: 'bottom-[325px]', left: 'left-[-124px]' },
  ]

  return (
    <>
      {FLOATING_IMAGES.map((card, i) => (
        <div
          key={i}
          className={`absolute z-1 ${positions[i].bottom} ${positions[i].right || positions[i].left || ''}`}
        >
          <div className="bg-dark-900 border border-white/15 rounded-[16px] px-4 py-3 w-[280px] backdrop-blur">
            <div className="flex justify-between items-center">
              <span className="font-figtree font-semibold text-[15px] text-white">
                {card.flag} {card.service}
              </span>
              <span className="font-figtree font-bold text-[15px] text-[#25D366]">
                {card.price}
              </span>
            </div>
            <div className="flex gap-[6px] mt-[6px]">
              {card.badges.map((b) => (
                <span
                  key={b}
                  className="font-figtree font-medium text-[10px] text-white/50 bg-white/8 px-2 py-[2px] rounded-[20px] tracking-[0.02em]"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
