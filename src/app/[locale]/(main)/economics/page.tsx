import Link from 'next/link'

export default function EconomicsClientPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Economics workspace</h1>
      <p className="text-muted-foreground">
        This area centralizes client economics flows: wallet, purchases, activations, referrals, and promo usage.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li><Link className="underline" href="/api/client/credits/balance">Balance API</Link></li>
        <li><Link className="underline" href="/api/client/credits/packages">Packages API</Link></li>
        <li><Link className="underline" href="/api/client/activations/history">Activation history API</Link></li>
      </ul>
    </main>
  )
}
