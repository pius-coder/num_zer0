'use client'

import { Link, useLocation } from '@tanstack/react-router'
import { MenuIcon, CloseIcon } from '@/components/landing/menu-icons'
import { useBottomNav } from './bottom-nav-store'
import { useInitiateDirectPay } from '@/components/purchases/hooks'
import { StepTopUp } from '@/components/recharge/step-topup'
import { useCallback } from 'react'
import type { PaymentMethod } from '@/components/recharge/step-method'
import { authClient } from '#/lib/auth-client'
import { useBalance } from '@/components/purchases/hooks'

const NAV_ITEMS = [
  { path: '/my-space', label: 'Mon Espace' },
  { path: '/wallet', label: 'Portefeuille' },
  { path: '/account', label: 'Compte' },
  { path: '/recharge', label: 'Recharger' },
  { path: '/support', label: 'Support' },
] as const

function NavPanel({ onNavigate }: { onNavigate: () => void }) {
  const { pathname } = useLocation()

  return (
    <div className='flex flex-col gap-[18px] px-5 pt-4 pb-3'>
      <div className='flex flex-col w-full gap-2'>
        {NAV_ITEMS.map(({ path, label }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/')
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavigate}
              className="block bg-transparent w-full no-underline"
            >
              <h3
                className={`font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 ${
                  isActive ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'
                }`}
              >
                {label}
              </h3>
            </Link>
          )
        })}
      </div>
      <div className='border-t border-[var(--line)]/40 pt-3 pb-1' />
    </div>
  )
}

function RechargePanel({ topUpAmount }: { topUpAmount?: number | null }) {
  const directPayMutation = useInitiateDirectPay()

  const handlePay = useCallback(
    async (amount: number, phone: string, method: PaymentMethod, promoCode?: string) => {
      const session = await authClient.getSession()
      if (!session?.data) {
        await authClient.signIn.anonymous()
      }

      const data = await directPayMutation.mutateAsync({
        amount,
        phone,
        medium: method === 'mtn_momo' ? 'MTN Mobile Money' : 'Orange Money',
        promoCode,
      })
      if (data.link) window.location.href = data.link
    },
    [directPayMutation]
  )

  return (
    <div className='px-5 pt-4 pb-3'>
      <StepTopUp
        initialAmount={Math.max(1500, topUpAmount ?? 1500)}
        onPay={handlePay}
        isPending={directPayMutation.isPending}
      />
    </div>
  )
}

interface DetailsMvt {
  label: string
  date: string
  credit: number
  debit: number
  amountXaf: number
  soldeApres: number
  statut: string
}

function DetailsPanel({ mvt }: { mvt: DetailsMvt }) {
  return (
    <div className='px-5 pt-4 pb-3 space-y-3'>
      <h3 className='font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]'>
        Détails transaction
      </h3>
      <div className='flex justify-between'>
        <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Libellé</span>
        <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] text-right'>
          {mvt.label}
        </span>
      </div>
      <div className='flex justify-between'>
        <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Montant</span>
        <span className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${mvt.credit > 0 ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'}`}>
          {mvt.credit > 0 ? '+' : '-'}${(mvt.credit || mvt.debit).toFixed(2)} USD
        </span>
      </div>
      <div className='flex justify-between'>
        <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>FCFA</span>
        <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>
          {mvt.amountXaf.toLocaleString('fr-FR')} FCFA
        </span>
      </div>
      <div className='flex justify-between'>
        <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Solde après</span>
        <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>
          ${mvt.soldeApres.toFixed(2)} USD
        </span>
      </div>
      <div className='flex justify-between'>
        <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Date</span>
        <span className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]'>
          {new Date(mvt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className='flex justify-between'>
        <span className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>Statut</span>
        <span className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${mvt.statut === 'validee' ? 'text-[#25D366]' : mvt.statut === 'annulee' ? 'text-red-500' : 'text-yellow-500'}`}>
          {mvt.statut === 'validee' ? 'Validée' : mvt.statut === 'annulee' ? 'Annulée' : 'En attente'}
        </span>
      </div>
    </div>
  )
}

export function MobileBottomNav() {
  const { isOpen, activePanel, panelProps, closePanel, openPanel, toggleNav } = useBottomNav()
  const { pathname } = useLocation()
  const { data: balanceData } = useBalance()
  const balanceUsd = balanceData?.balanceUsd ?? 0

  const activeLabel = NAV_ITEMS.find(
    ({ path }) => pathname === path || pathname.startsWith(path + '/')
  )?.label

  return (
    <>
      <div
        className={`fixed left-3 bottom-3 z-50 md:hidden transition-all duration-500 ease-out ${
          isOpen ? '-translate-x-full opacity-0' : ''
        }`}
      >
        {activeLabel && (
          <h3 className='font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 text-[#25D366]'>
            {activeLabel}
          </h3>
        )}
      </div>

      <div className="fixed right-3 bottom-3 z-50 md:hidden flex flex-col items-end">
        <div
          className="relative inline-flex w-fit max-w-[92vw] overflow-hidden rounded-[18px] transition-all duration-500 ease-out"
          style={{
            maxHeight: isOpen ? '560px' : '52px',
          }}
        >
          <div
            className="absolute inset-0 rounded-[18px] bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 ring-1 ring-[var(--line)]/30"
            style={{
              boxShadow:
                '0 26px 75px rgba(0,0,0,0.42), 0 10px 28px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.03), inset 0 1px 0 var(--inset-glint), inset 1px 0 0 rgba(255,255,255,0.015), inset -1px 0 0 rgba(0,0,0,0.22), inset 0 -1px 0 rgba(0,0,0,0.24)',
            }}
          />
          <div className="relative flex flex-col-reverse">
            <div className="flex items-center justify-between px-3 py-[10px]">
              <Link
                to="/wallet"
                onClick={closePanel}
                className="flex items-center justify-between flex-1 mr-3 min-w-0 no-underline"
              >
                <span className="text-[var(--sea-ink)] text-[18px] font-thin tabular-nums tracking-tight">
                  ${balanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider ml-3 shrink-0">
                  USD
                </span>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                <span className="h-4 w-px bg-[var(--line)]/40" />
                <button
                  onClick={() => openPanel('recharge')}
                  className="text-xl leading-none font-bold flex items-center justify-center w-[28px] h-[28px] text-[var(--sea-ink)] bg-transparent border-none cursor-pointer"
                >
                  +
                </button>

                <button
                  onClick={isOpen ? closePanel : toggleNav}
                  className="h-[30px] w-[30px] p-0 bg-transparent border-none cursor-pointer shrink-0 text-[var(--sea-ink)]"
                  aria-label={isOpen ? 'Fermer' : 'Menu'}
                >
                  {isOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </div>
            </div>

            <div
              className="transition-all duration-500 ease-out"
              style={{
                maxHeight: isOpen ? '500px' : '0px',
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
              }}
            >
              {activePanel === 'nav' && <NavPanel onNavigate={closePanel} />}
              {activePanel === 'recharge' && <RechargePanel />}
              {activePanel === 'topup' && <RechargePanel topUpAmount={panelProps.amount as number} />}
              {activePanel === 'details' && <DetailsPanel mvt={panelProps.transaction as DetailsMvt} />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
