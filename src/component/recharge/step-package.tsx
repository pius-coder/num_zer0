'use client'

import { useMemo } from 'react'
import type { CreditPackage } from '@/type/credit'
import { Check, Zap, Star } from 'lucide-react'

interface StepPackageProps {
  packages: CreditPackage[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function StepPackage({ packages, selectedId, onSelect }: StepPackageProps) {
  const bestValueId = useMemo(() => {
    if (packages.length === 0) return undefined
    return packages.reduce((best, pkg) => {
      const bestPkg = packages.find((p) => p.id === best)
      if (!bestPkg) return pkg.id
      return pkg.priceXaf / pkg.credits < bestPkg.priceXaf / bestPkg.credits ? pkg.id : best
    }, packages[0].id)
  }, [packages])

  return (
    <div className='space-y-5'>
      <div className='text-center space-y-1'>
        <h3 className='text-lg font-extrabold tracking-tight font-[family-name:var(--font-bricolage-grotesque)]'>
          Quel forfait vous convient ?
        </h3>
        <p className='text-xs text-muted-foreground'>
          Plus le forfait est gros, plus le prix par crédit baisse
        </p>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {packages.map((pkg) => {
          const bonus = Math.floor((pkg.credits * pkg.bonusPct) / 100)
          const active = selectedId === pkg.id
          const isBestValue = pkg.id === bestValueId
          const unitPrice = (pkg.priceXaf / pkg.credits).toFixed(1)

          return (
            <button
              key={pkg.id}
              type='button'
              onClick={() => onSelect(pkg.id)}
              className={`
                group relative overflow-hidden rounded-2xl border-2 p-4 text-left
                transition-all duration-200 ease-out
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                ${
                  active
                    ? 'border-primary bg-gradient-to-b from-primary/10 to-primary/3 shadow-xl shadow-primary/15 scale-[1.03]'
                    : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
                }
              `}
            >
              {isBestValue && !bonus && (
                <span className='absolute -right-0.5 -top-0.5 z-10 flex items-center gap-0.5 rounded-bl-xl rounded-tr-2xl bg-amber-500 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white'>
                  <Star className='h-2.5 w-2.5 fill-current' />
                  Best
                </span>
              )}

              {bonus > 0 && (
                <span
                  className={`
                    absolute -right-0.5 -top-0.5 z-10 flex items-center gap-0.5
                    rounded-bl-xl rounded-tr-2xl px-2 py-1
                    font-[family-name:var(--font-geist-mono)]
                    text-[9px] font-bold uppercase tracking-wider
                    ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/90 text-primary-foreground'
                    }
                  `}
                >
                  <Zap className='h-2.5 w-2.5 fill-current' />+{bonus}
                </span>
              )}

              <div
                className={`
                  absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center
                  rounded-full transition-all duration-200
                  ${active ? 'bg-primary text-primary-foreground scale-100' : 'bg-muted scale-0'}
                `}
              >
                <Check className='h-3 w-3' strokeWidth={3} />
              </div>

              <div className='flex flex-col gap-2.5'>
                <p
                  className={`
                    text-[10px] font-bold uppercase tracking-[0.15em] truncate
                    font-[family-name:var(--font-bricolage-grotesque)]
                    ${active ? 'text-primary' : 'text-muted-foreground'}
                  `}
                >
                  {pkg.name}
                </p>

                <div className='flex items-baseline gap-1'>
                  <span
                    className={`
                      text-3xl font-black leading-none tracking-tighter
                      font-[family-name:var(--font-geist-mono)]
                      ${active ? 'text-primary' : 'text-foreground'}
                    `}
                  >
                    {pkg.credits >= 1000
                      ? `${(pkg.credits / 1000).toFixed(pkg.credits % 1000 === 0 ? 0 : 1)}k`
                      : pkg.credits}
                  </span>
                  <span className='text-[9px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    cr
                  </span>
                </div>

                <div
                  className={`h-px w-full transition-colors ${
                    active ? 'bg-primary/20' : 'bg-border group-hover:bg-primary/10'
                  }`}
                />

                <div>
                  <p className='font-[family-name:var(--font-inter)]'>
                    <span className='text-lg font-extrabold leading-none text-foreground'>
                      {pkg.priceXaf.toLocaleString('fr-FR')}
                    </span>
                    <span className='ml-1 text-[9px] font-medium text-muted-foreground'>FCFA</span>
                  </p>
                  <p className='mt-0.5 text-[9px] font-medium text-muted-foreground/50 font-[family-name:var(--font-geist-mono)]'>
                    {unitPrice} FCFA/cr
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
