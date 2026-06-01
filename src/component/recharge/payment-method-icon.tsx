import { Wallet } from 'lucide-react'
import Image from 'next/image'

interface PaymentMethodIconProps {
  src: string
  alt: string
  isWallet?: boolean
}

export function PaymentMethodIcon({ src, alt, isWallet }: PaymentMethodIconProps) {
  if (isWallet) {
    return <Wallet className='h-9 w-9' />
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={36}
      height={36}
      className='h-9 w-9 rounded-sm object-contain'
    />
  )
}
