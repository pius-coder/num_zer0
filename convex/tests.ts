import { mutation } from './_generated/server'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`)
}

export const testWallet = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error('Unauthenticated')
      const userId = identity.subject

      await ctx.runMutation(internal.wallet.internalCreditWallet, {
        userId, amountCents: 1000,
        referenceType: 'admin' as const, referenceId: `credit_${Date.now()}`, description: 'Test credit',
      })

      const afterCredit = await ctx.runQuery(api.wallet.getBalance, {}) as any
      assert(afterCredit.balanceCents === 1000, `Balance should be 1000, got ${afterCredit.balanceCents}`)

      await ctx.runMutation(internal.wallet.internalDebitWallet, {
        userId, amountCents: 400,
        referenceType: 'admin' as const, referenceId: `debit_${Date.now()}`, description: 'Test debit',
      })

      const afterDebit = await ctx.runQuery(api.wallet.getBalance, {}) as any
      assert(afterDebit.balanceCents === 600, `Balance should be 600, got ${afterDebit.balanceCents}`)

      const ledger = await ctx.runQuery(api.wallet.getLedger, { numItems: 50 }) as any[]
      assert(ledger.length >= 2, `Ledger should have 2+ entries, got ${ledger.length}`)

      try {
        await ctx.runMutation(internal.wallet.internalDebitWallet, {
          userId, amountCents: 999999999,
          referenceType: 'admin' as const, referenceId: 'test_insufficient', description: 'Should fail',
        })
        assert(false, 'Debit with insufficient balance should throw')
      } catch (e: any) {
        assert(e.message?.includes('Insufficient') || e.message?.includes('insufficient'),
          `Should throw insufficiency error, got: ${e.message}`)
      }

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },
})

export const testPaymentIntents = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error('Unauthenticated')
      const userId = identity.subject

      const piId1 = await ctx.runMutation(internal.payment_intents.internalCreatePaymentIntent, {
        userId, amountCents: 2000, xafAmount: 2000 * 600, xafRate: 600,
        idempotencyKey: `test_idemp_${Date.now()}`,
        metadata: { paymentMethod: 'test' },
      }) as Id<'payment_intents'>

      const pi = await ctx.runQuery(internal.payment_intents.internalGetPaymentIntentById, { id: piId1 }) as any
      assert(pi !== null, 'Payment intent should exist')
      assert(pi!.status === 'pending', `Status should be pending, got ${pi!.status}`)

      await ctx.runMutation(internal.payment_intents.internalMarkPaymentProcessing, {
        paymentIntentId: piId1, gatewayTransactionId: `test_gw_${Date.now()}`,
      })

      const piAfterGw = await ctx.runQuery(internal.payment_intents.internalGetPaymentIntentById, { id: piId1 }) as any
      assert(piAfterGw.status === 'processing', `Status should be processing, got ${piAfterGw.status}`)

      const result1 = await ctx.runMutation(internal.payment_intents.internalConfirmPaymentIntent, { paymentIntentId: piId1 }) as any
      assert(result1.status === 'succeeded', `First confirm should succeed, got ${result1.status}`)
      assert(!result1.alreadyConfirmed, 'First confirm should not be alreadyConfirmed')

      const result2 = await ctx.runMutation(internal.payment_intents.internalConfirmPaymentIntent, { paymentIntentId: piId1 }) as any
      assert(result2.status === 'succeeded', `Second confirm should return succeeded, got ${result2.status}`)
      assert(result2.alreadyConfirmed, 'Second confirm should be alreadyConfirmed')

      const piFinal = await ctx.runQuery(internal.payment_intents.internalGetPaymentIntentById, { id: piId1 }) as any
      assert(piFinal.status === 'succeeded', `Final status should be succeeded, got ${piFinal.status}`)

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },
})

export const testEscrows = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error('Unauthenticated')
      const userId = identity.subject

      await ctx.runMutation(internal.wallet.internalCreditWallet, {
        userId, amountCents: 1000,
        referenceType: 'admin' as const, referenceId: `seed_${Date.now()}`, description: 'Seed wallet',
      })

      const before = await ctx.runQuery(api.wallet.getBalance, {}) as any
      const walletUserId = before.userId
      const now = Date.now()

      const activation1Id = await ctx.db.insert('activations', {
        userId: walletUserId, service: 'test', country: 'CM', maxPrice: 1000,
        canGetAnotherSms: false, priceCharged: 300,
        status: 'awaiting_number', createdAt: now, updatedAt: now,
      })

      const escrow1Id = await ctx.runMutation(internal.escrows.internalHoldEscrow, {
        userId: walletUserId, activationId: activation1Id,
        amountCents: 300, description: 'Hold for activation 1',
      }) as string

      const afterHold1 = await ctx.runQuery(api.wallet.getBalance, {}) as any
      assert(afterHold1.balanceCents === before.balanceCents - 300,
        `After hold1: expected ${before.balanceCents - 300}, got ${afterHold1.balanceCents}`)

      const releaseResult = await ctx.runMutation(internal.escrows.internalReleaseEscrow, {
        activationId: activation1Id, providerCostCents: 200,
      }) as any
      assert(releaseResult.status === 'released', `Release should return released`)
      assert(releaseResult.marginCents === 100, `Margin should be 100`)

      try {
        await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: activation1Id })
        assert(false, 'Refund on released escrow should throw')
      } catch (e: any) {
        assert(e.message?.includes('already'), `Should throw already-released error`)
      }

      const activation2Id = await ctx.db.insert('activations', {
        userId: walletUserId, service: 'test', country: 'CM', maxPrice: 1000,
        canGetAnotherSms: false, priceCharged: 200,
        status: 'awaiting_number', createdAt: Date.now(), updatedAt: Date.now(),
      })

      await ctx.runMutation(internal.escrows.internalHoldEscrow, {
        userId: walletUserId, activationId: activation2Id,
        amountCents: 200, description: 'Hold for activation 2',
      })

      const refundResult = await ctx.runMutation(internal.escrows.internalRefundEscrow, { activationId: activation2Id }) as any
      assert(refundResult.status === 'refunded', `Refund should return refunded`)

      try {
        await ctx.runMutation(internal.escrows.internalReleaseEscrow, { activationId: activation2Id })
        assert(false, 'Release on refunded escrow should throw')
      } catch (e: any) {
        assert(e.message?.includes('already'), `Should throw already-refunded error`)
      }

      const walletFinal = await ctx.runQuery(api.wallet.getBalance, {}) as any
      assert(walletFinal.balanceCents === before.balanceCents - 300,
        `Final balance: expected ${before.balanceCents - 300}, got ${walletFinal.balanceCents}`)

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },
})
