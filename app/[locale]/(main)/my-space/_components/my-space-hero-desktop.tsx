export function MySpaceHeroDesktop() {
  return (
    <section className='hidden lg:block mb-8'>
      <div className='relative isolate overflow-hidden border border-border bg-card rounded-2xl px-8 py-8'>
        <div className='pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.15] blur-[80px]' />
        <div className='pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-[#7c3aed] opacity-[0.12] blur-[80px]' />
        <div className='pointer-events-none absolute top-1/2 left-1/3 h-44 w-44 -translate-y-1/2 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.08] blur-[60px]' />
        <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent-hex)]/30 to-transparent' />
        <div className='pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-[var(--brand-accent-hex)]/20 via-transparent to-transparent' />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent' />
        <div className='relative z-10'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>My Space</h1>
          <p className='mt-2 text-muted-foreground max-w-xl'>
            Buy virtual numbers in seconds and verify your accounts with confidence. Browse 700+
            services across 145+ countries.
          </p>
        </div>
      </div>
    </section>
  )
}
