export const ROUTE_TITLES: Record<string, string> = {
  'my-space': 'My Space',
  numbers: 'Numbers',
  wallet: 'Wallet',
  account: 'Account',
  recharge: 'Recharge',
  support: 'Support',
  'mock-provider': 'Checkout',
  admin: 'Admin',
}

export const getRouteTitleFromPathname = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  const pageSegment = segments[1] ?? 'my-space'
  return ROUTE_TITLES[pageSegment] ?? 'Profile'
}

