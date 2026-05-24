'use client'

import { Globe, Smartphone, Search, LayoutGrid, List, Sparkles, Zap, ArrowRight, Star, ChevronRight, Home, Wallet, UserCircle, Coins, ChevronDown } from 'lucide-react'

const QUICK_SERVICES = [
  { name: 'WhatsApp', country: 'France' },
  { name: 'Telegram', country: 'UK' },
  { name: 'Google', country: 'US' },
  { name: 'Instagram', country: 'Germany' },
]

const CATEGORIES = ['Messagerie', 'Social', 'Email', 'Finance', 'Crypto', 'AI', 'Dating', 'Gaming', 'Marketplace', 'Transport', 'Food', 'E-commerce']

const NAV_ITEMS = ['Home', 'Wallet']

export function MySpaceSkeleton() {
  return (
    <div className='flex h-dvh flex-col bg-background'>
      <div className='flex h-dvh flex-col bg-background animate-pulse [&_svg]:opacity-40 [&_svg]:text-foreground [&_input]:opacity-40'>
        {/* Desktop Header */}
        <header className='relative isolate overflow-hidden hidden h-32 shrink-0 items-center gap-32 border-b justify-between bg-background mx-auto px-6 md:flex'>
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent-hex)]/30 to-transparent' />
          <div className='shrink-0 text-6xl tracking-tight opacity-70' style={{ fontFamily: 'var(--font-geist-pixel-line)' }}>
            NumZero
          </div>
          <nav className='flex items-center gap-1'>
            {NAV_ITEMS.map((label) => (
              <div key={label} className='inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-60'>
                {label === 'Home' ? <Home className='h-4 w-4' /> : <Wallet className='h-4 w-4' />}
                {label}
              </div>
            ))}
          </nav>
          <div className='ml-auto inline-flex shrink-0 items-center gap-2'>
            <div className='h-8 w-8 rounded-full bg-muted/40'></div>
          </div>
          <div className='inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-2 py-1 text-sm font-semibold text-primary'>
            <Coins className='h-4 w-4' />
            <div className='h-4 w-16 rounded bg-muted/40'></div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className='flex flex-col bg-transparent md:hidden sticky top-0 z-50'>
          <div className='flex h-14 mx-7 mt-6.5 items-center justify-between bg-transparent'>
            <div className='flex items-center gap-2.5'>
              <div className='text-5xl tracking-tight opacity-70' style={{ fontFamily: 'var(--font-geist-pixel-line)' }}>
                NumZero
              </div>
            </div>
            <div className='h-8 w-8 rounded-full bg-muted/40'></div>
            <div className='ml-auto inline-flex flex-col justify-end shrink-0 items-end gap-2 rounded-full px-2 py-1 text-sm font-semibold text-primary'>
              <div className='h-4 w-12 rounded bg-muted/40'></div>
              <p className='text-xs text-end leading-none font-thin font-cursive opacity-50'>buy</p>
            </div>
          </div>
          <div className='bg-background'>
            <div className='px-4 py-2.5'>
              <div className='flex w-full items-center gap-3 px-4 py-3'>
                <span className='text-[14px] font-bold text-foreground opacity-60 tracking-tight uppercase' style={{ fontFamily: 'var(--font-inter)' }}>
                  My Space
                </span>
              </div>
              <div className='relative flex w-full justify-center items-center gap-3 px-4 py-3'>
                <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent' />
                <ChevronDown className='h-4 w-4 text-muted-foreground opacity-60' />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className='flex-1 overflow-y-auto'>
          <div className='pb-20 md:pb-8'>
            <div className='mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8'>
              {/* Mobile Hero */}
              <section className='relative isolate overflow-hidden border border-border bg-card px-5 py-6 lg:hidden'>
                <div className='pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.15] blur-[80px]' />
                <div className='pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-[#7c3aed] opacity-[0.12] blur-[80px]' />
                <div className='pointer-events-none absolute top-1/2 left-1/3 h-44 w-44 -translate-y-1/2 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.08] blur-[60px]' />
                <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent-hex)]/30 to-transparent' />
                <div className='pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-[var(--brand-accent-hex)]/20 via-transparent to-transparent' />
                <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent' />
                <div className='relative z-10'>
                  <h1 className='text-lg font-bold tracking-tight text-foreground opacity-70 md:text-2xl'>My Space</h1>
                  <p className='mt-1.5 text-sm text-muted-foreground opacity-60'>Buy virtual numbers in seconds and verify your accounts with confidence.</p>
                </div>
              </section>

              {/* Desktop Hero */}
              <section className='hidden lg:block mb-8'>
                <div className='relative isolate overflow-hidden border border-border bg-card rounded-2xl px-8 py-8'>
                  <div className='pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.15] blur-[80px]' />
                  <div className='pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-[#7c3aed] opacity-[0.12] blur-[80px]' />
                  <div className='pointer-events-none absolute top-1/2 left-1/3 h-44 w-44 -translate-y-1/2 rounded-full bg-[var(--brand-accent-hex)] opacity-[0.08] blur-[60px]' />
                  <div className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent-hex)]/30 to-transparent' />
                  <div className='pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-[var(--brand-accent-hex)]/20 via-transparent to-transparent' />
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent' />
                  <div className='relative z-10'>
                    <h1 className='text-3xl font-bold tracking-tight text-foreground opacity-70'>My Space</h1>
                    <p className='mt-2 text-muted-foreground opacity-60 max-w-xl'>Buy virtual numbers in seconds and verify your accounts with confidence. Browse 700+ services across 145+ countries.</p>
                  </div>
                </div>
              </section>

              <div className='lg:grid lg:grid-cols-[1fr_320px] lg:gap-6'>
                <section>
                  {/* Tabs */}
                  <div className='sticky top-0 z-40 bg-background/80 backdrop-blur-xl -mx-3 md:-mx-6 px-3 md:px-6 py-2'>
                    <div className='flex gap-1 bg-muted rounded-xl p-1'>
                      <div className='flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-muted-foreground'>
                        <Globe className='size-4' />
                        Services
                      </div>
                      <div className='flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-muted-foreground'>
                        <Smartphone className='size-4' />
                        Mes Numéros
                      </div>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className='mt-4 flex items-center gap-2'>
                    <div className='relative flex-1'>
                      <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                      <input
                        type='text'
                        placeholder='Search services...'
                        readOnly
                        className='h-10 w-full rounded-xl border border-border bg-card/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-0'
                      />
                    </div>
                    <div className='flex h-10 items-center rounded-xl border border-border bg-card/50 p-1'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground'>
                        <List className='h-4 w-4' />
                      </div>
                      <div className='flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground'>
                        <LayoutGrid className='h-4 w-4' />
                      </div>
                    </div>
                  </div>

                  {/* Category pills */}
                  <div className='flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-hide pb-1'>
                    <div className='shrink-0 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground border border-transparent'>
                      All
                    </div>
                    <div className='shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground border border-transparent'>
                      <Sparkles className='h-3.5 w-3.5' />
                      Popular
                    </div>
                    <div className='w-px h-4 bg-border mx-1 shrink-0' />
                    {CATEGORIES.slice(0, 6).map((cat) => (
                      <div key={cat} className='shrink-0 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground border border-transparent'>
                        {cat}
                      </div>
                    ))}
                  </div>

                  {/* Service count */}
                  <p className='mt-3 px-1 text-[12px] font-medium uppercase tracking-wider text-muted-foreground opacity-60'>-- / -- services</p>

                  {/* Service grid */}
                  <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className='flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-5'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30'></div>
                        <div className='text-center space-y-1.5'>
                          <div className='h-2.5 w-14 rounded bg-muted/30 mx-auto'></div>
                          <div className='h-2 w-8 rounded bg-muted/20 mx-auto'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Sidebar */}
                <aside className='hidden lg:block space-y-5'>
                  <div className='rounded-2xl border border-border/50 bg-card p-5'>
                    <div className='flex items-center gap-2 mb-4'>
                      <Zap className='h-4 w-4 text-primary' />
                      <h3 className='text-sm font-semibold text-foreground opacity-70'>Quick Actions</h3>
                    </div>
                    <div className='space-y-1'>
                      {['Recharge Credits', 'View Active Numbers', 'Account Settings'].map((item) => (
                        <div key={item} className='flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground opacity-60'>
                          <span>{item}</span>
                          <ArrowRight className='h-4 w-4 text-muted-foreground' />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className='rounded-2xl border border-border/50 bg-card p-5'>
                    <div className='flex items-center gap-2 mb-4'>
                      <Star className='h-4 w-4 text-yellow-500' />
                      <h3 className='text-sm font-semibold text-foreground opacity-70'>Popular Services</h3>
                    </div>
                    <div className='space-y-1'>
                      {QUICK_SERVICES.map((s) => (
                        <div key={s.name} className='flex w-full items-center justify-between rounded-xl px-3 py-2.5'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-muted/30'></div>
                            <div>
                              <p className='text-sm font-medium text-foreground opacity-60'>{s.name}</p>
                              <p className='text-xs text-muted-foreground opacity-50'>{s.country}</p>
                            </div>
                          </div>
                          <ChevronRight className='h-4 w-4 text-muted-foreground opacity-50' />
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom nav */}
        <nav className='fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur md:hidden'>
          <ul className='flex h-16 items-stretch justify-around pb-[env(safe-area-inset-bottom)]'>
            {[
              { label: 'Home', icon: Home },
              { label: 'Wallet', icon: Wallet },
              { label: 'Account', icon: UserCircle },
            ].map(({ label, icon: Icon }) => (
              <li key={label} className='relative flex-1'>
                <div className='flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground opacity-60'>
                  <Icon className='h-5 w-5' />
                  <span className='leading-none'>{label}</span>
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* iOS loading popup - outside animate-pulse */}
      <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/5 backdrop-blur-[1px]'>
        <div className='flex flex-col items-center gap-4 rounded-md bg-card border border-primary/50 shadow-md shadow-black/8 px-8 py-7'>
          <div className='h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          <p className='text-xs font-medium tracking-wide text-foreground/50'>Chargement...</p>
        </div>
      </div>
    </div>
  )
}
