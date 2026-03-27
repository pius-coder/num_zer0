'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar'
import { PixelHeading } from '@/components/ui/pixel-heading-word'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Users,
  Wallet,
  ShieldAlert,
  FileText,
  Settings,
  FileSearch,
  CreditCard,
  Shield,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/users', label: 'Utilisateurs', icon: Users },
      { href: '/admin/finance', label: 'Finance', icon: Wallet },
      { href: '/admin/credits', label: 'Credits', icon: CreditCard },
    ],
  },
  {
    label: 'Security',
    items: [
      { href: '/admin/fraud', label: 'Fraud', icon: ShieldAlert },
      { href: '/admin/audit', label: 'Audit', icon: Shield },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/config', label: 'Config', icon: Settings },
      { href: '/admin/logs', label: 'Logs', icon: FileSearch },
    ],
  },
]

export function AdminShell({ locale, children }: { locale: string; children: ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider defaultOpen={true}>
      <div className='flex min-h-svh w-full'>
        <Sidebar collapsible='icon' side='left' className='border-r'>
          <SidebarHeader className='px-3 py-4'>
            <Link href={`/${locale}/admin`} className='flex items-center gap-2 px-1'>
              <PixelHeading
                as='span'
                initialFont='line'
                hoverFont='circle'
                className='text-xl tracking-tight'
                disableCycling
                disableHover
              >
                NumZero
              </PixelHeading>
              <span className='rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary group-data-[collapsible=icon]:hidden'>
                Admin
              </span>
            </Link>
          </SidebarHeader>

          <Separator className='mx-3 w-auto' />

          <SidebarContent className='py-2'>
            {NAV_SECTIONS.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const fullHref = `/${locale}${item.href}`
                      const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                            <Link href={fullHref}>
                              <item.icon className='h-4 w-4' />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className='px-3 py-3'>
            <div className='flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
              <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary'>
                A
              </div>
              <span className='truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden'>
                Admin Panel
              </span>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <div className='flex h-full flex-col'>
            <header className='flex items-center gap-3 border-b bg-background/70 px-4 py-3 backdrop-blur-sm'>
              <SidebarTrigger />
              <Separator orientation='vertical' className='h-4' />
              <div className='min-w-0'>
                <p className='text-sm font-semibold'>Admin</p>
                <p className='text-xs text-muted-foreground'>User &amp; finance management</p>
              </div>
            </header>

            <main className='flex-1 overflow-y-auto px-4 py-6 md:px-6'>{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
