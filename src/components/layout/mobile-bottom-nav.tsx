'use client'

import { Link, useLocation } from '@tanstack/react-router'
import { MenuIcon, CloseIcon } from '@/components/landing/menu-icons'
import { useBottomNav } from './bottom-nav-store'
import { useCreatePaymentIntent, useWalletBalance } from '@/components/wallet/hooks'
import { StepTopUp } from '@/components/recharge/step-topup'
import { useCallback, useState } from 'react'
import { LogOut, LoaderCircle } from 'lucide-react'
import type { PaymentMethod } from '@/components/recharge/step-method'
import { authClient } from '#/lib/auth-client'
import { CiWallet } from 'react-icons/ci'

const NAV_ITEMS = [
  { path: '/my-space', label: 'Mon Espace' },
  { path: '/wallet', label: 'Portefeuille' },
  { path: '/account', label: 'Compte' },
  { path: '/wallet', label: 'Recharger' },
  { path: '/support', label: 'Support' },
] as const

function NavPanel({
  onNavigate,
  isAuthenticated,
}: {
  onNavigate: () => void
  isAuthenticated: boolean
}) {
  const { pathname } = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = '/'
          },
        },
      })
    } catch (error) {
      console.error('Logout failed', error)
      setIsLoggingOut(false)
    }
  }

  const handleLogin = async () => {
    window.location.href = '/my-space'
  }

  return (
    <div className="flex flex-col gap-[18px] px-5 pt-4 pb-3">
      <div className="flex flex-col w-full gap-2">
        {NAV_ITEMS.map(({ path, label }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/')
          return (
            <Link
              key={label}
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
      <div className="border-t border-[var(--line)]/40 pt-3 pb-1" />

      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 bg-transparent w-full no-underline cursor-pointer disabled:opacity-40"
        >
          {isLoggingOut ? (
            <LoaderCircle className="h-5 w-5 shrink-0 text-red-400 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5 shrink-0 text-red-400" />
          )}
          <h3 className="font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 text-red-400">
            Log Out
          </h3>
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-transparent w-full no-underline cursor-pointer"
        >
          <svg
            className="h-5 w-5 shrink-0 text-[var(--sea-ink)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <h3 className="font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 text-[var(--sea-ink)]">
            Connexion
          </h3>
        </button>
      )}
    </div>
  )
}

function RechargePanel({ topUpAmount }: { topUpAmount?: number | null }) {
  const createPayment = useCreatePaymentIntent()

  const handlePay = useCallback(
    async (amountXaf: number, phone: string, method: PaymentMethod, promoCode?: string) => {
      const session = await authClient.getSession()
      if (!session?.data) {
        await authClient.signIn.anonymous()
      }
      const userId = session.data.user.id

      const data = await createPayment.mutateAsync({
        amountCents: Math.round(amountXaf / 600 * 100),
        xafAmount: amountXaf,
        idempotencyKey: `${userId}_topup_${Date.now()}`,
        metadata: { phone, paymentMethod: method, promoCode },
      })
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    },
    [createPayment],
  )

  return (
    <div className="px-5 pt-4 pb-3">
      <StepTopUp
        initialAmount={Math.max(1500, topUpAmount ?? 1500)}
        onPay={handlePay}
        isPending={createPayment.isPending}
      />
    </div>
  )
}

function PricePanel() {
  const { panelProps, closePanel } = useBottomNav()
  const {
    displayPrice: initPrice,
    defaultPrice,
    onMaxPriceChange,
    serviceCount,
    freePrices,
  } = panelProps as Record<string, any>
  const [localPrice, setLocalPrice] = useState(initPrice)

  const priceTiers = !defaultPrice
    ? []
    : (() => {
        if (freePrices && Object.keys(freePrices).length > 0) {
          return Object.entries(freePrices)
            .map(([priceStr, qty]) => ({
              price: parseFloat(priceStr),
              label: `${qty} pcs`,
            }))
            .sort((a, b) => a.price - b.price)
        }
        const tiers = [{ price: defaultPrice, label: 'Max price' }]
        for (const mult of [0.65, 0.8, 1.0]) {
          const p = Math.round(defaultPrice * mult * 10000) / 10000
          if (p < defaultPrice) {
            tiers.push({
              price: p,
              label: `${Math.floor(serviceCount * (mult > 0.8 ? 0.4 : 0.15))} pcs`,
            })
          }
        }
        tiers.sort((a, b) => a.price - b.price)
        return tiers
      })()

  const formatPrice = (p: number) => (p < 1 ? p.toFixed(4) : p.toFixed(2))

  const selectPrice = (price: number) => {
    onMaxPriceChange(price)
    closePanel()
  }

  const handleWheelScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const itemHeight = 48
    const index = Math.round((container.scrollTop + 84) / itemHeight)
    const item = priceTiers[index]
    if (item && item.price !== localPrice) {
      setLocalPrice(item.price)
    }
  }

  return (
    <div className="px-5 pt-4 pb-3 space-y-4">
      <div className="text-center">
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider block">
          Choisir le prix
        </label>
        <p className="font-figtree text-white/40 text-[12px] mt-0.5">
          Plus le prix est élevé, plus vous avez de chances d'obtenir le numéro
        </p>
      </div>

      <div className="relative h-[220px] overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-12 -translate-y-1/2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0B0B0B] to-transparent z-20" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B0B] to-transparent z-20" />
        <div
          onScroll={handleWheelScroll}
          className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[84px]"
          style={{ perspective: '1000px' }}
        >
          {priceTiers.map((tier, i) => {
            const selected = localPrice === tier.price
            return (
              <button
                key={i}
                onClick={() => setLocalPrice(tier.price)}
                className={`snap-center h-12 w-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                  selected ? 'scale-110 text-white' : 'scale-90 text-white/40'
                }`}
                style={{
                  transform: selected ? 'scale(1.1)' : 'scale(.9) rotateX(20deg)',
                }}
              >
                <span className="font-figtree text-[18px] font-semibold">
                  ${formatPrice(tier.price)}
                </span>
                <span className="text-[11px] text-white/50">{tier.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-sm mx-auto">
        <label className="font-figtree text-white/65 text-[13px] font-semibold uppercase tracking-wider text-center block">
          Votre prix max
        </label>
        <div className="flex items-center justify-center gap-3 bg-white/5 rounded-[14px] px-4 py-2 mt-2">
          <button
            onClick={() => setLocalPrice(Math.max(0.01, Math.round((localPrice - 1) * 100) / 100))}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            −
          </button>
          <input
            type="text"
            value={`$${localPrice.toFixed(4)}`}
            onChange={(e) => {
              const val = parseFloat(e.target.value.replace('$', ''))
              if (!isNaN(val) && val > 0) setLocalPrice(val)
            }}
            className="font-figtree text-white text-[30px] font-medium tracking-[-0.04em] text-center bg-transparent border-none outline-none w-[160px] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            onClick={() => setLocalPrice(Math.round((localPrice + 1) * 100) / 100)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-[22px] font-medium cursor-pointer hover:bg-white/20 transition-colors"
          >
            +
          </button>
        </div>
        <svg
          className="mx-auto w-[80%] h-[6px] mt-1"
          viewBox="0 0 200 6"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,3 Q10,0 20,3 T40,3 T60,3 T80,3 T100,3 T120,3 T140,3 T160,3 T180,3 T200,3"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.25"
          />
        </svg>
        <button
          onClick={() => selectPrice(localPrice)}
          className="w-full mt-4 py-3 rounded-[14px] bg-[#F97316] font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] cursor-pointer hover:brightness-110 transition-all duration-200 anim-glow-pulse"
        >
          Confirmer le prix
        </button>
      </div>
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
    <div className="px-5 pt-4 pb-3 space-y-3">
      <h3 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
        Détails transaction
      </h3>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Libellé
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] text-right">
          {mvt.label}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Montant
        </span>
        <span
          className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${mvt.credit > 0 ? 'text-[#25D366]' : 'text-[var(--sea-ink)]'}`}
        >
          {mvt.credit > 0 ? '+' : '-'}${(mvt.credit || mvt.debit).toFixed(2)} USD
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          FCFA
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
          {mvt.amountXaf.toLocaleString('fr-FR')} FCFA
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Solde après
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
          ${mvt.soldeApres.toFixed(2)} USD
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Date
        </span>
        <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em]">
          {new Date(mvt.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
          Statut
        </span>
        <span
          className={`font-figtree text-[18px] font-medium tracking-[-0.04em] ${mvt.statut === 'validee' ? 'text-[#25D366]' : mvt.statut === 'annulee' ? 'text-red-500' : 'text-yellow-500'}`}
        >
          {mvt.statut === 'validee'
            ? 'Validée'
            : mvt.statut === 'annulee'
              ? 'Annulée'
              : 'En attente'}
        </span>
      </div>
    </div>
  )
}

export function MobileBottomNav() {
  const { data: session } = authClient.useSession()
  const isAuthenticated = !!session
  const { isOpen, activePanel, panelProps, closePanel, openPanel, toggleNav } = useBottomNav()
  const { pathname } = useLocation()
  const { data: balanceData } = useWalletBalance()
  const balanceUsd = balanceData?.balanceUsd ?? 0

  const activeLabel = NAV_ITEMS.find(
    ({ path }) => pathname === path || pathname.startsWith(path + '/'),
  )?.label

  return (
    <>
      <div
        className={`fixed left-3 bottom-3 z-50 md:hidden transition-all duration-500 ease-out ${
          isOpen ? '-translate-x-full opacity-0' : ''
        }`}
      >
        {activeLabel && (
          <h3 className="font-figtree font-medium text-[30px] tracking-[-0.04em] leading-[1.25] text-left m-0 text-[#25D366]">
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
              {isAuthenticated ? (
                <Link
                  to="/wallet"
                  onClick={closePanel}
                  className="flex items-center justify-between flex-1 mr-3 min-w-0 no-underline"
                >
                  <span className="text-[var(--sea-ink)] text-[18px] font-thin tabular-nums tracking-tight">
                    $
                    {balanceUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider ml-3 shrink-0">
                    USD
                  </span>
                </Link>
              ) : (
                <div className="flex-1 mr-3" />
              )}

              <div className="flex items-center gap-2 shrink-0">
                <span className="h-4 w-px bg-[var(--line)]/40" />
                <button
                  onClick={() => openPanel('recharge')}
                  className="text-xl leading-none font-bold flex items-center justify-center w-[28px] h-[28px] text-[var(--sea-ink)] bg-transparent border-none cursor-pointer"
                >
                  <CiWallet className="text-green-600 stroke-1 text-sm" />
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
              {activePanel === 'nav' && (
                <NavPanel onNavigate={closePanel} isAuthenticated={isAuthenticated} />
              )}
              {activePanel === 'recharge' && <RechargePanel />}
              {activePanel === 'topup' && (
                <RechargePanel topUpAmount={panelProps.amount as number} />
              )}
              {activePanel === 'choosePrice' && <PricePanel />}
              {activePanel === 'details' && (
                <DetailsPanel mvt={panelProps.transaction as DetailsMvt} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
