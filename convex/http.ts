import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { authComponent, createAuth } from './auth'
import { api } from './_generated/api'

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

    if (event === 'successful' || status === 'SUCCESSFUL') {
      await ctx.runMutation(api.purchases.handlePaymentSuccess, {
        transId,
        externalId,
      })
    }

    if (event === 'failed' || event === 'expired' || status === 'FAILED' || status === 'EXPIRED') {
      await ctx.runMutation(api.purchases.handlePaymentFailure, {
        transId,
        externalId,
        reason: `fapshi_${event || status || 'failed'}`,
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

export default http
