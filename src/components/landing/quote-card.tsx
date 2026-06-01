import { QUOTE } from "./data"

export default function QuoteCard() {
  return (
    <div className="mt-12 border border-[#292929] rounded-[26px] overflow-hidden relative bg-[#121212] md:mt-20 md:rounded-[44px]">
      <div className="absolute inset-0">
        <img
          decoding="async"
          width="1200"
          height="580"
          src="https://framerusercontent.com/images/EmtrS6jwtHfiUvXubu21rYWcs0.jpeg?scale-down-to=1024"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#121111]" />
      <div className="relative px-5 py-10 max-w-[600px] md:px-10 md:py-20">
        <p className="font-figtree font-medium text-[18px] tracking-[-0.3px] leading-[1.5] text-white m-0 italic md:text-[20px]">
          &ldquo;{QUOTE.text}&rdquo;
        </p>
        <p className="font-figtree font-medium text-[14px] tracking-[-0.3px] leading-[1.5] text-white/65 mt-4 md:text-[16px]">
          {QUOTE.author}
        </p>
      </div>
    </div>
  )
}
