import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/economics/api-auth'
import { CreditLedgerService } from '@/lib/economics/credit-ledger-service'

export async function GET() {
  try {
    const session = await requireSession()
    const balance = await CreditLedgerService.getBalance(session.user.id)
    return NextResponse.json({ balance })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'balance_failed' },
      { status: 401 }
    )
  }
}
