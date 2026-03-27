import { setRequestLocale } from 'next-intl/server'
import {
  BubbleChip,
  PhoneFrameMock,
  ProfileCard,
  SectionBadge,
} from '../_components/profile-boost-primitives'

const progressRows = [
  { left: 'Telegram Likes', right: '15k / 50k' },
  { left: 'Discount', right: '-50%' },
  { left: 'Total', right: '$5.50' },
]

export default async function PhoneEndpointPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className='mx-auto w-full max-w-md space-y-5 bg-gradient-to-b from-blue-50 to-white px-3 py-4'>
      <section className='rounded-2xl border border-blue-100 bg-white p-4 shadow-sm'>
        <SectionBadge label='Mobile First' />
        <h1 className='mt-3 text-3xl font-black leading-tight text-slate-900'>
          Buy numbers fast
          <br />
          in your phone flow
        </h1>
        <p className='mt-2 text-sm text-slate-600'>
          This page reproduces the Profile Boost mobile component rhythm with NumZero blue styling.
        </p>
        <div className='mt-3 flex flex-wrap gap-2'>
          <BubbleChip text='Fast order' />
          <BubbleChip text='Country selector' />
          <BubbleChip text='Recharge if needed' />
        </div>
      </section>

      <ProfileCard
        subtitle='SimpleUI'
        title='Easy to use'
        body='Track your order and complete verifications with compact mobile cards.'
        accent='#adfa1b'
      />

      <PhoneFrameMock heading='Your order' rows={progressRows} />

      <ProfileCard
        subtitle='SuperPack'
        title='Daily activation packs'
        body='Pick service bundles and keep steady activity for repetitive verification workflows.'
        accent='#1d4ed8'
      />

      <ProfileCard
        subtitle='DripFeed'
        title='Interval delivery mode'
        body='Run controlled flows and receive numbers in timed intervals for safer execution.'
        accent='#3b82f6'
      />

      <section className='rounded-2xl border border-blue-100 bg-white p-4'>
        <p className='text-sm font-semibold text-slate-900'>3-step activation flow</p>
        <div className='mt-3 space-y-2'>
          {[
            '1. Choose service',
            '2. Choose country',
            '3. Confirm payment and get number',
          ].map((item) => (
            <div
              key={item}
              className='rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-slate-700'
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <p className='pb-16 text-center text-xs text-slate-500'>
        Locale route: /{locale}/phone
      </p>
    </div>
  )
}
