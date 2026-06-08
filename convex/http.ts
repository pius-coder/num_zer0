import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { authComponent, createAuth } from './auth'
import { api, internal } from './_generated/api'

const http = httpRouter()

authComponent.registerRoutesLazy(http, createAuth, {
  cors: true,
})

http.route({
  path: '/fapshi-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get('x-wh-secret')
    if (secret !== process.env.FAPSHI_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const event: string = body.event || ''
    const transId: string = body.transId || ''
    const externalId: string = body.externalId || ''
    const status: string = body.status || ''

    const pi = await ctx.runQuery(api.orders.getPaymentIntentByGateway, {
      gatewayTransactionId: transId,
    })

    const isSuccess = event === 'successful' || status === 'SUCCESSFUL'
    const isFailure = event === 'failed' || event === 'expired' || status === 'FAILED' || status === 'EXPIRED'

    if (pi) {
      if (isSuccess) {
        await ctx.runMutation(internal.payment_intents.internalConfirmPaymentIntent, {
          paymentIntentId: pi._id,
        })
      } else if (isFailure) {
        await ctx.runMutation(internal.payment_intents.internalMarkPaymentFailed, {
          paymentIntentId: pi._id,
          failureReason: `fapshi_${event || status || 'failed'}`,
        })
      }
    } else {
      if (isSuccess) {
        await ctx.runMutation(api.purchases.handlePaymentSuccess, {
          transId,
          externalId,
        })
      }

      if (isFailure) {
        await ctx.runMutation(api.purchases.handlePaymentFailure, {
          transId,
          externalId,
          reason: `fapshi_${event || status || 'failed'}`,
        })
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

export default http
