import type { PaymentMethod } from './step-method'

interface MethodInfo {
  id: PaymentMethod
  label: string
  desc: string
  iconSrc: string
  iconAlt: string
  color: string
  activeColor: string
}

export const METHODS: MethodInfo[] = [
  {
    id: 'mtn_momo',
    label: 'MTN MoMo',
    desc: 'Mobile Money MTN',
    iconSrc: '/mtn-logo.jpg',
    iconAlt: 'MTN MoMo',
    color: 'bg-yellow-500/10 text-yellow-600',
    activeColor: 'bg-yellow-500 text-white',
  },
  {
    id: 'orange_money',
    label: 'Orange Money',
    desc: 'Mobile Money Orange',
    iconSrc: '/orange-logo.png',
    iconAlt: 'Orange Money',
    color: 'bg-orange-500/10 text-orange-600',
    activeColor: 'bg-orange-500 text-white',
  },
]
