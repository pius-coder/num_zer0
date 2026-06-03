import type { ReactNode } from 'react'

interface FeatureCardProps {
  children: ReactNode
}

export function FeatureCard({ children }: FeatureCardProps) {
  return (
    <div className="border border-[#292929] bg-[#121212] rounded-[20px] overflow-hidden flex flex-col md:rounded-[40px]">
      {children}
    </div>
  )
}

interface CardContentProps {
  title: string
  description: string
}

export function CardContent({ title, description }: CardContentProps) {
  return (
    <div className="p-4 md:p-6">
      <h4 className="font-figtree text-[20px] font-[400] tracking-[-0.04em] leading-[1.4] text-white m-0 md:text-[24px]">
        {title}
      </h4>
      <p className="font-figtree font-medium text-[14px] tracking-[-0.3px] leading-[1.5] text-white/65 mt-2 md:text-[16px]">
        {description}
      </p>
    </div>
  )
}
