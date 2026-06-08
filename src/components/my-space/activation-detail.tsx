'use client'

import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SERVICES, COUNTRIES } from '@/components/services/data'
import type { SmsActivation } from '#/type/sms_activation'
import { isActiveStatus } from './utils'
import { STATUS_LABELS, STATUS_COLORS, FLAG_BASE } from './constants'
import { TimelineLine } from './timeline-line'
import { useCompleteActivation, useCancelActivation, useRequestAnotherSms } from '@/components/purchases/hooks'
import { useWalletBalance } from '@/components/wallet/hooks'
import { PurchasePanel } from './purchase-panel'
import type { Id } from '../../../convex/_generated/dataModel'

interface ActivationPageProps {
  activation: SmsActivation
}

export function ActivationPage({ activation }: ActivationPageProps) {
  const navigate = useNavigate()
  const { data: balanceData } = useWalletBalance()
  const balanceUsd = balanceData?.balanceUsd ?? 0
  const completeActivation = useCompleteActivation()
  const cancelActivation = useCancelActivation()
  const requestSms = useRequestAnotherSms()
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const serviceObj = SERVICES.find((s) => s.id === activation.service)
  const countryInfo = COUNTRIES.find((c) => c.iso === activation.country)
  const serviceName = serviceObj?.name ?? activation.service
  const isActive = isActiveStatus(activation.status)
  const isTerminalError = activation.status === 'no_numbers' || activation.status === 'expired' || activation.status === 'cancelled' || activation.status === 'max_price_too_low'

  const errorContextMsg = (() => {
    if (activation.errorMessage === "Annulé par l'utilisateur") return 'Vous avez annulé cette activation. Vous pouvez réessayer ci-dessous.'
    if (activation.errorMessage === 'Annulé par le fournisseur') return 'Le fournisseur a annulé cette activation. Aucun numéro disponible pour cet opérateur.'
    switch (activation.status) {
      case 'no_numbers': return 'Aucun numéro disponible pour ce service en ce moment.'
      case 'expired': return "Le délai d'activation a expiré. Vous pouvez réessayer ci-dessous."
      case 'max_price_too_low': return 'Le prix proposé est trop bas pour ce service.'
      case 'cancelled': return 'Cette activation a été annulée.'
      default: return "Cette activation n'a pas pu aboutir."
    }
  })()

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setActionError(null)
    setPendingAction(action)
    try { await fn() }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Erreur') }
    finally { setPendingAction(null) }
  }

  return (
    <div className="mx-auto max-w-lg px-3 py-8 md:px-6 md:py-12">
      <button onClick={() => window.history.back()} className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider mb-6 cursor-pointer">&larr; Retour</button>
      <div className="space-y-6">
        {countryInfo?.code ? (
          <img src={`${FLAG_BASE}/36x27/${countryInfo.code}.png`} width="36" height="27" alt="" className="mx-auto block" loading="lazy" />
        ) : (
          <span className="text-4xl mb-2 block">{'🌍'}</span>
        )}
        <h2 className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25] text-center">{serviceName}</h2>
        <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider text-center">{countryInfo?.name ?? activation.country}</p>

        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isActive && <span className="inline-block w-3 h-3 rounded-full bg-amber-500 animate-pulse" />}
            <span className={`font-figtree text-[22px] font-medium tracking-[-0.04em] ${STATUS_COLORS[activation.status]}`}>{STATUS_LABELS[activation.status]}</span>
          </div>
          {(activation.status === 'awaiting_sms' || activation.status === 'sms_received') && activation.phoneNumber && (
            <p className="font-figtree text-white text-[24px] font-medium tracking-[-0.04em] mt-2">{activation.phoneNumber}</p>
          )}
          {activation.status === 'sms_received' && activation.smsCode && (
            <div className="mt-4 inline-block px-6 py-3 rounded-lg bg-white/5">
              <p className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider mb-1">Code SMS</p>
              <p className="font-figtree text-white text-[36px] font-medium tracking-[0.08em]">{activation.smsCode}</p>
            </div>
          )}
          {activation.errorMessage && !isActive && (
            <p className="font-figtree text-red-500 text-[15px] font-semibold mt-4">{activation.errorMessage}</p>
          )}
        </div>

        {isTerminalError && serviceObj && countryInfo ? (
          <div className="space-y-4">
            <p className="font-figtree text-white/65 text-[15px] font-semibold text-center">{errorContextMsg}</p>
            <PurchasePanel service={serviceObj} country={countryInfo}
              onActivate={(activationId) => navigate({ to: `/my-space/activations/${activationId}` })}
              onRecharge={() => navigate({ to: '/recharge' })} />
          </div>
        ) : !isTerminalError && (
          <>
            <div className="space-y-3 text-sm">
              <TimelineLine done={!!activation.phoneNumber && activation.status !== 'awaiting_number'} active={!activation.phoneNumber || activation.status === 'awaiting_number'} label="Numéro attribué" value={activation.phoneNumber ?? 'En attente…'} />
              <TimelineLine done={activation.status === 'sms_received' || activation.status === 'completed'} active={activation.status === 'awaiting_sms' || activation.status === 'sms_received'} label="SMS reçu" value={activation.smsCode ?? undefined} />
              <TimelineLine done={activation.status === 'completed'} active={activation.status === 'completed'} label="Activation terminée" />
            </div>

            {isActive && (
              <div className="flex flex-col gap-3">
                {activation.status === 'sms_received' && (
                  <button onClick={() => handleAction('complete', () => completeActivation.mutateAsync({ activationId: activation._id as Id<'activations'> }))}
                    disabled={pendingAction !== null}
                    className="w-full font-figtree text-white text-[18px] font-semibold tracking-[-0.04em] py-3 rounded-[14px] bg-[#F97316] cursor-pointer disabled:opacity-40 hover:brightness-110 transition-all">
                    {pendingAction === 'complete' ? 'Traitement…' : 'Confirmer le code'}
                  </button>
                )}
                {activation.status === 'sms_received' && activation.canGetAnotherSms && (
                  <button onClick={() => handleAction('resend', () => requestSms.mutateAsync({ activationId: activation._id as Id<'activations'> }))}
                    disabled={pendingAction !== null}
                    className="w-full font-figtree text-white/65 text-[18px] font-medium tracking-[-0.04em] py-3 rounded-[14px] border border-white/10 cursor-pointer disabled:opacity-40 hover:bg-white/5 transition-all">
                    {pendingAction === 'resend' ? 'Traitement…' : 'Redemander un SMS'}
                  </button>
                )}
                {activation.status !== 'completed' && (
                  <button onClick={() => handleAction('cancel', () => cancelActivation.mutateAsync({ activationId: activation._id as Id<'activations'> }))}
                    disabled={pendingAction !== null}
                    className="w-full font-figtree text-red-500 text-[18px] font-medium tracking-[-0.04em] py-3 cursor-pointer disabled:opacity-40 hover:text-red-400 transition-all">
                    {pendingAction === 'cancel' ? 'Traitement…' : 'Annuler'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {actionError && <p className="text-center font-figtree text-red-500 text-[15px] font-semibold">{actionError}</p>}
      </div>
    </div>
  )
}
