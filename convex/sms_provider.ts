import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { isoToNumeric } from './sms_countries'

const API_BASE = 'https://sms-online.pro/stubs/handler_api.php'
const POLL_INTERVAL_MS = 3000
const ACTIVATION_TIMEOUT_MS = 25 * 60 * 1000

async function smsProGet(params: Record<string, string>): Promise<string> {
  const apiKey = process.env.SMSONLINEPRO_API_KEY
  if (!apiKey) throw new Error('SMSONLINEPRO_API_KEY not configured')
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', apiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  return res.text()
}

async function smsProGetJson(params: Record<string, string>): Promise<any> {
  const text = await smsProGet(params)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const internalUpdateActivation = internalMutation({
  args: {
    activationId: v.id('activations'),
    patch: v.object({
      status: v.optional(
        v.union(
          v.literal('awaiting_number'),
          v.literal('awaiting_sms'),
          v.literal('sms_received'),
          v.literal('completed'),
          v.literal('cancelled'),
          v.literal('expired'),
          v.literal('no_numbers'),
          v.literal('max_price_too_low'),
        ),
      ),
      phoneNumber: v.optional(v.string()),
      providerId: v.optional(v.number()),
      smsCode: v.optional(v.string()),
      providerCost: v.optional(v.number()),
      canGetAnotherSms: v.optional(v.boolean()),
      rentEndTime: v.optional(v.number()),
      rentTimeHours: v.optional(v.number()),
      rentProviderId: v.optional(v.number()),
      rentEndDate: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.activationId, args.patch)
  },
})

export const internalGetActivation = internalQuery({
  args: { activationId: v.id('activations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activationId)
  },
})

export const pollActivation = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms_provider.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation) return

    if (['completed', 'cancelled', 'expired', 'sms_received'].includes(activation.status)) {
      return
    }

    if (Date.now() - activation.createdAt > ACTIVATION_TIMEOUT_MS) {
      await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { status: 'expired', updatedAt: Date.now() },
      })
      await ctx.runMutation(internal.escrows.internalRefundEscrow, {
        activationId: args.activationId,
      })
      return
    }

    try {
      if (activation.status === 'awaiting_number') {
        const numericCountry = isoToNumeric(activation.country)
        if (!numericCountry) throw new Error(`Invalid country: ${activation.country}`)

        const params: Record<string, string> = {
          action: 'getNumberV2',
          service: activation.service,
          country: String(numericCountry),
        }
        if (activation.maxPrice > 0) params.maxPrice = String(activation.maxPrice)
        if (activation.operator) params.operator = activation.operator

        const response = await smsProGetJson(params)

        if (response.activationId) {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: {
              status: 'awaiting_sms',
              providerId: Number(response.activationId),
              phoneNumber: String(response.phoneNumber),
              providerCost: response.activationCost ? Number(response.activationCost) : undefined,
              canGetAnotherSms: response.canGetAnotherSms === true,
              rentEndTime: response.activationTime
                ? Number(response.activationTime) * 1000 + 20 * 60 * 1000
                : undefined,
              updatedAt: Date.now(),
            },
          })
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
            activationId: args.activationId,
          })
        } else if (response === 'NO_NUMBERS') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'no_numbers', errorMessage: 'Aucun numéro disponible', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        } else if (typeof response === 'string' && response.startsWith('WRONG_MAX_PRICE:')) {
          const minPrice = Number(response.split(':')[1])
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'max_price_too_low', errorMessage: `Prix minimum: ${minPrice} USD`, updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        } else if (response === 'NO_BALANCE') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Service temporairement indisponible (solde fournisseur épuisé)', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        } else if (response === 'BAD_KEY') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Erreur de configuration API', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        }
      } else if (activation.status === 'awaiting_sms') {
        if (!activation.providerId) return

        if (activation.rentEndTime && Date.now() > activation.rentEndTime) {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Le numéro a expiré', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
          return
        }

        const response = await smsProGet({
          action: 'getStatus',
          id: String(activation.providerId),
        })

        if (response === 'STATUS_WAIT_CODE') {
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
            activationId: args.activationId,
          })
        } else if (typeof response === 'string' && response.startsWith('STATUS_OK:')) {
          const code = response.split(':')[1]
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'sms_received', smsCode: code, updatedAt: Date.now() },
          })
        } else if (typeof response === 'string' && response.startsWith('STATUS_WAIT_RETRY:')) {
          const code = response.split(':')[1]
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'sms_received', smsCode: code, updatedAt: Date.now() },
          })
        } else if (response === 'STATUS_CANCEL') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'cancelled', errorMessage: 'Annulé par le fournisseur', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { errorMessage: message, updatedAt: Date.now() },
      })
      await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
        activationId: args.activationId,
      })
    }
  },
})

export const pollRentalActivation = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms_provider.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation) return

    if (['completed', 'cancelled', 'expired', 'sms_received'].includes(activation.status)) {
      return
    }

    if (Date.now() - activation.createdAt > ACTIVATION_TIMEOUT_MS) {
      await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { status: 'expired', updatedAt: Date.now() },
      })
      await ctx.runMutation(internal.escrows.internalRefundEscrow, {
        activationId: args.activationId,
      })
      return
    }

    try {
      if (activation.status === 'awaiting_number') {
        const numericCountry = isoToNumeric(activation.country)
        if (!numericCountry) throw new Error(`Invalid country: ${activation.country}`)

        const apiKey = process.env.SMSONLINEPRO_API_KEY
        if (!apiKey) throw new Error('API key not configured')

        const url = new URL(API_BASE)
        url.searchParams.set('api_key', apiKey)
        url.searchParams.set('action', 'getRentNumber')
        url.searchParams.set('service', activation.service)
        url.searchParams.set('country', String(numericCountry))
        url.searchParams.set('rent_time', String(activation.rentTimeHours ?? 2))
        if (activation.operator) url.searchParams.set('operator', activation.operator)

        const res = await fetch(url.toString())
        const text = await res.text()
        const data = JSON.parse(text)

        if (data.status === 'success' && data.phone) {
          const rentEndMs = data.phone.endDate
            ? new Date(data.phone.endDate).getTime()
            : Date.now() + (activation.rentTimeHours ?? 2) * 60 * 60 * 1000

          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: {
              status: 'awaiting_sms',
              phoneNumber: String(data.phone.number),
              rentProviderId: Number(data.phone.id),
              rentEndDate: String(data.phone.endDate),
              rentEndTime: rentEndMs,
              providerCost: activation.maxPrice,
              updatedAt: Date.now(),
            },
          })
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollRentalActivation, {
            activationId: args.activationId,
          })
        } else if (data.status === 'error' && data.message === 'NO_NUMBERS') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'no_numbers', errorMessage: 'Aucun numéro de location disponible', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        } else if (data.status === 'error' && data.message === 'NO_BALANCE') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Service temporairement indisponible', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        } else {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'no_numbers', errorMessage: data.message ?? 'Erreur inconnue', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        }
      } else if (activation.status === 'awaiting_sms') {
        if (!activation.rentProviderId) return

        if (activation.rentEndTime && Date.now() > activation.rentEndTime) {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'completed', updatedAt: Date.now() },
          })
          return
        }

        const apiKey = process.env.SMSONLINEPRO_API_KEY
        if (!apiKey) return

        const url = new URL(API_BASE)
        url.searchParams.set('api_key', apiKey)
        url.searchParams.set('action', 'getRentStatus')
        url.searchParams.set('id', String(activation.rentProviderId))

        const res = await fetch(url.toString())
        const text = await res.text()
        const data = JSON.parse(text)

        if (data.status === 'success') {
          const values = data.values
          if (values && Object.keys(values).length > 0) {
            const smsItems = Object.values(values) as Array<{ text: string }>
            const lastSms = smsItems[smsItems.length - 1]
            const code = lastSms?.text ?? ''

            await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
              activationId: args.activationId,
              patch: {
                status: 'sms_received',
                smsCode: code,
                updatedAt: Date.now(),
              },
            })
          } else {
            await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollRentalActivation, {
              activationId: args.activationId,
            })
          }
        } else if (data.status === 'error' && data.message === 'STATUS_WAIT_CODE') {
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollRentalActivation, {
            activationId: args.activationId,
          })
        } else if (data.status === 'error' && data.message === 'STATUS_CANCEL') {
          await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'cancelled', errorMessage: 'Location annulée', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: args.activationId })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { errorMessage: message, updatedAt: Date.now() },
      })
      await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollRentalActivation, {
        activationId: args.activationId,
      })
    }
  },
})

export const completeActivationAction = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms_provider.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation || !activation.providerId) return

    const response = await smsProGet({
      action: 'setStatus',
      id: String(activation.providerId),
      status: '6',
    })

    if (response === 'BAD_KEY') {
      await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { errorMessage: 'Erreur de configuration API', updatedAt: Date.now() },
      })
      return
    }

    await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
      activationId: args.activationId,
      patch: { status: 'completed', updatedAt: Date.now() },
    })

    await ctx.runMutation(internal.escrows.internalReleaseEscrow, {
      activationId: args.activationId,
      providerCostCents: activation.providerCost
        ? Math.round(activation.providerCost * 100)
        : undefined,
    })
  },
})

export const completeRentalAction = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms_provider.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation || !activation.rentProviderId) return

    try {
      const apiKey = process.env.SMSONLINEPRO_API_KEY
      if (!apiKey) return
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'setRentStatus')
      url.searchParams.set('id', String(activation.rentProviderId))
      url.searchParams.set('status', '1')
      await fetch(url.toString())
    } catch {
      // best effort
    }

    await ctx.runMutation(internal.sms_provider.internalUpdateActivation, {
      activationId: args.activationId,
      patch: { status: 'completed', updatedAt: Date.now() },
    })

    await ctx.runMutation(internal.escrows.internalReleaseEscrow, {
      activationId: args.activationId,
      providerCostCents: activation.providerCost
        ? Math.round(activation.providerCost * 100)
        : undefined,
    })
  },
})

export const resendSmsAction = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms_provider.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation || !activation.providerId) return

    try {
      await smsProGet({
        action: 'setStatus',
        id: String(activation.providerId),
        status: '3',
      })
    } catch {
      return
    }

    await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms_provider.pollActivation, {
      activationId: args.activationId,
    })
  },
})

export const cancelActivationAction = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms_provider.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation) return

    if (activation.rentProviderId) {
      try {
        const apiKey = process.env.SMSONLINEPRO_API_KEY
        if (!apiKey) return
        const url = new URL(API_BASE)
        url.searchParams.set('api_key', apiKey)
        url.searchParams.set('action', 'setRentStatus')
        url.searchParams.set('id', String(activation.rentProviderId))
        url.searchParams.set('status', '2')
        await fetch(url.toString())
      } catch {
        // best effort
      }
    } else if (activation.providerId) {
      try {
        await smsProGet({
          action: 'setStatus',
          id: String(activation.providerId),
          status: '8',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('EARLY_CANCEL')) {
          await ctx.scheduler.runAfter(120_000, internal.sms_provider.pollActivation, {
            activationId: args.activationId,
          })
        }
      }
    }
  },
})
