import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { Search, Wallet, Bell } from 'lucide-react'
import {
  BubbleChip,
  PhoneFrameMock,
  ProfileCard,
  SectionBadge,
} from '../_components/profile-boost-primitives'

const serviceRows = [
  { left: 'WhatsApp - France', right: '3 credits' },
  { left: 'Telegram - UK', right: '2 credits' },
  { left: 'Google - US', right: '2 credits' },
  { left: 'Instagram - Germany', right: '4 credits' },
]

export default async function DesktopEndpointPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className='min-h-full bg-slate-50'>
      <div className='sticky top-0 z-20 border-b border-blue-100 bg-white/95 backdrop-blur'>
        <div className='mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6'>
          <Link href={`/${locale}/my-space`} className='text-lg font-black text-blue-600'>
            NumZero
          </Link>
          <div className='hidden flex-1 items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 md:flex'>
            <Search className='h-4 w-4 text-slate-400' />
            <span className='text-sm text-slate-500'>Search service or country...</span>
          </div>
          <div className='ml-auto flex items-center gap-2'>
            <button className='rounded-lg border border-blue-100 bg-white p-2 text-slate-600'>
              <Bell className='h-4 w-4' />
            </button>
            <button className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white'>
              <Wallet className='h-4 w-4' />
              5 Credits
            </button>
          </div>
        </div>
      </div>

      <div className='mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:grid-cols-[1.2fr_2fr] md:px-6'>
        <section className='space-y-4'>
          <SectionBadge label='Desktop Endpoint' />
          <h1 className='text-3xl font-black leading-tight text-slate-900'>
            VirtualSMS layout,
            <br />
            Profile Boost components
          </h1>
          <p className='text-sm text-slate-600'>
            This desktop endpoint follows the app-shell structure, while using the same card
            language and visual hierarchy you requested.
          </p>
          <div className='flex flex-wrap gap-2'>
            <BubbleChip text='145+ countries' />
            <BubbleChip text='700+ services' />
            <BubbleChip text='Physical SIM' />
            <BubbleChip text='Auto-refund flow' />
          </div>
          <PhoneFrameMock heading='Services / Price' rows={serviceRows.slice(0, 3)} />
        </section>

        <section className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <ProfileCard
              subtitle='Simple UI'
              title='Choose service then country'
              body='Desktop keeps dense layout while preserving the same card-style components used on phone.'
              accent='#adfa1b'
            />
            <ProfileCard
              subtitle='Fast Flow'
              title='Activate instantly'
              body='Select an item, open country selector, confirm payment, and receive number details.'
              accent='#1d4ed8'
            />
            <ProfileCard
              subtitle='Order Tracking'
              title='Repeat and monitor orders'
              body='Follow active numbers, statuses, and expiry windows with compact action cards.'
              accent='#3b82f6'
            />
            <ProfileCard
              subtitle='Wallet'
              title='Credit-based purchase UX'
              body='Insufficient-credit branch opens recharge flow before allowing activation.'
              accent='#60a5fa'
            />
          </div>
          <div className='rounded-xl border border-blue-100 bg-white p-4'>
            <p className='mb-3 text-sm font-semibold text-slate-900'>Popular Services</p>
            <div className='space-y-2'>
              {serviceRows.map((row) => (
                <div
                  key={row.left}
                  className='flex items-center justify-between rounded-lg border border-blue-100 px-3 py-2'
                >
                  <span className='text-sm text-slate-700'>{row.left}</span>
                  <span className='text-sm font-bold text-blue-700'>{row.right}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
